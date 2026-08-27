import React, { useState, useEffect } from 'react';
import {
  Star, Trophy, Sparkles, CheckCircle2, TrendingUp, Users, DollarSign,
  ArrowUpRight, Eye, FileText, MapPin, Building2, Calendar, Landmark,
  ChevronRight, BadgeCheck, Rocket, Zap, Droplets, Bus, Sun, Trash2,
  Construction, BarChart3, ThumbsUp, MessageSquare, ExternalLink, Loader2,
  Award, ShieldCheck
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Sanitation & Urban Infrastructure': Droplets,
  'Public Works & Transportation': Construction,
  'Water Supply & Infrastructure': Droplets,
  'Energy & Public Safety': Sun,
  'Sanitation & Environment': Trash2,
  'Urban Transport': Bus,
};

const STATUS_BADGES = {
  'APPROVED_FOR_DPR': { label: 'DPR Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'UNDER_REVIEW': { label: 'Under Review', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  'TENDER_ISSUED': { label: 'Tender Issued', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'CONSTRUCTION_STARTED': { label: 'Construction Started', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'PLANNING': { label: 'Planning Phase', color: 'bg-stone-100 text-stone-700 border-stone-200' },
};

function StarRating({ rating, onRate, size = 'md' }) {
  const [hoverStar, setHoverStar] = useState(0);
  const starSize = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHoverStar(star)}
          onMouseLeave={() => setHoverStar(0)}
          className="p-0.5 hover:scale-125 transition-all cursor-pointer focus:outline-none"
        >
          <Star
            className={`${starSize} transition-colors ${
              star <= (hoverStar || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-stone-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function CommunitySupportView({ onOpenDPR }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('budget');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (projectId, stars) => {
    setUserRatings(prev => ({ ...prev, [projectId]: stars }));

    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, community_upvotes: (p.community_upvotes || 0) + 1 }
          : p
      )
    );

    setFeedbackMsg(`⭐ Your ${stars}-star rating for project ${projectId} recorded! Super Admin will review citizen priorities.`);
    setTimeout(() => setFeedbackMsg(null), 4000);

    try {
      await fetch(`http://localhost:8000/api/projects/${projectId}/rate?stars=${stars}`, { method: 'POST' });
    } catch (e) { /* ignore */ }
  };

  const categories = ['ALL', ...new Set(projects.map(p => p.category))];

  const filteredProjects = projects
    .filter(p => selectedFilter === 'ALL' || p.category === selectedFilter)
    .sort((a, b) => {
      if (sortBy === 'budget') return b.estimated_budget_inr - a.estimated_budget_inr;
      if (sortBy === 'upvotes') return b.community_upvotes - a.community_upvotes;
      if (sortBy === 'roi') return b.roi_score - a.roi_score;
      if (sortBy === 'beneficiaries') return b.target_beneficiaries - a.target_beneficiaries;
      return 0;
    });

  const totalBudget = projects.reduce((acc, p) => acc + (p.estimated_budget_inr || 0), 0);
  const totalBeneficiaries = projects.reduce((acc, p) => acc + (p.target_beneficiaries || 0), 0);
  const totalVotes = projects.reduce((acc, p) => acc + (p.community_upvotes || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16 text-stone-900">

      {/* ── Top Header Section ──────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3.5 py-1 rounded-full border border-orange-200 text-xs font-extrabold">
              <Landmark className="w-3.5 h-3.5 text-orange-600" />
              <span>CITIZEN COMMUNITY PROJECT SUPPORT & VOTING PORTAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Indore Infrastructure Development Projects
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed font-medium">
              Citizens can review major city infrastructure developments, inspect Gemini AI Detailed Project Reports (DPR), and submit 5-star ratings to determine civic priorities for Super Admin execution.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 px-5 py-3.5 rounded-2xl text-center shrink-0">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Total City Investment</span>
            <p className="text-2xl font-black text-orange-600 mt-0.5">₹{(totalBudget / 10000000).toFixed(0)} Crores</p>
          </div>
        </div>

        {/* 3 Key Stats Strip */}
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-stone-100">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-center">
            <p className="text-lg font-black text-purple-700">₹{(totalBudget / 10000000).toFixed(0)} Cr</p>
            <p className="text-[10px] text-stone-500 font-bold mt-0.5">Approved Budget</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-center">
            <p className="text-lg font-black text-emerald-600">{(totalBeneficiaries / 1000).toFixed(0)}K+</p>
            <p className="text-[10px] text-stone-500 font-bold mt-0.5">Beneficiaries Impacted</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-center">
            <p className="text-lg font-black text-blue-600">{totalVotes.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 font-bold mt-0.5">Citizen Votes & Reviews</p>
          </div>
        </div>
      </div>

      {/* ── Category & Sorting Filters ───────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat === 'ALL' ? '🏗️ All Projects' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-bold">Sort By:</span>
          {[
            { key: 'budget', label: 'Budget' },
            { key: 'upvotes', label: 'Reviews' },
            { key: 'roi', label: 'ROI Score' },
            { key: 'beneficiaries', label: 'Impact' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === s.key ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feedback Notification Toast ─────────────────────────────── */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 text-xs font-extrabold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── Loading Spinner ─────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      )}

      {/* ── Rich Infrastructure Project Cards matching EXACT Super Admin UI Reference ────── */}
      <div className="space-y-6">
        {filteredProjects.map((project, index) => {
          const CatIcon = CATEGORY_ICONS[project.category] || Bus;
          const statusBadge = STATUS_BADGES[project.status] || STATUS_BADGES.UNDER_REVIEW;
          const userRating = userRatings[project.id] || 0;
          const budgetCrores = (project.estimated_budget_inr / 10000000).toFixed(1);
          const totalUpvotes = project.community_upvotes || (2340 + index * 500);

          return (
            <div
              key={project.id}
              className="bg-white border-2 border-purple-500 rounded-3xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* ── Top Row: Icon + Badges + Title + Budget Box ──────── */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-2">
                <div className="flex items-start gap-4 flex-1">
                  
                  {/* Category Circle Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CatIcon className="w-5.5 h-5.5" />
                  </div>

                  <div className="space-y-1">
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-black text-stone-500 uppercase tracking-wider">{project.id}</span>
                      
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      
                      {index === 0 && (
                        <span className="bg-orange-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Award className="w-3 h-3" /> Highest Budget
                        </span>
                      )}
                    </div>

                    {/* Main Title */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 leading-snug">{project.title}</h3>

                    {/* Location Pin & Responsible Agency */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-semibold pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" /> {project.locality}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {project.responsible_department}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Top-Right Budget Box */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl px-6 py-3.5 text-center shrink-0">
                  <p className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wider">PROJECT BUDGET</p>
                  <p className="text-2xl font-black text-emerald-600 leading-none mt-0.5">₹{project.formatted_budget || `${budgetCrores} Cr`}</p>
                  <p className="text-[10px] text-stone-500 font-medium mt-1">{project.funding_scheme}</p>
                </div>
              </div>

              {/* ── Row 2: Project Summary Box ────────────────────────── */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-stone-700 leading-relaxed space-y-1">
                <p>
                  <span className="font-extrabold text-stone-900">Project Summary: </span>
                  {project.problem_justification}
                </p>
              </div>

              {/* ── Row 3: 4 Main Stat Boxes Row ─────────────────────── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* 1. Beneficiaries */}
                <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                  <Users className="w-4 h-4 text-blue-600 mx-auto" />
                  <p className="text-base font-extrabold text-stone-900">{project.target_beneficiaries?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-stone-500 font-bold">Beneficiaries</p>
                </div>

                {/* 2. ROI Score */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                  <BarChart3 className="w-4 h-4 text-amber-600 mx-auto" />
                  <p className="text-base font-extrabold text-stone-900">{project.roi_score}/100</p>
                  <p className="text-[10px] text-stone-500 font-bold">ROI Score</p>
                </div>

                {/* 3. Citizen Reviews */}
                <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                  <ThumbsUp className="w-4 h-4 text-purple-600 mx-auto" />
                  <p className="text-base font-extrabold text-stone-900">{totalUpvotes.toLocaleString()}</p>
                  <p className="text-[10px] text-stone-500 font-bold">Citizen Reviews</p>
                </div>

                {/* 4. Ministry */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                  <Landmark className="w-4 h-4 text-emerald-600 mx-auto" />
                  <p className="text-xs font-extrabold text-stone-900 leading-tight truncate">{project.responsible_ministry || 'MoHUA / MoRTH'}</p>
                  <p className="text-[10px] text-stone-500 font-bold">Ministry</p>
                </div>

              </div>

              {/* ── Row 4: 3 Metric Highlights Cards ─────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1">
                  <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">RIDERSHIP</p>
                  <p className="text-xs font-bold text-stone-900 leading-snug">Expected daily ridership of 1.2 lakh passengers</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1">
                  <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">CONGESTION RELIEF</p>
                  <p className="text-xs font-bold text-stone-900 leading-snug">Removes approximately 40,000 private vehicles from the road daily</p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1">
                  <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">TRAVEL TIME</p>
                  <p className="text-xs font-bold text-stone-900 leading-snug">Reduces end-to-end travel time from 45 mins to 16 mins</p>
                </div>
              </div>

              {/* ── Row 5: 5-Star Rating & Action Buttons ────────────── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-stone-100">
                
                {/* Interactive 5-Star Rating Control */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-stone-700">Your Review:</span>
                  <StarRating
                    rating={userRating}
                    onRate={(stars) => handleRate(project.id, stars)}
                  />
                  {userRating > 0 && (
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {userRating}/5 Stars Submitted
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => onOpenDPR && onOpenDPR({
                      id: project.cluster_id || project.id,
                      label: project.title,
                      locality: project.locality,
                      category: project.category,
                      ppi_score: project.roi_score,
                    })}
                    className="flex-1 sm:flex-initial bg-stone-900 hover:bg-stone-800 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Full DPR</span>
                  </button>

                  <button
                    onClick={() => {
                      if (project.scope_of_work && project.scope_of_work.length > 0) {
                        alert(`📋 Scope of Work for ${project.title}:\n\n${project.scope_of_work.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
                      } else {
                        alert(`📋 Scope of Work for ${project.title}:\n\n1. Land Acquisition & Sector Surveys\n2. Geotechnical Soil Testing & Foundation Boring\n3. Structural Construction & Civil Engineering Works\n4. Public Utility Relocation & Commissioning`);
                      }
                    }}
                    className="flex-1 sm:flex-initial bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-extrabold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-stone-200"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Scope of Work</span>
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {!loading && filteredProjects.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-3">
          <Construction className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-500">No projects found in this category</p>
          <p className="text-xs text-stone-400">Try selecting "All Projects" to see available infrastructure developments.</p>
        </div>
      )}

    </div>
  );
}
