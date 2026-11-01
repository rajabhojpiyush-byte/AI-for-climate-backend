import ResQAILogo from '../components/ui/ResQAILogo';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function AuthorityLogin() {
  const navigate = useNavigate();
  const { login } = useIncidents();
  const [username, setUsername] = useState('responder.chief');
  const [password, setPassword] = useState('emergency2026');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid responder credentials');
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl spatial-card border border-(--border-subtle) shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
  <ResQAILogo size="lg" className="mx-auto" />
  <h1 className="text-2xl font-black text-(--text-main) mt-2">Authority Command Access</h1>
  <p className="text-xs text-(--text-muted)">Authorized disaster responders & dispatch officers</p>
</div>
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">
              Badge ID / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 font-mono shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">
              Secure Passkey
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 tactile-spring cursor-pointer mt-2"
          >
            Authenticate & Access Dashboard
          </button>

          <p className="text-[11px] text-center text-(--text-muted) pt-2">
            Prototype demo credentials pre-filled for evaluation
          </p>
        </form>

      </div>
    </div>
  );
}