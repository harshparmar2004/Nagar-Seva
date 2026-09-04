import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { FolderCheck, Search, Building2, Landmark, User, Clock, CheckCircle2, AlertTriangle, Filter, MapPin, ExternalLink, ShieldCheck, Plus, Sparkles } from 'lucide-react';

export default function MyComplaintsView({ currentUser, onSelectComplaintForTracking, onNavigateToCreate }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const activeEmail = currentUser?.email || 'citizen.indore@gmail.com';

  useEffect(() => {
    fetchUserComplaints();
  }, [activeEmail]);

  const fetchUserComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints/user/${activeEmail}`);
      const data = await res.json();
      let local = [];
      try { local = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]'); } catch(e) {}
      const combined = [...local, ...(Array.isArray(data) ? data : [])];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      setComplaints(unique);
    } catch (e) {
      console.warn("Backend offline/sleeping, using local & sample complaints:", e);
      let local = [];
      try { local = JSON.parse(localStorage.getItem('nagarmitra_local_complaints') || '[]'); } catch(err) {}
      const fallbackList = [
        ...local,
        {
          id: 'NM-IND-2026-04821',
          transcript: 'Bhaiyaji, humare ward 14 me paani ka nala beh raha hai, bacche bimar ho rahe hain, sadak poori toot gayi hai!',
          category: 'Sanitation & Drainage',
          urgency: 'Critical',
          health_impact: true,
          locality: 'Near Cat Road Square, Ward 14, Indore',
          landmark: 'Cat Road Square',
          responsible_department: 'Indore Municipal Corporation (IMC) — Drainage & Sewerage Department',
          responsible_ministry: 'Ministry of Housing & Urban Affairs (MoHUA)',
          nodal_officer: 'Er. Rajesh Sharma (Chief Engineer)',
          current_status: 'APPROVED_BY_ADMIN',
          created_at: '2026-08-25T20:30:00Z'
        }
      ];
      setComplaints(fallbackList);
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
            <h2 className="text-2xl font-extrabold text-stone-900">My Registered Complaints & Sector Status</h2>
            <p className="text-xs text-stone-500">
              Showing complaints registered by: <span className="font-extrabold text-stone-900">{activeEmail}</span>
            </p>
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
                      <User className="w-3.5 h-3.5 text-emerald-600" /> Designated Nodal Officer
                    </span>
                    <p className="font-extrabold text-stone-900 text-xs">
                      {c.nodal_officer || 'Er. Rajesh Sharma (Chief Engineer)'}
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
