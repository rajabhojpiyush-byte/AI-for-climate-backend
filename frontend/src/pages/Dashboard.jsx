import React, { useState } from 'react';
import RealMap from '../components/map/RealMap';
import { Link } from 'react-router-dom';
import { 
  Radio, ShieldAlert, AlertTriangle, CheckCircle, Clock, 
  Search, Filter, MapPin, Layers, Send, X, ExternalLink, 
  ChevronRight, Volume2, Download, Truck, ShieldCheck 
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
  const { incidents, updateStatus, auth } = useIncidents();
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Selected incident for the side drawer dossier
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [statusChoice, setStatusChoice] = useState('Under Review');
  const [assignedUnit, setAssignedUnit] = useState(TACTICAL_UNITS[0]);
  const [logNote, setLogNote] = useState('');

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
    const matchesCategory = categoryFilter === 'ALL' || inc.disasterType.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesSearch = inc.id.toLowerCase().includes(search.toLowerCase()) || 
                          inc.disasterType.toLowerCase().includes(search.toLowerCase()) ||
                          inc.description.toLowerCase().includes(search.toLowerCase()) ||
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
          author: auth?.name || "PCMC Command Dispatch",
          text: fullNote,
          timestamp: new Date().toISOString()
        }
      ]
    }));
    setLogNote('');
    if (audioArmed) {
      playEmergencyAlert(statusChoice === 'Resolved' ? 'P3' : 'P2');
    }
    alert(`Incident ${selectedIncident.id} updated to ${statusChoice}!`);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-lift">
      
      {/* Top Bar with High Contrast Theme Support */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-(--border-subtle)">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Live Operations Feed Active • PCMC & Pune Grid
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-(--text-main) tracking-tight mt-1">
            Emergency Command & Situational Triage
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Siren Alert Toggle */}
          <button
            type="button"
            onClick={() => {
              setAudioArmed(!audioArmed);
              if (!audioArmed) playEmergencyAlert('P1');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer tactile-spring ${
              audioArmed 
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30' 
                : 'bg-slate-500/10 text-(--text-muted) border border-(--border-subtle)'
            }`}
            title="Toggle Tactical Siren for Incoming Incidents"
          >
            <Volume2 className="w-4 h-4" />
            <span>{audioArmed ? 'Siren: Armed' : 'Siren: Muted'}</span>
          </button>

          {/* Export CSV Manifest */}
          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-(--text-main) bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-purple-500 transition flex items-center gap-1.5 cursor-pointer tactile-spring shadow-sm"
            title="Download CSV Incident Manifest for Rescue Units"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Export Manifest</span>
          </button>

          <Link
            to="/report"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md shadow-purple-600/30 flex items-center gap-1.5 tactile-spring"
          >
            <span>+ Ingest Direct Report</span>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Ingested */}
        <div className="spatial-card p-5 rounded-2xl border border-(--border-subtle)">
          <span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">Total Ingested</span>
          <div className="text-3xl font-black text-(--text-main) mt-1">{totalReports}</div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 block font-semibold">Live aggregated intake</span>
        </div>

        {/* P1 Critical Card with Perimeter Glow */}
        <div className="spatial-card p-5 rounded-2xl border border-red-500/40 glow-p1 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Active P1 Critical</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <div className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">{p1Critical}</div>
          <span className="text-[11px] text-red-500 mt-1 block font-semibold">Immediate tactical rescue dispatch</span>
        </div>

        {/* Under Triage */}
        <div className="spatial-card p-5 rounded-2xl border border-(--border-subtle)">
          <span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">Under Review</span>
          <div className="text-3xl font-black text-amber-500 mt-1">{underTriage}</div>
          <span className="text-[11px] text-amber-600 mt-1 block font-semibold">Field team allocation & verification</span>
        </div>

        {/* Resolved */}
        <div className="spatial-card p-5 rounded-2xl border border-(--border-subtle)">
          <span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">Operations Cleared</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolved}</div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-semibold">Corridor secured & victims safe</span>
        </div>

      </div>

      {/* INTERACTIVE TACTICAL GIS RADAR MAP */}
      <div className="spatial-card p-6 rounded-3xl border border-(--border-subtle) space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-(--text-main) flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Real GIS Disaster Distribution & Relief Shelter Map
            </h2>
            <p className="text-xs text-(--text-muted)">
              Street & terrain clusters across active PCMC & Pune incident zones, showing shelters and flood buffers
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-(--text-muted)">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span> P1 Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> P2 High</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Relief Shelter</span>
          </div>
        </div>

        {/* Real OpenStreetMap View */}
        <div className="h-96 w-full rounded-2xl overflow-hidden border border-(--border-subtle) relative shadow-inner">
          <RealMap 
            incidents={filtered} 
            zoom={11} 
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setStatusChoice(inc.status);
            }} 
          />
        </div>
      </div>

      {/* INCIDENT DATA TABLE */}
      <div className="spatial-card p-6 rounded-3xl border border-(--border-subtle) space-y-4">
        
        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, category, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-(--text-main) shadow-sm"
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
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-white dark:bg-slate-900 text-(--text-muted) hover:text-(--text-main) border border-slate-300 dark:border-slate-800 shadow-sm'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Table with Clean Light & Dark Typography */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-(--border-subtle) text-(--text-muted) uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Hazard Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">AI Score</th>
                <th className="py-3 px-4">Priority Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Review Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-subtle)">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-xs text-(--text-muted)">
                    No incidents matching current search/filters.
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
                    className="hover:bg-slate-500/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">{inc.id}</td>
                    <td className="py-3.5 px-4 font-bold text-(--text-main)">{inc.disasterType}</td>
                    <td className="py-3.5 px-4 text-(--text-muted) max-w-50 truncate">{inc.location?.address}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {Math.round((inc.aiAnalysis?.confidenceScore || 0.9) * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        inc.aiAnalysis?.priorityLevel === 'P1'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                          : 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30'
                      }`}>
                        {inc.aiAnalysis?.priorityLevel} {inc.aiAnalysis?.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-(--text-main) border border-(--border-subtle)">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-600 hover:text-white transition flex items-center gap-1 ml-auto cursor-pointer">
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-(--border-subtle) p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-(--border-subtle)">
                <div>
                  <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">{selectedIncident.id}</span>
                  <h3 className="text-xl font-black text-(--text-main) mt-0.5">{selectedIncident.disasterType}</h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 rounded-xl text-(--text-muted) hover:text-(--text-main) hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Evidence */}
              {selectedIncident.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-(--border-subtle) h-52 relative bg-black">
                  <img src={selectedIncident.imageUrl} alt="Incident" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-white/20">
                    Citizen Photo Proof
                  </div>
                </div>
              )}

              {/* AI Verification Analysis */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-(--border-subtle) space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-(--text-muted) block">
                  AI Multi-modal Verification Diagnostics
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-(--border-subtle)">
                    <span className="text-[10px] text-(--text-muted) block">Credibility Index</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {Math.round((selectedIncident.aiAnalysis?.confidenceScore || 0.9) * 100)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-(--border-subtle)">
                    <span className="text-[10px] text-(--text-muted) block">Hazard Priority</span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400">
                      {selectedIncident.aiAnalysis?.priorityLevel} ({selectedIncident.aiAnalysis?.severity})
                    </span>
                  </div>
                </div>

                {/* Duplicate Alert if detected */}
                {selectedIncident.aiAnalysis?.isDuplicate && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Cross-referenced spatial duplicate of cluster #{selectedIncident.aiAnalysis?.relatedIncidentIds?.[0]}</span>
                  </div>
                )}
              </div>

              {/* Witness Text */}
              <div>
                <span className="text-xs uppercase font-bold text-(--text-muted) block mb-1">Eyewitness Description</span>
                <p className="text-xs text-(--text-main) leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-(--border-subtle)">
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
                  <label className="block text-[11px] font-bold text-(--text-muted) mb-1">Update Incident Status</label>
                  <select
                    value={statusChoice}
                    onChange={(e) => setStatusChoice(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-(--text-main) font-bold"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress (Field Team Dispatched)</option>
                    <option value="Resolved">Resolved / Cleared</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-(--text-muted) mb-1">Add Operational Log Note</label>
                  <textarea
                    rows="2"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="Log team deployment or rescue status notes..."
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-(--text-main)"
                  />
                </div>
              </div>

            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-(--border-subtle)">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer tactile-spring"
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
