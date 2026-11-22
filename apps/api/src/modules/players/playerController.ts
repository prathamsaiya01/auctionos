import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createPlayerSchema } from '@auctionos/shared';

export class PlayerController {
  static async listByTournament(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;
      const { role, category, search, isVerified } = req.query;

      const where: any = { tournamentId };

      if (role) where.role = String(role);
      if (category) where.playerCategory = String(category);
      if (isVerified !== undefined) where.isVerified = isVerified === 'true';
      if (search) {
        where.OR = [
          { fullName: { contains: String(search), mode: 'insensitive' } },
          { city: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      const players = await prisma.player.findMany({
        where,
        include: {
          stats: true,
          purchases: {
            include: { team: { select: { id: true, name: true, abbreviation: true, color: true } } }
          }
        },
        orderBy: { fullName: 'asc' }
      });

      const formatted = players.map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
        purchases: p.purchases.map((pur) => ({
          ...pur,
          purchasePrice: Number(pur.purchasePrice)
        }))
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const player = await prisma.player.findUnique({
        where: { id },
        include: {
          stats: true,
          consents: true,
          purchases: {
            include: { team: true }
          },
          lots: {
            include: {
              auction: { select: { id: true, name: true, status: true } },
              bids: {
                include: { team: { select: { id: true, name: true, abbreviation: true } } },
                orderBy: { sequenceNumber: 'desc' }
              }
            }
          }
        }
      });

      if (!player) {
        res.status(404).json({ success: false, message: 'Player not found.' });
        return;
      }

      res.json({
        success: true,
        data: {
          ...player,
          basePrice: Number(player.basePrice),
          purchases: player.purchases.map((p) => ({
            ...p,
            purchasePrice: Number(p.purchasePrice)
          })),
          lots: player.lots.map((l) => ({
            ...l,
            basePrice: Number(l.basePrice),
            currentBid: Number(l.currentBid),
            bids: l.bids.map((b) => ({
              ...b,
              bidAmount: Number(b.bidAmount)
            }))
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createPlayerSchema.parse(req.body);

      const player = await prisma.player.create({
        data: {
          tournamentId: data.tournamentId,
          fullName: data.fullName,
          displayName: data.displayName || data.fullName.split(' ')[0],
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          age: data.age || null,
          mobileNumber: data.mobileNumber || null,
          whatsappNumber: data.whatsappNumber || data.mobileNumber || null,
          email: data.email || null,
          city: data.city || null,
          state: data.state || null,
          photoUrl: data.photoUrl || null,
          role: data.role as any,
          battingStyle: data.battingStyle as any,
          bowlingStyle: data.bowlingStyle as any,
          playerCategory: data.playerCategory,
          basePrice: BigInt(data.basePrice),
          isVerified: true,
          stats: {
            create: {}
          },
          consents: {
            create: {
              consentWhatsapp: true,
              consentSMS: true,
              consentEmail: true
            }
          }
        },
        include: { stats: true }
      });

      res.status(201).json({
        success: true,
        message: 'Player created successfully',
        data: {
          ...player,
          basePrice: Number(player.basePrice)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async verify(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const player = await prisma.player.update({
        where: { id },
        data: {
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Player verified successfully',
        data: {
          ...player,
          basePrice: Number(player.basePrice)
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
