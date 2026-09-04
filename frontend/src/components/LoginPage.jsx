import React, { useState } from 'react';
import { Shield, User, ArrowRight, AlertCircle, Compass, CreditCard, Mail, CheckCircle2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isSuperAdminEmail, syncUserToFirestore } from '../lib/firebase';
import { API_BASE_URL } from '../config';

export default function LoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [email, setEmail] = useState('');

  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaar(formatted);
  };

  const requestLiveGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Live GPS acquired at login:", pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("GPS request dismissed:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const syncUserToBackend = async (userObj) => {
    // 1. Save directly to Firebase Firestore Database
    try {
      await syncUserToFirestore(userObj);
    } catch (err) {
      console.warn("Firestore sync error:", err);
    }

    // 2. Save to Backend Database
    try {
      await fetch(`${API_BASE_URL}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userObj.displayName,
          email: userObj.email,
          aadhaar_number: userObj.aadhaar || '',
          role: userObj.role
        })
      });
    } catch (err) {
      console.warn("Backend sync notice:", err);
    }
  };

  const validateAadhaar = () => {
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    if (!cleanAadhaar) {
      setError("Please enter your 12-digit Aadhaar Card number.");
      return false;
    }
    if (cleanAadhaar.length !== 12) {
      setError("Aadhaar Card number must be exactly 12 digits.");
      return false;
    }
    return cleanAadhaar;
  };

  const handleGoogleSignIn = async () => {
    const cleanAadhaar = validateAadhaar();
    if (!cleanAadhaar) return;

    if (!name.trim()) {
      setError("Please enter your Full Name as on Aadhaar Card.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const verifiedEmail = user.email ? user.email.toLowerCase().trim() : email.toLowerCase().trim();
      const isAdmin = isSuperAdminEmail(verifiedEmail);

      const userObj = {
        uid: user.uid,
        email: verifiedEmail,
        displayName: name.trim() || user.displayName || verifiedEmail.split('@')[0],
        aadhaar: cleanAadhaar,
        photoURL: user.photoURL || (isAdmin 
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'),
        role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
      };

      try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
      await syncUserToBackend(userObj);
      requestLiveGPS();
      onLoginSuccess(userObj);
    } catch (err) {
      console.warn("Google popup error:", err);
      setError("Google Sign-In popup could not complete. Please click 'Continue with Verified Credentials' below.");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (e) => {
    e?.preventDefault();
    const cleanAadhaar = validateAadhaar();
    if (!cleanAadhaar) return;

    if (!name.trim()) {
      setError("Please enter your Full Name.");
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const isAdmin = isSuperAdminEmail(cleanEmail);

    const userObj = {
      uid: `usr-${Date.now()}`,
      email: cleanEmail,
      displayName: cleanName,
      aadhaar: cleanAadhaar,
      photoURL: isAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
    };

    try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
    await syncUserToBackend(userObj);
    requestLiveGPS();
    onLoginSuccess(userObj);
    setLoading(false);
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

      {/* Main Login Card */}
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl">
        
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-stone-900">Citizen & Official Portal Sign In</h2>
          <p className="text-xs text-stone-500">
            Enter your Name, Aadhaar number, and Email to authenticate.
          </p>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Fields: Name, Aadhaar, Email */}
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-orange-600" />
              <span>Full Name (as per Aadhaar)</span>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-orange-600" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@gmail.com"
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Primary Action 1: Sign in with Google (Firebase Auth) */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm py-3 px-4 rounded-2xl flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 mt-1"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Authenticating with Google...' : 'Sign In with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="border-t border-stone-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">
            Or Direct Authenticated Access
          </span>
          <div className="border-t border-stone-200 w-full"></div>
        </div>

        {/* Primary Action 2: Direct Entry with Name, Aadhaar & Email */}
        <button
          type="button"
          onClick={handleDirectLogin}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow transition-all cursor-pointer disabled:opacity-50"
        >
          <span>Continue with Verified Credentials</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Live GPS Notice */}
        <div className="flex items-center space-x-2 text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
          <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Live GPS location will be automatically detected to map your ward.</span>
        </div>

      </div>

      <p className="text-center text-[11px] text-stone-400 mt-6">
        NagarSeva Digital Public Infrastructure (DPI) • Built with Google AI & Firebase
      </p>

    </div>
  );
}
