# AUCTIONOS — SYSTEM ARCHITECTURE SPECIFICATION

## 1. System Overview

AuctionOS is structured as a unified monorepo powered by npm workspaces:

```text
auctionos/
├── apps/
│   ├── web/                    # Next.js 14 App Router, React 18, Tailwind CSS, Zustand
│   └── api/                    # Express.js, TypeScript, Socket.io, Prisma Client
│
├── packages/
│   ├── shared/                 # Shared types, Enums, Zod schemas, socket constants
│   ├── database/               # Prisma schema, migrations, seed, PostgreSQL client
│   ├── auction-engine/         # Pure bid validation, state machine, increment rules
│   └── notifications/          # WhatsApp Cloud API, Email, SMS outbox dispatchers
│
└── infrastructure/
    └── docker/                 # Docker Compose (PostgreSQL 16 + Redis 7)
```

---

## 2. Real-Time Multiplayer Bidding Flow

```
+-------------------+       +-----------------------+       +-------------------+
| Team Owner Phone  |       |   Auctioneer Tablet   |       | Projector Display |
+---------+---------+       +-----------+-----------+       +---------+---------+
          |                             |                             |
          | 1. Submit Bid               |                             |
          v                             v                             v
+-------------------------------------------------------------------------------+
|                       AUCTIONOS API & SOCKET.IO SERVER                        |
|                                                                               |
|  - Authenticate User & Validate Team Access                                   |
|  - Validate Auction LIVE state & isPaused status                              |
|  - Check Current Lot ACTIVE status                                            |
|  - Validate Bid Increment via @auctionos/auction-engine                       |
|  - Validate Team Remaining Purse & Squad Limits                               |
+---------------------------------------+---------------------------------------+
                                        |
                                        | 2. Atomic Database Transaction
                                        v
+-------------------------------------------------------------------------------+
|                             POSTGRESQL 16                                     |
|                                                                               |
|  - Create Bid row with sequence number                                        |
|  - Update AuctionLot currentBid and winningTeamId                             |
|  - Increment Auction version                                                  |
|  - Insert AuctionEvent log                                                    |
+---------------------------------------+---------------------------------------+
                                        |
                                        | 3. Broadcast Event
                                        v
+-------------------------------------------------------------------------------+
|                     SOCKET.IO BROADCAST (auction:{id})                        |
|                                                                               |
|  - Send latest snapshot to all connected phones, laptops & projectors         |
|  - Real-time UI updates with NO page refresh                                  |
+-------------------------------------------------------------------------------+
```

---

## 3. Financial Ledger & Purse Integrity

All team purse deductions are recorded as immutable `PurseLedger` records:
- `INITIAL`: Opening tournament allocation (e.g. ₹50,000)
- `DEDUCTION`: Negative entry corresponding to a player acquisition upon SOLD
- `REFUND_REVERSAL`: Positive entry generated when an auctioneer reverts an action

Floating-point arithmetic is strictly forbidden; monetary figures use integer or BigInt representation.
