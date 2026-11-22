import { PrismaClient, UserRole, TournamentStatus, AuctionMode, AuctionStatus, CricketRole, BattingStyle, BowlingStyle, LotStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING AUCTIONOS DATABASE ---');

  // 1. Password Hash
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 2. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@auctionos.com' },
    update: {},
    create: {
      email: 'admin@auctionos.com',
      fullName: 'Super Administrator',
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      phone: '+919876543210'
    }
  });

  // 3. Organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'apex-cricket' },
    update: {},
    create: {
      name: 'Apex Cricket League',
      slug: 'apex-cricket',
      logoUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=200&h=200&fit=crop',
      primaryColor: '#2563EB',
      isVerified: true
    }
  });

  // Org Admin
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'orgadmin@apexcricket.com' },
    update: {},
    create: {
      email: 'orgadmin@apexcricket.com',
      fullName: 'Vikram Singhania',
      passwordHash: defaultPasswordHash,
      role: UserRole.ORG_ADMIN,
      isVerified: true,
      phone: '+919876543211'
    }
  });

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: orgAdmin.id
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: orgAdmin.id,
      role: 'ADMIN'
    }
  });

  // 4. Tournament
  const tournament = await prisma.tournament.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: 'mpl-2027'
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      createdById: orgAdmin.id,
      name: 'Mumbai Premier League 2027',
      slug: 'mpl-2027',
      sport: 'Cricket',
      season: '2027',
      currency: 'INR',
      status: TournamentStatus.AUCTION_READY,
      location: 'Wankhede Stadium, Mumbai',
      description: 'Premier T20 franchise cricket tournament featuring top domestic talent.',
      settings: {
        create: {
          initialPurse: BigInt(50000),
          minSquadLimit: 5,
          maxSquadLimit: 15,
          showPriceInPublic: true,
          autoNotifySold: true
        }
      }
    }
  });

  // 5. Auctioneer & Assistant
  const auctioneer = await prisma.user.upsert({
    where: { email: 'auctioneer@mpl.com' },
    update: {},
    create: {
      email: 'auctioneer@mpl.com',
      fullName: 'Harsha Charu (Host)',
      passwordHash: defaultPasswordHash,
      role: UserRole.AUCTIONEER,
      isVerified: true,
      phone: '+919876543212'
    }
  });

  // 6. Teams & Owners
  const teamsData = [
    {
      name: 'Mumbai Strikers',
      abbreviation: 'MBS',
      color: '#2563EB',
      ownerName: 'Rajesh Mehra',
      ownerEmail: 'owner.strikers@mpl.com',
      logo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&h=150&fit=crop'
    },
    {
      name: 'Royal Blasters',
      abbreviation: 'RBL',
      color: '#DC2626',
      ownerName: 'Sameer Goel',
      ownerEmail: 'owner.blasters@mpl.com',
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&h=150&fit=crop'
    },
    {
      name: 'Coastal Titans',
      abbreviation: 'CTN',
      color: '#059669',
      ownerName: 'Anand Kulkarni',
      ownerEmail: 'owner.titans@mpl.com',
      logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150&h=150&fit=crop'
    },
    {
      name: 'Deccan Kings',
      abbreviation: 'DKG',
      color: '#7C3AED',
      ownerName: 'Pooja Reddy',
      ownerEmail: 'owner.kings@mpl.com',
      logo: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=150&h=150&fit=crop'
    }
  ];

  const createdTeams = [];

  for (const t of teamsData) {
    const owner = await prisma.user.upsert({
      where: { email: t.ownerEmail },
      update: {},
      create: {
        email: t.ownerEmail,
        fullName: t.ownerName,
        passwordHash: defaultPasswordHash,
        role: UserRole.TEAM_OWNER,
        isVerified: true,
        phone: '+91987650000' + Math.floor(Math.random() * 90 + 10)
      }
    });

    let team = await prisma.team.findFirst({
      where: { tournamentId: tournament.id, abbreviation: t.abbreviation }
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          tournamentId: tournament.id,
          name: t.name,
          abbreviation: t.abbreviation,
          color: t.color,
          logoUrl: t.logo,
          initialPurse: BigInt(50000),
          remainingPurse: BigInt(50000),
          memberships: {
            create: {
              userId: owner.id,
              role: 'PRIMARY_OWNER',
              canBid: true,
              canManageSquad: true,
              canInvite: true
            }
          },
          purseLedgers: {
            create: {
              entryType: 'INITIAL',
              amount: BigInt(50000),
              balanceAfter: BigInt(50000),
              description: 'Initial tournament purse allocation'
            }
          }
        }
      });
    }

    createdTeams.push(team);
  }

  // 7. Players
  const playersData = [
    {
      name: 'Rahul Sharma',
      role: CricketRole.BATSMAN,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.NONE,
      category: 'Marquee',
      basePrice: 5000,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
      age: 26,
      city: 'Mumbai',
      matches: 48,
      runs: 1620,
      avg: 41.5,
      sr: 142.3,
      hs: 104,
      wickets: 0,
      bAvg: 0,
      econ: 0,
      catches: 24
    },
    {
      name: 'Jasprit Bumrah (Domestic)',
      role: CricketRole.BOWLER,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.RIGHT_ARM_FAST,
      category: 'Marquee',
      basePrice: 5000,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
      age: 27,
      city: 'Ahmedabad',
      matches: 52,
      runs: 140,
      avg: 9.3,
      sr: 98.2,
      hs: 24,
      wickets: 76,
      bAvg: 18.4,
      econ: 6.85,
      catches: 12
    },
    {
      name: 'Hardik Patel',
      role: CricketRole.ALL_ROUNDER,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.RIGHT_ARM_MEDIUM,
      category: 'Marquee',
      basePrice: 5000,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      age: 28,
      city: 'Baroda',
      matches: 45,
      runs: 980,
      avg: 32.6,
      sr: 154.2,
      hs: 78,
      wickets: 38,
      bAvg: 24.1,
      econ: 7.9,
      catches: 18
    },
    {
      name: 'Rishabh Verma',
      role: CricketRole.WICKET_KEEPER,
      battingStyle: BattingStyle.LEFT_HAND,
      bowlingStyle: BowlingStyle.NONE,
      category: 'A-Grade',
      basePrice: 3000,
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop',
      age: 24,
      city: 'Delhi',
      matches: 38,
      runs: 1120,
      avg: 36.2,
      sr: 148.5,
      hs: 89,
      wickets: 0,
      bAvg: 0,
      econ: 0,
      catches: 32
    },
    {
      name: 'Suryakumar Rao',
      role: CricketRole.BATSMAN,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.RIGHT_ARM_SPIN,
      category: 'A-Grade',
      basePrice: 3000,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      age: 29,
      city: 'Mumbai',
      matches: 62,
      runs: 1890,
      avg: 38.5,
      sr: 165.4,
      hs: 117,
      wickets: 8,
      bAvg: 31.0,
      econ: 8.2,
      catches: 28
    },
    {
      name: 'Mohammad Sirajuddin',
      role: CricketRole.BOWLER,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.RIGHT_ARM_FAST,
      category: 'A-Grade',
      basePrice: 3000,
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&h=300&fit=crop',
      age: 25,
      city: 'Hyderabad',
      matches: 40,
      runs: 65,
      avg: 6.5,
      sr: 85.0,
      hs: 18,
      wickets: 54,
      bAvg: 21.2,
      econ: 7.4,
      catches: 10
    },
    {
      name: 'Ravindra Jadeja (Local)',
      role: CricketRole.ALL_ROUNDER,
      battingStyle: BattingStyle.LEFT_HAND,
      bowlingStyle: BowlingStyle.LEFT_ARM_SPIN,
      category: 'A-Grade',
      basePrice: 3000,
      photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&fit=crop',
      age: 30,
      city: 'Rajkot',
      matches: 55,
      runs: 850,
      avg: 29.3,
      sr: 135.0,
      hs: 62,
      wickets: 61,
      bAvg: 20.5,
      econ: 6.7,
      catches: 35
    },
    {
      name: 'Ishan Merchant',
      role: CricketRole.WICKET_KEEPER,
      battingStyle: BattingStyle.LEFT_HAND,
      bowlingStyle: BowlingStyle.NONE,
      category: 'B-Grade',
      basePrice: 1500,
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop',
      age: 22,
      city: 'Patna',
      matches: 28,
      runs: 720,
      avg: 30.0,
      sr: 138.0,
      hs: 74,
      wickets: 0,
      bAvg: 0,
      econ: 0,
      catches: 20
    },
    {
      name: 'Deepak Chahar (Local)',
      role: CricketRole.BOWLER,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.RIGHT_ARM_MEDIUM,
      category: 'B-Grade',
      basePrice: 1500,
      photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&h=300&fit=crop',
      age: 27,
      city: 'Agra',
      matches: 34,
      runs: 180,
      avg: 18.0,
      sr: 125.0,
      hs: 39,
      wickets: 44,
      bAvg: 23.4,
      econ: 7.8,
      catches: 8
    },
    {
      name: 'Yuzvendra Chahal (Local)',
      role: CricketRole.BOWLER,
      battingStyle: BattingStyle.RIGHT_HAND,
      bowlingStyle: BowlingStyle.RIGHT_ARM_SPIN,
      category: 'B-Grade',
      basePrice: 1500,
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      age: 31,
      city: 'Haryana',
      matches: 58,
      runs: 45,
      avg: 4.5,
      sr: 65.0,
      hs: 12,
      wickets: 82,
      bAvg: 19.8,
      econ: 7.2,
      catches: 14
    }
  ];

  const createdPlayers = [];

  for (const p of playersData) {
    let player = await prisma.player.findFirst({
      where: { tournamentId: tournament.id, fullName: p.name }
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          tournamentId: tournament.id,
          fullName: p.name,
          displayName: p.name.split(' ')[0],
          age: p.age,
          city: p.city,
          role: p.role,
          battingStyle: p.battingStyle,
          bowlingStyle: p.bowlingStyle,
          playerCategory: p.category,
          basePrice: BigInt(p.basePrice),
          photoUrl: p.photo,
          isVerified: true,
          mobileNumber: '+919988776655',
          email: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@player.com`,
          consents: {
            create: {
              consentWhatsapp: true,
              consentSMS: true,
              consentEmail: true,
              verifiedPhone: true
            }
          },
          stats: {
            create: {
              matches: p.matches,
              runs: p.runs,
              battingAverage: p.avg,
              strikeRate: p.sr,
              highestScore: p.hs,
              wickets: p.wickets,
              bowlingAverage: p.bAvg,
              economy: p.econ,
              catches: p.catches
            }
          }
        }
      });
    }

    createdPlayers.push(player);
  }

  // 8. Create Live Auction
  let auction = await prisma.auction.findFirst({
    where: { tournamentId: tournament.id }
  });

  if (!auction) {
    auction = await prisma.auction.create({
      data: {
        tournamentId: tournament.id,
        name: 'MPL 2027 Mega Player Auction',
        mode: AuctionMode.HYBRID,
        status: AuctionStatus.READY,
        currency: 'INR',
        countdownSeconds: 30,
        bidExtensionSeconds: 10,
        extensionThresholdSeconds: 5,
        rules: {
          create: {
            incrementType: 'PRICE_TIER',
            minSquadLimit: 5,
            maxSquadLimit: 15
          }
        }
      }
    });

    // Populate lots
    let seq = 1;
    for (const player of createdPlayers) {
      await prisma.auctionLot.create({
        data: {
          auctionId: auction.id,
          playerId: player.id,
          sequenceOrder: seq++,
          basePrice: player.basePrice,
          currentBid: BigInt(0),
          status: LotStatus.QUEUED
        }
      });
    }
  }

  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`- Super Admin: admin@auctionos.com / Password123!`);
  console.log(`- Org Admin:   orgadmin@apexcricket.com / Password123!`);
  console.log(`- Auctioneer:  auctioneer@mpl.com / Password123!`);
  console.log(`- Team Owners: owner.strikers@mpl.com (and blasters, titans, kings) / Password123!`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
