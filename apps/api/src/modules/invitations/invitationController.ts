import { Request, Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { InvitationStatus } from '@auctionos/shared';

export class InvitationController {
  static async getByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      const invitation = await prisma.ownerInvitation.findUnique({
        where: { token },
        include: {
          team: {
            include: {
              tournament: {
                select: { id: true, name: true, season: true, sport: true, logoUrl: true }
              }
            }
          },
          invitedBy: {
            select: { fullName: true, email: true }
          }
        }
      });

      if (!invitation) {
        res.status(404).json({ success: false, message: 'Invitation not found or invalid link.' });
        return;
      }

      const isExpired = new Date() > invitation.expiresAt;
      if (isExpired && invitation.status === InvitationStatus.PENDING) {
        await prisma.ownerInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED }
        });
        invitation.status = InvitationStatus.EXPIRED;
      }

      res.json({
        success: true,
        data: {
          id: invitation.id,
          token: invitation.token,
          email: invitation.email,
          fullName: invitation.fullName,
          status: invitation.status,
          role: invitation.role,
          team: {
            id: invitation.team.id,
            name: invitation.team.name,
            abbreviation: invitation.team.abbreviation,
            logoUrl: invitation.team.logoUrl,
            color: invitation.team.color
          },
          tournament: invitation.team.tournament,
          invitedBy: invitation.invitedBy
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async accept(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user!.id;

      const invitation = await prisma.ownerInvitation.findUnique({
        where: { token },
        include: { team: true }
      });

      if (!invitation) {
        res.status(404).json({ success: false, message: 'Invitation not found.' });
        return;
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        res.status(400).json({ success: false, message: `Invitation is already ${invitation.status}.` });
        return;
      }

      if (new Date() > invitation.expiresAt) {
        res.status(400).json({ success: false, message: 'Invitation has expired.' });
        return;
      }

      // Transactionally add user to team memberships and mark invitation accepted
      await prisma.$transaction([
        prisma.teamMembership.upsert({
          where: {
            teamId_userId: {
              teamId: invitation.teamId,
              userId
            }
          },
          update: {
            role: invitation.role,
            canBid: true,
            canManageSquad: true
          },
          create: {
            teamId: invitation.teamId,
            userId,
            role: invitation.role,
            canBid: true,
            canManageSquad: true,
            canInvite: true
          }
        }),
        prisma.ownerInvitation.update({
          where: { id: invitation.id },
          data: {
            status: InvitationStatus.ACCEPTED,
            acceptedAt: new Date()
          }
        })
      ]);

      res.json({
        success: true,
        message: `Successfully accepted invitation! You are now an authorized ${invitation.role} of ${invitation.team.name}.`,
        data: {
          teamId: invitation.teamId,
          teamName: invitation.team.name
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
