import { Request, Response, NextFunction } from 'express';
import { AuctionService } from '../auctions/auctionService';
import { prisma } from '@auctionos/database';

export class PublicController {
  static async getAuctionSnapshot(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  static async getTournamentTeams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      const teams = await prisma.team.findMany({
        where: { tournamentId },
        select: {
          id: true,
          name: true,
          abbreviation: true,
          logoUrl: true,
          color: true,
          initialPurse: true,
          remainingPurse: true,
          purchases: {
            select: {
              id: true,
              purchasePrice: true,
              soldAt: true,
              player: {
                select: {
                  id: true,
                  fullName: true,
                  role: true,
                  photoUrl: true
                }
              }
            }
          }
        }
      });

      const formatted = teams.map((t) => ({
        ...t,
        initialPurse: Number(t.initialPurse),
        remainingPurse: Number(t.remainingPurse),
        spentPurse: Number(t.initialPurse) - Number(t.remainingPurse),
        purchases: t.purchases.map((p) => ({
          ...p,
          purchasePrice: Number(p.purchasePrice)
        }))
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }
}
