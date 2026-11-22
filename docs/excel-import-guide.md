# AUCTIONOS — EXCEL / CSV BULK IMPORT USER GUIDE

## 1. Overview

The AuctionOS Excel Import Engine allows tournament administrators to onboard hundreds of cricket players within seconds, automatically mapping column headers, detecting duplicate or invalid contacts, and queuing imported players directly into live auction sequences.

---

## 2. Supported Formats & Templates

Download the pre-formatted Excel templates from the tournament import page or via API:
- **Template A (Basic)**: Columns for `Player Name`, `Mobile Number`, `Email`, `Age`, `City`, `Player Role`, `Base Price`, `Category`.
- **Template B (Complete Cricket)**: Includes detailed stats: `Matches`, `Runs`, `Batting Average`, `Strike Rate`, `Wickets`, `Bowling Economy`, `Photo URL`.

---

## 3. Intelligent Column Matching

The mapping engine automatically detects typical spreadsheet column names:
- Names: `Name`, `Player Name`, `Full Name` -> mapped to `fullName`
- Phone: `Mobile`, `Phone`, `Contact`, `WhatsApp` -> mapped to `mobileNumber`
- Role: `Role`, `Playing Role`, `Player Type` -> mapped to `role` (parsed to Batsman, Bowler, All-Rounder, Wicket-Keeper)
- Price: `Base Price`, `Base Amount`, `Price` -> mapped to `basePrice`

---

## 4. Direct Auction Queuing

When confirming the import, select a target auction from the dropdown to automatically generate sequential lot numbers (`Lot #1`, `Lot #2`, etc.) in `QUEUED` state, ready for the auctioneer to announce on the live stage!
