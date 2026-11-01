import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchReportsAPI, updateReportStatusAPI } from '../services/api';

const IncidentContext = createContext();

export const IncidentProvider = ({ children }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [auth, setAuth] = useState(() => {
    const user = localStorage.getItem('resqai_authority_user');
    return user ? JSON.parse(user) : null;
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
      const user = { name: "Commander Rao", role: "Emergency Operations Chief", username };
      setAuth(user);
      localStorage.setItem('resqai_authority_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuth(null);
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
      logout
    }}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => useContext(IncidentContext);
