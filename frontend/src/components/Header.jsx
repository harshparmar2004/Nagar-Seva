import React from 'react';
import { Shield, Sparkles, MapPin, Layers, BarChart2, Globe, Cpu } from 'lucide-react';

export default function Header({ currentView, setCurrentView, activeCountry, setActiveCountry }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('citizen')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">NagarSeva <span className="text-blue-500">DPI</span></span>
                <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Google Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Digital Public Infrastructure for Governance | GDG Indore</p>
            </div>
          </div>

          {/* Navigation View Pills */}
          <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setCurrentView('citizen')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'citizen'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Citizen Voice Portal</span>
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Policymaker Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                currentView === 'analytics'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Data Fusion Analytics</span>
            </button>
          </div>

          {/* BRICS Localization Switcher */}
          <div className="flex items-center space-x-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">DPG Adapter:</span>
            <select
              value={activeCountry}
              onChange={(e) => setActiveCountry(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="IN" className="bg-slate-800 text-white">ðŸ‡®ðŸ‡³ India (Indore IMC)</option>
              <option value="BR" className="bg-slate-800 text-white">ðŸ‡§ðŸ‡· Brazil (SÃ£o Paulo)</option>
              <option value="ZA" className="bg-slate-800 text-white">ðŸ‡¿ðŸ‡¦ South Africa (Joburg)</option>
            </select>
          </div>

        </div>
      </div>
    </header>
  );
}
