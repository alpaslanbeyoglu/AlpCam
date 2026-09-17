import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Attempt anonymous sign-in to establish request.auth if supported
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(() => {
      // Gracefully fall back if anonymous provider is not enabled
    });
  }
});

// Export common Firestore functions
export { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, onSnapshot };
