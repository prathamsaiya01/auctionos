'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionStore } from '@/stores/auctionStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { BidSource, AuctionStatus } from '@auctionos/shared';
import { Modal } from '@/components/ui/Modal';
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
  Clock,
  Flame,
  Sparkles,
  ChevronUp,
  X,
  IndianRupee,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function TeamOwnerLivePage() {
  const params = useParams();
  const auctionId = params?.id as string;
  const router = useRouter();

  const { snapshot, connectionState, initSocket } = useAuctionStore();
  const { user, token } = useAuthStore();

  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [hasVibrated, setHasVibrated] = useState(false);

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
  const myTeamSnapshot = snapshot?.teams?.find((t) => t.teamId === teamId);

  const isHighestBidder = currentLot?.highestBidderTeamId === teamId;
  const nextBidAmount = snapshot?.nextBidAmount || currentLot?.basePrice || 1000;
  const canAfford = myTeamSnapshot ? myTeamSnapshot.remainingPurse >= nextBidAmount : false;
  const isSquadFull = myTeamSnapshot ? myTeamSnapshot.squadCount >= myTeamSnapshot.maxSquadLimit : false;
  const isAuctionPaused = snapshot?.isPaused || snapshot?.status !== AuctionStatus.LIVE;

  // Haptic feedback when outbid
  useEffect(() => {
    if (currentLot && !isHighestBidder && currentLot.highestBidderTeamId && typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(100);
    }
  }, [isHighestBidder, currentLot?.highestBidderTeamId]);

  const handlePlaceBid = async () => {
    if (!currentLot || !teamId || isHighestBidder || !canAfford || isAuctionPaused || submitting) return;

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

      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        window.navigator.vibrate([40, 60, 40]);
      }
    } catch (err: any) {
      setBidError(err.message || 'Bid rejected by server');
    } finally {
      setSubmitting(false);
    }
  };

  // Find players acquired by my team in this auction
  const myAcquiredLots = useMemo(() => {
    if (!snapshot || !teamId || !snapshot.recentSoldLots) return [];
    return snapshot.recentSoldLots.filter((l) => l.teamId === teamId);
  }, [snapshot, teamId]);

  return (
    <div className="min-h-screen bg-auction-bg text-auction-text flex flex-col justify-between max-w-md mx-auto border-x border-auction-card/70 select-none shadow-2xl relative">
      {/* Top Header */}
      <header className="p-3.5 bg-auction-surface/95 backdrop-blur-md border-b border-auction-card sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md border border-white/20"
            style={{ backgroundColor: userTeam?.color || '#2563EB' }}
          >
            {userTeam?.abbreviation || 'MY'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm text-white leading-tight truncate max-w-[150px]">
                {userTeam?.teamName || 'My Franchise'}
              </h1>
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <p className="text-[10px] text-auction-muted font-bold tracking-wider uppercase">
              Bidding Console
            </p>
          </div>
        </div>

        {/* Live Status Indicator & Roster Shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRosterModal(true)}
            className="px-2.5 py-1 bg-auction-card hover:bg-slate-800 text-auction-text rounded-xl text-[10px] font-black border border-auction-card flex items-center gap-1 transition-colors"
          >
            <Users className="w-3 h-3 text-brand-400" />
            <span>Roster ({myAcquiredLots.length})</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-auction-card/80 border border-auction-card rounded-full text-[10px] font-black">
            {connectionState === 'CONNECTED' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
                <span className="text-emerald-400">LIVE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-400">{connectionState}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Team Balance Strip */}
      <div className="bg-gradient-to-r from-brand-950/80 via-slate-900 to-indigo-950/80 border-b border-auction-card/80 p-3 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-400 border border-brand-500/20">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Remaining Purse</span>
            <span className="font-black text-white text-base tabular-nums tracking-tight">
              ₹{myTeamSnapshot ? myTeamSnapshot.remainingPurse.toLocaleString() : '50,000'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-right">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Squad Slots</span>
            <span className="font-black text-white text-base tabular-nums">
              {myTeamSnapshot ? myTeamSnapshot.squadCount : 0}/{myTeamSnapshot?.maxSquadLimit || 15}
            </span>
          </div>
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Content Stage */}
      <main className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {currentLot && player ? (
          <>
            {/* Player Card */}
            <div className="bg-auction-surface rounded-3xl border border-auction-card p-4 relative overflow-hidden shadow-xl">
              {/* Top Row with Lot & Category */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {player.category || 'Regular Lot'}
                </span>
                <span className="text-xs font-mono font-bold text-auction-muted">
                  Lot #{currentLot.sequenceOrder}
                </span>
              </div>

              {/* Player Image & Name */}
              <div className="flex items-center gap-3.5">
                <div className="w-20 h-20 rounded-2xl bg-auction-card border border-auction-card overflow-hidden shrink-0 shadow-md">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-2xl text-brand-400 bg-gradient-to-tr from-brand-950 to-slate-800">
                      {player.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-lg text-white truncate leading-tight tracking-tight">
                    {player.fullName}
                  </h2>
                  <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mt-0.5">
                    {player.role.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-auction-muted font-medium mt-1">
                    Base: <span className="text-white font-bold tabular-nums">₹{currentLot.basePrice.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* Player Cricket Stats Matrix */}
              {player.stats && (
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-auction-card text-center text-[10px]">
                  <div className="bg-auction-card/80 p-1.5 rounded-xl border border-auction-card">
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Matches</span>
                    <span className="font-black text-white text-xs tabular-nums">{player.stats.matches ?? 0}</span>
                  </div>
                  <div className="bg-auction-card/80 p-1.5 rounded-xl border border-auction-card">
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Runs</span>
                    <span className="font-black text-white text-xs tabular-nums">{player.stats.runs ?? 0}</span>
                  </div>
                  <div className="bg-auction-card/80 p-1.5 rounded-xl border border-auction-card">
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Wkts</span>
                    <span className="font-black text-white text-xs tabular-nums">{player.stats.wickets ?? 0}</span>
                  </div>
                  <div className="bg-auction-card/80 p-1.5 rounded-xl border border-auction-card">
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Avg</span>
                    <span className="font-black text-white text-xs tabular-nums">{player.stats.battingAverage || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Winning Bid Display */}
            <div className={`rounded-3xl border p-5 text-center shadow-xl transition-all relative overflow-hidden ${
              isHighestBidder
                ? 'bg-gradient-to-b from-emerald-950/60 to-auction-surface border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-auction-surface border-auction-card'
            }`}>
              <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] font-black uppercase tracking-widest text-auction-muted">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>CURRENT HIGHEST BID</span>
              </div>

              <div className="text-5xl font-black text-white tabular-nums my-2 tracking-tight">
                ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
              </div>

              {isHighestBidder ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-400 text-xs font-black shadow-lg animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>YOUR FRANCHISE LEADS THE BID!</span>
                </div>
              ) : currentLot.highestBidderTeamName ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-auction-card border border-auction-card rounded-full text-xs font-bold text-slate-200">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                  />
                  <span>Held by {currentLot.highestBidderTeamName}</span>
                </div>
              ) : (
                <span className="text-xs text-auction-muted block font-medium">
                  Awaiting opening bid from any franchise
                </span>
              )}

              {bidError && (
                <div className="mt-3 p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bidError}</span>
                </div>
              )}
            </div>

            {/* Recent Bids Feed */}
            <div className="bg-auction-surface rounded-2xl border border-auction-card p-3 space-y-2 flex-1 max-h-36 overflow-y-auto">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                Bid Timeline ({currentLot.bidHistory.length})
              </span>
              {currentLot.bidHistory.length === 0 ? (
                <p className="text-xs text-auction-muted italic text-center py-2">
                  No bids placed on this lot yet.
                </p>
              ) : (
                currentLot.bidHistory.slice(0, 4).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-auction-card/50 border border-auction-card/50"
                  >
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.teamColor || '#3B82F6' }} />
                      {b.teamName}
                    </span>
                    <span className="font-black text-brand-300 tabular-nums">
                      ₹{b.bidAmount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-auction-muted space-y-4">
            <div className="w-20 h-20 rounded-full bg-auction-surface border border-auction-card flex items-center justify-center text-brand-400 shadow-inner">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Live Stage on Standby</h3>
              <p className="text-xs text-auction-muted mt-1 max-w-xs">
                The auctioneer will announce the next cricketer shortly. Keep this screen open to participate.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Big Bid Button */}
      <footer className="p-4 bg-auction-surface/95 backdrop-blur-md border-t border-auction-card sticky bottom-0 z-30">
        <button
          onClick={handlePlaceBid}
          disabled={!currentLot || isHighestBidder || !canAfford || isSquadFull || isAuctionPaused || submitting}
          className={`w-full py-4 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2.5 transition-all select-none active:scale-[0.98] ${
            isHighestBidder
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-not-allowed shadow-none'
              : !canAfford
              ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30 cursor-not-allowed shadow-none'
              : isSquadFull
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed shadow-none'
              : isAuctionPaused
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/30 border border-brand-400/30'
          }`}
        >
          <Gavel className="w-5 h-5 shrink-0" />
          <span className="truncate">
            {isHighestBidder
              ? 'YOU LEAD THE BIDDING'
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

      {/* Franchise Squad Roster Modal */}
      {showRosterModal && (
        <Modal
          isOpen={showRosterModal}
          onClose={() => setShowRosterModal(false)}
          title={`${userTeam?.teamName || 'My Team'} Roster`}
          subtitle={`${myAcquiredLots.length} players acquired this session`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {myAcquiredLots.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No players acquired yet. Bid and win lots to build your squad!
              </div>
            ) : (
              <div className="divide-y divide-slate-800 max-h-[50vh] overflow-y-auto">
                {myAcquiredLots.map((lot) => (
                  <div key={lot.lotId} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{lot.playerName}</p>
                      <p className="text-[11px] text-brand-400 font-semibold">{String(lot.playerRole).replace(/_/g, ' ')}</p>
                    </div>
                    <span className="font-black text-emerald-400 tabular-nums text-sm">
                      ₹{lot.soldPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowRosterModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Back to Live Auction
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
