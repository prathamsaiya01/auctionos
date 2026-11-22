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
  WifiOff,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Trophy,
  AlertTriangle,
  Flame,
  Volume2,
  Tv
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function AuctioneerConsolePage() {
  const params = useParams();
  const auctionId = params?.id as string;

  const { snapshot, connectionState, initSocket } = useAuctionStore();
  const { user } = useAuthStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [customBidAmount, setCustomBidAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoReason, setUndoReason] = useState('Auctioneer correction');
  const [lastSoldData, setLastSoldData] = useState<any>(null);

  // Initialize Socket connection
  useEffect(() => {
    if (auctionId) {
      initSocket(auctionId);
    }
  }, [auctionId, initSocket]);

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
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#38BDF8', '#22C55E', '#F59E0B']
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
      setSelectedTeamId(null);
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

  // Keyboard Shortcuts listener (1-8 teams, Space pause, S sold, U undo, N next)
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

  return (
    <div className="min-h-screen bg-auction-bg text-auction-text flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Broadcast Control Room Header */}
      <header className="h-16 bg-auction-surface border-b border-auction-border px-6 flex items-center justify-between shadow-xl z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-glow-purple shrink-0">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide text-white">AUCTIONEER CONSOLE</span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                  Broadcast
                </span>
              </div>
              <p className="text-[10px] text-auction-muted truncate font-medium">
                {snapshot?.tournamentName || 'Tournament'} • Version #{snapshot?.version || 1}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-auction-border hidden sm:block" />

          {/* Status & Mode Pills */}
          <div className="hidden sm:flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                snapshot?.status === AuctionStatus.LIVE
                  ? snapshot?.isPaused
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse-slow'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  snapshot?.isPaused ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span>{snapshot?.isPaused ? 'PAUSED' : snapshot?.status || 'READY'}</span>
            </span>

            <span className="text-[11px] font-bold text-auction-muted bg-auction-card px-2.5 py-1 rounded-full border border-auction-border">
              {snapshot?.mode || 'HYBRID'} MODE
            </span>
          </div>
        </div>

        {/* Shortcuts Hints & Connection Status */}
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-3 text-[11px] text-auction-muted font-mono">
            <span className="px-1.5 py-0.5 bg-auction-card rounded border border-auction-border">[1-4] Team</span>
            <span className="px-1.5 py-0.5 bg-auction-card rounded border border-auction-border">[Space] Pause</span>
            <span className="px-1.5 py-0.5 bg-auction-card rounded border border-auction-border">[S] Sold</span>
            <span className="px-1.5 py-0.5 bg-auction-card rounded border border-auction-border">[U] Undo</span>
            <span className="px-1.5 py-0.5 bg-auction-card rounded border border-auction-border">[N] Next</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-auction-card rounded-full text-xs font-bold border border-auction-border">
            {connectionState === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[11px]">LIVE SYNC</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-400 text-[11px]">{connectionState}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main 3-Panel Control Center */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 auction-spotlight">
        {/* LEFT PANEL: Player Showcase (3 cols) */}
        <div className="lg:col-span-3 bg-auction-surface rounded-3xl border border-auction-border p-6 flex flex-col justify-between overflow-hidden shadow-2xl relative">
          {player ? (
            <div className="space-y-4">
              {/* Photo Frame */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-auction-card border border-auction-border shadow-inner group">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt={player.fullName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-black text-purple-400 bg-gradient-to-tr from-purple-950 to-slate-900">
                    {player.fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 border border-purple-500/30">
                  Lot #{currentLot.sequenceOrder} • {player.category}
                </div>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">
                  {player.fullName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-extrabold text-purple-400">{player.role.replace('_', ' ')}</span>
                  <span className="text-xs text-auction-muted">•</span>
                  <span className="text-[11px] text-auction-muted">
                    {player.city ? `${player.city} • ` : ''}Age {player.age || '—'}
                  </span>
                </div>
              </div>

              {/* Cricket Career Statistics Matrix */}
              {player.stats && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-auction-border text-center">
                  <div className="bg-auction-card/90 p-2 rounded-xl border border-auction-border/60">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Matches</span>
                    <span className="text-sm font-black text-white">{player.stats.matches}</span>
                  </div>
                  <div className="bg-auction-card/90 p-2 rounded-xl border border-auction-border/60">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Runs</span>
                    <span className="text-sm font-black text-white">{player.stats.runs}</span>
                  </div>
                  <div className="bg-auction-card/90 p-2 rounded-xl border border-auction-border/60">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Wickets</span>
                    <span className="text-sm font-black text-white">{player.stats.wickets}</span>
                  </div>
                  <div className="bg-auction-card/90 p-2 rounded-xl border border-auction-border/60">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Avg</span>
                    <span className="text-xs font-bold text-white">{player.stats.battingAverage || '—'}</span>
                  </div>
                  <div className="bg-auction-card/90 p-2 rounded-xl border border-auction-border/60">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">SR</span>
                    <span className="text-xs font-bold text-white">{player.stats.strikeRate || '—'}</span>
                  </div>
                  <div className="bg-auction-card/90 p-2 rounded-xl border border-auction-border/60">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Econ</span>
                    <span className="text-xs font-bold text-white">{player.stats.economy || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-auction-muted">
              <div className="w-16 h-16 rounded-2xl bg-auction-card flex items-center justify-center mb-3 text-purple-400">
                <User className="w-8 h-8" />
              </div>
              <p className="text-sm font-black text-white">No Active Player Lot</p>
              <p className="text-xs mt-1 leading-relaxed">Click "Start Auction" or "Next Player" to bring up the active lot.</p>
            </div>
          )}

          {currentLot && (
            <div className="mt-4 pt-3 border-t border-auction-border flex items-center justify-between text-xs">
              <span className="text-auction-muted font-bold">Base Price</span>
              <span className="text-lg font-black text-white tabular-nums">
                ₹{currentLot.basePrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* CENTER PANEL: Dominant Live Bidding Stage (5 cols) */}
        <div className="lg:col-span-5 bg-auction-surface rounded-3xl border border-auction-border p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {currentLot ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Massive Current Bid Display */}
              <div className="text-center bg-auction-card/90 border border-auction-border rounded-3xl p-6 relative overflow-hidden shadow-inner">
                <span className="text-[11px] font-black uppercase tracking-widest text-auction-muted block mb-1">
                  CURRENT HIGHEST BID
                </span>
                <div className="text-5xl md:text-6xl font-black tracking-tight text-white tabular-nums my-1">
                  ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
                </div>

                {currentLot.highestBidderTeamName ? (
                  <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-xs shadow-sm">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                    />
                    <span>Held by {currentLot.highestBidderTeamName}</span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-auction-muted block mt-2">
                    Opening Base Price • Awaiting First Bid
                  </span>
                )}
              </div>

              {/* Countdown Dial & Next Valid Bid */}
              <div className="flex items-center justify-center gap-8 py-2">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center font-black text-3xl tabular-nums transition-all ${
                      countdown <= 5
                        ? 'border-red-500 text-red-500 bg-red-500/20 animate-countdown-urgent'
                        : countdown <= 10
                        ? 'border-amber-500 text-amber-500 bg-amber-500/15'
                        : 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-glow-purple'
                    }`}
                  >
                    {countdown}s
                  </div>
                  <span className="text-[10px] uppercase font-bold text-auction-muted mt-2 tracking-wider">
                    Countdown
                  </span>
                </div>

                <div className="flex flex-col justify-center gap-1">
                  <span className="text-[11px] font-bold text-auction-muted uppercase tracking-wider">
                    Next Minimum Bid
                  </span>
                  <div className="text-3xl font-black text-purple-400 tabular-nums">
                    ₹{snapshot.nextBidAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Tier-calculated increment</span>
                </div>
              </div>

              {/* Manual Paddle Registration Dock */}
              <div className="bg-auction-card p-4 rounded-2xl border border-auction-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-auction-muted">Selected Paddle Team:</span>
                  <span className="font-black text-white">
                    {snapshot.teams.find((t) => t.teamId === selectedTeamId)?.name || 'None (Select from right panel)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="auction-bid"
                    size="md"
                    className="flex-1 text-xs md:text-sm py-3"
                    onClick={() => {
                      if (selectedTeamId) handleRegisterPaddleBid(selectedTeamId);
                    }}
                    disabled={!selectedTeamId || isSubmitting || snapshot.isPaused}
                    icon={<Gavel className="w-4 h-4" />}
                  >
                    Raise Bid to ₹{snapshot.nextBidAmount.toLocaleString()}
                  </Button>

                  <div className="w-32">
                    <input
                      type="number"
                      value={customBidAmount}
                      onChange={(e) => setCustomBidAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Custom ₹"
                      className="w-full px-3 py-2.5 bg-auction-surface border border-auction-border rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Recent Bids Feed */}
              <div className="h-28 overflow-y-auto space-y-1.5 pr-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-auction-muted block mb-1">
                  Live Bid Stream ({currentLot.bidHistory.length})
                </span>
                {currentLot.bidHistory.length === 0 ? (
                  <p className="text-xs text-auction-muted italic">No bids placed for this lot yet.</p>
                ) : (
                  currentLot.bidHistory.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-auction-card/60 text-xs border border-auction-border/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.teamColor || '#3B82F6' }}
                        />
                        <span className="font-bold text-white truncate">{b.teamName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({b.bidSource})</span>
                      </div>
                      <span className="font-black text-purple-300 tabular-nums">₹{b.bidAmount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-auction-muted">
              <div className="w-20 h-20 rounded-3xl bg-auction-card flex items-center justify-center text-purple-400 mb-4 shadow-inner">
                <Gavel className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-white">Auction Control Room</h3>
              <p className="text-xs mt-1.5 max-w-sm leading-relaxed">
                Connect multiple devices simultaneously. Spectators, team owners, and projectors update automatically.
              </p>
              <Button
                variant="auction-bid"
                size="md"
                className="mt-6"
                onClick={handleStart}
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                START LIVE AUCTION
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Participating Franchise Teams (4 cols) */}
        <div className="lg:col-span-4 bg-auction-surface rounded-3xl border border-auction-border p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm text-white tracking-tight">
                Franchise Teams ({snapshot?.teams.length || 0})
              </h3>
              <span className="text-[10px] text-auction-muted font-mono">Press 1-4 to select</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-290px)] pr-1">
              {snapshot?.teams.map((t, idx) => {
                const isSelected = selectedTeamId === t.teamId;
                const isHighest = currentLot?.highestBidderTeamId === t.teamId;

                return (
                  <div
                    key={t.teamId}
                    onClick={() => setSelectedTeamId(t.teamId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/15 shadow-glow-purple'
                        : isHighest
                        ? 'border-blue-500/80 bg-blue-500/10'
                        : 'border-auction-border bg-auction-card/50 hover:bg-auction-card'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-5 text-[10px] font-mono text-auction-muted shrink-0">
                        [{idx + 1}]
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0"
                        style={{ backgroundColor: t.color || '#2563EB' }}
                      >
                        {t.abbreviation}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-xs text-white leading-tight truncate">{t.name}</h4>
                        <p className="text-[10px] text-auction-muted font-medium">
                          Squad: <span className="text-white font-bold">{t.squadCount}</span>/{t.maxSquadLimit}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] uppercase font-bold text-auction-muted block">Purse</span>
                      <span className="text-sm font-black text-white tabular-nums">
                        ₹{t.remainingPurse.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-auction-border flex items-center justify-between text-[11px] text-auction-muted font-medium">
            <span>Remaining Lots: {snapshot?.nextLots.length || 0}</span>
            <span>Sold: {snapshot?.recentSoldLots.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Broadcast Action Dock (Bottom fixed) */}
      <footer className="h-20 bg-auction-surface border-t border-auction-border px-8 flex items-center justify-between shadow-2xl z-20">
        <div className="flex items-center gap-3">
          <Button
            variant={snapshot?.isPaused ? 'success' : 'outline'}
            size="sm"
            onClick={handleTogglePause}
            icon={snapshot?.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            className={snapshot?.isPaused ? '' : 'bg-auction-card text-white border-auction-border hover:bg-slate-800'}
          >
            {snapshot?.isPaused ? 'RESUME (Space)' : 'PAUSE (Space)'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUndoModal(true)}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-auction-muted hover:text-white hover:bg-auction-card"
          >
            UNDO (U)
          </Button>
        </div>

        {/* Big Decision Buttons */}
        <div className="flex items-center gap-4">
          <Button
            variant="danger"
            size="md"
            onClick={handleUnsold}
            disabled={!currentLot}
            icon={<XCircle className="w-4 h-4" />}
            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40"
          >
            CONFIRM UNSOLD
          </Button>

          <Button
            variant="success"
            size="lg"
            onClick={handleSold}
            disabled={!currentLot}
            icon={<CheckCircle className="w-5 h-5" />}
            className="px-8 font-black shadow-glow-green"
          >
            CONFIRM SOLD! (S)
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNextPlayer}
            icon={<ChevronRight className="w-4 h-4" />}
            iconPosition="right"
          >
            NEXT PLAYER (N)
          </Button>
        </div>
      </footer>

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
              Automated congratulations message dispatched via WhatsApp Cloud API & email outbox.
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
    </div>
  );
}
