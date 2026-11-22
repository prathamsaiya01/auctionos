import { NotificationChannel, NotificationType } from '@auctionos/shared';

export interface SendNotificationPayload {
  channel: NotificationChannel;
  type: NotificationType;
  recipient: string; // Phone number in E.164 or Email
  subject?: string;
  templateData: {
    playerName: string;
    tournamentName: string;
    teamName?: string;
    price?: number;
    currency?: string;
    organizerName?: string;
    customMessage?: string;
  };
}

export interface NotificationResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  rawResponse?: any;
}

export function formatPlayerSoldMessage(data: SendNotificationPayload['templateData']): string {
  const currency = data.currency || '₹';
  const priceFormatted = data.price ? `${currency}${data.price.toLocaleString()}` : 'Disclosed';
  const org = data.organizerName || `${data.tournamentName} Organising Committee`;

  return [
    `🎉 Congratulations, ${data.playerName}!`,
    ``,
    `You have been successfully selected in the player auction!`,
    ``,
    `🏆 Tournament: ${data.tournamentName}`,
    `🏏 Team: ${data.teamName || 'Your Selected Franchise'}`,
    `💰 Auction Price: ${priceFormatted}`,
    ``,
    `Your new team is excited to have you!`,
    `Get ready to represent ${data.teamName || 'your team'}.`,
    ``,
    `Best wishes,`,
    `${org}`
  ].join('\n');
}

export class NotificationDispatcher {
  static async send(payload: SendNotificationPayload): Promise<NotificationResult> {
    const message = payload.type === NotificationType.PLAYER_SOLD
      ? formatPlayerSoldMessage(payload.templateData)
      : payload.templateData.customMessage || `Update regarding ${payload.templateData.tournamentName}`;

    // 1. WhatsApp Cloud API Dispatcher
    if (payload.channel === NotificationChannel.WHATSAPP) {
      const token = process.env.WHATSAPP_API_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!token || token.startsWith('mock')) {
        console.log(`[MOCK WHATSAPP DISPATCH] To: ${payload.recipient}\n${message}`);
        return {
          success: true,
          provider: 'MOCK_WHATSAPP',
          messageId: `mock_wa_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          rawResponse: { status: 'mock_sent', timestamp: new Date().toISOString() }
        };
      }

      try {
        // Meta Graph API WhatsApp call
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: payload.recipient.replace(/\+/g, ''),
            type: 'text',
            text: { preview_url: false, body: message }
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData?.error?.message || 'Failed to dispatch WhatsApp message');
        }

        return {
          success: true,
          provider: 'META_WHATSAPP_CLOUD',
          messageId: resData?.messages?.[0]?.id,
          rawResponse: resData
        };
      } catch (err: any) {
        console.error('WhatsApp dispatch error:', err.message);
        return {
          success: false,
          provider: 'META_WHATSAPP_CLOUD',
          error: err.message
        };
      }
    }

    // 2. Email Dispatcher
    if (payload.channel === NotificationChannel.EMAIL) {
      console.log(`[MOCK EMAIL DISPATCH] To: ${payload.recipient} | Subject: ${payload.subject || 'AuctionOS Notification'}\n${message}`);
      return {
        success: true,
        provider: 'MOCK_EMAIL',
        messageId: `mock_email_${Date.now()}`
      };
    }

    // 3. SMS Dispatcher
    if (payload.channel === NotificationChannel.SMS) {
      console.log(`[MOCK SMS DISPATCH] To: ${payload.recipient}\n${message}`);
      return {
        success: true,
        provider: 'MOCK_SMS',
        messageId: `mock_sms_${Date.now()}`
      };
    }

    // 4. In-App
    return {
      success: true,
      provider: 'IN_APP',
      messageId: `in_app_${Date.now()}`
    };
  }
}
