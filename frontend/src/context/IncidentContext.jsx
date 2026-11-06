import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchReportsAPI, updateReportStatusAPI } from '../services/api';

const IncidentContext = createContext();

// Verified Ongoing Disaster Situations Across Pune & PCMC Metropolitan Perimeter
export const ONGOING_PUNE_INCIDENTS = [
  {
    id: 'INC-PUNE-01',
    rawId: 101,
    disasterType: 'Pavana River Flash Inundation',
    description: 'Pavana river discharge exceeded 14,500 cusecs following upstream dam release. Water level rose 5.2 feet under Chinchwad bridge; 4 civilian vehicles submerged. PCMC Flood Rescue Boat Unit Alpha deployed with inflatable rafts.',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 18.6298,
      longitude: 73.7997,
      address: 'Chinchwad Gaon Bridge & Ghat, Pimpri-Chinchwad, Pune - 411033'
    },
    incidentTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'In Progress',
    aiAnalysis: {
      confidenceScore: 0.96,
      severity: 'CRITICAL',
      priorityLevel: 'P1',
      priorityScore: 95,
      isDuplicate: false,
      aiReasoning: 'Rapid water level rise detected along arterial causeway. High life safety threat requiring urgent watercraft evacuation.',
      humanReviewRequired: false,
      relatedIncidentIds: []
    },
    notes: [
      {
        id: 1,
        author: 'PCMC Flood Rescue Boat Unit Alpha',
        text: 'Inflatable boat unit reached Chinchwad bus shelter. 6 citizens extracted to municipal relief shelter.',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'INC-PUNE-02',
    rawId: 102,
    disasterType: 'Katraj Ghat Highway Landslide & Rockfall',
    description: 'Continuous heavy rainfall triggered massive 40-meter hillside collapse. Heavy mud slurry and boulders blocking both northbound lanes of Old Katraj Ghat section. Transportation corridor halted.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 18.4412,
      longitude: 73.8682,
      address: 'Old Katraj Tunnel Ghat Road (NH-48 Bypass), Pune - 411046'
    },
    incidentTime: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    status: 'Under Review',
    aiAnalysis: {
      confidenceScore: 0.94,
      severity: 'CRITICAL',
      priorityLevel: 'P1',
      priorityScore: 92,
      isDuplicate: false,
      aiReasoning: 'Severe geological displacement obstructing arterial bypass route. Potential for secondary landslides upon continued precipitation.',
      humanReviewRequired: true,
      relatedIncidentIds: []
    },
    notes: [
      {
        id: 2,
        author: 'PMC Disaster Quick Response Cell',
        text: 'Traffic police diverted all heavy vehicles through New Katraj Tunnel. Heavy JCB earthmovers en route.',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'INC-PUNE-03',
    rawId: 103,
    disasterType: 'Hinjawadi Phase 2 Substation Fire',
    description: '33kV transformer explosion at Rajiv Gandhi Infotech Park Phase 2. Dense black toxic smoke plume spreading toward tech campus perimeter. 4 fire tenders actively battling blaze.',
    imageUrl: 'https://images.unsplash.com/photo-1602980085566-4c2813583569?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 18.5913,
      longitude: 73.7188,
      address: 'Rajiv Gandhi Infotech Park Phase 2, Hinjawadi, Pune - 411057'
    },
    incidentTime: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    status: 'In Progress',
    aiAnalysis: {
      confidenceScore: 0.91,
      severity: 'HIGH',
      priorityLevel: 'P2',
      priorityScore: 84,
      isDuplicate: false,
      aiReasoning: 'Industrial electrical combustion with thermal hazard risk. Nearby campus perimeter isolated.',
      humanReviewRequired: false,
      relatedIncidentIds: []
    },
    notes: [
      {
        id: 3,
        author: 'PCMC Fire Brigade (Chinchwad Station)',
        text: 'Primary electrical supply isolated by MSEDCL. Foam suppressant being deployed on transformer bank.',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'INC-PUNE-04',
    rawId: 104,
    disasterType: 'Mula-Mutha Low-Lying Inundation',
    description: 'Khadakwasla dam sluice gates opened at 22,000 cusecs. Mutha river overtopping low-lying settlements near Sangamwadi & Bund Garden. 80+ homes waterlogged.',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 18.5375,
      longitude: 73.8821,
      address: 'Bund Garden Riverside, Sangamwadi, Pune - 411001'
    },
    incidentTime: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: 'Reported',
    aiAnalysis: {
      confidenceScore: 0.89,
      severity: 'HIGH',
      priorityLevel: 'P2',
      priorityScore: 81,
      isDuplicate: false,
      aiReasoning: 'Riverine overflow due to upstream dam discharge. High population density area requires prompt evacuation to designated relief centers.',
      humanReviewRequired: true,
      relatedIncidentIds: []
    },
    notes: []
  },
  {
    id: 'INC-PUNE-05',
    rawId: 105,
    disasterType: 'Dapodi Railway Underpass Waterlogging',
    description: 'Stormwater drainage pump failure resulted in 4.5-foot deep water logging in Dapodi subway on Old Pune-Mumbai Highway. Multiple buses and passenger vehicles stalled.',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
    location: {
      latitude: 18.5802,
      longitude: 73.8291,
      address: 'Old Pune-Mumbai Highway, Dapodi Subway, PCMC, Pune - 411012'
    },
    incidentTime: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    status: 'Reported',
    aiAnalysis: {
      confidenceScore: 0.88,
      severity: 'HIGH',
      priorityLevel: 'P2',
      priorityScore: 76,
      isDuplicate: false,
      aiReasoning: 'Urban drainage saturation paralyzing arterial transport corridor. Moderate life safety risk with severe civic disruption.',
      humanReviewRequired: true,
      relatedIncidentIds: []
    },
    notes: []
  }
];

export const IncidentProvider = ({ children }) => {
  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('resqai_live_incidents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse cached incidents:', e);
      }
    }
    return ONGOING_PUNE_INCIDENTS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [auth, setAuth] = useState(() => {
    const user = localStorage.getItem('resqai_authority_user');
    return user ? JSON.parse(user) : null;
  });

  // Load live reports from FastAPI backend; merge with ongoing Pune situations
  const refreshIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchReportsAPI();
      if (Array.isArray(data) && data.length > 0) {
        const backendIds = new Set(data.map(d => d.id));
        const merged = [...data, ...ONGOING_PUNE_INCIDENTS.filter(p => !backendIds.has(p.id))];
        setIncidents(merged);
        localStorage.setItem('resqai_live_incidents', JSON.stringify(merged));
      } else {
        setIncidents(prev => (prev && prev.length > 0 ? prev : ONGOING_PUNE_INCIDENTS));
      }
      setError(null);
    } catch (err) {
      console.warn('Backend currently unreachable, using ongoing Pune situations:', err);
      setIncidents(prev => (prev && prev.length > 0 ? prev : ONGOING_PUNE_INCIDENTS));
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
    setIncidents(prev => {
      const updated = [newIncident, ...prev];
      localStorage.setItem('resqai_live_incidents', JSON.stringify(updated));
      return updated;
    });
    return newIncident;
  };

  // Update status on backend and local state
  const updateStatus = async (id, newStatus, noteText) => {
    try {
      await updateReportStatusAPI(id, newStatus);
    } catch (err) {
      console.error('Failed to sync status with backend:', err);
    }

    setIncidents(prev => {
      const updated = prev.map(inc => {
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
      });
      localStorage.setItem('resqai_live_incidents', JSON.stringify(updated));
      return updated;
    });
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
