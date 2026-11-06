import ResQAILogo from './ui/ResQAILogo';
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Activity, Radio, FileText, Search, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-(--border-subtle) bg-(--bg-card) text-(--text-muted) pt-12 pb-8 px-4 sm:px-8 relative z-10 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-(--border-subtle)">
        
        {/* Brand Overview */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-3 group">
            <ResQAILogo size="md" />
            <span className="font-extrabold text-xl tracking-tight text-(--text-main)">
              ResQ<span className="text-purple-600 dark:text-purple-400">AI</span>
            </span>
          </Link>
          <p className="text-xs text-(--text-muted) leading-relaxed max-w-sm">
            Autonomous emergency disaster verification, multimodal intelligence, and real-time response coordination platform for rapid public safety operations.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full w-fit">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Neural Network Operational</span>
          </div>
        </div>

        {/* Citizen Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-(--text-main) tracking-wider uppercase">
            Citizen Services
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/report" className="hover:text-purple-600 dark:hover:text-purple-300 transition flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Submit Emergency Report</span>
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-purple-600 dark:hover:text-purple-300 transition flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-500" />
                <span>Track Live Incident Status</span>
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-300 transition flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Disaster Verification Intelligence</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Emergency Authority Center */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-(--text-main) tracking-wider uppercase">
            Authority Operations
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/authority-login" className="hover:text-purple-600 dark:hover:text-purple-300 transition flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Authority Sign In</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-purple-600 dark:hover:text-purple-300 transition flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Situational Command Dashboard</span>
              </Link>
            </li>
          </ul>
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
