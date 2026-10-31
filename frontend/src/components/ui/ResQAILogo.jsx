import React from 'react';

export default function ResQAILogo({ size = 'md', className = '' }) {
  const dimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const dimClass = dimensions[size] || dimensions.md;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimClass} ${className} group`}>
      {/* Ambient Volumetric Glow behind Logo */}
      <span className="absolute inset-0 rounded-2xl bg-linear-to-tr from-purple-600 via-indigo-500 to-cyan-400 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-300"></span>

      {/* Main SVG Tactical Vector Emblem */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Gradient for Outer Shield */}
          <linearGradient id="resq-shield-gradient" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>

          {/* Gradient for Inner Core */}
          <linearGradient id="resq-core-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="resq-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Tactical Shield Silhouette */}
        <path
          d="M50 6C66 6 86 12 88 28C90 52 74 76 50 94C26 76 10 52 12 28C14 12 34 6 50 6Z"
          fill="url(#resq-shield-gradient)"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2.5"
        />

        {/* 2. Inner Shield Shadow Contours */}
        <path
          d="M50 14C62 14 78 19 80 32C81 50 68 69 50 83C32 69 19 50 20 32C22 19 38 14 50 14Z"
          fill="#0B0F19"
          fillOpacity="0.88"
          stroke="rgba(168, 85, 247, 0.3)"
          strokeWidth="1.5"
        />

        {/* 3. Neural Radar Lifeline Pulse (The "Q" and "AI" Pulse Loop) */}
        <path
          d="M26 50H36L42 34L50 66L58 42L64 50H74"
          stroke="url(#resq-core-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#resq-glow)"
        />

        {/* 4. Top Emergency Alert Sparkle Node */}
        <circle cx="50" cy="24" r="4" fill="#38BDF8" filter="url(#resq-glow)" />

        {/* 5. Center Core Pulse Node */}
        <circle cx="50" cy="66" r="3" fill="#A855F7" />
      </svg>
    </div>
  );
}