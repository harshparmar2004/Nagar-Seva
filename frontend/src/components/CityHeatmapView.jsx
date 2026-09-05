import { API_BASE_URL } from '../config';
import { FALLBACK_WARDS, FALLBACK_COMPLAINTS } from '../data/fallbackData';
import { getAllFirestoreComplaints, subscribeToAllFirestoreComplaints } from '../lib/firebase';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

import {
  Building2, MapPin, Compass, Search, Filter, Layers, TrendingUp, CheckCircle2,
  Clock, AlertTriangle, ExternalLink, RefreshCw, ChevronRight, User, Shield,
  ArrowRight, Eye, Sparkles, MessageSquare, BarChart3, AlertOctagon, Info,
  CheckCircle, Navigation, Crosshair, Phone, Calendar, Image as ImageIcon,
  Check, X, Activity, Droplets, Zap, ShieldCheck
} from 'lucide-react';

// Smooth Map Resizer
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

// MapFlyTo: Animates the camera smoothly to any ward centroid
function MapFlyTo({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet DivIcon for Ward Markers displaying Ward Number, Short Locality, and exact Complaint Count
const createWardMarkerIcon = (ward, count, isSelected = false) => {
  let badgeColor = '#059669'; // Emerald (<10)
  let badgeBg = '#ecfdf5';
  let badgeBorder = '#a7f3d0';
  let textColor = '#065f46';

  if (count >= 50) {
    badgeColor = '#e11d48'; // Rose (>50)
    badgeBg = '#fff1f2';
    badgeBorder = '#fecdd3';
    textColor = '#9f1239';
  } else if (count >= 10) {
    badgeColor = '#d97706'; // Amber (10-50)
    badgeBg = '#fffbeb';
    badgeBorder = '#fde68a';
    textColor = '#92400e';
  }

  const wardNum = ward.id ? ward.id.replace(/\D/g, '') : '';
  const wardNameParts = (ward.name || '').split('—');
  const shortLocality = wardNameParts.length > 1
    ? wardNameParts[1].split('&')[0].split(',')[0].trim()
    : `Ward ${wardNum}`;

  return L.divIcon({
    className: 'custom-ward-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'};
        z-index: ${isSelected ? 1000 : 100};
      ">
        <div style="
          background: #ffffff;
          border: ${isSelected ? `2.5px solid ${badgeColor}` : `1.5px solid #e7e5e4`};
          box-shadow: ${isSelected ? `0 6px 20px rgba(0,0,0,0.22), 0 0 14px ${badgeColor}60` : '0 2px 8px rgba(0,0,0,0.12)'};
          border-radius: 9999px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        ">
          <span style="
            background: #1c1917;
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            padding: 1.5px 6px;
            border-radius: 9999px;
            font-family: ui-monospace, monospace;
          ">W-${wardNum}</span>
          <span style="
            font-size: 11px;
            font-weight: 700;
            color: #1c1917;
            max-width: 105px;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: ui-sans-serif, system-ui, sans-serif;
          ">${shortLocality}</span>
          <span style="
            background: ${badgeBg};
            color: ${textColor};
            border: 1px solid ${badgeBorder};
            font-size: 10px;
            font-weight: 800;
            padding: 1.5px 7px;
            border-radius: 9999px;
            font-family: ui-monospace, monospace;
          ">${count}</span>
        </div>
      </div>
    `,
    iconSize: [165, 32],
    iconAnchor: [82, 16]
  });
};

// Initial complaints loading helper
const getInitialComplaints = () => {
  let localSaved = [];
  try {
    localSaved = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
  } catch (err) {}
  const allSources = [...localSaved, ...FALLBACK_COMPLAINTS];
  const mergedMap = new Map();
  allSources.forEach(c => {
    if (c && c.id) {
      mergedMap.set(c.id, c);
    }
  });
  return Array.from(mergedMap.values());
};

export default function CityHeatmapView({ isSuperAdmin, onOpenAuth, onNavigateToGis }) {
  const [complaints, setComplaints] = useState(getInitialComplaints);
  const [wards, setWards] = useState(FALLBACK_WARDS);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVolumeTier, setSelectedVolumeTier] = useState('ALL'); // 'ALL' | 'HIGH' | 'MODERATE' | 'ROUTINE'
  const [searchQuery, setSearchQuery] = useState('');
  const [pinDisplayMode, setPinDisplayMode] = useState('ACTIVE_ONLY'); // 'ACTIVE_ONLY' | 'ALL_WARDS'

  // Map & Inspector States
  const [mapCenter, setMapCenter] = useState([22.7196, 75.8577]); // Centered on Indore
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedWardId, setSelectedWardId] = useState('ward_52'); // Default to high-priority Ward 52
  const [complaintTabFilter, setComplaintTabFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'CRITICAL' | 'RESOLVED'
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const inspectorRef = useRef(null);

  useEffect(() => {
    fetchData();

    // Instant in-memory complaint update (0ms latency upon citizen submission)
    const handleLocalNewComplaint = (e) => {
      const newC = e.detail;
      if (newC && newC.id) {
        setComplaints((prev) => {
          const map = new Map(prev.map(c => [c.id, c]));
          map.set(newC.id, { ...(map.get(newC.id) || {}), ...newC });
          return Array.from(map.values());
        });
      }
    };
    window.addEventListener('nagarmitra_new_complaint', handleLocalNewComplaint);

    // Real-time Firestore sync
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
      window.removeEventListener('nagarmitra_new_complaint', handleLocalNewComplaint);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, wardRes, firestoreComps] = await Promise.allSettled([
        fetch(API_BASE_URL + '/api/complaints?limit=1000').then(r => r.ok ? r.json() : []),
        fetch(API_BASE_URL + '/api/wards').then(r => r.ok ? r.json() : []),
        getAllFirestoreComplaints()
      ]);

      const backendComps = compRes.status === 'fulfilled' && Array.isArray(compRes.value) ? compRes.value : [];
      const fsComps = firestoreComps.status === 'fulfilled' && Array.isArray(firestoreComps.value) ? firestoreComps.value : [];

      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      } catch (err) {}

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

      setComplaints(Array.from(mergedMap.values()));
      const wardData = wardRes.status === 'fulfilled' && Array.isArray(wardRes.value) && wardRes.value.length > 0
        ? wardRes.value : FALLBACK_WARDS;
      setWards(wardData);
    } catch (e) {
      console.warn("Using fallback ward data:", e);
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

  // Comprehensive Ward Spatial Analysis & Grievance Aggregation
  const wardSpatialAnalysis = useMemo(() => {
    if (!wards || wards.length === 0) return [];

    // Map complaints by ward
    const compByWard = new Map();
    complaints.forEach(c => {
      const wId = c.ward_id || 'ward_1';
      if (!compByWard.has(wId)) compByWard.set(wId, []);
      compByWard.get(wId).push(c);
    });

    return wards.map(w => {
      const allWardComps = compByWard.get(w.id) || [];
      const totalCount = allWardComps.length;

      // Status counts
      const pendingCount = allWardComps.filter(c => c.current_status === 'PENDING_ADMIN_REVIEW').length;
      const inProgressCount = allWardComps.filter(c => c.current_status === 'APPROVED_BY_ADMIN' || c.current_status === 'IN_PROGRESS').length;
      const resolvedCount = allWardComps.filter(c => c.current_status === 'RESOLVED').length;
      const criticalCount = allWardComps.filter(c => c.urgency === 'Critical' || c.urgency === 'EXTREME_CRITICAL').length;

      // Category breakdown
      const categoryCounts = {
        sanitation: allWardComps.filter(c => (c.category || '').toLowerCase().includes('sanitation') || (c.category || '').toLowerCase().includes('drainage') || (c.category || '').toLowerCase().includes('sewer')).length,
        roads: allWardComps.filter(c => (c.category || '').toLowerCase().includes('road') || (c.category || '').toLowerCase().includes('pothole') || (c.category || '').toLowerCase().includes('infrastructure')).length,
        electricity: allWardComps.filter(c => (c.category || '').toLowerCase().includes('electric') || (c.category || '').toLowerCase().includes('light')).length,
        water: allWardComps.filter(c => (c.category || '').toLowerCase().includes('water')).length,
        healthcare: allWardComps.filter(c => (c.category || '').toLowerCase().includes('health')).length,
      };

      // Primary category
      let primaryCat = 'Sanitation & Drainage';
      let maxCatCount = categoryCounts.sanitation;
      if (categoryCounts.roads > maxCatCount) { primaryCat = 'Roads & Infrastructure'; maxCatCount = categoryCounts.roads; }
      if (categoryCounts.electricity > maxCatCount) { primaryCat = 'Electricity & Streetlights'; maxCatCount = categoryCounts.electricity; }
      if (categoryCounts.water > maxCatCount) { primaryCat = 'Water Supply'; maxCatCount = categoryCounts.water; }

      const primaryCatPct = totalCount > 0 ? Math.round((maxCatCount / totalCount) * 100) : 0;

      // Volume tier
      let tier = 'ROUTINE';
      let tierLabel = 'Routine Upkeep (<10)';
      let tierBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';

      if (totalCount >= 50) {
        tier = 'HIGH';
        tierLabel = 'High Demand (>50)';
        tierBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
      } else if (totalCount >= 10) {
        tier = 'MODERATE';
        tierLabel = 'Moderate Demand (10-50)';
        tierBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      }

      // Clean short locality name
      const nameParts = (w.name || '').split('—');
      const shortName = nameParts.length > 1
        ? nameParts[1].split('&')[0].split(',')[0].trim()
        : `Ward ${w.id.replace(/\D/g, '')}`;

      const wardNumber = parseInt(w.id.replace(/\D/g, '') || '0', 10);

      // Representative citizen complaints (all fields preserved)
      const citizenComplaints = [...allWardComps].sort((a, b) => {
        if (a.urgency === 'Critical' && b.urgency !== 'Critical') return -1;
        if (b.urgency === 'Critical' && a.urgency !== 'Critical') return 1;
        return (new Date(b.created_at || 0)).getTime() - (new Date(a.created_at || 0)).getTime();
      });

      // Municipal Officer assignment
      const nodalOfficer = allWardComps[0]?.nodal_officer || `Er. Rajesh Sharma (IMC Executive Engineer)`;

      return {
        id: w.id,
        wardNumber,
        name: w.name,
        shortName,
        zone: w.zone || `Zone ${Math.ceil(wardNumber / 4) || 1}`,
        lat: parseFloat(w.lat) || 22.7196,
        lng: parseFloat(w.lng) || 75.8577,
        population: w.population || (25000 + wardNumber * 350),
        infraScore: w.infra_score || 55,
        totalCount,
        pendingCount,
        inProgressCount,
        resolvedCount,
        criticalCount,
        categoryCounts,
        primaryCat,
        primaryCatPct,
        tier,
        tierLabel,
        tierBadgeClass,
        citizenComplaints,
        nodalOfficer
      };
    });
  }, [wards, complaints]);

  // Selected ward object
  const selectedWard = useMemo(() => {
    return wardSpatialAnalysis.find(w => w.id === selectedWardId) || wardSpatialAnalysis[0];
  }, [wardSpatialAnalysis, selectedWardId]);

  // Filtered wards for Map Pins
  const displayedPins = useMemo(() => {
    return wardSpatialAnalysis.filter(ward => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (ward.name || '').toLowerCase().includes(query);
        const matchesShort = ward.shortName.toLowerCase().includes(query);
        const matchesNum = `ward ${ward.wardNumber}`.includes(query) || `${ward.wardNumber}` === query;
        if (!matchesName && !matchesShort && !matchesNum) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'Sanitation & Drainage' && ward.categoryCounts.sanitation === 0) return false;
        if (selectedCategory === 'Roads & Infrastructure' && ward.categoryCounts.roads === 0) return false;
        if (selectedCategory === 'Electricity & Streetlights' && ward.categoryCounts.electricity === 0) return false;
        if (selectedCategory === 'Water Supply' && ward.categoryCounts.water === 0) return false;
      }

      // Volume tier filter
      if (selectedVolumeTier !== 'ALL' && ward.tier !== selectedVolumeTier) return false;

      // Pin Display Mode (Active Only vs All Wards)
      if (pinDisplayMode === 'ACTIVE_ONLY') {
        if (ward.id === selectedWardId) return true;
        return ward.totalCount > 0;
      }

      return true;
    });
  }, [wardSpatialAnalysis, searchQuery, selectedCategory, selectedVolumeTier, pinDisplayMode, selectedWardId]);

  // Top Priority Wards (Ranked by complaint volume)
  const topPriorityWards = useMemo(() => {
    return [...wardSpatialAnalysis]
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 6);
  }, [wardSpatialAnalysis]);

  // Overall City Grievance Statistics
  const cityStats = useMemo(() => {
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.current_status === 'RESOLVED').length;
    const pendingComplaints = complaints.filter(c => c.current_status === 'PENDING_ADMIN_REVIEW').length;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
    const topWard = topPriorityWards[0];
    return {
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      resolutionRate,
      topWardName: topWard ? topWard.shortName : 'Ward 52',
      topWardCount: topWard ? topWard.totalCount : 157
    };
  }, [complaints, topPriorityWards]);

  // Function to navigate smoothly to any ward
  const handleSelectWard = (ward) => {
    if (!ward) return;
    setSelectedWardId(ward.id);
    setSelectedWardFilter(ward.id);
    setMapCenter([ward.lat, ward.lng]);
    setMapZoom(15);
    setComplaintTabFilter('ALL');
  };

  // Filtered complaints within the selected ward inspector
  const inspectorComplaints = useMemo(() => {
    if (!selectedWard) return [];
    return selectedWard.citizenComplaints.filter(c => {
      if (complaintTabFilter === 'PENDING') return c.current_status === 'PENDING_ADMIN_REVIEW';
      if (complaintTabFilter === 'CRITICAL') return c.urgency === 'Critical' || c.urgency === 'EXTREME_CRITICAL';
      if (complaintTabFilter === 'RESOLVED') return c.current_status === 'RESOLVED';
      return true;
    });
  }, [selectedWard, complaintTabFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* SECTION 1: HEADER & KEY TELEMETRY */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-stone-900 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-orange-600">MUNICIPAL WARD INTELLIGENCE</span>
                <span className="bg-stone-100 text-stone-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-stone-200">
                  85 WARDS COVERED
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 mt-0.5 tracking-tight">
                Indore Ward Spatial Grievance Explorer
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToGis && (
              <button
                onClick={onNavigateToGis}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Open City GPS Pinpoints Map</span>
              </button>
            )}
            <button
              onClick={fetchData}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* CITY-WIDE STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Total Grievances Filed</span>
            <p className="text-2xl font-black text-stone-900 mt-0.5">{cityStats.totalComplaints}</p>
            <span className="text-[10px] text-stone-600 font-medium">Across all 85 Indore Wards</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">Highest Demand Ward</span>
            <p className="text-2xl font-black text-rose-900 mt-0.5">{cityStats.topWardCount}</p>
            <span className="text-[10px] text-rose-700 font-semibold">{cityStats.topWardName} (Top Priority)</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Under Active Review</span>
            <p className="text-2xl font-black text-amber-900 mt-0.5">{cityStats.pendingComplaints}</p>
            <span className="text-[10px] text-amber-700 font-medium">Awaiting Nodal Action</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Resolution Rate</span>
            <p className="text-2xl font-black text-emerald-900 mt-0.5">{cityStats.resolutionRate}%</p>
            <span className="text-[10px] text-emerald-700 font-medium">{cityStats.resolvedComplaints} Solved / Sanctioned</span>
          </div>
        </div>

        {/* QUICK ACCESS WARD PILLS: Specifically highlighting Ward 14, Ward 52, Ward 1 */}
        <div className="bg-gradient-to-r from-orange-50/70 via-stone-50 to-amber-50/40 border border-orange-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Quick Ward Fly-To & Grievance Inspector
            </span>
            <span className="text-[11px] text-stone-500 font-medium">Click any ward pill to fly the map & view all complaints</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* WARD 52 */}
            {(() => {
              const w52 = wardSpatialAnalysis.find(w => w.id === 'ward_52');
              const isSelected = selectedWard?.id === 'ward_52';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectWard(w52)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600/40 scale-105'
                      : 'bg-white text-stone-800 border border-stone-200 hover:border-rose-400 hover:shadow-xs'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Ward 52 (Musakhedi & Mayur Nagar)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {w52 ? w52.totalCount : 157} Complaints
                  </span>
                </button>
              );
            })()}

            {/* WARD 14 */}
            {(() => {
              const w14 = wardSpatialAnalysis.find(w => w.id === 'ward_14');
              const isSelected = selectedWard?.id === 'ward_14';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectWard(w14)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600/40 scale-105'
                      : 'bg-white text-stone-800 border border-stone-200 hover:border-rose-400 hover:shadow-xs'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>Ward 14 (Rajendra Nagar & Cat Road)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {w14 ? w14.totalCount : 156} Complaints
                  </span>
                </button>
              );
            })()}

            {/* WARD 1 */}
            {(() => {
              const w1 = wardSpatialAnalysis.find(w => w.id === 'ward_1');
              const isSelected = selectedWard?.id === 'ward_1';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectWard(w1)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-stone-900 text-white shadow-md ring-2 ring-stone-900/40 scale-105'
                      : 'bg-white text-stone-800 border border-stone-200 hover:border-stone-400 hover:shadow-xs'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Ward 1 (Rajwada & Central Market)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {w1 ? w1.totalCount : 6} Complaints
                  </span>
                </button>
              );
            })()}

            {/* WARD 15 */}
            {(() => {
              const w15 = wardSpatialAnalysis.find(w => w.id === 'ward_15');
              const isSelected = selectedWard?.id === 'ward_15';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectWard(w15)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Ward 15 (Silicon City)</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-white/20' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {w15 ? w15.totalCount : 35}
                  </span>
                </button>
              );
            })()}

            {/* WARD 8 */}
            {(() => {
              const w8 = wardSpatialAnalysis.find(w => w.id === 'ward_8');
              const isSelected = selectedWard?.id === 'ward_8';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectWard(w8)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Ward 8 (Banganga Belt)</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-white/20' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {w8 ? w8.totalCount : 25}
                  </span>
                </button>
              );
            })()}

            {/* WARD 2 */}
            {(() => {
              const w2 = wardSpatialAnalysis.find(w => w.id === 'ward_2');
              const isSelected = selectedWard?.id === 'ward_2';
              return (
                <button
                  type="button"
                  onClick={() => handleSelectWard(w2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Ward 2 (Vijay Nagar)</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-white/20' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {w2 ? w2.totalCount : 12}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* SEARCH & DETAILED FILTER CONTROLS */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-bold">
            {/* Search Box */}
            <div className="sm:col-span-4 relative">
              <label className="text-[10px] uppercase text-stone-500 block mb-1">🔍 Search Ward by Number or Name</label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. 14, 52, 1, Rajendra, Musakhedi, Rajwada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown Selector (All 85 Wards) */}
            <div className="sm:col-span-3">
              <label className="text-[10px] uppercase text-stone-500 block mb-1">📍 Select from 85 Indore Wards</label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  const found = wardSpatialAnalysis.find(w => w.id === e.target.value);
                  if (found) handleSelectWard(found);
                }}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {wardSpatialAnalysis.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — ({w.totalCount} Complaints)
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <label className="text-[10px] uppercase text-stone-500 block mb-1">🏷️ Grievance Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">All Categories Combined</option>
                <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                <option value="Electricity & Streetlights">Electricity & Streetlights</option>
                <option value="Water Supply">Water Supply</option>
              </select>
            </div>

            {/* Volume Tier Filter */}
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase text-stone-500 block mb-1">⚡ Demand Volume</label>
              <select
                value={selectedVolumeTier}
                onChange={(e) => setSelectedVolumeTier(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="ALL">All Wards ({wardSpatialAnalysis.length})</option>
                <option value="HIGH">High &gt;50 Complaints</option>
                <option value="MODERATE">Moderate 10-50</option>
                <option value="ROUTINE">Routine &lt;10</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-stone-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-bold">Map Pin Display:</span>
              <button
                onClick={() => setPinDisplayMode(m => m === 'ACTIVE_ONLY' ? 'ALL_WARDS' : 'ACTIVE_ONLY')}
                className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                  pinDisplayMode === 'ACTIVE_ONLY'
                    ? 'bg-orange-100 text-orange-900 border-orange-300'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {pinDisplayMode === 'ACTIVE_ONLY'
                  ? `Showing Active Wards with Complaints (${displayedPins.length} Pins)`
                  : `Showing All 85 Municipal Wards`}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedWardId('ward_52');
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedVolumeTier('ALL');
                setMapCenter([22.7196, 75.8577]);
                setMapZoom(13);
              }}
              className="text-stone-500 hover:text-stone-800 underline font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: WARD DIAGNOSTIC INSPECTOR CARD */}
      {selectedWard && (
        <div ref={inspectorRef} className="bg-white border-2 border-orange-300 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-orange-500/20 shrink-0">
                <span className="text-xs uppercase tracking-wider text-orange-200">WARD</span>
                <span className="text-2xl leading-none">{selectedWard.wardNumber}</span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${selectedWard.tierBadgeClass}`}>
                    {selectedWard.tierLabel}
                  </span>
                  <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-stone-200">
                    {selectedWard.zone}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold">
                    Est. Pop: {selectedWard.population.toLocaleString('en-IN')} Citizens
                  </span>
                </div>
                <h3 className="text-xl font-black text-stone-900 mt-1">
                  {selectedWard.name}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  <span>Assigned Nodal Officer: <strong className="text-stone-800">{selectedWard.nodalOfficer}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMapCenter([selectedWard.lat, selectedWard.lng]);
                  setMapZoom(16);
                }}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5 text-orange-600" />
                <span>Fly Camera to Ward</span>
              </button>

              {onNavigateToGis && (
                <button
                  type="button"
                  onClick={onNavigateToGis}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Inspect All Pins in City GIS Map</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4 DETAILED METRIC STATUS PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-stone-500">Total Ward Grievances</span>
              <p className="text-2xl font-black text-stone-900 mt-0.5">{selectedWard.totalCount}</p>
              <span className="text-[10px] text-stone-500 font-medium">Logged in this Ward</span>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-rose-700">Pending Government Review</span>
              <p className="text-2xl font-black text-rose-900 mt-0.5">{selectedWard.pendingCount}</p>
              <span className="text-[10px] text-rose-700 font-medium">Awaiting Inspection</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-amber-700">In Progress / Sanctioned</span>
              <p className="text-2xl font-black text-amber-900 mt-0.5">{selectedWard.inProgressCount}</p>
              <span className="text-[10px] text-amber-700 font-medium">Under Active Work Order</span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Resolved & Verified</span>
              <p className="text-2xl font-black text-emerald-900 mt-0.5">{selectedWard.resolvedCount}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Closed with Citizen Feedback</span>
            </div>
          </div>

          {/* CATEGORY BREAKDOWN & PROGRESS BARS */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-orange-600" /> Ward Grievance Category Distribution
              </span>
              <span className="text-xs text-stone-500 font-bold">
                Primary Issue: <strong className="text-orange-600">{selectedWard.primaryCat}</strong> ({selectedWard.primaryCatPct}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* Sanitation & Drainage */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-stone-700 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> Sanitation & Drainage
                  </span>
                  <span className="text-stone-900">{selectedWard.categoryCounts.sanitation}</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${selectedWard.totalCount > 0 ? (selectedWard.categoryCounts.sanitation / selectedWard.totalCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Roads & Infrastructure */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-stone-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-orange-500" /> Roads & Potholes
                  </span>
                  <span className="text-stone-900">{selectedWard.categoryCounts.roads}</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${selectedWard.totalCount > 0 ? (selectedWard.categoryCounts.roads / selectedWard.totalCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Electricity */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-stone-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Streetlights & Power
                  </span>
                  <span className="text-stone-900">{selectedWard.categoryCounts.electricity}</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${selectedWard.totalCount > 0 ? (selectedWard.categoryCounts.electricity / selectedWard.totalCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Water Supply */}
              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-stone-700 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-teal-500" /> Water Supply
                  </span>
                  <span className="text-stone-900">{selectedWard.categoryCounts.water}</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{
                      width: `${selectedWard.totalCount > 0 ? (selectedWard.categoryCounts.water / selectedWard.totalCount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CITIZEN COMPLAINT FEED IN THIS WARD */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-orange-600" /> Citizen Voice Grievances in {selectedWard.shortName} ({inspectorComplaints.length} Shown)
              </span>

              {/* Tab Filters for Feed */}
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setComplaintTabFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    complaintTabFilter === 'ALL' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  All ({selectedWard.citizenComplaints.length})
                </button>
                <button
                  onClick={() => setComplaintTabFilter('CRITICAL')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    complaintTabFilter === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-700 border-stone-200 hover:bg-rose-50'
                  }`}
                >
                  Critical ({selectedWard.criticalCount})
                </button>
                <button
                  onClick={() => setComplaintTabFilter('PENDING')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    complaintTabFilter === 'PENDING' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-stone-200 hover:bg-amber-50'
                  }`}
                >
                  Pending ({selectedWard.pendingCount})
                </button>
                <button
                  onClick={() => setComplaintTabFilter('RESOLVED')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    complaintTabFilter === 'RESOLVED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-stone-200 hover:bg-emerald-50'
                  }`}
                >
                  Resolved ({selectedWard.resolvedCount})
                </button>
              </div>
            </div>

            {/* Complaint List */}
            {inspectorComplaints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[440px] overflow-y-auto pr-1">
                {inspectorComplaints.slice(0, 10).map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-orange-300 hover:shadow-sm transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-stone-200/80">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] font-bold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                          {c.id}
                        </span>
                        <span className="font-bold text-stone-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" /> {c.citizen_name || 'Verified Resident'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          c.urgency === 'Critical' || c.urgency === 'EXTREME_CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : c.urgency === 'High'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {c.urgency || 'Normal'}
                        </span>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          c.current_status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.current_status === 'PENDING_ADMIN_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.current_status === 'RESOLVED' ? 'Solved' : c.current_status === 'PENDING_ADMIN_REVIEW' ? 'Pending' : 'In Progress'}
                        </span>
                      </div>
                    </div>

                    <p className="text-stone-900 italic font-sans leading-relaxed">
                      "{c.transcript}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60">
                      <span>🏷️ {c.category || 'General'}</span>
                      <span>📍 {c.landmark || selectedWard.shortName}</span>
                      {c.photo_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(c.photo_url)}
                          className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3" /> View Photo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-stone-500 text-xs">
                No complaints matching the selected tab filter in this ward.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: INTERACTIVE WARD SPATIAL MAP CANVAS */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-extrabold text-stone-900">
              Indore Municipal Ward Spatial Grid & Complaint Counts
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full border border-stone-200 text-[11px]">
              {displayedPins.length} Ward Markers Rendered
            </span>
            <button
              onClick={() => {
                setMapCenter([22.7196, 75.8577]);
                setMapZoom(13);
                setSelectedWardId('ward_52');
              }}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded-xl border border-stone-300 cursor-pointer transition-all"
            >
              Reset City View
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-[450px] sm:h-[580px] lg:h-[700px] rounded-2xl overflow-hidden border border-stone-200 relative shadow-inner">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapResizer />
            <MapFlyTo center={mapCenter} zoom={mapZoom} />
            
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
            />

            {/* WARD PIN BADGES: Crisp vector badges with exact count and locality name */}
            {displayedPins.map((ward) => {
              const isSelected = selectedWard?.id === ward.id;
              return (
                <Marker
                  key={ward.id}
                  position={[ward.lat, ward.lng]}
                  icon={createWardMarkerIcon(ward, ward.totalCount, isSelected)}
                  eventHandlers={{
                    click: () => {
                      handleSelectWard(ward);
                    }
                  }}
                >
                  <Popup maxWidth={320} minWidth={260}>
                    <div className="p-2 space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                        <span className="font-extrabold text-stone-900">{ward.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ward.tierBadgeClass}`}>
                          {ward.totalCount} Complaints
                        </span>
                      </div>

                      <div className="space-y-1 text-stone-600 text-[11px]">
                        <div className="flex justify-between">
                          <span>Zone & Population:</span>
                          <span className="font-bold text-stone-900">{ward.zone} • {ward.population.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending Review:</span>
                          <span className="font-bold text-rose-600">{ward.pendingCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Resolved:</span>
                          <span className="font-bold text-emerald-600">{ward.resolvedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Primary Issue:</span>
                          <span className="font-bold text-stone-900">{ward.primaryCat}</span>
                        </div>
                      </div>

                      {ward.citizenComplaints.length > 0 && (
                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 text-[11px] italic text-stone-700">
                          "{ward.citizenComplaints[0].transcript}"
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectWard(ward)}
                          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-1.5 rounded-lg text-center cursor-pointer transition-all text-[11px]"
                        >
                          Inspect Full Ward Diagnostics & Feed →
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          </MapContainer>

          {/* FLOATING LEGEND */}
          <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-stone-300 rounded-2xl p-3.5 shadow-lg max-w-[240px] space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-600" /> Ward Demand Scale
              </span>
            </div>

            <div className="space-y-2 text-[10px] font-bold text-stone-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0 shadow-xs" />
                  <span>High Volume</span>
                </span>
                <span className="font-mono text-stone-500">&gt; 50 Complaints</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 shadow-xs" />
                  <span>Moderate Demand</span>
                </span>
                <span className="font-mono text-stone-500">10 - 50</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                  <span>Routine Upkeep</span>
                </span>
                <span className="font-mono text-stone-500">&lt; 10</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-stone-200 text-[9px] text-stone-500 text-center font-medium">
              Click any Ward Pin to Fly & Inspect
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TOP PRIORITY WARDS DIRECTORY (INTERACTIVE DIRECT CARDS) */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-extrabold text-stone-900">
              Top Priority Wards Directory (Ranked by Grievance Volume)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Click "Take Me There" on Ward 14, Ward 52, or Ward 1 to fly immediately
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topPriorityWards.map((ward, index) => {
            const isSelected = selectedWard?.id === ward.id;
            return (
              <div
                key={ward.id}
                onClick={() => handleSelectWard(ward)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 group ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-500/20'
                    : 'border-stone-200 bg-stone-50/40 hover:bg-white hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-xl bg-stone-900 text-white font-black text-xs flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${ward.tierBadgeClass}`}>
                    {ward.totalCount} Complaints
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-stone-900 group-hover:text-orange-600 transition-colors">
                    {ward.name}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {ward.zone} • {ward.population.toLocaleString('en-IN')} Citizens
                  </p>
                </div>

                <div className="space-y-1 text-xs pt-1 border-t border-stone-200/70">
                  <div className="flex justify-between text-stone-600 text-[11px]">
                    <span>Primary Issue:</span>
                    <strong className="text-stone-900">{ward.primaryCat}</strong>
                  </div>
                  <div className="flex justify-between text-stone-600 text-[11px]">
                    <span>Pending Action:</span>
                    <strong className="text-rose-600">{ward.pendingCount} Tickets</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-600 flex items-center gap-1 group-hover:underline">
                    Take Me There 📍
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-4 max-w-xl w-full space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-xs font-black uppercase text-stone-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-600" /> Citizen Attached Photo Proof
              </span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200 max-h-[400px] flex items-center justify-center bg-stone-900">
              <img src={previewPhoto} alt="Grievance Evidence" className="max-h-[380px] w-auto object-contain" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="bg-stone-900 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
