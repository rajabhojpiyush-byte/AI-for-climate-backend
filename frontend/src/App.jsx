import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { IncidentProvider, useIncidents } from './context/IncidentContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CitizenReport from './pages/CitizenReport';
import ReportSuccess from './pages/ReportSuccess';
import TrackReport from './pages/TrackReport';
import AuthorityLogin from './pages/AuthorityLogin';
import Dashboard from './pages/Dashboard';

// Route Guard: Ensures only authenticated / registered officers access the command dashboard
function ProtectedDashboard() {
  const { auth } = useIncidents();
  const location = useLocation();
  if (!auth) {
    return <Navigate to="/authority-login" state={{ from: location }} replace />;
  }
  return <Dashboard />;
}

export default function App() {
  // Default to light theme with aesthetic pastel palette
  const [theme, setTheme] = useState(() => localStorage.getItem('resqai_theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
    localStorage.setItem('resqai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <IncidentProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-(--bg-main) text-(--text-main) relative selection:bg-purple-200 selection:text-purple-900">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <main className="flex-1 pt-24 sm:pt-28 pb-12 px-3 sm:px-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<CitizenReport />} />
              <Route path="/report/success" element={<ReportSuccess />} />
              <Route path="/track" element={<TrackReport />} />
              <Route path="/authority-login" element={<AuthorityLogin />} />
              <Route path="/dashboard" element={<ProtectedDashboard />} />
              <Route path="*" element={
                <div className="max-w-lg mx-auto text-center py-24 space-y-4">
                  <div className="text-6xl font-black text-(--text-muted) opacity-30">404</div>
                  <h2 className="text-2xl font-black text-(--text-main)">Page Not Found</h2>
                  <p className="text-sm text-(--text-muted)">This route doesn't exist in the ResQAI system.</p>
                  <a href="/" className="inline-block mt-4 px-6 py-3 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition shadow-md">Go Home</a>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </IncidentProvider>
  );
}
