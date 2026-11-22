# AUCTIONOS — REST API DOCUMENTATION

Base Path: `/api/v1`

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user account |
| `POST` | `/auth/login` | Authenticate and obtain JWT token |
| `GET` | `/auth/me` | Fetch authenticated user profile & memberships |

---

## 2. Tournaments (`/tournaments`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tournaments` | List all tournaments (filterable by organization) |
| `POST` | `/tournaments` | Create a new tournament with purse settings |
| `GET` | `/tournaments/:id` | Fetch tournament overview with teams and auctions |

---

## 3. Franchise Teams (`/teams`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/teams/tournament/:tournamentId` | List teams in a tournament |
| `POST` | `/teams` | Register a new franchise team |
| `GET` | `/teams/:id` | Fetch team squad and purse ledger |
| `POST` | `/teams/:id/invite` | Generate secure invitation link for team owner |

---

## 4. Player Management (`/players`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/players/tournament/:tournamentId` | List players with role, category, and search filters |
| `POST` | `/players` | Register individual player |
| `GET` | `/players/:id` | Fetch full player stats and auction history |
| `PATCH` | `/players/:id/verify` | Verify player profile |

---

## 5. Excel Import Engine (`/imports`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/imports/upload` | Upload `.xlsx` or `.csv` file and detect column mappings |
| `POST` | `/imports/validate-mapping` | Preview rows with selected column mapping |
| `POST` | `/imports/confirm` | Batch import players and optionally add to auction pool |
| `GET` | `/imports/templates/:type` | Download Excel template (`basic` or `complete`) |

---

## 6. Live Auction Engine (`/auctions`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auctions/:id/snapshot` | Fetch real-time authoritative auction snapshot |
| `POST` | `/auctions` | Create auction configuration |
| `POST` | `/auctions/:id/start` | Start live auction |
| `POST` | `/auctions/:id/pause` | Pause live auction |
| `POST` | `/auctions/:id/resume` | Resume live auction |
| `POST` | `/auctions/:id/next-player` | Announce next player lot |
| `POST` | `/auctions/:id/bids` | Place bid (online owner or host manual paddle) |
| `POST` | `/auctions/:id/sold` | Mark lot as SOLD, create purchase, deduct purse |
| `POST` | `/auctions/:id/unsold` | Mark lot as UNSOLD |
| `POST` | `/auctions/:id/reverse-action` | Safely undo last bid or purchase with audit log |

---

## 7. Notifications & Outbox (`/notifications`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications/delivery-report` | View real-time message delivery log |
| `POST` | `/notifications/:id/retry` | Re-queue failed message for dispatch |
