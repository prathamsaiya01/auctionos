'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionStore } from '@/stores/auctionStore';
import {
  Trophy,
  Users,
  Gavel,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  Activity,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { AuctionStatus } from '@auctionos/shared';

export default function PublicAuctionDisplayPage() {
  const params = useParams();
  const auctionId = params?.id as string;

  const { snapshot, connectionState, initSocket } = useAuctionStore();
  const [countdown, setCountdown] = useState<number>(30);

  useEffect(() => {
    if (auctionId) {
      initSocket(auctionId);
    }
  }, [auctionId, initSocket]);

  useEffect(() => {
    if (!snapshot || snapshot.status !== AuctionStatus.LIVE || !snapshot.currentLot) {
      setCountdown(15);
      return;
    }

    if (snapshot.isPaused) {
      const remaining = typeof snapshot.countdownRemainingSeconds === 'number' ? snapshot.countdownRemainingSeconds : 0;
      setCountdown(Math.max(0, remaining));
      return;
    }

    const updateTimer = () => {
      if (!snapshot.countdownEndsAt) {
        const remaining = typeof snapshot.countdownRemainingSeconds === 'number' ? snapshot.countdownRemainingSeconds : 15;
        setCountdown(Math.max(0, remaining));
        return;
      }

      const deadline = new Date(snapshot.countdownEndsAt).getTime();
      const now = Date.now();
      const diffMs = deadline - now;
      const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

      setCountdown(diffSec);
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

  const currentLot = snapshot?.currentLot;
  const player = currentLot?.player;
  const teams = snapshot?.teams || [];

  // Countdown percentage for circular SVG dial (15s basis)
  const countdownRadius = 38;
  const circumference = 2 * Math.PI * countdownRadius;
  const countdownRatio = Math.min(15, Math.max(0, countdown)) / 15;
  const countdownOffset = circumference - countdownRatio * circumference;

  return (
    <div className="min-h-screen bg-auction-bg text-auction-text flex flex-col justify-between p-6 lg:p-8 select-none overflow-hidden relative font-sans">
      {/* Background Ambient Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Broadcasting Banner */}
      <header className="flex items-center justify-between pb-5 border-b border-auction-card/80 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-brand-500/20 border border-white/20">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                {snapshot?.tournamentName || 'AUCTIONOS ARENA'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                OFFICIAL BROADCAST
              </span>
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-0.5">
              Live Player Bidding Arena • {snapshot?.currency || 'INR (₹)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 px-4 py-2 bg-auction-surface/80 backdrop-blur-md border border-auction-card rounded-2xl">
            {connectionState === 'CONNECTED' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">FEED SYNCED</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">{connectionState}</span>
              </>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Lots Auctioned</span>
            <span className="text-sm font-black text-white tabular-nums">
              {snapshot?.recentSoldLots?.length || 0} Acquired
            </span>
          </div>
        </div>
      </header>

      {/* Main Broadcast Stage */}
      <main className="flex-1 grid grid-cols-12 gap-8 my-6 items-stretch min-h-0 relative z-10">
        {/* Left Column: Massive Player Trading Visual (5 cols) */}
        <div className="col-span-5 bg-auction-surface/90 backdrop-blur-md rounded-3xl border border-auction-card/90 p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {player ? (
            <div className="space-y-6">
              {/* Photo Showcase */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-900 to-auction-card border border-auction-card shadow-inner">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl font-black text-brand-400 bg-gradient-to-tr from-brand-950 via-slate-900 to-indigo-950">
                    {player.fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-purple-300 border border-purple-500/40 shadow-lg">
                  LOT #{currentLot.sequenceOrder} • {player.category || 'Regular'}
                </div>
              </div>

              {/* Player Identity */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {player.role.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {player.city ? `${player.city} • ` : ''}Age {player.age || '—'}
                  </span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight mt-1">
                  {player.fullName}
                </h2>
              </div>

              {/* Player Cricket Statistics Matrix */}
              {player.stats && (
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-auction-card text-center">
                  <div className="bg-auction-card/70 p-3 rounded-2xl border border-auction-card">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Matches</span>
                    <span className="text-xl font-black text-white tabular-nums">{player.stats.matches ?? 0}</span>
                  </div>
                  <div className="bg-auction-card/70 p-3 rounded-2xl border border-auction-card">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Runs</span>
                    <span className="text-xl font-black text-white tabular-nums">{player.stats.runs ?? 0}</span>
                  </div>
                  <div className="bg-auction-card/70 p-3 rounded-2xl border border-auction-card">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Wickets</span>
                    <span className="text-xl font-black text-white tabular-nums">{player.stats.wickets ?? 0}</span>
                  </div>
                  <div className="bg-auction-card/70 p-3 rounded-2xl border border-auction-card">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Avg</span>
                    <span className="text-lg font-black text-white tabular-nums">{player.stats.battingAverage || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-auction-muted">
              <Trophy className="w-24 h-24 mb-4 text-brand-500/30 animate-pulse" />
              <h3 className="text-2xl font-black text-white">Live Bidding Arena</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Next cricketer lot will appear on this broadcast display automatically when called by the auctioneer.
              </p>
            </div>
          )}

          {currentLot && (
            <div className="pt-4 border-t border-auction-card flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Price</span>
              <span className="text-2xl font-black text-brand-400 tabular-nums">
                ₹{currentLot.basePrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Live Bidding Stage, Timer, & Franchise Board (7 cols) */}
        <div className="col-span-7 flex flex-col justify-between h-full space-y-6">
          {currentLot ? (
            <div className="bg-auction-surface/90 backdrop-blur-md rounded-3xl border border-auction-card/90 p-8 text-center shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>CURRENT HIGHEST BID</span>
              </div>

              {/* Gigantic Winning Bid */}
              <div className="text-7xl lg:text-8xl font-black tracking-tight text-white tabular-nums my-2 drop-shadow-lg">
                ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
              </div>

              {currentLot.highestBidderTeamName ? (
                <div className="inline-flex items-center gap-3.5 mx-auto mt-4 px-7 py-2.5 rounded-full bg-auction-card border border-auction-card shadow-2xl">
                  <span
                    className="w-4 h-4 rounded-full shadow-md"
                    style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                  />
                  <span className="text-2xl font-black text-white tracking-wide">
                    {currentLot.highestBidderTeamName}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-bold text-slate-400 mt-3 block">
                  Awaiting Opening Bid from Franchise Owners
                </span>
              )}

              {/* Animated SVG Countdown Dial */}
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r={countdownRadius}
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      className="text-slate-800"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={countdownRadius}
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={countdownOffset}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ${
                        countdown <= 5 ? 'text-rose-500' : 'text-purple-400'
                      }`}
                    />
                  </svg>
                  <span className={`absolute text-2xl font-black tabular-nums ${
                    countdown <= 5 ? 'text-rose-400 animate-pulse' : 'text-white'
                  }`}>
                    {countdown}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">
                    AUCTION TIMER
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {countdown <= 5 ? '⚠️ Hammer falling...' : 'Live lot active'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-auction-surface/90 backdrop-blur-md rounded-3xl border border-auction-card/90 p-12 text-center shadow-2xl flex-1 flex flex-col justify-center">
              <Gavel className="w-20 h-20 text-brand-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-3xl font-black text-white">Live Stage Ready</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Real-time transactions, team purse calculations, and multiplayer live bidding.
              </p>
            </div>
          )}

          {/* Teams Live Purse Strip */}
          <div className="bg-auction-surface/90 backdrop-blur-md rounded-3xl border border-auction-card/90 p-5 shadow-xl">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-brand-400" />
              <span>Franchise Purse & Squad Board</span>
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {teams.map((t) => (
                <div
                  key={t.teamId}
                  className="bg-auction-card/70 p-3 rounded-2xl border border-auction-card/80 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-white text-[10px] shadow-xs"
                      style={{ backgroundColor: t.color || '#2563EB' }}
                    >
                      {t.abbreviation}
                    </div>
                    <span className="font-bold text-xs text-white truncate">{t.name}</span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Purse Left</span>
                    <span className="text-sm font-black text-emerald-400 tabular-nums">
                      ₹{t.remainingPurse.toLocaleString()}
                    </span>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      Squad: {t.squadCount}/{t.maxSquadLimit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Ticker of Recently Acquired Players */}
      <footer className="h-14 bg-auction-surface/95 backdrop-blur-md border-t border-auction-card/80 px-6 flex items-center justify-between text-xs text-slate-400 relative z-10 rounded-2xl">
        <div className="flex items-center gap-6 overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RECENT ACQUISITIONS:</span>
          </span>
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap">
            {snapshot?.recentSoldLots && snapshot.recentSoldLots.length > 0 ? (
              snapshot.recentSoldLots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-bold text-white">{s.playerName}</span>
                  <span className="text-emerald-400 font-black tabular-nums">₹{s.soldPrice.toLocaleString()}</span>
                  <span className="text-slate-500">to {s.teamName}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-500 italic">No players auctioned yet in this session</span>
            )}
          </div>
        </div>

        <span className="font-bold text-slate-500 shrink-0 text-[11px]">Powered by AUCTIONOS SaaS</span>
      </footer>
    </div>
  );
}
