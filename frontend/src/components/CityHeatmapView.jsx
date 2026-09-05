import { API_BASE_URL } from '../config';
import { FALLBACK_WARDS, FALLBACK_COMPLAINTS } from '../data/fallbackData';
import { getAllFirestoreComplaints, updateComplaintInFirestore, subscribeToAllFirestoreComplaints } from '../lib/firebase';
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Flame, Layers, Calendar, Filter, MapPin, AlertTriangle, ShieldCheck,
  TrendingUp, Activity, Sparkles, Building2, Info, Compass, CheckCircle2,
  RefreshCw, SlidersHorizontal, Image, Check, Eye, User, Phone, CheckSquare
} from 'lucide-react';

const createSmallPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-small-pin',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; cursor: pointer;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const createComplaintPinIcon = (urgency, status) => {
  let color = '#ea580c'; // default orange
  if (status === 'RESOLVED') color = '#10b981'; // emerald
  else if (urgency === 'Critical' || urgency === 'EXTREME_CRITICAL') color = '#dc2626'; // red
  else if (status === 'APPROVED_BY_ADMIN' || status === 'IN_PROGRESS') color = '#2563eb'; // blue
  
  return L.divIcon({
    className: 'custom-complaint-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px ${color};"></div>
        <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid ${color}; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Leaflet Dynamic Heatmap Layer Component
function LeafletHeatLayer({ points, layerType }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.L = L;
    }
    if (!window.L?.heatLayer) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      script.async = true;
      script.onload = () => {
        renderHeatLayer();
      };
      document.body.appendChild(script);
    } else {
      renderHeatLayer();
    }

    function renderHeatLayer() {
      if (!map || !window.L || !window.L.heatLayer) return;

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      if (points.length === 0) return;

      const heatData = points.map(p => {
        let intensity = 0.7;
        if (layerType === 'infra_deficit') intensity = p.urgency === 'Critical' ? 0.9 : 0.5;
        else if (layerType === 'construction') intensity = 0.8;
        else intensity = p.urgency === 'Critical' ? 1.0 : 0.6;
        return [parseFloat(p.lat) || 22.712, parseFloat(p.lng) || 75.908, intensity];
      });

      const gradientConfig = layerType === 'construction'
        ? { 0.2: '#0284c7', 0.5: '#eab308', 0.8: '#f97316', 1.0: '#ea580c' }
        : { 0.15: '#3b82f6', 0.35: '#10b981', 0.6: '#eab308', 0.8: '#f97316', 1.0: '#dc2626' };

      const heat = window.L.heatLayer(heatData, {
        radius: 28,
        blur: 18,
        maxZoom: 16,
        max: 1.0,
        gradient: gradientConfig
      });

      heat.addTo(map);
      heatLayerRef.current = heat;
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, layerType]);

  return null;
}

export default function CityHeatmapView({ isSuperAdmin, onOpenAuth }) {
  const [complaints, setComplaints] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('august_2026');
  const [selectedLayer, setSelectedLayer] = useState('grievance_density');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [mapCenter, setMapCenter] = useState([22.7196, 75.8577]);
  const [loading, setLoading] = useState(false);
  const [showCitizenPins, setShowCitizenPins] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showHotspotHubs, setShowHotspotHubs] = useState(true);

  useEffect(() => {
    fetchData();

    // Real-time Firestore sync for incoming citizen complaints
    const unsubscribe = subscribeToAllFirestoreComplaints((fsComps) => {
      if (Array.isArray(fsComps) && fsComps.length > 0) {
        setComplaints((prev) => {
          const map = new Map(prev.map(c => [c.id, c]));
          fsComps.forEach((fc) => {
            if (fc && fc.id) {
              map.set(fc.id, { ...(map.get(fc.id) || {}), ...fc });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, wardRes, firestoreComps] = await Promise.allSettled([
        fetch(API_BASE_URL + '/api/complaints').then(r => r.ok ? r.json() : []),
        fetch(API_BASE_URL + '/api/wards').then(r => r.ok ? r.json() : []),
        getAllFirestoreComplaints()
      ]);

      const backendComps = compRes.status === 'fulfilled' && Array.isArray(compRes.value) ? compRes.value : [];
      const fsComps = firestoreComps.status === 'fulfilled' && Array.isArray(firestoreComps.value) ? firestoreComps.value : [];

      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      } catch (err) {}

      // Merge all sources: local citizen submissions, Firestore real-time DB, backend DB, and fallback seed
      const allSources = [...localSaved, ...fsComps, ...backendComps, ...FALLBACK_COMPLAINTS];
      const mergedMap = new Map();
      allSources.forEach(c => {
        if (c && c.id) {
          if (!mergedMap.has(c.id)) {
            mergedMap.set(c.id, c);
          } else {
            mergedMap.set(c.id, { ...mergedMap.get(c.id), ...c });
          }
        }
      });

      const allComps = Array.from(mergedMap.values());
      setComplaints(allComps);

      const wardData = wardRes.status === 'fulfilled' && Array.isArray(wardRes.value) && wardRes.value.length > 0
        ? wardRes.value : FALLBACK_WARDS;
      setWards(wardData);
    } catch (e) {
      console.warn("Backend loading or offline, using fallback heatmap data:", e);
      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      } catch (err) {}
      const fallbackMerged = [...localSaved, ...FALLBACK_COMPLAINTS];
      const unique = Array.from(new Map(fallbackMerged.map(c => [c.id, c])).values());
      setComplaints(unique);
      setWards(FALLBACK_WARDS);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveComplaint = async (complaintId) => {
    // Optimistic UI update
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'APPROVED_BY_ADMIN' } : c));
    try {
      const stored = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      const updated = stored.map(c => c.id === complaintId ? { ...c, current_status: 'APPROVED_BY_ADMIN' } : c);
      localStorage.setItem('nagarmitra_local_complaints', JSON.stringify(updated));
    } catch (e) {}
    updateComplaintInFirestore(complaintId, { current_status: 'APPROVED_BY_ADMIN' });
    try {
      await fetch(`${API_BASE_URL}/api/complaints/approve/${complaintId}`, { method: 'POST' });
    } catch (e) {
      console.warn('Approve error:', e);
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    // Optimistic UI update
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'RESOLVED' } : c));
    try {
      const stored = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      const updated = stored.map(c => c.id === complaintId ? { ...c, current_status: 'RESOLVED' } : c);
      localStorage.setItem('nagarmitra_local_complaints', JSON.stringify(updated));
    } catch (e) {}
    updateComplaintInFirestore(complaintId, { current_status: 'RESOLVED' });
    try {
      await fetch(`${API_BASE_URL}/api/complaints/resolve/${complaintId}`, { method: 'POST' });
    } catch (e) {
      console.warn('Resolve error:', e);
    }
  };

  const handleWardFilterChange = (wardId) => {
    setSelectedWardFilter(wardId);
    if (wardId === 'ALL') {
      setMapCenter([22.7196, 75.8577]);
    } else {
      const foundWard = wards.find(w => w.id === wardId);
      if (foundWard && foundWard.lat && foundWard.lng) {
        setMapCenter([foundWard.lat, foundWard.lng]);
      }
    }
  };

  // Filter complaints based on selection for heat & pin calculation
  const filteredHeatPoints = complaints.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesWard = selectedWardFilter === 'ALL' || c.ward_id === selectedWardFilter;
    return matchesCat && matchesWard;
  });

  // Top Ward Hotspots Ranking
  const wardHotspots = [
    { rank: 1, wardId: 'ward_52', name: 'Ward 52 — Musakhedi & Mayur Nagar', lat: 22.7120, lng: 75.9080, count: 847, urgency: 'EXTREME_CRITICAL', color: '#dc2626', ppi: 94.2, category: 'Sanitation & Sewer Overflow' },
    { rank: 2, wardId: 'ward_14', name: 'Ward 14 — Rajendra Nagar Corridor', lat: 22.6800, lng: 75.8250, count: 620, urgency: 'EXTREME_CRITICAL', color: '#dc2626', ppi: 91.5, category: 'Stormwater Drainage Deficit' },
    { rank: 3, wardId: 'ward_15', name: 'Ward 15 — Silicon City & Bijasan', lat: 22.7310, lng: 75.8250, count: 450, urgency: 'HIGH_RISK', color: '#ea580c', ppi: 86.4, category: 'Water Pipeline Leakage' },
    { rank: 4, wardId: 'ward_8', name: 'Ward 8 — Banganga Industrial Area', lat: 22.7190, lng: 75.8570, count: 380, urgency: 'HIGH_RISK', color: '#ea580c', ppi: 83.5, category: 'Arterial Pothole Damage' },
    { rank: 5, wardId: 'ward_7', name: 'Ward 7 — Chandan Nagar Sector', lat: 22.7200, lng: 75.8410, count: 290, urgency: 'MODERATE', color: '#eab308', ppi: 75.0, category: 'Streetlight Wire Snaps' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* TOP SECTION 1: HEADER & MULTI-FILTER CONTROL TOOLBAR */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/80">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">IMC MUNICIPAL GIS PLATFORM</span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                  LIVE SPATIAL TELEMETRY
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 mt-0.5">
                City GIS Spatial Map, Citizen Pinpoints & Demand Heatmap
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Map Telemetry</span>
            </button>
          </div>
        </div>

        {/* LAYER TOGGLES & FILTERS */}
        <div className="bg-orange-50/50 border border-orange-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" /> Map Pinpoint & Telemetry Controls
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200 cursor-pointer shadow-sm">
                <input
                  type="checkbox"
                  checked={showCitizenPins}
                  onChange={(e) => setShowCitizenPins(e.target.checked)}
                  className="rounded text-orange-600"
                />
                <span>📍 Citizen Pinpoints ({filteredHeatPoints.length})</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200 cursor-pointer shadow-sm">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded text-orange-600"
                />
                <span>🔥 Continuous Thermal Heatmap</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200 cursor-pointer shadow-sm">
                <input
                  type="checkbox"
                  checked={showHotspotHubs}
                  onChange={(e) => setShowHotspotHubs(e.target.checked)}
                  className="rounded text-orange-600"
                />
                <span>🏢 Ward Summary Hubs</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
            
            {/* Month Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 font-bold uppercase">📅 Telemetry Window</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="august_2026">August 2026 (Live Current)</option>
                <option value="july_2026">July 2026 (Historical)</option>
                <option value="all_time">All-Time Cumulative</option>
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 font-bold uppercase">🏷️ Grievance Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Categories ({complaints.length})</option>
                <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                <option value="Public Works">Public Works & Roads</option>
                <option value="Electricity">Electricity & Streetlights</option>
                <option value="Water Supply">Water Supply</option>
              </select>
            </div>

            {/* Ward Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 font-bold uppercase">📍 Ward Filter (Fly to Ward)</label>
              <select
                value={selectedWardFilter}
                onChange={(e) => handleWardFilterChange(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All 85 Municipal Wards</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* TOP SECTION 2: FULL-WIDTH GIS SPATIAL CANVAS */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-extrabold text-stone-900">Indore Municipal Corporation Live GIS Map Canvas</h3>
          </div>
          
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              🟢 {filteredHeatPoints.length} Citizen Grievance Pinpoints Plotted
            </span>
          </div>
        </div>

        {/* Full Width Map Container */}
        <div className="w-full h-[380px] sm:h-[500px] lg:h-[620px] rounded-2xl overflow-hidden border border-stone-200 relative shadow-inner">
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapResizer />
            <MapFlyTo center={mapCenter} />
            
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
            />

            {/* REAL SMOOTH CONTINUOUS LEAFLET HEATMAP LAYER */}
            {showHeatmap && (
              <LeafletHeatLayer
                points={filteredHeatPoints}
                layerType={selectedLayer}
              />
            )}

            {/* REAL CITIZEN COMPLAINTS LIVE PINPOINTS */}
            {showCitizenPins && filteredHeatPoints.map((c) => {
              const latNum = parseFloat(c.lat) || 22.7120;
              const lngNum = parseFloat(c.lng) || 75.9080;
              return (
                <Marker
                  key={c.id}
                  position={[latNum, lngNum]}
                  icon={createComplaintPinIcon(c.urgency, c.current_status)}
                >
                  <Popup maxWidth={320} minWidth={260}>
                    <div className="p-2 space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                        <span className="font-mono font-extrabold text-orange-600 text-[11px]">{c.id}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          c.current_status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                          c.current_status === 'APPROVED_BY_ADMIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {c.current_status?.replace(/_/g, ' ') || 'PENDING REVIEW'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-stone-900 text-xs">
                          <User className="w-3 h-3 text-stone-500" />
                          <span>{c.citizen_name || 'Indore Citizen'}</span>
                          {c.user_email && <span className="text-[10px] text-stone-500 font-normal">({c.user_email})</span>}
                        </div>
                        <p className="text-stone-600 text-[11px] font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                          <span>{c.locality || `Ward ${c.ward_id}`}</span>
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          Pinpoint GPS: [{latNum.toFixed(5)}, {lngNum.toFixed(5)}]
                        </p>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-stone-800">{c.category}</span>
                          <span className={`font-bold px-1.5 py-0.5 text-[9px] rounded ${
                            c.urgency === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-700'
                          }`}>
                            {c.urgency || 'Standard'}
                          </span>
                        </div>
                        <p className="text-stone-600 italic text-[11px] line-clamp-2">
                          "{c.transcript || 'Grievance recorded with geotagging'}"
                        </p>
                      </div>

                      {c.photo_url && (
                        <div className="rounded-xl overflow-hidden border border-stone-200 h-24 w-full bg-stone-100 shadow-sm">
                          <img src={c.photo_url} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className="pt-1 flex gap-1.5 text-[10px]">
                        {c.current_status !== 'APPROVED_BY_ADMIN' && c.current_status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleApproveComplaint(c.id)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {c.current_status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleResolveComplaint(c.id)}
                            className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-bold py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all"
                          >
                            ✓ Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Hotspot Markers for Interactive Popup Info */}
            {showHotspotHubs && wardHotspots.map((wh) => (
              <Marker
                key={wh.wardId}
                position={[wh.lat, wh.lng]}
                icon={createSmallPinIcon(wh.color)}
              >
                <Popup>
                  <div className="p-2 space-y-2 max-w-xs text-xs font-sans">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                      <span className="font-bold text-orange-600">{wh.wardId.toUpperCase()}</span>
                      <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{wh.urgency}</span>
                    </div>
                    
                    <div>
                      <p className="font-extrabold text-stone-900">{wh.name}</p>
                      <p className="text-stone-600 font-semibold text-[11px] mt-0.5">Primary Issue: <span className="text-stone-900 font-bold">{wh.category}</span></p>
                    </div>

                    <div className="bg-orange-50 p-2 rounded-xl text-[10px] space-y-1 border border-orange-200">
                      <div className="flex justify-between font-bold">
                        <span>Grievance Density:</span>
                        <span className="text-rose-600">{wh.count} Complaints</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>PPI Priority Score:</span>
                        <span className="text-orange-600">{wh.ppi} / 100</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          </MapContainer>
        </div>
      </div>

      {/* TOP TO DOWN STACKED CONTROL & ANALYTICS CARDS (BELOW THE HEATMAP) */}
      <div className="space-y-6">
        
        {/* CARD 1: SELECT HEATMAP TELEMETRY LAYER */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-stone-900 pb-2 border-b border-stone-100">
            <Layers className="w-4.5 h-4.5 text-orange-600" />
            <h3 className="text-sm font-extrabold">Select Heatmap Telemetry Layer</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
            <button
              onClick={() => setSelectedLayer('grievance_density')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                selectedLayer === 'grievance_density' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 text-rose-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-600 shrink-0 animate-ping" />
                <div>
                  <p className="font-extrabold text-xs">Citizen Grievance Heatmap</p>
                  <p className="text-[10px] text-rose-700 font-semibold">Voice & Photo Spatial Density</p>
                </div>
              </div>
              <span className="text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-black shrink-0">ACTIVE</span>
            </button>

            <button
              onClick={() => setSelectedLayer('infra_deficit')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                selectedLayer === 'infra_deficit' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20 text-orange-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
                <div>
                  <p className="font-extrabold text-xs">Infrastructure Deficit Heatmap</p>
                  <p className="text-[10px] text-orange-700 font-semibold">Drainage & Pothole Deficits</p>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-bold shrink-0">LAYER 2</span>
            </button>

            <button
              onClick={() => setSelectedLayer('construction')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                selectedLayer === 'construction' ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/20 text-sky-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-500 shrink-0" />
                <div>
                  <p className="font-extrabold text-xs">Active Sanctioned Works Heatmap</p>
                  <p className="text-[10px] text-sky-700 font-semibold">Ongoing DPR & Tenders</p>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-bold shrink-0">LAYER 3</span>
            </button>
          </div>
        </div>

        {/* CARD 2: TOP 5 SEVERE MUNICIPAL HOTSPOTS RANKING */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600" />
              <h3 className="text-sm font-extrabold text-stone-900">
                Top 5 Severe Municipal Hotspots (Ranked by Grievance Density & PPI Priority)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {wardHotspots.map((wh) => (
              <div
                key={wh.wardId}
                onClick={() => setMapCenter([wh.lat, wh.lng])}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-orange-300 hover:shadow-md transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-extrabold text-xs flex items-center justify-center">
                    #{wh.rank}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    PPI: {wh.ppi}
                  </span>
                </div>

                <div>
                  <p className="font-extrabold text-xs text-stone-900 group-hover:text-orange-600 transition-colors">
                    {wh.name}
                  </p>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{wh.category}</p>
                </div>

                <div className="pt-1 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-rose-600">{wh.count} Reports</span>
                  <span className="text-stone-400 group-hover:text-stone-700">Fly to Pin →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
