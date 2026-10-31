import React, { createContext, useContext, useState, useEffect } from 'react';

const IncidentContext = createContext();

const INITIAL_INCIDENTS = [
  {
    id: "INC-8492",
    disasterType: "Flood",
    description: "Rapidly rising water near Mula-Mutha riverbank. Over 6 vehicles submerged and people trapped on elevated bus shelter.",
    imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80",
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: "Mula-Mutha Riverbank, Pune, Maharashtra"
    },
    incidentTime: "2026-09-23T14:30:00Z",
    status: "Under Review",
    aiAnalysis: {
      confidenceScore: 0.94,
      severity: "CRITICAL",
      priorityLevel: "P1",
      priorityScore: 92,
      isDuplicate: false,
      relatedIncidentIds: []
    },
    notes: [
      { id: 1, author: "Dispatch Officer #12", text: "NDRF evacuation unit alerted and en route.", timestamp: "2026-09-23T14:45:00Z" }
    ]
  },
  {
    id: "INC-8488",
    disasterType: "Landslide",
    description: "Massive mudslide blocking Expressway exit 4. Two lanes blocked with heavy rock debris and utility pole.",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    location: {
      latitude: 18.7540,
      longitude: 73.4070,
      address: "Khandala Ghat section, Mumbai-Pune Expressway"
    },
    incidentTime: "2026-09-23T13:15:00Z",
    status: "In Progress",
    aiAnalysis: {
      confidenceScore: 0.89,
      severity: "HIGH",
      priorityLevel: "P2",
      priorityScore: 78,
      isDuplicate: false,
      relatedIncidentIds: ["INC-8490"]
    },
    notes: [
      { id: 1, author: "Highway Patrol", text: "Heavy machinery deployed to clear fallen boulders.", timestamp: "2026-09-23T13:30:00Z" }
    ]
  },
  {
    id: "INC-8490",
    disasterType: "Landslide",
    description: "Rockfall and mud coming down near expressway tunnel entrance.",
    imageUrl: "https://images.unsplash.com/photo-1542314831-c6a4d2757270?auto=format&fit=crop&w=1200&q=80",
    location: {
      latitude: 18.7560,
      longitude: 73.4090,
      address: "Expressway Km 42, Western Ghats"
    },
    incidentTime: "2026-09-23T13:20:00Z",
    status: "Reported",
    aiAnalysis: {
      confidenceScore: 0.91,
      severity: "HIGH",
      priorityLevel: "P2",
      priorityScore: 75,
      isDuplicate: true,
      relatedIncidentIds: ["INC-8488"]
    },
    notes: []
  },
  {
    id: "INC-8475",
    disasterType: "Forest Fire",
    description: "Active smoke plume and fast-spreading brush fire spreading near forest reserve perimeter.",
    imageUrl: "https://images.unsplash.com/photo-1602980085566-4c2813583569?auto=format&fit=crop&w=1200&q=80",
    location: {
      latitude: 18.3664,
      longitude: 73.7558,
      address: "Sinhagad Foothills, Haveli Taluka"
    },
    incidentTime: "2026-09-23T11:40:00Z",
    status: "Verified",
    aiAnalysis: {
      confidenceScore: 0.86,
      severity: "HIGH",
      priorityLevel: "P2",
      priorityScore: 82,
      isDuplicate: false,
      relatedIncidentIds: []
    },
    notes: []
  },
  {
    id: "INC-8461",
    disasterType: "Extreme Weather",
    description: "Uprooted banyan tree fell on residential power lines causing localized blackout and blocked road.",
    imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80",
    location: {
      latitude: 18.5089,
      longitude: 73.8055,
      address: "Kothrud Depot Road, Pune"
    },
    incidentTime: "2026-09-23T09:10:00Z",
    status: "Resolved",
    aiAnalysis: {
      confidenceScore: 0.95,
      severity: "MODERATE",
      priorityLevel: "P3",
      priorityScore: 54,
      isDuplicate: false,
      relatedIncidentIds: []
    },
    notes: [
      { id: 1, author: "Municipal Team", text: "Tree cleared and power restored by MSEDCL.", timestamp: "2026-09-23T12:00:00Z" }
    ]
  }
];

export const IncidentProvider = ({ children }) => {
  const [incidents, setIncidents] = useState(() => {
    const saved = localStorage.getItem('resqai_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [auth, setAuth] = useState(() => {
    const user = localStorage.getItem('resqai_authority_user');
    return user ? JSON.parse(user) : null;
  });

  useEffect(() => {
    localStorage.setItem('resqai_incidents', JSON.stringify(incidents));
  }, [incidents]);

  const addIncident = (newIncident) => {
    const id = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Automated AI Triage Logic
    let priority = "P3";
    let severity = "MODERATE";
    let score = Math.floor(65 + Math.random() * 25);
    
    if (newIncident.disasterType === "Flood" || newIncident.disasterType === "Forest Fire") {
      priority = "P1";
      severity = "CRITICAL";
      score = 92;
    } else if (newIncident.disasterType === "Landslide" || newIncident.disasterType === "Cyclone") {
      priority = "P2";
      severity = "HIGH";
      score = 79;
    }

    const created = {
      ...newIncident,
      id,
      incidentTime: newIncident.incidentTime || new Date().toISOString(),
      status: "Reported",
      aiAnalysis: {
        confidenceScore: 0.92,
        severity,
        priorityLevel: priority,
        priorityScore: score,
        isDuplicate: false,
        relatedIncidentIds: []
      },
      notes: []
    };

    setIncidents(prev => [created, ...prev]);
    return created;
  };

  const updateStatus = (id, newStatus, noteText) => {
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