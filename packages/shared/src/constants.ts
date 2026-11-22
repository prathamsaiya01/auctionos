export const SOCKET_EVENTS = {
  // Connection / Lifecycle
  AUCTION_JOIN: 'auction:join',
  AUCTION_JOINED: 'auction:joined',
  AUCTION_LEAVE: 'auction:leave',
  AUCTION_STATE_SNAPSHOT: 'auction:state:snapshot',
  AUCTION_STARTED: 'auction:started',
  AUCTION_PAUSED: 'auction:paused',
  AUCTION_RESUMED: 'auction:resumed',
  AUCTION_COMPLETED: 'auction:completed',

  // Player Lots
  PLAYER_ANNOUNCED: 'player:announced',
  PLAYER_SOLD: 'player:sold',
  PLAYER_UNSOLD: 'player:unsold',

  // Bidding
  BID_SUBMIT: 'bid:submit',
  BID_PLACED: 'bid:placed',
  BID_REJECTED: 'bid:rejected',
  BID_REVERSED: 'bid:reversed',

  // Ledger / Squad
  PURSE_UPDATED: 'purse:updated',
  SQUAD_UPDATED: 'team:squad:updated',

  // Countdown & sync
  COUNTDOWN_UPDATED: 'auction:countdown:updated',
  CONNECTION_STATUS: 'connection:status',

  // Notifications
  NOTIFICATION_SENT: 'notification:sent'
} as const;

export const DEFAULT_BID_TIERS = [
  { minAmount: 500, maxAmount: 2000, increment: 100 },
  { minAmount: 2001, maxAmount: 5000, increment: 250 },
  { minAmount: 5001, maxAmount: 10000, increment: 500 },
  { minAmount: 10001, maxAmount: 50000, increment: 1000 },
  { minAmount: 50001, maxAmount: 10000000, increment: 2500 }
];

export const SOCKET_ROOMS = {
  tournament: (tournamentId: string) => `tournament:${tournamentId}`,
  auction: (auctionId: string) => `auction:${auctionId}`,
  auctionPublic: (auctionId: string) => `auction:${auctionId}:public`,
  auctionAdmins: (auctionId: string) => `auction:${auctionId}:admins`,
  auctionTeam: (auctionId: string, teamId: string) => `auction:${auctionId}:team:${teamId}`
};
