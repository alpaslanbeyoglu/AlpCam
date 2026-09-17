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

      // 4. Process new files sequentially (1 at a time) to prevent network drops, timeouts, and API rate limit collisions
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        if (onStatusChange) {
          onStatusChange(true, `Arka plan taranıyor (${i + 1}/${newFiles.length}): ${file.name}`);
        }

        try {
          const res = await scanSingleDriveFile(file, {
            priceMode: 'auto',
            profitMarkup: 2.0,
            productTypeHint: 'auto'
          });

          if (res.success && res.lenses && res.lenses.length > 0) {
            // Save lenses to Firestore in chunks of 20 to avoid overwhelming write limits
            const chunkSize = 20;
            for (let c = 0; c < res.lenses.length; c += chunkSize) {
              const chunk = res.lenses.slice(c, c + chunkSize);
              await Promise.all(
                chunk.map(l => 
                  setDoc(doc(db, 'catalog', l.id), {
                    ...l,
                    sourceFileId: file.id,
                    sourceFileName: file.name,
                    updatedAt: new Date().toISOString()
                  })
                )
              );
            }

            // Mark file as successfully processed in Firestore
            await setDoc(doc(db, 'processedFiles', file.id), {
              fileId: file.id,
              fileName: file.name,
              lastScanTime: new Date().toISOString(),
              status: 'success',
              extractedCount: res.lenses.length
            });
          } else {
            // Mark file as error/skipped so it doesn't repeatedly block future syncs
            await setDoc(doc(db, 'processedFiles', file.id), {
              fileId: file.id,
              fileName: file.name,
              lastScanTime: new Date().toISOString(),
              status: 'error',
              message: res.error || 'Ürün listesi okunamadı'
            });
          }
        } catch (fileErr: any) {
          console.error(`Auto sync error for file ${file.name}:`, fileErr);
          try {
            await setDoc(doc(db, 'processedFiles', file.id), {
              fileId: file.id,
              fileName: file.name,
              lastScanTime: new Date().toISOString(),
              status: 'error',
              message: fileErr?.message || 'İşlem hatası'
            });
          } catch (_) {}
        }

        // Brief cooldown between files to respect API rate limits
        if (i < newFiles.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
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
