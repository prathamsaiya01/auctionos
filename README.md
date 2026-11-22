# AUCTIONOS
> **"Every Bid. Every Player. Every Tournament. One Platform."**

A complete, production-ready Sports Player Auction, Multiplayer Bidding & Tournament Management SaaS Platform built for cricket leagues, sports committees, academies, and tournament organisers.

---

## 🌟 Key Features

1. **Central Auction Engine**: Authoritative PostgreSQL transactional engine handling Online, Offline (paddle/barrel), and Hybrid bidding modes with sub-second synchronization.
2. **Real-Time Multiplayer Synchronization**: Socket.io event architecture with room routing (`auction:{id}`, `admins`, `team:{id}`), sequence versioning, and auto-reconnection recovery.
3. **Franchise Purse & Ledger Management**: ACID-compliant immutable financial ledger (`PurseLedger`), automated purse deduction on player SOLD, reserve checks for remaining squad slots, and audited action reversals.
4. **Intelligent Excel & CSV Bulk Import Engine**: Upload hundreds of player records with automatic column header detection, interactive field mapping, row validation, error highlighting, and direct auction pool lot sequencing.
5. **Automated Player Communication System**: Transactional outbox worker triggering automated congratulations messages upon player sale via Meta WhatsApp Business Cloud API, Email, and SMS with real-time delivery logs and retry mechanisms.
6. **Multi-Role Portals & Interfaces**:
   - **Super Admin & Tournament Admin**: Light UI dashboard for tournament configuration, franchise teams, and player verification.
   - **Auctioneer Console**: Dark theme desktop/tablet interface with keyboard shortcuts (`1-4` select teams, `Space` pause/resume, `S` confirm sold, `U` undo, `N` next player).
   - **Team Owner Live Bidding**: Mobile-first dark theme interface with live purse monitor, remaining squad slots counter, and one-tap bid submission.
   - **Public Projector Display (`/display/[id]`)**: Fullscreen 1080p/4K high-contrast broadcast graphics.
   - **OBS Streaming Overlay (`/overlay/[id]`)**: Transparent background lower-third graphic for live broadcasting.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Zustand, TanStack Query, Axios |
| **Backend** | Node.js, Express.js, TypeScript, Socket.io, Zod validation, ExcelJS, Multer |
| **Database** | PostgreSQL 16 (Source of Truth), Prisma ORM |
| **Caching / PubSub** | Redis 7 |
| **Infrastructure** | Docker Compose (PostgreSQL + Redis containers) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ or v20+ (Node v24 supported)
- Docker Desktop (for PostgreSQL & Redis)

### 2. Start PostgreSQL & Redis Containers
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
npm run push --workspace=@auctionos/database
npm run seed --workspace=@auctionos/database
```

### 5. Launch Development Servers
```bash
# Run both API and Web concurrently
npm run dev

# Or run separately:
npm run dev:api    # Runs on http://localhost:4000
npm run dev:web    # Runs on http://localhost:3000
```

---

## 🔑 Default Seed Accounts

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `admin@auctionos.com` | `Password123!` | Global Platform Access |
| **Org Admin** | `orgadmin@apexcricket.com` | `Password123!` | Apex Cricket League |
| **Auctioneer Host** | `auctioneer@mpl.com` | `Password123!` | Mumbai Premier League 2027 |
| **Mumbai Strikers Owner** | `owner.strikers@mpl.com` | `Password123!` | Franchise Owner (Blue) |
| **Royal Blasters Owner** | `owner.blasters@mpl.com` | `Password123!` | Franchise Owner (Red) |
| **Coastal Titans Owner** | `owner.titans@mpl.com` | `Password123!` | Franchise Owner (Green) |
| **Deccan Kings Owner** | `owner.kings@mpl.com` | `Password123!` | Franchise Owner (Purple) |

---

## 🧪 Running Automated Tests

```bash
npx ts-node packages/database/src/testAuctionEngine.ts
```

Runs comprehensive end-to-end tests covering:
- Authentication & password hashing
- Multi-tenant boundary checks
- Franchise initial purse verification
- Online & Host manual paddle bid execution with tiered increments
- Transactional SOLD operation with purse ledger deduction
- Outbox event creation for player notification
- Audited reversal / undo with purse balance restoration
