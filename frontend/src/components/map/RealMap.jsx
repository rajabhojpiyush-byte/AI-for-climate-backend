import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Official PCMC & Pune Municipal Relief Shelters
const RELIEF_SHELTERS = [
  {
    id: 'SHELTER-PCMC-01',
    name: 'PCMC Akurdi Community Disaster Shelter',
    address: 'Near Akurdi Railway Station / PCCOE Ward, Pimpri-Chinchwad',
    lat: 18.6492,
    lng: 73.7667,
    capacity: '450 Persons',
    facilities: 'Medical triage, clean drinking water, emergency rations',
    status: 'ACTIVE & READY'
  },
  {
    id: 'SHELTER-PCMC-02',
    name: 'Chinchwad Municipal School Evacuation Point',
    address: 'Chinchwad Gaon, Pimpri-Chinchwad',
    lat: 18.6271,
    lng: 73.7915,
    capacity: '600 Persons',
    facilities: 'First aid unit, dry provisions, power backup',
    status: 'ACTIVE & READY'
  },
  {
    id: 'SHELTER-PUNE-03',
    name: 'Balewadi Sports Complex Emergency Relief Center',
    address: 'Mahalunge-Balewadi, Pune',
    lat: 18.5793,
    lng: 73.7731,
    capacity: '1,200 Persons',
    facilities: 'Full medical wing, trauma triage, NDRF staging area',
    status: 'ACTIVE & READY'
  },
  {
    id: 'SHELTER-PUNE-04',
    name: 'Bund Garden Emergency Relief Camp',
    address: 'Sangamwadi / Bund Garden Road, Pune',
    lat: 18.5375,
    lng: 73.8821,
    capacity: '350 Persons',
    facilities: 'Flood rescue boat landing, ambulance station',
    status: 'ACTIVE & READY'
  }
];

// Custom glowing tactical disaster pin
const createTacticalPin = (priority = 'P3') => {
  const colors = {
    P1: '#EF4444',
    P2: '#F97316',
    P3: '#EAB308',
    P4: '#3B82F6',
  };
  const color = colors[priority] || '#A855F7';

  return L.divIcon({
    className: 'tactical-div-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 0 15px ${color}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 11px;">
          !
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Safe Evacuation Shelter Pin (Green)
const createShelterPin = () => {
  return L.divIcon({
    className: 'shelter-div-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 26px; height: 26px; border-radius: 8px; background: #10B981; border: 2px solid #ffffff; box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

export default function RealMap({
  incidents = [],
  center = [18.6298, 73.7997], // Default center at PCMC/Chinchwad
  zoom = 11,
  pickerMode = false,
  selectedCoord = null,
  onSelectLocation = null,
  onSelectIncident = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);
  const shelterGroupRef = useRef(null);
  const floodZoneGroupRef = useRef(null);

  const [showShelters, setShowShelters] = useState(true);
  const [showFloodZones, setShowFloodZones] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: selectedCoord ? [selectedCoord.latitude, selectedCoord.longitude] : center,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      const shelterGroup = L.layerGroup().addTo(map);
      const floodZoneGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markerGroupRef.current = markerGroup;
      shelterGroupRef.current = shelterGroup;
      floodZoneGroupRef.current = floodZoneGroup;

      // Picker Mode
      if (pickerMode) {
        map.on('click', (e) => {
          const lat = parseFloat(e.latlng.lat.toFixed(4));
          const lng = parseFloat(e.latlng.lng.toFixed(4));
          if (onSelectLocation) {
            onSelectLocation({
              latitude: lat,
              longitude: lng,
              address: `GPS Pin: ${lat}° N, ${lng}° E`
            });
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when incidents or selectedCoord changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    const group = markerGroupRef.current;
    group.clearLayers();

    if (pickerMode && selectedCoord) {
      const marker = L.marker([selectedCoord.latitude, selectedCoord.longitude], {
        icon: createTacticalPin('P1'),
        draggable: true
      }).addTo(group);

      marker.bindPopup(`<b style="color:#0f172a">Incident Geotag</b><br/>${selectedCoord.latitude}° N, ${selectedCoord.longitude}° E`).openPopup();

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        if (onSelectLocation) {
          onSelectLocation({
            latitude: parseFloat(pos.lat.toFixed(4)),
            longitude: parseFloat(pos.lng.toFixed(4)),
            address: `Adjusted Pin: ${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E`
          });
        }
      });
      
      mapInstanceRef.current.setView([selectedCoord.latitude, selectedCoord.longitude], 12);
    } else if (!pickerMode && incidents.length > 0) {
      incidents.forEach((inc) => {
        if (!inc.location?.latitude || !inc.location?.longitude) return;

        const pin = L.marker([inc.location.latitude, inc.location.longitude], {
          icon: createTacticalPin(inc.aiAnalysis?.priorityLevel || 'P3')
        }).addTo(group);

        pin.on('click', () => {
          if (onSelectIncident) onSelectIncident(inc);
        });

        pin.bindPopup(`
          <div style="min-width: 200px; font-family: sans-serif; color: #0f172a;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
              <strong style="color: #7c3aed; font-size: 11px; font-family: monospace;">${inc.id}</strong>
              <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: #fee2e2; color: #dc2626;">
                ${inc.aiAnalysis?.priorityLevel || 'P3'}
              </span>
            </div>
            <strong style="font-size: 13px; display:block;">${inc.disasterType}</strong>
            <p style="font-size: 11px; color: #475569; margin: 4px 0; line-height: 1.3;">${inc.description?.slice(0, 80)}...</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              <span style="font-size: 10px; color: #16a34a; font-weight: bold;">
                ${Math.round((inc.aiAnalysis?.confidenceScore || 0.9) * 100)}% Credibility
              </span>
              <span style="font-size: 10px; color: #7c3aed; font-weight: bold;">Open Dossier &rarr;</span>
            </div>
          </div>
        `);
      });
    }
  }, [incidents, selectedCoord, pickerMode]);

  // Update Shelters & Flood Zones
  useEffect(() => {
    if (!shelterGroupRef.current || !floodZoneGroupRef.current) return;
    const shelterGroup = shelterGroupRef.current;
    const floodGroup = floodZoneGroupRef.current;

    shelterGroup.clearLayers();
    floodGroup.clearLayers();

    if (!pickerMode && showShelters) {
      RELIEF_SHELTERS.forEach(shelter => {
        const marker = L.marker([shelter.lat, shelter.lng], {
          icon: createShelterPin()
        }).addTo(shelterGroup);

        marker.bindPopup(`
          <div style="min-width: 210px; font-family: sans-serif; color: #0f172a;">
            <div style="display:flex; align-items:center; gap: 4px; margin-bottom: 4px;">
              <strong style="font-size: 12px; color: #059669;">[Shelter] ${shelter.name}</strong>
            </div>
            <span style="font-size: 10px; color: #64748b; display:block;">Location: ${shelter.address}</span>
            <div style="margin-top: 6px; padding: 4px 6px; background: #ecfdf5; border-radius: 6px; font-size: 10px; color: #065f46;">
              <strong>Capacity:</strong> ${shelter.capacity}<br/>
              <strong>Supplies:</strong> ${shelter.facilities}
            </div>
          </div>
        `);
      });
    }

    if (!pickerMode && showFloodZones) {
      // Pavana River Inundation Buffer Circle (Pimpri-Chinchwad)
      L.circle([18.6298, 73.7997], {
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.18,
        radius: 1200
      }).bindTooltip("Pavana River Flood Warning Inundation Corridor", { sticky: true }).addTo(floodGroup);

      // Mula-Mutha Sangamwadi Confluence Flood Zone
      L.circle([18.5362, 73.8744], {
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.18,
        radius: 1400
      }).bindTooltip("Mula-Mutha Confluence Low-Lying Warning Zone", { sticky: true }).addTo(floodGroup);
    }
  }, [showShelters, showFloodZones, pickerMode]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-55" />

      {/* Layer Toggles for Dashboard View */}
      {!pickerMode && (
        <div className="absolute bottom-3 left-3 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] font-bold border border-slate-300 dark:border-slate-800 shadow-md flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-(--text-main)">
            <input 
              type="checkbox" 
              checked={showShelters} 
              onChange={(e) => setShowShelters(e.target.checked)} 
              className="accent-emerald-600 rounded"
            />
            <span>Evacuation Shelters</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-(--text-main)">
            <input 
              type="checkbox" 
              checked={showFloodZones} 
              onChange={(e) => setShowFloodZones(e.target.checked)} 
              className="accent-blue-600 rounded"
            />
            <span>Inundation Corridors</span>
          </label>
        </div>
      )}
    </div>
  );
}
