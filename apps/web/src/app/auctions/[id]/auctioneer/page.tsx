'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuctionStore } from '@/stores/auctionStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { BidSource, LotStatus, AuctionStatus } from '@auctionos/shared';
import confetti from 'canvas-confetti';
import { playSoldSound } from '@/lib/audioEffects';
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
  Wallet,
  Volume2,
  VolumeX,
  Zap,
  ChevronDown
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TeamShield } from '@/components/ui/TeamShield';

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
  const [isSubmittingSold, setIsSubmittingSold] = useState(false);
  const [showSoldConfirmModal, setShowSoldConfirmModal] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [countdown, setCountdown] = useState<number>(15);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);
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

  // Authoritative countdown timer derived from server deadline (zero drift, handles pause, tab switches & expiry)
  useEffect(() => {
    if (!snapshot || snapshot.status !== AuctionStatus.LIVE || !snapshot.currentLot) {
      setCountdown(15);
      setIsTimeExpired(false);
      return;
    }

    if (snapshot.isPaused) {
      const remaining = typeof snapshot.countdownRemainingSeconds === 'number' ? snapshot.countdownRemainingSeconds : 0;
      setCountdown(Math.max(0, remaining));
      setIsTimeExpired(remaining <= 0);
      return;
    }

    const updateTimer = () => {
      if (!snapshot.countdownEndsAt) {
        const remaining = typeof snapshot.countdownRemainingSeconds === 'number' ? snapshot.countdownRemainingSeconds : 15;
        setCountdown(Math.max(0, remaining));
        setIsTimeExpired(remaining <= 0);
        return;
      }

      const deadline = new Date(snapshot.countdownEndsAt).getTime();
      const now = Date.now();
      const diffMs = deadline - now;
      const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

      setCountdown(diffSec);
      setIsTimeExpired(diffSec <= 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    const handleVisibility = () => {
      if (!document.hidden) updateTimer();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    snapshot?.countdownEndsAt,
    snapshot?.countdownRemainingSeconds,
    snapshot?.isPaused,
    snapshot?.status,
    snapshot?.currentLot?.lotId
  ]);

  // Auto-dismiss broadcast sold overlay after 4.5s
  useEffect(() => {
    if (showSoldModal) {
      const timer = setTimeout(() => {
        setShowSoldModal(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showSoldModal]);

  // Trigger celebratory confetti on SOLD
  const triggerConfetti = () => {
    confetti({
      particleCount: 160,
      spread: 90,
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

  const handleInitiateSold = () => {
    if (!snapshot?.currentLot) return;
    const buyerTeamId = selectedTeamId || snapshot.currentLot.highestBidderTeamId;
    if (!buyerTeamId && snapshot.currentLot.bidsCount === 0) {
      alert('Please select a franchise paddle team to award the opening base price sale.');
      return;
    }
    setShowSoldConfirmModal(true);
  };

  const handleExecuteSold = async () => {
    if (isSubmittingSold || !snapshot?.currentLot) return;
    const buyerTeamId = selectedTeamId || snapshot.currentLot.highestBidderTeamId;
    if (!buyerTeamId) {
      alert('Please select a franchise team to award the sale.');
      return;
    }

    setIsSubmittingSold(true);
    try {
      const winningTeam = snapshot.teams.find((t) => t.teamId === buyerTeamId);
      const salePrice = snapshot.currentLot.currentBid > 0 ? snapshot.currentLot.currentBid : snapshot.currentLot.basePrice;

      await api.post(`/auctions/${auctionId}/sold`, {
        lotId: snapshot.currentLot.lotId,
        teamId: buyerTeamId,
        finalPrice: salePrice
      });

      setLastSoldData({
        playerName: snapshot.currentLot.player.fullName,
        playerPhoto: snapshot.currentLot.player.photoUrl,
        playerRole: snapshot.currentLot.player.role,
        price: salePrice,
        teamName: winningTeam?.name || 'Selected Franchise',
        teamColor: winningTeam?.color || '#2563EB',
        teamAbbr: winningTeam?.abbreviation || 'WIN'
      });

      setShowSoldConfirmModal(false);
      setShowSoldModal(true);

      // Play authentic auction gavel strikes and stadium crowd roar
      playSoldSound(isSoundMuted);

      // Fire celebratory broadcast confetti
      triggerConfetti();

      // Refresh squad and player state immediately
      refetchTeams();
      refetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to record SOLD transaction');
    } finally {
      setIsSubmittingSold(false);
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
        if (showSoldConfirmModal) {
          handleExecuteSold();
        } else if (snapshot?.currentLot) {
          handleInitiateSold();
        }
      } else if (e.key === 'Enter') {
        if (showSoldConfirmModal) {
          e.preventDefault();
          handleExecuteSold();
        }
      } else if (e.key === 'Escape') {
        if (showSoldConfirmModal) {
          setShowSoldConfirmModal(false);
        }
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
  }, [snapshot, selectedTeamId, showSoldConfirmModal, isSubmittingSold]);

  const currentLot = snapshot?.currentLot;
  const player = currentLot?.player;
  const teams = snapshot?.teams || [];
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) || teams[0];
  const highestBidderTeam = teams.find((t) => t.teamId === currentLot?.highestBidderTeamId);

  const targetBuyerTeamId = selectedTeamId || currentLot?.highestBidderTeamId;
  const targetBuyerTeam = teams.find((t) => t.teamId === targetBuyerTeamId) || selectedTeam;
  const targetSalePrice = currentLot?.currentBid && currentLot.currentBid > 0
    ? currentLot.currentBid
    : currentLot?.basePrice || 5000;

  // Effective bid amount
  const effectiveRaiseAmount = customBidAmount ? Number(customBidAmount) : snapshot?.nextBidAmount || 5000;

  // Countdown timer circle math (15s basis)
  const timerRadius = 34;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerRatio = Math.min(15, Math.max(0, countdown)) / 15;
  const timerOffset = timerCircumference - timerRatio * timerCircumference;

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
              {snapshot?.isPaused ? (
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-[11px] font-black tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-amber-300/50 animate-pulse">
                  <Pause className="w-3 h-3 fill-current" />
                  <span>PAUSED</span>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white text-[11px] font-black tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,24,61,0.7)] border border-red-300/40">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>LIVE</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
              {snapshot?.tournamentName || 'Mumbai Premier League 2027'} – Version v5.2
            </p>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 2. CONTROL BAR                                          */}
        {/* ======================================================== */}
        <section className="my-2.5 bg-[#061533]/90 border border-[#126BFF]/40 rounded-2xl px-3 sm:px-4 py-2 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Mode Buttons & Team Quick Select Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-200 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5 text-sky-400" />
              <span>AUCTION MODE</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <div className="bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white text-xs font-black tracking-wider uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,24,61,0.7)] border border-red-300/40">
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>LIVE AUCTION</span>
            </div>

            <button
              onClick={() => {}}
              className="px-3 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-sky-400" />
              <span>HYBRID MODE</span>
            </button>

            {/* Team Quick Selection: TEAM : [1] [2] [3] [4] */}
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-blue-500/30">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                TEAM :
              </span>
              {teams.slice(0, 4).map((t, idx) => {
                const isSelected = selectedTeamId === t.teamId;
                return (
                  <button
                    key={t.teamId}
                    onClick={() => setSelectedTeamId(t.teamId)}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF183D] text-white shadow-[0_0_12px_rgba(255,24,61,0.8)] border border-red-300/60 scale-105'
                        : 'bg-[#0a1e45] text-slate-300 border border-blue-500/30 hover:border-sky-400 hover:text-white'
                    }`}
                    title={`Select ${t.name} (Key: ${idx + 1})`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Pause/Resume, Direct Sold, Undo, Next, Audio, Settings */}
          <div className="flex items-center gap-2">
            {/* PAUSE / RESUME [SPACE] */}
            <button
              onClick={handleTogglePause}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                snapshot?.isPaused
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-amber-300/60 animate-pulse'
                  : 'bg-[#0a1e45] hover:bg-[#0e2759] text-amber-300 hover:text-white border border-amber-500/40'
              }`}
              title="Spacebar to toggle Pause / Resume"
            >
              {snapshot?.isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>RESUME [Space]</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE [Space]</span>
                </>
              )}
            </button>

            {/* SOLD [S] */}
            <button
              onClick={handleInitiateSold}
              disabled={!currentLot}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#D40026] via-[#FF183D] to-[#D40026] hover:brightness-110 active:scale-95 text-white border border-red-300/50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,24,61,0.7)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark Current Cricketer as SOLD [S]"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>SOLD [S]</span>
            </button>

            {/* UNDO [U] */}
            <button
              onClick={() => setShowUndoModal(true)}
              className="px-2.5 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Undo Last Action [U]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>UNDO [U]</span>
            </button>

            {/* NEXT [N] */}
            <button
              onClick={handleNextPlayer}
              className="px-2.5 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Move to Next Cricketer [N]"
            >
              <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
              <span>NEXT [N]</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className={`p-1.5 border rounded-xl transition-all shadow-xs cursor-pointer ${
                isSoundMuted
                  ? 'bg-red-950/70 border-red-500/50 text-red-400 hover:text-red-300'
                  : 'bg-[#0a1e45] hover:bg-[#0e2759] border-blue-500/30 text-slate-300 hover:text-white'
              }`}
              title={isSoundMuted ? 'Unmute Auction Sounds' : 'Mute Auction Sounds'}
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Settings */}
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
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4.5 items-stretch">
            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: PLAYER SPOTLIGHT (3 cols / 30%)         */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-3 bg-[#061638]/90 border border-[#126BFF]/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              {player ? (
                <div className="space-y-3.5">
                  {/* Top Header: PLAYER SPOTLIGHT (left) & LOT #XX (right) */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        PLAYER SPOTLIGHT
                      </span>
                    </div>
                    <div className="bg-[#0b2454] border border-[#126BFF]/50 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-sky-300">
                      LOT #{String(currentLot.sequenceOrder || 7).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Split Upper Section: Photo on Left (~42%) + Info on Right (~58%) */}
                  <div className="flex gap-3.5 items-stretch min-h-[165px]">
                    {/* Left: Player Portrait Container */}
                    <div className="w-[42%] relative rounded-xl overflow-hidden bg-gradient-to-tr from-[#020b1f] to-[#0a2352] border border-[#126BFF]/50 shadow-inner flex items-center justify-center">
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/30 via-blue-600/10 to-transparent" />
                        <div className="absolute top-0 -left-6 w-16 h-full bg-gradient-to-r from-red-600/40 to-transparent transform -skew-x-25" />
                      </div>

                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.fullName}
                          className="w-full h-full object-cover relative z-10"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-4xl text-sky-400 bg-gradient-to-tr from-[#020b1e] via-[#092250] to-[#0e3170] relative z-10">
                          {player.fullName.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Right: Marquee Pill, Player Name, Role Pill, Batting, Bowling */}
                    <div className="w-[58%] flex flex-col justify-center space-y-1.5">
                      <div className="inline-flex items-center gap-1 self-start bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(255,24,61,0.5)] border border-red-300/40">
                        <Crown className="w-2.5 h-2.5 text-yellow-300 fill-current" />
                        <span>{player.category || 'MARQUEE'}</span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-sm">
                        {player.fullName}
                      </h2>

                      <div className="inline-flex items-center gap-1 self-start bg-[#126BFF] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(18,107,255,0.5)]">
                        <Zap className="w-2.5 h-2.5 text-yellow-300 fill-current" />
                        <span>{player.role.replace(/_/g, ' ')}</span>
                      </div>

                      <div className="space-y-0.5 pt-0.5 text-[11px] text-slate-300 leading-tight">
                        <div>
                          Batting: <strong className="text-white font-bold">{player.battingStyle ? player.battingStyle.replace(/_/g, ' ') : 'Right Handed'}</strong>
                        </div>
                        <div>
                          Bowling: <strong className="text-white font-bold">{player.bowlingStyle ? player.bowlingStyle.replace(/_/g, ' ') : 'Right Arm Medium'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 × 2 Cricket Performance Statistics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-[#07193b] border border-[#126BFF]/30 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        Matches
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.matches ?? 42}
                      </span>
                    </div>

                    <div className="bg-[#07193b] border border-[#126BFF]/30 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        Runs
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {(player.stats?.runs ?? 1286).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-[#07193b] border border-[#126BFF]/30 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        Wickets
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.wickets ?? 38}
                      </span>
                    </div>

                    <div className="bg-[#07193b] border border-[#126BFF]/30 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        Average
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.battingAverage ?? '34.76'}
                      </span>
                    </div>

                    <div className="bg-[#07193b] border border-[#126BFF]/30 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        Strike Rate
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.strikeRate ?? '142.3'}
                      </span>
                    </div>

                    <div className="bg-[#07193b] border border-[#126BFF]/30 rounded-xl p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                        Economy
                      </span>
                      <span className="text-base font-black text-white tabular-nums">
                        {player.stats?.economy ?? '7.98'}
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

              {/* Bottom Base Price Gold Glow Box */}
              {currentLot && (
                <div className="mt-3 gold-base-price-box px-4 py-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC928]">
                    BASE PRICE
                  </span>
                  <span className="text-2xl font-black text-[#FFC928] tabular-nums drop-shadow-[0_0_8px_rgba(255,201,40,0.6)]">
                    ₹{currentLot.basePrice.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* MIDDLE COLUMN: LIVE BIDDING ARENA (4 cols / 40%)     */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-4 bg-[#06183e]/90 border border-[#126BFF]/50 rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 bg-gradient-to-b from-[#126BFF]/20 to-transparent blur-2xl pointer-events-none" />

              {currentLot ? (
                <div className="space-y-3 flex-1 flex flex-col justify-between relative z-10">
                  {/* 1. TOP MARQUEE SCOREBOARD WITH BULBS */}
                  <div className="relative pt-2.5 flex flex-col items-center">
                    {/* Curved Blue Tab on top */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 px-5 py-0.5 bg-gradient-to-r from-[#0369a1] via-[#126BFF] to-[#0369a1] border border-sky-300/40 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                      CURRENT HIGHEST BID
                    </div>

                    {/* Marquee Red Box with Light Bulbs */}
                    <div className="scoreboard-marquee w-full rounded-2xl px-3 py-3.5 flex items-center justify-between relative shadow-2xl">
                      {/* Left Vertical Light Bulbs (5 bulbs) */}
                      <div className="flex flex-col justify-between h-20 py-1 shrink-0">
                        <div className="scoreboard-bulb" />
                        <div className="scoreboard-bulb" style={{ animationDelay: '0.3s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '0.6s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '0.9s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '1.2s' }} />
                      </div>

                      {/* Center Digits & Laurel Wreaths */}
                      <div className="flex-1 flex flex-col items-center justify-center px-2">
                        <div className="flex items-center justify-center gap-2">
                          <svg viewBox="0 0 40 80" className="w-5 sm:w-7 h-10 sm:h-14 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] fill-current shrink-0 opacity-80">
                            <path d="M35,75 C25,60 15,40 20,10 C22,7 26,9 24,12 C18,30 22,50 30,65 Z" />
                            <path d="M22,20 C10,22 5,15 10,8 C15,10 18,15 22,20 Z" />
                            <path d="M18,34 C6,34 2,27 8,20 C13,22 15,28 18,34 Z" />
                            <path d="M18,48 C6,46 3,39 9,33 C14,35 15,42 18,48 Z" />
                            <path d="M22,62 C11,58 9,51 15,46 C19,48 20,55 22,62 Z" />
                          </svg>

                          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white tabular-nums drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                            ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
                          </div>

                          <svg viewBox="0 0 40 80" className="w-5 sm:w-7 h-10 sm:h-14 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] fill-current transform scale-x-[-1] shrink-0 opacity-80">
                            <path d="M35,75 C25,60 15,40 20,10 C22,7 26,9 24,12 C18,30 22,50 30,65 Z" />
                            <path d="M22,20 C10,22 5,15 10,8 C15,10 18,15 22,20 Z" />
                            <path d="M18,34 C6,34 2,27 8,20 C13,22 15,28 18,34 Z" />
                            <path d="M18,48 C6,46 3,39 9,33 C14,35 15,42 18,48 Z" />
                            <path d="M22,62 C11,58 9,51 15,46 C19,48 20,55 22,62 Z" />
                          </svg>
                        </div>
                      </div>

                      {/* Right Vertical Light Bulbs (5 bulbs) */}
                      <div className="flex flex-col justify-between h-20 py-1 shrink-0">
                        <div className="scoreboard-bulb" style={{ animationDelay: '0.15s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '0.45s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '0.75s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '1.05s' }} />
                        <div className="scoreboard-bulb" style={{ animationDelay: '1.35s' }} />
                      </div>
                    </div>

                    {/* Floating pill below the scoreboard: Winning Team or Opening Base Price */}
                    <div className="mt-2">
                      {currentLot.highestBidderTeamName ? (
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-[#092250] rounded-full border border-blue-400/50 shadow-md">
                          <Crown className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          <TeamShield
                            abbreviation={highestBidderTeam?.abbreviation || 'WIN'}
                            color={highestBidderTeam?.color || currentLot.highestBidderTeamColor}
                            size="sm"
                            className="w-4 h-5"
                          />
                          <span className="text-xs font-bold text-white">
                            {currentLot.highestBidderTeamName}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-[#092250]/80 rounded-full border border-blue-400/30">
                          <span className="text-[11px] text-slate-300 font-semibold">
                            Opening Base Price • Awaiting First Bid
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. 3-COLUMN ROW: NEXT MINIMUM BID | CIRCULAR TIMER | INCREMENT */}
                  <div className="grid grid-cols-3 gap-2 items-center bg-[#051330]/80 p-2.5 rounded-2xl border border-blue-500/20 text-center">
                    {/* Left: NEXT MINIMUM BID */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        NEXT MINIMUM BID
                      </span>
                      <div className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tight mt-0.5">
                        ₹{snapshot.nextBidAmount.toLocaleString()}
                      </div>
                      <span className="text-[9px] text-slate-400 italic">
                        (or higher valid)
                      </span>
                    </div>

                    {/* Center: Circular Countdown Timer */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-15 h-15 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="30"
                            cy="30"
                            r="24"
                            stroke="#0c285d"
                            strokeWidth="3.5"
                            fill="transparent"
                          />
                          <circle
                            cx="30"
                            cy="30"
                            r="24"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 24}
                            strokeDashoffset={(2 * Math.PI * 24) - (Math.min(15, Math.max(0, countdown)) / 15) * (2 * Math.PI * 24)}
                            strokeLinecap="round"
                            className={`transition-all duration-300 ${
                              snapshot.isPaused
                                ? 'text-amber-400'
                                : isTimeExpired || countdown <= 5
                                ? 'text-[#FF183D] drop-shadow-[0_0_8px_rgba(255,24,61,0.8)]'
                                : 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                            }`}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center leading-none">
                          <span className={`text-base font-black tabular-nums ${countdown <= 5 && !snapshot.isPaused ? 'text-[#FF183D] animate-pulse' : 'text-white'}`}>
                            {snapshot.isPaused ? 'PAUSE' : `${countdown}s`}
                          </span>
                          <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                            REMAINING
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: INCREMENT */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        INCREMENT
                      </span>
                      <div className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tight mt-0.5">
                        + ₹{Math.max(1000, snapshot.nextBidAmount - (currentLot.currentBid || currentLot.basePrice)).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 3. BIDDING CONTROLS ROW: BIDDING TEAM & CUSTOM BID */}
                  <div className="grid grid-cols-2 gap-2.5 items-end">
                    {/* Left: Bidding Team Dropdown with TeamShield */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        BIDDING TEAM
                      </label>
                      <div className="flex items-center gap-2 bg-[#051330] border border-blue-500/40 rounded-xl px-2.5 py-1.5">
                        {selectedTeam && (
                          <TeamShield
                            abbreviation={selectedTeam.abbreviation}
                            name={selectedTeam.name}
                            color={selectedTeam.color}
                            size="sm"
                            className="w-4 h-5 shrink-0"
                          />
                        )}
                        <select
                          value={selectedTeamId || ''}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-white appearance-none cursor-pointer focus:outline-none pr-3 truncate"
                        >
                          {teams.map((t) => (
                            <option key={t.teamId} value={t.teamId} className="bg-[#061638] text-white">
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
                      </div>
                    </div>

                    {/* Right: Custom Bid (₹) */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        CUSTOM BID (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={customBidAmount}
                          onChange={(e) => setCustomBidAmount(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Enter amount"
                          className="w-full bg-[#051330] border border-blue-500/40 rounded-xl pl-6 pr-2.5 py-1.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. FULL-WIDTH RAISE BID BUTTON */}
                  <button
                    onClick={() => {
                      if (selectedTeamId) handleRegisterPaddleBid(selectedTeamId, effectiveRaiseAmount);
                    }}
                    disabled={!selectedTeamId || isSubmitting || snapshot.isPaused}
                    className="w-full btn-neon-red py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
                  >
                    <Gavel className="w-4 h-4 shrink-0" />
                    <span>RAISE BID</span>
                  </button>

                  {/* 5. LIVE BID HISTORY TABLE */}
                  <div className="bg-[#051330]/80 rounded-2xl border border-blue-500/20 p-2.5 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-blue-500/20">
                      <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-white">
                        LIVE BID HISTORY
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[8px] font-black uppercase tracking-wider text-slate-400 border-b border-blue-500/20">
                            <th className="text-left py-1 px-1.5 font-black">#</th>
                            <th className="text-left py-1 px-1.5 font-black">TEAM</th>
                            <th className="text-left py-1 px-1.5 font-black">BID AMOUNT</th>
                            <th className="text-right py-1 px-1.5 font-black">TIME</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-500/10">
                          {currentLot.bidHistory.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-3 text-center text-slate-400 italic text-[11px]">
                                No bids placed for this lot yet.
                              </td>
                            </tr>
                          ) : (
                            currentLot.bidHistory.slice(0, 3).map((b, idx) => {
                              const isTopBid = idx === 0;
                              const bTeam = teams.find((t) => t.teamId === b.teamId || t.name === b.teamName);
                              const bAbbr = bTeam?.abbreviation || (b as any).teamAbbr || (b.teamName ? b.teamName.slice(0, 3).toUpperCase() : 'WIN');
                              const bColor = bTeam?.color || b.teamColor;
                              const bidTime = b.createdAt
                                ? new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                                : '05:42:18 PM';
                              return (
                                <tr
                                  key={b.id || idx}
                                  className={`transition-colors ${
                                    isTopBid
                                      ? 'bg-red-950/60 text-white font-bold'
                                      : 'text-slate-300 hover:bg-[#07193b]/60'
                                  }`}
                                >
                                  <td className="py-1 px-1.5 font-mono text-[10px] text-slate-400">
                                    {currentLot.bidHistory.length - idx}
                                  </td>
                                  <td className="py-1 px-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <TeamShield
                                        abbreviation={bAbbr}
                                        color={bColor}
                                        size="sm"
                                        className="w-3.5 h-4 shrink-0"
                                      />
                                      <span className="truncate max-w-[120px] font-bold text-white text-[11px]">
                                        {b.teamName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-1 px-1.5 font-black text-white tabular-nums text-[11px]">
                                    ₹{b.bidAmount.toLocaleString()}
                                  </td>
                                  <td className="py-1 px-1.5 text-right font-mono text-[9px] text-slate-400">
                                    {bidTime}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
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
            {/* RIGHT COLUMN: FRANCHISE TEAMS (4) (3 cols / 30%)     */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-3 bg-[#061638]/90 border border-[#126BFF]/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/20">
                  <h3 className="font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>FRANCHISE TEAMS ({teams.length || 4})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Press 1-4 to select
                  </span>
                </div>

                {/* 4 Team Cards Stacked with TeamShield, Progress Bar & Actions */}
                <div className="space-y-2.5">
                  {teams.map((t, idx) => {
                    const isSelected = selectedTeamId === t.teamId;
                    const maxSquad = t.maxSquadLimit || 15;
                    const squadPct = Math.min(100, Math.round(((t.squadCount || 0) / maxSquad) * 100));

                    return (
                      <div
                        key={t.teamId}
                        onClick={() => setSelectedTeamId(t.teamId)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                          isSelected
                            ? 'team-card-selected-red'
                            : 'bg-[#081d45]/80 border-blue-500/25 hover:border-blue-400/50 hover:bg-[#0b275c]'
                        }`}
                      >
                        {/* Red left accent bar if selected */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF183D] shadow-[0_0_10px_#FF183D]" />
                        )}

                        {/* Upper row: [idx], TeamShield, Team Name, Squad + Bar, Purse */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-mono font-bold text-slate-400 w-4 shrink-0">
                              [{idx + 1}]
                            </span>

                            <TeamShield
                              abbreviation={t.abbreviation}
                              name={t.name}
                              color={t.color}
                              size="md"
                              className="shrink-0"
                            />

                            <div className="truncate min-w-0">
                              <h4 className="font-black text-xs sm:text-sm text-white leading-tight uppercase truncate">
                                {t.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Squad: <strong className="text-white">{t.squadCount || 0}</strong>/{maxSquad}
                              </p>
                              {/* Colored horizontal progress bar */}
                              <div className="w-24 h-1.5 bg-[#030d22] rounded-full overflow-hidden mt-1 border border-white/10">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${squadPct}%`,
                                    backgroundColor: t.color || '#126BFF'
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[8px] uppercase font-black text-slate-400 block tracking-wider">
                              PURSE
                            </span>
                            <span className="text-xs sm:text-sm font-black text-white tabular-nums">
                              ₹{Number(t.remainingPurse).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Lower action row: VIEW SQUAD & VIEW PLAYERS */}
                        <div className="mt-2 pt-1.5 border-t border-blue-500/20 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewSquadTeam(t);
                              setSquadRoleFilter('ALL');
                            }}
                            className="flex-1 py-1 px-2 rounded-lg bg-[#071d47]/90 hover:bg-[#126BFF]/30 text-sky-300 hover:text-white border border-[#126BFF]/40 hover:border-sky-400 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
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
                            className="flex-1 py-1 px-2 rounded-lg bg-[#071d47]/90 hover:bg-[#FF183D]/25 text-slate-300 hover:text-white border border-blue-500/30 hover:border-red-400 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
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
              <div className="mt-3 pt-2.5 border-t border-blue-500/20 flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Remaining Lots: <strong className="text-white">{snapshot?.nextLots?.length ?? 7}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sold: <strong className="text-white">{snapshot?.recentSoldLots?.length ?? 0}</strong></span>
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
      {/* 8. MODAL: SOLD CONFIRMATION (Prevents Accidental Sales)  */}
      {/* ======================================================== */}
      <Modal
        isOpen={showSoldConfirmModal}
        onClose={() => setShowSoldConfirmModal(false)}
        maxWidth="md"
        theme="dark"
        title={
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400">
              <Gavel className="w-4 h-4" />
            </div>
            <span className="text-lg font-black tracking-tight">CONFIRM PLAYER SALE</span>
          </div>
        }
        subtitle="Verify winning franchise and sale amount before recording the permanent hammer drop"
      >
        {currentLot && (
          <div className="space-y-4 pt-1">
            {/* Cricketer & Franchise Summary Box */}
            <div className="bg-[#071d47] p-4 rounded-2xl border border-blue-500/40 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/20">
                <div className="flex items-center gap-3">
                  {player?.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={player.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-[#126BFF]/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#092250] text-sky-400 font-black text-lg flex items-center justify-center border border-blue-500/30">
                      {player?.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-black text-base text-white">{player?.fullName}</h4>
                    <span className="text-xs text-sky-300 font-bold uppercase">
                      {player?.role.replace(/_/g, ' ')} • {player?.category || 'Marquee'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-slate-400 block">HAMMER PRICE</span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300 font-medium">Acquiring Franchise:</span>
                {targetBuyerTeam ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: targetBuyerTeam.color || '#2563EB' }}
                    />
                    <span className="font-black text-white text-sm">{targetBuyerTeam.name}</span>
                  </div>
                ) : (
                  <span className="text-amber-400 font-bold">No franchise selected</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Purse After Deduction:</span>
                <span className="font-mono font-bold text-white">
                  ₹{Math.max(0, (targetBuyerTeam?.remainingPurse || 0) - (currentLot.currentBid || currentLot.basePrice)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#030d22] border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {currentLot.bidsCount > 0
                  ? `Selling to highest competitive bidder at ₹${(currentLot.currentBid || currentLot.basePrice).toLocaleString()}.`
                  : `No competitive bids placed. Selling to selected team ${targetBuyerTeam?.name} at opening base price of ₹${currentLot.basePrice.toLocaleString()}.`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                onClick={() => setShowSoldConfirmModal(false)}
                disabled={isSubmittingSold}
              >
                Cancel [Esc]
              </Button>

              <button
                onClick={handleExecuteSold}
                disabled={isSubmittingSold || !targetBuyerTeam}
                className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-gradient-to-r from-[#D40026] via-[#FF183D] to-[#D40026] shadow-[0_0_20px_rgba(255,24,61,0.6)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingSold ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>RECORDING SALE...</span>
                  </>
                ) : (
                  <>
                    <Gavel className="w-4 h-4" />
                    <span>CONFIRM SOLD [S]</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 9. CELEBRATORY BROADCAST SOLD OVERLAY                    */}
      {/* ======================================================== */}
      <Modal
        isOpen={showSoldModal}
        onClose={() => setShowSoldModal(false)}
        maxWidth="md"
        showCloseButton={true}
        theme="dark"
      >
        {lastSoldData && (
          <div className="text-center p-2 relative overflow-hidden">
            {/* Stadium Energy Aura */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 via-red-500/20 to-emerald-500/20 border-2 border-yellow-400/80 flex items-center justify-center text-yellow-300 shadow-[0_0_40px_rgba(234,179,8,0.5)] mb-3 animate-scale-up">
              <Trophy className="w-10 h-10 text-yellow-300 fill-yellow-400/30" />
            </div>

            <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(255,24,61,0.7)] border border-red-300/40 mb-2">
              🎉 PLAYER OFFICIALLY SOLD!
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {lastSoldData.playerName}
            </h3>

            <div className="my-4 p-4 bg-[#071d47] rounded-2xl border-2 border-[#126BFF]/50 shadow-[0_0_30px_rgba(18,107,255,0.25)] flex items-center justify-between">
              <div className="text-left flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md border border-white/20 shrink-0"
                  style={{ backgroundColor: lastSoldData.teamColor || '#2563EB' }}
                >
                  {lastSoldData.teamAbbr}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    ACQUIRED BY
                  </span>
                  <span className="text-sm sm:text-base font-black text-white">{lastSoldData.teamName}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  FINAL PRICE
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                  ₹{Number(lastSoldData.price).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-4">
              Automated notifications queued for tournament ledger and franchise records.
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1 bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                onClick={() => setShowSoldModal(false)}
              >
                Close
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowSoldModal(false);
                  handleNextPlayer();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all cursor-pointer"
              >
                Next Player [N] &gt;&gt;
              </button>
            </div>
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
