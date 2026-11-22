import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@auctionos/database';
import { config } from '../../config/env';
import { registerSchema, loginSchema, UserRole } from '@auctionos/shared';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'Email is already registered.' });
        return;
      }

      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || null,
          passwordHash,
          role: data.role as any,
          isVerified: true
        }
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
          orgMemberships: {
            include: { organization: true }
          },
          teamMemberships: {
            include: { team: true }
          }
        }
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const isMatch = await bcrypt.compare(data.password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            organization: user.orgMemberships[0]?.organization || null,
            teams: user.teamMemberships.map((m) => ({
              teamId: m.teamId,
              teamName: m.team.name,
              abbreviation: m.team.abbreviation,
              color: m.team.color,
              role: m.role,
              canBid: m.canBid
            }))
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          orgMemberships: {
            include: { organization: true }
          },
          teamMemberships: {
            include: {
              team: {
                include: {
                  tournament: {
                    select: { id: true, name: true, status: true }
                  }
                }
              }
            }
          }
        }
      });

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}
