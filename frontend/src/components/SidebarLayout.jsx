import { API_BASE_URL } from '../config';
import { FALLBACK_WARDS } from '../data/fallbackData';
import React, { useState, useEffect } from 'react';
import {
  Shield, Mic, ListChecks, Search, ThumbsUp, Layers, MapPin, Flame,
  TrendingUp, Sparkles, BarChart3, Database, LogIn, LogOut, CheckCircle2,
  Lock, Globe, AlertOctagon, HelpCircle, ArrowRight, UserCheck, ChevronRight, Menu, X, Trophy, AlertTriangle, ShieldAlert, Compass, User
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
  isSuperAdmin,
  currentPortal,
  onSwitchPortal
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [liveLocationStr, setLiveLocationStr] = useState('📍 Fetching Live GPS Geotag...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lng);

          // 1. Dynamic client-side nearest ward calculation among all 85 wards
          let matchedWard = null;
          if (FALLBACK_WARDS && FALLBACK_WARDS.length > 0) {
            matchedWard = FALLBACK_WARDS.reduce((prev, curr) => {
              const prevDist = Math.hypot(latNum - (prev.lat || 22.7196), lngNum - (curr.lng || 75.8577));
              const currDist = Math.hypot(latNum - (curr.lat || 22.7196), lngNum - (curr.lng || 75.8577));
              return currDist < prevDist ? curr : prev;
            }, FALLBACK_WARDS[0]);
          }

          if (matchedWard) {
            setLiveLocationStr(`📍 ${matchedWard.name} • [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
          } else {
            setLiveLocationStr(`📍 Indore • GPS [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
          }

          // 2. OpenStreetMap Nominatim universal reverse geocode for exact neighborhood & city
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const addr = geoData.address || {};
              let place = geoData.name || addr.square || addr.suburb || addr.neighbourhood || addr.residential || addr.village;
              const city = addr.city || addr.town || addr.county || 'Indore';
              if (!place || place.toLowerCase().includes('indore city') || place.toLowerCase().includes('tahsil')) {
                try {
                  const r15 = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=15`);
                  if (r15.ok) {
                    const d15 = await r15.json();
                    place = d15.name || d15.address?.square || d15.address?.suburb || d15.address?.neighbourhood || place;
                  }
                } catch (e) {}
              }
              const displayPlace = (place && !place.toLowerCase().includes('tahsil')) ? place : city;
              setLiveLocationStr(`📍 ${displayPlace}, ${city} • [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
              return;
            }
          } catch (e) {}

          // 3. Fallback to backend API
          try {
            const res = await fetch(`${API_BASE_URL}/api/geotag/resolve?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.status === 'SUCCESS') {
                const localityPart = data.address ? data.address.split(',')[0] : 'Indore Sector';
                const cleanWardTitle = data.ward_name ? data.ward_name.split('—')[1] : `Ward ${data.ward_number}`;
                setLiveLocationStr(`📍 ${localityPart} (Ward ${data.ward_number}: ${cleanWardTitle?.trim() || ''}) • [${lat.toFixed(4)}, ${lng.toFixed(4)}]`);
              }
            }
          } catch (e) {}
        },
        (err) => {
          console.warn("GPS lookup error:", err);
          setLiveLocationStr('📍 Indore Municipal Corporation, MP');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLiveLocationStr('📍 Indore Municipal Corporation, MP');
    }
  }, []);

  const citizenNavItems = [
    { id: 'citizen-voice', label: 'Submit Citizen Request', icon: Mic, badge: 'Lodge' },
    { id: 'citizen-my-complaints', label: 'My Registered Complaints', icon: ListChecks, badge: 'My Tokens' },
    { id: 'citizen-track', label: 'Track Any Token Status', icon: Search, badge: 'Track' },
    { id: 'citizen-upvote', label: 'Community Project Support', icon: ThumbsUp, badge: 'Support' },
    { id: 'citizen-scorecard', label: 'Ward Swachhata Scorecard', icon: Trophy, badge: 'Ward #1' },
    { id: 'citizen-emergency', label: '24/7 Red Alert Hotline', icon: AlertOctagon, isEmergency: true, badge: '181' },
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

  const isCitizenPortal = currentPortal === 'CITIZEN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/20 to-stone-100 flex flex-col font-sans text-stone-900">
      
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-xs">
        
        {/* Left: Mobile Menu Toggle & App Branding */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/20 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg">NagarSeva</span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-orange-200 hidden sm:inline-block">
                  🏆 SWACHH INDORE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Two Distinct Portal Switcher Tabs */}
        <div className="flex items-center p-1 bg-stone-100/90 rounded-2xl border border-stone-200 shrink-0">
          <button
            onClick={() => onSwitchPortal('CITIZEN')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCitizenPortal
                ? 'bg-white text-orange-700 shadow-sm border border-stone-200/80 font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">Citizen Portal</span>
            <span className="sm:hidden">Citizen</span>
            {isCitizenPortal && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => onSwitchPortal('SUPER_ADMIN')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isCitizenPortal
                ? 'bg-stone-900 text-white shadow-sm font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${!isCitizenPortal ? 'text-orange-400' : 'text-stone-500'}`} />
            <span className="hidden sm:inline">Super Admin Portal</span>
            <span className="sm:hidden">Admin</span>
            {!isSuperAdmin && (
              <Lock className="w-3 h-3 text-stone-400" />
            )}
            {!isCitizenPortal && (
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Right: Live GPS Badge & Auth Status / Login Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          
          {/* Live GPS Location Badge */}
          <div className="hidden xl:flex items-center space-x-1.5 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-2.5 py-1.5 font-bold max-w-xs truncate">
            <Compass className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
            <span className="truncate">{liveLocationStr}</span>
          </div>

          {/* User Auth Login Status / Login Button */}
          {currentUser && currentUser.uid !== 'citizen-guest' ? (
            <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-xl p-1 pr-2.5">
              <img
                src={currentUser.photoURL}
                alt="User Avatar"
                className="w-7 h-7 rounded-lg object-cover border border-stone-200"
              />
              <div className="text-left hidden sm:block max-w-[130px] truncate">
                <p className="text-xs font-bold text-stone-900 leading-none truncate">{currentUser.displayName}</p>
                <span className={`text-[9px] font-extrabold uppercase px-1 py-0.2 rounded mt-0.5 inline-block ${
                  isSuperAdmin ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-stone-400 hover:text-stone-700 p-1 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-orange-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Sign In (Google)</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={`
          fixed lg:sticky top-[57px] z-30 w-72 h-[calc(100vh-57px)] bg-white border-r border-stone-200/90 p-4 space-y-5 flex flex-col justify-between overflow-y-auto transition-all duration-300
          ${isMobileOpen ? 'left-0 shadow-2xl' : '-left-72 lg:left-0'}
        `}>
          
          <div className="space-y-4">
            
            {/* PORTAL MODE BANNER */}
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              isCitizenPortal
                ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                : 'bg-stone-900 border-stone-800 text-white'
            }`}>
              <div className="flex items-center space-x-2">
                {isCitizenPortal ? (
                  <User className="w-4 h-4 text-orange-600" />
                ) : (
                  <Shield className="w-4 h-4 text-orange-400" />
                )}
                <div>
                  <p className="font-extrabold text-[11px] uppercase tracking-wider">
                    {isCitizenPortal ? 'Citizen Governance' : 'Super Admin Portal'}
                  </p>
                  <p className={`text-[10px] ${isCitizenPortal ? 'text-orange-700' : 'text-stone-400'}`}>
                    {isCitizenPortal ? 'Public Citizen Services' : 'Executive Command Center'}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                isCitizenPortal ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-600 text-white'
              }`}>
                ACTIVE
              </span>
            </div>

            {/* IF CITIZEN PORTAL: RENDER ONLY CITIZEN NAVIGATION */}
            {isCitizenPortal && (
              <div className="space-y-1.5">
                <div className="px-2 text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                  Citizen Services
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
                              ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm font-black'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${item.isEmergency ? (isActive ? 'text-white animate-pulse' : 'text-red-600 animate-pulse') : (isActive ? 'text-orange-600' : 'text-stone-400')}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            item.isEmergency
                              ? 'bg-red-600 text-white'
                              : (isActive ? 'bg-orange-200 text-orange-800' : 'bg-stone-100 text-stone-500')
                          }`}>
                            {item.badge}
                          </span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* IF SUPER ADMIN PORTAL: RENDER ONLY SUPER ADMIN NAVIGATION */}
            {!isCitizenPortal && (
              <div className="space-y-1.5">
                <div className="px-2 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">
                    Administrative Intelligence
                  </span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                    <Shield className="w-2.5 h-2.5 text-emerald-600" /> Authorized
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
                              ? 'bg-stone-900 text-white shadow-sm font-black'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${item.isEmergency ? 'text-red-600' : (isActive ? 'text-orange-400' : 'text-stone-400')}`} />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            item.isEmergency
                              ? 'bg-red-600 text-white'
                              : (isActive ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500')
                          }`}>
                            {item.badge}
                          </span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR FOOTER: PORTAL SWITCH CALLOUT & SWACHH INDORE BADGE */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            {isCitizenPortal ? (
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-700">
                  <Shield className="w-3.5 h-3.5 text-orange-600" />
                  <span>Municipal Official Login</span>
                </div>
                <p className="text-[10px] text-stone-500">
                  Are you a city engineer or policymaker?
                </p>
                <button
                  onClick={() => onSwitchPortal('SUPER_ADMIN')}
                  className="w-full py-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Enter Super Admin Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-orange-900">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>Citizen Grievance Mode</span>
                </div>
                <p className="text-[10px] text-stone-600">
                  Switch to citizen portal to lodge or track complaints.
                </p>
                <button
                  onClick={() => onSwitchPortal('CITIZEN')}
                  className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Switch to Citizen Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="text-center">
              <p className="text-[10px] text-stone-400 font-semibold">
                NagarSeva DPI • Built for Indore Municipal Corporation
              </p>
            </div>
          </div>

        </aside>

        {/* Mobile Backdrop Overlay */}
        {isMobileOpen && (
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-20 lg:hidden animate-fade-in"
          />
        )}

        {/* MAIN CONTENT WORKSPACE */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto pb-24 lg:pb-8 w-full">
          {children}
        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-1 py-1 flex items-center justify-around shadow-lg">
        {isCitizenPortal ? (
          <>
            <button
              onClick={() => { setActiveTab('citizen-voice'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'citizen-voice' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <Mic className={`w-5 h-5 ${activeTab === 'citizen-voice' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">Lodge</span>
            </button>

            <button
              onClick={() => { setActiveTab('citizen-my-complaints'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'citizen-my-complaints' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <ListChecks className={`w-5 h-5 ${activeTab === 'citizen-my-complaints' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">My Tokens</span>
            </button>

            <button
              onClick={() => { setActiveTab('citizen-track'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'citizen-track' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <Search className={`w-5 h-5 ${activeTab === 'citizen-track' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">Track</span>
            </button>

            <button
              onClick={() => { setActiveTab('citizen-upvote'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'citizen-upvote' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <ThumbsUp className={`w-5 h-5 ${activeTab === 'citizen-upvote' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">Support</span>
            </button>

            <button
              onClick={() => { setActiveTab('citizen-emergency'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'citizen-emergency' ? 'text-red-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <AlertOctagon className="w-5 h-5 text-red-600 animate-pulse" />
              <span className="text-[10px] mt-0.5 text-red-600 font-bold">181 Alert</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setActiveTab('admin-gis'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin-gis' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <MapPin className={`w-5 h-5 ${activeTab === 'admin-gis' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">GIS Map</span>
            </button>

            <button
              onClick={() => { setActiveTab('admin-heatmap'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin-heatmap' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <Flame className={`w-5 h-5 ${activeTab === 'admin-heatmap' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">Heatmap</span>
            </button>

            <button
              onClick={() => { setActiveTab('admin-clusters'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin-clusters' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <Layers className={`w-5 h-5 ${activeTab === 'admin-clusters' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">Approve</span>
            </button>

            <button
              onClick={() => { setActiveTab('admin-analytics'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin-analytics' ? 'text-orange-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <TrendingUp className={`w-5 h-5 ${activeTab === 'admin-analytics' ? 'text-orange-600 scale-110' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5">Analytics</span>
            </button>

            <button
              onClick={() => { setActiveTab('admin-emergency'); setIsMobileOpen(false); }}
              className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin-emergency' ? 'text-red-600 font-extrabold' : 'text-stone-500 font-semibold'
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
              <span className="text-[10px] mt-0.5 text-red-600 font-bold">181 Hotline</span>
            </button>
          </>
        )}
      </nav>

    </div>
  );
}
