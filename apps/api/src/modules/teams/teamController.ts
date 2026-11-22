import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createTeamSchema, inviteTeamOwnerSchema } from '@auctionos/shared';
import crypto from 'crypto';

export class TeamController {
  static async listByTournament(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tournamentId } = req.params;

      const teams = await prisma.team.findMany({
        where: { tournamentId },
        include: {
          memberships: {
            include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
          },
          purchases: {
            include: { player: true }
          },
          _count: { select: { purchases: true, bids: true } }
        },
        orderBy: { name: 'asc' }
      });

      const formatted = teams.map((t) => ({
        ...t,
        initialPurse: Number(t.initialPurse),
        remainingPurse: Number(t.remainingPurse),
        spentPurse: Number(t.initialPurse) - Number(t.remainingPurse),
        purchases: t.purchases.map((p) => ({
          ...p,
          purchasePrice: Number(p.purchasePrice),
          player: {
            ...p.player,
            basePrice: Number(p.player.basePrice)
          }
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

      const team = await prisma.team.findUnique({
        where: { id },
        include: {
          tournament: { select: { id: true, name: true, currency: true, status: true } },
          memberships: {
            include: { user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } } }
          },
          purchases: {
            include: {
              player: {
                include: { stats: true }
              }
            },
            orderBy: { soldAt: 'desc' }
          },
          purseLedgers: {
            orderBy: { createdAt: 'desc' }
          },
          invitations: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!team) {
        res.status(404).json({ success: false, message: 'Team not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          ...team,
          initialPurse: Number(team.initialPurse),
          remainingPurse: Number(team.remainingPurse),
          spentPurse: Number(team.initialPurse) - Number(team.remainingPurse),
          purchases: team.purchases.map((p) => ({
            ...p,
            purchasePrice: Number(p.purchasePrice),
            player: {
              ...p.player,
              basePrice: Number(p.player.basePrice)
            }
          })),
          purseLedgers: team.purseLedgers.map((l) => ({
            ...l,
            amount: Number(l.amount),
            balanceAfter: Number(l.balanceAfter)
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createTeamSchema.parse(req.body);

      const tournament = await prisma.tournament.findUnique({
        where: { id: data.tournamentId },
        include: { settings: true }
      });

      if (!tournament) {
        res.status(404).json({ success: false, message: 'Tournament not found' });
        return;
      }

      const initialPurse = data.initialPurse ? BigInt(data.initialPurse) : (tournament.settings?.initialPurse || BigInt(50000));

      const team = await prisma.team.create({
        data: {
          tournamentId: data.tournamentId,
          name: data.name,
          abbreviation: data.abbreviation.toUpperCase(),
          logoUrl: data.logoUrl || null,
          color: data.color,
          initialPurse,
          remainingPurse: initialPurse,
          purseLedgers: {
            create: {
              entryType: 'INITIAL',
              amount: initialPurse,
              balanceAfter: initialPurse,
              description: 'Initial purse allocation'
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: {
          ...team,
          initialPurse: Number(team.initialPurse),
          remainingPurse: Number(team.remainingPurse)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async inviteOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = inviteTeamOwnerSchema.parse({ ...req.body, teamId: id });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await prisma.ownerInvitation.create({
        data: {
          teamId: id,
          invitedById: req.user!.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          role: data.role,
          token,
          expiresAt
        },
        include: {
          team: {
            select: { name: true, tournament: { select: { name: true } } }
          }
        }
      });

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

      res.status(201).json({
        success: true,
        message: 'Invitation generated successfully',
        data: {
          invitationId: invitation.id,
          token,
          inviteUrl,
          email: invitation.email,
          fullName: invitation.fullName,
          teamName: invitation.team.name,
          tournamentName: invitation.team.tournament.name
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
