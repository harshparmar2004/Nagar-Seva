import React, { useState } from 'react';
import { X, AlertOctagon, PhoneCall, ShieldAlert, CheckCircle2, Sparkles, MapPin } from 'lucide-react';

export default function EmergencyAlertModal({ isOpen, onClose }) {
  const [emergencyType, setEmergencyType] = useState('OPEN_SEWER');
  const [landmark, setLandmark] = useState('Near Rajendra Nagar Primary School Gate');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSendAlert = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white border-2 border-rose-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-stone-900">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 text-rose-600">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
              24/7 Red Alert Hotline
            </span>
            <h2 className="text-xl font-extrabold text-stone-900">Emergency Life Hazard Escalation</h2>
          </div>
        </div>

        {!isSent ? (
          <div className="space-y-4 text-xs">
            <p className="text-stone-600">
              This red alert bypasses normal municipal queues and immediately broadcasts to the **Indore Municipal Control Room (181)** and assigned Ward Nodal Officer.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-800">Select Emergency Hazard Type:</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 font-bold text-stone-900 focus:outline-none"
              >
                <option value="OPEN_SEWER">ðŸš¨ Open Sewerage Pit / Uncovered Drain (Child Hazard)</option>
                <option value="HIGH_VOLTAGE">âš¡ Live High-Voltage Wire Fallen on Public Road</option>
                <option value="MAIN_BURST">ðŸ’§ Drinking Water Main Pipeline Burst / Flooding</option>
                <option value="BUILDING_COLLAPSE">ðŸšï¸ Dangerous Building Structure Hazard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-800">Exact Hazard Location & Landmark:</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Primary School Gate, Ward 14"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 font-bold text-stone-900 focus:outline-none"
              />
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-rose-700 font-bold">
                <PhoneCall className="w-4 h-4" />
                <span>Immediate Toll-Free Helpline: 181 / 155304 (IMC)</span>
              </div>
              <p className="text-[10px] text-rose-800">Nodal Officer: Er. Rajesh Sharma (Chief Engineer) will be dispatched instantly.</p>
            </div>

            <button
              onClick={handleSendAlert}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <AlertOctagon className="w-5 h-5" />
              <span>Broadcast Emergency Red Alert Now</span>
            </button>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-stone-900">Emergency Red Alert Broadcasted!</h3>
            <p className="text-xs text-stone-600">
              Dispatched to Indore Municipal Control Room & Rapid Response Team. Ticket Token: <span className="font-mono font-bold text-emerald-600">EMG-IND-911-04</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
