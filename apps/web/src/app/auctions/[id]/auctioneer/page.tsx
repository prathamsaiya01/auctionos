'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
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
  ChevronLeft
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

  // Initialize Socket connection
  useEffect(() => {
    if (auctionId) {
      initSocket(auctionId);
    }
  }, [auctionId, initSocket]);

  // Set default selected team if none is selected
  useEffect(() => {
    if (snapshot?.teams && snapshot.teams.length > 0 && !selectedTeamId) {
      // Default select team 4 (Royal Blasters) as shown in reference mockup, or first team
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
      const res: any = await api.post(`/auctions/${auctionId}/sold`, {
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

  return (
    <div className="min-h-screen bg-[#020D25] text-white flex flex-col justify-between select-none overflow-x-hidden relative font-sans stadium-bg pb-6">
      {/* Stadium Ambient Floodlights */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] floodlight-left opacity-90" />
        <div className="absolute top-0 right-0 w-full h-[600px] floodlight-right opacity-90" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] stadium-center-flare opacity-80" />
        {/* Subtle field turf line at very bottom */}
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
            {/* Batsman Swinging Silhouette Graphic */}
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
                {/* Silver Trophy Cup */}
                <div className="relative text-yellow-300 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]">
                  <Trophy className="w-7 h-7 sm:w-9 sm:h-9" />
                </div>
              </div>

              {/* Red Season 2 Brush Banner */}
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
          {/* Left: Mode Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-200 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Gavel className="w-3.5 h-3.5 text-sky-400" />
              <span>AUCTION MODE</span>
            </button>

            <button
              onClick={handleTogglePause}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,24,61,0.5)] border border-red-400/40 transition-all ${
                snapshot?.isPaused
                  ? 'bg-amber-600 text-white'
                  : 'bg-gradient-to-r from-[#FF183D] to-[#D40026] text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{snapshot?.isPaused ? 'PAUSED' : 'LIVE AUCTION'}</span>
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-1.5 bg-[#0a1e45] hover:bg-[#0e2759] text-slate-200 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Tv className="w-3.5 h-3.5 text-purple-400" />
              <span>HYBRID MODE</span>
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
                className="px-2.5 py-1 bg-[#07193b] hover:bg-[#0b2452] rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors"
              >
                [Space] Pause
              </button>
              <button
                onClick={handleSold}
                disabled={!currentLot}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-emerald-900/60 rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors"
              >
                [S] Sold
              </button>
              <button
                onClick={() => setShowUndoModal(true)}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-[#0b2452] rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors"
              >
                [U] Undo
              </button>
              <button
                onClick={handleNextPlayer}
                className="px-2.5 py-1 bg-[#07193b] hover:bg-sky-900/60 rounded-lg border border-blue-500/20 text-[11px] font-mono transition-colors"
              >
                [N] Next
              </button>
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 bg-[#0a1e45] hover:bg-[#0e2759] border border-blue-500/30 rounded-xl text-slate-300 hover:text-white transition-all shadow-xs"
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
                    {/* Background Red Speed Streaks */}
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
              {/* Subtle Stadium Center Flare */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 bg-gradient-to-b from-[#126BFF]/20 to-transparent blur-2xl pointer-events-none" />

              {currentLot ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between relative z-10">
                  {/* Top: CURRENT HIGHEST BID with Silver Laurel Wreaths */}
                  <div className="text-center">
                    <div className="inline-block px-4 py-1 bg-[#071d47] border border-[#126BFF]/40 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-sky-300 shadow-inner">
                      CURRENT HIGHEST BID
                    </div>

                    {/* Huge Metallic Amount flanked by SVG Laurel Wreaths */}
                    <div className="flex items-center justify-center gap-3 my-1">
                      {/* Left Laurel Branch SVG */}
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

                      {/* Right Laurel Branch SVG */}
                      <svg viewBox="0 0 40 80" className="w-7 sm:w-9 h-14 sm:h-18 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] fill-current transform scale-x-[-1] shrink-0">
                        <path d="M35,75 C25,60 15,40 20,10 C22,7 26,9 24,12 C18,30 22,50 30,65 Z" />
                        <path d="M22,20 C10,22 5,15 10,8 C15,10 18,15 22,20 Z" />
                        <path d="M18,34 C6,34 2,27 8,20 C13,22 15,28 18,34 Z" />
                        <path d="M18,48 C6,46 3,39 9,33 C14,35 15,42 18,48 Z" />
                        <path d="M22,62 C11,58 9,51 15,46 C19,48 20,55 22,62 Z" />
                      </svg>
                    </div>

                    {/* Subtitle */}
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
                    {/* Left: Animated Circular Countdown Timer */}
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

                    {/* Right: Next Minimum Bid */}
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

                  {/* Bidding Control Panel: Selected Paddle Team & Giant Raise Bid Button */}
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

                    {/* Big Action Buttons Row */}
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
                        className={`px-4 py-3.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 ${
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

                    {/* Custom Bid Input expansion */}
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
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0"
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

                    {/* Watermark Gavel */}
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
                    className="mt-5 btn-neon-red px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center gap-2"
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

                {/* 4 Team Cards Stacked */}
                <div className="space-y-2.5">
                  {teams.map((t, idx) => {
                    const isSelected = selectedTeamId === t.teamId;

                    return (
                      <div
                        key={t.teamId}
                        onClick={() => setSelectedTeamId(t.teamId)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'team-card-selected-red'
                            : 'bg-[#081d45]/80 border-blue-500/25 hover:border-blue-400/50 hover:bg-[#0b275c]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Number badge [1] */}
                          <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0">
                            [{idx + 1}]
                          </span>

                          {/* Team Abbreviation badge */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md shrink-0 border border-white/20"
                            style={{ backgroundColor: t.color || '#2563EB' }}
                          >
                            {t.abbreviation}
                          </div>

                          <div className="truncate">
                            <h4 className="font-black text-sm text-white leading-tight truncate">
                              {t.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Squad: <strong className="text-white">{t.squadCount}</strong>/{t.maxSquadLimit || 15}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">
                            PURSE
                          </span>
                          <span className="text-sm font-black text-white tabular-nums">
                            ₹{t.remainingPurse.toLocaleString()}
                          </span>
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
          {/* Section Heading with Red Diagonal Speed Streaks */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-red-500 font-black tracking-widest text-sm">///</span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              OUR SPONSORS
            </h3>
            <span className="text-red-500 font-black tracking-widest text-sm">///</span>
          </div>

          {/* Full-Width White/Silver Glossy Sponsor Display Panel */}
          <div className="sponsor-bar-glow w-full bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-2xl relative overflow-hidden flex items-center justify-between px-6 sm:px-12 py-3 shadow-2xl">
            {/* Left Angled Red/Blue Chevron Graphic Wing */}
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-r from-[#FF183D] via-[#126BFF] to-transparent transform -skew-x-25 -ml-8 pointer-events-none opacity-90" />

            {/* Sponsor 1: GOKUL OPTICS */}
            <div className="flex-1 flex items-center justify-center relative z-10 py-1">
              <img
                src="/images/gokul/gokul_optics.png"
                alt="GOKUL OPTICS - A vision ahead"
                className="h-12 sm:h-16 w-auto object-contain max-w-[260px] drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>

            {/* Vertical Silver Divider */}
            <div className="h-12 w-px bg-slate-300 relative z-10 mx-4" />

            {/* Sponsor 2: GOKUL BAGS */}
            <div className="flex-1 flex items-center justify-center relative z-10 py-1">
              <img
                src="/images/gokul/gokul_bags.png"
                alt="GOKUL BAGS - Miles ahead"
                className="h-12 sm:h-16 w-auto object-contain max-w-[260px] drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>

            {/* Right Angled Red/Blue Chevron Graphic Wing */}
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l from-[#FF183D] via-[#126BFF] to-transparent transform skew-x-25 -mr-8 pointer-events-none opacity-90" />
          </div>
        </section>
      </div>

      {/* ======================================================== */}
      {/* 5. FOREGROUND CRICKET DECORATIONS                        */}
      {/* ======================================================== */}
      {/* Bottom Left: Golden Wooden Cricket Wickets & Bails */}
      <div className="fixed bottom-0 left-3 pointer-events-none z-30 opacity-90 hidden sm:block">
        <svg width="90" height="120" viewBox="0 0 100 130" className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          {/* Left Stump */}
          <rect x="20" y="25" width="8" height="100" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="22" y="28" width="3" height="92" fill="#FDE047" opacity="0.6" />
          {/* Middle Stump */}
          <rect x="46" y="25" width="8" height="100" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="48" y="28" width="3" height="92" fill="#FDE047" opacity="0.6" />
          {/* Right Stump */}
          <rect x="72" y="25" width="8" height="100" rx="3" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="74" y="28" width="3" height="92" fill="#FDE047" opacity="0.6" />
          {/* Left Bail */}
          <rect x="16" y="19" width="36" height="5" rx="2" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          {/* Right Bail */}
          <rect x="48" y="19" width="36" height="5" rx="2" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
        </svg>
      </div>

      {/* Bottom Right: Glossy Red Cricket Leather Ball with Seam */}
      <div className="fixed bottom-1 right-4 pointer-events-none z-30 opacity-95 hidden sm:block">
        <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)]">
          {/* Red Leather Ball Body */}
          <circle cx="50" cy="50" r="44" fill="url(#ballGradient)" stroke="#88081a" strokeWidth="2" />
          {/* Leather Seam curve with stitches */}
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
          {/* Shiny Top Highlight */}
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
      {/* 6. MODALS: SOLD CELEBRATION & UNDO CONFIRMATION          */}
      {/* ======================================================== */}
      {/* Celebratory SOLD Modal Dialog */}
      <Modal
        isOpen={showSoldModal}
        onClose={() => setShowSoldModal(false)}
        maxWidth="md"
        showCloseButton={false}
      >
        {lastSoldData && (
          <div className="text-center p-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 shadow-glow-green mb-4">
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 block mb-1">
              🎉 PLAYER OFFICIALLY SOLD!
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {lastSoldData.playerName}
            </h3>

            <div className="my-5 p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Acquired By</span>
                <span className="text-base font-black text-gray-900">{lastSoldData.teamName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Final Sale Price</span>
                <span className="text-xl font-black text-brand-600 tabular-nums">
                  ₹{Number(lastSoldData.price).toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
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
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Reversal</label>
            <input
              type="text"
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              placeholder="e.g. Host accidental paddle tap"
              className="w-full px-3 py-2 bg-gray-50 border border-admin-border rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
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
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-900 block mb-1">Active Auction Mode</span>
            <p className="text-xs text-gray-500 mb-2">Toggle between Online, Offline/Paddle, and Hybrid modes.</p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Hybrid Mode</button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Online Only</button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">Offline Paddle</button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-900 block">Automated Sound Alerts</span>
              <p className="text-[11px] text-gray-500">Play chime when new bid arrives or hammer drops</p>
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
