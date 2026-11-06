import { useState } from 'react';
import RealMap from '../components/map/RealMap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Radio, Search, MapPin, Layers, Send, X, ChevronRight,
  Shield, LogOut
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function Dashboard() {
  const { incidents, updateStatus, auth, logout, loading, error, refreshIncidents } = useIncidents();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Selected incident for the side drawer dossier
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusChoice, setStatusChoice] = useState('Under Review');
  const [logNote, setLogNote] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // KPIs
  const totalReports = incidents.length;
  const p1Critical = incidents.filter(i => i.aiAnalysis?.priorityLevel === 'P1' && i.status !== 'Resolved').length;
  const underTriage = incidents.filter(i => i.status === 'Reported' || i.status === 'Under Review').length;
  const resolved = incidents.filter(i => i.status === 'Resolved').length;

  const filtered = incidents.filter(inc => {
    const matchesPriority = priorityFilter === 'ALL' || inc.aiAnalysis?.priorityLevel === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSearch = (inc.id || '').toLowerCase().includes(search.toLowerCase()) || 
                          (inc.disasterType || '').toLowerCase().includes(search.toLowerCase()) ||
                          (inc.description || '').toLowerCase().includes(search.toLowerCase());
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
    setUpdateSuccess(`✓ Incident ${selectedIncident.id} updated to "${statusChoice}"`);
    setTimeout(() => setUpdateSuccess(null), 3500);
  };

  const handleSignOut = () => {
    logout();
    navigate('/authority-login');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-lift">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              Live Operations Feed Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-(--text-main) tracking-tight mt-1">
            Emergency Command & Situational Triage
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Officer Identity Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-xs">
            <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="font-bold text-(--text-main)">{auth?.name || "Command Officer"}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-purple-200/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
              {auth?.role || "Responder"}
            </span>
          </div>

          {/* Secure Lock & Sign Out */}
          <button
            onClick={handleSignOut}
            title="Lock session and sign out"
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <Link
            to="/report"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Ingest Direct Report</span>
          </Link>
        </div>
      </div>

      {/* Backend status banners */}
      {loading && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping shrink-0"></span>
          Loading live incident feed from backend...
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <span>? Backend unreachable � showing cached data.</span>
          <button onClick={refreshIncidents} className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 border border-amber-300 dark:border-amber-600/30 font-bold cursor-pointer transition text-xs">Retry</button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Ingested */}
        <div className="spatial-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">Total Ingested</span>
          <div className="text-3xl font-black text-(--text-main) mt-1">{totalReports}</div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1 block">Live aggregated intake</span>
        </div>

        {/* P1 Critical Card */}
        <div className="spatial-card p-5 rounded-2xl border border-red-200 dark:border-red-500/40 bg-red-50/70 dark:bg-red-950/20 glow-p1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Active P1 Critical</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">{p1Critical}</div>
          <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1 block">Urgent first-responder dispatch</span>
        </div>

        {/* Under Triage */}
        <div className="spatial-card p-5 rounded-2xl border border-amber-200 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Under Review</span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{underTriage}</div>
          <span className="text-[11px] text-amber-700 dark:text-amber-500 font-semibold mt-1 block">Verification & team allocation</span>
        </div>

        {/* Resolved */}
        <div className="spatial-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Operations Resolved</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolved}</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500 font-semibold mt-1 block">Cleared & secured</span>
        </div>

      </div>

      {/* INTERACTIVE TACTICAL GIS RADAR MAP */}
      <div className="spatial-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-(--text-main) flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Real GIS Disaster Distribution Map
            </h2>
            <p className="text-xs text-(--text-muted)">Street & terrain spatial clusters across active incident zones</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-(--text-muted)">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> P1 Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> P2 High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> P3 Moderate</span>
          </div>
        </div>

        {/* Real OpenStreetMap View */}
        <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner">
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
      <div className="spatial-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 space-y-4 shadow-sm">
        
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, category, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-(--text-main) placeholder:text-slate-400 focus:outline-none focus:border-purple-500 transition-colors shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'P1', 'P2', 'P3'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  priorityFilter === p
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-(--text-muted) hover:text-(--text-main) border border-slate-200 dark:border-slate-800'
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-(--text-muted) uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Hazard Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-(--text-muted) font-medium">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                filtered.map(inc => (
                  <tr 
                    key={inc.id}
                    onClick={() => {
                      setSelectedIncident(inc);
                      setStatusChoice(inc.status);
                    }}
                    className="hover:bg-purple-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">{inc.id}</td>
                    <td className="py-3.5 px-4 font-bold text-(--text-main)">{inc.disasterType}</td>
                    <td className="py-3.5 px-4 text-(--text-muted) max-w-50 truncate">{inc.location?.address}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {inc.aiAnalysis?.confidenceScore != null
                          ? `${Math.round(inc.aiAnalysis.confidenceScore * 100)}%`
                          : 'Computed'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        inc.aiAnalysis?.priorityLevel === 'P1'
                          ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/40'
                          : inc.aiAnalysis?.priorityLevel === 'P2'
                          ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40'
                          : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                      }`}>
                        {inc.aiAnalysis?.priorityLevel} {inc.aiAnalysis?.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/40 border border-purple-200 dark:border-purple-500/30 transition flex items-center gap-1 ml-auto cursor-pointer">
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* SLIDE-OVER INCIDENT DOSSIER & ACTION CENTER */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{selectedIncident.id}</span>
                  <h3 className="text-xl font-black text-(--text-main) mt-0.5">{selectedIncident.disasterType}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-(--text-main) hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Evidence */}
              {selectedIncident.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-52 relative shadow-xs">
                  <img src={selectedIncident.imageUrl} alt="Incident" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-white/20">
                    Citizen Photo Proof
                  </div>
                </div>
              )}

              {/* AI Verification Analysis */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-(--text-muted) block">
                  AI Multi-modal Verification Diagnostics
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] text-(--text-muted) block">Credibility Index</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {selectedIncident.aiAnalysis?.confidenceScore != null
                        ? `${Math.round(selectedIncident.aiAnalysis.confidenceScore * 100)}%`
                        : 'Computed'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-[10px] text-(--text-muted) block">Hazard Priority</span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400">
                      {selectedIncident.aiAnalysis?.priorityLevel} ({selectedIncident.aiAnalysis?.severity})
                    </span>
                  </div>
                </div>

                {/* Duplicate Alert if detected */}
                {selectedIncident.aiAnalysis?.isDuplicate && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs flex items-center gap-2">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Cross-referenced spatial duplicate of nearby cluster</span>
                  </div>
                )}
              </div>

              {/* Witness Text */}
              <div>
                <span className="text-xs uppercase font-bold text-(--text-muted) block mb-1">Eyewitness Description</span>
                <p className="text-xs text-(--text-main) leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Responder Action Center */}
              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 block">
                  Authority Dispatch Action Center
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-(--text-muted) mb-1">Update Incident Status</label>
                  <select
                    value={statusChoice}
                    onChange={(e) => setStatusChoice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-(--text-main) font-bold shadow-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress (Field Team Dispatched)</option>
                    <option value="Resolved">Resolved / Cleared</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-(--text-muted) mb-1">Add Operational Log Note</label>
                  <textarea
                    rows="2"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Log team deployment or rescue status notes..."
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-(--text-main) shadow-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
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
