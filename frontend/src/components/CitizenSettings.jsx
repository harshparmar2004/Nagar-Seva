import React, { useState, useEffect } from 'react';
import {
  MapPin, Mic, Shield, CheckCircle2, XCircle, RefreshCw, Navigation,
  User, Mail, CreditCard, Compass, ExternalLink, AlertTriangle, Phone,
  ShieldCheck, Smartphone, Award, Building2, Sparkles
} from 'lucide-react';
import { FALLBACK_WARDS } from '../data/fallbackData';

export default function CitizenSettings({ currentUser }) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationStatus, setLocationStatus] = useState('checking'); // 'granted' | 'denied' | 'prompt' | 'checking'
  const [micStatus, setMicStatus] = useState('checking');
  const [locationCoords, setLocationCoords] = useState(null);
  const [detectedWard, setDetectedWard] = useState(null);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [micLoading, setMicLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Check current permission status on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    // Check Location permission
    try {
      if ('permissions' in navigator) {
        const locPerm = await navigator.permissions.query({ name: 'geolocation' });
        setLocationStatus(locPerm.state);
        setLocationEnabled(locPerm.state === 'granted');
        locPerm.onchange = () => {
          setLocationStatus(locPerm.state);
          setLocationEnabled(locPerm.state === 'granted');
        };

        if (locPerm.state === 'granted') {
          fetchLiveLocation();
        }
      } else {
        // Fallback for browsers without permissions API
        fetchLiveLocation();
      }
    } catch (e) {
      setLocationStatus('prompt');
    }

    // Check Microphone permission
    try {
      if ('permissions' in navigator) {
        const micPerm = await navigator.permissions.query({ name: 'microphone' });
        setMicStatus(micPerm.state);
        micPerm.onchange = () => setMicStatus(micPerm.state);
      } else {
        setMicStatus('prompt');
      }
    } catch (e) {
      setMicStatus('prompt');
    }
  };

  const resolveWardAndAddress = async (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    // 1. Match nearest Indore ward from fallback wards
    if (FALLBACK_WARDS && FALLBACK_WARDS.length > 0) {
      const matched = FALLBACK_WARDS.reduce((prev, curr) => {
        const prevDist = Math.hypot(latNum - (prev.lat || 22.7196), lngNum - (curr.lng || 75.8577));
        const currDist = Math.hypot(latNum - (curr.lat || 22.7196), lngNum - (curr.lng || 75.8577));
        return currDist < prevDist ? curr : prev;
      }, FALLBACK_WARDS[0]);
      setDetectedWard(matched);
    }

    // 2. Reverse geocode via OpenStreetMap Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const place = data.name || addr.suburb || addr.neighbourhood || addr.residential || addr.road || 'Indore';
        const city = addr.city || addr.town || 'Indore';
        setDetectedAddress(`${place}, ${city}`);
      }
    } catch (e) {
      setDetectedAddress('Indore, Madhya Pradesh');
    }
  };

  const fetchLiveLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        setLocationCoords(coords);
        setLocationStatus('granted');
        setLocationEnabled(true);
        setLocationLoading(false);
        setLastUpdated(new Date().toLocaleTimeString());
        resolveWardAndAddress(coords.lat, coords.lng);
      },
      (err) => {
        console.warn("Geolocation query note:", err.message);
        setLocationStatus('denied');
        setLocationEnabled(false);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Toggle handler for Live Location
  const handleToggleLocation = async () => {
    if (locationEnabled) {
      // User turned off
      setLocationEnabled(false);
      setLocationCoords(null);
      setDetectedWard(null);
      setDetectedAddress('');
    } else {
      // User turned on -> trigger live browser location prompt
      fetchLiveLocation();
    }
  };

  // Toggle handler for Microphone
  const handleToggleMic = async () => {
    setMicLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('granted');
    } catch (err) {
      setMicStatus('denied');
    }
    setMicLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'granted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Active
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold border border-red-200">
            <XCircle className="w-3 h-3" /> Blocked
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-bold border border-stone-200">
            <RefreshCw className="w-3 h-3 animate-spin" /> Checking
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">
            <Shield className="w-3 h-3" /> Needs Permission
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-2 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Citizen Portal Settings</h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Manage your live GPS location, microphone permissions, and verified civic profile.
        </p>
      </div>

      {/* VERIFIED CIVIC PROFILE CARD */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-5">
        
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
              Verified Civic Identity & DPI Profile
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              #IND-{currentUser?.aadhaar ? currentUser.aadhaar.slice(-4) : '2026'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200/80 flex items-center gap-1.5 shadow-2xs">
              <Award className="w-3 h-3 text-orange-600" />
              <span>Indore Citizen</span>
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Google Authenticated</span>
            </span>
          </div>
        </div>

        {/* Multi-Column Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Left Column: Avatar & Personal Info (5 cols) */}
          <div className="md:col-span-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                alt="Profile"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-orange-500/30 shadow-md ring-4 ring-orange-50"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs" title="Identity Verified">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 truncate tracking-tight">{currentUser?.displayName || 'Citizen'}</h2>
                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  currentUser?.role === 'SUPER_ADMIN'
                    ? 'bg-stone-900 text-white'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {currentUser?.role === 'SUPER_ADMIN' ? 'ADMIN' : 'CITIZEN'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-500 truncate">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{currentUser?.email}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <Building2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="font-semibold text-stone-700 truncate">Indore Municipal Corporation</span>
              </div>
            </div>
          </div>

          {/* Center Column: Government Identity Credentials (4 cols) */}
          <div className="md:col-span-4 space-y-2.5">
            {/* Aadhaar Credential Box */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between hover:bg-orange-50/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Government Aadhaar ID</span>
                  <span className="font-mono font-bold text-xs text-stone-900 truncate block">
                    {currentUser?.aadhaar && currentUser.aadhaar !== 'GOVT-ADMIN-01'
                      ? currentUser.aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
                      : 'GOVT-ADMIN-01'}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 ml-2">
                Linked
              </span>
            </div>

            {/* Mobile Phone Box */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between hover:bg-emerald-50/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Registered Mobile</span>
                  <span className="font-mono font-bold text-xs text-stone-900 truncate block">
                    {currentUser?.phone
                      ? `+91 ${currentUser.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`
                      : '+91 98260 12345'}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 ml-2">
                Active
              </span>
            </div>
          </div>

          {/* Right Column: DPI Trust & Security Metric (3 cols) */}
          <div className="md:col-span-3 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider">Civic Trust Level</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-white">Tier 1</span>
                <span className="text-[10px] font-bold text-emerald-400">100% DPI Verified</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                Priority grievance routing & AI triage enabled.
              </p>
            </div>
            <div className="w-full bg-stone-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-full"></div>
            </div>
          </div>

        </div>

        {/* Bottom Metadata Ribbon */}
        <div className="pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-stone-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">Encrypted Identity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="truncate">Ward Geofencing Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">AI Fast-Track Eligible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Official IMC DPI Record</span>
          </div>
        </div>

      </div>

      {/* LIVE LOCATION ACCESS CARD WITH PROPER TOGGLE SWITCH */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              locationEnabled && locationCoords ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-400'
            }`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-stone-900">Live GPS Location Access</h3>
                {getStatusBadge(locationStatus)}
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-lg">
                Automatically identify your municipal ward in Indore, auto-attach exact GPS coordinates to filed complaints, and view nearby public work orders.
              </p>
            </div>
          </div>

          {/* TOGGLE SWITCH */}
          <div className="shrink-0 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={locationEnabled}
              onClick={handleToggleLocation}
              disabled={locationLoading}
              className={`
                relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer
                ${locationEnabled ? 'bg-orange-600' : 'bg-stone-300'}
                ${locationLoading ? 'opacity-50 cursor-wait' : ''}
              `}
              title={locationEnabled ? 'Turn Live Location Off' : 'Turn Live Location On'}
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300
                  ${locationEnabled ? 'translate-x-8' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Real-time Location Details (visible when active) */}
        {locationEnabled && locationCoords && (
          <div className="bg-gradient-to-br from-orange-50/70 to-stone-50 border border-orange-200/80 rounded-2xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-extrabold text-orange-950">Live Geotag Active</span>
              </div>
              {lastUpdated && (
                <span className="text-[10px] text-stone-400 font-medium">Updated at {lastUpdated}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  GPS Coordinates
                </span>
                <p className="font-mono font-bold text-stone-800">
                  {locationCoords.lat.toFixed(6)}° N, {locationCoords.lng.toFixed(6)}° E
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">Accuracy: ±{Math.round(locationCoords.accuracy)}m</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Detected Indore Ward
                </span>
                <p className="font-bold text-stone-800 truncate">
                  {detectedWard ? detectedWard.name : 'Resolving ward...'}
                </p>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                  {detectedAddress || 'Indore Municipal Corporation'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={`https://www.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={fetchLiveLocation}
                disabled={locationLoading}
                className="text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-stone-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Location</span>
              </button>
            </div>
          </div>
        )}

        {/* If location was denied by browser */}
        {locationStatus === 'denied' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900 animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Location was blocked in your browser</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              If you previously clicked "Block" or dismissed the location prompt:
            </p>
            <ol className="list-decimal list-inside text-[11px] text-amber-800 space-y-1 pl-1">
              <li>Click the <strong>padlock icon (🔒)</strong> or <strong>tune icon</strong> on the left of your browser address bar.</li>
              <li>Toggle <strong>Location</strong> to <strong>"Allow"</strong>.</li>
              <li>Click the <strong>"Live Locate Me"</strong> button below to acquire your GPS coordinates immediately.</li>
            </ol>
            <div className="pt-2">
              <button
                onClick={fetchLiveLocation}
                disabled={locationLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>{locationLoading ? 'Locating...' : 'Live Locate Me Now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick action button when not enabled */}
        {!locationEnabled && locationStatus !== 'denied' && (
          <button
            onClick={fetchLiveLocation}
            disabled={locationLoading}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            <span>{locationLoading ? 'Acquiring Live GPS...' : 'Enable & Live Locate Indore Ward'}</span>
          </button>
        )}
      </div>

      {/* MICROPHONE PERMISSION CARD */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              micStatus === 'granted' ? 'bg-orange-600 text-white' : 'bg-stone-100 text-stone-400'
            }`}>
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-stone-900">Microphone Audio Access</h3>
                {getStatusBadge(micStatus)}
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-lg">
                Used for voice-based Hindi/Malvi/English citizen grievance filing, auto-transcription with Google Gemini, and emergency SOS dispatch.
              </p>
            </div>
          </div>

          <div className="shrink-0 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={micStatus === 'granted'}
              onClick={handleToggleMic}
              disabled={micLoading}
              className={`
                relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer
                ${micStatus === 'granted' ? 'bg-orange-600' : 'bg-stone-300'}
                ${micLoading ? 'opacity-50 cursor-wait' : ''}
              `}
              title="Toggle Microphone Access"
            >
              <span
                className={`
                  inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300
                  ${micStatus === 'granted' ? 'translate-x-8' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {micStatus !== 'granted' && (
          <button
            onClick={handleToggleMic}
            disabled={micLoading}
            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-stone-300"
          >
            <Mic className="w-4 h-4" />
            <span>{micLoading ? 'Requesting...' : 'Test & Enable Microphone'}</span>
          </button>
        )}
      </div>

      {/* PRIVACY & DATA POLICY */}
      <div className="bg-stone-100/70 border border-stone-200 rounded-3xl p-5 text-center space-y-1">
        <p className="text-xs font-extrabold text-stone-800">
          🛡️ Digital Public Infrastructure Privacy Commitment
        </p>
        <p className="text-[11px] text-stone-500 max-w-lg mx-auto">
          Your live GPS coordinates and audio are accessed exclusively for legitimate municipal services, accurate ward dispatch, and citizen grievance verification.
        </p>
      </div>
    </div>
  );
}
