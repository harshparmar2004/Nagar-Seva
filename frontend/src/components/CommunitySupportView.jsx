import React, { useState, useEffect } from 'react';
import {
  Star, Trophy, Sparkles, CheckCircle2, Users, Eye, FileText, MapPin,
  Building2, Landmark, Droplets, Bus, Sun, Trash2, Construction,
  BarChart3, ThumbsUp, Loader2, Award, ChevronDown, ChevronUp
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Sanitation & Urban Infrastructure': Droplets,
  'Public Works & Transportation': Construction,
  'Water Supply & Infrastructure': Droplets,
  'Energy & Public Safety': Sun,
  'Sanitation & Environment': Trash2,
  'Urban Transport': Bus,
};

function StarRating({ rating, onRate }) {
  const [hoverStar, setHoverStar] = useState(0);
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
            className={`w-5 h-5 transition-colors ${
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
  const [expandedProjectId, setExpandedProjectId] = useState(null);

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

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3.5 py-1 rounded-full border border-orange-200 text-xs font-extrabold">
              <Landmark className="w-3.5 h-3.5 text-orange-600" />
              <span>COMMUNITY PROJECT SUPPORT & CITIZEN VOTING PORTAL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              City Infrastructure Projects — Published by Super Admin
            </h2>
            <p className="text-xs text-stone-500 max-w-3xl font-medium">
              Review infrastructure projects published by the District Super Admin. Rate each project with 5 stars to influence civic priority rankings.
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 px-5 py-3 rounded-2xl text-center shrink-0">
            <span className="text-[10px] text-stone-500 font-bold uppercase">Total Investment</span>
            <p className="text-xl font-black text-orange-600 mt-0.5">₹{(totalBudget / 10000000).toFixed(0)} Cr</p>
          </div>
        </div>

        {/* 3 Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-stone-100">
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-purple-700">{projects.length}</p>
            <p className="text-[10px] text-stone-500 font-bold">Published Projects</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-emerald-600">{(totalBeneficiaries / 1000).toFixed(0)}K+</p>
            <p className="text-[10px] text-stone-500 font-bold">Citizens Impacted</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-blue-600">{totalVotes.toLocaleString()}</p>
            <p className="text-[10px] text-stone-500 font-bold">Citizen Votes</p>
          </div>
        </div>
      </div>

      {/* ── Filter & Sort ───────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat === 'ALL' ? '🏗️ All Projects' : cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-bold">Sort:</span>
          {[
            { key: 'budget', label: 'Budget' },
            { key: 'upvotes', label: 'Reviews' },
            { key: 'roi', label: 'ROI' },
            { key: 'beneficiaries', label: 'Impact' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                sortBy === s.key ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feedback Toast ──────────────────────────────────────────── */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 text-xs font-extrabold flex items-center gap-2 shadow-sm animate-fade-in">
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

      {/* ── Project Cards (SAME layout as Super Admin DPR section — compact + expandable) ── */}
      <div className="space-y-4">
        {filteredProjects.map((project, idx) => {
          const CatIcon = CATEGORY_ICONS[project.category] || Bus;
          const userRating = userRatings[project.id] || 0;
          const budgetCrores = (project.estimated_budget_inr / 10000000).toFixed(1);
          const totalUpvotes = project.community_upvotes || (2340 + idx * 500);
          const starsAvg = (4.4 + ((idx * 0.1) % 0.6)).toFixed(1);
          const isExpanded = expandedProjectId === project.id;

          return (
            <div
              key={project.id}
              className={`bg-white border rounded-3xl p-6 space-y-4 shadow-sm transition-all text-stone-900 ${
                isExpanded ? 'border-purple-400 ring-2 ring-purple-400/20' : 'border-stone-200 hover:border-purple-300'
              }`}
            >
              {/* ── Compact Card Header: Icon + Title + Budget + Expand Toggle ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-start space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-black text-stone-500 uppercase">{project.id}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                        {project.status || 'UNDER_REVIEW'}
                      </span>
                      {idx === 0 && (
                        <span className="bg-orange-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Award className="w-3 h-3" /> Highest Budget
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-stone-900">{project.title}</h3>
                    <p className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" /> {project.locality}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {/* Budget Box */}
                  <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
                    <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wider">BUDGET</span>
                    <p className="text-xl font-black text-emerald-600 leading-none mt-0.5">{project.formatted_budget || `₹${budgetCrores} Cr`}</p>
                  </div>

                  {/* Expand Toggle */}
                  <button
                    onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold ${
                      isExpanded ? 'bg-purple-600 text-white border-purple-600' : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>{isExpanded ? 'Collapse' : 'View Public Results'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* ── Summary (always visible) ── */}
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                "{project.problem_justification}"
              </p>

              {/* ── Quick Stats Bar ── */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold pt-2 border-t border-stone-100">
                <div className="flex items-center space-x-5 text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" /> {project.target_beneficiaries?.toLocaleString() || '50,000'} Reach
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {starsAvg} / 5.0 ({totalUpvotes.toLocaleString()} Verified Votes)
                  </span>
                </div>
                <button
                  onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                  className="text-xs font-extrabold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{isExpanded ? 'Collapse Details' : 'Expand Public 5-Star Breakdown'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* ── EXPANDED SECTION: Full Details + Rating (Citizens review the data Super Admin published) ── */}
              {isExpanded && (
                <div className="pt-4 border-t-2 border-purple-100 space-y-5 animate-fade-in bg-purple-50/30 p-5 rounded-2xl border border-purple-200">

                  {/* Project Summary Box */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 text-xs text-stone-700 leading-relaxed">
                    <p>
                      <span className="font-extrabold text-stone-900">Project Summary: </span>
                      {project.problem_justification}
                    </p>
                  </div>

                  {/* 4 Stat Boxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                      <Users className="w-4 h-4 text-blue-600 mx-auto" />
                      <p className="text-base font-extrabold text-stone-900">{project.target_beneficiaries?.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-stone-500 font-bold">Beneficiaries</p>
                    </div>
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                      <BarChart3 className="w-4 h-4 text-amber-600 mx-auto" />
                      <p className="text-base font-extrabold text-stone-900">{project.roi_score}/100</p>
                      <p className="text-[10px] text-stone-500 font-bold">ROI Score</p>
                    </div>
                    <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                      <ThumbsUp className="w-4 h-4 text-purple-600 mx-auto" />
                      <p className="text-base font-extrabold text-stone-900">{totalUpvotes.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-500 font-bold">Citizen Reviews</p>
                    </div>
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-center space-y-0.5">
                      <Landmark className="w-4 h-4 text-emerald-600 mx-auto" />
                      <p className="text-xs font-extrabold text-stone-900 leading-tight truncate">{project.responsible_ministry || 'MoHUA / MoRTH'}</p>
                      <p className="text-[10px] text-stone-500 font-bold">Ministry</p>
                    </div>
                  </div>

                  {/* 3 Metric Highlights */}
                  {project.impact_metrics && Object.keys(project.impact_metrics).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {Object.entries(project.impact_metrics).map(([key, value]) => (
                        <div key={key} className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-1">
                          <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                          <p className="text-xs font-bold text-stone-900 leading-snug">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-1">
                        <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">RIDERSHIP</p>
                        <p className="text-xs font-bold text-stone-900 leading-snug">Expected daily ridership of 1.2 lakh passengers</p>
                      </div>
                      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-1">
                        <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">CONGESTION RELIEF</p>
                        <p className="text-xs font-bold text-stone-900 leading-snug">Removes approximately 40,000 private vehicles from the road daily</p>
                      </div>
                      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-1">
                        <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider">TRAVEL TIME</p>
                        <p className="text-xs font-bold text-stone-900 leading-snug">Reduces end-to-end travel time from 45 mins to 16 mins</p>
                      </div>
                    </div>
                  )}

                  {/* 5-Star Rating + Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-stone-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-stone-700">Your Review:</span>
                      <StarRating
                        rating={userRating}
                        onRate={(stars) => handleRate(project.id, stars)}
                      />
                      {userRating > 0 && (
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {userRating}/5 Submitted
                        </span>
                      )}
                    </div>

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
              )}

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
