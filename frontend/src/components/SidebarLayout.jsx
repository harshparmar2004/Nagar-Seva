import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import {
  Shield, Mic, ListChecks, Search, ThumbsUp, Layers, MapPin, Flame,
  TrendingUp, Sparkles, BarChart3, Database, LogIn, LogOut, CheckCircle2,
  Lock, Globe, AlertOctagon, HelpCircle, ArrowRight, UserCheck, ChevronRight, Menu, X, Trophy, AlertTriangle, ShieldAlert, Compass
} from 'lucide-react';

export default function SidebarLayout({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  children,
  activeCountry,
  setActiveCountry,
  isSuperAdmin
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [liveLocationStr, setLiveLocationStr] = useState('📍 Fetching Live GPS Geotag...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const res = await fetch(`${API_BASE_URL}/api/geotag/resolve?lat=${lat}&lng=${lng}`);
            const data = await res.json();
            if (data && data.status === 'SUCCESS') {
              const localityPart = data.address ? data.address.split(',')[0] : 'Indore Sector';
              const cleanWardTitle = data.ward_name ? data.ward_name.split('—')[1] : `Ward ${data.ward_number}`;
              setLiveLocationStr(`📍 ${localityPart} (Ward ${data.ward_number}: ${cleanWardTitle.trim()}) • [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
            } else {
              setLiveLocationStr(`📍 GPS Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} • Ward 52 (Musakhedi & Mayur Nagar)`);
            }
          } catch (e) {
            setLiveLocationStr(`📍 GPS Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} • Ward 52 (Musakhedi & Mayur Nagar)`);
          }
        },
        (err) => {
          console.warn("GPS lookup error:", err);
          setLiveLocationStr('📍 Ward 52 (Musakhedi, Mayur Nagar, Indore)');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLiveLocationStr('📍 Ward 52 (Musakhedi, Mayur Nagar, Indore)');
    }
  }, []);

  const citizenNavItems = [
    { id: 'citizen-voice', label: 'Submit Citizen Request Wizard', icon: Mic },
    { id: 'citizen-my-complaints', label: 'My Registered Complaints', icon: ListChecks },
    { id: 'citizen-track', label: 'Track Any Token Status', icon: Search },
    { id: 'citizen-upvote', label: 'Community Project Support', icon: ThumbsUp },
    { id: 'citizen-scorecard', label: 'Ward Swachhata & Garbage Tracker', icon: Trophy },
    { id: 'citizen-emergency', label: '24/7 Red Alert Hotline', icon: AlertOctagon, isEmergency: true },
  ];

  const adminNavItems = [
    { id: 'admin-gis', label: 'City GIS Map & Demand Overview', icon: MapPin, badge: 'GIS' },
    { id: 'admin-heatmap', label: 'City Heatmap Analytics', icon: Flame, badge: 'Heatmap' },
    { id: 'admin-clusters', label: 'Master Complaints Approval', icon: Layers, badge: 'Approve' },
    { id: 'admin-analytics', label: 'Data Fusion Analytics', icon: TrendingUp, badge: 'Analytics' },
    { id: 'admin-dpr', label: 'AI DPR & Priority Rankings', icon: Sparkles, badge: 'AI DPR' },
    { id: 'admin-roles', label: 'Super Admin Gmail Roles', icon: Shield, badge: 'RBAC' },
    { id: 'admin-emergency', label: 'District 181 Control Room', icon: ShieldAlert, badge: '181 Hotline', isEmergency: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/20 to-stone-100 flex flex-col font-sans text-stone-900">
      
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Left: Mobile Menu Toggle & App Branding */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-9.5 h-9.5 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/20">
              <Shield className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-stone-900 tracking-tight text-lg">NagarSeva DPI</span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                  🏆 SWACHH SURVEKSHAN #1 INDORE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live GPS Badge & Auth Status */}
        <div className="flex items-center space-x-3">
          
          {/* Live GPS Location Badge */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3 py-1.5 font-bold">
            <Compass className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>{liveLocationStr}</span>
          </div>

          {/* User Auth Login Status */}
          {currentUser ? (
            <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-xl p-1 pr-3">
              <img
                src={currentUser.photoURL}
                alt="User Avatar"
                className="w-7 h-7 rounded-lg object-cover"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-stone-900 leading-none">{currentUser.displayName}</p>
                <p className="text-[10px] font-semibold text-orange-600 uppercase mt-0.5">
                  {currentUser.role}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="text-stone-400 hover:text-stone-700 p-1 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In (Google Gmail)</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`
          fixed lg:sticky top-[65px] z-30 w-72 h-[calc(100vh-65px)] bg-white border-r border-stone-200/90 p-4 space-y-6 flex flex-col justify-between overflow-y-auto transition-all duration-300
          ${isMobileOpen ? 'left-0 shadow-2xl' : '-left-72 lg:left-0'}
        `}>
          
          <div className="space-y-6">
            
            {/* CITIZEN GOVERNANCE NAVIGATION */}
            <div className="space-y-2">
              <div className="px-3 text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">
                Citizen Governance Portal
              </div>
              <div className="space-y-1">
                {citizenNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer
                        ${item.isEmergency
                          ? isActive
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-black'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : isActive
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${item.isEmergency ? (isActive ? 'text-white animate-pulse' : 'text-red-600 animate-pulse') : (isActive ? 'text-orange-600' : 'text-stone-400')}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* POLICYMAKER & SUPER ADMIN NAVIGATION */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="px-3 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-wider">
                  Policymaker Intelligence
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                  <Shield className="w-3 h-3 text-emerald-600" /> Official DPI
                </span>
              </div>

              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer
                        ${item.isEmergency
                          ? isActive
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : isActive
                            ? 'bg-orange-50 text-orange-800 border border-orange-300 shadow-sm'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 ${item.isEmergency ? 'text-red-600' : (isActive ? 'text-orange-600' : 'text-stone-400')}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        item.isEmergency
                          ? 'bg-red-600 text-white'
                          : (isActive ? 'bg-orange-200 text-orange-800' : 'bg-stone-100 text-stone-500')
                      }`}>
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sidebar Footer: DPI Governance Badge */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 text-center space-y-1">
            <p className="text-[11px] font-extrabold text-stone-800">Swachh Survekshan #1 Indore</p>
            <p className="text-[10px] text-stone-500 font-medium">Digital Public Infrastructure (DPI) • Built with Google AI</p>
          </div>

        </aside>

        {/* MAIN CONTENT WORKSPACE */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
