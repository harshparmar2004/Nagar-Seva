import React, { useState, useEffect } from 'react';
import {
  Star, CheckCircle2, Loader2, MapPin, Landmark, Droplets, Bus, Sun,
  Trash2, Construction, FileText, Eye, Send
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Sanitation & Urban Infrastructure': Droplets,
  'Public Works & Transportation': Construction,
  'Water Supply & Infrastructure': Droplets,
  'Energy & Public Safety': Sun,
  'Sanitation & Environment': Trash2,
  'Urban Transport': Bus,
};

function StarRating({ rating, onRate, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const starSize = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onRate(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 hover:scale-110 transition-all cursor-pointer focus:outline-none"
        >
          <Star
            className={`${starSize} transition-colors ${
              s <= (hover || rating)
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
  const [submitted, setSubmitted] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://nagarmitra-backend.onrender.com/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRate = async (projectId, stars) => {
    setUserRatings(prev => ({ ...prev, [projectId]: stars }));
  };

  const handleSubmitRating = async (projectId) => {
    const stars = userRatings[projectId];
    if (!stars) return;
    setSubmitted(prev => ({ ...prev, [projectId]: true }));
    setToast(`Thank you! Your ${stars}-star rating has been submitted.`);
    setTimeout(() => setToast(null), 3500);
    try {
      await fetch(`https://nagarmitra-backend.onrender.com/api/projects/${projectId}/rate?stars=${stars}`, { method: 'POST' });
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in pb-16 text-stone-900">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-2">
        <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-3.5 py-1 rounded-full border border-orange-200 text-xs font-extrabold">
          <Landmark className="w-3.5 h-3.5 text-orange-600" />
          <span>COMMUNITY PROJECT SUPPORT</span>
        </div>
        <h2 className="text-xl font-extrabold text-stone-900">
          City Infrastructure Projects
        </h2>
        <p className="text-xs text-stone-500 font-medium max-w-2xl">
          Review infrastructure projects published by the District Administration. Rate each project by giving 1â€“5 stars to help prioritize civic development.
        </p>
      </div>

      {/* â”€â”€ Toast â”€â”€ */}
      {toast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl px-5 py-3 text-xs font-extrabold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* â”€â”€ Loading â”€â”€ */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      )}

      {/* â”€â”€ Project Cards â”€â”€ */}
      <div className="space-y-4">
        {projects.map((project, idx) => {
          const CatIcon = CATEGORY_ICONS[project.category] || Bus;
          const userRating = userRatings[project.id] || 0;
          const isSubmitted = submitted[project.id] || false;
          const budgetCrores = (project.estimated_budget_inr / 10000000).toFixed(0);

          return (
            <div
              key={project.id}
              className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 hover:border-stone-300 transition-all"
            >
              {/* â”€â”€ Top Row: Icon + Title + Category â”€â”€ */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow">
                  <CatIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                      {project.category || 'Infrastructure'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono font-bold">{project.id}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-stone-900 leading-snug">{project.title}</h3>
                  <p className="text-xs text-stone-500 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    {project.locality}
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center shrink-0">
                  <span className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-wider">BUDGET</span>
                  <p className="text-lg font-black text-emerald-600 leading-none mt-0.5">â‚¹{budgetCrores} Cr</p>
                </div>
              </div>

              {/* â”€â”€ Description â”€â”€ */}
              <p className="text-xs text-stone-600 font-medium leading-relaxed pl-[52px]">
                {project.problem_justification}
              </p>

              {/* â”€â”€ Bottom: 5-Star Rating + DPR Button â”€â”€ */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 pl-[52px]">

                {/* Rating Section */}
                <div className="flex items-center gap-3">
                  {isSubmitted ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-extrabold text-emerald-700">Rated {userRating}/5 â€” Thank you!</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-stone-500">Rate this project:</span>
                      <StarRating rating={userRating} onRate={(s) => handleRate(project.id, s)} size="lg" />
                      {userRating > 0 && (
                        <button
                          onClick={() => handleSubmitRating(project.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* View DPR */}
                <button
                  onClick={() => onOpenDPR && onOpenDPR({
                    id: project.cluster_id || project.id,
                    label: project.title,
                    locality: project.locality,
                    category: project.category,
                    ppi_score: project.roi_score,
                  })}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-stone-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View Full DPR
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* â”€â”€ Empty â”€â”€ */}
      {!loading && projects.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-3">
          <Construction className="w-12 h-12 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-500">No projects published yet</p>
          <p className="text-xs text-stone-400">The District Administration will publish infrastructure projects here soon.</p>
        </div>
      )}
    </div>
  );
}
