import React, { useState } from 'react';
import { Building2, CheckCircle2, Clock, DollarSign, FileCheck, Star, Users, ExternalLink, ShieldCheck, Sparkles, ThumbsUp } from 'lucide-react';

export default function MunicipalTendersView() {
  const [tenders, setTenders] = useState([
    {
      id: 'TND-IMC-2026-089',
      title: '3.4km Covered RCC Trunk Sewerage Line — Ward 14 & 15',
      contractor: 'L&T Urban Infrastructure Pvt. Ltd.',
      budget: '₹3.80 Crores',
      fundingScheme: 'AMRUT 2.0 / Swachh Bharat Mission (Urban)',
      completion: 65,
      citizenRating: 4.8,
      totalAudits: 342,
      userRating: 0,
      nodalOfficer: 'Er. Rajesh Sharma (Chief Engineer, IMC)',
      status: 'WORK_IN_PROGRESS',
      startDate: '10 Jan 2026',
      targetDate: '30 Apr 2026',
      milestones: [
        { name: 'Survey & Geo-Technical Ground Assessment', status: 'COMPLETED' },
        { name: 'Underground RCC Pipeline Laying (2.1 km completed)', status: 'IN_PROGRESS' },
        { name: 'Junction Inspection Chambers & Automated Debris Traps', status: 'PENDING' },
        { name: 'Asphalt Road Resurfacing', status: 'PENDING' }
      ]
    },
    {
      id: 'TND-IMC-2026-042',
      title: 'Sanwer Industrial Highway Road Reconstruction & Asphalt Sealing',
      contractor: 'Indore Highway Infrastructure Developers',
      budget: '₹4.20 Crores',
      fundingScheme: 'PM Gati Shakti Infrastructure Grant',
      completion: 90,
      citizenRating: 4.6,
      totalAudits: 189,
      userRating: 0,
      nodalOfficer: 'Shri Vikramaditya Singh (Superintending Engineer, IDA)',
      status: 'NEAR_COMPLETION',
      startDate: '01 Dec 2025',
      targetDate: '15 Mar 2026',
      milestones: [
        { name: 'Base Grade Excavation & Bitumen Sealing', status: 'COMPLETED' },
        { name: 'Dual-Lane Asphalt Paving (4.8 km)', status: 'COMPLETED' },
        { name: 'Solar Streetlight Installation & Median Guardrails', status: 'IN_PROGRESS' }
      ]
    }
  ]);

  const handleRateTender = (tenderId, stars) => {
    setTenders(prev => prev.map(t => {
      if (t.id === tenderId) {
        const newTotal = t.totalAudits + 1;
        const newRating = Number(((t.citizenRating * t.totalAudits + stars) / newTotal).toFixed(1));
        return {
          ...t,
          userRating: stars,
          citizenRating: newRating,
          totalAudits: newTotal
        };
      }
      return t;
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Open Governance & Citizen Quality Audit Feed
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900">Municipal Tenders & Contractor Quality Audits</h2>
            <p className="text-xs text-stone-500">
              Track public funds, contractor milestone completion %, and submit resident quality ratings for active Indore works.
            </p>
          </div>

          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
            AUDITED BY SWACHH BHARAT DPI
          </span>
        </div>
      </div>

      {/* Tenders List */}
      <div className="space-y-6">
        {tenders.map((t) => (
          <div key={t.id} className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-extrabold text-xs text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                    {t.id}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {t.fundingScheme}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-stone-900 mt-1">{t.title}</h3>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-stone-500 font-medium">Sanctioned Budget</span>
                <p className="text-2xl font-extrabold text-stone-900">{t.budget}</p>
              </div>
            </div>

            {/* Contractor & Officer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-semibold">Contractor Firm</span>
                <p className="font-bold text-stone-900">{t.contractor}</p>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1">
                <span className="text-stone-500 font-semibold">Supervising Nodal Officer</span>
                <p className="font-bold text-stone-900">{t.nodalOfficer}</p>
              </div>

              {/* Interactive Citizen Audit Rating Box */}
              <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-200 space-y-1">
                <span className="text-orange-700 font-extrabold uppercase text-[10px]">Citizen Quality Audit Score</span>
                <div className="flex items-center space-x-1.5 font-extrabold text-stone-900 text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{t.citizenRating} / 5.0</span>
                  <span className="text-[10px] font-normal text-stone-500">({t.totalAudits} audits)</span>
                </div>
                
                <div className="pt-1 flex items-center space-x-1">
                  <span className="text-[10px] text-stone-500 font-semibold">Rate Quality:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRateTender(t.id, star)}
                      className={`p-0.5 transition-all cursor-pointer ${
                        t.userRating >= star ? 'text-amber-500 fill-amber-500 scale-110' : 'text-stone-300 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  ))}
                  {t.userRating > 0 && <span className="text-[10px] text-emerald-600 font-extrabold ml-1">✓ Rated</span>}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-stone-700">Project Milestone Progress</span>
                <span className="text-emerald-600">{t.completion}% Completed</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden border border-stone-200">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${t.completion}%` }} />
              </div>
            </div>

            {/* Milestone Breakdown */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
              <span className="font-bold text-stone-600 uppercase tracking-wider">Milestone Breakdown & Inspection Ledger:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {t.milestones.map((m, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-stone-200">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${m.status === 'COMPLETED' ? 'text-emerald-600' : m.status === 'IN_PROGRESS' ? 'text-orange-500 animate-pulse' : 'text-stone-300'}`} />
                    <span className={`text-[11px] font-semibold ${m.status === 'COMPLETED' ? 'text-stone-900 line-through opacity-70' : 'text-stone-900'}`}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
