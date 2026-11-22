'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuctionStore } from '@/stores/auctionStore';
import { Trophy, Gavel, CheckCircle2 } from 'lucide-react';
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
    <div className="w-screen h-screen bg-transparent flex flex-col justify-end p-12 overflow-hidden select-none font-sans">
      {/* Lower-Third Broadcast Graphic */}
      {currentLot && player ? (
        <div className="flex items-end gap-4 max-w-4xl animate-fade-in">
          {/* Player Photo Card */}
          <div className="w-40 h-44 rounded-3xl bg-slate-900/90 backdrop-blur-md border-2 border-purple-500/50 p-2 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.fullName} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-4xl text-purple-400">
                {player.fullName.charAt(0)}
              </div>
            )}
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/80 rounded-full text-[9px] font-black uppercase text-purple-300">
              #{currentLot.sequenceOrder}
            </div>
          </div>

          {/* Main Lower-Third Banner */}
          <div className="flex-1 bg-slate-950/90 backdrop-blur-lg border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex items-center justify-between text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white">
                  {player.category || 'Regular'}
                </span>
                <span className="text-xs font-bold text-purple-400">{player.role.replace('_', ' ')}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{player.fullName}</h2>
              <p className="text-xs text-gray-400">Base Price: ₹{currentLot.basePrice.toLocaleString()}</p>
            </div>

            {/* Current Highest Bid Section */}
            <div className="text-right bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">
                CURRENT BID
              </span>
              <div className="text-3xl font-black text-yellow-400 tabular-nums my-0.5">
                ₹{(currentLot.currentBid || currentLot.basePrice).toLocaleString()}
              </div>

              {currentLot.highestBidderTeamName ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentLot.highestBidderTeamColor || '#3B82F6' }}
                  />
                  <span>{currentLot.highestBidderTeamName}</span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-400">Awaiting opening bid</span>
              )}
            </div>
          </div>
        </div>
      ) : recentSold ? (
        /* Sold Celebratory Banner */
        <div className="max-w-2xl bg-gradient-to-r from-emerald-900/90 via-slate-950/90 to-purple-900/90 backdrop-blur-md border-2 border-emerald-500/80 rounded-3xl p-6 shadow-2xl flex items-center gap-6 text-white animate-glow">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">
              PLAYER SOLD!
            </span>
            <h3 className="text-2xl font-black">{recentSold.playerName}</h3>
            <p className="text-sm text-gray-300">
              Acquired by <span className="font-bold text-white">{recentSold.teamName}</span> for{' '}
              <span className="font-black text-yellow-400">₹{recentSold.soldPrice.toLocaleString()}</span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
