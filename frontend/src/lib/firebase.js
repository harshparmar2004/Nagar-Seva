import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

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
export const db = getFirestore(app);

/**
 * Save / sync user profile directly to Firebase Firestore
 */
export const syncUserToFirestore = async (userObj) => {
  if (!userObj?.email) return;
  try {
    const cleanEmail = userObj.email.toLowerCase().trim();
    const userRef = doc(db, 'users', cleanEmail);
    await setDoc(userRef, {
      name: userObj.displayName || '',
      email: cleanEmail,
      aadhaar: userObj.aadhaar || '',
      phone: userObj.phone || '',
      role: userObj.role || 'CITIZEN',
      photoURL: userObj.photoURL || '',
      lastLoginAt: new Date().toISOString()
    }, { merge: true });
    console.log("✓ User synced to Firebase Firestore:", cleanEmail);
  } catch (err) {
    console.warn("Firestore user sync note (check if Firestore is created in Firebase Console):", err.message);
  }
};

/**
 * Fetch existing user profile directly from Firebase Firestore
 */
export const getUserProfileFromFirestore = async (email) => {
  if (!email) return null;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const userRef = doc(db, 'users', cleanEmail);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn("Firestore getUserProfile error:", err.message);
    return null;
  }
};

/**
 * Save a complaint directly to Firebase Firestore
 */
export const saveComplaintToFirestore = async (complaintObj) => {
  if (!complaintObj?.id) return;
  try {
    const complaintRef = doc(db, 'complaints', complaintObj.id);
    await setDoc(complaintRef, {
      ...complaintObj,
      savedAt: new Date().toISOString()
    }, { merge: true });
    console.log("✓ Complaint saved to Firebase Firestore:", complaintObj.id);
  } catch (err) {
    console.warn("Firestore complaint save note:", err.message);
  }
};

/**
 * Fetch complaints for a user directly from Firebase Firestore
 */
export const getFirestoreUserComplaints = async (userEmail) => {
  if (!userEmail) return [];
  try {
    const cleanEmail = userEmail.toLowerCase().trim();
    const q = query(collection(db, 'complaints'), where('user_email', '==', cleanEmail));
    const snapshot = await getDocs(q);
    const complaints = [];
    snapshot.forEach(doc => complaints.push(doc.data()));
    return complaints;
  } catch (err) {
    console.warn("Firestore user complaints fetch note:", err.message);
    return [];
  }
};

/**
 * Fetch ALL complaints directly from Firebase Firestore (for Super Admin & GIS)
 */
export const getAllFirestoreComplaints = async () => {
  try {
    const q = collection(db, 'complaints');
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data && data.id) list.push(data);
    });
    return list;
  } catch (err) {
    console.warn("Firestore all complaints fetch note:", err.message);
    return [];
  }
};

/**
 * Fetch a single complaint directly from Firebase Firestore by ID
 */
export const getFirestoreComplaintById = async (complaintId) => {
  if (!complaintId) return null;
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(complaintRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn("Firestore single complaint fetch note:", err.message);
    return null;
  }
};

/**
 * Update complaint status or details directly in Firebase Firestore
 */
export const updateComplaintInFirestore = async (complaintId, updates) => {
  if (!complaintId) return;
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await setDoc(complaintRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`✓ Complaint ${complaintId} updated in Firebase Firestore:`, updates);
  } catch (err) {
    console.warn("Firestore complaint update note:", err.message);
  }
};

/**
 * Real-time listener for ALL complaints (instant sync to Super Admin without reload)
 */
export const subscribeToAllFirestoreComplaints = (onUpdate) => {
  if (typeof onUpdate !== 'function') return () => {};
  try {
    const q = collection(db, 'complaints');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.id) list.push(data);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore real-time subscription note:", err.message);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Firestore real-time subscription init note:", err.message);
    return () => {};
  }
};

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

