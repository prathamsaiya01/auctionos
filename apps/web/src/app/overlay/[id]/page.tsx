'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionStore } from '@/stores/auctionStore';
import { Trophy, Gavel, CheckCircle2, Sparkles, Flame } from 'lucide-react';
import { LotStatus } from '@auctionos/shared';

export default function OBSOverlayPage() {
  const params = useParams();
  const auctionId = params?.id as string;

  const { snapshot, initSocket } = useAuctionStore();

  useEffect(() => {
    if (auctionId) {
      initSocket(auctionId);
    }
  }, [auctionId, initSocket]);

  const currentLot = snapshot?.currentLot;
  const player = currentLot?.player;
  const recentSold = snapshot?.recentSoldLots?.[0];

  return (
    <div className="w-screen h-screen bg-transparent flex flex-col justify-end p-10 overflow-hidden select-none font-sans">
      <AnimatePresence mode="wait">
        {/* Live Lot Lower-Third Graphic */}
        {currentLot && player ? (
          <motion.div
            key={`lot-${currentLot.lotId}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex items-end gap-5 max-w-4xl"
          >
            {/* Player Photo Visual Card */}
            <div className="w-40 h-48 rounded-3xl bg-slate-950/95 backdrop-blur-md border-2 border-brand-500/60 p-2 shadow-2xl relative overflow-hidden flex flex-col items-center shrink-0">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-5xl text-brand-400 bg-gradient-to-tr from-brand-950 to-slate-900 rounded-2xl">
                  {player.fullName.charAt(0)}
                </div>
              )}
              <div className="absolute top-3 left-3 px-2.5 py-0.5 bg-black/85 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-purple-300 border border-purple-500/40">
                LOT #{currentLot.sequenceOrder}
              </div>
            </div>

            {/* Main Lower-Third Banner */}
            <div className="flex-1 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex items-center justify-between text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                    {player.category || 'Regular'}
                  </span>
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                    {player.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">{player.fullName}</h2>
                <p className="text-xs text-slate-400 font-medium">
                  Base Price: <span className="text-white font-bold tabular-nums">₹{currentLot.basePrice.toLocaleString()}</span>
                </p>
              </div>

              {/* Current Highest Bid Section */}
              <div className="text-right bg-slate-900/90 px-6 py-3.5 rounded-2xl border border-slate-700/70 shadow-inner">
                <div className="flex items-center justify-end gap-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>CURRENT BID</span>
                </div>
                <div className="text-4xl font-black text-amber-400 tabular-nums my-0.5 tracking-tight">
                  ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
                </div>

                {currentLot.highestBidderTeamName ? (
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-white mt-0.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                    />
                    <span>{currentLot.highestBidderTeamName}</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">Awaiting opening bid</span>
                )}
              </div>
            </div>
          </motion.div>
        ) : recentSold ? (
          /* Celebratory SOLD Lower-Third Banner */
          <motion.div
            key={`sold-${recentSold.lotId}`}
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl bg-gradient-to-r from-emerald-950/95 via-slate-950/95 to-purple-950/95 backdrop-blur-xl border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl flex items-center gap-5 text-white"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PLAYER SOLD!</span>
              </span>
              <h3 className="text-3xl font-black tracking-tight">{recentSold.playerName}</h3>
              <p className="text-sm text-slate-300 mt-0.5">
                Acquired by <span className="font-black text-white">{recentSold.teamName}</span> for{' '}
                <span className="font-black text-emerald-400 tabular-nums">₹{recentSold.soldPrice.toLocaleString()}</span>
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
