import { prisma } from '@auctionos/database';
import { NotificationDispatcher } from '@auctionos/notifications';
import { NotificationChannel, NotificationType, NotificationStatus } from '@auctionos/shared';

let isRunning = false;

export async function processOutboxEvents() {
  if (isRunning) return;
  isRunning = true;

  try {
    const pendingEvents = await prisma.outboxEvent.findMany({
      where: { isProcessed: false },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    for (const event of pendingEvents) {
      if (event.eventType === 'PLAYER_SOLD') {
        const payload = event.payload as {
          playerId: string;
          playerName: string;
          teamId: string;
          teamName: string;
          purchasePrice: number;
          auctionId: string;
        };

        const player = await prisma.player.findUnique({
          where: { id: payload.playerId },
          include: {
            tournament: { select: { id: true, name: true, currency: true } },
            consents: true
          }
        });

        if (player) {
          const recipientPhone = player.whatsappNumber || player.mobileNumber;
          const recipientEmail = player.email;

          // 1. WhatsApp Notification
          if (recipientPhone && player.consents?.consentWhatsapp) {
            const dispatchResult = await NotificationDispatcher.send({
              channel: NotificationChannel.WHATSAPP,
              type: NotificationType.PLAYER_SOLD,
              recipient: recipientPhone,
              templateData: {
                playerName: player.fullName,
                tournamentName: player.tournament.name,
                teamName: payload.teamName,
                price: payload.purchasePrice,
                currency: player.tournament.currency
              }
            });

            await prisma.notification.create({
              data: {
                tournamentId: player.tournamentId,
                playerId: player.id,
                channel: NotificationChannel.WHATSAPP,
                type: NotificationType.PLAYER_SOLD,
                recipient: recipientPhone,
                message: `Congratulations! Sold to ${payload.teamName} for ${payload.purchasePrice}`,
                status: dispatchResult.success ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
                providerResponse: dispatchResult.rawResponse || null,
                errorMessage: dispatchResult.error || null,
                sentAt: new Date(),
                deliveredAt: dispatchResult.success ? new Date() : null,
                deliveries: {
                  create: {
                    channel: NotificationChannel.WHATSAPP,
                    providerName: dispatchResult.provider,
                    status: dispatchResult.success ? 'DELIVERED' : 'FAILED',
                    responsePayload: dispatchResult.rawResponse || null
                  }
                }
              }
            });
          }

          // 2. Email Notification
          if (recipientEmail && player.consents?.consentEmail) {
            const emailResult = await NotificationDispatcher.send({
              channel: NotificationChannel.EMAIL,
              type: NotificationType.PLAYER_SOLD,
              recipient: recipientEmail,
              subject: `🎉 Congratulations! Selected for ${payload.teamName} - ${player.tournament.name}`,
              templateData: {
                playerName: player.fullName,
                tournamentName: player.tournament.name,
                teamName: payload.teamName,
                price: payload.purchasePrice,
                currency: player.tournament.currency
              }
            });

            await prisma.notification.create({
              data: {
                tournamentId: player.tournamentId,
                playerId: player.id,
                channel: NotificationChannel.EMAIL,
                type: NotificationType.PLAYER_SOLD,
                recipient: recipientEmail,
                subject: `Auction Result: Selected for ${payload.teamName}`,
                message: `Congratulations! Selected for ${payload.teamName}`,
                status: emailResult.success ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
                sentAt: new Date(),
                deliveredAt: emailResult.success ? new Date() : null
              }
            });
          }
        }
      }

      // Mark outbox event processed
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          isProcessed: true,
          processedAt: new Date()
        }
      });
    }
  } catch (err) {
    console.error('[Outbox Worker Error]:', err);
  } finally {
    isRunning = false;
  }
}

export function startOutboxWorker(intervalMs = 3000) {
  console.log('[Worker] Outbox notification worker started.');
  setInterval(processOutboxEvents, intervalMs);
}
