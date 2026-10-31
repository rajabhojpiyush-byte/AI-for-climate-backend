import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom glowing tactical pin creator
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

export default function RealMap({
  incidents = [],
  center = [18.5204, 73.8567],
  zoom = 11,
  pickerMode = false,
  selectedCoord = null,
  onSelectLocation = null,
  onSelectIncident = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);

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

      // Standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markerGroupRef.current = markerGroup;

      // Picker Mode: Click on map to drop pin and get coordinates
      if (pickerMode) {
        map.on('click', async (e) => {
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

      marker.bindPopup(`<b style="color:#0f172a">Selected Location</b><br/>${selectedCoord.latitude}, ${selectedCoord.longitude}`).openPopup();

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
          <div style="min-width: 180px; font-family: sans-serif; color: #0f172a;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
              <strong style="color: #7c3aed; font-size: 11px;">${inc.id}</strong>
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 9999px; background: #fee2e2; color: #dc2626;">
                ${inc.aiAnalysis?.priorityLevel || 'P3'}
              </span>
            </div>
            <strong style="font-size: 13px; display:block;">${inc.disasterType}</strong>
            <p style="font-size: 11px; color: #475569; margin: 4px 0;">${inc.description?.slice(0, 75)}...</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              <span style="font-size: 10px; color: #16a34a; font-weight: bold;">
                ${Math.round((inc.aiAnalysis?.confidenceScore || 0.9) * 100)}% AI Conf.
              </span>
              <span style="font-size: 10px; color: #7c3aed; font-weight: bold;">Click pin for dossier &rarr;</span>
            </div>
          </div>
        `);
      });
    }
  }, [incidents, selectedCoord, pickerMode]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full min-h-55" />
    </div>
  );
}