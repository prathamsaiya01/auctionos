'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuctionStore } from '@/stores/auctionStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { BidSource, LotStatus, AuctionStatus } from '@auctionos/shared';
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
  AlertTriangle
} from 'lucide-react';

export default function AuctioneerConsolePage() {
  const params = useParams();
  const auctionId = params?.id as string;

  const { snapshot, connectionState, initSocket } = useAuctionStore();
  const { user } = useAuthStore();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [customBidAmount, setCustomBidAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number>(30);

  // Initialize socket
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

  // Reset countdown when lot or current bid changes
  useEffect(() => {
    setCountdown(30);
  }, [snapshot?.currentLot?.lotId, snapshot?.currentLot?.currentBid]);

  // Auctioneer Actions
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
      alert(err.message || 'Bid rejected');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSold = async () => {
    if (!snapshot?.currentLot) return;
    if (snapshot.currentLot.bidsCount === 0 && !selectedTeamId) {
      alert('Cannot mark SOLD without at least one bid or a selected buyer team.');
      return;
    }

    try {
      await api.post(`/auctions/${auctionId}/sold`, {
        lotId: snapshot.currentLot.lotId,
        teamId: selectedTeamId || snapshot.currentLot.highestBidderTeamId
      });
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

  const handleUndo = async () => {
    if (!snapshot?.currentLot) return;
    const confirmUndo = window.confirm('Are you sure you want to reverse the last bid/action?');
    if (!confirmUndo) return;

    try {
      await api.post(`/auctions/${auctionId}/reverse-action`, {
        lotId: snapshot.currentLot.lotId,
        reason: 'Host auctioneer manual correction'
      });
    } catch (err: any) {
      alert(err.message || 'Failed to reverse action');
    }
  };

  // Keyboard Shortcuts handler (1-4 select teams, Space pauses, S marks SOLD, U undoes, N next)
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
        handleUndo();
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
    <div className="min-h-screen bg-auction-bg text-auction-text flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <header className="h-16 bg-auction-surface border-b border-auction-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-sm tracking-wide text-white">AUCTIONEER CONSOLE</span>
              <p className="text-[10px] text-auction-muted">{snapshot?.tournamentName || 'Tournament'}</p>
            </div>
          </div>

          <div className="h-5 w-px bg-auction-card" />

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                snapshot?.status === AuctionStatus.LIVE
                  ? snapshot?.isPaused
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {snapshot?.isPaused ? 'PAUSED' : snapshot?.status || 'READY'}
            </span>
            <span className="text-[11px] font-semibold text-auction-muted">Mode: {snapshot?.mode}</span>
          </div>
        </div>

        {/* Connection Indicator & Shortcuts Hint */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-auction-muted">
            <span>[1-4]: Select Team</span>
            <span>[Space]: Pause/Resume</span>
            <span>[S]: SOLD</span>
            <span>[U]: Undo</span>
            <span>[N]: Next</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-auction-card rounded-full text-xs font-semibold">
            {connectionState === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 text-[11px]">LIVE SYNC</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-400 text-[11px]">{connectionState}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Live Stage */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* LEFT COLUMN: Current Player Profile (3 cols) */}
        <div className="lg:col-span-3 bg-auction-surface rounded-3xl border border-auction-card p-6 flex flex-col justify-between overflow-hidden shadow-xl">
          {player ? (
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-auction-card border border-auction-card">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-purple-400">
                    {player.fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 border border-purple-500/30">
                  Lot #{currentLot.sequenceOrder} • {player.category}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black text-white leading-tight">{player.fullName}</h2>
                <p className="text-xs font-bold text-purple-400 mt-0.5">{player.role.replace('_', ' ')}</p>
                <p className="text-[11px] text-auction-muted">
                  {player.city ? `${player.city} • ` : ''}Age {player.age || '—'}
                </p>
              </div>

              {/* Cricket Stats Grid */}
              {player.stats && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-auction-card text-center">
                  <div className="bg-auction-card p-2 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Matches</span>
                    <span className="text-sm font-black text-white">{player.stats.matches}</span>
                  </div>
                  <div className="bg-auction-card p-2 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Runs</span>
                    <span className="text-sm font-black text-white">{player.stats.runs}</span>
                  </div>
                  <div className="bg-auction-card p-2 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Wickets</span>
                    <span className="text-sm font-black text-white">{player.stats.wickets}</span>
                  </div>
                  <div className="bg-auction-card p-2 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Avg</span>
                    <span className="text-xs font-bold text-white">{player.stats.battingAverage || '—'}</span>
                  </div>
                  <div className="bg-auction-card p-2 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">SR</span>
                    <span className="text-xs font-bold text-white">{player.stats.strikeRate || '—'}</span>
                  </div>
                  <div className="bg-auction-card p-2 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-auction-muted block">Econ</span>
                    <span className="text-xs font-bold text-white">{player.stats.economy || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-auction-muted">
              <User className="w-12 h-12 mb-3 text-auction-card" />
              <p className="text-sm font-bold text-white">No Active Player Lot</p>
              <p className="text-xs mt-1">Click "Start Auction" or "Next Player" to bring up the first lot.</p>
            </div>
          )}

          {currentLot && (
            <div className="mt-4 pt-3 border-t border-auction-card flex items-center justify-between text-xs">
              <span className="text-auction-muted">Base Price</span>
              <span className="text-base font-black text-white">₹{currentLot.basePrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* CENTRE COLUMN: Active Bidding Engine (5 cols) */}
        <div className="lg:col-span-5 bg-auction-surface rounded-3xl border border-auction-card p-6 flex flex-col justify-between shadow-xl">
          {currentLot ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              {/* Live Bid Banner */}
              <div className="text-center bg-auction-card/70 border border-auction-card rounded-3xl p-6 relative overflow-hidden">
                <span className="text-xs font-black uppercase tracking-widest text-auction-muted block mb-1">
                  CURRENT WINNING BID
                </span>
                <div className="text-5xl font-black tracking-tight text-white tabular-nums my-1">
                  ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
                </div>

                {currentLot.highestBidderTeamName ? (
                  <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
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

              {/* Countdown Dial */}
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center font-black text-3xl tabular-nums shadow-lg transition-colors ${
                      countdown <= 5
                        ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse'
                        : countdown <= 10
                        ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                        : 'border-purple-500 text-purple-400 bg-purple-500/10'
                    }`}
                  >
                    {countdown}s
                  </div>
                  <span className="text-[10px] uppercase font-bold text-auction-muted mt-2 tracking-wider">
                    Countdown
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-auction-muted uppercase">Next Minimum Bid</span>
                  <div className="text-2xl font-black text-purple-400 tabular-nums">
                    ₹{snapshot.nextBidAmount.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-gray-500">Auto tier calculation</span>
                </div>
              </div>

              {/* Manual Increment & Bid Button */}
              <div className="bg-auction-card p-4 rounded-2xl border border-auction-card space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-auction-muted">Selected Team for Paddle Bid:</span>
                  <span className="font-black text-white">
                    {snapshot.teams.find((t) => t.teamId === selectedTeamId)?.name || 'None (Click team on right)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedTeamId) handleRegisterPaddleBid(selectedTeamId);
                    }}
                    disabled={!selectedTeamId || isSubmitting || snapshot.isPaused}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-sm font-black shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    <span>Raise Bid to ₹{snapshot.nextBidAmount.toLocaleString()}</span>
                  </button>

                  <div className="w-32">
                    <input
                      type="number"
                      value={customBidAmount}
                      onChange={(e) => setCustomBidAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Custom ₹"
                      className="w-full px-3 py-3 bg-auction-surface border border-auction-card rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Live Bid History Feed */}
              <div className="h-32 overflow-y-auto space-y-1.5 pr-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-auction-muted block mb-1">
                  Recent Bids ({currentLot.bidHistory.length})
                </span>
                {currentLot.bidHistory.length === 0 ? (
                  <p className="text-xs text-auction-muted italic">No bids placed for this lot yet.</p>
                ) : (
                  currentLot.bidHistory.slice(0, 5).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-auction-card/50 text-xs border border-auction-card/40"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: b.teamColor || '#3B82F6' }}
                        />
                        <span className="font-bold text-white">{b.teamName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({b.bidSource})</span>
                      </div>
                      <span className="font-black text-purple-300 tabular-nums">₹{b.bidAmount.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-auction-muted">
              <Gavel className="w-16 h-16 mb-4 text-auction-card" />
              <h3 className="text-lg font-black text-white">Auction Engine Standby</h3>
              <p className="text-xs mt-1 max-w-xs">
                All connected team owners and spectator screens will automatically synchronise when you start.
              </p>
              <button
                onClick={handleStart}
                className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START LIVE AUCTION</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Franchise Team Cards (4 cols) */}
        <div className="lg:col-span-4 bg-auction-surface rounded-3xl border border-auction-card p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white">Franchise Teams ({snapshot?.teams.length || 0})</h3>
              <span className="text-[10px] text-auction-muted">Click team or press 1-4</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {snapshot?.teams.map((t, idx) => {
                const isSelected = selectedTeamId === t.teamId;
                const isHighest = currentLot?.highestBidderTeamId === t.teamId;

                return (
                  <div
                    key={t.teamId}
                    onClick={() => setSelectedTeamId(t.teamId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10'
                        : isHighest
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-auction-card bg-auction-card/50 hover:bg-auction-card'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 text-[10px] font-bold text-auction-muted">
                        [{idx + 1}]
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-xs"
                        style={{ backgroundColor: t.color || '#2563EB' }}
                      >
                        {t.abbreviation}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white leading-tight">{t.name}</h4>
                        <p className="text-[10px] text-auction-muted">
                          Squad: <span className="text-white font-bold">{t.squadCount}</span>/{t.maxSquadLimit}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
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

          <div className="pt-3 border-t border-auction-card flex items-center justify-between text-[11px] text-auction-muted">
            <span>Remaining Lots: {snapshot?.nextLots.length || 0}</span>
            <span>Sold: {snapshot?.recentSoldLots.length || 0}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION DOCK */}
      <footer className="h-20 bg-auction-surface border-t border-auction-card px-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePause}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              snapshot?.isPaused
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-auction-card hover:bg-slate-700 text-white border border-auction-card'
            }`}
          >
            {snapshot?.isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span>{snapshot?.isPaused ? 'RESUME (Space)' : 'PAUSE (Space)'}</span>
          </button>

          <button
            onClick={handleUndo}
            className="px-4 py-2.5 bg-auction-card hover:bg-slate-700 text-auction-muted hover:text-white rounded-xl text-xs font-bold border border-auction-card transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>UNDO (U)</span>
          </button>
        </div>

        {/* Big Decision Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleUnsold}
            disabled={!currentLot}
            className="px-6 py-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-2xl text-xs font-black transition-all flex items-center gap-2 disabled:opacity-30"
          >
            <XCircle className="w-4 h-4" />
            <span>CONFIRM UNSOLD</span>
          </button>

          <button
            onClick={handleSold}
            disabled={!currentLot}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-green-600/30 transition-all flex items-center gap-2 disabled:opacity-30"
          >
            <CheckCircle className="w-5 h-5" />
            <span>CONFIRM SOLD! (S)</span>
          </button>

          <button
            onClick={handleNextPlayer}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <span>NEXT PLAYER (N)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
