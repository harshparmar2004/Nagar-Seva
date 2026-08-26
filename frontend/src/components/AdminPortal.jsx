import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Layers, AlertOctagon, Sparkles, FileText, Flame, Trophy, ShieldCheck, Lock, Building2, User, Landmark, Filter, Search, CheckCircle2, RefreshCw, SlidersHorizontal, Eye, Clock, Check, Camera, Image, X } from 'lucide-react';

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color}; cursor: pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export default function AdminPortal({ activeSubTab, onOpenDPR, activeCountry, isSuperAdmin, onOpenAuth }) {
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectPhotoModal, setInspectPhotoModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const compRes = await fetch('http://localhost:8000/api/complaints');
      const compData = await compRes.json();
      setComplaints(compData);

      const clusRes = await fetch('http://localhost:8000/api/clusters');
      const clusData = await clusRes.json();
      setClusters(clusData);
      if (clusData.length > 0) setSelectedCluster(clusData[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveComplaint = async (complaintId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/approve/${complaintId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'APPROVED_BY_ADMIN' } : c));
      }
    } catch (e) {
      console.error(e);
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, current_status: 'APPROVED_BY_ADMIN' } : c));
    }
  };

  const getCategoryColor = (cat) => {
    if (cat?.includes('Sanitation')) return '#ef4444';
    if (cat?.includes('Roads')) return '#f97316';
    if (cat?.includes('Electricity')) return '#eab308';
    if (cat?.includes('Healthcare')) return '#10b981';
    return '#3b82f6';
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.citizen_name && c.citizen_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
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
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-600/20 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Sign In with Approved Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Governance Mismatch Alert Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border border-stone-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">Governance Mismatch Identified</span>
              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                CRITICAL PRIORITY #1
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Wards 14 & 15: High Citizen Demand (847 Requests) + High Poverty Index + ₹0 Municipal Budget Allocated
            </h2>
          </div>
        </div>

        <button
          onClick={() => onOpenDPR(selectedCluster)}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-orange-600/20 flex items-center space-x-2 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Project DPR</span>
        </button>
      </div>

      {/* VIEW SUB-TAB 1: INTERACTIVE GIS SPATIAL MAP */}
      {activeSubTab === 'admin-gis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* GIS Map Column (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-3xl p-4 space-y-3 shadow-sm flex flex-col h-[640px]">
            
            <div className="flex flex-wrap items-center justify-between gap-2 px-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-bold text-stone-900">GIS Spatial Demand Map — Indore IMC</h3>
              </div>
              
              <div className="flex items-center space-x-1.5 text-[11px] font-bold">
                <button onClick={() => setSelectedCategory('ALL')} className={`px-2.5 py-1 rounded-lg ${selectedCategory === 'ALL' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}>All</button>
                <button onClick={() => setSelectedCategory('Sanitation & Drainage')} className={`px-2.5 py-1 rounded-lg ${selectedCategory === 'Sanitation & Drainage' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}>Sanitation</button>
                <button onClick={() => setSelectedCategory('Roads & Infrastructure')} className={`px-2.5 py-1 rounded-lg ${selectedCategory === 'Roads & Infrastructure' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'}`}>Roads</button>
                <button onClick={() => setSelectedCategory('Electricity & Streetlights')} className={`px-2.5 py-1 rounded-lg ${selectedCategory === 'Electricity & Streetlights' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}>Electricity</button>
              </div>
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-stone-200 relative">
              <MapContainer
                center={[22.7000, 75.8350]}
                zoom={12}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <Circle
                  center={[22.6815, 75.8255]}
                  radius={1200}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }}
                />

                {filteredComplaints.map((c) => (
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
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Sidebar Data Fusion Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Composite Scorecard */}
            {selectedCluster && (
              <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Demand Cluster #{selectedCluster.id}</span>
                    <h3 className="text-base font-bold text-stone-900">{selectedCluster.label}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 font-medium">PPI Score</span>
                    <p className="text-2xl font-extrabold text-orange-600">{selectedCluster.ppi_score} <span className="text-xs font-normal text-stone-400">/ 100</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-semibold">Citizen Demand</span>
                    <p className="text-sm font-extrabold text-blue-600">{selectedCluster.demand_score} / 100</p>
                    <p className="text-[10px] text-stone-400">{selectedCluster.complaint_count} Requests</p>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-semibold">Census Poverty</span>
                    <p className="text-sm font-extrabold text-purple-600">{selectedCluster.poverty_score} / 100</p>
                    <p className="text-[10px] text-stone-400">MPI Poverty: 0.52</p>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-semibold">Infra Deficit</span>
                    <p className="text-sm font-extrabold text-amber-600">{selectedCluster.infra_gap_score} / 100</p>
                    <p className="text-[10px] text-stone-400">0 Drains in 3km</p>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1">
                    <span className="text-[11px] text-stone-500 font-semibold">Budget Deficit</span>
                    <p className="text-sm font-extrabold text-rose-600">{selectedCluster.budget_gap_score} / 100</p>
                    <p className="text-[10px] text-stone-400">₹0 Budget Allocated</p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenDPR(selectedCluster)}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Synthesize Detailed Project Report (DPR)
                </button>
              </div>
            )}

            {/* Clusters List */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" /> AI Demand Clusters (Grouped Hotspots)
              </h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {clusters.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCluster(c)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedCluster?.id === c.id
                        ? 'bg-orange-50 border-orange-300 shadow-sm'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">{c.label}</span>
                      <span className="text-xs font-extrabold text-orange-600">{c.ppi_score} PPI</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">{c.locality} • {c.complaint_count} Requests</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* VIEW SUB-TAB 2: MASTER CITIZEN COMPLAINTS MANAGEMENT & SUPER ADMIN APPROVAL TABLE */}
      {activeSubTab === 'admin-clusters' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-600" /> Master Complaints Review & Sector Approval Panel
              </h3>
              <p className="text-xs text-stone-500">Super Admins review attached geotagged evidence photos and approve complaints for ward publication</p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                {filteredComplaints.length} Total Complaints
              </span>
            </div>
          </div>

          {/* Search & Category Filters */}
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Sanitation & Drainage">Sanitation & Drainage</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Roads & Infrastructure">Roads & Infrastructure</option>
              <option value="Electricity & Streetlights">Electricity & Streetlights</option>
            </select>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Token ID</th>
                  <th className="py-3 px-3">Photo Evidence</th>
                  <th className="py-3 px-3">Citizen Gmail & Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Assigned Department</th>
                  <th className="py-3 px-3">Review Status</th>
                  <th className="py-3 px-3 text-right">Super Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredComplaints.map((c) => {
                  const isApproved = c.current_status === 'APPROVED_BY_ADMIN' || c.current_status === 'DEPARTMENT_ASSIGNED';
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
                        <p className="font-bold text-stone-900">{c.citizen_name || 'Harsh Parmar'}</p>
                        <p className="text-[10px] text-stone-400">{c.user_email || 'citizen.indore@gmail.com'}</p>
                      </td>
                      <td className="py-3 px-3 font-bold text-purple-700">{c.category}</td>
                      <td className="py-3 px-3">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          c.urgency === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-900 font-semibold">{c.responsible_department || 'IMC Drainage Dept'}</td>
                      <td className="py-3 px-3">
                        {isApproved ? (
                          <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                            APPROVED & PUBLISHED
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200">
                            PENDING REVIEW
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isApproved ? (
                          <button
                            onClick={() => handleApproveComplaint(c.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-sm transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve & Publish
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sector Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* INSPECT GEOTAGGED PHOTO EVIDENCE MODAL FOR SUPER ADMIN */}
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
                  <p>Resident: <span className="font-bold text-stone-900">{inspectPhotoModal.citizen_name || 'Harsh Parmar'}</span></p>
                  <p>Location: <span className="font-bold text-stone-900">{inspectPhotoModal.locality}</span></p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setInspectPhotoModal(null)}
                className="bg-stone-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm hover:bg-stone-800 transition-all"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SUB-TAB 3: PRIORITY RANKING TABLE */}
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
