import React, { useState } from 'react';
import { X, LogIn, ShieldCheck, User, Sparkles, AlertCircle } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isSuperAdminEmail } from '../lib/firebase';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const isAdmin = isSuperAdminEmail(user.email);
      onLoginSuccess({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        role: isAdmin ? 'SUPER_ADMIN' : 'CITIZEN'
      });
      onClose();
    } catch (err) {
      console.warn("Firebase popup triggered demo fallback:", err);
      // Seamless Demo Login Fallback
      handleDemoLogin('CITIZEN');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleType) => {
    if (roleType === 'SUPER_ADMIN') {
      onLoginSuccess({
        uid: 'admin-123',
        email: 'harshparmar@gmail.com',
        displayName: 'Harsh Parmar',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        role: 'SUPER_ADMIN'
      });
    } else {
      onLoginSuccess({
        uid: 'citizen-456',
        email: 'citizen.indore@gmail.com',
        displayName: 'Indore Citizen',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        role: 'CITIZEN'
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-stone-900">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Sign In to NagarSeva DPI</h2>
          <p className="text-xs text-stone-500">
            Sign in with your Google Gmail. Standard Gmails enter as <span className="font-bold text-stone-800">Citizen</span>. Approved Gmails receive <span className="font-bold text-orange-600">Super Admin</span> privileges.
          </p>
        </div>

        {/* Primary Google Login Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Connecting to Google...' : 'Sign in with Google Gmail'}</span>
        </button>

        {/* Quick Demo Role Switcher */}
        <div className="pt-4 border-t border-stone-200 space-y-3">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center">
            Or Test Instantly With Preset Roles:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleDemoLogin('CITIZEN')}
              className="p-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-left transition-all"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Citizen Role</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">user@gmail.com</p>
            </button>

            <button
              onClick={() => handleDemoLogin('SUPER_ADMIN')}
              className="p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-left transition-all"
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-700">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Super Admin</span>
              </div>
              <p className="text-[10px] text-orange-600/80 mt-0.5">harshparmar@gmail.com</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
