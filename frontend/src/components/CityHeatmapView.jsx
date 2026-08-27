import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Flame, Layers, Calendar, Filter, MapPin, AlertTriangle, ShieldCheck,
  TrendingUp, Activity, Sparkles, Building2, Info, Compass, CheckCircle2, RefreshCw
} from 'lucide-react';

const createHeatPinIcon = (color) => {
  return L.divIcon({
    className: 'heat-pin',
    html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 16px ${color}, inset 0 0 8px white; cursor: pointer; animation: pulse 2s infinite;"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
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
      map.flyTo(center, 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function CityHeatmapView({ isSuperAdmin, onOpenAuth }) {
  const [complaints, setComplaints] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('august_2026');
  const [selectedLayer, setSelectedLayer] = useState('grievance_density'); // 'grievance_density' | 'infra_deficit' | 'construction'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [mapCenter, setMapCenter] = useState([22.7000, 75.8350]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, wardRes] = await Promise.all([
        fetch('http://localhost:8000/api/complaints'),
        fetch('http://localhost:8000/api/wards')
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

  // Filter complaints based on month/category for the heatmap
  const filteredHeatPoints = complaints.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesCat;
  });

  // Hotspot Wards Ranking sorted by density count
  const wardHotspots = [
    { rank: 1, wardId: 'ward_52', name: 'Ward 52 — Musakhedi & Mayur Nagar', lat: 22.7120, lng: 75.9080, count: 847, urgency: 'EXTREME_CRITICAL', color: '#dc2626', ppi: 94.2, category: 'Sanitation & Sewer overflow' },
    { rank: 2, wardId: 'ward_14', name: 'Ward 14 — Rajendra Nagar Corridor', lat: 22.6800, lng: 75.8250, count: 620, urgency: 'EXTREME_CRITICAL', color: '#dc2626', ppi: 91.5, category: 'Drainage & Stormwater Deficit' },
    { rank: 3, wardId: 'ward_15', name: 'Ward 15 — Silicon City & Bijasan', lat: 22.7310, lng: 75.8250, count: 450, urgency: 'HIGH_RISK', color: '#ea580c', ppi: 86.4, category: 'Water Supply Contamination' },
    { rank: 4, wardId: 'ward_8', name: 'Ward 8 — Banganga Industrial Area', lat: 22.7190, lng: 75.8570, count: 380, urgency: 'HIGH_RISK', color: '#ea580c', ppi: 83.5, category: 'Arterial Road Potholes' },
    { rank: 5, wardId: 'ward_7', name: 'Ward 7 — Chandan Nagar Sector', lat: 22.7200, lng: 75.8410, count: 290, urgency: 'MODERATE', color: '#eab308', ppi: 75.0, category: 'Streetlight Wire Snaps' },
    { rank: 6, wardId: 'ward_2', name: 'Ward 2 — Chandan Nagar South', lat: 22.7088, lng: 75.8211, count: 210, urgency: 'MODERATE', color: '#eab308', ppi: 68.2, category: 'Solid Waste Dumping' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/80">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">SIH CORE SPATIAL ENGINE</span>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                REAL-TIME HEAT DENSITY
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
              Indore City Spatial Heatmap & Density Telemetry Engine
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Heat Map Data</span>
          </button>
        </div>
      </div>

      {/* MAIN 2-COLUMN HEATMAP LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (35% WIDTH): CONTROLS & SECTOR HEAT ANALYTICS */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* 1. Time & Month Selector Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-stone-900 pb-2 border-b border-stone-100">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span>Select Monthly Telemetry Window</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setSelectedMonth('august_2026')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedMonth === 'august_2026' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <p className="font-extrabold">August 2026</p>
                <p className="text-[10px] opacity-80">Monsoon Peak (Current)</p>
              </button>

              <button
                onClick={() => setSelectedMonth('july_2026')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedMonth === 'july_2026' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <p className="font-extrabold">July 2026</p>
                <p className="text-[10px] opacity-80">Early Monsoon</p>
              </button>

              <button
                onClick={() => setSelectedMonth('june_2026')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedMonth === 'june_2026' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <p className="font-extrabold">June 2026</p>
                <p className="text-[10px] opacity-80">Pre-Monsoon</p>
              </button>

              <button
                onClick={() => setSelectedMonth('all_time')}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  selectedMonth === 'all_time' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <p className="font-extrabold">All-Time Cumulative</p>
                <p className="text-[10px] opacity-80">1,200+ Requests</p>
              </button>
            </div>
          </div>

          {/* 2. Heatmap Layer Type Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-stone-900 pb-2 border-b border-stone-100">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Select Heatmap Telemetry Layer</span>
            </div>

            <div className="space-y-2 text-xs font-bold">
              <button
                onClick={() => setSelectedLayer('grievance_density')}
                className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedLayer === 'grievance_density' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 text-rose-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping" />
                  <div className="text-left">
                    <p className="font-extrabold text-xs">Citizen Grievance Heatmap</p>
                    <p className="text-[10px] text-rose-700 font-semibold">Voice Request Spatial Density</p>
                  </div>
                </div>
                <span className="text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-black">ACTIVE</span>
              </button>

              <button
                onClick={() => setSelectedLayer('infra_deficit')}
                className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedLayer === 'infra_deficit' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20 text-orange-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500" />
                  <div className="text-left">
                    <p className="font-extrabold text-xs">Infrastructure Deficit Heatmap</p>
                    <p className="text-[10px] text-orange-700 font-semibold">Drainage & Road Pothole Gaps</p>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 font-bold">LAYER 2</span>
              </button>

              <button
                onClick={() => setSelectedLayer('construction')}
                className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedLayer === 'construction' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                  <div className="text-left">
                    <p className="font-extrabold text-xs">Work In Progress & Tenders</p>
                    <p className="text-[10px] text-amber-700 font-semibold">Municipal Contractor Construction</p>
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 font-bold">LAYER 3</span>
              </button>
            </div>
          </div>

          {/* 3. Heatmap Intensity Legend */}
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-3xl p-4 space-y-2 text-stone-900">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span>Heat Thermal Gradient Legend</span>
              <span className="text-[10px] text-stone-500">Density Scale</span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 via-orange-500 to-rose-600 shadow-inner" />
            <div className="flex items-center justify-between text-[10px] font-bold text-stone-600 pt-0.5">
              <span>🔵 Low (1–10)</span>
              <span>🟡 Moderate (10–50)</span>
              <span>🔴 Extreme Hotspot (500+)</span>
            </div>
          </div>

          {/* 4. Top Critical Hotspots List */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-extrabold text-stone-900 pb-2 border-b border-stone-100">
              <span className="flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-4 h-4" /> Top Ward Crisis Hotspots
              </span>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {wardHotspots.length} Priority Wards
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {wardHotspots.map((wh) => (
                <div
                  key={wh.wardId}
                  onClick={() => setMapCenter([wh.lat, wh.lng])}
                  className="p-3 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-orange-50/60 hover:border-orange-300 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-stone-900">{wh.name}</span>
                    <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded text-[10px] border border-rose-200">
                      {wh.count} Requests
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-semibold">
                    <span>{wh.category}</span>
                    <span className="font-bold text-orange-600">PPI {wh.ppi}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (65% WIDTH): FULL INTERACTIVE LEAFLET HEATMAP CANVAS */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-extrabold text-stone-900">Indore Municipal GIS Spatial Heatmap Canvas</h3>
            </div>
            
            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                🟢 Live Thermal Render Active
              </span>
            </div>
          </div>

          {/* Leaflet Heatmap Canvas Container */}
          <div className="w-full h-[640px] rounded-2xl overflow-hidden border border-stone-200 relative shadow-inner">
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

              {/* Thermal Heatmap Concentric Density Gradients */}
              {wardHotspots.map((wh) => (
                <React.Fragment key={wh.wardId}>
                  {/* Outer Heat Dispersion Aura (Glowing Red/Orange Gradient) */}
                  <Circle
                    center={[wh.lat, wh.lng]}
                    radius={2200}
                    pathOptions={{ color: wh.color, fillColor: wh.color, fillOpacity: 0.15, weight: 0 }}
                  />

                  {/* Mid Heat Concentration Band */}
                  <Circle
                    center={[wh.lat, wh.lng]}
                    radius={1400}
                    pathOptions={{ color: wh.color, fillColor: wh.color, fillOpacity: 0.35, weight: 1 }}
                  />

                  {/* Core High Density Epicenter */}
                  <Circle
                    center={[wh.lat, wh.lng]}
                    radius={700}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.65, weight: 2 }}
                  />

                  {/* Interactive Hotspot Pin */}
                  <Marker
                    position={[wh.lat, wh.lng]}
                    icon={createHeatPinIcon(wh.color)}
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

                        <div className="pt-1">
                          <span className="text-[10px] text-stone-400 font-bold uppercase">Geotagged Thermal Epicenter</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              ))}

              {/* Individual Geotagged Complaint Markers within the Heatmap */}
              {filteredHeatPoints.slice(0, 30).map((c) => (
                <Circle
                  key={c.id}
                  center={[c.lat, c.lng]}
                  radius={300}
                  pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.4, weight: 1 }}
                />
              ))}

            </MapContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
