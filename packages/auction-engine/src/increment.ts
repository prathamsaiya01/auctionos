import { DEFAULT_BID_TIERS } from '@auctionos/shared';

export interface BidTierRule {
  minAmount: number;
  maxAmount: number;
  increment: number;
}

export function calculateNextBid(
  currentBid: number,
  basePrice: number,
  customTiers?: BidTierRule[]
): { nextBid: number; increment: number } {
  // If no bids placed yet, next bid is the base price!
  if (currentBid <= 0) {
    return {
      nextBid: basePrice,
      increment: 0
    };
  }

  const tiers = customTiers && customTiers.length > 0 ? customTiers : DEFAULT_BID_TIERS;

  // Find appropriate tier for currentBid
  const matchedTier = tiers.find(
    (t) => currentBid >= t.minAmount && currentBid <= t.maxAmount
  );

  const increment = matchedTier
    ? matchedTier.increment
    : tiers[tiers.length - 1].increment;

  return {
    nextBid: currentBid + increment,
    increment
  };
}
