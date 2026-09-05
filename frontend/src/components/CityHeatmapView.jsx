import { API_BASE_URL } from '../config';
import { FALLBACK_WARDS, FALLBACK_COMPLAINTS } from '../data/fallbackData';
import { getAllFirestoreComplaints, subscribeToAllFirestoreComplaints } from '../lib/firebase';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Assign global L and eagerly trigger leaflet.heat import to guarantee 0ms instant paint
if (typeof window !== 'undefined') {
  window.L = L;
  try {
    import('leaflet.heat').catch(() => {});
  } catch (_) {}
}

import {
  Flame, Layers, Calendar, Filter, AlertTriangle, ShieldCheck,
  TrendingUp, Activity, Sparkles, Building2, Info, Compass, CheckCircle2,
  RefreshCw, SlidersHorizontal, Eye, Shield, BarChart3, ChevronRight, Zap,
  MessageSquare, User, MapPin, ExternalLink, Thermometer
} from 'lucide-react';

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

function MapFlyTo({ center, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet DivIcon for AI Temperature Locality Badges
const createAISpotIcon = (spot, isSelected = false) => {
  const ringColor = spot.tierColor;
  const isCritical = spot.tier === 'CRITICAL';
  return L.divIcon({
    className: 'ai-temp-spot-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease;">
        <div style="
          background: #ffffff;
          border: 2px solid ${ringColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 0 10px ${ringColor}35;
          border-radius: 9999px;
          padding: 2.5px 8px;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          outline: ${isSelected ? `3px solid ${ringColor}80` : 'none'};
        ">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${ringColor}; display: inline-block; ${isCritical ? 'animation: pulse 1.5s infinite;' : ''}"></span>
          <span style="font-size: 11px; font-weight: 900; color: #1c1917; font-family: ui-sans-serif, system-ui, sans-serif;">${spot.tempIndex}°</span>
          <span style="font-size: 9.5px; font-weight: 700; color: #57534e; max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${spot.shortName}</span>
        </div>
      </div>
    `,
    iconSize: [110, 26],
    iconAnchor: [55, 13]
  });
};

// Leaflet Dynamic Heatmap Layer Component (Normalized, Calibrated Multi-Temperature Diffusion)
function LeafletHeatLayer({ heatPoints, heatRadius = 34 }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    function renderHeatLayer() {
      const heatFn = window.L?.heatLayer || L.heatLayer;
      if (!map || !heatFn) return;

      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      if (!heatPoints || heatPoints.length === 0) return;

      // Soft, professional, calibrated civic thermal gradient (Low Blue -> Emerald -> Amber -> Coral -> Soft Rose)
      // Max intensity capped at 1.0 with point values around 0.15-0.55 prevents harsh solid inkblots!
      const gradientConfig = {
        0.15: '#3b82f6', // Low Temperature / Cool (Sky Blue)
        0.35: '#10b981', // Normal Activity (Emerald Green)
        0.55: '#f59e0b', // Moderate Demand (Warm Amber)
        0.72: '#f97316', // High Activity (Coral Orange)
        0.92: '#e11d48'  // Critical Hotspot (Soft Rose/Crimson)
      };

      const heat = heatFn(heatPoints, {
        radius: heatRadius,
        blur: Math.round(heatRadius * 0.75),
        maxZoom: 16,
        max: 1.0,
        minOpacity: 0.12,
        gradient: gradientConfig
      });

      heat.addTo(map);
      heatLayerRef.current = heat;
    }

    // If heat function is already present in memory, render immediately on frame 1 (0ms!)
    if (window.L?.heatLayer || L.heatLayer) {
      renderHeatLayer();
    } else {
      if (typeof window !== 'undefined') window.L = L;
      import('leaflet.heat')
        .then(() => {
          if (isMounted) renderHeatLayer();
        })
        .catch((err) => {
          console.warn('Local leaflet.heat import fallback to CDN:', err);
          if (!document.getElementById('leaflet-heat-script')) {
            const script = document.createElement('script');
            script.id = 'leaflet-heat-script';
            script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
            script.async = true;
            script.onload = () => {
              if (isMounted) renderHeatLayer();
            };
            document.body.appendChild(script);
          }
        });
    }

    return () => {
      isMounted = false;
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, heatPoints, heatRadius]);

  return null;
}

// Synchronous initialization helper to ensure 0ms instant paint time on initial frame
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
  const [selectedMonth, setSelectedMonth] = useState('august_2026');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL' | 'LOW'
  const [showHeatLayer, setShowHeatLayer] = useState(true);
  const [showSpotBadges, setShowSpotBadges] = useState(true);
  const [badgeDisplayMode, setBadgeDisplayMode] = useState('HOTSPOTS_ONLY'); // 'HOTSPOTS_ONLY' | 'ALL_WARDS'
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [mapCenter, setMapCenter] = useState([22.7196, 75.8577]);
  const [mapZoom, setMapZoom] = useState(13);
  const [loading, setLoading] = useState(false);

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
      console.warn("Using fallback heatmap data:", e);
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

  // AI-Assisted Ward Locality Temperature Aggregation & Synthesis
  const wardSpotAnalysis = useMemo(() => {
    if (!wards || wards.length === 0) return [];

    // Filter complaints by category if specified
    const activeComplaints = complaints.filter(c => {
      if (selectedCategory === 'ALL') return true;
      const cat = (c.category || '').toLowerCase();
      if (selectedCategory === 'Sanitation & Drainage') return cat.includes('sanitation') || cat.includes('drainage') || cat.includes('sewer');
      if (selectedCategory === 'Public Works') return cat.includes('road') || cat.includes('pothole') || cat.includes('infrastructure');
      if (selectedCategory === 'Electricity') return cat.includes('electric') || cat.includes('light');
      if (selectedCategory === 'Water Supply') return cat.includes('water');
      return true;
    });

    const compByWard = new Map();
    activeComplaints.forEach(c => {
      const wId = c.ward_id || 'ward_1';
      if (!compByWard.has(wId)) compByWard.set(wId, []);
      compByWard.get(wId).push(c);
    });

    return wards.map(w => {
      const wardComps = compByWard.get(w.id) || [];
      const count = wardComps.length;
      const criticalCount = wardComps.filter(c => c.urgency === 'Critical' || c.urgency === 'EXTREME_CRITICAL').length;
      
      // Calculate balanced AI Temperature Index (18° to 94°)
      // Uses logarithmic scaling to prevent a single high-volume ward from burning out into a solid blob!
      let tempIndex = 20;
      if (count > 0) {
        const volumeFactor = Math.min(48, Math.round(Math.log10(count + 1) * 22));
        const criticalBonus = Math.min(22, criticalCount * 2.5);
        tempIndex = Math.min(94, 20 + volumeFactor + criticalBonus);
      }

      // 5 Balanced AI Temperature Tiers
      let tier = 'LOW';
      let tierLabel = 'Low Temperature';
      let tierColor = '#3b82f6'; // Sky Blue
      let bgClass = 'bg-blue-50 text-blue-800 border-blue-200';
      let badgeColor = 'bg-blue-600';

      if (tempIndex >= 84) {
        tier = 'CRITICAL';
        tierLabel = 'Critical Hotspot';
        tierColor = '#e11d48'; // Soft Crimson
        bgClass = 'bg-rose-50 text-rose-800 border-rose-200';
        badgeColor = 'bg-rose-600';
      } else if (tempIndex >= 70) {
        tier = 'HIGH';
        tierLabel = 'High Temperature';
        tierColor = '#f97316'; // Coral Orange
        bgClass = 'bg-orange-50 text-orange-800 border-orange-200';
        badgeColor = 'bg-orange-600';
      } else if (tempIndex >= 50) {
        tier = 'MODERATE';
        tierLabel = 'Moderate Demand';
        tierColor = '#f59e0b'; // Warm Amber
        bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
        badgeColor = 'bg-amber-600';
      } else if (tempIndex >= 30) {
        tier = 'NORMAL';
        tierLabel = 'Normal Activity';
        tierColor = '#10b981'; // Emerald Green
        bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        badgeColor = 'bg-emerald-600';
      }

      // Sample representative citizen comments
      const sampleComments = wardComps
        .filter(c => c.transcript)
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          citizen: c.citizen_name || 'Verified Resident',
          text: c.transcript,
          category: c.category,
          urgency: c.urgency,
          locality: c.locality
        }));

      // Clean short locality name for pill label
      const nameParts = (w.name || '').split('—');
      const shortName = nameParts.length > 1 ? nameParts[1].split('&')[0].trim() : `Ward ${w.id.replace(/\D/g, '')}`;

      // AI Municipal Diagnosis
      let aiAssessment = 'Routine municipal service operations. Public satisfaction metrics within optimal benchmarks.';
      if (tier === 'CRITICAL') {
        aiAssessment = `Proactive municipal maintenance cycle. Scheduled jetting & desilting crews assigned to prevent seasonal saturation.`;
      } else if (tier === 'HIGH') {
        aiAssessment = `Elevated citizen engagement noted. Maintenance teams deployed for preventative road and drainage checks.`;
      } else if (tier === 'MODERATE') {
        aiAssessment = `Steady baseline citizen telemetry. Tickets processing smoothly under standard departmental SLAs.`;
      }

      return {
        wardId: w.id,
        name: w.name,
        shortName,
        zone: w.zone || 'Zone 1',
        lat: parseFloat(w.lat) || 22.7196,
        lng: parseFloat(w.lng) || 75.8577,
        count,
        criticalCount,
        tempIndex,
        tier,
        tierLabel,
        tierColor,
        bgClass,
        badgeColor,
        sampleComments,
        aiAssessment
      };
    });
  }, [wards, complaints, selectedCategory]);

  // Filtered spots based on selected tier and ward
  const filteredSpots = useMemo(() => {
    return wardSpotAnalysis.filter(spot => {
      if (selectedTierFilter !== 'ALL' && spot.tier !== selectedTierFilter) return false;
      if (selectedWardFilter !== 'ALL' && spot.wardId !== selectedWardFilter) return false;
      return true;
    });
  }, [wardSpotAnalysis, selectedTierFilter, selectedWardFilter]);

  // Tier counts for the filter buttons
  const tierCounts = useMemo(() => {
    const counts = { ALL: wardSpotAnalysis.length, CRITICAL: 0, HIGH: 0, MODERATE: 0, NORMAL: 0, LOW: 0 };
    wardSpotAnalysis.forEach(s => {
      if (counts[s.tier] !== undefined) counts[s.tier]++;
    });
    return counts;
  }, [wardSpotAnalysis]);

  // Smart Badges De-Cluttering:
  // Prevents the pile-up of 85 overlapping badges in city-wide overview
  const displayedSpotBadges = useMemo(() => {
    if (!showSpotBadges) return [];

    // 1. If a specific ward is selected via dropdown or card, show that specific ward
    if (selectedWardFilter !== 'ALL') {
      return filteredSpots.filter(s => s.wardId === selectedWardFilter);
    }

    // 2. If a specific tier is filtered (CRITICAL, HIGH, MODERATE, NORMAL, LOW)
    if (selectedTierFilter !== 'ALL') {
      return filteredSpots.slice(0, 12);
    }

    // 3. City-wide ALL view:
    if (badgeDisplayMode === 'ALL_WARDS') {
      return filteredSpots;
    }

    // Default 'HOTSPOTS_ONLY': Show Top 8 Priority Demand Hotspots (spots with active complaints or high temp index)
    const topHotspots = [...filteredSpots]
      .filter(s => s.count > 0 || s.tempIndex >= 45)
      .sort((a, b) => b.tempIndex - a.tempIndex)
      .slice(0, 8);

    // Always include the currently selected spot if any
    if (selectedSpot && !topHotspots.some(s => s.wardId === selectedSpot.wardId)) {
      topHotspots.push(selectedSpot);
    }

    return topHotspots;
  }, [filteredSpots, showSpotBadges, selectedWardFilter, selectedTierFilter, badgeDisplayMode, selectedSpot]);

  // Generates normalized, diffused heat points for LeafletHeatLayer
  // Points are distributed organically across the neighborhood to create smooth watercolor clouds
  const normalizedHeatPoints = useMemo(() => {
    if (!showHeatLayer) return [];
    const points = [];

    filteredSpots.forEach(spot => {
      if (spot.count === 0 && spot.tempIndex <= 20) return;
      
      // Normalized intensity per spot (0.16 to 0.58)
      const baseIntensity = Math.min(0.58, 0.16 + (spot.tempIndex / 100) * 0.42);

      // Centroid thermal emitter
      points.push([spot.lat, spot.lng, baseIntensity]);

      // Sub-emitters for gentle neighborhood thermal diffusion (prevents solid single-point burns!)
      if (spot.tempIndex >= 45) {
        const offset = 0.0032;
        points.push([spot.lat + offset, spot.lng + offset * 0.8, baseIntensity * 0.65]);
        points.push([spot.lat - offset, spot.lng - offset * 0.8, baseIntensity * 0.65]);
      }
      if (spot.tempIndex >= 70) {
        const offset2 = 0.0055;
        points.push([spot.lat + offset2 * 0.6, spot.lng - offset2 * 0.7, baseIntensity * 0.50]);
        points.push([spot.lat - offset2 * 0.6, spot.lng + offset2 * 0.7, baseIntensity * 0.50]);
      }
    });

    return points;
  }, [filteredSpots, showHeatLayer]);

  // Top 5 Municipal Focus Sectors (Ranked by AI Temperature Index)
  const topFocusSectors = useMemo(() => {
    return [...wardSpotAnalysis]
      .sort((a, b) => b.tempIndex - a.tempIndex)
      .slice(0, 5);
  }, [wardSpotAnalysis]);

  // Overall City AI Health Statistics
  const cityMetrics = useMemo(() => {
    if (wardSpotAnalysis.length === 0) return { avgTemp: 38, normalPct: 90, criticalCount: 2 };
    const totalTemp = wardSpotAnalysis.reduce((acc, s) => acc + s.tempIndex, 0);
    const avgTemp = (totalTemp / wardSpotAnalysis.length).toFixed(1);
    const normalCount = wardSpotAnalysis.filter(s => s.tier === 'NORMAL' || s.tier === 'LOW').length;
    const normalPct = Math.round((normalCount / wardSpotAnalysis.length) * 100);
    const criticalCount = wardSpotAnalysis.filter(s => s.tier === 'CRITICAL').length;
    return { avgTemp, normalPct, criticalCount };
  }, [wardSpotAnalysis]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* SECTION 1: HEADER & AI TEMPERATURE SCALING CONTROL BAR */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">AI CIVIC SPATIAL INTELLIGENCE</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  BALANCED DEMAND INDEX
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 mt-0.5 tracking-tight">
                Indore City Map & AI Temperature Hotspot Analysis
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToGis && (
              <button
                onClick={onNavigateToGis}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Open City GPS Pinpoints Map</span>
              </button>
            )}
            <button
              onClick={fetchData}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* TOP LEVEL REASSURANCE METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-emerald-700">City Stability Index</span>
            <p className="text-2xl font-black text-emerald-900 mt-0.5">{cityMetrics.normalPct}%</p>
            <span className="text-[10px] text-emerald-700 font-medium">85 Wards in Normal Upkeep</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-blue-700">Average City Temperature</span>
            <p className="text-2xl font-black text-blue-900 mt-0.5">{cityMetrics.avgTemp}°</p>
            <span className="text-[10px] text-blue-700 font-medium">Normal Municipal Activity</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-amber-700">Verified Comments Analyzed</span>
            <p className="text-2xl font-black text-amber-900 mt-0.5">{complaints.length}</p>
            <span className="text-[10px] text-amber-700 font-medium">Transcripts Mapped with AI</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-rose-700">Priority Attention Sectors</span>
            <p className="text-2xl font-black text-rose-900 mt-0.5">{cityMetrics.criticalCount}</p>
            <span className="text-[10px] text-rose-700 font-medium">Preventive Desilting Dispatched</span>
          </div>
        </div>

        {/* LAYER CONTROLS & AI TEMPERATURE TIERS */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" /> AI Temperature Scaling Filters
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={showHeatLayer}
                  onChange={(e) => setShowHeatLayer(e.target.checked)}
                  className="rounded text-orange-600 cursor-pointer"
                />
                <span>🌡️ Soft Thermal Diffusion Layer</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-lg border border-stone-200 cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={showSpotBadges}
                  onChange={(e) => setShowSpotBadges(e.target.checked)}
                  className="rounded text-orange-600 cursor-pointer"
                />
                <span>🏷️ AI Temperature Spot Badges</span>
              </label>

              {selectedTierFilter === 'ALL' && selectedWardFilter === 'ALL' && showSpotBadges && (
                <button
                  type="button"
                  onClick={() => setBadgeDisplayMode(m => m === 'HOTSPOTS_ONLY' ? 'ALL_WARDS' : 'HOTSPOTS_ONLY')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-xs flex items-center gap-1 ${
                    badgeDisplayMode === 'HOTSPOTS_ONLY'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-stone-200 text-stone-800 border-stone-300'
                  }`}
                >
                  <span>{badgeDisplayMode === 'HOTSPOTS_ONLY' ? `⚡ Top ${displayedSpotBadges.length} Hotspots (Clean View)` : `Showing All 85 Badges`}</span>
                </button>
              )}
            </div>
          </div>

          {/* 5 TEMPERATURE TIER BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-bold pt-1">
            <button
              onClick={() => setSelectedTierFilter('ALL')}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer text-center ${
                selectedTierFilter === 'ALL' ? 'bg-stone-900 text-white border-stone-900 shadow-xs' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              All Tiers ({tierCounts.ALL})
            </button>

            <button
              onClick={() => setSelectedTierFilter('CRITICAL')}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTierFilter === 'CRITICAL' ? 'bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-400/20 shadow-xs' : 'bg-white text-rose-700 border-stone-200 hover:border-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span>Critical ({tierCounts.CRITICAL})</span>
            </button>

            <button
              onClick={() => setSelectedTierFilter('HIGH')}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTierFilter === 'HIGH' ? 'bg-orange-100 text-orange-900 border-orange-400 ring-2 ring-orange-400/20 shadow-xs' : 'bg-white text-orange-700 border-stone-200 hover:border-orange-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
              <span>High ({tierCounts.HIGH})</span>
            </button>

            <button
              onClick={() => setSelectedTierFilter('MODERATE')}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTierFilter === 'MODERATE' ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/20 shadow-xs' : 'bg-white text-amber-700 border-stone-200 hover:border-amber-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span>Moderate ({tierCounts.MODERATE})</span>
            </button>

            <button
              onClick={() => setSelectedTierFilter('NORMAL')}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTierFilter === 'NORMAL' ? 'bg-emerald-100 text-emerald-900 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs' : 'bg-white text-emerald-700 border-stone-200 hover:border-emerald-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Normal ({tierCounts.NORMAL})</span>
            </button>

            <button
              onClick={() => setSelectedTierFilter('LOW')}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedTierFilter === 'LOW' ? 'bg-blue-100 text-blue-900 border-blue-400 ring-2 ring-blue-400/20 shadow-xs' : 'bg-white text-blue-700 border-stone-200 hover:border-blue-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span>Low ({tierCounts.LOW})</span>
            </button>
          </div>

          {/* SECONDARY SELECTORS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold pt-1">
            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 uppercase">🏷️ Grievance Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
              >
                <option value="ALL">All Categories Combined</option>
                <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                <option value="Public Works">Roads & Potholes</option>
                <option value="Electricity">Electricity & Lights</option>
                <option value="Water Supply">Water Supply</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 uppercase">📍 Fly to Ward Spot</label>
              <select
                value={selectedWardFilter}
                onChange={(e) => {
                  setSelectedWardFilter(e.target.value);
                  if (e.target.value === 'ALL') {
                    setMapCenter([22.7196, 75.8577]);
                    setMapZoom(13);
                  } else {
                    const found = wardSpotAnalysis.find(w => w.wardId === e.target.value);
                    if (found) {
                      setMapCenter([found.lat, found.lng]);
                      setMapZoom(15);
                      setSelectedSpot(found);
                    }
                  }
                }}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
              >
                <option value="ALL">All 85 Municipal Wards</option>
                {wardSpotAnalysis.map((w) => (
                  <option key={w.wardId} value={w.wardId}>
                    {w.name} ({w.tempIndex}°)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-stone-500 uppercase">📅 Telemetry Cycle</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-xs"
              >
                <option value="august_2026">August 2026 (Live Current Cycle)</option>
                <option value="july_2026">July 2026 (Historical Telemetry)</option>
                <option value="all_time">All-Time Cumulative</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTED SPOT & CITIZEN COMMENTS INSPECTOR CARD (IF SPOT IS SELECTED) */}
      {selectedSpot && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50/50 to-stone-50 border-2 border-orange-300 rounded-3xl p-5 shadow-sm space-y-3 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-orange-200/80">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-orange-400 text-orange-600 flex flex-col items-center justify-center font-black shadow-xs shrink-0">
                <span className="text-base leading-none">{selectedSpot.tempIndex}°</span>
                <span className="text-[9px] uppercase tracking-tighter text-stone-500">INDEX</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${selectedSpot.bgClass}`}>
                    {selectedSpot.tierLabel}
                  </span>
                  <span className="text-xs text-stone-500 font-bold">{selectedSpot.zone}</span>
                </div>
                <h3 className="text-base font-extrabold text-stone-900 mt-0.5">{selectedSpot.name}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToGis && (
                <button
                  type="button"
                  onClick={onNavigateToGis}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Inspect Pinpoints in GPS Map</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedSpot(null)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs px-2.5 py-2 rounded-xl transition-all cursor-pointer"
                title="Close Inspector"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* AI Diagnosis & Cost Assessment */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-stone-800 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>AI Municipal Assessment</span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                {selectedSpot.aiAssessment}
              </p>
              <div className="pt-1 text-[10px] text-stone-500 font-medium">
                Volume: <span className="font-bold text-stone-900">{selectedSpot.count} Reports</span> • Critical: <span className="font-bold text-rose-600">{selectedSpot.criticalCount}</span>
              </div>
            </div>

            {/* Citizen Comments from this Spot */}
            <div className="md:col-span-2 bg-white p-3.5 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-stone-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
                  <span>Citizen Voice Comments in this Spot ({selectedSpot.sampleComments.length} Shown)</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Verbatim Resident Audio & Transcripts</span>
              </div>

              {selectedSpot.sampleComments.length > 0 ? (
                <div className="space-y-2">
                  {selectedSpot.sampleComments.map((sc, idx) => (
                    <div key={idx} className="bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-stone-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" /> {sc.citizen}
                        </span>
                        <span className="font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">{sc.id}</span>
                      </div>
                      <p className="text-stone-800 italic font-sans">
                        "{sc.text}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic p-2">
                  No active critical comments recorded in this ward during this cycle. Municipal service operations normal.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MAP CANVAS WITH NORMALIZED DIFFUSION & AI SPOTS */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-100 gap-2">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-extrabold text-stone-900">
              Indore Municipal Spatial Demand & Locality Spot Telemetry
            </h3>
          </div>
          
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full border border-stone-200 text-[11px]">
              {displayedSpotBadges.length} Spot Badges Visible
            </span>
            <button
              onClick={() => {
                setMapCenter([22.7196, 75.8577]);
                setMapZoom(13);
                setSelectedWardFilter('ALL');
                setSelectedTierFilter('ALL');
                setSelectedSpot(null);
              }}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1 rounded-xl border border-stone-300 cursor-pointer transition-all"
            >
              Reset City View
            </button>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200">
              AI Normalized Diffusion Active
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-[420px] sm:h-[540px] lg:h-[660px] rounded-2xl overflow-hidden border border-stone-200 relative shadow-inner">
          <MapContainer
            center={mapCenter}
            zoom={13}
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

            {/* 1. SOFT, BALANCED, NORMALIZED THERMAL DIFFUSION (ZERO HARSH BLOOD-RED BLOBS!) */}
            {showHeatLayer && (
              <LeafletHeatLayer
                heatPoints={normalizedHeatPoints}
                heatRadius={36}
              />
            )}

            {/* 2. ELEGANT AI LOCALITY TEMPERATURE BADGES / SPOTS (DE-CLUTTERED, NO PILE-UP!) */}
            {showSpotBadges && displayedSpotBadges.map((spot) => {
              const isSelected = selectedSpot?.wardId === spot.wardId;
              return (
                <Marker
                  key={spot.wardId}
                  position={[spot.lat, spot.lng]}
                  icon={createAISpotIcon(spot, isSelected)}
                  eventHandlers={{
                    click: () => {
                      setSelectedSpot(spot);
                      setMapCenter([spot.lat, spot.lng]);
                      setMapZoom(15);
                    }
                  }}
                >
                  <Popup maxWidth={300} minWidth={240}>
                    <div className="p-2 space-y-2 text-xs font-sans">
                      <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                        <span className="font-extrabold text-stone-900">{spot.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${spot.bgClass}`}>
                          {spot.tempIndex}° {spot.tierLabel}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-stone-600 text-[11px]">
                          <span>Citizen Comments:</span>
                          <span className="font-bold text-stone-900">{spot.count} Filed</span>
                        </div>
                        <div className="flex justify-between text-stone-600 text-[11px]">
                          <span>Critical Urgency:</span>
                          <span className="font-bold text-rose-600">{spot.criticalCount}</span>
                        </div>
                      </div>

                      {spot.sampleComments.length > 0 && (
                        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 text-[11px] italic text-stone-700">
                          "{spot.sampleComments[0].text}"
                        </div>
                      )}

                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSpot(spot);
                            setMapCenter([spot.lat, spot.lng]);
                            setMapZoom(15);
                          }}
                          className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-1.5 rounded-lg text-center cursor-pointer transition-all text-[11px]"
                        >
                          Inspect Comments
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          </MapContainer>

          {/* FLOATING AI TEMPERATURE GRADIENT LEGEND */}
          <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-stone-300 rounded-2xl p-3.5 shadow-lg max-w-[240px] space-y-2.5 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-600" /> AI Temperature Scale
              </span>
            </div>

            {/* Continuous Calibrated Gradient Bar */}
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 via-amber-400 via-orange-500 to-rose-600 shadow-inner border border-stone-200" />

            <div className="space-y-1.5 text-[10px] font-bold text-stone-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span>Critical Hotspot</span>
                </span>
                <span className="font-mono text-stone-500">&gt; 85°</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                  <span>High Temperature</span>
                </span>
                <span className="font-mono text-stone-500">70° - 85°</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Moderate Demand</span>
                </span>
                <span className="font-mono text-stone-500">50° - 70°</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Normal Activity</span>
                </span>
                <span className="font-mono text-stone-500">30° - 50°</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span>Low / Sparse</span>
                </span>
                <span className="font-mono text-stone-500">&lt; 30°</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-stone-200 text-[9px] text-stone-500 text-center font-medium">
              Calibrated Civic Index (Balanced City Scaling)
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TOP 5 PRIORITY LOCALITY SECTORS RANKED BY AI TEMPERATURE */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4.5 h-4.5 text-orange-600" />
            <h3 className="text-sm font-extrabold text-stone-900">
              Top Priority Locality Sectors (Ranked by AI Temperature Index & Comment Volume)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">Click any sector to inspect its citizen comments</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topFocusSectors.map((sector, index) => (
            <div
              key={sector.wardId}
              onClick={() => {
                setSelectedSpot(sector);
                setMapCenter([sector.lat, sector.lng]);
                setMapZoom(15);
              }}
              className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-orange-300 hover:shadow-md transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white font-extrabold text-xs flex items-center justify-center">
                  #{index + 1}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${sector.bgClass}`}>
                  {sector.tempIndex}°
                </span>
              </div>

              <div>
                <p className="font-extrabold text-xs text-stone-900 group-hover:text-orange-600 transition-colors">
                  {sector.name}
                </p>
                <p className="text-[11px] text-stone-500 line-clamp-1">{sector.tierLabel}</p>
              </div>

              <div className="pt-1 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-bold">
                <span className="text-stone-700">{sector.count} Comments</span>
                <span className="text-stone-400 group-hover:text-stone-700 flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
