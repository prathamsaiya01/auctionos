'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuctionStore } from '@/stores/auctionStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { BidSource, LotStatus, AuctionStatus } from '@auctionos/shared';
import confetti from 'canvas-confetti';
import {
  Gavel,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Wifi,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Trophy,
  AlertTriangle,
  Flame,
  Settings,
  Tv,
  Radio,
  Pencil,
  Crown,
  Users,
  Check,
  ChevronLeft,
  Search,
  Filter,
  DollarSign,
  ArrowUpDown,
  Eye,
  X,
  Layers,
  Wallet
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// Default sponsor configuration (can be extended dynamically)
const SPONSORS = [
  {
    id: 'gokul-optics',
    name: 'GOKUL OPTICS',
    tagline: 'A vision ahead >>',
    logoUrl: '/images/gokul/gokul_optics.png',
  },
  {
    id: 'gokul-bags',
    name: 'GOKUL BAGS',
    tagline: 'Miles ahead >>',
    logoUrl: '/images/gokul/gokul_bags.png',
  }
];

export default function AuctioneerConsolePage() {
  const params = useParams();
  const auctionId = params?.id as string;

  const { snapshot, connectionState, initSocket } = useAuctionStore();
  const { user } = useAuthStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [customBidAmount, setCustomBidAmount] = useState<number | ''>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [undoReason, setUndoReason] = useState('Auctioneer correction');
  const [lastSoldData, setLastSoldData] = useState<any>(null);

  // VIEW SQUAD Modal State
  const [viewSquadTeam, setViewSquadTeam] = useState<any | null>(null);
  const [squadRoleFilter, setSquadRoleFilter] = useState<string>('ALL');

  // VIEW PLAYERS Modal State
  const [showPlayersModal, setShowPlayersModal] = useState<boolean>(false);
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState<string>('ALL');
  const [playerCategoryFilter, setPlayerCategoryFilter] = useState<string>('ALL');
  const [playerStatusFilter, setPlayerStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'SOLD'>('ALL');
  const [playerSortBy, setPlayerSortBy] = useState<'NAME' | 'PRICE_HIGH' | 'PRICE_LOW'>('NAME');

  // Initialize Socket connection
  useEffect(() => {
    if (auctionId) {
      initSocket(auctionId);
    }
  }, [auctionId, initSocket]);

  // Query tournament teams with purchases for accurate, instant squad inspection
  const { data: tournamentTeamsData, refetch: refetchTeams } = useQuery({
    queryKey: ['tournament-teams', snapshot?.tournamentId],
    queryFn: async () => {
      if (!snapshot?.tournamentId) return [];
      const res: any = await api.get(`/teams/tournament/${snapshot.tournamentId}`);
      return res.data || [];
    },
    enabled: !!snapshot?.tournamentId,
    refetchInterval: 3000
  });

  // Query all tournament players for the Player Directory modal
  const { data: tournamentPlayersData, refetch: refetchPlayers } = useQuery({
    queryKey: ['tournament-players', snapshot?.tournamentId],
    queryFn: async () => {
      if (!snapshot?.tournamentId) return [];
      const res: any = await api.get(`/players/tournament/${snapshot.tournamentId}`);
      return res.data || [];
    },
    enabled: !!snapshot?.tournamentId,
    refetchInterval: 3000
  });

  // Set default selected team if none is selected
  useEffect(() => {
    if (snapshot?.teams && snapshot.teams.length > 0 && !selectedTeamId) {
      const rblTeam = snapshot.teams.find((t) => t.abbreviation === 'RBL');
      setSelectedTeamId(rblTeam ? rblTeam.teamId : snapshot.teams[0].teamId);
    }
  }, [snapshot?.teams, selectedTeamId]);

  // Countdown timer local tick
  useEffect(() => {
    if (!snapshot || snapshot.isPaused || snapshot.status !== AuctionStatus.LIVE) return;

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [snapshot]);

  // Reset countdown when lot or current bid updates
  useEffect(() => {
    setCountdown(30);
  }, [snapshot?.currentLot?.lotId, snapshot?.currentLot?.currentBid]);

  // Trigger celebratory confetti on SOLD
  const triggerConfetti = () => {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FF183D', '#126BFF', '#22C55E', '#FFFFFF', '#F59E0B']
    });
  };

  // Actions
  const handleStart = async () => {
    try {
      await api.post(`/auctions/${auctionId}/start`);
      refetchTeams();
      refetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Error starting auction');
    }
  };

  const handleTogglePause = async () => {
    if (!snapshot) return;
    try {
      if (snapshot.isPaused) {
        await api.post(`/auctions/${auctionId}/resume`);
      } else {
        await api.post(`/auctions/${auctionId}/pause`);
      }
    } catch (err: any) {
      alert(err.message || 'Error pausing/resuming auction');
    }
  };

  const handleNextPlayer = async () => {
    try {
      await api.post(`/auctions/${auctionId}/next-player`);
      refetchTeams();
      refetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Error moving to next player');
    }
  };

  const handleRegisterPaddleBid = async (teamId: string, amount?: number) => {
    if (!snapshot?.currentLot) return;
    setIsSubmitting(true);
    try {
      const bidAmount = amount || (customBidAmount ? Number(customBidAmount) : snapshot.nextBidAmount);
      await api.post(`/auctions/${auctionId}/bids`, {
        lotId: snapshot.currentLot.lotId,
        teamId,
        bidAmount,
        bidSource: BidSource.HOST_MANUAL
      });
      setCustomBidAmount('');
      setShowCustomInput(false);
    } catch (err: any) {
      alert(err.message || 'Bid rejected by server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSold = async () => {
    if (!snapshot?.currentLot) return;
    const buyerTeamId = selectedTeamId || snapshot.currentLot.highestBidderTeamId;
    if (!buyerTeamId && snapshot.currentLot.bidsCount === 0) {
      alert('Cannot mark SOLD without at least one bid or a selected buyer team.');
      return;
    }

    try {
      const winningTeam = snapshot.teams.find((t) => t.teamId === buyerTeamId);
      await api.post(`/auctions/${auctionId}/sold`, {
        lotId: snapshot.currentLot.lotId,
        teamId: buyerTeamId
      });

      setLastSoldData({
        playerName: snapshot.currentLot.player.fullName,
        price: snapshot.currentLot.currentBid || snapshot.currentLot.basePrice,
        teamName: winningTeam?.name || 'Selected Franchise',
        teamColor: winningTeam?.color || '#2563EB',
        teamAbbr: winningTeam?.abbreviation || 'WIN'
      });

      setShowSoldModal(true);
      triggerConfetti();

      // Refresh squad and player state immediately
      refetchTeams();
      refetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to mark SOLD');
    }
  };

  const handleUnsold = async () => {
    if (!snapshot?.currentLot) return;
    try {
      await api.post(`/auctions/${auctionId}/unsold`, {
        lotId: snapshot.currentLot.lotId
      });
      refetchTeams();
      refetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to mark UNSOLD');
    }
  };

  const handleConfirmUndo = async () => {
    if (!snapshot?.currentLot) return;
    try {
      await api.post(`/auctions/${auctionId}/reverse-action`, {
        lotId: snapshot.currentLot.lotId,
        reason: undoReason
      });
      setShowUndoModal(false);
      refetchTeams();
      refetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to reverse action');
    }
  };

  // Keyboard Shortcuts listener (1-4 teams, Space pause, S sold, U undo, N next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSold();
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        setShowUndoModal(true);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextPlayer();
      } else if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (snapshot?.teams[index]) {
          setSelectedTeamId(snapshot.teams[index].teamId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snapshot, selectedTeamId]);

  const currentLot = snapshot?.currentLot;
  const player = currentLot?.player;
  const teams = snapshot?.teams || [];
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) || teams[0];

  // Effective bid amount
  const effectiveRaiseAmount = customBidAmount ? Number(customBidAmount) : snapshot?.nextBidAmount || 5000;

  // Countdown timer circle math
  const timerRadius = 34;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerOffset = timerCircumference - (countdown / 30) * timerCircumference;

  // -------------------------------------------------------------
  // Data resolution for VIEW SQUAD modal
  // -------------------------------------------------------------
  const detailedSquadTeam = useMemo(() => {
    if (!viewSquadTeam) return null;
    const fullTeam = (tournamentTeamsData || []).find((t: any) => t.id === viewSquadTeam.teamId || t.name === viewSquadTeam.name);
    return fullTeam || viewSquadTeam;
  }, [viewSquadTeam, tournamentTeamsData]);

  const squadPurchases = useMemo(() => {
    if (!detailedSquadTeam?.purchases) return [];
    if (squadRoleFilter === 'ALL') return detailedSquadTeam.purchases;
    return detailedSquadTeam.purchases.filter((p: any) => p.player?.role === squadRoleFilter);
  }, [detailedSquadTeam, squadRoleFilter]);

  const squadRoleCounts = useMemo(() => {
    const list = detailedSquadTeam?.purchases || [];
    return {
      all: list.length,
      batsman: list.filter((p: any) => p.player?.role === 'BATSMAN').length,
      bowler: list.filter((p: any) => p.player?.role === 'BOWLER').length,
      allRounder: list.filter((p: any) => p.player?.role === 'ALL_ROUNDER').length,
      wicketKeeper: list.filter((p: any) => p.player?.role === 'WICKET_KEEPER').length,
    };
  }, [detailedSquadTeam]);

  // -------------------------------------------------------------
  // Data resolution for VIEW PLAYERS directory modal
  // -------------------------------------------------------------
  const allPlayersList: any[] = tournamentPlayersData || [];

  const filteredPlayers = useMemo(() => {
    return allPlayersList
      .filter((p) => {
        // Search filter
        if (playerSearch) {
          const q = playerSearch.toLowerCase();
          const matchName = p.fullName?.toLowerCase().includes(q);
          const matchCity = p.city?.toLowerCase().includes(q);
          if (!matchName && !matchCity) return false;
        }
        // Role filter
        if (playerRoleFilter !== 'ALL' && p.role !== playerRoleFilter) return false;
        // Category filter
        if (playerCategoryFilter !== 'ALL' && p.playerCategory !== playerCategoryFilter) return false;
        // Status filter
        const isSold = p.purchases && p.purchases.length > 0;
        if (playerStatusFilter === 'AVAILABLE' && isSold) return false;
        if (playerStatusFilter === 'SOLD' && !isSold) return false;
        return true;
      })
      .sort((a, b) => {
        if (playerSortBy === 'NAME') return a.fullName.localeCompare(b.fullName);
        if (playerSortBy === 'PRICE_HIGH') return Number(b.basePrice) - Number(a.basePrice);
        if (playerSortBy === 'PRICE_LOW') return Number(a.basePrice) - Number(b.basePrice);
        return 0;
      });
  }, [allPlayersList, playerSearch, playerRoleFilter, playerCategoryFilter, playerStatusFilter, playerSortBy]);

  return (
    <div className="min-h-screen bg-[#020D25] text-white flex flex-col justify-between select-none overflow-x-hidden relative font-sans stadium-bg pb-6">
      {/* Stadium Ambient Floodlights */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] floodlight-left opacity-90" />
        <div className="absolute top-0 right-0 w-full h-[600px] floodlight-right opacity-90" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] stadium-center-flare opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-emerald-950/40 via-emerald-900/10 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen justify-between px-4 sm:px-6 lg:px-8 max-w-[1700px] mx-auto w-full">
        {/* ======================================================== */}
        {/* 1. TOP HEADER — TOURNAMENT BRANDING                     */}
        {/* ======================================================== */}
        <header className="pt-4 pb-3 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-blue-500/20">
          {/* LEFT: Organization Logo & Identity */}
          <div className="flex items-center gap-3.5">
            <img
              src="/images/gokul/kvo_mandal_logo.png"
              alt="Shree Goregaon KVO Jain Pragati Mandal"
              className="w-13 h-13 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            />
            <div className="text-left">
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white leading-tight">
                SHREE GOREGAON KVO
              </h2>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white leading-tight">
                JAIN PRAGATI MANDAL
              </h2>
              <p className="text-[10px] text-sky-200/90 italic font-semibold tracking-wide">
                GKUG – Goregaon Kutchi United Group
              </p>
              <div className="inline-block mt-0.5">
                <span className="bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,24,61,0.6)] border border-red-300/30">
                  PRESENTS
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: GOKUL CUP SEASON 2 TOURNAMENT LOGO */}
          <div className="flex items-center justify-center gap-3 text-center my-1">
            <div className="hidden sm:block relative w-12 h-14">
              <svg viewBox="0 0 100 120" className="w-full h-full text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] fill-current">
                <path d="M50 5 C55 5, 58 8, 58 13 C58 18, 55 22, 50 22 C45 22, 42 18, 42 13 C42 8, 45 5, 50 5 Z M35 30 L60 25 L85 10 L89 16 L65 34 L62 48 L80 85 L70 90 L52 55 L42 95 L30 95 L40 45 L32 40 Z" />
                <path d="M60 25 L92 8 L96 14 L68 32 Z" fill="#FFFFFF" />
              </svg>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                  GOKUL CUP
                </h1>
                <div className="relative text-yellow-300 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">
                  <Trophy className="w-7 h-7 sm:w-9 sm:h-9" />
                </div>
              </div>

              <div className="relative -mt-1 px-6 py-0.5 bg-gradient-to-r from-transparent via-[#FF183D] to-transparent text-white font-black italic tracking-wider text-xs sm:text-sm uppercase drop-shadow-md">
                <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">SEASON 2</span>
              </div>

              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-white/90 mt-1">
                CRICKET TOURNAMENT AUCTION
              </span>
            </div>
          </div>

          {/* RIGHT: AUCTIONEER CONSOLE & LIVE BADGE */}
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-2.5">
              <span className="text-base sm:text-lg font-black italic uppercase tracking-wider text-white">
                AUCTIONEER CONSOLE
              </span>
              <div className="bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white text-[11px] font-black tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,24,61,0.7)] border border-red-300/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
              {snapshot?.tournamentName || 'Mumbai Premier League 2027'} – Version v5.2
            </p>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 2. CONTROL BAR                                          */}
        {/* ======================================================== */}
        <section className="my-3 bg-[#061533]/90 border border-[#126BFF]/40 rounded-2xl px-4 py-2 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          {/* Left: Mode Buttons & Player Directory Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-200 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5 text-sky-400" />
              <span>AUCTION MODE</span>
            </button>

            <button
              onClick={handleTogglePause}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,24,61,0.5)] border border-red-400/40 transition-all cursor-pointer ${
                snapshot?.isPaused
                  ? 'bg-amber-600 text-white'
                  : 'bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{snapshot?.isPaused ? 'PAUSED' : 'LIVE AUCTION'}</span>
            </button>

            <button
              onClick={() => setShowPlayersModal(true)}
              className="px-3.5 py-1.5 bg-[#0a1e45] hover:bg-[#126BFF]/30 text-sky-300 hover:text-white border border-[#126BFF]/50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>ALL PLAYERS ({allPlayersList.length})</span>
            </button>
          </div>

          {/* Right: Keyboard Shortcut Pills & Settings */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <div className="hidden lg:flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#07193b] rounded-lg border border-blue-500/20 text-[11px] font-mono">
                [1-4] Team
              </span>
              <button
                onClick={handleTogglePause}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-[#0b2452] rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors cursor-pointer"
              >
                [Space] Pause
              </button>
              <button
                onClick={handleSold}
                disabled={!currentLot}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-emerald-900/60 rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors cursor-pointer"
              >
                [S] Sold
              </button>
              <button
                onClick={() => setShowUndoModal(true)}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-[#0b2452] rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors cursor-pointer"
              >
                [U] Undo
              </button>
              <button
                onClick={handleNextPlayer}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-sky-900/60 rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors cursor-pointer"
              >
                [N] Next
              </button>
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 bg-[#0a1e45] hover:bg-[#0e2759] border border-blue-500/30 rounded-xl text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. MAIN 3-COLUMN AUCTION DASHBOARD CONTAINER             */}
        {/* ======================================================== */}
        <main className="dashboard-glow-border bg-[#040f26]/95 rounded-3xl p-4 sm:p-5 shadow-2xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-stretch">
            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: PLAYER SPOTLIGHT (3.5 cols / ~29%)      */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-4 xl:col-span-3 bg-[#061638]/90 border border-[#126BFF]/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              {player ? (
                <div className="space-y-3.5">
                  {/* Player Image with LOT Ribbon & Energy Streaks */}
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-tr from-[#020b1f] to-[#0a2352] border border-[#126BFF]/50 shadow-inner">
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/30 via-blue-600/10 to-transparent" />
                      <div className="absolute top-0 -left-10 w-24 h-full bg-gradient-to-r from-red-600/40 to-transparent transform -skew-x-25" />
                      <div className="absolute top-0 -right-10 w-24 h-full bg-gradient-to-l from-red-600/40 to-transparent transform skew-x-25" />
                    </div>

                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.fullName}
                        className="w-full h-full object-cover relative z-10"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-5xl text-sky-400 bg-gradient-to-tr from-[#020b1e] via-[#092250] to-[#0e3170] relative z-10">
                        {player.fullName.charAt(0)}
                      </div>
                    )}

                    {/* Top Left Red Ribbon: LOT # & MARQUEE */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg border border-red-300/40">
                      <Crown className="w-3 h-3 text-yellow-300 fill-current" />
                      <span>LOT #{currentLot.sequenceOrder} • {player.category || 'MARQUEE'}</span>
                    </div>
                  </div>

                  {/* Player Name & Role */}
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                      {player.fullName}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="bg-[#FF183D] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,24,61,0.5)]">
                        {player.role.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-300 font-medium">
                        • Bats: <strong className="text-white font-bold">{player.battingStyle?.replace(/_/g, ' ') || 'Right'}</strong> • Bowl: <strong className="text-white font-bold">{player.bowlingStyle?.replace(/_/g, ' ') || 'Right'}</strong> • Age: <strong className="text-white font-bold">{player.age || 28}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 3 × 2 Cricket Performance Statistics Matrix */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="bg-[#081d45] border border-[#126BFF]/40 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        MATCHES
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.matches ?? 45}
                      </span>
                    </div>

                    <div className="bg-[#081d45] border border-[#126BFF]/40 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        RUNS
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.runs ?? 980}
                      </span>
                    </div>

                    <div className="bg-[#081d45] border border-[#126BFF]/40 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        WICKETS
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.wickets ?? 38}
                      </span>
                    </div>

                    <div className="bg-[#081d45] border border-[#126BFF]/40 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        AVG
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.battingAverage ?? '32.6'}
                      </span>
                    </div>

                    <div className="bg-[#081d45] border border-[#126BFF]/40 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        SR
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.strikeRate ?? '154.2'}
                      </span>
                    </div>

                    <div className="bg-[#081d45] border border-[#126BFF]/40 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        ECON
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.economy ?? '7.9'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <User className="w-12 h-12 text-sky-400 mb-2" />
                  <p className="text-sm font-black text-white">No Active Player Lot</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Click "Next Player" or "Live Auction" to call the next cricketer to the podium.
                  </p>
                </div>
              )}

              {/* Base Price Strip */}
              {currentLot && (
                <div className="mt-3 pt-2.5 border-t border-[#126BFF]/30 flex items-center justify-between bg-[#081d45]/80 px-3 py-2 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    BASE PRICE
                  </span>
                  <span className="text-xl font-black text-white tabular-nums">
                    ₹{currentLot.basePrice.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* MIDDLE COLUMN: LIVE BIDDING ARENA (5.5 cols / ~43%)   */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-5 xl:col-span-5 bg-[#06183e]/90 border border-[#126BFF]/50 rounded-2xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 bg-gradient-to-b from-[#126BFF]/20 to-transparent blur-2xl pointer-events-none" />

              {currentLot ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between relative z-10">
                  {/* Top: CURRENT HIGHEST BID with Silver Laurel Wreaths */}
                  <div className="text-center">
                    <div className="inline-block px-4 py-1 bg-[#071d47] border border-[#126BFF]/40 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-sky-300 shadow-inner">
                      CURRENT HIGHEST BID
                    </div>

                    <div className="flex items-center justify-center gap-3 my-1">
                      <svg viewBox="0 0 40 80" className="w-7 sm:w-9 h-14 sm:h-18 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] fill-current shrink-0">
                        <path d="M35,75 C25,60 15,40 20,10 C22,7 26,9 24,12 C18,30 22,50 30,65 Z" />
                        <path d="M22,20 C10,22 5,15 10,8 C15,10 18,15 22,20 Z" />
                        <path d="M18,34 C6,34 2,27 8,20 C13,22 15,28 18,34 Z" />
                        <path d="M18,48 C6,46 3,39 9,33 C14,35 15,42 18,48 Z" />
                        <path d="M22,62 C11,58 9,51 15,46 C19,48 20,55 22,62 Z" />
                      </svg>

                      <div className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white tabular-nums drop-shadow-[0_4px_20px_rgba(18,107,255,0.7)]">
                        ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
                      </div>

                      <svg viewBox="0 0 40 80" className="w-7 sm:w-9 h-14 sm:h-18 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] fill-current transform scale-x-[-1] shrink-0">
                        <path d="M35,75 C25,60 15,40 20,10 C22,7 26,9 24,12 C18,30 22,50 30,65 Z" />
                        <path d="M22,20 C10,22 5,15 10,8 C15,10 18,15 22,20 Z" />
                        <path d="M18,34 C6,34 2,27 8,20 C13,22 15,28 18,34 Z" />
                        <path d="M18,48 C6,46 3,39 9,33 C14,35 15,42 18,48 Z" />
                        <path d="M22,62 C11,58 9,51 15,46 C19,48 20,55 22,62 Z" />
                      </svg>
                    </div>

                    <div className="text-xs font-semibold text-slate-300">
                      {currentLot.highestBidderTeamName ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#092250] rounded-full border border-blue-400/40">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                          />
                          <span className="font-bold text-white">
                            Held by {currentLot.highestBidderTeamName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">Opening Base Price • Awaiting First Bid</span>
                      )}
                    </div>
                  </div>

                  {/* CENTER: Countdown Timer & Next Minimum Bid */}
                  <div className="grid grid-cols-2 gap-4 items-center bg-[#051330]/80 p-3.5 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative w-18 h-18 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="36"
                            cy="36"
                            r={timerRadius}
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            className="text-[#0c285d]"
                          />
                          <circle
                            cx="36"
                            cy="36"
                            r={timerRadius}
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={timerCircumference}
                            strokeDashoffset={timerOffset}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ${
                              countdown <= 5 ? 'text-[#FF183D]' : 'text-sky-400'
                            }`}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className={`text-xl font-black tabular-nums ${countdown <= 5 ? 'text-[#FF183D] animate-pulse' : 'text-white'}`}>
                            {countdown}s
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                            COUNTDOWN
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left border-l border-blue-500/20 pl-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                        NEXT MINIMUM BID
                      </span>
                      <div className="text-3xl font-black text-[#FF183D] tabular-nums tracking-tight drop-shadow-[0_0_12px_rgba(255,24,61,0.5)]">
                        ₹{snapshot.nextBidAmount.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 italic">
                        (or higher valid increment)
                      </span>
                    </div>
                  </div>

                  {/* Bidding Control Panel */}
                  <div className="bg-[#051330] p-4 rounded-2xl border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                        SELECTED PADDLE TEAM
                      </span>
                      {selectedTeam ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/70 border border-red-500/50 text-white font-bold text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: selectedTeam.color || '#FF183D' }}
                          />
                          <span>{selectedTeam.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400 font-semibold">Select team from right panel</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => {
                          if (selectedTeamId) handleRegisterPaddleBid(selectedTeamId, effectiveRaiseAmount);
                        }}
                        disabled={!selectedTeamId || isSubmitting || snapshot.isPaused}
                        className="btn-neon-red flex-1 py-3.5 px-5 rounded-xl font-black text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Gavel className="w-5 h-5 shrink-0" />
                        <span>RAISE BID TO ₹{effectiveRaiseAmount.toLocaleString()} &gt;&gt;</span>
                      </button>

                      <button
                        onClick={() => setShowCustomInput(!showCustomInput)}
                        className={`px-4 py-3.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          showCustomInput || customBidAmount
                            ? 'bg-[#126BFF] border-sky-400 text-white shadow-[0_0_15px_rgba(18,107,255,0.6)]'
                            : 'bg-[#081d45] border-blue-500/30 text-slate-200 hover:text-white'
                        }`}
                        title="Enter Custom Bid Amount"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>CUSTOM ₹</span>
                      </button>
                    </div>

                    {showCustomInput && (
                      <div className="flex items-center gap-2 p-2 bg-[#081d45] rounded-xl border border-blue-500/40 animate-fade-in">
                        <span className="text-xs font-bold text-slate-300 pl-2">Custom Amount: ₹</span>
                        <input
                          type="number"
                          autoFocus
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value ? Number(e.target.value) : '')}
                          placeholder="e.g. 7500"
                          className="w-full px-3 py-1.5 bg-[#040f26] border border-blue-400/40 rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                        <button
                          onClick={() => {
                            if (selectedTeamId && customBidAmount) {
                              handleRegisterPaddleBid(selectedTeamId, Number(customBidAmount));
                            }
                          }}
                          disabled={!customBidAmount || !selectedTeamId}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Live Bid Stream */}
                  <div className="h-24 bg-[#051330]/70 p-3 rounded-2xl border border-blue-500/20 flex flex-col justify-between overflow-hidden relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span>LIVE BID STREAM ({currentLot.bidHistory.length})</span>
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1">
                      {currentLot.bidHistory.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                          <span>No bids placed for this lot yet.</span>
                        </div>
                      ) : (
                        currentLot.bidHistory.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[#071d47]/80 border border-blue-500/20"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: b.teamColor || '#3B82F6' }}
                              />
                              <span className="font-bold text-white">{b.teamName}</span>
                            </div>
                            <span className="font-black text-sky-300 tabular-nums">
                              ₹{b.bidAmount.toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <Gavel className="w-16 h-16 text-blue-900/15 absolute right-3 bottom-1 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-20 h-20 rounded-3xl bg-[#092250] flex items-center justify-center text-sky-400 mb-4 shadow-inner">
                    <Gavel className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-white">Live Bidding Stage</h3>
                  <p className="text-xs mt-1.5 max-w-sm text-slate-400">
                    Connect multiple devices simultaneously. Spectators, team owners, and projectors update in real-time.
                  </p>
                  <button
                    onClick={handleStart}
                    className="mt-5 btn-neon-red px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>START LIVE AUCTION</span>
                  </button>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: FRANCHISE TEAMS (4) (3 cols / ~28%)     */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-3 xl:col-span-4 bg-[#061638]/90 border border-[#126BFF]/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/20">
                  <h3 className="font-black text-sm text-white tracking-wide flex items-center gap-1.5 uppercase">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>FRANCHISE TEAMS ({teams.length || 4})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Press 1-4 to select
                  </span>
                </div>

                {/* 4 Team Cards Stacked with Compact Squad & Player Actions */}
                <div className="space-y-3">
                  {teams.map((t, idx) => {
                    const isSelected = selectedTeamId === t.teamId;

                    return (
                      <div
                        key={t.teamId}
                        onClick={() => setSelectedTeamId(t.teamId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'team-card-selected-red'
                            : 'bg-[#081d45]/80 border-blue-500/25 hover:border-blue-400/50 hover:bg-[#0b275c]'
                        }`}
                      >
                        {/* Upper row: Team initials, name, squad, purse */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0">
                              [{idx + 1}]
                            </span>

                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md shrink-0 border border-white/20"
                              style={{ backgroundColor: t.color || '#2563EB' }}
                            >
                              {t.abbreviation}
                            </div>

                            <div className="truncate">
                              <h4 className="font-black text-xs sm:text-sm text-white leading-tight truncate">
                                {t.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Squad: <strong className="text-white">{t.squadCount}</strong>/{t.maxSquadLimit || 15}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">
                              PURSE
                            </span>
                            <span className="text-xs sm:text-sm font-black text-white tabular-nums">
                              ₹{t.remainingPurse.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Lower action row: VIEW SQUAD & VIEW PLAYERS */}
                        <div className="mt-2.5 pt-2 border-t border-blue-500/20 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewSquadTeam(t);
                              setSquadRoleFilter('ALL');
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-[#071d47]/90 hover:bg-[#126BFF]/30 text-sky-300 hover:text-white border border-[#126BFF]/40 hover:border-sky-400 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                            title={`View ${t.name} purchased squad`}
                          >
                            <Users className="w-3 h-3 text-sky-400" />
                            <span>VIEW SQUAD</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPlayersModal(true);
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-[#071d47]/90 hover:bg-[#FF183D]/25 text-slate-300 hover:text-white border border-blue-500/30 hover:border-red-400 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                            title="Browse all tournament players directory"
                          >
                            <User className="w-3 h-3 text-red-400" />
                            <span>VIEW PLAYERS</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Summary Bar: Remaining Lots & Sold Count */}
              <div className="mt-4 pt-3 border-t border-blue-500/20 flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Remaining Lots: <strong className="text-white">{snapshot?.nextLots.length || 7}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sold: <strong className="text-white">{snapshot?.recentSoldLots.length || 0}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ======================================================== */}
        {/* 4. DEDICATED SPONSORS SECTION — BELOW DASHBOARD         */}
        {/* ======================================================== */}
        <section className="mt-5 mb-2 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-red-500 font-black tracking-widest text-sm">///</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              OUR SPONSORS
            </h3>
            <span className="text-red-500 font-black tracking-widest text-sm">///</span>
          </div>

          <div className="sponsor-bar-glow w-full bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-between px-6 sm:px-12 py-3 shadow-2xl">
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-r from-[#FF183D] via-[#126BFF] to-transparent transform -skew-x-25 -ml-8 pointer-events-none opacity-90" />

            {/* Sponsor 1: GOKUL OPTICS */}
            <div className="flex-1 flex items-center justify-center relative z-10 py-1">
              <img
                src="/images/gokul/gokul_optics.png"
                alt="GOKUL OPTICS - A vision ahead"
                className="h-12 sm:h-16 w-auto object-contain max-w-[260px] drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>

            <div className="h-12 w-px bg-slate-300 relative z-10 mx-4" />

            {/* Sponsor 2: GOKUL BAGS */}
            <div className="flex-1 flex items-center justify-center relative z-10 py-1">
              <img
                src="/images/gokul/gokul_bags.png"
                alt="GOKUL BAGS - Miles ahead"
                className="h-12 sm:h-16 w-auto object-contain max-w-[260px] drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-[#FF183D] via-[#126BFF] to-transparent transform skew-x-25 -mr-8 pointer-events-none opacity-90" />
          </div>
        </section>
      </div>

      {/* ======================================================== */}
      {/* 5. FOREGROUND CRICKET DECORATIONS                        */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-3 pointer-events-none z-30 opacity-90 hidden sm:block">
        <svg width="90" height="120" viewBox="0 0 100 130" className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          <rect x="20" y="25" width="8" height="100" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="22" y="28" width="3" height="92" fill="#FDE047" opacity="0.6" />
          <rect x="46" y="25" width="8" height="100" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="48" y="28" width="3" height="92" fill="#FDE047" opacity="0.6" />
          <rect x="72" y="25" width="8" height="100" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="74" y="28" width="3" height="92" fill="#FDE047" opacity="0.6" />
          <rect x="16" y="19" width="36" height="5" rx="2" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <rect x="48" y="19" width="36" height="5" rx="2" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
        </svg>
      </div>

      <div className="fixed bottom-1 right-4 pointer-events-none z-30 opacity-95 hidden sm:block">
        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]">
          <circle cx="50" cy="50" r="44" fill="url(#ballGradient)" stroke="#88081a" strokeWidth="2" />
          <path
            d="M 22 25 Q 50 50 78 75"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeDasharray="2,3"
            fill="none"
          />
          <path
            d="M 20 23 Q 48 48 76 73"
            stroke="#55000d"
            strokeWidth="1"
            fill="none"
          />
          <ellipse cx="40" cy="30" rx="14" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-30 40 30)" />
          <defs>
            <radialGradient id="ballGradient" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#FF3855" />
              <stop offset="50%" stopColor="#C70020" />
              <stop offset="100%" stopColor="#55000e" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* ======================================================== */}
      {/* 6. MODAL: VIEW SQUAD FOR FRANCHISE TEAM                  */}
      {/* ======================================================== */}
      {viewSquadTeam && detailedSquadTeam && (
        <Modal
          isOpen={!!viewSquadTeam}
          onClose={() => setViewSquadTeam(null)}
          theme="dark"
          maxWidth="2xl"
          title={
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md border border-white/20 shrink-0"
                style={{ backgroundColor: detailedSquadTeam.color || '#2563EB' }}
              >
                {detailedSquadTeam.abbreviation}
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight">{detailedSquadTeam.name}</span>
                <span className="text-xs text-sky-400 font-bold ml-2 uppercase">Squad Roster</span>
              </div>
            </div>
          }
          subtitle="Real-time acquired player breakdown and purse expenditure"
        >
          <div className="space-y-5">
            {/* Franchise Purse & Squad Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#071d47] p-3 rounded-2xl border border-blue-500/30">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                  Squad Size
                </span>
                <span className="text-lg font-black text-white tabular-nums">
                  {detailedSquadTeam.purchases?.length || detailedSquadTeam.squadCount || 0} / {detailedSquadTeam.maxSquadLimit || 15}
                </span>
              </div>

              <div className="bg-[#071d47] p-3 rounded-2xl border border-blue-500/30">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                  Remaining Purse
                </span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">
                  ₹{Number(detailedSquadTeam.remainingPurse).toLocaleString()}
                </span>
              </div>

              <div className="bg-[#071d47] p-3 rounded-2xl border border-blue-500/30">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                  Spent Purse
                </span>
                <span className="text-lg font-black text-rose-400 tabular-nums">
                  ₹{Number(detailedSquadTeam.spentPurse || (Number(detailedSquadTeam.initialPurse || 50000) - Number(detailedSquadTeam.remainingPurse))).toLocaleString()}
                </span>
              </div>

              <div className="bg-[#071d47] p-3 rounded-2xl border border-blue-500/30">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">
                  Initial Budget
                </span>
                <span className="text-lg font-black text-sky-300 tabular-nums">
                  ₹{Number(detailedSquadTeam.initialPurse || 50000).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Role Filter Chips Bar */}
            <div className="flex items-center gap-1.5 flex-wrap pb-1 border-b border-blue-500/20">
              <button
                type="button"
                onClick={() => setSquadRoleFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  squadRoleFilter === 'ALL'
                    ? 'bg-[#126BFF] text-white shadow-[0_0_12px_rgba(18,107,255,0.6)]'
                    : 'bg-[#081d45] text-slate-300 hover:text-white border border-blue-500/30'
                }`}
              >
                All ({squadRoleCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setSquadRoleFilter('BATSMAN')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  squadRoleFilter === 'BATSMAN'
                    ? 'bg-[#126BFF] text-white shadow-[0_0_12px_rgba(18,107,255,0.6)]'
                    : 'bg-[#081d45] text-slate-300 hover:text-white border border-blue-500/30'
                }`}
              >
                Batsmen ({squadRoleCounts.batsman})
              </button>
              <button
                type="button"
                onClick={() => setSquadRoleFilter('BOWLER')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  squadRoleFilter === 'BOWLER'
                    ? 'bg-[#126BFF] text-white shadow-[0_0_12px_rgba(18,107,255,0.6)]'
                    : 'bg-[#081d45] text-slate-300 hover:text-white border border-blue-500/30'
                }`}
              >
                Bowlers ({squadRoleCounts.bowler})
              </button>
              <button
                type="button"
                onClick={() => setSquadRoleFilter('ALL_ROUNDER')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  squadRoleFilter === 'ALL_ROUNDER'
                    ? 'bg-[#126BFF] text-white shadow-[0_0_12px_rgba(18,107,255,0.6)]'
                    : 'bg-[#081d45] text-slate-300 hover:text-white border border-blue-500/30'
                }`}
              >
                All Rounders ({squadRoleCounts.allRounder})
              </button>
              <button
                type="button"
                onClick={() => setSquadRoleFilter('WICKET_KEEPER')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  squadRoleFilter === 'WICKET_KEEPER'
                    ? 'bg-[#126BFF] text-white shadow-[0_0_12px_rgba(18,107,255,0.6)]'
                    : 'bg-[#081d45] text-slate-300 hover:text-white border border-blue-500/30'
                }`}
              >
                Wicket Keepers ({squadRoleCounts.wicketKeeper})
              </button>
            </div>

            {/* Squad Players List / Empty State */}
            {squadPurchases.length > 0 ? (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {squadPurchases.map((purchase: any) => {
                  const p = purchase.player || purchase;
                  return (
                    <div
                      key={purchase.id || p.id}
                      className="p-3 bg-[#081d45]/90 rounded-2xl border border-blue-500/30 flex items-center justify-between gap-4 hover:border-sky-400/60 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.fullName}
                            className="w-12 h-12 rounded-xl object-cover border border-[#126BFF]/40 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-900 text-sky-300 font-black text-lg flex items-center justify-center shrink-0 border border-blue-500/30">
                            {p.fullName?.charAt(0) || 'P'}
                          </div>
                        )}

                        <div className="truncate">
                          <h4 className="font-black text-sm text-white tracking-tight leading-tight truncate">
                            {p.fullName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-[#FF183D] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                              {String(p.role).replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30">
                              {p.playerCategory || 'Regular'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                          PURCHASE PRICE
                        </span>
                        <span className="text-base font-black text-emerald-400 tabular-nums">
                          ₹{Number(purchase.purchasePrice || p.purchasePrice || p.basePrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 px-6 text-center bg-[#07193b]/60 rounded-3xl border border-dashed border-blue-500/30 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0a2352] text-sky-400 flex items-center justify-center mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-white">No Players Acquired Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {squadRoleFilter === 'ALL'
                    ? `${detailedSquadTeam.name} has not acquired any players in the auction so far.`
                    : `No ${squadRoleFilter.replace(/_/g, ' ')} players have been acquired by ${detailedSquadTeam.name}.`}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewSquadTeam(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Squad Roster
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: VIEW PLAYERS DIRECTORY (ALL PLAYERS)          */}
      {/* ======================================================== */}
      {showPlayersModal && (
        <Modal
          isOpen={showPlayersModal}
          onClose={() => setShowPlayersModal(false)}
          theme="dark"
          maxWidth="4xl"
          title={
            <div className="flex items-center gap-2.5">
              <Users className="w-6 h-6 text-sky-400" />
              <span className="text-xl font-black text-white tracking-tight uppercase">Tournament Player Directory</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600/30 text-sky-300 border border-blue-500/40">
                {filteredPlayers.length} / {allPlayersList.length} Players
              </span>
            </div>
          }
          subtitle="Explore all registered cricket players, base prices, categories, and real-time live auction allocation"
        >
          <div className="space-y-4">
            {/* Search and Filters Toolbar */}
            <div className="bg-[#071d47] p-3.5 rounded-2xl border border-blue-500/30 flex flex-wrap items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Search player name or city..."
                  className="w-full pl-9 pr-8 py-1.5 bg-[#040f26] border border-blue-500/30 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                {playerSearch && (
                  <button
                    onClick={() => setPlayerSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <select
                value={playerRoleFilter}
                onChange={(e) => setPlayerRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#040f26] border border-blue-500/30 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="BATSMAN">Batsman</option>
                <option value="BOWLER">Bowler</option>
                <option value="ALL_ROUNDER">All Rounder</option>
                <option value="WICKET_KEEPER">Wicket Keeper</option>
              </select>

              {/* Category Filter */}
              <select
                value={playerCategoryFilter}
                onChange={(e) => setPlayerCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#040f26] border border-blue-500/30 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Marquee">Marquee</option>
                <option value="A-Grade">A-Grade</option>
                <option value="B-Grade">B-Grade</option>
                <option value="Regular">Regular</option>
              </select>

              {/* Status Filter */}
              <div className="flex items-center bg-[#040f26] p-0.5 rounded-xl border border-blue-500/30 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPlayerStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    playerStatusFilter === 'ALL' ? 'bg-[#126BFF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerStatusFilter('AVAILABLE')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    playerStatusFilter === 'AVAILABLE' ? 'bg-[#126BFF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  In Pool
                </button>
                <button
                  type="button"
                  onClick={() => setPlayerStatusFilter('SOLD')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    playerStatusFilter === 'SOLD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sold
                </button>
              </div>

              {/* Sort selector */}
              <select
                value={playerSortBy}
                onChange={(e) => setPlayerSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-[#040f26] border border-blue-500/30 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
              >
                <option value="NAME">Sort: Name (A-Z)</option>
                <option value="PRICE_HIGH">Sort: Base Price (High-Low)</option>
                <option value="PRICE_LOW">Sort: Base Price (Low-High)</option>
              </select>
            </div>

            {/* Players Table / Directory Grid */}
            {filteredPlayers.length > 0 ? (
              <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredPlayers.map((p) => {
                    const purchase = p.purchases?.[0];
                    const isSold = !!purchase;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isSold
                            ? 'bg-[#07193b]/70 border-emerald-500/40'
                            : 'bg-[#081d45]/90 border-blue-500/30 hover:border-sky-400'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.fullName}
                              className="w-12 h-12 rounded-xl object-cover border border-[#126BFF]/40 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-900 text-sky-300 font-black text-lg flex items-center justify-center shrink-0 border border-blue-500/30">
                              {p.fullName?.charAt(0) || 'P'}
                            </div>
                          )}

                          <div className="truncate">
                            <h4 className="font-black text-sm text-white tracking-tight leading-tight truncate">
                              {p.fullName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-[#FF183D] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                {String(p.role).replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/30">
                                {p.playerCategory || 'Regular'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Base: <strong className="text-white">₹{Number(p.basePrice).toLocaleString()}</strong>
                              {p.city && ` • ${p.city}`}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right shrink-0">
                          {isSold ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                <span>SOLD</span>
                              </span>
                              <span className="text-xs font-black text-white block">
                                {purchase.team?.name || 'Franchise'}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-400 block tabular-nums">
                                ₹{Number(purchase.purchasePrice).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-sky-300 border border-blue-500/40">
                              <Layers className="w-3 h-3 text-sky-400" />
                              <span>IN POOL</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-[#07193b]/60 rounded-3xl border border-dashed border-blue-500/30 flex flex-col items-center justify-center">
                <Search className="w-10 h-10 text-slate-400 mb-2" />
                <h4 className="text-base font-black text-white">No Players Found</h4>
                <p className="text-xs text-slate-400 mt-1">
                  No cricket players match your search filter criteria. Try clearing search or category filters.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPlayersModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* 8. CELEBRATORY SOLD MODAL & UNDO CONFIRMATION            */}
      {/* ======================================================== */}
      <Modal
        isOpen={showSoldModal}
        onClose={() => setShowSoldModal(false)}
        maxWidth="md"
        showCloseButton={false}
        theme="dark"
      >
        {lastSoldData && (
          <div className="text-center p-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(34,197,94,0.5)] mb-4">
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
              🎉 PLAYER OFFICIALLY SOLD!
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {lastSoldData.playerName}
            </h3>

            <div className="my-5 p-4 bg-[#071d47] rounded-2xl border border-blue-500/30 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Acquired By</span>
                <span className="text-base font-black text-white">{lastSoldData.teamName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Sale Price</span>
                <span className="text-xl font-black text-emerald-400 tabular-nums">
                  ₹{Number(lastSoldData.price).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Automated congratulations message dispatched via WhatsApp Cloud API &amp; email outbox.
            </p>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setShowSoldModal(false)}
            >
              Continue Auction
            </Button>
          </div>
        )}
      </Modal>

      {/* Undo Action Confirmation Modal */}
      <Modal
        isOpen={showUndoModal}
        onClose={() => setShowUndoModal(false)}
        title="Audited Action Reversal"
        subtitle="Reverse the last accepted bid or purchase. This operation will be logged in the audit trail."
        maxWidth="sm"
        theme="dark"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Reversal</label>
            <input
              type="text"
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              placeholder="e.g. Host accidental paddle tap"
              className="w-full px-3 py-2 bg-[#040f26] border border-blue-500/40 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-slate-800 text-white border-slate-700"
              onClick={() => setShowUndoModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={handleConfirmUndo}
            >
              Confirm Undo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Auctioneer Console Settings"
        subtitle="Configure auction modes, timer durations, and keyboard controls"
        maxWidth="md"
        theme="dark"
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#071d47] rounded-xl border border-blue-500/30">
            <span className="text-xs font-bold text-white block mb-1">Active Auction Mode</span>
            <p className="text-xs text-slate-400 mb-2">Toggle between Online, Offline/Paddle, and Hybrid modes.</p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Hybrid Mode</button>
              <button className="px-3 py-1.5 bg-[#040f26] text-slate-300 rounded-lg text-xs font-bold">Online Only</button>
              <button className="px-3 py-1.5 bg-[#040f26] text-slate-300 rounded-lg text-xs font-bold">Offline Paddle</button>
            </div>
          </div>

          <div className="p-3 bg-[#071d47] rounded-xl border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Automated Sound Alerts</span>
              <p className="text-[11px] text-slate-400">Play chime when new bid arrives or hammer drops</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setShowSettingsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
