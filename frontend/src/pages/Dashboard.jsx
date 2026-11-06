import { useState } from 'react';
import RealMap from '../components/map/RealMap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Radio, Search, MapPin, Layers, Send, X, ChevronRight,
  Shield, LogOut, Download, Volume2, Truck
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';
import { playEmergencyAlert } from '../utils/audioAlert';

const TACTICAL_UNITS = [
  '5th Battalion NDRF (Talegaon Pune)',
  'PCMC Flood Rescue Boat Unit Alpha',
  'PCMC Fire Brigade (Chinchwad Station)',
  'PMC Disaster Quick Response Cell',
  'Maharashtra Civil Defense Medical Van #04'
];

export default function Dashboard() {
  const { incidents, updateStatus, auth, logout, loading, error, refreshIncidents } = useIncidents();
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Selected incident for the side drawer dossier
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusChoice, setStatusChoice] = useState('Under Review');
  const [assignedUnit, setAssignedUnit] = useState(TACTICAL_UNITS[0]);
  const [logNote, setLogNote] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // Audio siren alert state
  const [audioArmed, setAudioArmed] = useState(true);

  // KPIs
  const totalReports = incidents.length;
  const p1Critical = incidents.filter(i => i.aiAnalysis?.priorityLevel === 'P1' && i.status !== 'Resolved').length;
  const underTriage = incidents.filter(i => i.status === 'Reported' || i.status === 'Under Review').length;
  const resolved = incidents.filter(i => i.status === 'Resolved').length;

  const filtered = incidents.filter(inc => {
    const matchesPriority = priorityFilter === 'ALL' || inc.aiAnalysis?.priorityLevel === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || (inc.disasterType || '').toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesSearch = (inc.id || '').toLowerCase().includes(search.toLowerCase()) || 
                          (inc.disasterType || '').toLowerCase().includes(search.toLowerCase()) ||
                          (inc.description || '').toLowerCase().includes(search.toLowerCase()) ||
                          (inc.location?.address && inc.location.address.toLowerCase().includes(search.toLowerCase()));
    return matchesPriority && matchesStatus && matchesCategory && matchesSearch;
  });

  const handleUpdate = () => {
    if (!selectedIncident) return;
    const fullNote = logNote 
      ? `[Unit: ${assignedUnit}] ${logNote}`
      : `Dispatched to ${assignedUnit}`;

    updateStatus(selectedIncident.id, statusChoice, fullNote);
    setSelectedIncident(prev => ({
      ...prev,
      status: statusChoice,
      notes: [
        ...(prev.notes || []),
        {
          id: Date.now(),
          author: auth?.name || "Command Dispatch",
          text: fullNote,
          timestamp: new Date().toISOString()
        }
      ]
    }));
    setLogNote('');
    if (audioArmed) {
      playEmergencyAlert(statusChoice === 'Resolved' ? 'P3' : 'P2');
    }
    setUpdateSuccess(`✓ Incident ${selectedIncident.id} updated to "${statusChoice}" & deployed to ${assignedUnit}`);
    setTimeout(() => setUpdateSuccess(null), 3500);
  };

  const exportCSV = () => {
    if (incidents.length === 0) {
      alert("No incident data to export.");
      return;
    }

    const headers = ["Report_ID", "Disaster_Type", "Priority", "Severity", "Latitude", "Longitude", "Address", "Status", "Timestamp"];
    const rows = filtered.map(i => [
      i.id,
      `"${i.disasterType}"`,
      i.aiAnalysis?.priorityLevel || 'P3',
      i.aiAnalysis?.severity || 'HIGH',
      i.location?.latitude || '',
      i.location?.longitude || '',
      `"${i.location?.address || ''}"`,
      i.status,
      i.incidentTime
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PCMC_Disaster_Incident_Manifest_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

          {/* Tactical Audio Siren Toggle */}
          <button
            type="button"
            onClick={() => {
              setAudioArmed(!audioArmed);
              if (!audioArmed) playEmergencyAlert('P1');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer tactile-spring ${
              audioArmed 
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30' 
                : 'bg-slate-500/10 text-(--text-muted) border border-(--border-subtle)'
            }`}
            title="Toggle Tactical Siren for Incoming Incidents"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{audioArmed ? 'Siren: Armed' : 'Siren: Muted'}</span>
          </button>

          {/* Export CSV Manifest */}
          <button
            type="button"
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-(--text-main) bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-purple-500 transition flex items-center gap-1.5 cursor-pointer tactile-spring shadow-xs"
            title="Download CSV Incident Manifest for Rescue Units"
          >
            <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Export Manifest</span>
          </button>

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

      {/* Update notification feedback */}
      {updateSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{updateSuccess}</span>
          <button onClick={() => setUpdateSuccess(null)} className="text-emerald-600 font-black cursor-pointer">×</button>
        </div>
      )}

      {/* Backend status banners */}
      {loading && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping shrink-0"></span>
          Loading live incident feed from backend...
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
          <span>⚡ Backend unreachable — showing cached & pre-seeded incident data.</span>
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
        <div className="spatial-card p-5 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Active Operations</span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{underTriage}</div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">Triage & review in progress</span>
        </div>

        {/* Resolved */}
        <div className="spatial-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Cleared & Resolved</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolved}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Safe perimeter restored</span>
        </div>

      </div>

      {/* 2. MAP & QUEUE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Interactive RealMap */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-main) flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Tactical Geolocation Grid & Perimeter Watch</span>
            </h2>
            <span className="text-xs text-(--text-muted) font-semibold">
              Live Pune & PCMC Metropolitan Radius
            </span>
          </div>

          <div className="h-100 sm:h-125 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl relative bg-slate-100 dark:bg-slate-900">
            <RealMap
              incidents={filtered}
              onMarkerClick={(inc) => {
                setSelectedIncident(inc);
                setStatusChoice(inc.status || 'Under Review');
              }}
            />
          </div>
        </div>

        {/* Right: Operational Incident Queue Table */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search report ID, hazard, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-(--text-main) focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Category Filter Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-(--text-main) shadow-xs"
              >
                <option value="ALL">All Categories</option>
                <option value="Flood">Floods / Inundation</option>
                <option value="Fire">Fires / Combustion</option>
                <option value="Landslide">Landslides / Rockfall</option>
              </select>

              {/* Priority Filter */}
              {['ALL', 'P1', 'P2', 'P3'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    priorityFilter === p
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-(--text-muted) hover:text-(--text-main)'
                  }`}
                >
                  {p}
                </button>
              ))}

              <span className="text-[11px] text-(--text-muted) ml-auto font-medium">
                {filtered.length} reports
              </span>
            </div>
          </div>

          {/* Scrollable Incident Dossier List */}
          <div className="space-y-2.5 max-h-125 overflow-y-auto pr-1.5 custom-scrollbar">
            {filtered.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              const pLevel = inc.aiAnalysis?.priorityLevel || 'P3';
              const pColor = pLevel === 'P1'
                ? 'border-red-500/40 bg-red-50/30 dark:bg-red-950/15'
                : pLevel === 'P2'
                ? 'border-orange-500/30 bg-orange-50/20 dark:bg-orange-950/10'
                : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60';

              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setStatusChoice(inc.status || 'Under Review');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer tactile-spring text-left space-y-2.5 ${pColor} ${
                    isSelected ? 'ring-2 ring-purple-500 shadow-md' : 'hover:border-purple-300 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                        pLevel === 'P1' 
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                          : pLevel === 'P2'
                          ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
                          : 'bg-slate-500/15 text-(--text-muted) border-slate-400/30'
                      }`}>
                        {pLevel}
                      </span>
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {inc.id}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-(--text-muted) uppercase">
                      {inc.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-(--text-main) line-clamp-1">
                      {inc.disasterType}
                    </h3>
                    <p className="text-[11px] text-(--text-muted) line-clamp-2 mt-0.5 leading-relaxed">
                      {inc.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-(--text-muted)">
                    <span>
                      {inc.location?.address ? `${inc.location.address.slice(0, 28)}...` : `${inc.location?.latitude}°N, ${inc.location?.longitude}°E`}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                      View <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-xs text-(--text-muted)">
                No emergency incidents match current active filters.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. SIDE INCIDENT DOSSIER MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                    {selectedIncident.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-(--text-muted)">
                    {selectedIncident.status}
                  </span>
                </div>
                <h2 className="text-xl font-black text-(--text-main) mt-1">
                  {selectedIncident.disasterType}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-(--text-muted) hover:text-(--text-main) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Evidence Image */}
            {selectedIncident.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 h-48 bg-black relative">
                <img
                  src={selectedIncident.imageUrl}
                  alt="Incident Visual Evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* AI Assessment Panel */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                  Automated Multi-Modal Intelligence
                </span>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-(--text-muted) block">Credibility Confidence</span>
                    <span className="text-lg font-black text-(--text-main)">
                      {selectedIncident.aiAnalysis?.confidenceScore != null
                        ? `${Math.round(selectedIncident.aiAnalysis.confidenceScore * 100)}%`
                        : 'Rule Verified'}
                    </span>
                  </div>
                  <div>
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
                <span className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 block flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>Authority Dispatch Action Center</span>
                </span>

                {/* Tactical Unit Assignment */}
                <div>
                  <label className="block text-[11px] font-bold text-(--text-muted) mb-1">Assign Tactical Field Unit</label>
                  <select
                    value={assignedUnit}
                    onChange={(e) => setAssignedUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-(--text-main) font-semibold"
                  >
                    {TACTICAL_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

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
                <span>Apply Status & Deploy Field Unit</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
