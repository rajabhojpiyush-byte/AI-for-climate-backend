import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchReportsAPI, updateReportStatusAPI } from '../services/api';

const IncidentContext = createContext();

export const IncidentProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [auth, setAuth] = useState(() => {
    try {
      const user = sessionStorage.getItem('resqai_authority_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  });

  // Load live reports from FastAPI backend
  const refreshIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReportsAPI();
      setIncidents(data);
      setError(null);
    } catch (err) {
      console.warn('Backend currently unreachable, using offline fallback:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIncidents();
  }, [refreshIncidents]);

  // Insert newly created report into state
  const addIncident = (newIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    return newIncident;
  };

  // Update status on backend and local state
  const updateStatus = async (id, newStatus, noteText) => {
    try {
      await updateReportStatusAPI(id, newStatus);
    } catch (err) {
      console.error('Failed to sync status with backend:', err);
    }

    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        const updatedNotes = noteText 
          ? [...(inc.notes || []), {
              id: Date.now(),
              author: auth ? `${auth.name} (${auth.role})` : "Command Center",
              text: noteText,
              timestamp: new Date().toISOString()
            }]
          : inc.notes;

        return { ...inc, status: newStatus, notes: updatedNotes };
      }
      return inc;
    }));
  };

  const login = (username, password) => {
    if (username && password) {
      // Built-in demo authority credentials — always available without registration
      const DEMO_ACCOUNTS = [
        { name: 'Commander Rao', role: 'Emergency Operations Chief', username: 'responder.chief', password: 'emergency2026' },
        { name: 'Officer Demo', role: 'Field Response Officer', username: 'demo', password: 'demo123' },
      ];
      const registered = localStorage.getItem('resqai_registered_users');
      const usersList = [...DEMO_ACCOUNTS, ...(registered ? JSON.parse(registered) : [])];
      const matched = usersList.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );
      if (!matched) return false;
      const user = { name: matched.name, role: matched.role || 'Emergency Response Lead', username: matched.username };
      setAuth(user);
      sessionStorage.setItem('resqai_authority_user', JSON.stringify(user));
      localStorage.removeItem('resqai_authority_user');
      return true;
    }
    return false;
  };

  const signup = (name, role, username, password) => {
    if (name && username && password) {
      const newUser = { name, role: role || "First Responder Lead", username: username.trim(), password };
      const registered = localStorage.getItem('resqai_registered_users');
      const usersList = registered ? JSON.parse(registered) : [];
      usersList.push(newUser);
      localStorage.setItem('resqai_registered_users', JSON.stringify(usersList));

      const sessionUser = { name, role: newUser.role, username: newUser.username };
      setAuth(sessionUser);
      sessionStorage.setItem('resqai_authority_user', JSON.stringify(sessionUser));
      localStorage.removeItem('resqai_authority_user');
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth(null);
    sessionStorage.removeItem('resqai_authority_user');
    localStorage.removeItem('resqai_authority_user');
  };

  return (
    <IncidentContext.Provider value={{
      incidents,
      loading,
      error,
      refreshIncidents,
      addIncident,
      updateStatus,
      auth,
      login,
      signup,
      logout
    }}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => useContext(IncidentContext);
