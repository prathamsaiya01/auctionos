'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuctionStore } from '@/stores/auctionStore';
import { Trophy, Users, Gavel, Sparkles, CheckCircle2 } from 'lucide-react';
import { AuctionStatus, LotStatus } from '@auctionos/shared';

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
    if (!snapshot || snapshot.isPaused || snapshot.status !== AuctionStatus.LIVE) return;

    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [snapshot]);

  useEffect(() => {
    setCountdown(30);
  }, [snapshot?.currentLot?.lotId, snapshot?.currentLot?.currentBid]);

  const currentLot = snapshot?.currentLot;
  const player = currentLot?.player;

  return (
    <div className="min-h-screen bg-auction-bg text-auction-text flex flex-col justify-between p-8 select-none overflow-hidden">
      {/* Top Broadcasting Banner */}
      <header className="flex items-center justify-between pb-6 border-b border-auction-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            A
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{snapshot?.tournamentName || 'AUCTIONOS'}</h1>
            <p className="text-xs uppercase font-bold tracking-widest text-purple-400">
              OFFICIAL LIVE PLAYER AUCTION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-auction-surface border border-auction-card rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-green-400">BROADCAST FEED</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-auction-muted block">Currency</span>
            <span className="text-sm font-black text-white">{snapshot?.currency || 'INR (₹)'}</span>
          </div>
        </div>
      </header>

      {/* Main Broadcast Stage */}
      <main className="flex-1 grid grid-cols-12 gap-8 my-8 items-center min-h-0">
        {/* Left Column: Massive Player Visual (5 cols) */}
        <div className="col-span-5 bg-auction-surface rounded-3xl border border-auction-card p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden h-full">
          {player ? (
            <div className="space-y-6">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-auction-card border border-auction-card shadow-inner">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-black text-purple-400">
                    {player.fullName.charAt(0)}
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-purple-300 border border-purple-500/30">
                  LOT #{currentLot.sequenceOrder} • {player.category}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black text-white leading-tight">{player.fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-purple-400">{player.role.replace('_', ' ')}</span>
                  <span className="text-xs text-auction-muted">•</span>
                  <span className="text-xs text-auction-muted">
                    {player.city ? `${player.city} • ` : ''}Age {player.age || '—'}
                  </span>
                </div>
              </div>

              {/* Player Cricket Statistics */}
              {player.stats && (
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-auction-card text-center">
                  <div className="bg-auction-card p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-auction-muted block">Matches</span>
                    <span className="text-lg font-black text-white">{player.stats.matches}</span>
                  </div>
                  <div className="bg-auction-card p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-auction-muted block">Runs</span>
                    <span className="text-lg font-black text-white">{player.stats.runs}</span>
                  </div>
                  <div className="bg-auction-card p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-auction-muted block">Wickets</span>
                    <span className="text-lg font-black text-white">{player.stats.wickets}</span>
                  </div>
                  <div className="bg-auction-card p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-auction-muted block">Avg</span>
                    <span className="text-base font-bold text-white">{player.stats.battingAverage || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-auction-muted">
              <Trophy className="w-20 h-20 mb-4 text-auction-card" />
              <h3 className="text-xl font-black text-white">Live Bidding Arena</h3>
              <p className="text-xs mt-1">Next player will appear on this screen automatically.</p>
            </div>
          )}

          {currentLot && (
            <div className="pt-4 border-t border-auction-card flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-auction-muted">Base Price</span>
              <span className="text-xl font-black text-white">₹{currentLot.basePrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Bidding Stage & Leaderboard (7 cols) */}
        <div className="col-span-7 flex flex-col justify-between h-full space-y-6">
          {currentLot ? (
            <div className="bg-auction-surface rounded-3xl border border-auction-card p-8 text-center shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-center">
              <span className="text-xs font-black uppercase tracking-widest text-auction-muted block mb-2">
                CURRENT HIGHEST BID
              </span>

              <div className="text-7xl font-black tracking-tight text-white tabular-nums my-2">
                ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
              </div>

              {currentLot.highestBidderTeamName ? (
                <div className="inline-flex items-center gap-3 mx-auto mt-4 px-6 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 shadow-lg">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                  />
                  <span className="text-xl font-black text-white tracking-wide">
                    {currentLot.highestBidderTeamName}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-auction-muted mt-3 block">
                  Awaiting Opening Bid from Franchise
                </span>
              )}

              {/* Countdown Bar */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl tabular-nums ${
                    countdown <= 5
                      ? 'border-red-500 text-red-500 bg-red-500/10 animate-ping'
                      : 'border-purple-500 text-purple-400 bg-purple-500/10'
                  }`}
                >
                  {countdown}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-auction-muted">
                  Seconds Remaining
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-auction-surface rounded-3xl border border-auction-card p-12 text-center shadow-2xl flex-1 flex flex-col justify-center">
              <Gavel className="w-20 h-20 text-purple-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-white">Auction In Progress</h3>
              <p className="text-sm text-auction-muted mt-2">
                Real-time transactions, team purse calculations and live multiplayer bids.
              </p>
            </div>
          )}

          {/* Teams Live Purse Strip */}
          <div className="bg-auction-surface rounded-3xl border border-auction-card p-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-auction-muted mb-4">
              Franchise Purse & Squad Board
            </h3>

            <div className="grid grid-cols-4 gap-4">
              {snapshot?.teams.map((t) => (
                <div key={t.teamId} className="bg-auction-card/80 p-3.5 rounded-2xl border border-auction-card/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-[10px]"
                      style={{ backgroundColor: t.color || '#2563EB' }}
                    >
                      {t.abbreviation}
                    </div>
                    <span className="font-bold text-xs text-white truncate">{t.name}</span>
                  </div>

                  <span className="text-[10px] text-auction-muted block">Purse Left</span>
                  <span className="text-sm font-black text-white tabular-nums">
                    ₹{t.remainingPurse.toLocaleString()}
                  </span>
                  <div className="text-[9px] text-gray-500 mt-0.5">
                    Squad: {t.squadCount}/{t.maxSquadLimit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Ticker of Recently Acquired Players */}
      <footer className="h-14 bg-auction-surface border-t border-auction-card px-6 flex items-center justify-between text-xs text-auction-muted">
        <div className="flex items-center gap-6 overflow-hidden">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 shrink-0">
            RECENT PURCHASES:
          </span>
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap">
            {snapshot?.recentSoldLots && snapshot.recentSoldLots.length > 0 ? (
              snapshot.recentSoldLots.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-bold text-white">{s.playerName}</span>
                  <span className="text-green-400 font-black">₹{s.soldPrice.toLocaleString()}</span>
                  <span className="text-gray-500">to {s.teamName}</span>
                </div>
              ))
            ) : (
              <span className="text-gray-500 italic">No players auctioned yet</span>
            )}
          </div>
        </div>

        <span className="font-bold text-gray-500 shrink-0">Powered by AUCTIONOS SaaS</span>
      </footer>
    </div>
  );
}
