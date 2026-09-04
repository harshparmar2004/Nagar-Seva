import React, { useState } from 'react';
import { X, FileText, Download, CheckCircle, Sparkles, DollarSign, Users, ShieldCheck } from 'lucide-react';

export default function DPRModal({ cluster, onClose }) {
  const [dpr] = useState({
    id: "DPR-2026-001",
    title: "Construct 3.4km Integrated Covered Drainage & Sewerage Pipeline Network",
    locality: "Wards 14 & 15, South Indore, Madhya Pradesh",
    category: "Sanitation & Urban Infrastructure",
    estimated_budget_inr: 38000000,
    formatted_budget: "â‚¹3.80 Crores",
    target_beneficiaries: 43500,
    roi_score: 95,
    funding_scheme: "AMRUT 2.0 / Swachh Bharat Mission (Urban)",
    problem_justification: "Synthesized from 847 verified citizen voice requests across Wards 14 & 15. Fused with Census 2021 data (52% poverty rate, high child density) and PM Gati Shakti GIS layers confirming 0 stormwater drains in a 3.2km radius. Current municipal budget allocation of â‚¹0 creates a severe public health hazard.",
    scope_of_work: [
      "Installation of 3.4 km high-density RCC underground sewerage and stormwater trunk pipeline",
      "Construction of 18 junction inspection chambers with automated debris traps",
      "1.8 km road resurfacing and asphalt sealing following trench excavation",
      "Direct integration with South Indore Sewage Treatment Plant (STP)"
    ],
    impact_metrics: {
      disease_reduction: "65% estimated drop in waterborne diseases within 12 months",
      flood_prevention: "Prevents annual monsoon inundation for 8,700 households",
      economic_savings: "â‚¹1.4 Crores saved annually in individual health and property repairs"
    },
    community_upvotes: 2340,
    status: "APPROVED_FOR_DPR"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8 relative text-stone-900 animate-fade-in">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-2 rounded-xl bg-stone-100 hover:bg-stone-200 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 border-b border-stone-200 pb-5">
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI-GENERATED DETAILED PROJECT REPORT (DPR) â€” GOOGLE GEMINI PRO</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-tight">{dpr.title}</h2>
          <p className="text-xs text-stone-500">{dpr.locality} â€¢ Scheme: <span className="text-orange-600 font-bold">{dpr.funding_scheme}</span></p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-stone-500 text-xs font-medium">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Estimated Budget</span>
            </div>
            <p className="text-xl font-extrabold text-emerald-600">{dpr.formatted_budget}</p>
            <p className="text-[10px] text-stone-400">â‚¹873 / Beneficiary</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-stone-500 text-xs font-medium">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Target Beneficiaries</span>
            </div>
            <p className="text-xl font-extrabold text-blue-600">{dpr.target_beneficiaries.toLocaleString()} Citizens</p>
            <p className="text-[10px] text-stone-400">Wards 14 & 15 Residents</p>
          </div>

          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
            <div className="flex items-center space-x-1.5 text-stone-500 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
              <span>Public Priority Score</span>
            </div>
            <p className="text-xl font-extrabold text-orange-600">{dpr.roi_score} / 100</p>
            <p className="text-[10px] text-stone-400">Rank #1 Municipal Priority</p>
          </div>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
          <h4 className="font-bold text-stone-700 uppercase tracking-wider text-[11px]">1. Problem Justification (Evidence Synthesis)</h4>
          <p className="text-stone-700 leading-relaxed">{dpr.problem_justification}</p>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
          <h4 className="font-bold text-stone-700 uppercase tracking-wider text-[11px]">2. Technical Scope of Work</h4>
          <ul className="space-y-1.5 text-stone-700">
            {dpr.scope_of_work.map((item, i) => (
              <li key={i} className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-xs">
          <h4 className="font-bold text-stone-700 uppercase tracking-wider text-[11px]">3. Expected Socio-Economic Impact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400">Health Impact</span>
              <p className="font-bold text-emerald-700 mt-0.5">{dpr.impact_metrics.disease_reduction}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400">Monsoon Flooding</span>
              <p className="font-bold text-blue-700 mt-0.5">{dpr.impact_metrics.flood_prevention}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] text-stone-400">Economic ROI</span>
              <p className="font-bold text-orange-700 mt-0.5">{dpr.impact_metrics.economic_savings}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
          <span className="text-xs text-stone-500">
            Democratically Endorsed by <span className="font-bold text-stone-900">{dpr.community_upvotes} Citizens</span>
          </span>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 sm:flex-initial"
            >
              Close
            </button>
            <button
              onClick={() => alert("Downloading Official Municipal DPR Document (PDF)...")}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-orange-600/20 transition-all flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4" />
              <span>Download Official DPR PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
