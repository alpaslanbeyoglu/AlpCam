import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, onSnapshot, query, orderBy } from '../lib/firebase';
import { Lens, BrandDiscount, CustomList } from '../types';
import { cleanUndefined } from '../utils/storage';

export function useFirebaseCatalog() {
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [discounts, setDiscounts] = useState<BrandDiscount[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time catalog
    const qCatalog = query(collection(db, 'catalog'), orderBy('updatedAt', 'desc'));
    const unsubscribeCatalog = onSnapshot(qCatalog, (snapshot) => {
      if (snapshot.empty) {
        setLenses([]);
        setLoading(false);
        return;
      }
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lens));
      setLenses(items);
      setLoading(false);
    });

    // Real-time discounts
    const qDiscounts = collection(db, 'discounts');
    const unsubscribeDiscounts = onSnapshot(qDiscounts, (snapshot) => {
      if (snapshot.empty) {
        setDiscounts([]);
        return;
      }
      const items = snapshot.docs.map(doc => doc.data() as BrandDiscount);
      setDiscounts(items);
    });

    // Real-time custom lists
    const qLists = query(collection(db, 'customLists'), orderBy('updatedAt', 'desc'));
    const unsubscribeLists = onSnapshot(qLists, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomList));
      setCustomLists(items);
    });

    return () => {
      unsubscribeCatalog();
      unsubscribeDiscounts();
      unsubscribeLists();
    };
  }, []);

  const saveLens = async (lens: Lens) => {
    await setDoc(doc(db, 'catalog', lens.id), cleanUndefined({ ...lens, updatedAt: new Date().toISOString() }));
  };

  const saveLenses = async (newItems: Lens[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      // For replace, we might want to delete old ones first, but that's risky. 
      // Better to just batch set the new ones.
    }
    const promises = newItems.map(item => saveLens(item));
    await Promise.all(promises);
  };

  const deleteLens = async (id: string) => {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'catalog', id));
  };

  const clearCatalog = async () => {
    const { deleteDoc, getDocs, collection } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'catalog'));
    const promises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(promises);
  };

  const saveDiscount = async (discount: BrandDiscount) => {
    await setDoc(doc(db, 'discounts', discount.brand), cleanUndefined(discount));
  };

  const saveDiscounts = async (items: BrandDiscount[]) => {
    const promises = items.map(item => saveDiscount(item));
    await Promise.all(promises);
  };

  const saveCustomList = async (list: CustomList) => {
    await setDoc(doc(db, 'customLists', list.id), cleanUndefined({ ...list, updatedAt: new Date().toISOString() }));
  };

  const saveCustomLists = async (items: CustomList[]) => {
    const promises = items.map(item => saveCustomList(item));
    await Promise.all(promises);
  };

  const deleteCustomList = async (id: string) => {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'customLists', id));
  };

  return {
    lenses,
    discounts,
    customLists,
    loading,
    saveLens,
    saveLenses,
    deleteLens,
    clearCatalog,
    saveDiscount,
    saveDiscounts,
    saveCustomList,
    saveCustomLists,
    deleteCustomList
  };
}
