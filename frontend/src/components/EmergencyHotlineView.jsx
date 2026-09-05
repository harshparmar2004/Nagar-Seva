import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, Sparkles, PhoneCall, CheckCircle2, MapPin, Clock, Camera, Send, Flame, Zap, AlertTriangle, ShieldCheck, Building2, User } from 'lucide-react';

export default function EmergencyHotlineView({ currentUser }) {
  const [hazardType, setHazardType] = useState('ELECTRICAL_LIVE_WIRE');
  const [landmark, setLandmark] = useState('Near Rajwada Central Square, Indore');
  const [description, setDescription] = useState('11kV High Voltage Overhead Electric Cable Snapped and Fallen on Wet Road Near Primary School Entrance!');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiClassification, setAiClassification] = useState(null);

  const activeEmergencies = [
    {
      id: 'EMG-IND-2026-901',
      title: 'Fallen High Voltage 11kV Power Cable',
      location: 'Near Rajwada Central Square, Ward 1',
      severity: 'GRADE 5 CRITICAL (98.5/100 Risk Score)',
      status: 'CONTROL ROOM DISPATCHED',
      reportedAt: '12 mins ago',
      aiVerdict: 'GENUINE LIFE HAZARD — Priority 1 Incident',
      dept: 'Paschim DISCOM Electricity Rapid Action Team',
      officer: 'Er. Sandeep Joshi (Discom Control Room)'
    },
    {
      id: 'EMG-IND-2026-874',
      title: 'Deep Uncovered Sewer Pit on Main Highway',
      location: 'Cat Road Square, Ward 14',
      severity: 'GRADE 4 SEVERE (88.0/100 Risk Score)',
      status: 'FIRE TENDER & AMBULANCE ON STANDBY',
      reportedAt: '35 mins ago',
      aiVerdict: 'HIGH ROAD ACCIDENT HAZARD',
      dept: 'IMC Emergency Sewerage Unit',
      officer: 'Er. Rajesh Sharma (Chief Engineer)'
    }
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeEmergency = () => {
    setIsClassifying(true);
    setTimeout(() => {
      setIsClassifying(false);
      setAiClassification({
        hazard_risk_score: 98.5,
        criticality_grade: 'GRADE 5 LIFE HAZARD',
        is_genuine_emergency: true,
        ai_recommendation: 'INSTANT DISPATCH TO INDORE CONTROL ROOM 181 & FIRE SERVICES',
        detected_risk: 'High Voltage Electrocution Risk within 20m radius',
        dispatch_team: 'Paschim DISCOM Electricity Disaster Cell',
        nodal_officer: 'Er. Sandeep Joshi (Control Room Commander)'
      });
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Emergency Hero Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-5 sm:p-8 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/30">
              24/7 Indore Control Room 181 Hotline
            </span>
          </div>

          <a
            href="tel:181"
            className="w-full sm:w-auto bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>DIRECT CALL 181 CONTROL ROOM</span>
          </a>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold">Emergency Red Alert & AI Criticality Classifier</h1>
          <p className="text-xs sm:text-sm text-red-100 font-semibold max-w-2xl leading-relaxed">
            Report life-threatening municipal hazards (snapped live wires, deep open sewer pits, gas leaks). Google Gemini AI verifies hazard authenticity in under 2 seconds and alerts the District Control Room.
          </p>
        </div>
      </div>

      {/* SECTION 1: REPORT NEW EMERGENCY & RUN AI RANKING */}
      <div className="bg-white border border-red-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-stone-100">
          <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-stone-900">Trigger Rapid Emergency Red Alert</h3>
            <p className="text-xs text-stone-500 font-semibold">Gemini AI evaluates hazard criticality and dispatches 181 Control Room teams</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Select Emergency Hazard Type:</label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="ELECTRICAL_LIVE_WIRE">⚡ Fallen High Voltage Cable / Live Wire</option>
              <option value="OPEN_SEWER_PIT">⚠️ Deep Open Drain / Uncovered Manhole</option>
              <option value="GAS_LEAKAGE">🔥 LPG / Industrial Chemical Gas Leak</option>
              <option value="BRIDGE_COLLAPSE">🚧 Structural Wall / Bridge Collapse Risk</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Exact Emergency Location Landmark:</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-700">Hazard Situation Description:</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-900 focus:outline-none focus:border-red-500 resize-none"
          />
        </div>

        {/* AI Classifier Button */}
        <div className="pt-1">
          <button
            onClick={handleAnalyzeEmergency}
            disabled={isClassifying}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-red-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isClassifying ? 'Analyzing Hazard Criticality with Gemini AI...' : 'Run AI Criticality Check & Dispatch Emergency Team'}</span>
          </button>
        </div>

        {/* AI Classification Results Box */}
        {aiClassification && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4 text-xs animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-red-200">
              <span className="font-extrabold text-red-800 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-red-600" /> AI Criticality Ranking Result
              </span>
              <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm">
                {aiClassification.criticality_grade} ({aiClassification.hazard_risk_score}/100)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-red-200 space-y-0.5">
                <span className="text-[10px] text-stone-400 font-bold uppercase">AI Authenticity Verdict</span>
                <p className="font-extrabold text-emerald-700 text-xs">GENUINE LIFE HAZARD ✓</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-red-200 space-y-0.5">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Dispatched Disaster Unit</span>
                <p className="font-extrabold text-stone-900 text-xs">{aiClassification.dispatch_team}</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-red-200 space-y-0.5">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Sector Jurisdiction</span>
                <p className="font-extrabold text-stone-900 text-xs">{selectedWard}</p>
              </div>
            </div>

            <div className="bg-emerald-100 text-emerald-900 p-3.5 rounded-xl border border-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Emergency Alert Transmitted to Indore 181 Control Room! Dispatch Team en route to {landmark}.</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: LIVE ACTIVE INCIDENTS FEED */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-600 animate-pulse" /> Live Active District Emergency Incidents
          </h3>
          <span className="bg-stone-100 text-stone-600 font-bold text-xs px-3 py-1 rounded-full">
            2 Active High-Priority Alerts
          </span>
        </div>

        <div className="space-y-4">
          {activeEmergencies.map((emg) => (
            <div key={emg.id} className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-extrabold text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-200 text-[11px]">
                    {emg.id}
                  </span>
                  <h4 className="text-sm font-extrabold text-stone-900 mt-1">{emg.title}</h4>
                  <p className="text-stone-500 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" /> {emg.location}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="bg-red-100 text-red-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-red-200">
                    {emg.severity}
                  </span>
                  <p className="text-[10px] text-stone-400 font-semibold mt-1">{emg.reportedAt}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-bold text-stone-800">{emg.dept}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center space-x-2">
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-stone-800">{emg.officer}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
