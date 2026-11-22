import { Response, NextFunction } from 'express';
import { prisma } from '@auctionos/database';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createOrganizationSchema } from '@auctionos/shared';

export class OrganizationController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgs = await prisma.organization.findMany({
        include: {
          subscription: true,
          _count: { select: { tournaments: true, memberships: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: orgs });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createOrganizationSchema.parse(req.body);
      const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const org = await prisma.organization.create({
        data: {
          name: data.name,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || '#2563EB',
          isVerified: true,
          memberships: {
            create: {
              userId: req.user!.id,
              role: 'OWNER'
            }
          },
          subscription: {
            create: {
              plan: 'PROFESSIONAL',
              status: 'ACTIVE'
            }
          }
        },
        include: { subscription: true }
      });

      res.status(201).json({ success: true, message: 'Organization created successfully', data: org });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const org = await prisma.organization.findUnique({
        where: { id },
        include: {
          tournaments: {
            include: {
              _count: { select: { teams: true, players: true, auctions: true } }
            }
          },
          memberships: {
            include: { user: { select: { id: true, fullName: true, email: true, role: true } } }
          },
          subscription: true
        }
      });

      if (!org) {
        res.status(404).json({ success: false, message: 'Organization not found' });
        return;
      }

      res.json({ success: true, data: org });
    } catch (err) {
      next(err);
    }
  }
}
