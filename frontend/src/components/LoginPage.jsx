import React, { useState } from 'react';
import { Shield, User, ArrowRight, AlertCircle, Compass, CreditCard, Mail, CheckCircle2, Sparkles, ChevronRight, Lock, MapPin, Mic, Phone, Smartphone } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isSuperAdminEmail, syncUserToFirestore, getUserProfileFromFirestore } from '../lib/firebase';
import { API_BASE_URL } from '../config';

export default function LoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step state: 'SIGN_IN' | 'PROFILE_SETUP' | 'PERMISSIONS'
  const [step, setStep] = useState('SIGN_IN');
  const [authenticatedGoogleUser, setAuthenticatedGoogleUser] = useState(null);

  // Permissions state
  const [locationGranted, setLocationGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [pendingUserObj, setPendingUserObj] = useState(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Profile setup form state
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaar(formatted);
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000, maximumAge: 0
        });
      });
      console.log("Location granted:", pos.coords.latitude, pos.coords.longitude);
      setLocationGranted(true);
      return true;
    } catch (err) {
      console.warn("Location denied:", err.message);
      setLocationGranted(false);
      return false;
    }
  };

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the mic immediately — we just needed the permission
      stream.getTracks().forEach(track => track.stop());
      console.log("Microphone granted");
      setMicGranted(true);
      return true;
    } catch (err) {
      console.warn("Microphone denied:", err.message);
      setMicGranted(false);
      return false;
    }
  };

  // Request all permissions at once
  const requestAllPermissions = async () => {
    setPermissionsLoading(true);
    setError(null);
    const [locResult, micResult] = await Promise.all([
      requestLocationPermission(),
      requestMicPermission()
    ]);
    setPermissionsLoading(false);

    if (locResult && micResult) {
      // Both granted — proceed to portal
      finishLogin(pendingUserObj);
    } else {
      const denied = [];
      if (!locResult) denied.push('Location');
      if (!micResult) denied.push('Microphone');
      setError(`${denied.join(' & ')} permission denied. Please allow access in your browser settings and try again.`);
    }
  };

  // Final login — called only after permissions step
  const finishLogin = (userObj) => {
    try {
      localStorage.setItem('nagarmitra_user', JSON.stringify(userObj));
      // Save to persistent profiles dictionary (keyed by email) so it survives logouts
      if (userObj?.email) {
        const saved = JSON.parse(localStorage.getItem('nagarmitra_saved_profiles') || '{}');
        saved[userObj.email.toLowerCase().trim()] = userObj;
        localStorage.setItem('nagarmitra_saved_profiles', JSON.stringify(saved));
      }
    } catch(e) {}
    onLoginSuccess(userObj);
    syncUserToBackend(userObj).catch(() => {});
  };

  // Navigate to permissions step (stores user, shows permissions UI)
  const proceedToPermissionsStep = (userObj) => {
    setPendingUserObj(userObj);
    setLocationGranted(false);
    setMicGranted(false);
    setError(null);
    setStep('PERMISSIONS');
  };

  const syncUserToBackend = async (userObj) => {
    // 1. Save directly to Firebase Firestore Database
    try {
      await syncUserToFirestore(userObj);
    } catch (err) {
      console.warn("Firestore sync error:", err);
    }

    // 2. Save to Backend Database (SQLite CitizenUser table)
    try {
      await fetch(`${API_BASE_URL}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userObj.displayName,
          email: userObj.email,
          aadhaar_number: userObj.aadhaar || '',
          phone_number: userObj.phone || '',
          role: userObj.role || 'CITIZEN'
        })
      });
    } catch (err) {
      console.warn("Backend sync notice:", err);
    }
  };

  /**
   * Primary Step 1: Sign in with Google
   * - If Super Admin (harshparmar686630@gmail.com): direct instant login!
   * - If existing user in Firestore with Aadhaar: direct instant login!
   * - If first-time citizen: proceed to Step 2 to set up Government ID (Aadhaar & Name).
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const verifiedEmail = (user.email || '').toLowerCase().trim();

      if (!verifiedEmail) {
        throw new Error("Could not retrieve email from Google account.");
      }

      // Check if Super Admin
      if (isSuperAdminEmail(verifiedEmail)) {
        const adminUserObj = {
          uid: user.uid,
          email: verifiedEmail,
          displayName: user.displayName || 'Super Administrator',
          aadhaar: 'GOVT-ADMIN-01',
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
          role: 'SUPER_ADMIN'
        };

        proceedToPermissionsStep(adminUserObj);
        return;
      }

      // TIER 1: Check persistent local profiles cache (PER-DEVICE PERSISTENCE ACROSS LOGOUTS)
      try {
        const savedProfiles = JSON.parse(localStorage.getItem('nagarmitra_saved_profiles') || '{}');
        const cached = savedProfiles[verifiedEmail];
        if (cached && cached.aadhaar && cached.role === 'CITIZEN') {
          cached.uid = user.uid;
          cached.photoURL = user.photoURL || cached.photoURL;
          try { localStorage.setItem('nagarmitra_user', JSON.stringify(cached)); } catch(e) {}
          proceedToPermissionsStep(cached);
          return;
        }
      } catch(e) {}

      // TIER 2: Check backend SQLite database (/api/users/{email})
      try {
        const backendRes = await Promise.race([
          fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(verifiedEmail)}`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData && backendData.found && backendData.user?.aadhaar_number) {
            const citizenUserObj = {
              uid: user.uid,
              email: verifiedEmail,
              displayName: backendData.user.name || user.displayName || verifiedEmail.split('@')[0],
              aadhaar: backendData.user.aadhaar_number,
              phone: backendData.user.phone_number || '',
              photoURL: user.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
              role: backendData.user.role || 'CITIZEN'
            };
            // Cache locally so subsequent logins on this device are instant
            try {
              const saved = JSON.parse(localStorage.getItem('nagarmitra_saved_profiles') || '{}');
              saved[verifiedEmail] = citizenUserObj;
              localStorage.setItem('nagarmitra_saved_profiles', JSON.stringify(saved));
              localStorage.setItem('nagarmitra_user', JSON.stringify(citizenUserObj));
            } catch(e) {}
            proceedToPermissionsStep(citizenUserObj);
            return;
          }
        }
      } catch(e) {
        console.warn("Backend user check note:", e.message);
      }

      // TIER 3: Check Firebase Firestore (/users/{email})
      try {
        const firestoreProfile = await Promise.race([
          getUserProfileFromFirestore(verifiedEmail),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
        ]);
        if (firestoreProfile && firestoreProfile.aadhaar) {
          const citizenUserObj = {
            uid: user.uid,
            email: verifiedEmail,
            displayName: firestoreProfile.name || user.displayName || verifiedEmail.split('@')[0],
            aadhaar: firestoreProfile.aadhaar,
            phone: firestoreProfile.phone || '',
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            role: firestoreProfile.role || 'CITIZEN'
          };
          try {
            const saved = JSON.parse(localStorage.getItem('nagarmitra_saved_profiles') || '{}');
            saved[verifiedEmail] = citizenUserObj;
            localStorage.setItem('nagarmitra_saved_profiles', JSON.stringify(saved));
            localStorage.setItem('nagarmitra_user', JSON.stringify(citizenUserObj));
          } catch(e) {}
          proceedToPermissionsStep(citizenUserObj);
          return;
        }
      } catch(e) {
        console.warn("Firestore profile check note:", e.message);
      }

      // TIER 4: Brand-new citizen -> show profile setup with pre-filled Google account data
      setAuthenticatedGoogleUser(user);
      setName(user.displayName || '');
      setEmail(verifiedEmail);
      setStep('PROFILE_SETUP');

    } catch (err) {
      console.warn("Google popup error:", err);
      setError(err.message || "Google Sign-In popup could not complete. Please check popup permissions.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Complete Profile Setup for Citizen
   * Saves Name, Aadhaar Card, Mobile Phone Number, and Email into Firebase & Backend SQLite
   */
  const handleCompleteProfile = async (e) => {
    e?.preventDefault();
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    const cleanPhone = phone.replace(/\D/g, '');

    if (!name.trim()) {
      setError("Please enter your Full Name as per government ID.");
      return;
    }
    if (!cleanAadhaar) {
      setError("Please enter your 12-digit Aadhaar Card number.");
      return;
    }
    if (cleanAadhaar.length !== 12) {
      setError("Aadhaar Card number must be exactly 12 digits.");
      return;
    }
    if (!cleanPhone) {
      setError("Please enter your 10-digit mobile phone number.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError("Mobile phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    const verifiedEmail = email.trim().toLowerCase() || (authenticatedGoogleUser?.email || '').toLowerCase().trim();
    const isAdmin = isSuperAdminEmail(verifiedEmail);

    const userObj = {
      uid: authenticatedGoogleUser?.uid || `usr-${Date.now()}`,
      email: verifiedEmail,
      displayName: name.trim(),
      aadhaar: cleanAadhaar,
      phone: cleanPhone,
      photoURL: authenticatedGoogleUser?.photoURL || (isAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'),
      role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
    };

    // Save session & permanent profile cache
    try {
      localStorage.setItem('nagarmitra_user', JSON.stringify(userObj));
      const saved = JSON.parse(localStorage.getItem('nagarmitra_saved_profiles') || '{}');
      saved[verifiedEmail] = userObj;
      localStorage.setItem('nagarmitra_saved_profiles', JSON.stringify(saved));
    } catch(e) {}

    // Sync to backend SQLite & Firebase Firestore in background
    syncUserToBackend(userObj).catch(() => {});

    setLoading(false);
    proceedToPermissionsStep(userObj);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-orange-50/40 to-stone-200 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-stone-900">
      
      {/* Brand Header */}
      <div className="max-w-md w-full text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/30 mb-2">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          NagarSeva DPI
        </h1>
        <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">
          Indore Municipal Corporation • Digital Public Infrastructure
        </p>
        <div className="inline-flex items-center gap-1 bg-white border border-stone-200 text-stone-700 text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>🏆 Swachh Survekshan #1 Cleanest City in India</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl transition-all">

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: DIRECT SIGN IN WITH GOOGLE */}
        {step === 'SIGN_IN' && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-extrabold text-stone-900">Unified Portal Sign In</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Authenticate securely with your Google account to access your Citizen Portal or Administrator Dashboard.
              </p>
            </div>

            {/* Prominent Google Sign-In Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 border border-stone-800"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{loading ? 'Authenticating with Google...' : 'Sign In with Google'}</span>
              </button>
            </div>

            {/* Security Badges */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                <Lock className="w-3.5 h-3.5 text-stone-700 shrink-0" />
                <span>Super Admin is automatically routed directly to the Executive Command Center.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Citizens will be guided to link their government ID & ward coordinates.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE SETUP (FOR CITIZENS) */}
        {step === 'PROFILE_SETUP' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-orange-600" />
                <span>Step 2: Citizen Profile Setup</span>
              </div>
              <h2 className="text-lg font-extrabold text-stone-900 mt-1">Complete Citizen Identity</h2>
              <p className="text-xs text-stone-500">
                Please verify your details and enter your 12-digit Aadhaar Card number as per government records.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                  <span>Full Name (as per Aadhaar Card)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
              </div>

              {/* 12-Digit Aadhaar */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                  <span>12-Digit Aadhaar Card Number</span>
                </label>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={handleAadhaarChange}
                  placeholder="e.g. 4821 5920 8312"
                  maxLength={14}
                  required
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all tracking-wider font-mono font-semibold"
                />
                <p className="text-[10px] text-stone-400 mt-1">Encrypted and securely synced with Municipal Identity Records.</p>
              </div>

              {/* 10-Digit Mobile Phone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mobile Phone Number (10 Digits)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-stone-400 select-none">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="98260 12345"
                    maxLength={10}
                    required
                    className="w-full text-xs pl-11 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all tracking-wider font-mono font-semibold"
                  />
                </div>
                <p className="text-[10px] text-stone-400 mt-1">For official municipal grievance updates and WhatsApp alerts.</p>
              </div>

              {/* Email (Pre-filled & verified from Google) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-600" />
                    <span>Verified Google Email</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Saving Profile to Firebase...' : 'Save Profile & Enter Citizen Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('SIGN_IN')}
                className="w-full text-stone-400 hover:text-stone-600 text-[11px] font-medium py-1 transition-colors cursor-pointer"
              >
                ← Back to Google Sign In
              </button>
            </div>

          </form>
        )}

        {/* STEP 3: MANDATORY PERMISSIONS */}
        {step === 'PERMISSIONS' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                <Shield className="w-3 h-3 text-blue-600" />
                <span>Device Permissions Required</span>
              </div>
              <h2 className="text-lg font-extrabold text-stone-900 mt-1">Grant Access to Continue</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                NagarSeva requires live location and microphone access to verify your ward, enable voice-based complaint filing, and ensure accurate geo-tagging.
              </p>
            </div>

            {/* Permission Cards */}
            <div className="space-y-3">
              {/* Location Permission */}
              <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                locationGranted 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-stone-50 border-stone-200'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  locationGranted ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-800">Live Location Access</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Auto-detect ward, geo-tag complaints & verify proximity</p>
                </div>
                {locationGranted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-stone-300 shrink-0" />
                )}
              </div>

              {/* Microphone Permission */}
              <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                micGranted 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-stone-50 border-stone-200'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  micGranted ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-800">Microphone Access</p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Voice-based complaint filing & AI-assisted descriptions</p>
                </div>
                {micGranted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-stone-300 shrink-0" />
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-1 space-y-2">
              {locationGranted && micGranted ? (
                <button
                  type="button"
                  onClick={() => finishLogin(pendingUserObj)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>All Permissions Granted — Enter Portal</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={requestAllPermissions}
                    disabled={permissionsLoading}
                    className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Shield className="w-5 h-5" />
                    <span>{permissionsLoading ? 'Requesting Permissions...' : 'Grant Location & Mic Access'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => finishLogin(pendingUserObj)}
                    className="w-full bg-stone-100 hover:bg-stone-200 active:scale-[0.99] text-stone-700 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-stone-300"
                  >
                    <span>Continue to Portal (Toggle Location later in Settings)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <p className="text-[10px] text-stone-400 text-center mt-1">
                Permissions can be toggled anytime inside the Citizen Portal → Settings.
              </p>
            </div>
          </div>
        )}

      </div>

      <p className="text-center text-[11px] text-stone-400 mt-6">
        NagarSeva Digital Public Infrastructure (DPI) • Built with Google AI & Firebase
      </p>

    </div>
  );
}
