# AUCTIONOS — AUTOMATED NOTIFICATIONS & WHATSAPP GUIDE

## 1. Architecture Overview

Whenever an auctioneer confirms a player as **SOLD**, the following transactional event flow executes:

1. **Transactional Outbox**: An `OutboxEvent` record is inserted inside the same PostgreSQL transaction that marks the lot as `SOLD` and deducts the franchise purse.
2. **Background Outbox Worker**: The background worker polls for pending outbox events every 3 seconds.
3. **Template Formatting**: Generates personalized congratulatory messages:
   ```text
   🎉 Congratulations, Rahul!

   You have been successfully selected in the player auction!

   🏆 Tournament: Mumbai Premier League 2027
   🏏 Team: Royal Strikers
   💰 Auction Price: ₹5,000

   Your new team is excited to have you!
   Get ready to represent Royal Strikers.

   Best wishes,
   Mumbai Premier League Organising Committee
   ```
4. **Multi-Channel Dispatcher**:
   - Meta WhatsApp Business Cloud API (`/messages` endpoint)
   - Email Gateway (Resend / Brevo)
   - SMS Gateway (Twilio / MSG91)
5. **Audit & Delivery Logging**: Every dispatch logs provider message ID, delivery status, and timestamps in the `Notification` and `NotificationDelivery` tables.
