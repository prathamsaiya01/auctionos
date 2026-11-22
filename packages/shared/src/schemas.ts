import { z } from 'zod';
import {
  UserRole,
  TournamentStatus,
  AuctionMode,
  AuctionStatus,
  CricketRole,
  BattingStyle,
  BowlingStyle,
  BidSource
} from './enums';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number in E.164 format').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.TOURNAMENT_ADMIN)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name required'),
  slug: z.string().min(2).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional()
});

export const createTournamentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  description: z.string().optional(),
  sport: z.string().default('Cricket'),
  season: z.string().default('2027'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  currency: z.string().default('INR'),
  initialPurse: z.number().positive().default(50000),
  minSquadSize: z.number().int().min(1).default(11),
  maxSquadSize: z.number().int().min(1).default(15)
});

export const createTeamSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().min(2, 'Team name required'),
  abbreviation: z.string().min(2).max(5, '2 to 5 characters for abbreviation'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  color: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Invalid hex color').default('#2563EB'),
  initialPurse: z.number().positive().optional()
});

export const inviteTeamOwnerSchema = z.object({
  teamId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['PRIMARY_OWNER', 'CO_OWNER', 'MANAGER']).default('PRIMARY_OWNER')
});

export const createPlayerSchema = z.object({
  tournamentId: z.string().uuid(),
  fullName: z.string().min(2),
  displayName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.number().int().min(10).max(80).optional(),
  mobileNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  role: z.nativeEnum(CricketRole).default(CricketRole.ALL_ROUNDER),
  battingStyle: z.nativeEnum(BattingStyle).optional(),
  bowlingStyle: z.nativeEnum(BowlingStyle).optional(),
  playerCategory: z.string().default('Regular'),
  basePrice: z.number().int().nonnegative().default(1000)
});

export const placeBidSchema = z.object({
  auctionId: z.string().uuid(),
  lotId: z.string().uuid(),
  teamId: z.string().uuid(),
  bidAmount: z.number().int().positive(),
  bidSource: z.nativeEnum(BidSource).default(BidSource.ONLINE_OWNER),
  idempotencyKey: z.string().optional()
});

export const createAuctionSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z.string().min(3),
  mode: z.nativeEnum(AuctionMode).default(AuctionMode.HYBRID),
  countdownSeconds: z.number().int().min(5).max(120).default(30),
  bidExtensionSeconds: z.number().int().min(0).max(30).default(10),
  extensionThresholdSeconds: z.number().int().min(1).max(20).default(5),
  currency: z.string().default('INR')
});
