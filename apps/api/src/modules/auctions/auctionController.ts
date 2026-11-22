import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest, verifyTeamAccess } from '../../middleware/auth';
import { AuctionService } from './auctionService';
import { createAuctionSchema, placeBidSchema, BidSource, UserRole } from '@auctionos/shared';

export class AuctionController {
  static async getSnapshot(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const snapshot = await AuctionService.getSnapshot(id);

      if (!snapshot) {
        res.status(404).json({ success: false, message: 'Auction not found' });
        return;
      }

      res.json({ success: true, data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createAuctionSchema.parse(req.body);

      const auction = await prisma.auction.create({
        data: {
          tournamentId: data.tournamentId,
          name: data.name,
          mode: data.mode as any,
          countdownSeconds: data.countdownSeconds,
          bidExtensionSeconds: data.bidExtensionSeconds,
          extensionThresholdSeconds: data.extensionThresholdSeconds,
          currency: data.currency,
          rules: {
            create: {
              incrementType: 'PRICE_TIER'
            }
          }
        }
      });

      res.status(201).json({ success: true, data: auction });
    } catch (err) {
      next(err);
    }
  }

  static async start(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const snapshot = await AuctionService.startAuction(id);
      res.json({ success: true, message: 'Auction started!', data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  static async pause(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const snapshot = await AuctionService.togglePause(id, true);
      res.json({ success: true, message: 'Auction paused', data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  static async resume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const snapshot = await AuctionService.togglePause(id, false);
      res.json({ success: true, message: 'Auction resumed', data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  static async nextPlayer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { specificLotId } = req.body;
      const snapshot = await AuctionService.nextPlayer(id, specificLotId);
      res.json({ success: true, message: 'Player announced', data: snapshot });
    } catch (err) {
      next(err);
    }
  }

  static async placeBid(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = placeBidSchema.parse({ ...req.body, auctionId: id });

      // Verify that if online owner, they have permission to bid for this team
      if (data.bidSource === BidSource.ONLINE_OWNER) {
        const hasAccess = await verifyTeamAccess(req.user!.id, data.teamId, req.user!.role);
        if (!hasAccess) {
          res.status(403).json({
            success: false,
            message: 'You are not authorized to place bids on behalf of this team.'
          });
          return;
        }
      }

      const bid = await AuctionService.placeBid({
        auctionId: id,
        lotId: data.lotId,
        teamId: data.teamId,
        bidAmount: data.bidAmount,
        bidSource: data.bidSource,
        userId: req.user!.id
      });

      res.status(201).json({
        success: true,
        message: 'Bid placed successfully!',
        data: {
          id: bid.id,
          bidAmount: Number(bid.bidAmount),
          teamName: bid.team.name
        }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async markSold(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { lotId, teamId, finalPrice } = req.body;

      const purchase = await AuctionService.markSold(id, lotId, teamId, finalPrice);
      res.json({
        success: true,
        message: 'Player successfully marked SOLD!',
        data: {
          purchaseId: purchase.id,
          purchasePrice: Number(purchase.purchasePrice)
        }
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async markUnsold(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { lotId } = req.body;

      await AuctionService.markUnsold(id, lotId);
      res.json({ success: true, message: 'Player marked UNSOLD.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  static async reverseAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { lotId, reason } = req.body;

      await AuctionService.reverseAction(id, lotId, reason || 'Auctioneer manual correction', req.user!.id);
      res.json({ success: true, message: 'Action successfully reversed and audited.' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
