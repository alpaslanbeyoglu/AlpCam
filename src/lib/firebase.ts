import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCQF9m7rogR2Y9Wsc2fiF6BKhzsXzp5Flg",
  authDomain: "gen-lang-client-0638260382.firebaseapp.com",
  projectId: "gen-lang-client-0638260382",
  storageBucket: "gen-lang-client-0638260382.firebasestorage.app",
  messagingSenderId: "118621736876",
  appId: "1:118621736876:web:586da6b8f4ea0296a63409"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export common Firestore functions
export { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, setDoc, onSnapshot };
