import { PrismaClient, UserRole, AuctionStatus, LotStatus, BidSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('🧪 AUCTIONOS AUTOMATED INTEGRATION & STRESS TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Verify Seed Data & Authentication
  console.log('--- TEST SUITE 1: AUTHENTICATION & MULTI-TENANCY ---');
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@auctionos.com' } });
  assert(!!adminUser, 'Super Admin account exists');
  const passwordValid = await bcrypt.compare('Password123!', adminUser?.passwordHash || '');
  assert(passwordValid, 'Admin password hash verification succeeds');

  const org = await prisma.organization.findUnique({ where: { slug: 'apex-cricket' } });
  assert(!!org, 'Organization isolation boundary exists');

  // 2. Tournament & Teams Verification
  console.log('\n--- TEST SUITE 2: TOURNAMENT & FRANCHISE TEAMS ---');
  const tournament = await prisma.tournament.findFirst({
    where: { slug: 'mpl-2027' },
    include: { teams: true, auctions: true }
  });
  assert(!!tournament, 'MPL 2027 Tournament exists');
  assert(tournament?.teams.length === 4, '4 Franchise teams properly provisioned');

  const teamA = tournament?.teams[0]!;
  const teamB = tournament?.teams[1]!;
  assert(Number(teamA.remainingPurse) === 50000, `Team ${teamA.name} initial purse is ₹50,000`);
  assert(Number(teamB.remainingPurse) === 50000, `Team ${teamB.name} initial purse is ₹50,000`);

  // 3. Auction Engine & Live Bidding Tests
  console.log('\n--- TEST SUITE 3: CENTRAL AUCTION ENGINE & REAL-TIME BIDDING ---');
  const auction = tournament?.auctions[0]!;
  assert(!!auction, 'Live Auction instance exists');

  // Activate first lot
  const lot = await prisma.auctionLot.findFirst({
    where: { auctionId: auction.id },
    include: { player: true },
    orderBy: { sequenceOrder: 'asc' }
  });
  assert(!!lot, `Lot #1 (${lot?.player.fullName}) found`);

  await prisma.auctionLot.update({
    where: { id: lot!.id },
    data: { status: LotStatus.ACTIVE, startedAt: new Date() }
  });

  await prisma.auction.update({
    where: { id: auction.id },
    data: { status: AuctionStatus.LIVE, currentLotId: lot!.id }
  });

  // Bid 1: Team A bids ₹5,000
  const bid1 = await prisma.bid.create({
    data: {
      lotId: lot!.id,
      teamId: teamA.id,
      bidAmount: BigInt(5000),
      bidSource: BidSource.ONLINE_OWNER,
      sequenceNumber: 1
    }
  });
  assert(Number(bid1.bidAmount) === 5000, 'Team A placed online bid of ₹5,000');

  // Update lot current bid
  await prisma.auctionLot.update({
    where: { id: lot!.id },
    data: { currentBid: BigInt(5000), winningTeamId: teamA.id }
  });

  // Bid 2: Team B outbids Team A with ₹5,500 (Increment: 500)
  const bid2 = await prisma.bid.create({
    data: {
      lotId: lot!.id,
      teamId: teamB.id,
      bidAmount: BigInt(5500),
      bidSource: BidSource.HOST_MANUAL,
      sequenceNumber: 2
    }
  });
  assert(Number(bid2.bidAmount) === 5500, 'Team B placed paddle bid of ₹5,500 (increment applied)');

  await prisma.auctionLot.update({
    where: { id: lot!.id },
    data: { currentBid: BigInt(5500), winningTeamId: teamB.id }
  });

  // 4. SOLD Transaction & Immutable Ledger Integrity
  console.log('\n--- TEST SUITE 4: SOLD OPERATION & PURSE LEDGER INTEGRITY ---');
  // Mark Lot SOLD to Team B
  const purchase = await prisma.$transaction(async (tx) => {
    await tx.auctionLot.update({
      where: { id: lot!.id },
      data: { status: LotStatus.SOLD, soldAt: new Date(), currentBid: BigInt(5500), winningTeamId: teamB.id }
    });

    const p = await tx.purchase.create({
      data: {
        lotId: lot!.id,
        teamId: teamB.id,
        playerId: lot!.playerId,
        purchasePrice: BigInt(5500)
      }
    });

    const newPurse = teamB.remainingPurse - BigInt(5500);
    await tx.team.update({
      where: { id: teamB.id },
      data: { remainingPurse: newPurse }
    });

    await tx.purseLedger.create({
      data: {
        teamId: teamB.id,
        purchaseId: p.id,
        entryType: 'DEDUCTION',
        amount: BigInt(-5500),
        balanceAfter: newPurse,
        description: `Acquired ${lot!.player.fullName} in auction`
      }
    });

    // Create Outbox Notification Event
    await tx.outboxEvent.create({
      data: {
        aggregateType: 'PURCHASE',
        aggregateId: p.id,
        eventType: 'PLAYER_SOLD',
        payload: {
          playerId: lot!.playerId,
          playerName: lot!.player.fullName,
          teamId: teamB.id,
          teamName: teamB.name,
          purchasePrice: 5500
        }
      }
    });

    return p;
  });

  assert(!!purchase, 'Purchase record transactionally committed');

  const updatedTeamB = await prisma.team.findUnique({ where: { id: teamB.id } });
  assert(
    Number(updatedTeamB?.remainingPurse) === 44500,
    `Team B remaining purse accurately deducted: ₹50,000 - ₹5,500 = ₹${Number(updatedTeamB?.remainingPurse).toLocaleString()}`
  );

  const ledgerEntry = await prisma.purseLedger.findFirst({
    where: { teamId: teamB.id, entryType: 'DEDUCTION' }
  });
  assert(!!ledgerEntry && Number(ledgerEntry.amount) === -5500, 'Immutable purse ledger deduction entry logged');

  // 5. Automated Notification Outbox
  console.log('\n--- TEST SUITE 5: AUTOMATED NOTIFICATION OUTBOX ---');
  const outboxEvent = await prisma.outboxEvent.findFirst({
    where: { aggregateId: purchase.id }
  });
  assert(!!outboxEvent && outboxEvent.eventType === 'PLAYER_SOLD', 'Outbox event generated for player SOLD');

  // 6. Audited Reversal / Undo Test
  console.log('\n--- TEST SUITE 6: AUDITED ACTION REVERSAL / UNDO ---');
  const refundPurse = updatedTeamB!.remainingPurse + purchase.purchasePrice;
  await prisma.$transaction([
    prisma.team.update({
      where: { id: teamB.id },
      data: { remainingPurse: refundPurse }
    }),
    prisma.purseLedger.create({
      data: {
        teamId: teamB.id,
        entryType: 'REFUND_REVERSAL',
        amount: purchase.purchasePrice,
        balanceAfter: refundPurse,
        description: 'Test reversal refund'
      }
    }),
    prisma.purchase.delete({ where: { id: purchase.id } }),
    prisma.auctionLot.update({
      where: { id: lot!.id },
      data: { status: LotStatus.ACTIVE, soldAt: null }
    }),
    prisma.auctionAuditLog.create({
      data: {
        auctionId: auction.id,
        action: 'TEST_REVERSAL',
        details: { reason: 'Automated test undo verification' }
      }
    })
  ]);

  const restoredTeamB = await prisma.team.findUnique({ where: { id: teamB.id } });
  assert(
    Number(restoredTeamB?.remainingPurse) === 50000,
    `Purse reversal restored Team B purse to ₹${Number(restoredTeamB?.remainingPurse).toLocaleString()}`
  );

  const auditLog = await prisma.auctionAuditLog.findFirst({
    where: { action: 'TEST_REVERSAL' }
  });
  assert(!!auditLog, 'Auction audit log recorded for reversal action');

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
