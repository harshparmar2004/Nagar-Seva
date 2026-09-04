import React, { useState } from 'react';
import { X, LogIn, ShieldCheck, User, Sparkles, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isSuperAdminEmail } from '../lib/firebase';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  if (!isOpen) return null;

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
      onLoginSuccess(userObj);
      onClose();
    } catch (err) {
      console.warn("Firebase popup error:", err);
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
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
    };

    try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
    onLoginSuccess(userObj);
    onClose();
  };

  const handleDemoLogin = (roleType) => {
    const userObj = roleType === 'SUPER_ADMIN' ? {
      uid: 'admin-123',
      email: 'harshparmar686630@gmail.com',
      displayName: 'Harsh Parmar (Super Admin)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role: 'SUPER_ADMIN'
    } : {
      uid: 'citizen-456',
      email: 'citizen.indore@gmail.com',
      displayName: 'Indore Citizen',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: 'CITIZEN'
    };
    try { localStorage.setItem('nagarmitra_user', JSON.stringify(userObj)); } catch(e) {}
    onLoginSuccess(userObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative text-stone-900 max-h-[92vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Sign In to NagarSeva DPI</h2>
          <p className="text-xs text-stone-500">
            Sign in with your Google Gmail or your personal email & name below.
          </p>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-3 shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink mx-3 text-stone-400 text-xs font-semibold uppercase">Or with your Name & Email</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        {/* Custom Name & Email Direct Sign-in */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Your Full Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow transition-all cursor-pointer"
          >
            <span>Continue with My Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Role Switcher */}
        <div className="pt-3 border-t border-stone-200 space-y-2.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider text-center">
            Quick Demo Sandbox Logins:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('CITIZEN')}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Demo Citizen</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5 truncate">citizen.indore@gmail.com</p>
            </button>

            <button
              onClick={() => handleDemoLogin('SUPER_ADMIN')}
              className="p-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-700">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Super Admin</span>
              </div>
              <p className="text-[10px] text-orange-600/80 mt-0.5 truncate">harshparmar686630@gmail.com</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
