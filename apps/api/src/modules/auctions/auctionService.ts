import { prisma } from '@auctionos/database';
import {
  AuctionStatus,
  LotStatus,
  BidSource,
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  AuctionSnapshot,
  UserRole
} from '@auctionos/shared';
import { validateBid, calculateNextBid } from '@auctionos/auction-engine';
import { getIO } from '../../sockets/socketServer';

interface AuctionTimerState {
  auctionId: string;
  durationSeconds: number;
  deadlineMs: number;
  remainingMs: number;
  isPaused: boolean;
  activeLotId: string | null;
}

const auctionTimers = new Map<string, AuctionTimerState>();

export class AuctionService {
  /**
   * Authoritative timer state helpers
   */
  static getOrCreateTimer(auctionId: string, activeLotId?: string | null, countdownSecondsConfig?: number): AuctionTimerState {
    let timer = auctionTimers.get(auctionId);
    const duration = countdownSecondsConfig && countdownSecondsConfig > 0 ? countdownSecondsConfig : 15;

    if (!timer) {
      timer = {
        auctionId,
        durationSeconds: duration,
        deadlineMs: Date.now() + duration * 1000,
        remainingMs: duration * 1000,
        isPaused: false,
        activeLotId: activeLotId || null,
      };
      auctionTimers.set(auctionId, timer);
    } else if (activeLotId && timer.activeLotId !== activeLotId) {
      timer.activeLotId = activeLotId;
      timer.durationSeconds = duration;
      timer.deadlineMs = Date.now() + duration * 1000;
      timer.remainingMs = duration * 1000;
      timer.isPaused = false;
    }
    return timer;
  }

  static resetTimer(auctionId: string, activeLotId?: string | null, durationSeconds = 15): AuctionTimerState {
    const timer: AuctionTimerState = {
      auctionId,
      durationSeconds,
      deadlineMs: Date.now() + durationSeconds * 1000,
      remainingMs: durationSeconds * 1000,
      isPaused: false,
      activeLotId: activeLotId || null,
    };
    auctionTimers.set(auctionId, timer);
    return timer;
  }

  static pauseTimer(auctionId: string) {
    const timer = auctionTimers.get(auctionId);
    if (timer) {
      timer.isPaused = true;
      timer.remainingMs = Math.max(0, timer.deadlineMs - Date.now());
    }
  }

  static resumeTimer(auctionId: string) {
    const timer = auctionTimers.get(auctionId);
    if (timer) {
      timer.isPaused = false;
      timer.deadlineMs = Date.now() + timer.remainingMs;
    }
  }

  static stopTimer(auctionId: string) {
    const timer = auctionTimers.get(auctionId);
    if (timer) {
      timer.deadlineMs = 0;
      timer.remainingMs = 0;
    }
  }

  /**
   * Builds an authoritative, real-time snapshot of the auction
   */
  static async getSnapshot(auctionId: string): Promise<AuctionSnapshot | null> {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        tournament: {
          select: { id: true, name: true, currency: true }
        },
        rules: true,
        lots: {
          include: {
            player: {
              include: { stats: true }
            },
            bids: {
              where: { isReversed: false },
              include: {
                team: { select: { id: true, name: true, abbreviation: true, color: true, logoUrl: true } },
                user: { select: { fullName: true } }
              },
              orderBy: { sequenceNumber: 'desc' }
            }
          },
          orderBy: { sequenceOrder: 'asc' }
        }
      }
    });

    if (!auction) return null;

    // Fetch tournament teams with current purse and squad counts
    const teams = await prisma.team.findMany({
      where: { tournamentId: auction.tournamentId },
      include: {
        _count: { select: { purchases: true } }
      },
      orderBy: { name: 'asc' }
    });

    const activeLot = auction.lots.find((l) => l.status === LotStatus.ACTIVE);
    const highestBid = activeLot?.bids[0];

    const minLimit = auction.rules?.minSquadLimit || 5;
    const maxLimit = auction.rules?.maxSquadLimit || 15;

    const teamSnapshots = teams.map((t) => {
      const remainingPurse = Number(t.remainingPurse);
      const squadCount = t._count.purchases;
      const canBid =
        auction.status === AuctionStatus.LIVE &&
        !auction.isPaused &&
        squadCount < maxLimit &&
        remainingPurse >= (activeLot ? Number(activeLot.basePrice) : 1000);

      return {
        teamId: t.id,
        name: t.name,
        abbreviation: t.abbreviation,
        logoUrl: t.logoUrl,
        color: t.color,
        initialPurse: Number(t.initialPurse),
        remainingPurse,
        spentPurse: Number(t.initialPurse) - remainingPurse,
        squadCount,
        maxSquadLimit: maxLimit,
        minSquadLimit: minLimit,
        canBid
      };
    });

    let currentLotSnapshot = null;
    let nextBidAmount = 0;

    if (activeLot) {
      const currentBidNum = Number(activeLot.currentBid);
      const basePriceNum = Number(activeLot.basePrice);
      const { nextBid } = calculateNextBid(currentBidNum, basePriceNum);
      nextBidAmount = nextBid;

      const highestTeam = highestBid?.team;

      currentLotSnapshot = {
        lotId: activeLot.id,
        sequenceOrder: activeLot.sequenceOrder,
        status: activeLot.status as LotStatus,
        basePrice: basePriceNum,
        currentBid: currentBidNum,
        highestBidderTeamId: highestTeam?.id || null,
        highestBidderTeamName: highestTeam?.name || null,
        highestBidderTeamLogo: highestTeam?.logoUrl || null,
        highestBidderTeamColor: highestTeam?.color || null,
        bidsCount: activeLot.bids.length,
        player: {
          id: activeLot.player.id,
          fullName: activeLot.player.fullName,
          displayName: activeLot.player.displayName,
          photoUrl: activeLot.player.photoUrl,
          role: activeLot.player.role as any,
          category: activeLot.player.playerCategory,
          city: activeLot.player.city,
          state: activeLot.player.state,
          age: activeLot.player.age,
          battingStyle: activeLot.player.battingStyle as any,
          bowlingStyle: activeLot.player.bowlingStyle as any,
          stats: activeLot.player.stats ? {
            matches: activeLot.player.stats.matches,
            runs: activeLot.player.stats.runs,
            battingAverage: Number(activeLot.player.stats.battingAverage),
            strikeRate: Number(activeLot.player.stats.strikeRate),
            highestScore: activeLot.player.stats.highestScore,
            wickets: activeLot.player.stats.wickets,
            bowlingAverage: Number(activeLot.player.stats.bowlingAverage),
            economy: Number(activeLot.player.stats.economy),
            catches: activeLot.player.stats.catches
          } : null
        },
        bidHistory: activeLot.bids.map((b) => ({
          id: b.id,
          bidAmount: Number(b.bidAmount),
          bidSource: b.bidSource as any,
          teamId: b.teamId,
          teamName: b.team.name,
          teamAbbr: b.team.abbreviation,
          teamColor: b.team.color,
          teamLogo: b.team.logoUrl,
          bidderName: b.user?.fullName || 'Paddle Bid',
          createdAt: b.createdAt.toISOString(),
          sequence: b.sequenceNumber
        }))
      };
    }

    const nextLots = auction.lots
      .filter((l) => l.status === LotStatus.QUEUED)
      .slice(0, 10)
      .map((l) => ({
        lotId: l.id,
        sequenceOrder: l.sequenceOrder,
        playerId: l.player.id,
        playerName: l.player.fullName,
        playerRole: l.player.role as any,
        basePrice: Number(l.basePrice),
        photoUrl: l.player.photoUrl
      }));

    // Find sold lots
    const purchases = await prisma.purchase.findMany({
      where: {
        lot: { auctionId },
        isReversed: false
      },
      include: {
        lot: true,
        player: true,
        team: true
      },
      orderBy: { soldAt: 'desc' },
      take: 8
    });

    const recentSoldLots = purchases.map((p) => ({
      lotId: p.lotId,
      playerName: p.player.fullName,
      playerPhoto: p.player.photoUrl,
      playerRole: p.player.role as any,
      soldPrice: Number(p.purchasePrice),
      teamId: p.teamId,
      teamName: p.team.name,
      teamLogo: p.team.logoUrl,
      soldAt: p.soldAt.toISOString()
    }));

    // Authoritative countdown timer calculation
    const timer = AuctionService.getOrCreateTimer(
      auction.id,
      activeLot?.id,
      auction.countdownSeconds || 15
    );

    let countdownRemainingSeconds: number = 0;
    let countdownEndsAt: string | null = null;

    if (activeLot && auction.status === AuctionStatus.LIVE) {
      if (auction.isPaused || timer.isPaused) {
        countdownRemainingSeconds = Math.max(0, Math.ceil(timer.remainingMs / 1000));
        countdownEndsAt = null;
      } else {
        const diffMs = Math.max(0, timer.deadlineMs - Date.now());
        countdownRemainingSeconds = Math.ceil(diffMs / 1000);
        countdownEndsAt = new Date(timer.deadlineMs).toISOString();
      }
    }

    return {
      auctionId: auction.id,
      tournamentId: auction.tournamentId,
      tournamentName: auction.tournament.name,
      name: auction.name,
      mode: auction.mode as any,
      status: auction.status as any,
      currency: auction.currency,
      version: auction.version,
      currentLot: currentLotSnapshot,
      nextLots,
      recentSoldLots,
      teams: teamSnapshots,
      countdownRemainingSeconds,
      countdownEndsAt,
      nextBidAmount,
      isPaused: auction.isPaused,
      serverTimestamp: new Date().toISOString()
    };
  }

  /**
   * Broadcasts updated snapshot to all rooms
   */
  static async broadcastSnapshot(auctionId: string) {
    const io = getIO();
    const snapshot = await AuctionService.getSnapshot(auctionId);
    if (!snapshot) return;

    io.to(SOCKET_ROOMS.auction(auctionId)).emit(SOCKET_EVENTS.AUCTION_STATE_SNAPSHOT, snapshot);
    return snapshot;
  }

  /**
   * Start Auction
   */
  static async startAuction(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        lots: { orderBy: { sequenceOrder: 'asc' } }
      }
    });

    if (!auction) throw new Error('Auction not found');

    // If no active lot, activate first queued lot
    let activeLot = auction.lots.find((l) => l.status === LotStatus.ACTIVE);
    if (!activeLot) {
      const firstQueued = auction.lots.find((l) => l.status === LotStatus.QUEUED);
      if (firstQueued) {
        await prisma.auctionLot.update({
          where: { id: firstQueued.id },
          data: { status: LotStatus.ACTIVE, startedAt: new Date() }
        });
        activeLot = firstQueued;
      }
    }

    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: AuctionStatus.LIVE,
        isPaused: false,
        startedAt: auction.startedAt || new Date(),
        currentLotId: activeLot?.id || null,
        version: { increment: 1 }
      }
    });

    AuctionService.resetTimer(auctionId, activeLot?.id, auction.countdownSeconds || 15);

    return await AuctionService.broadcastSnapshot(auctionId);
  }

  /**
   * Pause / Resume
   */
  static async togglePause(auctionId: string, shouldPause: boolean) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        isPaused: shouldPause,
        version: { increment: 1 }
      }
    });

    if (shouldPause) {
      AuctionService.pauseTimer(auctionId);
    } else {
      AuctionService.resumeTimer(auctionId);
    }

    return await AuctionService.broadcastSnapshot(auctionId);
  }

  /**
   * Announce Next Player
   */
  static async nextPlayer(auctionId: string, specificLotId?: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { lots: { orderBy: { sequenceOrder: 'asc' } } }
    });

    if (!auction) throw new Error('Auction not found');

    // If there is currently an active lot with no bids, mark it UNSOLD or SKIPPED
    const currentActive = auction.lots.find((l) => l.status === LotStatus.ACTIVE);
    if (currentActive && currentActive.id !== specificLotId) {
      await prisma.auctionLot.update({
        where: { id: currentActive.id },
        data: { status: LotStatus.UNSOLD }
      });
    }

    let nextLot = specificLotId
      ? auction.lots.find((l) => l.id === specificLotId)
      : auction.lots.find((l) => l.status === LotStatus.QUEUED);

    if (nextLot) {
      await prisma.auctionLot.update({
        where: { id: nextLot.id },
        data: { status: LotStatus.ACTIVE, startedAt: new Date() }
      });

      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          currentLotId: nextLot.id,
          version: { increment: 1 }
        }
      });

      AuctionService.resetTimer(auctionId, nextLot.id, auction.countdownSeconds || 15);
    } else {
      // No more players
      await prisma.auction.update({
        where: { id: auctionId },
        data: {
          status: AuctionStatus.COMPLETED,
          endedAt: new Date(),
          version: { increment: 1 }
        }
      });

      AuctionService.stopTimer(auctionId);
    }

    return await AuctionService.broadcastSnapshot(auctionId);
  }

  /**
   * Place Bid Transaction
   */
  static async placeBid(params: {
    auctionId: string;
    lotId: string;
    teamId: string;
    bidAmount: number;
    bidSource: BidSource;
    userId?: string;
  }) {
    const { auctionId, lotId, teamId, bidAmount, bidSource, userId } = params;

    return await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { rules: true }
      });

      if (!auction) throw new Error('Auction not found');

      const lot = await tx.auctionLot.findUnique({
        where: { id: lotId },
        include: {
          bids: {
            where: { isReversed: false },
            orderBy: { sequenceNumber: 'desc' },
            take: 1
          }
        }
      });

      if (!lot) throw new Error('Player lot not found');

      const team = await tx.team.findUnique({
        where: { id: teamId },
        include: { _count: { select: { purchases: true } } }
      });

      if (!team) throw new Error('Team not found');

      const highestBid = lot.bids[0];
      const currentBidNum = Number(lot.currentBid);
      const basePriceNum = Number(lot.basePrice);
      const teamRemainingPurse = Number(team.remainingPurse);
      const teamSquadCount = team._count.purchases;
      const maxLimit = auction.rules?.maxSquadLimit || 15;
      const minLimit = auction.rules?.minSquadLimit || 5;

      // Validate Bid using pure auction engine validator
      const validation = validateBid({
        auctionStatus: auction.status as any,
        isPaused: auction.isPaused,
        lotStatus: lot.status as any,
        currentBid: currentBidNum,
        basePrice: basePriceNum,
        bidAmount,
        highestBidderTeamId: highestBid?.teamId,
        teamId,
        teamRemainingPurse,
        teamSquadCount,
        maxSquadLimit: maxLimit,
        minSquadLimit: minLimit
      });

      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid bid placement');
      }

      // Next sequence number
      const sequenceNumber = (highestBid?.sequenceNumber || 0) + 1;

      // Create Bid Record
      const newBid = await tx.bid.create({
        data: {
          lotId: lot.id,
          teamId,
          userId: userId || null,
          bidAmount: BigInt(bidAmount),
          bidSource: bidSource as any,
          sequenceNumber
        },
        include: {
          team: { select: { id: true, name: true, abbreviation: true, color: true, logoUrl: true } },
          user: { select: { fullName: true } }
        }
      });

      // Update lot current bid
      await tx.auctionLot.update({
        where: { id: lot.id },
        data: {
          currentBid: BigInt(bidAmount),
          winningTeamId: teamId
        }
      });

      // Increment auction version & record event
      await tx.auction.update({
        where: { id: auctionId },
        data: { version: { increment: 1 } }
      });

      await tx.auctionEvent.create({
        data: {
          auctionId,
          sequenceNumber,
          auctionVersion: auction.version + 1,
          eventType: SOCKET_EVENTS.BID_PLACED,
          payload: {
            bidId: newBid.id,
            lotId: lot.id,
            teamId,
            teamName: team.name,
            teamAbbr: team.abbreviation,
            bidAmount,
            bidSource,
            bidderName: newBid.user?.fullName || 'Host (Paddle)'
          }
        }
      });

      return newBid;
    }).then(async (newBid) => {
      // Reset countdown to 15s after successful bid
      AuctionService.resetTimer(auctionId, lotId, 15);
      // Broadcast updated snapshot to all rooms
      await AuctionService.broadcastSnapshot(auctionId);
      return newBid;
    });
  }

  /**
   * Mark Lot as SOLD (Transactional & triggers player notification outbox)
   */
  static async markSold(auctionId: string, lotId: string, winningTeamId?: string, finalPrice?: number) {
    return await prisma.$transaction(async (tx) => {
      const lot = await tx.auctionLot.findUnique({
        where: { id: lotId },
        include: {
          player: true,
          bids: {
            where: { isReversed: false },
            orderBy: { sequenceNumber: 'desc' },
            take: 1
          }
        }
      });

      if (!lot) throw new Error('Lot not found');
      if (lot.status !== LotStatus.ACTIVE) throw new Error(`Lot is not active (current status: ${lot.status})`);

      const highestBid = lot.bids[0];
      const buyerTeamId = winningTeamId || highestBid?.teamId;
      const salePrice = finalPrice ? BigInt(finalPrice) : (highestBid ? highestBid.bidAmount : lot.basePrice);

      if (!buyerTeamId) {
        throw new Error('Cannot mark SOLD without a bidding team or winner specified.');
      }

      const team = await tx.team.findUnique({ where: { id: buyerTeamId } });
      if (!team) throw new Error('Winning team not found');

      if (team.remainingPurse < salePrice) {
        throw new Error(`Team ${team.name} has insufficient purse to complete purchase.`);
      }

      // 1. Mark Lot SOLD
      await tx.auctionLot.update({
        where: { id: lot.id },
        data: {
          status: LotStatus.SOLD,
          soldAt: new Date(),
          winningTeamId: team.id,
          currentBid: salePrice
        }
      });

      // 2. Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          lotId: lot.id,
          teamId: team.id,
          playerId: lot.playerId,
          purchasePrice: salePrice
        }
      });

      // 3. Deduct purse & add ledger entry
      const newRemainingPurse = team.remainingPurse - salePrice;

      await tx.team.update({
        where: { id: team.id },
        data: { remainingPurse: newRemainingPurse }
      });

      await tx.purseLedger.create({
        data: {
          teamId: team.id,
          purchaseId: purchase.id,
          entryType: 'DEDUCTION',
          amount: -salePrice,
          balanceAfter: newRemainingPurse,
          description: `Acquired ${lot.player.fullName} in auction`
        }
      });

      // 4. Create Notification Outbox Event for automated background delivery!
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'PURCHASE',
          aggregateId: purchase.id,
          eventType: 'PLAYER_SOLD',
          payload: {
            playerId: lot.playerId,
            playerName: lot.player.fullName,
            teamId: team.id,
            teamName: team.name,
            purchasePrice: Number(salePrice),
            auctionId
          }
        }
      });

      // Advance auction version
      await tx.auction.update({
        where: { id: auctionId },
        data: { version: { increment: 1 } }
      });

      return purchase;
    }).then(async (purchase) => {
      AuctionService.stopTimer(auctionId);
      await AuctionService.broadcastSnapshot(auctionId);
      return purchase;
    });
  }

  /**
   * Mark Lot as UNSOLD
   */
  static async markUnsold(auctionId: string, lotId: string) {
    await prisma.auctionLot.update({
      where: { id: lotId },
      data: {
        status: LotStatus.UNSOLD,
        soldAt: new Date()
      }
    });

    await prisma.auction.update({
      where: { id: auctionId },
      data: { version: { increment: 1 } }
    });

    AuctionService.stopTimer(auctionId);
    return await AuctionService.broadcastSnapshot(auctionId);
  }

  /**
   * Reversal / Undo (Safe audited reversal of last action)
   */
  static async reverseAction(auctionId: string, lotId: string, reason: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const lot = await tx.auctionLot.findUnique({
        where: { id: lotId },
        include: {
          purchase: true,
          bids: {
            where: { isReversed: false },
            orderBy: { sequenceNumber: 'desc' }
          }
        }
      });

      if (!lot) throw new Error('Lot not found');

      // 1. If lot was SOLD: reverse purchase and refund purse!
      if (lot.status === LotStatus.SOLD && lot.purchase) {
        const team = await tx.team.findUnique({ where: { id: lot.purchase.teamId } });
        if (team) {
          const refundedBalance = team.remainingPurse + lot.purchase.purchasePrice;
          await tx.team.update({
            where: { id: team.id },
            data: { remainingPurse: refundedBalance }
          });

          await tx.purseLedger.create({
            data: {
              teamId: team.id,
              entryType: 'REFUND_REVERSAL',
              amount: lot.purchase.purchasePrice,
              balanceAfter: refundedBalance,
              description: `Auction reversal: purchase of player cancelled (${reason})`
            }
          });
        }

        await tx.purchase.delete({ where: { id: lot.purchase.id } });

        await tx.auctionLot.update({
          where: { id: lot.id },
          data: {
            status: LotStatus.ACTIVE,
            soldAt: null,
            winningTeamId: null,
            currentBid: BigInt(0)
          }
        });
      } else if (lot.bids.length > 0) {
        // 2. If reversing last bid
        const lastBid = lot.bids[0];
        await tx.bid.update({
          where: { id: lastBid.id },
          data: { isReversed: true, reversedAt: new Date() }
        });

        const previousBid = lot.bids[1];
        await tx.auctionLot.update({
          where: { id: lot.id },
          data: {
            currentBid: previousBid ? previousBid.bidAmount : BigInt(0),
            winningTeamId: previousBid ? previousBid.teamId : null
          }
        });
      }

      // Record audit log
      await tx.auctionAuditLog.create({
        data: {
          auctionId,
          userId: userId || null,
          action: 'REVERSE_ACTION',
          details: { lotId, reason }
        }
      });

      await tx.auction.update({
        where: { id: auctionId },
        data: { version: { increment: 1 } }
      });
    }).then(async () => {
      AuctionService.resetTimer(auctionId, lotId, 15);
      return await AuctionService.broadcastSnapshot(auctionId);
    });
  }
}
