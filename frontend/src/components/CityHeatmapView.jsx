import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Flame, Layers, Calendar, Filter, MapPin, AlertTriangle, ShieldCheck,
  TrendingUp, Activity, Sparkles, Building2, Info, Compass, CheckCircle2, RefreshCw, SlidersHorizontal
} from 'lucide-react';

const createSmallPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-small-pin',
    html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 0 6px ${color}; cursor: pointer;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
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
    if (center) {
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
    // Load leaflet.heat plugin script dynamically if not present
    if (!window.L || !window.L.heatLayer) {
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

      // Remove existing heat layer if present
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }

      if (points.length === 0) return;

      // Format heat points [lat, lng, intensity]
      const heatData = points.map(p => {
        let intensity = 0.7;
        if (layerType === 'infra_deficit') intensity = p.urgency === 'Critical' ? 0.9 : 0.5;
        else if (layerType === 'construction') intensity = 0.8;
        else intensity = p.urgency === 'Critical' ? 1.0 : 0.6;
        return [p.lat, p.lng, intensity];
      });

      // Configure smooth GIS gradient
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
  const [selectedLayer, setSelectedLayer] = useState('grievance_density'); // 'grievance_density' | 'infra_deficit' | 'construction'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [mapCenter, setMapCenter] = useState([22.7000, 75.8350]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, wardRes] = await Promise.all([
        fetch('https://nagarmitra-backend.onrender.com/api/complaints'),
        fetch('https://nagarmitra-backend.onrender.com/api/wards')
      ]);
      const compData = await compRes.json();
      const wardData = await wardRes.json();

      setComplaints(compData);
      setWards(wardData);
    } catch (e) {
      console.error("Error fetching heatmap data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter complaints based on selection for heat calculation
  const filteredHeatPoints = complaints.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesWard = selectedWardFilter === 'ALL' || c.ward_id === selectedWardFilter;
    return matchesCat && matchesWard;
  });

  // Top Ward Hotspots Ranking
  const wardHotspots = [
    { rank: 1, wardId: 'ward_52', name: 'Ward 52 â€” Musakhedi & Mayur Nagar', lat: 22.7120, lng: 75.9080, count: 847, urgency: 'EXTREME_CRITICAL', color: '#dc2626', ppi: 94.2, category: 'Sanitation & Sewer Overflow' },
    { rank: 2, wardId: 'ward_14', name: 'Ward 14 â€” Rajendra Nagar Corridor', lat: 22.6800, lng: 75.8250, count: 620, urgency: 'EXTREME_CRITICAL', color: '#dc2626', ppi: 91.5, category: 'Stormwater Drainage Deficit' },
    { rank: 3, wardId: 'ward_15', name: 'Ward 15 â€” Silicon City & Bijasan', lat: 22.7310, lng: 75.8250, count: 450, urgency: 'HIGH_RISK', color: '#ea580c', ppi: 86.4, category: 'Water Pipeline Leakage' },
    { rank: 4, wardId: 'ward_8', name: 'Ward 8 â€” Banganga Industrial Area', lat: 22.7190, lng: 75.8570, count: 380, urgency: 'HIGH_RISK', color: '#ea580c', ppi: 83.5, category: 'Arterial Pothole Damage' },
    { rank: 5, wardId: 'ward_7', name: 'Ward 7 â€” Chandan Nagar Sector', lat: 22.7200, lng: 75.8410, count: 290, urgency: 'MODERATE', color: '#eab308', ppi: 75.0, category: 'Streetlight Wire Snaps' },
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
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">SIH CORE SPATIAL ENGINE</span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                  REAL-TIME THERMAL DENSITY
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 mt-0.5">
                Indore City Spatial Heatmap & Density Telemetry Engine
              </h2>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Heat Map Data</span>
          </button>
        </div>

        {/* TOP FILTER BAR: MONTH, CATEGORY & WARD FILTERS */}
        <div className="bg-orange-50/50 border border-orange-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" /> Heatmap Filters & Time Window Selection
            </span>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
              {filteredHeatPoints.length} Geotag Points Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
            
            {/* Month Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 font-bold uppercase">ðŸ“… Monthly Telemetry Window</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="august_2026">August 2026 (Monsoon Peak)</option>
                <option value="july_2026">July 2026 (Early Monsoon)</option>
                <option value="june_2026">June 2026 (Pre-Monsoon)</option>
                <option value="all_time">All-Time Cumulative (1,200+ Requests)</option>
              </select>
            </div>

            {/* Category Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 font-bold uppercase">ðŸ·ï¸ Grievance Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Categories</option>
                <option value="Sanitation & Drainage">Sanitation & Sewer</option>
                <option value="Public Works">Roads & Infrastructure</option>
                <option value="Electricity">Electricity & Lights</option>
                <option value="Water Supply">Water Supply</option>
              </select>
            </div>

            {/* Ward Filter Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 font-bold uppercase">ðŸ“ Ward Sector Filter</label>
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Wards (1â€“85)</option>
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

      {/* TOP SECTION 2: FULL-WIDTH GIS SPATIAL HEATMAP CANVAS (LEFT TO RIGHT FULL WIDTH SCREEN) */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-extrabold text-stone-900">Indore Municipal GIS Spatial Heatmap Canvas (Full Width)</h3>
          </div>
          
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              ðŸŸ¢ Continuous Thermal Heat Render Active
            </span>
          </div>
        </div>

        {/* Full Width Map Container */}
        <div className="w-full h-[580px] rounded-2xl overflow-hidden border border-stone-200 relative shadow-inner">
          <MapContainer
            center={mapCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapResizer />
            <MapFlyTo center={mapCenter} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* REAL SMOOTH CONTINUOUS LEAFLET HEATMAP LAYER */}
            <LeafletHeatLayer
              points={filteredHeatPoints}
              layerType={selectedLayer}
            />

            {/* Hotspot Markers for Interactive Popup Info */}
            {wardHotspots.map((wh) => (
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
                        <span className="text-rose-600">{wh.count} Voice Requests</span>
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
                  <p className="text-[10px] text-rose-700 font-semibold">Voice Request Spatial Density</p>
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
                selectedLayer === 'construction' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <p className="font-extrabold text-xs">Work In Progress & Tenders</p>
                  <p className="text-[10px] text-amber-700 font-semibold">Municipal Construction Zones</p>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 font-bold shrink-0">LAYER 3</span>
            </button>
          </div>
        </div>

        {/* CARD 2: HEAT THERMAL GRADIENT LENGTH & SCALE */}
        <div className="bg-orange-50/60 border border-orange-200/80 rounded-3xl p-5 shadow-sm space-y-3 text-stone-900">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orange-600" /> Thermal Gradient Scale & Density Length
            </span>
            <span className="text-[11px] text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
              GIS Density Calibrated
            </span>
          </div>

          {/* Smooth Continuous Gradient Bar */}
          <div className="w-full h-4 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />
          
          <div className="grid grid-cols-4 text-center text-[11px] font-extrabold text-stone-700 pt-1">
            <div className="text-left"><span className="text-blue-600">ðŸ”µ Low Density</span> (1â€“10 Complaints)</div>
            <div><span className="text-emerald-600">ðŸŸ¢ Moderate Zone</span> (10â€“50 Complaints)</div>
            <div><span className="text-amber-600">ðŸŸ¡ High Density</span> (50â€“200 Complaints)</div>
            <div className="text-right"><span className="text-rose-600">ðŸ”´ Extreme Hotspot</span> (500+ Requests)</div>
          </div>
        </div>

        {/* CARD 3: TOP WARD CRISIS & WATER/SANITATION HOTSPOTS GRID */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Top Priority Ward Hotspots & Sector Density Ledger
            </h3>
            <span className="bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full border border-rose-200">
              {wardHotspots.length} Priority Sectors Listed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {wardHotspots.map((wh) => (
              <div
                key={wh.wardId}
                onClick={() => setMapCenter([wh.lat, wh.lng])}
                className="p-5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-orange-50/60 hover:border-orange-300 transition-all cursor-pointer space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">RANK #{wh.rank}</span>
                    <h4 className="text-sm font-extrabold text-stone-900 leading-snug">{wh.name}</h4>
                  </div>
                  <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shrink-0 shadow-xs">
                    {wh.count} Requests
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                  <p className="text-stone-600 text-[11px]">Primary Issue: <span className="font-bold text-stone-900">{wh.category}</span></p>
                  <p className="text-orange-700 font-extrabold text-[11px]">PPI Priority Index: {wh.ppi} / 100</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
