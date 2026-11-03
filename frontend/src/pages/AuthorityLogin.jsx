import ResQAILogo from '../components/ui/ResQAILogo';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function AuthorityLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useIncidents();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Form states (empty by default so signin is required)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const targetPath = location.state?.from?.pathname || '/dashboard';
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Emergency Operations Chief');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!username.trim() || !password) {
        setError('Please enter both Badge ID and passkey');
        return;
      }
      if (login(username, password)) {
        navigate(targetPath, { replace: true });
      } else {
        setError('Invalid responder credentials');
      }
    } else {
      if (!fullName.trim() || !username.trim() || !password) {
        setError('Please complete all registration fields');
        return;
      }
      if (signup(fullName, role, username, password)) {
        navigate(targetPath, { replace: true });
      } else {
        setError('Unable to register officer account. Try again.');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-10 rounded-3xl spatial-card border border-(--border-subtle) shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <ResQAILogo size="lg" className="mx-auto" />
          <h1 className="text-2xl font-black text-(--text-main) mt-2">
            {mode === 'login' ? 'Authority Command Access' : 'Register Officer Credentials'}
          </h1>
          <p className="text-xs text-(--text-muted)">
            {mode === 'login' 
              ? 'Authorized disaster responders & dispatch officers'
              : 'Create authorized badge profile to access live command'
            }
          </p>
        </div>

        {/* Dual Mode Tab Selector */}
        <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-(--border-subtle)">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-800 text-(--text-main) shadow-sm'
                : 'text-(--text-muted) hover:text-(--text-main)'
            }`}
          >
            Officer Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-800 text-(--text-main) shadow-sm'
                : 'text-(--text-muted) hover:text-(--text-main)'
            }`}
          >
            Register / Sign Up
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">
                  Officer Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inspector A. Rao"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">
                  Authority Division / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm font-semibold"
                >
                  <option value="Emergency Operations Chief">Emergency Operations Chief</option>
                  <option value="Disaster Response Lead">Disaster Response Lead</option>
                  <option value="Rapid First Responder">Rapid First Responder</option>
                  <option value="Medical & Evacuation Unit">Medical & Evacuation Unit</option>
                  <option value="Municipal Disaster Officer">Municipal Disaster Officer</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-(--text-muted) mb-1.5">
              Badge ID / Username
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. officer.devraj"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-(--text-main) focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>
            {mode === 'login' && (
              <div className="pt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('responder.chief');
                    setPassword('emergency2026');
                  }}
                  className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                >
                  ⚡ Fill Demo Officer Credentials
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30 tactile-spring cursor-pointer mt-2"
          >
            {mode === 'login' ? 'Authenticate & Access Dashboard' : 'Register Badge & Enter Dashboard'}
          </button>

          <div className="pt-2 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-(--text-muted)">
                New responder?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Create an officer account
                </button>
              </p>
            ) : (
              <p className="text-xs text-(--text-muted)">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

          {mode === 'login' && (
            <p className="text-[11px] text-center text-(--text-muted) pt-1 opacity-75">
              Demo credentials pre-filled for instant testing
            </p>
          )}
        </form>

      </div>
    </div>
  );
}
