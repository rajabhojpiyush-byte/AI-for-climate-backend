import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Copy, Compass } from 'lucide-react';

export default function ReportSuccess() {
  const location = useLocation();
  const incident = location.state?.incident;

  if (!incident) {
    return <Navigate to="/report" replace />;
  }

  const copyId = () => {
    navigator.clipboard.writeText(incident.id);
    alert(`Report ID ${incident.id} copied to clipboard!`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="p-8 sm:p-10 rounded-3xl spatial-card border border-(--border-subtle) shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-(--text-main) tracking-tight">
          Emergency Report Ingested
        </h1>
        <p className="text-xs sm:text-sm text-(--text-muted) max-w-md mx-auto">
          Your report has passed AI multi-modal verification and has been queued for immediate responder dispatch.
        </p>

        {/* Unique Report ID Pill */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between max-w-sm mx-auto shadow-sm">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-(--text-muted) tracking-wider">Report Tracking ID</span>
            <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400 block">{incident.id}</span>
          </div>
          <button 
            onClick={copyId} 
            className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-(--text-muted) hover:text-(--text-main) transition-colors cursor-pointer"
            title="Copy ID"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* AI Initial Triage Summary */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-(--text-muted) font-bold uppercase block">AI Priority</span>
            <span className="inline-block mt-1 font-extrabold text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30">
              {incident.aiAnalysis?.priorityLevel || "P1"} {incident.aiAnalysis?.severity}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-(--text-muted) font-bold uppercase block">Reliability Score</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {Math.round((incident.aiAnalysis?.confidenceScore || 0.94) * 100)}% Credibility
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link 
            to={`/track?id=${incident.id}`}
            className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md shadow-purple-600/30 flex items-center gap-2 tactile-spring"
          >
            <Compass className="w-4 h-4" />
            <span>Track Status in Real-Time</span>
          </Link>
          <Link 
            to="/report"
            className="px-6 py-3.5 rounded-xl text-sm font-semibold text-(--text-main) border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition tactile-spring"
          >
            Submit Another Report
          </Link>
        </div>
      </div>
    </div>
  );
}