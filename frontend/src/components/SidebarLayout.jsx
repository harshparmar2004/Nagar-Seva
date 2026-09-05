import { API_BASE_URL } from '../config';
import { FALLBACK_WARDS } from '../data/fallbackData';
import React, { useState, useEffect } from 'react';
import {
  Shield, Mic, ListChecks, Search, ThumbsUp, Layers, MapPin, Flame,
  TrendingUp, Sparkles, BarChart3, Database, LogIn, LogOut, CheckCircle2,
  Lock, Globe, AlertOctagon, HelpCircle, ArrowRight, UserCheck, ChevronRight, Menu, X, Trophy, AlertTriangle, ShieldAlert, Compass, User, Settings
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    { id: 'citizen-voice', label: 'Submit Citizen Request', icon: Mic },
    { id: 'citizen-my-complaints', label: 'My Registered Complaints', icon: ListChecks },
    { id: 'citizen-track', label: 'Track Any Token Status', icon: Search },
    { id: 'citizen-upvote', label: 'Community Project Support', icon: ThumbsUp },
    { id: 'citizen-scorecard', label: 'Ward Swachhata Scorecard', icon: Trophy },
    { id: 'citizen-settings', label: 'Settings & Live Location', icon: Settings },
    { id: 'citizen-emergency', label: '24/7 Red Alert Hotline', icon: AlertOctagon, isEmergency: true },
  ];

  const adminNavItems = [
    { id: 'admin-gis', label: 'City GIS Map & Demand Overview', icon: MapPin },
    { id: 'admin-heatmap', label: 'City Heatmap Analytics', icon: Flame },
    { id: 'admin-clusters', label: 'Master Complaints Approval', icon: Layers },
    { id: 'admin-analytics', label: 'Data Fusion Analytics', icon: TrendingUp },
    { id: 'admin-dpr', label: 'AI DPR & Priority Rankings', icon: Sparkles },
    { id: 'admin-roles', label: 'Super Admin Gmail Roles', icon: Shield },
    { id: 'admin-emergency', label: 'District 181 Control Room', icon: ShieldAlert, isEmergency: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/20 to-stone-100 flex flex-col font-sans text-stone-900">
      
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-2.5 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-xs">
        
        {/* Left: Mobile Menu Toggle & Enlarge NagarSeva Branding */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Toggle Navigation Menu"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/20 shrink-0">
              <Shield className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
            <span className="font-black text-stone-900 tracking-tight text-lg sm:text-xl md:text-2xl select-none">
              NagarSeva
            </span>
          </div>
        </div>

        {/* Right: Live Location Badge on the right side at the end */}
        <div className="flex items-center justify-end shrink-0">
          <div
            className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md px-2.5 sm:px-3 py-1.5 font-bold max-w-[150px] sm:max-w-[260px] md:max-w-md lg:max-w-lg truncate shadow-2xs"
            title={liveLocationStr}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
            <span className="truncate">{liveLocationStr}</span>
          </div>
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
            {isSuperAdmin ? (
              <div className="p-3 rounded-xl border bg-stone-900 border-stone-800 text-white text-xs flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[11px] uppercase tracking-wider">Super Admin Suite</p>
                    <p className="text-[10px] text-stone-400">Executive Command Center</p>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-orange-600 text-white">
                  ADMIN
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border bg-orange-50/70 border-orange-200 text-orange-950 text-xs flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-orange-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-[11px] uppercase tracking-wider">Citizen Services</p>
                    <p className="text-[10px] text-orange-700">Public Grievances & Ward Tracking</p>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  CITIZEN
                </span>
              </div>
            )}

            {/* IF CITIZEN: RENDER ONLY CITIZEN NAVIGATION */}
            {!isSuperAdmin && (
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
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                        ${item.isEmergency
                          ? isActive
                            ? 'bg-red-600 text-white shadow-xs font-black'
                            : 'bg-red-50 text-red-700 border border-red-200/80 hover:bg-red-100 font-bold'
                          : isActive
                            ? 'bg-orange-50 text-orange-950 border border-orange-200/90 shadow-2xs font-black'
                            : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <Icon className={`w-4 h-4 shrink-0 ${
                          item.isEmergency
                            ? (isActive ? 'text-white animate-pulse' : 'text-red-600 animate-pulse')
                            : (isActive ? 'text-orange-600' : 'text-stone-400')
                        }`} />
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${item.isEmergency ? 'text-white' : 'text-orange-600'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* IF SUPER ADMIN: RENDER ONLY SUPER ADMIN NAVIGATION */}
            {isSuperAdmin && (
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
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left
                        ${item.isEmergency
                          ? isActive
                            ? 'bg-red-600 text-white shadow-xs font-black'
                            : 'bg-red-50 text-red-700 border border-red-200/80 hover:bg-red-100 font-bold'
                          : isActive
                            ? 'bg-stone-900 text-white shadow-2xs font-black'
                            : 'text-stone-700 hover:bg-stone-100/80 hover:text-stone-900'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <Icon className={`w-4 h-4 shrink-0 ${
                          item.isEmergency
                            ? (isActive ? 'text-white animate-pulse' : 'text-red-600 animate-pulse')
                            : (isActive ? 'text-orange-400' : 'text-stone-400')
                        }`} />
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-orange-400" />}
                    </button>
                  );
                })}
              </div>
            )}

          </div>

          {/* SIDEBAR FOOTER: USER AUTHENTICATION & LOGOUT HUB */}
          <div className="space-y-2 pt-3 border-t border-stone-200/90">
            {currentUser ? (
              <div className="bg-stone-50/90 hover:bg-stone-50 border border-stone-200/90 rounded-xl p-2.5 space-y-2 shadow-2xs transition-all">
                {/* User Identity Row (Avatar + Name + Citizen Badge) */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    onClick={() => {
                      setActiveTab(isSuperAdmin ? 'admin-roles' : 'citizen-settings');
                      setIsMobileOpen(false);
                    }}
                    className="flex items-center space-x-2.5 min-w-0 cursor-pointer flex-1 group"
                    title="View Civic Profile & Settings"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={currentUser.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                        alt="User Avatar"
                        className="w-9 h-9 rounded-lg object-cover border border-stone-200 shadow-2xs group-hover:ring-2 group-hover:ring-orange-500/30 transition-all"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" title="Active Online"></span>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-black text-stone-900 leading-tight truncate group-hover:text-orange-600 transition-colors">
                        {currentUser.displayName || 'Citizen'}
                      </p>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded mt-0.5 inline-block border ${
                        isSuperAdmin
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {isSuperAdmin ? 'SUPER ADMIN' : 'CITIZEN'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(isSuperAdmin ? 'admin-roles' : 'citizen-settings');
                      setIsMobileOpen(false);
                    }}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
                    title="Civic Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Integrated Logout of NagarSeva Button */}
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 transition-all cursor-pointer shadow-2xs group"
                  title="Log Out of NagarSeva"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                  <span>Log Out of NagarSeva</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold text-stone-900 hover:text-white bg-stone-100 hover:bg-stone-900 border border-stone-200 transition-all cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In to NagarSeva</span>
              </button>
            )}

            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 text-center">
              <p className="text-[11px] font-extrabold text-stone-800">
                {isSuperAdmin ? 'NagarSeva Administrative Suite' : 'Swachh Survekshan #1 Indore'}
              </p>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                Indore Municipal Corporation • Digital Public Infrastructure
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
        {!isSuperAdmin ? (
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

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-5 shadow-2xl animate-scale-in text-center">
            
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">Confirm Logout</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Are you sure you want to log out from NagarSeva DPI? Your verified civic profile and grievance records will remain securely saved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/30"
              >
                Yes, Log Out
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
