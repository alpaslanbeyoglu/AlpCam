import { useState, useEffect } from 'react';
import { db, collection, getDocs, setDoc, doc, query, where, orderBy } from '../lib/firebase';
import { fetchDriveFiles, scanSingleDriveFile } from '../utils/driveScannerService';
import { Lens, DriveSyncConfig } from '../types';
import { DriveFolderFileInfo } from '../data/driveScannedCatalog';

export function useAutoDriveSync(
  isAdmin: boolean,
  config: DriveSyncConfig,
  onStatusChange?: (isBusy: boolean, text: string) => void
) {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncDrive = async (folderUrl: string) => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    if (onStatusChange) onStatusChange(true, 'Google Drive listesi kontrol ediliyor...');

    try {
      // 1. Get files from Drive
      const driveFiles = await fetchDriveFiles(folderUrl);
      
      // 2. Get processed files from Firestore
      const processedSnap = await getDocs(collection(db, 'processedFiles'));
      const processedIds = new Set(processedSnap.docs.map(d => d.id));

      // 3. Find new files
      const newFiles = driveFiles.filter(f => !processedIds.has(f.id));

      // If not admin, we can't scan new files, just stop here.
      // But we've already benefited by useFirebaseCatalog loading existing lenses.
      if (!isAdmin || newFiles.length === 0) {
        if (onStatusChange) onStatusChange(false, '');
        setIsSyncing(false);
        return;
      }

      // 4. Process new files in small batches (e.g., 3 at a time) for speed
      const batchSize = 3;
      for (let i = 0; i < newFiles.length; i += batchSize) {
        const batchFiles = newFiles.slice(i, i + batchSize);
        if (onStatusChange) {
          onStatusChange(true, `Arka plan tarama (${i + 1}-${Math.min(i + batchSize, newFiles.length)}/${newFiles.length})`);
        }

        await Promise.all(batchFiles.map(async (file) => {
          const res = await scanSingleDriveFile(file, {
            priceMode: 'auto',
            profitMarkup: 2.0,
            productTypeHint: 'auto'
          });

          if (res.success && res.lenses) {
            // Save lenses to Firestore
            const lensPromises = res.lenses.map(l => 
              setDoc(doc(db, 'catalog', l.id), {
                ...l,
                sourceFileId: file.id,
                sourceFileName: file.name,
                updatedAt: new Date().toISOString()
              })
            );
            await Promise.all(lensPromises);

            // Mark file as processed
            await setDoc(doc(db, 'processedFiles', file.id), {
              fileId: file.id,
              fileName: file.name,
              lastScanTime: new Date().toISOString(),
              status: 'success',
              extractedCount: res.lenses.length
            });
          } else {
            await setDoc(doc(db, 'processedFiles', file.id), {
              fileId: file.id,
              fileName: file.name,
              lastScanTime: new Date().toISOString(),
              status: 'error',
              message: res.error || 'Tarama hatası'
            });
          }
        }));
      }
    } catch (err) {
      console.error('Auto sync error:', err);
    } finally {
      setIsSyncing(false);
      if (onStatusChange) onStatusChange(false, '');
    }
  };

  return { syncDrive, isSyncing };
}
