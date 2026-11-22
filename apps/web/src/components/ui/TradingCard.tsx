'use client';

import React from 'react';
import { Badge } from './Badge';
import { ShieldCheck, UserCheck, Eye, Trophy } from 'lucide-react';
import { CricketRole } from '@auctionos/shared';

export interface TradingCardProps {
  player: {
    id: string;
    fullName: string;
    displayName?: string | null;
    photoUrl?: string | null;
    role: CricketRole | string;
    playerCategory?: string | null;
    city?: string | null;
    age?: number | null;
    basePrice: number | bigint;
    isVerified?: boolean;
    stats?: {
      matches?: number;
      runs?: number;
      wickets?: number;
      battingAverage?: number | string;
      economy?: number | string;
    } | null;
    purchases?: Array<{
      team?: {
        name: string;
        color?: string | null;
        abbreviation?: string | null;
      };
      purchasePrice: number | bigint;
    }>;
  };
  onViewProfile?: () => void;
  onVerify?: () => void;
}

export function TradingCard({ player, onViewProfile, onVerify }: TradingCardProps) {
  const purchase = player.purchases?.[0];
  const roleName = String(player.role).replace('_', ' ');

  return (
    <div className="group relative bg-white rounded-3xl border border-admin-border/80 shadow-xs hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Banner Ribbon */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-100 to-slate-200 overflow-hidden">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.fullName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-100 to-indigo-100 text-brand-600 font-black text-4xl">
            {player.fullName.charAt(0)}
          </div>
        )}

        {/* Category Pill Ribbon */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-purple-300 border border-purple-500/30">
            {player.playerCategory || 'Regular'}
          </span>
          {player.isVerified && (
            <span className="p-1 bg-emerald-500 text-white rounded-full shadow-xs" title="Verified Profile">
              <ShieldCheck className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Sold Overlay Ribbon if already acquired */}
        {purchase && (
          <div className="absolute bottom-2 right-2 px-3 py-1 bg-emerald-600/95 backdrop-blur-md text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 border border-emerald-400/40">
            <span>SOLD: {purchase.team?.name}</span>
          </div>
        )}
      </div>

      {/* Body details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 font-mono">
              {roleName}
            </span>
            <span className="text-xs text-admin-muted font-medium">
              {player.city ? `${player.city}` : ''} {player.age ? `• Age ${player.age}` : ''}
            </span>
          </div>

          <h3 className="text-lg font-black text-admin-text tracking-tight mt-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
            {player.fullName}
          </h3>

          {/* Cricket Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-center">
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Matches</span>
              <span className="text-xs font-black text-gray-900">{player.stats?.matches ?? '—'}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Runs</span>
              <span className="text-xs font-black text-gray-900">{player.stats?.runs ?? '—'}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-400 block">Wickets</span>
              <span className="text-xs font-black text-gray-900">{player.stats?.wickets ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Base Price & Action Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Base Price</span>
            <span className="text-base font-black text-admin-text tabular-nums">
              ₹{Number(player.basePrice).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onViewProfile && (
              <button
                onClick={onViewProfile}
                className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                title="View Full Profile"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {!player.isVerified && onVerify && (
              <button
                onClick={onVerify}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors"
              >
                Verify
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
