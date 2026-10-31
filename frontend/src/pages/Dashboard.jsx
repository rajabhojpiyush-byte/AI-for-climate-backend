import React, { useState } from 'react';
import RealMap from '../components/map/RealMap';
import { Link } from 'react-router-dom';
import { 
  Radio, ShieldAlert, AlertTriangle, CheckCircle, Clock, 
  Search, Filter, MapPin, Layers, Send, X, ExternalLink, ChevronRight 
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function Dashboard() {
  const { incidents, updateStatus, auth } = useIncidents();
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Selected incident for the side drawer dossier
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusChoice, setStatusChoice] = useState('Under Review');
  const [logNote, setLogNote] = useState('');

  // KPIs
  const totalReports = incidents.length;
  const p1Critical = incidents.filter(i => i.aiAnalysis?.priorityLevel === 'P1' && i.status !== 'Resolved').length;
  const underTriage = incidents.filter(i => i.status === 'Reported' || i.status === 'Under Review').length;
  const resolved = incidents.filter(i => i.status === 'Resolved').length;

  const filtered = incidents.filter(inc => {
    const matchesPriority = priorityFilter === 'ALL' || inc.aiAnalysis?.priorityLevel === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSearch = inc.id.toLowerCase().includes(search.toLowerCase()) || 
                          inc.disasterType.toLowerCase().includes(search.toLowerCase()) ||
                          inc.description.toLowerCase().includes(search.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  const handleUpdate = () => {
    if (!selectedIncident) return;
    updateStatus(selectedIncident.id, statusChoice, logNote);
    setSelectedIncident(prev => ({
      ...prev,
      status: statusChoice,
      notes: logNote ? [...(prev.notes || []), {
        id: Date.now(),
        author: auth?.name || "Command Dispatch",
        text: logNote,
        timestamp: new Date().toISOString()
      }] : prev.notes
    }));
    setLogNote('');
    alert(`Incident ${selectedIncident.id} updated to ${statusChoice}!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
              Live Operations Feed Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Emergency Command & Situational Triage
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5"
          >
            <span>+ Ingest Direct Report</span>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Ingested */}
        <div className="spatial-card p-5 rounded-2xl border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ingested</span>
          <div className="text-3xl font-black text-white mt-1">{totalReports}</div>
          <span className="text-[11px] text-purple-400 mt-1 block">Live aggregated intake</span>
        </div>

        {/* P1 Critical Card with Perimeter Glow */}
        <div className="spatial-card p-5 rounded-2xl border-red-500/40 glow-p1 bg-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Active P1 Critical</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="text-3xl font-black text-red-500 mt-1">{p1Critical}</div>
          <span className="text-[11px] text-red-400 mt-1 block">Urgent first-responder dispatch</span>
        </div>

        {/* Under Triage */}
        <div className="spatial-card p-5 rounded-2xl border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Under Review</span>
          <div className="text-3xl font-black text-amber-400 mt-1">{underTriage}</div>
          <span className="text-[11px] text-amber-500 mt-1 block">Verification & team allocation</span>
        </div>

        {/* Resolved */}
        <div className="spatial-card p-5 rounded-2xl border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operations Resolved</span>
          <div className="text-3xl font-black text-emerald-400 mt-1">{resolved}</div>
          <span className="text-[11px] text-emerald-500 mt-1 block">Cleared & secured</span>
        </div>

      </div>

      {/* INTERACTIVE TACTICAL GIS RADAR MAP */}
      <div className="spatial-card p-6 rounded-3xl border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              Real GIS Disaster Distribution Map
            </h2>
            <p className="text-xs text-slate-400">Street & terrain spatial clusters across active incident zones</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> P1 Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> P2 High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> P3 Moderate</span>
          </div>
        </div>
        {/* Real OpenStreetMap View */}
        <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
          <RealMap 
            incidents={filtered} 
            zoom={10} 
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setStatusChoice(inc.status);
            }} 
          />
        </div>
      </div>
      {/* INCIDENT DATA TABLE */}
      <div className="spatial-card p-6 rounded-3xl border-slate-800 space-y-4">
        
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ID, category, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'P1', 'P2', 'P3'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Hazard Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(inc => (
                <tr 
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setStatusChoice(inc.status);
                  }}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">{inc.id}</td>
                  <td className="py-3.5 px-4 font-bold text-white">{inc.disasterType}</td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-50 truncate">{inc.location?.address}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-emerald-400">
                      {Math.round((inc.aiAnalysis?.confidenceScore || 0.9) * 100)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                      inc.aiAnalysis?.priorityLevel === 'P1'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    }`}>
                      {inc.aiAnalysis?.priorityLevel} {inc.aiAnalysis?.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="px-3 py-1 rounded-lg text-xs font-semibold text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 transition flex items-center gap-1 ml-auto cursor-pointer">
                      <span>Dossier</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* SLIDE-OVER INCIDENT DOSSIER & ACTION CENTER */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-purple-400 font-bold">{selectedIncident.id}</span>
                  <h3 className="text-xl font-black text-white mt-0.5">{selectedIncident.disasterType}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Evidence */}
              {selectedIncident.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 h-52 relative">
                  <img src={selectedIncident.imageUrl} alt="Incident" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-white/20">
                    Citizen Photo Proof
                  </div>
                </div>
              )}

              {/* AI Verification Analysis */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  AI Multi-modal Verification Diagnostics
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Credibility Index</span>
                    <span className="text-lg font-black text-emerald-400">
                      {Math.round((selectedIncident.aiAnalysis?.confidenceScore || 0.9) * 100)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Hazard Priority</span>
                    <span className="text-lg font-black text-red-400">
                      {selectedIncident.aiAnalysis?.priorityLevel} ({selectedIncident.aiAnalysis?.severity})
                    </span>
                  </div>
                </div>

                {/* Duplicate Alert if detected */}
                {selectedIncident.aiAnalysis?.isDuplicate && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Cross-referenced spatial duplicate of cluster #{selectedIncident.aiAnalysis?.relatedIncidentIds?.[0]}</span>
                  </div>
                )}
              </div>

              {/* Witness Text */}
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Eyewitness Description</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Responder Action Center */}
              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase font-bold text-purple-400 block">
                  Authority Dispatch Action Center
                </span>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Update Incident Status</label>
                  <select
                    value={statusChoice}
                    onChange={(e) => setStatusChoice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress (Field Team Dispatched)</option>
                    <option value="Resolved">Resolved / Cleared</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Add Operational Log Note</label>
                  <textarea
                    rows="2"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Log team deployment or rescue status notes..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Apply Status & Log to Queue</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}