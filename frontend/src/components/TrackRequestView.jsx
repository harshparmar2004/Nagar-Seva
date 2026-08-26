import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, CheckCircle2, Clock, MapPin, Sparkles, FileText, ArrowRight,
  ShieldCheck, Building2, User, Landmark, Filter, Tag, Flame, Layers,
  TrendingUp, Users, FileCheck, Check, Volume2, ThumbsUp, XCircle,
  AlertTriangle, BarChart3, Globe, Hash, CalendarDays, Camera, Navigation,
  ChevronDown, ChevronUp, ExternalLink, Copy, CheckCheck, Loader2, Info,
  CircleDot, CircleCheck, CircleDashed, Timer, Megaphone
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING_ADMIN_REVIEW: {
    label: 'Pending Administrative Review',
    color: 'amber',
    bgClass: 'bg-amber-50 border-amber-200',
    textClass: 'text-amber-800',
    badgeBg: 'bg-amber-100',
    icon: Clock,
    progressPct: 20,
  },
  APPROVED_BY_ADMIN: {
    label: 'Approved By Administration',
    color: 'blue',
    bgClass: 'bg-blue-50 border-blue-200',
    textClass: 'text-blue-800',
    badgeBg: 'bg-blue-100',
    icon: CheckCircle2,
    progressPct: 50,
  },
  IN_PROGRESS: {
    label: 'Work In Progress',
    color: 'indigo',
    bgClass: 'bg-indigo-50 border-indigo-200',
    textClass: 'text-indigo-800',
    badgeBg: 'bg-indigo-100',
    icon: Loader2,
    progressPct: 75,
  },
  RESOLVED: {
    label: 'Resolved & Completed',
    color: 'emerald',
    bgClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-800',
    badgeBg: 'bg-emerald-100',
    icon: CheckCheck,
    progressPct: 100,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'red',
    bgClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-800',
    badgeBg: 'bg-red-100',
    icon: XCircle,
    progressPct: 0,
  },
};

const STEP_ICON_MAP = {
  COMPLETED: { icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-600', ring: 'ring-emerald-100' },
  IN_PROGRESS: { icon: CircleDot, color: 'text-blue-600', bg: 'bg-blue-600', ring: 'ring-blue-100' },
  PENDING: { icon: CircleDashed, color: 'text-stone-400', bg: 'bg-stone-300', ring: 'ring-stone-100' },
};

export default function TrackRequestView({ initialTrackingId, currentUser }) {
  const [searchId, setSearchId] = useState(initialTrackingId || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasEndorsed, setHasEndorsed] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showOtherWards, setShowOtherWards] = useState(false);
  const [selectedDept, setSelectedDept] = useState('ALL');

  const fetchTracking = useCallback(async (idToFetch) => {
    if (!idToFetch || !idToFetch.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setTrackingData(null);
    setHasEndorsed(false);
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/track/${idToFetch.trim()}`);
      const data = await res.json();
      if (data.found === false) {
        setErrorMsg(data.message || 'No complaint found with this token.');
        setTrackingData(null);
      } else {
        setTrackingData(data);
        setErrorMsg('');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Could not connect to NagarSeva servers. Please check your connection and try again.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialTrackingId && initialTrackingId.trim()) {
      setSearchId(initialTrackingId);
      fetchTracking(initialTrackingId);
    }
  }, [initialTrackingId, fetchTracking]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracking(searchId);
  };

  const handleSpeakStatus = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleEndorse = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/endorse/${searchId}`, { method: 'POST' });
      await res.json();
    } catch (e) { /* ignore */ }
    setHasEndorsed(true);
    setTrackingData(prev => ({
      ...prev,
      same_category_same_ward_count: (prev?.same_category_same_ward_count || 0) + 1,
    }));
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(searchId);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const sampleTokens = ['NM-IND-2026-00001', 'NM-IND-2026-00050', 'NM-IND-2026-00100', 'NM-IND-2026-00200'];

  const st = trackingData ? STATUS_CONFIG[trackingData.complaint_status] || STATUS_CONFIG.PENDING_ADMIN_REVIEW : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: TOKEN SEARCH BAR                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
            <Search className="w-4 h-4" /> Universal Public Grievance Tracking & Cluster Inspector
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900">Track Any Complaint Token</h2>
          <p className="text-xs text-stone-500 max-w-2xl">
            Enter your official Grievance Token ID to see real-time status, which department is handling it, how many
            similar complaints exist in your ward and across the city, and the full government resolution timeline.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Token ID (e.g. NM-IND-2026-00001)"
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-sm font-bold text-stone-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-2xl px-3 py-3 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="Drainage">Drainage & Sewerage</option>
              <option value="Electricity">Electricity & DISCOM</option>
              <option value="Public Works">Roads & Public Works</option>
              <option value="Solid Waste">Solid Waste & Sanitation</option>
              <option value="Health">Public Health</option>
              <option value="Traffic">Traffic & Transport</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-stone-300 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Track Token'}
          </button>
        </form>

        {/* Sample tokens */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
          <span className="font-bold text-stone-400">Try sample tokens:</span>
          {sampleTokens.map((t) => (
            <button
              key={t}
              onClick={() => { setSearchId(t); fetchTracking(t); }}
              className="font-mono bg-stone-100 hover:bg-orange-100 text-stone-700 hover:text-orange-700 px-2.5 py-1 rounded-lg border border-stone-200 transition-all cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* ERROR STATE: Token not found                                   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {errorMsg && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-red-900">Token Not Found</h3>
            <p className="text-sm text-red-700">{errorMsg}</p>
            <p className="text-xs text-red-500 mt-2">
              Searched for: <span className="font-mono font-bold">{searchId}</span>.
              Double-check your token ID or try one of the sample tokens above.
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* LOADING STATE                                                  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
          <p className="text-sm font-bold text-stone-600">Querying municipal databases for token <span className="font-mono text-orange-700">{searchId}</span>...</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* RESULTS: Full complaint tracking data                          */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {trackingData && trackingData.found && (
        <div className="space-y-6">

          {/* ── CARD A: Status Header + Progress Bar ────────────────── */}
          <div className={`border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 ${st.bgClass}`}>
            {/* Token + Status Badge Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Official Grievance Token</span>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-stone-900 font-mono">#{trackingData.complaint?.id}</h3>
                  <button
                    onClick={handleCopyToken}
                    className="p-1.5 rounded-lg bg-white/70 hover:bg-white border border-stone-200 transition-all"
                    title="Copy Token ID"
                  >
                    {copiedToken ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const c = trackingData.complaint;
                    const ward = trackingData.ward_name || 'अज्ञात';
                    handleSpeakStatus(
                      `शिकायत टोकन ${c?.id} की स्थिति: ${trackingData.status_label}। ` +
                      `श्रेणी: ${trackingData.complaint_category}। ` +
                      `वॉर्ड: ${ward}। ` +
                      `इस वॉर्ड में इसी प्रकार की ${trackingData.same_category_same_ward_count} शिकायतें दर्ज हैं। ` +
                      `पूरे शहर में कुल ${trackingData.same_category_city_count} शिकायतें इसी श्रेणी में हैं। ` +
                      `प्रभावित नागरिक: ${trackingData.affected_citizens}।`
                    );
                  }}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-orange-600" />
                  <span>Listen (बोलकर सुनें)</span>
                </button>

                <span className={`${st.badgeBg} ${st.textClass} text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-current/20 flex items-center gap-1.5`}>
                  <st.icon className={`w-4 h-4 ${st.textClass} ${st.color === 'indigo' ? 'animate-spin' : ''}`} style={st.color === 'indigo' ? { animationDuration: '3s' } : {}} />
                  {trackingData.status_label}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                <span>Resolution Progress</span>
                <span>{st.progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden border border-white/30">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    st.color === 'emerald' ? 'bg-emerald-500' :
                    st.color === 'blue' ? 'bg-blue-500' :
                    st.color === 'indigo' ? 'bg-indigo-500' :
                    st.color === 'amber' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${st.progressPct}%` }}
                />
              </div>
            </div>

            {/* Complaint Transcript */}
            <div className="bg-white/60 rounded-2xl p-4 border border-white/40 space-y-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Original Complaint (Transcript)</span>
              <p className="text-sm text-stone-800 font-medium leading-relaxed italic">
                "{trackingData.complaint?.transcript}"
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-500 font-semibold">
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(trackingData.registered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-orange-500" /> {trackingData.complaint_category}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {trackingData.locality}</span>
                {trackingData.landmark && <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-blue-500" /> {trackingData.landmark}</span>}
              </div>
            </div>

            {/* Photo evidence if exists */}
            {trackingData.photo_url && trackingData.photo_url !== 'null' && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Attached Photo Evidence
                </span>
                <img
                  src={trackingData.photo_url}
                  alt="Complaint evidence"
                  className="w-full max-h-52 object-cover rounded-2xl border border-white/40"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* ── CARD B: Statistics Grid ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Same category, Same ward */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Same Issue in This Ward
              </span>
              <p className="text-2xl font-extrabold text-stone-900">{trackingData.same_category_same_ward_count}</p>
              <p className="text-[10px] text-stone-500 font-semibold">
                {trackingData.complaint_category} complaints in {trackingData.ward_name?.split('—')[0]?.trim()}
              </p>
            </div>

            {/* Same category, all wards */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Same Issue City-Wide
              </span>
              <p className="text-2xl font-extrabold text-stone-900">{trackingData.same_category_city_count}</p>
              <p className="text-[10px] text-stone-500 font-semibold">
                {trackingData.complaint_category} across all wards
              </p>
            </div>

            {/* All complaints in this ward */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" /> Total Ward Complaints
              </span>
              <p className="text-2xl font-extrabold text-stone-900">{trackingData.same_ward_total_count}</p>
              <p className="text-[10px] text-stone-500 font-semibold">
                All categories in {trackingData.ward_name?.split('—')[0]?.trim()}
              </p>
            </div>

            {/* Total city complaints */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <Megaphone className="w-3.5 h-3.5" /> Total City Complaints
              </span>
              <p className="text-2xl font-extrabold text-stone-900">{trackingData.city_total_count}</p>
              <p className="text-[10px] text-stone-500 font-semibold">Registered across Indore</p>
            </div>
          </div>

          {/* ── CARD C: Ward + Department + Officer details ──────────── */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-orange-600" /> Administrative Routing & Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Ward */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" /> Ward
                </span>
                <p className="font-extrabold text-stone-900 text-xs">{trackingData.ward_name}</p>
                {trackingData.ward?.zone && (
                  <p className="text-[10px] text-stone-500">{trackingData.ward.zone}</p>
                )}
              </div>

              {/* Department */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-500" /> Department
                </span>
                <p className="font-extrabold text-stone-900 text-xs">{trackingData.responsible_department}</p>
              </div>

              {/* Ministry */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-purple-500" /> Ministry
                </span>
                <p className="font-extrabold text-stone-900 text-xs">{trackingData.responsible_ministry}</p>
              </div>

              {/* Officer */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-500" /> Nodal Officer
                </span>
                <p className="font-extrabold text-stone-900 text-xs">{trackingData.nodal_officer}</p>
              </div>
            </div>

            {/* Affected population & Endorse */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-500">Affected Ward Population</p>
                  <p className="text-lg font-extrabold text-stone-900">{trackingData.affected_citizens?.toLocaleString('en-IN')} Residents</p>
                </div>
              </div>

              {!hasEndorsed ? (
                <button
                  onClick={handleEndorse}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <ThumbsUp className="w-4 h-4" /> +1 Endorse This Complaint
                </button>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200">
                  <CheckCheck className="w-4 h-4" /> You Endorsed This
                </span>
              )}
            </div>
          </div>

          {/* ── CARD D: Other Wards With Same Issue ──────────────────── */}
          {trackingData.other_wards_with_same_issue && trackingData.other_wards_with_same_issue.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
              <button
                onClick={() => setShowOtherWards(!showOtherWards)}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-purple-600" />
                  <span>Same Issue in {trackingData.other_wards_with_same_issue.length} Other Wards</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {trackingData.complaint_category}
                  </span>
                </h3>
                {showOtherWards ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
              </button>

              {showOtherWards && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
                  {trackingData.other_wards_with_same_issue.map((w) => (
                    <div key={w.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5">
                      <div>
                        <p className="text-xs font-bold text-stone-800">{w.name?.split('—')[0]?.trim()}</p>
                        <p className="text-[10px] text-stone-500">{w.name?.split('—')[1]?.trim() || ''}</p>
                      </div>
                      <span className="bg-orange-100 text-orange-800 text-[11px] font-extrabold px-2 py-0.5 rounded-lg">
                        {w.count} complaints
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CARD E: Cluster & Project Info ───────────────────────── */}
          {(trackingData.cluster || trackingData.project) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {trackingData.cluster && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Linked Demand Cluster
                  </span>
                  <h4 className="text-sm font-extrabold text-stone-900">{trackingData.cluster.label}</h4>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-white/70 text-stone-700 font-bold px-2 py-0.5 rounded-lg border border-orange-200">
                      ID: {trackingData.cluster.id}
                    </span>
                    <span className="bg-white/70 text-stone-700 font-bold px-2 py-0.5 rounded-lg border border-orange-200">
                      PPI Score: {trackingData.cluster.ppi_score}
                    </span>
                    <span className="bg-white/70 text-stone-700 font-bold px-2 py-0.5 rounded-lg border border-orange-200">
                      {trackingData.cluster.complaint_count} complaints merged
                    </span>
                  </div>
                </div>
              )}

              {trackingData.project && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" /> Linked Development Project
                  </span>
                  <h4 className="text-sm font-extrabold text-stone-900">{trackingData.project.title}</h4>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="bg-white/70 text-stone-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                      ID: {trackingData.project.id}
                    </span>
                    <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-lg">
                      Budget: {trackingData.project.formatted_budget}
                    </span>
                    <span className="bg-white/70 text-stone-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                      {trackingData.project.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CARD F: Government Resolution Timeline ───────────────── */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" /> Official Resolution Timeline
            </h3>

            <div className="relative pl-8 space-y-0">
              {trackingData.timeline?.map((item, idx) => {
                const isLast = idx === trackingData.timeline.length - 1;
                const stepCfg = STEP_ICON_MAP[item.status] || STEP_ICON_MAP.PENDING;
                const StepIcon = stepCfg.icon;

                return (
                  <div key={item.step} className="relative pb-8">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <div className={`absolute left-[-18px] top-8 w-0.5 h-full ${item.status === 'COMPLETED' ? 'bg-emerald-300' : 'bg-stone-200'}`} />
                    )}

                    {/* Step circle */}
                    <div className={`absolute -left-[26px] top-0.5 w-7 h-7 rounded-full ${stepCfg.bg} text-white flex items-center justify-center ring-4 ${stepCfg.ring} shadow-sm`}>
                      {item.status === 'COMPLETED'
                        ? <Check className="w-4 h-4" />
                        : item.status === 'IN_PROGRESS'
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <span className="text-[11px] font-bold">{item.step}</span>
                      }
                    </div>

                    {/* Step content card */}
                    <div className={`ml-4 rounded-2xl p-4 border space-y-1.5 ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : item.status === 'IN_PROGRESS'
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-stone-50/50 border-stone-200'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-extrabold text-stone-900">{item.title}</h4>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}>
                          {item.status === 'COMPLETED' ? '✓ COMPLETED' : item.status === 'IN_PROGRESS' ? '⟳ IN PROGRESS' : '○ PENDING'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 font-medium leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CARD G: Citizen Info Footer ──────────────────────────── */}
          <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-stone-600" />
                </div>
                <div>
                  <p className="font-bold text-stone-500">Filed By</p>
                  <p className="font-extrabold text-stone-800">{trackingData.citizen_name || 'Anonymous Citizen'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-stone-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> {trackingData.complaint?.id}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> {new Date(trackingData.registered_at).toLocaleString('en-IN')}
                </span>
                <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-lg border border-orange-200">
                  {trackingData.complaint?.verification_status || 'VERIFIED'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
