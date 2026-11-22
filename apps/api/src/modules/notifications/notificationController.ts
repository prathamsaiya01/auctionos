import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { NotificationStatus } from '@auctionos/shared';

export class NotificationController {
  static async getDeliveryReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId, status, channel } = req.query;

      const where: any = {};
      if (tournamentId) where.tournamentId = String(tournamentId);
      if (status) where.status = String(status);
      if (channel) where.channel = String(channel);

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          player: { select: { id: true, fullName: true, photoUrl: true, role: true } },
          deliveries: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      const stats = {
        total: await prisma.notification.count({ where }),
        delivered: await prisma.notification.count({ where: { ...where, status: NotificationStatus.DELIVERED } }),
        failed: await prisma.notification.count({ where: { ...where, status: NotificationStatus.FAILED } }),
        pending: await prisma.notification.count({ where: { ...where, status: NotificationStatus.PENDING } })
      };

      res.json({
        success: true,
        data: {
          stats,
          notifications
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async retry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.findUnique({
        where: { id },
        include: { player: true, tournament: true }
      });

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      // Mark pending to be picked up
      await prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.PENDING,
          retryCount: { increment: 1 }
        }
      });

      res.json({ success: true, message: 'Notification scheduled for retry.' });
    } catch (err) {
      next(err);
    }
  }
}
