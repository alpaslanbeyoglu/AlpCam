import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const auth = getAuth(app);

async function clean() {
  console.log('Connecting and authenticating...');
  try {
    await signInAnonymously(auth);
    console.log('Authenticated anonymously. Starting deletion...');

    // 1. Clear catalog
    const catalogSnap = await getDocs(collection(db, 'catalog'));
    console.log(`Found ${catalogSnap.size} documents in 'catalog'. Deleting...`);
    let count = 0;
    for (const d of catalogSnap.docs) {
      await deleteDoc(d.ref);
      count++;
      if (count % 20 === 0) console.log(`Deleted ${count}/${catalogSnap.size}...`);
    }
    console.log("Cleared 'catalog' successfully.");

    // 2. Clear discounts
    const discountsSnap = await getDocs(collection(db, 'discounts'));
    console.log(`Found ${discountsSnap.size} documents in 'discounts'. Deleting...`);
    for (const d of discountsSnap.docs) {
      await deleteDoc(d.ref);
    }
    console.log("Cleared 'discounts' successfully.");

  } catch (err) {
    console.error('Error during cleanup:', err);
  }
  process.exit(0);
}

clean();
