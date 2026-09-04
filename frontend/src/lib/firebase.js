import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Firebase configuration for project 'nagar-seva' (nagar-seva-fbae2)
// Uses environment variable VITE_FIREBASE_API_KEY when provided, with fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCsstB1DR2l43ilT0x5JRvmS7cGwL3aWTA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nagar-seva-fbae2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nagar-seva-fbae2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nagar-seva-fbae2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "635957390026",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:635957390026:web:e466f2cd798496e7082233",
  measurementId: "G-QGX64EEMMX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Strict Super Admin: harshparmar686630@gmail.com is ALWAYS granted SUPER_ADMIN
export const SUPER_ADMIN_EMAIL = 'harshparmar686630@gmail.com';

export const getApprovedSuperAdmins = () => {
  const stored = localStorage.getItem('nagarmitra_super_admins');
  if (stored) {
    try {
      const list = JSON.parse(stored);
      if (Array.isArray(list) && !list.includes(SUPER_ADMIN_EMAIL)) {
        list.unshift(SUPER_ADMIN_EMAIL);
      }
      return list;
    } catch(e) {}
  }
  return [SUPER_ADMIN_EMAIL];
};

export const addApprovedSuperAdmin = (email) => {
  const clean = email.toLowerCase().trim();
  const current = getApprovedSuperAdmins();
  if (!current.includes(clean)) {
    const updated = [...current, clean];
    localStorage.setItem('nagarmitra_super_admins', JSON.stringify(updated));
    return updated;
  }
  return current;
};

export const removeApprovedSuperAdmin = (email) => {
  const clean = email.toLowerCase().trim();
  if (clean === SUPER_ADMIN_EMAIL) {
    // Primary super admin cannot be removed
    return getApprovedSuperAdmins();
  }
  const current = getApprovedSuperAdmins();
  const updated = current.filter(e => e.toLowerCase() !== clean);
  localStorage.setItem('nagarmitra_super_admins', JSON.stringify(updated));
  return updated;
};

/**
 * Strict Role Determination:
 * - harshparmar686630@gmail.com is ALWAYS Super Admin ('SUPER_ADMIN')
 * - Any other approved email in registry is Super Admin
 * - EVERY OTHER Gmail / user logs in as CITIZEN ('CITIZEN')
 */
export const isSuperAdminEmail = (email) => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (lower === SUPER_ADMIN_EMAIL) {
    return true;
  }
  const approved = getApprovedSuperAdmins();
  return approved.some(admin => admin.toLowerCase().trim() === lower);
};

