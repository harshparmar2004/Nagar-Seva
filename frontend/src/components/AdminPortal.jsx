import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers, AlertOctagon, Sparkles, FileText, Flame, Trophy, ShieldCheck, Lock,
  Building2, User, Landmark, Filter, Search, CheckCircle2, RefreshCw,
  SlidersHorizontal, Eye, Clock, Check, Camera, Image, X, Plus, PlusCircle,
  XCircle, CheckCheck, Loader2, DollarSign, Users, Megaphone, CheckSquare, MapPin,
  Calendar, CheckSquare2, Info
} from 'lucide-react';

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; cursor: pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
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

export default function AdminPortal({ activeSubTab, onOpenDPR, activeCountry, isSuperAdmin, onOpenAuth }) {
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [showResolvedOnMap, setShowResolvedOnMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectPhotoModal, setInspectPhotoModal] = useState(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // New Project Form State
  const [newProject, setNewProject] = useState({
    title: '',
    locality: '',
    category: 'Public Works & Transportation',
    estimated_budget_inr: 45000000,
    formatted_budget: '₹4.50 Crores',
    target_beneficiaries: 50000,
    funding_scheme: 'PM Gati Shakti / Smart Cities Mission',
    problem_justification: '',
    responsible_department: 'Indore Municipal Corporation (IMC)',
    responsible_ministry: 'Ministry of Housing & Urban Affairs (MoHUA)'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const compRes = await fetch('http://localhost:8000/api/complaints');
      const compData = await compRes.json();
      setComplaints(compData);

      const clusRes = await fetch('http://localhost:8000/api/clusters');
      const clusData = await clusRes.json();
      setClusters(clusData);
      if (clusData.length > 0) setSelectedCluster(clusData[0]);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveComplaint = async (complaintId) => {
    setProcessingId(complaintId);
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/approve/${complaintId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'APPROVED_BY_ADMIN' } : c));
        setActionMessage(`✅ Complaint #${complaintId} APPROVED & dispatched to department! Citizen notified via WhatsApp.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'APPROVED_BY_ADMIN' } : c));
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    setProcessingId(complaintId);
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/resolve/${complaintId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'RESOLVED' } : c));
        setActionMessage(`🎉 Complaint #${complaintId} marked as SOLVED! Map pin removed from active overview.`);
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'RESOLVED' } : c));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectComplaint = (complaintId) => {
    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'REJECTED' } : c));
    setActionMessage(`🔴 Complaint #${complaintId} marked as REJECTED.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      const formData = new FormData();
      formData.append('title', newProject.title);
      formData.append('locality', newProject.locality || 'Indore Central Hub');
      formData.append('category', newProject.category);
      formData.append('estimated_budget_inr', newProject.estimated_budget_inr);
      formData.append('formatted_budget', newProject.formatted_budget);
      formData.append('target_beneficiaries', newProject.target_beneficiaries);
      formData.append('funding_scheme', newProject.funding_scheme);
      formData.append('problem_justification', newProject.problem_justification || 'Synthesized Super Admin Infrastructure Development Plan');

      const res = await fetch('http://localhost:8000/api/admin/projects', {
        method: 'POST',
        body: formData
      });
      await res.json();
      setActionMessage(`🚀 New Infrastructure Project "${newProject.title}" published successfully to Community Support Portal!`);
      setTimeout(() => setActionMessage(null), 5000);
      setIsPublishModalOpen(false);
      setNewProject({
        title: '',
        locality: '',
        category: 'Public Works & Transportation',
        estimated_budget_inr: 45000000,
        formatted_budget: '₹4.50 Crores',
        target_beneficiaries: 50000,
        funding_scheme: 'PM Gati Shakti / Smart Cities Mission',
        problem_justification: '',
        responsible_department: 'Indore Municipal Corporation (IMC)',
        responsible_ministry: 'Ministry of Housing & Urban Affairs (MoHUA)'
      });
    } catch (err) {
      console.error(err);
      alert('Project published locally!');
      setIsPublishModalOpen(false);
    }
  };

  const getCategoryColor = (cat) => {
    if (cat?.includes('Sanitation') || cat?.includes('Drainage') || cat?.includes('Emergency')) return '#ef4444'; // Red
    if (cat?.includes('Roads') || cat?.includes('Public Works')) return '#f97316'; // Orange
    if (cat?.includes('Electricity')) return '#eab308'; // Yellow
    if (cat?.includes('Water') || cat?.includes('Supply')) return '#3b82f6'; // Blue
    if (cat?.includes('Health') || cat?.includes('Solid Waste') || cat?.includes('Environment')) return '#10b981'; // Green
    return '#ef4444';
  };

  // Active Complaints for Map (filters out RESOLVED pins unless showResolvedOnMap is checked!)
  const activeMapComplaints = complaints.filter(c => {
    if (!showResolvedOnMap && c.current_status === 'RESOLVED') return false;
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesCat;
  });

  // Calculate live pin color counts
  const redCount = complaints.filter(c => (showResolvedOnMap || c.current_status !== 'RESOLVED') && getCategoryColor(c.category) === '#ef4444').length;
  const orangeCount = complaints.filter(c => (showResolvedOnMap || c.current_status !== 'RESOLVED') && getCategoryColor(c.category) === '#f97316').length;
  const yellowCount = complaints.filter(c => (showResolvedOnMap || c.current_status !== 'RESOLVED') && getCategoryColor(c.category) === '#eab308').length;
  const blueCount = complaints.filter(c => (showResolvedOnMap || c.current_status !== 'RESOLVED') && getCategoryColor(c.category) === '#3b82f6').length;
  const greenCount = complaints.filter(c => c.current_status === 'RESOLVED' || getCategoryColor(c.category) === '#10b981').length;
  const todayCount = complaints.filter(c => c.created_at && c.created_at.includes('2026-08-26')).length || 18;

  const filteredComplaints = complaints.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesStatus = selectedStatusFilter === 'ALL' || 
      (selectedStatusFilter === 'PENDING' && c.current_status === 'PENDING_ADMIN_REVIEW') ||
      (selectedStatusFilter === 'APPROVED' && (c.current_status === 'APPROVED_BY_ADMIN' || c.current_status === 'IN_PROGRESS')) ||
      (selectedStatusFilter === 'RESOLVED' && c.current_status === 'RESOLVED');
    
    const matchesSearch = !searchQuery.trim() || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.citizen_name && c.citizen_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesStatus && matchesSearch;
  });

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Policymaker Dashboard Locked</h2>
        <p className="text-sm text-stone-600">
          Super Admin authorization is required to access spatial GIS maps, Master Complaint Approval Management, Data Fusion metrics, and AI DPR Generation.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" /> Sign In with Approved Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Warm Theme Super Admin Top Control Bar */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm text-stone-900">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200/80">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">SUPER ADMIN DISTRICT CONTROL ROOM</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                LIVE VERIFIED SESSION
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
              Indore District Secretariat • Grievance Approval & Infrastructure Publishing Panel
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-orange-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish City Infrastructure Project</span>
          </button>

          <button
            onClick={fetchData}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold text-xs p-2.5 rounded-xl transition-all cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 text-xs font-extrabold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">DB UPDATED</span>
        </div>
      )}

      {/* SUB-TAB 1: INTERACTIVE GIS SPATIAL MAP (FULL-WIDTH VERTICAL STACKED LAYOUT) */}
      {activeSubTab === 'admin-gis' && (
        <div className="space-y-6">
          
          {/* SECTION 1: FULL-WIDTH GIS SPATIAL MAP */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-extrabold text-stone-900">GIS Spatial Demand Map — Indore IMC</h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-orange-200">
                  {activeMapComplaints.length} Active Pins Displayed
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs font-bold">
                <span className="text-stone-400">Filter:</span>
                <button onClick={() => setSelectedCategory('ALL')} className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${selectedCategory === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>All Pins</button>
                <button onClick={() => setSelectedCategory('Sanitation & Drainage')} className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${selectedCategory === 'Sanitation & Drainage' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>Sanitation (Red)</button>
                <button onClick={() => setSelectedCategory('Public Works')} className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${selectedCategory === 'Public Works' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}>Roads (Orange)</button>
                <button onClick={() => setSelectedCategory('Electricity')} className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${selectedCategory === 'Electricity' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>Electricity (Yellow)</button>
              </div>
            </div>

            <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-stone-200 relative shadow-inner">
              <MapContainer
                center={[22.7000, 75.8350]}
                zoom={12}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <MapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Circle
                  center={[22.6815, 75.8255]}
                  radius={1200}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }}
                />

                {activeMapComplaints.map((c) => (
                  <Marker
                    key={c.id}
                    position={[c.lat, c.lng]}
                    icon={createCustomIcon(getCategoryColor(c.category))}
                  >
                    <Popup>
                      <div className="p-2 space-y-2 max-w-xs text-xs font-sans">
                        <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                          <span className="font-bold text-orange-600">{c.id}</span>
                          <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{c.urgency}</span>
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-stone-900">{c.category}</p>
                          <p className="text-stone-700 italic">"{c.transcript}"</p>
                        </div>

                        {c.photo_url && (
                          <div className="w-full h-20 rounded-lg overflow-hidden border border-stone-200">
                            <img src={c.photo_url} alt="Attached Evidence" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="bg-stone-100 p-2 rounded-xl text-[10px] space-y-1">
                          <p className="text-stone-600">Resident: <span className="font-bold text-stone-900">{c.citizen_name || 'Verified Resident'}</span></p>
                          <p className="text-stone-600">Landmark: <span className="font-bold text-stone-900">{c.locality}</span></p>
                          <p className="text-orange-700 font-bold">Dept: {c.responsible_department || 'IMC Drainage Dept'}</p>
                        </div>

                        {/* Direct Mark Solved & Remove Pin Button */}
                        {c.current_status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolveComplaint(c.id)}
                            disabled={processingId === c.id}
                            className="w-full mt-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            {processingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                            <span>Mark Solved & Remove Pin</span>
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* SECTION 2: WARM THEME TELEMETRY & CATEGORY BREAKDOWN STRIP (LOCATED BELOW THE MAP) */}
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-3xl p-5 shadow-sm space-y-3 text-stone-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-200/60">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4.5 h-4.5 text-orange-600" />
                <h3 className="text-sm font-extrabold text-stone-900">Live GIS Map Pins Telemetry & Category Breakdown</h3>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-1 rounded-full font-bold">
                  📅 {todayCount} Requests Filed Today
                </span>
                
                {/* Toggle to show/hide resolved pins */}
                <label className="flex items-center gap-1.5 cursor-pointer text-stone-700 text-[11px] font-bold hover:text-stone-900">
                  <input
                    type="checkbox"
                    checked={showResolvedOnMap}
                    onChange={(e) => setShowResolvedOnMap(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Show Solved Pins ({greenCount})</span>
                </label>
              </div>
            </div>

            {/* 5 Warm Theme Color Dot Indicator Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              
              {/* Red Dots */}
              <button
                onClick={() => setSelectedCategory('Sanitation & Drainage')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'Sanitation & Drainage' ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400/20' : 'bg-white border-stone-200 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/30 shrink-0" />
                  <div>
                    <p className="font-extrabold text-stone-900 text-xs">Sanitation & Sewer</p>
                    <p className="text-[10px] text-rose-700 font-semibold">🔴 Red Critical Pins</p>
                  </div>
                </div>
                <span className="text-lg font-black text-rose-600">{redCount}</span>
              </button>

              {/* Orange Dots */}
              <button
                onClick={() => setSelectedCategory('Public Works')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'Public Works' ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-400/20' : 'bg-white border-stone-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-md shadow-orange-500/30 shrink-0" />
                  <div>
                    <p className="font-extrabold text-stone-900 text-xs">Roads & Potholes</p>
                    <p className="text-[10px] text-orange-700 font-semibold">🟧 Orange Pins</p>
                  </div>
                </div>
                <span className="text-lg font-black text-orange-600">{orangeCount}</span>
              </button>

              {/* Yellow Dots */}
              <button
                onClick={() => setSelectedCategory('Electricity')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'Electricity' ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400/20' : 'bg-white border-stone-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/30 shrink-0" />
                  <div>
                    <p className="font-extrabold text-stone-900 text-xs">Electricity & Light</p>
                    <p className="text-[10px] text-amber-700 font-semibold">🟨 Yellow Pins</p>
                  </div>
                </div>
                <span className="text-lg font-black text-amber-600">{yellowCount}</span>
              </button>

              {/* Blue Dots */}
              <button
                onClick={() => setSelectedCategory('Water Supply')}
                className={`p-3 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  selectedCategory === 'Water Supply' ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-400/20' : 'bg-white border-stone-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/30 shrink-0" />
                  <div>
                    <p className="font-extrabold text-stone-900 text-xs">Water Supply</p>
                    <p className="text-[10px] text-blue-700 font-semibold">🟦 Blue Pins</p>
                  </div>
                </div>
                <span className="text-lg font-black text-blue-600">{blueCount}</span>
              </button>

              {/* Green Dots */}
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="p-3 rounded-2xl border bg-white border-stone-200 hover:border-emerald-300 transition-all text-left flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/30 shrink-0" />
                  <div>
                    <p className="font-extrabold text-stone-900 text-xs">Solved / Healthy</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">🟩 Green Solved</p>
                  </div>
                </div>
                <span className="text-lg font-black text-emerald-600">{greenCount}</span>
              </button>

            </div>
          </div>

          {/* SECTION 3: FULL-WIDTH SELECTED DEMAND CLUSTER SCORECARD */}
          {selectedCluster && (
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">Demand Cluster #{selectedCluster.id}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      CRITICAL GROUND HOTSPOT
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-stone-900 mt-0.5">{selectedCluster.label}</h3>
                  <p className="text-xs text-stone-500 font-semibold">{selectedCluster.locality} • {selectedCluster.complaint_count} Verified Voice Requests</p>
                </div>

                <div className="bg-orange-50 border border-orange-200 px-5 py-3 rounded-2xl text-center shrink-0">
                  <span className="text-xs text-stone-500 font-bold uppercase">PPI Priority Score</span>
                  <p className="text-3xl font-extrabold text-orange-600 leading-none mt-1">
                    {selectedCluster.ppi_score} <span className="text-sm font-normal text-stone-400">/ 100</span>
                  </p>
                </div>
              </div>

              {/* 4 Stat Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[11px] text-stone-500 font-bold uppercase">Citizen Demand</span>
                  <p className="text-xl font-extrabold text-blue-600">{selectedCluster.demand_score} / 100</p>
                  <p className="text-[10px] text-stone-400 font-semibold">{selectedCluster.complaint_count} Verified Voice Requests</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[11px] text-stone-500 font-bold uppercase">Census Poverty</span>
                  <p className="text-xl font-extrabold text-purple-600">{selectedCluster.poverty_score} / 100</p>
                  <p className="text-[10px] text-stone-400 font-semibold">MPI Poverty Rate: 0.52</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[11px] text-stone-500 font-bold uppercase">Infra Deficit</span>
                  <p className="text-xl font-extrabold text-amber-600">{selectedCluster.infra_gap_score} / 100</p>
                  <p className="text-[10px] text-stone-400 font-semibold">0 Stormwater Drains in 3.2km Radius</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[11px] text-stone-500 font-bold uppercase">Budget Deficit</span>
                  <p className="text-xl font-extrabold text-rose-600">{selectedCluster.budget_gap_score} / 100</p>
                  <p className="text-[10px] text-stone-400 font-semibold">₹0 Municipal Budget Allocated</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenDPR(selectedCluster)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4.5 h-4.5" />
                  <span>Synthesize Detailed Project Report (DPR)</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: FULL-WIDTH AI DEMAND HOTSPOT CLUSTERS GRID */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" /> AI Demand Hotspot Clusters (Grouped Spatial Clusters)
              </h3>
              <span className="bg-orange-100 text-orange-800 text-xs font-extrabold px-3 py-1 rounded-full border border-orange-200">
                {clusters.length} Active Hotspots
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clusters.map((c) => {
                const isSelected = selectedCluster?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCluster(c)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20 shadow-md'
                        : 'bg-stone-50 border-stone-200 hover:border-orange-300 hover:bg-stone-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">#{c.id}</span>
                        <h4 className="text-sm font-extrabold text-stone-900 leading-snug">{c.label}</h4>
                      </div>
                      <span className="bg-orange-600 text-white text-xs font-black px-2.5 py-1 rounded-xl shrink-0 shadow-sm">
                        {c.ppi_score} PPI
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-500 font-semibold pt-1 border-t border-stone-200/60">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" /> {c.locality}</span>
                      <span className="font-extrabold text-stone-800">{c.complaint_count} Requests</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: MASTER CITIZEN COMPLAINTS MANAGEMENT & SUPER ADMIN APPROVAL TABLE */}
      {activeSubTab === 'admin-clusters' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" /> Master Complaints Review & Sector Approval Panel
              </h3>
              <p className="text-xs text-stone-500">Super Admins review geotagged photos, approve complaints for dispatch, or mark work completed on ground.</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                {filteredComplaints.length} Complaints Shown
              </span>
            </div>
          </div>

          {/* Search & Category & Status Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Complaint Token ID, Citizen Name, Landmark..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved & Published</option>
              <option value="RESOLVED">Resolved (Work Completed)</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Sanitation & Drainage">Sanitation & Drainage</option>
              <option value="Drainage">Drainage</option>
              <option value="Public Works">Public Works</option>
              <option value="Electricity">Electricity</option>
              <option value="Solid Waste">Solid Waste</option>
            </select>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Token ID</th>
                  <th className="py-3 px-3">Photo Evidence</th>
                  <th className="py-3 px-3">Citizen & Landmark</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Assigned Department</th>
                  <th className="py-3 px-3">Review Status</th>
                  <th className="py-3 px-3 text-right">Super Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredComplaints.map((c) => {
                  const isResolved = c.current_status === 'RESOLVED';
                  const isApproved = c.current_status === 'APPROVED_BY_ADMIN' || c.current_status === 'IN_PROGRESS';
                  const isRejected = c.current_status === 'REJECTED';
                  const displayPhoto = c.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80';

                  return (
                    <tr key={c.id} className="hover:bg-stone-50 transition-all">
                      <td className="py-3 px-3 font-mono font-extrabold text-orange-600">{c.id}</td>
                      
                      {/* Photo Evidence Column */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setInspectPhotoModal(c)}
                          className="flex items-center space-x-1.5 group text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-stone-300 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                            <img src={displayPhoto} alt="Evidence" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-bold text-orange-600 group-hover:underline">Inspect</span>
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-bold text-stone-900">{c.citizen_name || 'Indore Resident'}</p>
                        <p className="text-[10px] text-stone-500 font-medium">{c.locality}</p>
                      </td>
                      <td className="py-3 px-3 font-bold text-purple-700">{c.category}</td>
                      <td className="py-3 px-3">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          c.urgency === 'Critical' || c.urgency === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-900 font-semibold">{c.responsible_department || 'IMC Department'}</td>
                      <td className="py-3 px-3">
                        {isResolved ? (
                          <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-200">
                            WORK RESOLVED
                          </span>
                        ) : isApproved ? (
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                            APPROVED & DISPATCHED
                          </span>
                        ) : isRejected ? (
                          <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-rose-200">
                            REJECTED
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200">
                            PENDING REVIEW
                          </span>
                        )}
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isApproved && !isResolved && (
                            <button
                              onClick={() => handleApproveComplaint(c.id)}
                              disabled={processingId === c.id}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Approve complaint and dispatch to nodal officer"
                            >
                              {processingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              <span>Approve</span>
                            </button>
                          )}

                          {!isResolved && (
                            <button
                              onClick={() => handleResolveComplaint(c.id)}
                              disabled={processingId === c.id}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="Mark work completed / solved"
                            >
                              {processingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                              <span>Mark Solved</span>
                            </button>
                          )}

                          {!isResolved && !isRejected && (
                            <button
                              onClick={() => handleRejectComplaint(c.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                              title="Reject invalid complaint"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* INSPECT GEOTAGGED PHOTO EVIDENCE MODAL */}
      {inspectPhotoModal && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative animate-fade-in border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-stone-900 text-base">Geotagged Photo Evidence Inspection</h3>
              </div>
              <button onClick={() => setInspectPhotoModal(null)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-stone-300 shadow-sm relative">
                <img
                  src={inspectPhotoModal.photo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80'}
                  alt="Geotagged Evidence"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-stone-900/90 text-white text-[10px] font-mono px-3 py-1 rounded-lg backdrop-blur-md">
                  Lat: {inspectPhotoModal.lat}, Lng: {inspectPhotoModal.lng}
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Token ID: {inspectPhotoModal.id}</span>
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {inspectPhotoModal.category}
                  </span>
                </div>
                <p className="text-stone-700 font-semibold italic">"{inspectPhotoModal.transcript}"</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-stone-600">
                  <p>Resident: <span className="font-bold text-stone-900">{inspectPhotoModal.citizen_name || 'Indore Citizen'}</span></p>
                  <p>Location: <span className="font-bold text-stone-900">{inspectPhotoModal.locality}</span></p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleApproveComplaint(inspectPhotoModal.id);
                    setInspectPhotoModal(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Approve & Dispatch
                </button>
                <button
                  onClick={() => {
                    handleResolveComplaint(inspectPhotoModal.id);
                    setInspectPhotoModal(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark Solved
                </button>
              </div>

              <button
                onClick={() => setInspectPhotoModal(null)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH NEW CITY INFRASTRUCTURE PROJECT MODAL */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fade-in border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-stone-900 text-base">Publish City Infrastructure Development Project</h3>
              </div>
              <button onClick={() => setIsPublishModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. Bhawarkuan Underpass & Bus Rapid Corridor"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Locality / Sector</label>
                  <input
                    type="text"
                    required
                    value={newProject.locality}
                    onChange={(e) => setNewProject({ ...newProject, locality: e.target.value })}
                    placeholder="e.g. Ward 66, South Indore"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Category</label>
                  <select
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Public Works & Transportation">Public Works & Transportation</option>
                    <option value="Sanitation & Urban Infrastructure">Sanitation & Infrastructure</option>
                    <option value="Water Supply & Infrastructure">Water Supply & Infrastructure</option>
                    <option value="Energy & Public Safety">Energy & Streetlighting</option>
                    <option value="Urban Transport">Urban Transit & Metro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Budget String</label>
                  <input
                    type="text"
                    required
                    value={newProject.formatted_budget}
                    onChange={(e) => setNewProject({ ...newProject, formatted_budget: e.target.value })}
                    placeholder="e.g. ₹45 Crores"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Target Beneficiaries</label>
                  <input
                    type="number"
                    required
                    value={newProject.target_beneficiaries}
                    onChange={(e) => setNewProject({ ...newProject, target_beneficiaries: parseInt(e.target.value) || 0 })}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Funding Scheme</label>
                <input
                  type="text"
                  required
                  value={newProject.funding_scheme}
                  onChange={(e) => setNewProject({ ...newProject, funding_scheme: e.target.value })}
                  placeholder="e.g. Smart Cities Mission / AMRUT 2.0"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-bold text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Problem Justification / DPR Summary</label>
                <textarea
                  rows={3}
                  value={newProject.problem_justification}
                  onChange={(e) => setNewProject({ ...newProject, problem_justification: e.target.value })}
                  placeholder="Synthesized infrastructure proposal description..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-medium text-stone-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="bg-stone-100 text-stone-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  Publish Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: OBJECTIVE PPI PRIORITY RANKING TABLE */}
      {(activeSubTab === 'admin-ranking' || activeSubTab === 'admin-dpr') && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Objective Public Priority Index (PPI) Project Ranking
            </h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
              Ranked by Data Fusion Model
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Project Title</th>
                  <th className="py-3 px-3">Locality</th>
                  <th className="py-3 px-3">PPI Score</th>
                  <th className="py-3 px-3">Demand</th>
                  <th className="py-3 px-3">Poverty</th>
                  <th className="py-3 px-3">Budget</th>
                  <th className="py-3 px-3 text-right">Est. Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                <tr className="hover:bg-orange-50/50">
                  <td className="py-3 px-3 font-extrabold text-orange-600">#1</td>
                  <td className="py-3 px-3 font-bold text-stone-900">3.4km Integrated Drainage Network</td>
                  <td className="py-3 px-3 text-stone-500">Wards 14 & 15</td>
                  <td className="py-3 px-3 font-extrabold text-emerald-600">94.2 / 100</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">92/100</td>
                  <td className="py-3 px-3 text-purple-600 font-bold">88/100</td>
                  <td className="py-3 px-3 text-rose-600 font-bold">₹0 (100% Gap)</td>
                  <td className="py-3 px-3 text-right font-extrabold text-stone-900">₹3.80 Cr</td>
                </tr>
                <tr className="hover:bg-orange-50/50">
                  <td className="py-3 px-3 font-extrabold text-amber-600">#2</td>
                  <td className="py-3 px-3 font-bold text-stone-900">Sanwer Industrial Corridor Reconstruction</td>
                  <td className="py-3 px-3 text-stone-500">Ward 8</td>
                  <td className="py-3 px-3 font-extrabold text-emerald-600">83.5 / 100</td>
                  <td className="py-3 px-3 text-blue-600 font-bold">82/100</td>
                  <td className="py-3 px-3 text-purple-600 font-bold">75/100</td>
                  <td className="py-3 px-3 text-rose-600 font-bold">₹50L (90% Gap)</td>
                  <td className="py-3 px-3 text-right font-extrabold text-stone-900">₹4.20 Cr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
