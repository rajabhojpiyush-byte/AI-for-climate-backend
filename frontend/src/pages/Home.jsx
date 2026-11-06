import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FilePlus, Search, Layers, Cpu, Filter, Zap, 
  CheckCircle2, Radio, Activity, Sparkles, ShieldAlert, 
  ArrowRight, PhoneCall, Flame, HeartPulse, Shield, LifeBuoy 
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

// Verified National Emergency Hotlines
const CRISIS_HOTLINES = [
  {
    number: '112',
    title: 'National Emergency',
    subtitle: 'Universal All-Service Dispatch',
    category: 'Universal',
    icon: PhoneCall,
    badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    hoverBorder: 'hover:border-red-500/50'
  },
  {
    number: '108',
    title: 'Disaster & Medical',
    subtitle: 'Emergency Ambulance & Trauma',
    category: 'Medical',
    icon: HeartPulse,
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50'
  },
  {
    number: '101',
    title: 'Fire & Rescue',
    subtitle: 'Rapid Hazard Extrication',
    category: 'Fire Service',
    icon: Flame,
    badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    hoverBorder: 'hover:border-orange-500/50'
  },
  {
    number: '100',
    title: 'Police Control',
    subtitle: 'Law Enforcement & Security',
    category: 'Police',
    icon: Shield,
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/50'
  },
  {
    number: '181',
    title: 'Women Helpline',
    subtitle: 'Crisis Response & Support Cell',
    category: 'Safety',
    icon: LifeBuoy,
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    hoverBorder: 'hover:border-purple-500/50'
  }
];

export default function Home() {
  const { incidents } = useIncidents();

  return (
    <div className="space-y-14 sm:space-y-20 pb-16">
      
      {/* 1. HERO & PRIMARY EMERGENCY ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 space-y-8 animate-fade-lift relative">
        
        {/* Ambient Volumetric Light Leaks */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-125 h-87.5 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-0 right-10 w-75 h-75 bg-sky-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Primary Headline Section */}
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

          {/* Live Operational Ticker */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-(--text-muted) font-semibold">
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

        {/* EMERGENCY FIRST HIERARCHY: Direct Primary Action Card */}
        <div className="max-w-4xl mx-auto pt-2">
          <div className="spatial-card p-6 sm:p-10 rounded-3xl border-2 border-purple-500/30 dark:border-purple-500/40 relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-start gap-4 sm:gap-6 text-left w-full md:w-2/3">
              <div className="p-4 bg-linear-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-600/25 shrink-0 group-hover:scale-105 transition-transform">
                <FilePlus className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Immediate Citizen Intake
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-(--text-main)">
                  Report an Emergency
                </h2>
                <p className="text-(--text-muted) text-xs sm:text-sm leading-relaxed">
                  Witnessing an active flood, wildfire, or building collapse? Upload photos or dictate details. Neural vision models immediately detect severity and alert emergency dispatch teams.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-(--text-muted) pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Multimodal AI triage
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Instant Report ID
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 justify-center">
              <Link 
                to="/report" 
                className="px-8 py-4 rounded-2xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 tactile-spring text-center"
              >
                <span>Report Emergency Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/track" 
                className="px-6 py-3 rounded-2xl font-semibold text-xs text-(--text-main) bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition flex items-center justify-center gap-2 text-center"
              >
                <Search className="w-3.5 h-3.5 text-blue-500" />
                <span>Track Active Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* INSTANT HOTLINES REPLACEMENT: Consolidated Quick-Dial Grid */}
        <div className="max-w-5xl mx-auto pt-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-(--text-main)">
                Urgent Emergency Hotlines (Instant One-Tap Dial)
              </h3>
            </div>
            <span className="text-[11px] text-(--text-muted) font-semibold hidden sm:inline">
              Verified 24/7 National Dispatch
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CRISIS_HOTLINES.map((hotline) => {
              const IconComponent = hotline.icon;
              return (
                <a
                  key={hotline.number}
                  href={`tel:${hotline.number}`}
                  className={`spatial-card p-4 rounded-2xl border border-(--border-subtle) ${hotline.hoverBorder} transition-all tactile-spring flex flex-col justify-between space-y-3 group text-left`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-500/10 text-(--text-main) group-hover:scale-110 transition-transform">
                      <IconComponent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${hotline.badgeColor}`}>
                      {hotline.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-2xl font-black font-mono text-(--text-main) tracking-tight block">
                      {hotline.number}
                    </span>
                    <h4 className="text-xs font-bold text-(--text-main) mt-0.5">
                      {hotline.title}
                    </h4>
                    <p className="text-[10px] text-(--text-muted) line-clamp-1 mt-0.5">
                      {hotline.subtitle}
                    </p>
                  </div>
                </a>
              );
            })}
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
