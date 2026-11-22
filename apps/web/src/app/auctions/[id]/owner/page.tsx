'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuctionStore } from '@/stores/auctionStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { BidSource, AuctionStatus } from '@auctionos/shared';
import {
  Gavel,
  ShieldCheck,
  Wallet,
  Users,
  Wifi,
  WifiOff,
  AlertCircle,
  Trophy,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function TeamOwnerLivePage() {
  const params = useParams();
  const auctionId = params?.id as string;
  const router = useRouter();

  const { snapshot, connectionState, initSocket } = useAuctionStore();
  const { user, token } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // User's active team in this tournament
  const userTeam = user?.teams?.[0];
  const teamId = userTeam?.teamId;

  useEffect(() => {
    if (auctionId) {
      initSocket(auctionId, token || undefined, teamId);
    }
  }, [auctionId, token, teamId, initSocket]);

  const currentLot = snapshot?.currentLot;
  const player = currentLot?.player;

  // Find my team's live purse & squad snapshot
  const myTeamSnapshot = snapshot?.teams.find((t) => t.teamId === teamId);

  const isHighestBidder = currentLot?.highestBidderTeamId === teamId;
  const nextBidAmount = snapshot?.nextBidAmount || currentLot?.basePrice || 1000;
  const canAfford = myTeamSnapshot ? myTeamSnapshot.remainingPurse >= nextBidAmount : false;
  const isSquadFull = myTeamSnapshot ? myTeamSnapshot.squadCount >= myTeamSnapshot.maxSquadLimit : false;
  const isAuctionPaused = snapshot?.isPaused || snapshot?.status !== AuctionStatus.LIVE;

  const handlePlaceBid = async () => {
    if (!currentLot || !teamId || isHighestBidder || !canAfford || isAuctionPaused) return;

    setSubmitting(true);
    setBidError(null);

    try {
      await api.post(`/auctions/${auctionId}/bids`, {
        lotId: currentLot.lotId,
        teamId,
        bidAmount: nextBidAmount,
        bidSource: BidSource.ONLINE_OWNER,
        idempotencyKey: `bid_${Date.now()}_${Math.random().toString(36).substring(7)}`
      });
    } catch (err: any) {
      setBidError(err.message || 'Bid rejected by server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-auction-bg text-auction-text flex flex-col justify-between max-w-md mx-auto border-x border-auction-card select-none">
      {/* Top Header */}
      <header className="p-4 bg-auction-surface border-b border-auction-card flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-md"
            style={{ backgroundColor: userTeam?.color || '#2563EB' }}
          >
            {userTeam?.abbreviation || 'MY'}
          </div>
          <div>
            <h1 className="font-black text-sm text-white leading-tight">{userTeam?.teamName || 'My Franchise'}</h1>
            <p className="text-[10px] text-auction-muted">Owner Live Console</p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-auction-card rounded-full text-[10px] font-bold">
          {connectionState === 'CONNECTED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400">CONNECTED</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-amber-400">{connectionState}</span>
            </>
          )}
        </div>
      </header>

      {/* Team Balance Strip */}
      <div className="bg-gradient-to-r from-blue-900/60 to-purple-900/60 border-b border-auction-card p-3 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-purple-400" />
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-300 block">Remaining Purse</span>
            <span className="font-black text-white text-sm tabular-nums">
              ₹{myTeamSnapshot ? myTeamSnapshot.remainingPurse.toLocaleString() : '50,000'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-300 block">Squad Count</span>
            <span className="font-black text-white text-sm">
              {myTeamSnapshot ? myTeamSnapshot.squadCount : 0}/{myTeamSnapshot?.maxSquadLimit || 15}
            </span>
          </div>
          <Users className="w-4 h-4 text-blue-400" />
        </div>
      </div>

      {/* Main Content Stage */}
      <main className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {currentLot && player ? (
          <>
            {/* Player Card */}
            <div className="bg-auction-surface rounded-3xl border border-auction-card p-4 relative overflow-hidden shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-auction-card border border-auction-card overflow-hidden shrink-0">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xl text-purple-400">
                      {player.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {player.category || 'Regular'}
                    </span>
                    <span className="text-[10px] text-auction-muted">Lot #{currentLot.sequenceOrder}</span>
                  </div>

                  <h2 className="font-black text-base text-white truncate leading-snug">{player.fullName}</h2>
                  <p className="text-xs font-bold text-purple-400">{player.role.replace('_', ' ')}</p>
                  <p className="text-[11px] text-auction-muted">Base: ₹{currentLot.basePrice.toLocaleString()}</p>
                </div>
              </div>

              {/* Player Quick Stats */}
              {player.stats && (
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-auction-card text-center text-[10px]">
                  <div className="bg-auction-card p-1.5 rounded-xl">
                    <span className="text-gray-400 block">Matches</span>
                    <span className="font-bold text-white">{player.stats.matches}</span>
                  </div>
                  <div className="bg-auction-card p-1.5 rounded-xl">
                    <span className="text-gray-400 block">Runs</span>
                    <span className="font-bold text-white">{player.stats.runs}</span>
                  </div>
                  <div className="bg-auction-card p-1.5 rounded-xl">
                    <span className="text-gray-400 block">Wkts</span>
                    <span className="font-bold text-white">{player.stats.wickets}</span>
                  </div>
                  <div className="bg-auction-card p-1.5 rounded-xl">
                    <span className="text-gray-400 block">Avg</span>
                    <span className="font-bold text-white">{player.stats.battingAverage || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Winning Bid Display */}
            <div className="bg-auction-surface rounded-3xl border border-auction-card p-5 text-center shadow-lg relative">
              <span className="text-[10px] font-black uppercase tracking-widest text-auction-muted block mb-1">
                CURRENT BID
              </span>
              <div className="text-4xl font-black text-white tabular-nums my-1">
                ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
              </div>

              {isHighestBidder ? (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3.5 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-xs font-black animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>YOUR FRANCHISE HOLDS HIGHEST BID!</span>
                </div>
              ) : currentLot.highestBidderTeamName ? (
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-auction-card rounded-full text-xs font-bold text-blue-400">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                  />
                  <span>Held by {currentLot.highestBidderTeamName}</span>
                </div>
              ) : (
                <span className="text-xs text-auction-muted mt-2 block font-medium">
                  Awaiting opening bid from any franchise
                </span>
              )}

              {bidError && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-xs font-bold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{bidError}</span>
                </div>
              )}
            </div>

            {/* Recent Bids Feed */}
            <div className="bg-auction-surface rounded-2xl border border-auction-card p-3 space-y-1.5 flex-1 max-h-36 overflow-y-auto">
              <span className="text-[9px] uppercase font-bold text-auction-muted tracking-wider block">
                Bid Timeline ({currentLot.bidHistory.length})
              </span>
              {currentLot.bidHistory.length === 0 ? (
                <p className="text-xs text-auction-muted italic">No bids placed yet.</p>
              ) : (
                currentLot.bidHistory.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-auction-card/40"
                  >
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.teamColor || '#3B82F6' }} />
                      {b.teamName}
                    </span>
                    <span className="font-black text-purple-300 tabular-nums">₹{b.bidAmount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-auction-muted">
            <Trophy className="w-16 h-16 mb-3 text-auction-card" />
            <h3 className="text-base font-black text-white">Live Auction Waiting</h3>
            <p className="text-xs mt-1">Please wait for the auctioneer to announce the next player lot.</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Big Bid Button */}
      <footer className="p-4 bg-auction-surface border-t border-auction-card sticky bottom-0 z-20">
        <button
          onClick={handlePlaceBid}
          disabled={!currentLot || isHighestBidder || !canAfford || isSquadFull || isAuctionPaused || submitting}
          className={`w-full py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all ${
            isHighestBidder
              ? 'bg-green-600/30 text-green-300 border border-green-500/30 cursor-not-allowed'
              : !canAfford
              ? 'bg-red-600/30 text-red-300 border border-red-500/30 cursor-not-allowed'
              : isSquadFull
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 active:scale-98'
          }`}
        >
          <Gavel className="w-5 h-5" />
          <span>
            {isHighestBidder
              ? 'YOU ARE HIGHEST BIDDER'
              : !canAfford
              ? 'INSUFFICIENT PURSE'
              : isSquadFull
              ? 'SQUAD FULL (LIMIT REACHED)'
              : isAuctionPaused
              ? 'AUCTION PAUSED'
              : `PLACE BID • ₹${nextBidAmount.toLocaleString()}`}
          </span>
        </button>
      </footer>
    </div>
  );
}
