import React, { useState, useEffect } from 'react';
import {
  Trophy, CheckCircle2, Truck, Droplets, Zap, Activity, Award, Shield,
  Heart, Sparkles, MapPin, Compass, AlertCircle, Clock, CheckCheck, Loader2,
  Filter, Building2, UserCheck, Flame, ExternalLink, RefreshCw, Layers
} from 'lucide-react';

export default function WardSanitationScorecardView({ currentUser, isSuperAdmin }) {
  const [wardsList, setWardsList] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('ward_52');
  const [liveGpsWardId, setLiveGpsWardId] = useState('ward_52');
  const [liveGpsLabel, setLiveGpsLabel] = useState('Detecting GPS...');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resolvingId, setResolvingId] = useState(null);
  const [adminActionMsg, setAdminActionMsg] = useState(null);
  const [citizenPoints, setCitizenPoints] = useState(450);
  const [claimedBadge, setClaimedBadge] = useState(false);

  // 1. Fetch Wards List & Live Geolocation
  useEffect(() => {
    fetchWardsList();
    detectLiveGpsLocation();
  }, []);

  // 2. Fetch Analytics when selected Ward changes
  useEffect(() => {
    if (selectedWardId) {
      fetchWardAnalytics(selectedWardId);
    }
  }, [selectedWardId]);

  const fetchWardsList = async () => {
    try {
      const res = await fetch('https://nagarmitra-backend.onrender.com/api/wards');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setWardsList(data);
      }
    } catch (e) {
      console.error('Error fetching wards list:', e);
    }
  };

  const detectLiveGpsLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(`https://nagarmitra-backend.onrender.com/api/geotag/resolve?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            if (data && data.ward_id) {
              setLiveGpsWardId(data.ward_id);
              setSelectedWardId(data.ward_id);
              const locName = data.address ? data.address.split(',')[0] : 'Indore Sector';
              setLiveGpsLabel(`ðŸ“ Live GPS: ${locName} (Ward ${data.ward_number})`);
            }
          } catch (e) {
            setLiveGpsLabel('ðŸ“ GPS: Ward 52 (Musakhedi Sector)');
          }
        },
        () => {
          setLiveGpsLabel('ðŸ“ GPS: Ward 52 (Musakhedi Sector)');
        },
        { timeout: 8000 }
      );
    } else {
      setLiveGpsLabel('ðŸ“ GPS: Ward 52 (Musakhedi Sector)');
    }
  };

  const fetchWardAnalytics = async (wardId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nagarmitra-backend.onrender.com/api/wards/${wardId}/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error('Error fetching ward analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminResolve = async (complaintId) => {
    setResolvingId(complaintId);
    try {
      const res = await fetch(`https://nagarmitra-backend.onrender.com/api/complaints/resolve/${complaintId}`, {
        method: 'POST'
      });
      const data = await res.json();
      setAdminActionMsg(`âœ… Complaint #${complaintId} marked as RESOLVED & notification sent to citizen!`);
      setTimeout(() => setAdminActionMsg(null), 5000);
      
      // Refresh analytics to show updated status
      fetchWardAnalytics(selectedWardId);
    } catch (e) {
      console.error(e);
      alert('Error updating complaint status');
    } finally {
      setResolvingId(null);
    }
  };

  const filteredComplaints = analytics?.complaints?.filter(c => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'RESOLVED') return c.current_status === 'RESOLVED' || c.current_status === 'APPROVED_BY_ADMIN';
    if (statusFilter === 'PENDING') return c.current_status === 'PENDING_ADMIN_REVIEW';
    if (statusFilter === 'IN_PROGRESS') return c.current_status === 'IN_PROGRESS';
    return true;
  }) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* HEADER BANNER WITH DYNAMIC WARD SELECTOR */}
      <div className="bg-[#FAF6F0] border border-[#E8DFC8] rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden space-y-5 text-stone-900">
        
        {/* Top bar: Badge & Ward Selector + GPS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 border border-orange-200 px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide">
              <Trophy className="w-3.5 h-3.5 text-orange-600" />
              <span>SWACHH SURVEKSHAN #1 INDORE PUBLIC TRACKER</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-tight tracking-tight">
              {analytics?.ward_name || 'Indore Municipal Ward Tracker'}
            </h2>
          </div>

          {/* Ward Select & Live GPS Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedWardId(liveGpsWardId);
                detectLiveGpsLocation();
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Locate My Ward via GPS"
            >
              <Compass className="w-4 h-4 text-emerald-600 animate-spin" style={{ animationDuration: '8s' }} />
              <span>{liveGpsLabel}</span>
            </button>

            <select
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              className="bg-stone-50 hover:bg-stone-100 text-stone-900 text-xs font-extrabold px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-xs"
            >
              {wardsList.length > 0 ? (
                wardsList.map((w) => (
                  <option key={w.id} value={w.id} className="bg-white text-stone-900">
                    {w.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="ward_52" className="bg-white text-stone-900">Ward 52 â€” Musakhedi, Mayur Nagar & Ring Road</option>
                  <option value="ward_14" className="bg-white text-stone-900">Ward 14 â€” Rajendra Nagar & Cat Road Corridor</option>
                  <option value="ward_40" className="bg-white text-stone-900">Ward 40 â€” Khajrana Main Sector</option>
                  <option value="ward_27" className="bg-white text-stone-900">Ward 27 â€” Vijay Nagar Sector A-C</option>
                  <option value="ward_1" className="bg-white text-stone-900">Ward 1 â€” Sirpur & Kalani Nagar</option>
                </>
              )}
            </select>
          </div>

        </div>

        {/* Structured Metadata Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E8DFC8]">
          <div className="bg-white/80 border border-[#E4DAC6] rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
            <span className="text-stone-500 text-xs font-bold">Administrative Zone</span>
            <span className="text-stone-900 text-xs font-extrabold">{analytics?.zone || 'Zone 14'}</span>
          </div>
          <div className="bg-white/80 border border-[#E4DAC6] rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
            <span className="text-stone-500 text-xs font-bold">Ward Population</span>
            <span className="text-stone-900 text-xs font-extrabold">{analytics?.population?.toLocaleString() || '46,200'}</span>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-4 py-3 flex items-center justify-between shadow-xs">
            <span className="text-emerald-800 text-xs font-bold">Resolution Efficiency</span>
            <span className="text-emerald-700 text-xs font-black">{analytics?.resolution_rate_pct || 94.5}% Solved</span>
          </div>
        </div>
      </div>

      {/* ADMIN NOTIFICATION TOAST */}
      {adminActionMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 text-xs font-extrabold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{adminActionMsg}</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">WhatsApp Sent</span>
        </div>
      )}

      {/* 4 STAT CARDS: TOTAL COMPLAINTS, SOLVED, PENDING, IN PROGRESS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Total Filed */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-stone-500" /> Total Ward Complaints
          </span>
          <p className="text-2xl font-extrabold text-stone-900">
            {loading ? '...' : analytics?.total_complaints || 0}
          </p>
          <p className="text-[10px] text-stone-500 font-semibold">Registered in this ward</p>
        </div>

        {/* Solved / Resolved */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Solved & Approved
          </span>
          <p className="text-2xl font-extrabold text-emerald-900">
            {loading ? '...' : analytics?.resolved_complaints || 0}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold">
            {analytics?.resolution_rate_pct || 0}% Resolution Rate
          </p>
        </div>

        {/* Pending Administrative Review */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
          </span>
          <p className="text-2xl font-extrabold text-amber-900">
            {loading ? '...' : analytics?.pending_complaints || 0}
          </p>
          <p className="text-[10px] text-amber-700 font-semibold">Awaiting secretariat review</p>
        </div>

        {/* In Progress */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-600" /> Work In Progress
          </span>
          <p className="text-2xl font-extrabold text-blue-900">
            {loading ? '...' : analytics?.in_progress_complaints || 0}
          </p>
          <p className="text-[10px] text-blue-700 font-semibold">On-ground crew dispatched</p>
        </div>

      </div>

      {/* SWACHHATA GARBAGE COLLECTION VAN TRACKER & METRICS */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Truck className="w-4 h-4 text-emerald-600" /> Live Door-to-Door Garbage Van Tracker
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
            GPS LIVE ACTIVE
          </span>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-stone-900 text-sm">
                Garbage Collection Van #{selectedWardId.toUpperCase()} Route Completed at 09:15 AM
              </p>
              <p className="text-stone-500 font-medium text-[11px]">Assigned Driver: Mohan Lal (IMC Sanitation Crew)</p>
            </div>
          </div>

          <span className="bg-white border border-stone-300 font-bold text-stone-700 text-[11px] px-3 py-1.5 rounded-xl shrink-0">
            Next Pickup: Tomorrow 07:30 AM
          </span>
        </div>
      </div>

      {/* PUBLIC TRANSPARENCY: COMPLAINTS LIST IN THIS WARD */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
              <span>Public Complaint Transparency Desk</span>
            </h3>
            <p className="text-xs text-stone-500">
              Real-time public feed of all registered grievances in {analytics?.ward_name || selectedWardId}.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({analytics?.total_complaints || 0})
            </button>
            <button
              onClick={() => setStatusFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'RESOLVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Solved ({analytics?.resolved_complaints || 0})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pending ({analytics?.pending_complaints || 0})
            </button>
          </div>
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs text-stone-500 font-bold">Loading public ward complaints...</p>
          </div>
        ) : filteredComplaints.length > 0 ? (
          <div className="space-y-3">
            {filteredComplaints.map((comp) => {
              const isResolved = comp.current_status === 'RESOLVED' || comp.current_status === 'APPROVED_BY_ADMIN';
              const isPending = comp.current_status === 'PENDING_ADMIN_REVIEW';

              return (
                <div
                  key={comp.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isResolved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isPending
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-stone-800">#{comp.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                        {comp.category}
                      </span>
                      <span className="text-[10px] text-stone-400 font-medium">
                        {comp.locality}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 font-medium leading-snug">
                      "{comp.transcript}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Status Pill */}
                    {isResolved ? (
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Solved
                      </span>
                    ) : isPending ? (
                      <span className="bg-amber-100 text-amber-800 font-extrabold text-xs px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-3 py-1 rounded-xl border border-blue-200 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-blue-600" /> In Progress
                      </span>
                    )}

                    {/* SUPER ADMIN RESOLVE BUTTON */}
                    {!isResolved && (
                      <button
                        onClick={() => handleAdminResolve(comp.id)}
                        disabled={resolvingId === comp.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        title="Super Admin: Mark this complaint solved"
                      >
                        {resolvingId === comp.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Mark Solved</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-stone-500 text-xs font-bold">
            No complaints found for status filter "{statusFilter}" in this ward.
          </div>
        )}

      </div>

      {/* GAMIFIED REWARDS SECTION */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-500" /> Citizen Swachhata Hero Gamified Rewards
            </div>
            <h3 className="text-xl font-extrabold text-stone-900">Your Citizen Civic Score & Badges</h3>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl flex items-center space-x-2 text-xs shrink-0">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="font-extrabold text-stone-900">Civic Points: <span className="text-amber-700 text-sm">{citizenPoints} Points</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-stone-900 text-sm">Indore Swachhata Champion</h4>
            <p className="text-stone-500 text-[11px] font-medium">Earned by registering verified civic complaints & upvoting ward projects.</p>
            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
              UNLOCKED âœ“
            </span>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-stone-900 text-sm">Ward Vigilant Resident</h4>
            <p className="text-stone-500 text-[11px] font-medium">Earned by endorsing neighborhood complaints with co-filer status.</p>
            <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
              UNLOCKED âœ“
            </span>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Heart className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-stone-900 text-sm">Zero-Waste Advocate</h4>
            <p className="text-stone-500 text-[11px] font-medium">Unlocked upon verifying 100% waste segregation at doorstep.</p>
            {!claimedBadge ? (
              <button
                onClick={() => {
                  setCitizenPoints(prev => prev + 100);
                  setClaimedBadge(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-lg transition-all cursor-pointer"
              >
                Claim Badge (+100 Pts)
              </button>
            ) : (
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                CLAIMED âœ“ (+100 Pts)
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
