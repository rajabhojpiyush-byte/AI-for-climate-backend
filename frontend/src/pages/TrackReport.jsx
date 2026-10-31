import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function TrackReport() {
  const [searchParams] = useSearchParams();
  const { incidents } = useIncidents();
  const [queryId, setQueryId] = useState(searchParams.get('id') || '');
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setQueryId(idFromUrl);
      const found = incidents.find(i => i.id.toLowerCase() === idFromUrl.toLowerCase());
      if (found) setActiveReport(found);
    }
  }, [searchParams, incidents]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!queryId.trim()) return;
    const found = incidents.find(i => i.id.toLowerCase() === queryId.trim().toLowerCase());
    setActiveReport(found || 'NOT_FOUND');
  };

  const steps = [
    { title: "Report Ingested", desc: "Citizen evidence logged and queued into network", status: "completed" },
    { 
      title: "AI Multimodal Verification", 
      desc: "Computer vision credibility checks and spatial deduplication completed", 
      status: activeReport && activeReport !== 'NOT_FOUND' ? "completed" : "pending" 
    },
    { 
      title: "Authority Review & Triage", 
      desc: "Emergency responder priority queue assessment and team assignment", 
      status: activeReport && ['Under Review', 'Verified', 'In Progress', 'Resolved'].includes(activeReport.status) ? "completed" : "current" 
    },
    { 
      title: "Dispatch / On-Site Operations", 
      desc: "Field responders deployed to coordinates for relief and containment", 
      status: activeReport && activeReport.status === 'Resolved' ? "completed" : activeReport?.status === 'In Progress' ? "current" : "pending" 
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header with High-Contrast Text */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-(--text-main) tracking-tight">
          Public Incident Tracker
        </h1>
        <p className="text-xs sm:text-sm text-(--text-muted) max-w-md mx-auto">
          Check verification, AI priority rating, and emergency dispatch status in real time
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
        <div className="relative flex-1">
          <input
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="Enter Report ID (e.g. INC-8492)"
            className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 font-mono shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition tactile-spring cursor-pointer flex items-center justify-center shrink-0"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Active Report Found (Adaptive Light/Dark Card) */}
      {activeReport && activeReport !== 'NOT_FOUND' && (
        <div className="p-6 sm:p-8 rounded-3xl spatial-card border border-(--border-subtle)] shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-(--border-subtle)]">
            <div>
              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{activeReport.id}</span>
              <h2 className="text-2xl font-black text-(--text-main) mt-0.5">{activeReport.disasterType}</h2>
              <div className="flex items-center gap-1.5 text-xs text-(--text-muted) mt-1">
                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                <span>{activeReport.location?.address || `${activeReport.location?.latitude}, ${activeReport.location?.longitude}`}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                {activeReport.aiAnalysis?.priorityLevel} CRITICAL
              </span>
              <span className="block text-xs font-semibold text-(--text-muted) mt-2">
                Status: <strong className="text-(--text-main)]">{activeReport.status}</strong>
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="py-2 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">
              Live Response Progress
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-800">
              {steps.map((st, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    st.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-400 text-white'
                      : st.status === 'current'
                      ? 'bg-purple-600 border-purple-400 text-white animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent'
                  }`}>
                    {st.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-(--text-main)]">{st.title}</h4>
                    <p className="text-xs text-(--text-muted) mt-0.5">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport === 'NOT_FOUND' && (
        <div className="p-8 rounded-3xl spatial-card border border-(--border-subtle) text-center text-xs text-(--text-muted)">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          No disaster report matching this ID was found. Please check the ID or submit a new report.
        </div>
      )}

    </div>
  );
}