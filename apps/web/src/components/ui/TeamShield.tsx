'use client';

import React from 'react';

interface TeamShieldProps {
  abbreviation: string;
  name?: string;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TeamShield({
  abbreviation,
  name,
  color,
  size = 'md',
  className = ''
}: TeamShieldProps) {
  const abbr = (abbreviation || 'WIN').toUpperCase();

  const dimensions = {
    sm: { width: 32, height: 36, text: 'text-[9px]' },
    md: { width: 40, height: 46, text: 'text-[11px]' },
    lg: { width: 50, height: 58, text: 'text-sm' },
  }[size];

  // Specific crests based on official MPL franchise abbreviations
  if (abbr === 'CTN') {
    // Coastal Titans — Emerald Green Shield with Golden Crown & Trident motif
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)] ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
        title={name || 'Coastal Titans'}
      >
        <svg viewBox="0 0 100 115" className="w-full h-full">
          <defs>
            <linearGradient id="ctnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>
          {/* Shield Outline & Body */}
          <path
            d="M50 4 L88 16 C88 65 65 96 50 110 C35 96 12 65 12 16 Z"
            fill="url(#ctnGrad)"
            stroke="#34D399"
            strokeWidth="3.5"
          />
          {/* Top Crown / Trident Graphic */}
          <path
            d="M38 24 L50 14 L62 24 L56 30 L44 30 Z"
            fill="url(#goldAccent)"
          />
          <circle cx="50" cy="14" r="3" fill="#FFFFFF" />
          <circle cx="38" cy="24" r="2.5" fill="#FFFFFF" />
          <circle cx="62" cy="24" r="2.5" fill="#FFFFFF" />
        </svg>
        <span
          className={`absolute bottom-2 font-black tracking-tight text-white ${dimensions.text} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
        >
          CTN
        </span>
      </div>
    );
  }

  if (abbr === 'DKG') {
    // Deccan Kings — Royal Purple Shield with Golden 5-Point Crown
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_8px_rgba(139,92,246,0.6)] ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
        title={name || 'Deccan Kings'}
      >
        <svg viewBox="0 0 100 115" className="w-full h-full">
          <defs>
            <linearGradient id="dkgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="50%" stopColor="#7E22CE" />
              <stop offset="100%" stopColor="#581C87" />
            </linearGradient>
            <linearGradient id="dkgGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <path
            d="M50 4 L88 16 C88 65 65 96 50 110 C35 96 12 65 12 16 Z"
            fill="url(#dkgGrad)"
            stroke="#C084FC"
            strokeWidth="3.5"
          />
          {/* 5-Point King Crown Motif */}
          <path
            d="M32 28 L36 17 L50 24 L64 17 L68 28 Z"
            fill="url(#dkgGold)"
          />
          <circle cx="36" cy="16" r="2.5" fill="#FFFFFF" />
          <circle cx="50" cy="22" r="2.5" fill="#FFFFFF" />
          <circle cx="64" cy="16" r="2.5" fill="#FFFFFF" />
        </svg>
        <span
          className={`absolute bottom-2 font-black tracking-tight text-white ${dimensions.text} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
        >
          DKG
        </span>
      </div>
    );
  }

  if (abbr === 'MBS') {
    // Mumbai Strikers — Electric Blue Shield with Lightning Bolt
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_8px_rgba(2,132,199,0.7)] ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
        title={name || 'Mumbai Strikers'}
      >
        <svg viewBox="0 0 100 115" className="w-full h-full">
          <defs>
            <linearGradient id="mbsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <linearGradient id="mbsBolt" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          <path
            d="M50 4 L88 16 C88 65 65 96 50 110 C35 96 12 65 12 16 Z"
            fill="url(#mbsGrad)"
            stroke="#38BDF8"
            strokeWidth="3.5"
          />
          {/* Lightning Bolt Motif */}
          <path
            d="M54 12 L40 28 L49 28 L44 38 L60 22 L51 22 Z"
            fill="url(#mbsBolt)"
          />
        </svg>
        <span
          className={`absolute bottom-2 font-black tracking-tight text-white ${dimensions.text} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
        >
          MBS
        </span>
      </div>
    );
  }

  if (abbr === 'RBL') {
    // Royal Blasters — Crimson Red Shield with Lion / Flame Crest
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 drop-shadow-[0_2px_12px_rgba(239,68,68,0.75)] ${className}`}
        style={{ width: dimensions.width, height: dimensions.height }}
        title={name || 'Royal Blasters'}
      >
        <svg viewBox="0 0 100 115" className="w-full h-full">
          <defs>
            <linearGradient id="rblGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id="rblFlame" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <path
            d="M50 4 L88 16 C88 65 65 96 50 110 C35 96 12 65 12 16 Z"
            fill="url(#rblGrad)"
            stroke="#FCA5A5"
            strokeWidth="3.5"
          />
          {/* Lion / Flame Crest Motif */}
          <path
            d="M50 12 C44 17 42 24 45 28 C47 24 53 22 55 18 C57 23 60 25 58 29 C62 25 61 17 50 12 Z"
            fill="url(#rblFlame)"
          />
          <circle cx="50" cy="27" r="2.5" fill="#FFFFFF" />
        </svg>
        <span
          className={`absolute bottom-2 font-black tracking-tight text-white ${dimensions.text} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
        >
          RBL
        </span>
      </div>
    );
  }

  // Generic fallback shield for dynamic teams
  const teamBg = color || '#2563EB';
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 drop-shadow-md ${className}`}
      style={{ width: dimensions.width, height: dimensions.height }}
      title={name || abbr}
    >
      <svg viewBox="0 0 100 115" className="w-full h-full">
        <path
          d="M50 4 L88 16 C88 65 65 96 50 110 C35 96 12 65 12 16 Z"
          fill={teamBg}
          stroke="#FFFFFF"
          strokeWidth="3"
        />
      </svg>
      <span
        className={`absolute bottom-3 font-black tracking-tight text-white ${dimensions.text} drop-shadow-md`}
      >
        {abbr.slice(0, 3)}
      </span>
    </div>
  );
}
