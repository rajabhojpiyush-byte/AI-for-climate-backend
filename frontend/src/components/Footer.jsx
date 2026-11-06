import ResQAILogo from './ui/ResQAILogo';
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Shield, Phone, Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-(--border-subtle) bg-(--bg-card) text-(--text-muted) pt-16 pb-8 px-4 sm:px-8 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-(--border-subtle)">
        
        {/* Brand Overview */}
        <div className="space-y-4 md:col-span-1">
          <Link to="/" className="flex items-center gap-3 group">
            <ResQAILogo size="md" />
    <span className="font-extrabold text-xl tracking-tight text-(--text-main)">
      ResQ<span className="text-purple-600 dark:text-purple-400">AI</span>
    </span>
  </Link>
          <p className="text-xs text-(--text-muted) leading-relaxed">
            Autonomous emergency disaster verification, multimodal intelligence, and real-time response coordination platform.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full w-fit">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Neural Triage Active</span>
          </div>
        </div>

        {/* Citizen Quick Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-(--text-main) tracking-wider uppercase">Citizen Services</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/report" className="hover:text-purple-600 dark:hover:text-purple-300 transition">
                Submit Emergency Incident
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-purple-600 dark:hover:text-purple-300 transition">
                Track Live Report Progress
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-300 transition">
                Disaster Verification Intelligence
              </Link>
            </li>
          </ul>
        </div>

        {/* Emergency Authority Center */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-(--text-main) tracking-wider uppercase">Emergency Operations</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/authority-login" className="hover:text-purple-600 dark:hover:text-purple-300 transition flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Authority Command Sign In</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-purple-600 dark:hover:text-purple-300 transition">
                Situational Triage Dashboard
              </Link>
            </li>
          </ul>
        </div>

        {/* IMMEDIATE LIFE SAFETY HOTLINES CARD (Fixed Dimensions & Styling) */}
        <div className="space-y-3 bg-slate-500/5 p-5 rounded-3xl border border-(--border-subtle) shadow-sm">
          <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0" />
            <span>Urgent Emergency Hotlines</span>
          </h4>
          <p className="text-[11px] text-(--text-muted) leading-relaxed">
            In immediate life-threatening situations, dial local emergency dispatchers directly:
          </p>
          
          {/* Balanced, Clean Stacked Action Buttons */}
          <div className="space-y-2 pt-1">
            <a 
              href="tel:112" 
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold transition tactile-spring"
            >
              <span>🚨 Universal Emergency</span>
              <span className="font-mono text-sm">112</span>
            </a>
            <a 
              href="tel:108" 
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition tactile-spring"
            >
              <span>🚑 Disaster & Medical</span>
              <span className="font-mono text-sm">108</span>
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-(--text-muted) gap-4">
        <p>© 2026 ResQAI Disaster Intelligence Network. All operational rights reserved.</p>
        <div className="flex gap-6">
          <span>Privacy & Citizen Safety Policy</span>
          <span>Terms of Emergency Use</span>
        </div>
      </div>
    </footer>
  );
}