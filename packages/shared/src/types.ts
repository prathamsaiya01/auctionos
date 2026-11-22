import {
  UserRole,
  TournamentStatus,
  AuctionMode,
  AuctionStatus,
  LotStatus,
  BidSource,
  CricketRole,
  BattingStyle,
  BowlingStyle,
  InvitationStatus,
  NotificationChannel,
  NotificationType,
  NotificationStatus
} from './enums';

export interface UserSessionDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  organizationId?: string | null;
  teamMemberships?: Array<{
    teamId: string;
    tournamentId: string;
    role: string;
    isPrimaryOwner: boolean;
  }>;
}

export interface BidHistoryItem {
  id: string;
  bidAmount: number;
  bidSource: BidSource;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  teamColor?: string | null;
  teamLogo?: string | null;
  bidderName?: string | null;
  createdAt: string;
  sequence: number;
}

export interface CurrentPlayerSnapshot {
  lotId: string;
  sequenceOrder: number;
  status: LotStatus;
  basePrice: number;
  currentBid: number;
  highestBidderTeamId?: string | null;
  highestBidderTeamName?: string | null;
  highestBidderTeamLogo?: string | null;
  highestBidderTeamColor?: string | null;
  bidsCount: number;
  player: {
    id: string;
    fullName: string;
    displayName?: string | null;
    photoUrl?: string | null;
    role: CricketRole;
    category?: string | null;
    city?: string | null;
    state?: string | null;
    age?: number | null;
    battingStyle?: BattingStyle | null;
    bowlingStyle?: BowlingStyle | null;
    stats?: {
      matches: number;
      runs: number;
      battingAverage: number;
      strikeRate: number;
      highestScore: number;
      wickets: number;
      bowlingAverage: number;
      economy: number;
      catches: number;
    } | null;
  };
  bidHistory: BidHistoryItem[];
}

export interface TeamPurseSnapshot {
  teamId: string;
  name: string;
  abbreviation: string;
  logoUrl?: string | null;
  color?: string | null;
  initialPurse: number;
  remainingPurse: number;
  spentPurse: number;
  squadCount: number;
  maxSquadLimit: number;
  minSquadLimit: number;
  canBid: boolean;
}

export interface AuctionSnapshot {
  auctionId: string;
  tournamentId: string;
  tournamentName: string;
  name: string;
  mode: AuctionMode;
  status: AuctionStatus;
  currency: string;
  version: number;
  currentLot?: CurrentPlayerSnapshot | null;
  nextLots: Array<{
    lotId: string;
    sequenceOrder: number;
    playerId: string;
    playerName: string;
    playerRole: CricketRole;
    basePrice: number;
    photoUrl?: string | null;
  }>;
  recentSoldLots: Array<{
    lotId: string;
    playerName: string;
    playerPhoto?: string | null;
    playerRole: CricketRole;
    soldPrice: number;
    teamId: string;
    teamName: string;
    teamLogo?: string | null;
    soldAt: string;
  }>;
  teams: TeamPurseSnapshot[];
  countdownRemainingSeconds?: number | null;
  countdownEndsAt?: string | null;
  nextBidAmount: number;
  isPaused: boolean;
  serverTimestamp: string;
}

export interface AuctionRealtimeEvent<T = any> {
  eventId: string;
  auctionId: string;
  sequenceNumber: number;
  auctionVersion: number;
  serverTimestamp: string;
  type: string;
  payload: T;
}
