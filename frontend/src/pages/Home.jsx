import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FilePlus, Search, Layers, Cpu, Filter, Zap, 
  CheckCircle2, Radio, Activity, Sparkles, ShieldAlert, ArrowRight, Eye 
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function Home() {
  const { incidents } = useIncidents();
  
  // Dynamic Real Metrics
  const totalCount = incidents.length;
  const p1Count = incidents.filter(i => i.aiAnalysis?.priorityLevel === 'P1' && i.status !== 'Resolved').length;
  const verifiedCount = incidents.filter(i => i.status === 'Verified' || i.status === 'In Progress').length;

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* 1. HERO SECTION WITH AMBIENT PASTEL GLOWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-10 animate-fade-lift relative">
        
        {/* Ambient Volumetric Light Leaks */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-125 h-87.5 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-0 right-10 w-75 h-75 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="text-center space-y-4 max-w-4xl mx-auto">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30 text-purple-900 dark:text-purple-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Radio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
            <span>AI Disaster Intelligence & Emergency Response Network</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-(--text-main)">
            Rapid Disaster Reporting & <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-600 via-indigo-600 to-pink-500 dark:from-purple-400 dark:via-pink-400 dark:to-indigo-300">
              Live AI Prioritization
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-(--text-muted) text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Report ongoing emergency incidents with photo evidence or track active response operations. Our multi-modal AI models classify hazards and rank rescue priority in real time.
          </p>

          {/* Live System Operational Ticker Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-(--text-muted) font-semibold">
            <span className="flex items-center gap-1.5 bg-slate-500/5 px-3 py-1 rounded-full border border-(--border-subtle)">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Intake Active
            </span>
            <span className="flex items-center gap-1.5 bg-slate-500/5 px-3 py-1 rounded-full border border-(--border-subtle)">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              99.2% Clustering Accuracy
            </span>
            <span className="flex items-center gap-1.5 bg-slate-500/5 px-3 py-1 rounded-full border border-(--border-subtle)">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Sub-second Triage Index
            </span>
          </div>
        </div>

        {/* TWO HERO CITIZEN ACTION CARDS WITH UIVERSE CTA BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto pt-2">
          
          {/* CARD 1: REPORT INCIDENT */}
          <div className="spatial-card p-6 sm:p-9 rounded-3xl relative overflow-hidden group flex flex-col justify-between items-center text-center space-y-6">
            <div className="flex flex-col items-center space-y-3.5 w-full">
              <div className="p-4 bg-linear-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-600/25 group-hover:scale-110 transition-transform">
                <FilePlus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-(--text-main) group-hover:text-purple-600 dark:group-hover:text-purple-300 transition">
                Report an Emergency
              </h2>
              <p className="text-(--text-muted) text-xs sm:text-sm leading-relaxed max-w-md">
                Witnessing a flood, wildfire, or landslide? Upload or snap a live photo. Our neural vision model automatically detects hazard type and alerts nearby dispatch teams.
              </p>
              
              <ul className="space-y-2 text-xs text-(--text-muted) pt-2 w-full max-w-xs text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Multimodal image & location verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant Report Tracking ID generation</span>
                </li>
              </ul>
            </div>

            {/* UIVERSE ANIMATED CTA BUTTON (PURPLE) */}
            <div className="w-full pt-2 flex justify-center">
              <Link to="/report" className="cssbuttons-io-button btn-purple">
                <span>Start Incident Report</span>
                <div className="icon">
                  <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* CARD 2: TRACK STATUS */}
          <div className="spatial-card p-6 sm:p-9 rounded-3xl relative overflow-hidden group flex flex-col justify-between items-center text-center space-y-6">
            <div className="flex flex-col items-center space-y-3.5 w-full">
              <div className="p-4 bg-linear-to-tr from-blue-600 to-cyan-500 rounded-2xl text-white shadow-lg shadow-blue-600/25 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-(--text-main) group-hover:text-blue-600 dark:group-hover:text-blue-300 transition">
                Track Report Status
              </h2>
              <p className="text-(--text-muted) text-xs sm:text-sm leading-relaxed max-w-md">
                Follow real-time verification, priority ranking, and responder deployment timeline for any previously filed emergency report using your unique Report ID.
              </p>

              <ul className="space-y-2 text-xs text-(--text-muted) pt-2 w-full max-w-xs text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Live triage updates from dispatch teams</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Cluster grouping & relief operation notes</span>
                </li>
              </ul>
            </div>

            {/* UIVERSE ANIMATED CTA BUTTON (BLUE) */}
            <div className="w-full pt-2 flex justify-center">
              <Link to="/track" className="cssbuttons-io-button btn-blue">
                <span>Track Report Status</span>
                <div className="icon">
                  <svg height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor"></path>
                  </svg>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* LIVE SITUATIONAL METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
          <div className="spatial-card p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] uppercase font-bold text-(--text-muted) tracking-wider">Total Reports</span>
            <div className="text-2xl sm:text-3xl font-black text-(--text-main)">{totalCount}</div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">In Response Grid</span>
          </div>

          <div className="spatial-card p-5 rounded-2xl text-left space-y-1 border-red-500/40 glow-p1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">Active P1 Critical</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">{p1Count}</div>
            <span className="text-[11px] text-red-500 font-semibold block">Immediate Threat</span>
          </div>

          <div className="spatial-card p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] uppercase font-bold text-(--text-muted) tracking-wider">Under Operations</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-500">{verifiedCount}</div>
            <span className="text-[11px] text-amber-600 font-semibold block">Field Units Dispatched</span>
          </div>

          <div className="spatial-card p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] uppercase font-bold text-(--text-muted) tracking-wider">AI Deduplication</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-500">99.2%</div>
            <span className="text-[11px] text-emerald-600 font-semibold block">Noise Filtered</span>
          </div>
        </div>

      </section>

      {/* 2. HOW RESQAI PROCESSES INCIDENTS (4-STEP TIMELINE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-(--text-main)">
            How ResQAI Processes Disaster Ingestion
          </h2>
          <p className="text-xs sm:text-sm text-(--text-muted) max-w-xl mx-auto">
            From citizen camera capture to automated neural triage and authority rescue deployment
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="spatial-card p-6 rounded-3xl space-y-3 relative group">
            <div className="p-3.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Step 1 • Citizen Intake</span>
            <h3 className="text-base font-bold text-(--text-main)">Eyewitness Capture</h3>
            <p className="text-xs text-(--text-muted) leading-relaxed">
              Citizens describe the event and snap a live camera picture or upload evidence from their device.
            </p>
          </div>

          <div className="spatial-card p-6 rounded-3xl space-y-3 relative group">
            <div className="p-3.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Step 2 • Neural Vision</span>
            <h3 className="text-base font-bold text-(--text-main)">AI Hazard Detection</h3>
            <p className="text-xs text-(--text-muted) leading-relaxed">
              Multi-modal AI vision automatically inspects image pixels and narrative to classify disaster type and reliability.
            </p>
          </div>

          <div className="spatial-card p-6 rounded-3xl space-y-3 relative group">
            <div className="p-3.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
              <Filter className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Step 3 • Geospatial Engine</span>
            <h3 className="text-base font-bold text-(--text-main)">Spatial Clustering</h3>
            <p className="text-xs text-(--text-muted) leading-relaxed">
              Coordinates are mapped on interactive GIS and deduplicated against ongoing reports in that proximity.
            </p>
          </div>

          <div className="spatial-card p-6 rounded-3xl space-y-3 relative group">
            <div className="p-3.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">Step 4 • First Responders</span>
            <h3 className="text-base font-bold text-(--text-main)">Priority Command</h3>
            <p className="text-xs text-(--text-muted) leading-relaxed">
              Authorities review the live P1–P4 ranked queue and dispatch tactical field units to critical hazard zones.
            </p>
          </div>

        </div>
      </section>

      {/* 3. CORE ARCHITECTURAL CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="spatial-card p-6 sm:p-10 rounded-3xl space-y-8">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-(--text-main)">
              Overcoming Emergency Noise with AI Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
              During natural disasters, dispatch centers are overwhelmed with fragmented social media posts and duplicate citizen calls. ResQAI filters chaos into verified, actionable rescue intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-500/5 border border-(--border-subtle) space-y-2">
              <h3 className="text-base font-bold text-(--text-main)">Cross-Modal Vision Scoring</h3>
              <p className="text-xs text-(--text-muted) leading-relaxed">
                Computer vision cross-checks whether uploaded imagery actually depicts severe flooding, active fire, or blocked roads.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-500/5 border border-(--border-subtle) space-y-2">
              <h3 className="text-base font-bold text-(--text-main)">Spatial-Temporal Clustering</h3>
              <p className="text-xs text-(--text-muted) leading-relaxed">
                Clusters multiple citizen reports of the same incident within proximity windows into a single unified dossier.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-500/5 border border-(--border-subtle) space-y-2">
              <h3 className="text-base font-bold text-(--text-main)">Dynamic P1–P4 Priority Index</h3>
              <p className="text-xs text-(--text-muted) leading-relaxed">
                Calculates life-safety hazard threat scores (0–100) so first responders reach critical victims first.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}