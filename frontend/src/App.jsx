import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IncidentProvider } from './context/IncidentContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CitizenReport from './pages/CitizenReport';
import ReportSuccess from './pages/ReportSuccess';
import TrackReport from './pages/TrackReport';
import AuthorityLogin from './pages/AuthorityLogin';
import Dashboard from './pages/Dashboard';

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
        <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-(--bg-main)-[var(--text-main)] relative selection:bg-purple-200 selection:text-purple-900">
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <main className="flex-1 pt-24 sm:pt-28 pb-12 px-3 sm:px-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<CitizenReport />} />
              <Route path="/report/success" element={<ReportSuccess />} />
              <Route path="/track" element={<TrackReport />} />
              <Route path="/authority-login" element={<AuthorityLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </IncidentProvider>
  );
}