import {
  AuctionStatus,
  LotStatus,
  AuctionMode
} from '@auctionos/shared';
import { calculateNextBid, BidTierRule } from './increment';

export interface BidValidationContext {
  auctionStatus: AuctionStatus;
  isPaused: boolean;
  lotStatus: LotStatus;
  currentBid: number;
  basePrice: number;
  bidAmount: number;
  highestBidderTeamId?: string | null;
  teamId: string;
  teamRemainingPurse: number;
  teamSquadCount: number;
  maxSquadLimit: number;
  minSquadLimit: number;
  customTiers?: BidTierRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export function validateBid(ctx: BidValidationContext): ValidationResult {
  if (ctx.auctionStatus !== AuctionStatus.LIVE) {
    return {
      isValid: false,
      errorCode: 'AUCTION_NOT_LIVE',
      errorMessage: `Auction is currently ${ctx.auctionStatus}. Bidding is not allowed.`
    };
  }

  if (ctx.isPaused) {
    return {
      isValid: false,
      errorCode: 'AUCTION_PAUSED',
      errorMessage: 'The auctioneer has paused the auction. Please wait for resumption.'
    };
  }

  if (ctx.lotStatus !== LotStatus.ACTIVE) {
    return {
      isValid: false,
      errorCode: 'LOT_NOT_ACTIVE',
      errorMessage: `Current player lot is ${ctx.lotStatus}, not active for bidding.`
    };
  }

  // Disallow outbidding oneself
  if (ctx.highestBidderTeamId && ctx.highestBidderTeamId === ctx.teamId) {
    return {
      isValid: false,
      errorCode: 'ALREADY_HIGHEST_BIDDER',
      errorMessage: 'Your team already holds the highest bid.'
    };
  }

  // Check squad limits
  if (ctx.teamSquadCount >= ctx.maxSquadLimit) {
    return {
      isValid: false,
      errorCode: 'MAX_SQUAD_REACHED',
      errorMessage: `Your squad is full (${ctx.teamSquadCount}/${ctx.maxSquadLimit} players).`
    };
  }

  // Validate exact bid amount
  const { nextBid } = calculateNextBid(ctx.currentBid, ctx.basePrice, ctx.customTiers);
  if (ctx.bidAmount < nextBid) {
    return {
      isValid: false,
      errorCode: 'BID_TOO_LOW',
      errorMessage: `Bid amount must be at least ₹${nextBid.toLocaleString()} (current minimum).`
    };
  }

  // Validate purse
  if (ctx.bidAmount > ctx.teamRemainingPurse) {
    return {
      isValid: false,
      errorCode: 'INSUFFICIENT_PURSE',
      errorMessage: `Insufficient team purse. Available: ₹${ctx.teamRemainingPurse.toLocaleString()}, Required: ₹${ctx.bidAmount.toLocaleString()}`
    };
  }

  // Reserve check: Can the team afford to fill minimum squad with base prices?
  const slotsNeeded = Math.max(0, ctx.minSquadLimit - (ctx.teamSquadCount + 1));
  const estimatedReserveNeeded = slotsNeeded * 1000; // minimum ₹1000 per future player
  if (ctx.teamRemainingPurse - ctx.bidAmount < estimatedReserveNeeded) {
    // If not strictly enforced, we can warn or block:
    // Block if cannot even fill minimum squad:
    if (slotsNeeded > 0 && ctx.teamRemainingPurse - ctx.bidAmount < slotsNeeded * 500) {
      return {
        isValid: false,
        errorCode: 'RESERVE_PURSE_EXCEEDED',
        errorMessage: `Cannot place bid. You must reserve enough purse to fill the remaining ${slotsNeeded} mandatory squad slots.`
      };
    }
  }

  return { isValid: true };
}
