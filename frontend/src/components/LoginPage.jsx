import React, { useState } from 'react';
import { Shield, User, ArrowRight, AlertCircle, Compass } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isSuperAdminEmail, SUPER_ADMIN_EMAIL } from '../lib/firebase';

export default function LoginPage({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isAdmin = isSuperAdminEmail(user.email);

      const userObj = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
      };

      try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
      requestLiveGPS();
      onLoginSuccess(userObj);
    } catch (err) {
      console.warn("Google popup error:", err);
      setError("Google Sign-In popup could not complete. You can sign in below with your Name & Email directly!");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = (e) => {
    e?.preventDefault();
    if (!customEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split('@')[0];
    const isAdmin = isSuperAdminEmail(cleanEmail);

    const userObj = {
      uid: `usr-${Date.now()}`,
      email: cleanEmail,
      displayName: cleanName,
      photoURL: isAdmin 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
    };

    try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
    requestLiveGPS();
    onLoginSuccess(userObj);
  };

  const handleDemoLogin = (roleType) => {
    const userObj = roleType === 'SUPER_ADMIN' ? {
      uid: 'admin-primary',
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Harsh Parmar (Super Admin)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role: 'SUPER_ADMIN'
    } : {
      uid: 'citizen-demo',
      email: 'citizen.indore@gmail.com',
      displayName: 'Indore Citizen',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: 'CITIZEN'
    };

    try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
    requestLiveGPS();
    onLoginSuccess(userObj);
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
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl">
        
        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-stone-900">Sign In to Continue</h2>
          <p className="text-xs text-stone-500">
            Authenticate with your Google Account to access city services.
          </p>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Connecting to Google Firebase...' : 'Sign in with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-stone-400 uppercase tracking-wider whitespace-nowrap">
            Or Direct Email Login
          </span>
          <div className="border-t border-stone-200 w-full"></div>
        </div>

        {/* Name & Email Direct Sign-in */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Your Full Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Your Email Address</label>
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@gmail.com"
              required
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow transition-all cursor-pointer"
          >
            <span>Continue to Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Logins for Review */}
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider text-center">
            Instant 1-Click Verification Logins:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('CITIZEN')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Citizen Login</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5 truncate">Enters Citizen Portal</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('SUPER_ADMIN')}
              className="p-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-700">
                <Shield className="w-3.5 h-3.5 text-orange-600" />
                <span>Super Admin</span>
              </div>
              <p className="text-[10px] text-orange-600/80 mt-0.5 truncate">{SUPER_ADMIN_EMAIL}</p>
            </button>
          </div>
        </div>

        {/* Geotag Notice */}
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
