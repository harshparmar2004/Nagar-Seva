import { API_BASE_URL } from '../config';
import { getFirestoreUserComplaints } from '../lib/firebase';
import React, { useState, useEffect } from 'react';
import { FolderCheck, Search, Building2, Landmark, User, Clock, CheckCircle2, AlertTriangle, Filter, MapPin, ExternalLink, ShieldCheck, Plus, Sparkles } from 'lucide-react';

export default function MyComplaintsView({ currentUser, onSelectComplaintForTracking, onNavigateToCreate }) {
  const activeEmail = (currentUser?.email || 'citizen.indore@gmail.com').toLowerCase().trim();

  // Instant local cache load (0ms) so user never sees an endless spinner
  const [complaints, setComplaints] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      return local.filter(item => !item.user_email || item.user_email.toLowerCase() === activeEmail);
    } catch (e) {
      return [];
    }
  });

  const [loading, setLoading] = useState(complaints.length === 0);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUserComplaints();
  }, [activeEmail]);

  const fetchUserComplaints = async () => {
    const cleanEmail = activeEmail.toLowerCase().trim();

    // 1. Instantly populate from localStorage if available
    let userLocal = [];
    try {
      const local = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
      userLocal = local.filter(item => !item.user_email || item.user_email.toLowerCase() === cleanEmail);
      if (userLocal.length > 0) {
        setComplaints(userLocal);
        setLoading(false);
      }
    } catch (e) {}

    // 2. Fetch Firestore and Backend in parallel with strict 2.5-second timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const [backendPromise, firestorePromise] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/complaints/user/${cleanEmail}`, { signal: controller.signal })
          .then(r => r.ok ? r.json() : [])
          .catch(() => []),
        getFirestoreUserComplaints(cleanEmail)
      ]);
      clearTimeout(timeoutId);

      const backendData = backendPromise.status === 'fulfilled' && Array.isArray(backendPromise.value) ? backendPromise.value : [];
      const firestoreData = firestorePromise.status === 'fulfilled' && Array.isArray(firestorePromise.value) ? firestorePromise.value : [];

      let freshLocal = [];
      try {
        const stored = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]');
        freshLocal = stored.filter(item => !item.user_email || item.user_email.toLowerCase() === cleanEmail);
      } catch (err) {}

      const combined = [...freshLocal, ...firestoreData, ...backendData];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      
      unique.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setComplaints(unique);
    } catch (e) {
      console.warn("Background complaints fetch note:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesCategory = filterCategory === 'ALL' || c.category === filterCategory;
    const matchesSearch = !searchQuery.trim() || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.locality.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <FolderCheck className="w-4 h-4" /> Personal Citizen Dashboard
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900">My Registered Complaints & History</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-600">
              <span>Citizen: <strong className="text-stone-900">{currentUser?.displayName || 'Verified Citizen'}</strong></span>
              <span>•</span>
              <span>Email: <strong className="text-stone-900">{activeEmail}</strong></span>
              {currentUser?.aadhaar && (
                <>
                  <span>•</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    ✓ Aadhaar: XXXX-XXXX-{currentUser.aadhaar.slice(-4)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onNavigateToCreate}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Request</span>
            </button>
            <button
              onClick={fetchUserComplaints}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        {complaints.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search my registered complaints by ID, keyword, or landmark..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold text-stone-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-stone-400 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories ({complaints.length})</option>
                <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                <option value="Electricity & Streetlights">Electricity & Streetlights</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-3 animate-pulse">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600">Retrieving your verified complaints for {activeEmail}...</p>
        </div>
      )}

      {/* Empty State for user with 0 complaints */}
      {!loading && complaints.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center space-y-4 shadow-sm animate-fade-in max-w-lg mx-auto">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600">
            <FolderCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-stone-900">No Complaints Registered Yet</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            You haven't submitted any complaints under <span className="font-bold text-stone-800">{activeEmail}</span>. Use the 4-step wizard to report any infrastructure issue in your Indore ward.
          </p>
          <button
            onClick={onNavigateToCreate}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md shadow-orange-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Submit Your First Verified Complaint
          </button>
        </div>
      )}

      {/* Complaint List */}
      {!loading && filteredComplaints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-bold text-stone-500">
            <span>Showing {filteredComplaints.length} Registered Complaints for {activeEmail}</span>
            <span>Live Sector Approval Status</span>
          </div>

          {filteredComplaints.map((c) => {
            const isApproved = c.current_status === 'APPROVED_BY_ADMIN' || c.current_status === 'DEPARTMENT_ASSIGNED';

            return (
              <div
                key={c.id}
                className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-sm space-y-4 hover:border-orange-300 transition-all"
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-extrabold text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200">
                      {c.id}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                      {c.category}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      c.urgency === 'Critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {c.urgency} Urgency
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isApproved ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ACCEPTED BY AUTHORITIES
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        AWAITING SUPER ADMIN REVIEW
                      </span>
                    )}
                  </div>
                </div>

                {/* Complaint Text & Location */}
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-stone-900 leading-snug">"{c.transcript}"</h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{c.locality}</span>
                  </p>
                </div>

                {/* Department & Ministry Routing Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-orange-600" /> Assigned Department
                    </span>
                    <p className="font-extrabold text-stone-900 text-xs">
                      {c.responsible_department || 'Indore Municipal Corporation (IMC)'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-blue-600" /> Parent Ministry
                    </span>
                    <p className="font-extrabold text-stone-900 text-xs">
                      {c.responsible_ministry || 'Ministry of Housing & Urban Affairs'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Ward Jurisdiction
                    </span>
                    <p className="font-extrabold text-stone-900 text-xs">
                      {c.locality || `Ward ${c.ward_id || '52'}`}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-stone-400 font-medium">Filed on: {new Date(c.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => onSelectComplaintForTracking && onSelectComplaintForTracking(c.id)}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <span>Track Full Lifecycle Progress</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
