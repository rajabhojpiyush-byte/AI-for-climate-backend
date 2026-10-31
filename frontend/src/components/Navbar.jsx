import ResQAILogo from './ui/ResQAILogo';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, Home as HomeIcon, FileText, Search, AlertTriangle, 
  PhoneCall, Shield, Sun, Moon, Menu, X, Radio, ExternalLink 
} from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function Navbar({ theme, toggleTheme }) {
  const location = useLocation();
  const { incidents } = useIncidents();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showHelplineModal, setShowHelplineModal] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Active P1 / P2 alerts
  const activeAlerts = incidents.filter(i => 
    (i.aiAnalysis?.priorityLevel === 'P1' || i.aiAnalysis?.priorityLevel === 'P2') && 
    i.status !== 'Resolved'
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-2.5 sm:py-3 px-3 sm:px-8 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-full we-evolve-pill px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ${
          scrolled ? 'py-2 shadow-xl' : 'py-2.5 sm:py-3'
        }`}
      >
        
        {/* 1. Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
  <ResQAILogo size="md" />
  <div className="flex flex-col">
    <span className="font-black text-lg sm:text-xl tracking-tight text-(--text-main) group-hover:text-purple-600 dark:group-hover:text-purple-300 transition leading-none">
      ResQ<span className="text-purple-600 dark:text-purple-400">AI</span>
    </span>
    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
      Disaster Intel
    </span>
  </div>
</Link>

        {/* 2. Desktop Navigation Links (High-Contrast Active States) */}
        <nav className="hidden lg:flex items-center gap-1.5">
          
          {/* HOME BUTTON (Fixed Contrast) */}
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all tactile-spring ${
              isActive('/') 
                ? 'text-purple-950 bg-purple-100 border border-purple-300 dark:text-purple-200 dark:bg-purple-950/70 dark:border-purple-500/50 shadow-sm' 
                : 'text-(--text-muted) hover:text-(--text-main) hover:bg-slate-500/10'
            }`}
          >
            <HomeIcon className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span>Home</span>
          </Link>

          {/* SUBMIT REPORT BUTTON (Fixed Contrast) */}
          <Link
            to="/report"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all tactile-spring ${
              isActive('/report') 
                ? 'text-purple-950 bg-purple-100 border border-purple-300 dark:text-purple-200 dark:bg-purple-950/70 dark:border-purple-500/50 shadow-sm' 
                : 'text-(--text-muted) hover:text-(--text-main) hover:bg-slate-500/10'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span>Submit Report</span>
          </Link>

          {/* TRACK INCIDENT BUTTON (Fixed Contrast) */}
          <Link
            to="/track"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all tactile-spring ${
              isActive('/track') 
                ? 'text-blue-950 bg-blue-100 border border-blue-300 dark:text-blue-200 dark:bg-blue-950/70 dark:border-blue-500/50 shadow-sm' 
                : 'text-(--text-muted) hover:text-(--text-main) hover:bg-slate-500/10'
            }`}
          >
            <Search className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>Track Incident</span>
          </Link>

          {/* ACTIVE ALERTS BUTTON */}
          <button
            type="button"
            onClick={() => setShowAlertsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-(--text-muted) hover:text-(--text-main) hover:bg-slate-500/10 transition-all tactile-spring cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Active Alerts</span>
            {activeAlerts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {/* HELPLINES BUTTON */}
          <button
            type="button"
            onClick={() => setShowHelplineModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-(--text-muted) hover:text-(--text-main) hover:bg-slate-500/10 transition-all tactile-spring cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-emerald-500" />
            <span>Helplines</span>
          </button>
        </nav>

        {/* 3. Right: Theme Toggle + Authority Sign In + Mobile Menu */}
        <div className="flex items-center gap-2 shrink-0">
          
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-slate-200/70 dark:bg-slate-900/80 border border-(--border-subtle)] text-(--text-main) hover:scale-105 transition shadow-sm cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-indigo-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <Link
            to="/authority-login"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 dark:bg-slate-100 dark:text-slate-950 transition shadow-sm border border-slate-300 dark:border-transparent tactile-spring"
          >
            <Shield className="w-4 h-4 text-purple-700" />
            <span>Authority Sign In</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle Mobile Menu"
            className="lg:hidden p-2 rounded-xl bg-slate-200/70 dark:bg-slate-900/80 border border-(--border-subtle)] text-(--text-main) transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-600" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* --- RESPONSIVE MOBILE DRAWER --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-3xl we-evolve-pill p-5 space-y-3 shadow-2xl animate-fade-lift border border-(--border-subtle)]">
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-bold transition ${
                isActive('/') 
                  ? 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-300 dark:border-purple-500/50' 
                  : 'text-(--text-main) hover:bg-slate-500/10'
              }`}
            >
              <HomeIcon className="w-4 h-4 text-purple-600" />
              <span>Home</span>
            </Link>

            <Link
              to="/report"
              className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-bold transition ${
                isActive('/report') 
                  ? 'bg-purple-100 text-purple-950 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-300 dark:border-purple-500/50' 
                  : 'text-(--text-main) hover:bg-slate-500/10'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Submit Disaster Report</span>
            </Link>

            <Link
              to="/track"
              className={`flex items-center gap-3 p-3 rounded-2xl text-sm font-bold transition ${
                isActive('/track') 
                  ? 'bg-blue-100 text-blue-950 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-300 dark:border-blue-500/50' 
                  : 'text-(--text-main) hover:bg-slate-500/10'
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Track Report Status</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAlertsModal(true);
              }}
              className="flex items-center justify-between p-3 rounded-2xl text-sm font-semibold text-(--text-main) hover:bg-slate-500/10 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Active Regional Alerts</span>
              </div>
              {activeAlerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40">
                  {activeAlerts.length} Active
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowHelplineModal(true);
              }}
              className="flex items-center gap-3 p-3 rounded-2xl text-sm font-semibold text-(--text-main) hover:bg-slate-500/10 transition text-left cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span>Emergency Hotlines</span>
            </button>

            <Link
              to="/authority-login"
              className="flex items-center justify-center gap-2 p-3 mt-2 rounded-2xl text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md tactile-spring"
            >
              <Shield className="w-4 h-4" />
              <span>Authority Command Sign In</span>
            </Link>
          </nav>
        </div>
      )}

      {/* --- ACTIVE ALERTS MODAL --- */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-(--bg-card-solid) border border-(--border-subtle) shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-(--border-subtle)">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/15 text-red-500">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-(--text-main)">Active Regional Hazards</h3>
                  <span className="text-xs text-(--text-muted)">Live uncontained disaster situations</span>
                </div>
              </div>
              <button onClick={() => setShowAlertsModal(false)} className="p-2 text-(--text-muted) hover:text-(--text-main) cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-2xl bg-slate-500/5 border border-red-500/30 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{alert.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                        {alert.aiAnalysis?.priorityLevel} CRITICAL
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-(--text-main) mt-1">{alert.disasterType}</h4>
                    <p className="text-xs text-(--text-muted)] line-clamp-2 mt-0.5">{alert.description}</p>
                    <span className="text-[11px] text-purple-600 dark:text-purple-300 font-semibold block mt-1">📍 {alert.location?.address}</span>
                  </div>
                  <Link 
                    to={`/track?id=${alert.id}`} 
                    onClick={() => setShowAlertsModal(false)}
                    className="p-2 rounded-xl bg-purple-500/15 text-purple-600 hover:bg-purple-600 hover:text-white transition shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAlertsModal(false)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md tactile-spring cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- EMERGENCY HELPLINES MODAL --- */}
      {showHelplineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-(--bg-card-solid) border border-(--border-subtle) shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-(--border-subtle)">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-(--text-main)">Emergency Hotlines</h3>
                  <span className="text-xs text-(--text-muted)">Direct crisis dispatch lines</span>
                </div>
              </div>
              <button onClick={() => setShowHelplineModal(false)} className="p-2 text-(--text-muted) hover:text-(--text-main) cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'National Emergency Universal Dispatch', num: '112', color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
                { name: 'Disaster Relief & Emergency Medical', num: '108', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
                { name: 'National Fire Services', num: '101', color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
                { name: 'State Disaster Management Control', num: '1070', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
              ].map((h, i) => (
                <a
                  key={i}
                  href={`tel:${h.num}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-500/5 border border-(--border-subtle) hover:border-purple-400 transition tactile-spring"
                >
                  <span className="text-xs font-semibold text-(--text-main)">{h.name}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${h.color}`}>
                    📞 {h.num}
                  </span>
                </a>
              ))}
            </div>

            <button 
              onClick={() => setShowHelplineModal(false)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-md tactile-spring cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </header>
  );
}