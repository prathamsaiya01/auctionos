import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createTournamentSchema } from '@auctionos/shared';

export class TournamentController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.query;

      const tournaments = await prisma.tournament.findMany({
        where: organizationId ? { organizationId: String(organizationId) } : {},
        include: {
          organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
          _count: {
            select: { teams: true, players: true, auctions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: tournaments });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          organization: true,
          settings: true,
          teams: {
            include: {
              memberships: {
                include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
              },
              _count: { select: { purchases: true } }
            }
          },
          auctions: true,
          _count: {
            select: { players: true, teams: true }
          }
        }
      });

      if (!tournament) {
        res.status(404).json({ success: false, message: 'Tournament not found.' });
        return;
      }

      // Format BigInt fields for JSON serialization
      const formattedTeams = tournament.teams.map((t) => ({
        ...t,
        initialPurse: Number(t.initialPurse),
        remainingPurse: Number(t.remainingPurse)
      }));

      const formattedSettings = tournament.settings ? {
        ...tournament.settings,
        initialPurse: Number(tournament.settings.initialPurse)
      } : null;

      res.json({
        success: true,
        data: {
          ...tournament,
          teams: formattedTeams,
          settings: formattedSettings
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createTournamentSchema.parse(req.body);
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const tournament = await prisma.tournament.create({
        data: {
          organizationId: data.organizationId,
          createdById: req.user!.id,
          name: data.name,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          description: data.description,
          sport: data.sport,
          season: data.season,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          location: data.location,
          currency: data.currency,
          settings: {
            create: {
              initialPurse: BigInt(data.initialPurse),
              minSquadLimit: data.minSquadSize,
              maxSquadLimit: data.maxSquadSize
            }
          }
        },
        include: { settings: true }
      });

      res.status(201).json({
        success: true,
        message: 'Tournament created successfully',
        data: {
          ...tournament,
          settings: {
            ...tournament.settings,
            initialPurse: Number(tournament.settings?.initialPurse)
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
