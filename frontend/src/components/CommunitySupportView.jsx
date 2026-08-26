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

const CATEGORY_COLORS = {
  'Sanitation & Urban Infrastructure': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-600' },
  'Public Works & Transportation': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-600' },
  'Water Supply & Infrastructure': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-600' },
  'Energy & Public Safety': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', accent: 'bg-yellow-600' },
  'Sanitation & Environment': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-600' },
  'Urban Transport': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-600' },
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
  const starSize = size === 'lg' ? 'w-6 h-6' : 'w-4.5 h-4.5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHoverStar(star)}
          onMouseLeave={() => setHoverStar(0)}
          className="p-0.5 hover:scale-125 transition-all cursor-pointer"
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

    setFeedbackMsg(`Your ${stars}-star review for project ${projectId} has been recorded! Thank you for participating in civic governance.`);
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">

      {/* ── Header Section ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-orange-500/20 text-orange-300 px-3.5 py-1 rounded-full border border-orange-500/30 text-xs font-bold backdrop-blur-sm">
            <Landmark className="w-3.5 h-3.5" />
            <span>Major City Infrastructure Development Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Indore City Infrastructure Projects
          </h2>
          <p className="text-sm text-stone-300 max-w-2xl leading-relaxed">
            Review and rate major city-level infrastructure projects announced by the Municipal Corporation.
            View Detailed Project Reports (DPR), track budgets, and give your 5-star citizen rating to influence priority.
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-orange-400">₹{(totalBudget / 10000000).toFixed(0)} Cr</p>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Total Infrastructure Budget</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-emerald-400">{(totalBeneficiaries / 1000).toFixed(0)}K+</p>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Citizens Impacted</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl font-extrabold text-blue-400">{totalVotes.toLocaleString()}</p>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">Community Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter & Sort Bar ───────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat === 'ALL' ? '🏗️ All Projects' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400 font-bold">Sort:</span>
          {[
            { key: 'budget', label: 'Budget' },
            { key: 'upvotes', label: 'Reviews' },
            { key: 'roi', label: 'ROI Score' },
            { key: 'beneficiaries', label: 'Impact' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                sortBy === s.key ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feedback Alert ──────────────────────────────────────────── */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl p-4 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      )}

      {/* ── Project Cards ───────────────────────────────────────────── */}
      <div className="space-y-5">
        {filteredProjects.map((project, index) => {
          const catColors = CATEGORY_COLORS[project.category] || { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700', accent: 'bg-stone-600' };
          const CatIcon = CATEGORY_ICONS[project.category] || Construction;
          const statusBadge = STATUS_BADGES[project.status] || STATUS_BADGES.UNDER_REVIEW;
          const userRating = userRatings[project.id] || 0;
          const budgetCrores = (project.estimated_budget_inr / 10000000).toFixed(1);

          return (
            <div
              key={project.id}
              className={`bg-white border rounded-3xl shadow-sm overflow-hidden transition-all hover:shadow-md ${
                index === 0 ? 'border-orange-300 ring-2 ring-orange-500/10' : 'border-stone-200'
              }`}
            >
              {/* Top Color Bar */}
              <div className={`h-1.5 ${catColors.accent}`} />

              <div className="p-5 sm:p-6 space-y-5">

                {/* ── Row 1: Project Title + Status + Budget ──────── */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`w-11 h-11 rounded-2xl ${catColors.accent} text-white flex items-center justify-center shrink-0 shadow-md`}>
                      <CatIcon className="w-5.5 h-5.5" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{project.id}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {index === 0 && (
                          <span className="bg-orange-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" /> Highest Budget
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-stone-900 leading-snug">{project.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-orange-500" /> {project.locality}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-blue-500" /> {project.responsible_department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget Badge */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-center shrink-0">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Project Budget</p>
                    <p className="text-2xl font-extrabold text-emerald-700">₹{budgetCrores} Cr</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{project.funding_scheme}</p>
                  </div>
                </div>

                {/* ── Row 2: Justification ────────────────────────── */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
                  <p className="text-xs text-stone-600 leading-relaxed">
                    <span className="font-bold text-stone-800">Project Summary: </span>
                    {project.problem_justification}
                  </p>
                </div>

                {/* ── Row 3: Key Metrics Grid ─────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-center">
                    <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm font-extrabold text-stone-900">{project.target_beneficiaries?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-stone-500 font-semibold">Beneficiaries</p>
                  </div>
                  <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3 text-center">
                    <BarChart3 className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                    <p className="text-sm font-extrabold text-stone-900">{project.roi_score}/100</p>
                    <p className="text-[10px] text-stone-500 font-semibold">ROI Score</p>
                  </div>
                  <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3 text-center">
                    <ThumbsUp className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm font-extrabold text-stone-900">{project.community_upvotes?.toLocaleString()}</p>
                    <p className="text-[10px] text-stone-500 font-semibold">Citizen Reviews</p>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                    <Landmark className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <p className="text-[11px] font-extrabold text-stone-900 leading-tight">{project.responsible_ministry}</p>
                    <p className="text-[10px] text-stone-500 font-semibold">Ministry</p>
                  </div>
                </div>

                {/* ── Row 4: Impact Metrics ────────────────────────── */}
                {project.impact_metrics && Object.keys(project.impact_metrics).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {Object.entries(project.impact_metrics).map(([key, value]) => (
                      <div key={key} className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                        <p className="text-xs font-bold text-stone-800 mt-0.5 leading-snug">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Row 5: Rating + Actions ─────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-stone-100">
                  
                  {/* Star Rating */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 font-bold">Your Review:</span>
                    <StarRating
                      rating={userRating}
                      onRate={(stars) => handleRate(project.id, stars)}
                    />
                    {userRating > 0 && (
                      <span className="text-[11px] font-extrabold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {userRating}/5 Submitted
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onOpenDPR && onOpenDPR({
                        id: project.cluster_id || project.id,
                        label: project.title,
                        locality: project.locality,
                        category: project.category,
                        ppi_score: project.roi_score,
                      })}
                      className="flex-1 sm:flex-initial bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Full DPR</span>
                    </button>
                    <button
                      onClick={() => {
                        if (project.scope_of_work && project.scope_of_work.length > 0) {
                          alert(`📋 Scope of Work:\n\n${project.scope_of_work.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
                        }
                      }}
                      className="flex-1 sm:flex-initial bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Scope of Work</span>
                    </button>
                  </div>
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
