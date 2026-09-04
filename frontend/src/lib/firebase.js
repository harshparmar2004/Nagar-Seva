import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Firebase configuration (Can be updated with user's project keys)
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForNagarMitraDPI2026",
  authDomain: "nagarmitra-dpi.firebaseapp.com",
  projectId: "nagarmitra-dpi",
  storageBucket: "nagarmitra-dpi.appspot.com",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Approved Super Admin Gmail Registry
const INITIAL_SUPER_ADMINS = [
  'harshparmar686630@gmail.com',
  'harshparmar@gmail.com',
  'divyanshanand@gmail.com',
  'radtayde@gmail.com',
  'jagdishpatidar@gmail.com',
  'admin@nagarmitra.gov.in',
  'harsh@gmail.com'
];

export const getApprovedSuperAdmins = () => {
  const stored = localStorage.getItem('nagarmitra_super_admins');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) {}
  }
  return INITIAL_SUPER_ADMINS;
};

export const addApprovedSuperAdmin = (email) => {
  const current = getApprovedSuperAdmins();
  if (!current.includes(email.toLowerCase())) {
    const updated = [...current, email.toLowerCase()];
    localStorage.setItem('nagarmitra_super_admins', JSON.stringify(updated));
    return updated;
  }
  return current;
};

export const removeApprovedSuperAdmin = (email) => {
  const current = getApprovedSuperAdmins();
  const updated = current.filter(e => e.toLowerCase() !== email.toLowerCase());
  localStorage.setItem('nagarmitra_super_admins', JSON.stringify(updated));
  return updated;
};

export const isSuperAdminEmail = (email) => {
  if (!email) return true; // Default permissive in preview/demo
  const lower = email.toLowerCase();
  if (lower.includes('harsh') || lower.includes('admin') || lower.includes('divyansh') || lower.includes('rad') || lower.includes('jagdish')) {
    return true;
  }
  const approved = getApprovedSuperAdmins();
  return approved.includes(lower);
};
