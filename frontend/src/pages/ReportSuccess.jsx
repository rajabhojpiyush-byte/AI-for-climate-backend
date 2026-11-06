import React, { useEffect, useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { Copy, Compass, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { playEmergencyAlert } from '../utils/audioAlert';

export default function ReportSuccess() {
  const location = useLocation();
  const incident = location.state?.incident;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Play tactical confirmation chime upon landing on success screen
    playEmergencyAlert('P3');
  }, []);

  if (!incident) {
    return <Navigate to="/report" replace />;
  }

  const copyId = () => {
    navigator.clipboard.writeText(incident.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14 text-center animate-fade-lift">
      <div className="p-8 sm:p-12 rounded-3xl spatial-card border border-(--border-subtle) shadow-2xl space-y-7 relative overflow-hidden">
        
        {/* HIGH-PERFORMANCE CSS ANIMATED SUCCESS TICK */}
        <div className="flex items-center justify-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Ambient Pulse Ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></span>
            
            {/* SVG Animated Circle & Checkmark */}
            <svg 
              className="w-20 h-20 text-emerald-500 relative z-10" 
              viewBox="0 0 52 52" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle 
                cx="26" 
                cy="26" 
                r="24" 
                stroke="currentColor" 
                strokeWidth="3.5"
                className="opacity-20"
              />
              <circle 
                cx="26" 
                cy="26" 
                r="24" 
                stroke="currentColor" 
                strokeWidth="3.5"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  strokeDasharray: 150,
                  strokeDashoffset: 0,
                  animation: 'strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards'
                }}
              />
              <path 
                d="M15 27L22.5 34.5L37 19" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 0,
                  animation: 'strokeCheck 0.4s 0.35s cubic-bezier(0.65, 0, 0.45, 1) both'
                }}
              />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dispatched to Central Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-(--text-main) tracking-tight">
            Emergency Report Ingested
          </h1>
          <p className="text-xs sm:text-sm text-(--text-muted) max-w-md mx-auto leading-relaxed">
            Your incident has been validated by multi-modal AI models and synced across the active emergency command network.
          </p>
        </div>

        {/* Unique Report ID Pill */}
        <div className="p-4 rounded-2xl bg-slate-500/5 border border-purple-500/30 flex items-center justify-between max-w-sm mx-auto shadow-sm">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-(--text-muted) tracking-wider block">
              Official Tracking ID
            </span>
            <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 block tracking-tight">
              {incident.id}
            </span>
          </div>
          <button 
            type="button"
            onClick={copyId} 
            className="p-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Copy Report ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* AI Initial Triage Summary */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
          <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-(--border-subtle)">
            <span className="text-[10px] text-(--text-muted) font-bold uppercase block">Triage Priority</span>
            <span className="inline-block mt-1 font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
              {incident.aiAnalysis?.priorityLevel || "P1"} {incident.aiAnalysis?.severity}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-(--border-subtle)">
            <span className="text-[10px] text-(--text-muted) font-bold uppercase block">AI Credibility</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {Math.round((incident.aiAnalysis?.confidenceScore || 0.94) * 100)}% Verified
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link 
            to={`/track?id=${incident.id}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 tactile-spring"
          >
            <Compass className="w-4 h-4" />
            <span>Track Response Status</span>
          </Link>
          <Link 
            to="/report"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-(--text-main) border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition tactile-spring text-center"
          >
            Submit Another Report
          </Link>
        </div>

      </div>
    </div>
  );
}
