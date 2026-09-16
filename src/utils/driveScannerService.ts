import { Lens } from '../types';
import { DriveFolderFileInfo, KNOWN_DRIVE_FOLDER_URL, KNOWN_DRIVE_FILES } from '../data/driveScannedCatalog';

export interface ScanProgress {
  currentIndex: number;
  totalFiles: number;
  currentFileName: string;
  totalLensesFound: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  errorMessage?: string;
}

export async function fetchDriveFiles(folderUrl: string = KNOWN_DRIVE_FOLDER_URL): Promise<DriveFolderFileInfo[]> {
  try {
    const res = await fetch(`/api/drive/files?folderUrl=${encodeURIComponent(folderUrl)}`);
    if (!res.ok) {
      throw new Error(`Sunucu yanıt vermedi: HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.files) && data.files.length > 0) {
      return data.files;
    }
  } catch (err) {
    console.warn('Backend Drive files endpoint failed, falling back to verified known files:', err);
  }
  // Fallback to verified known files from the same URL
  return KNOWN_DRIVE_FILES;
}

export async function scanSingleDriveFile(
  file: DriveFolderFileInfo
): Promise<{ success: boolean; lenses: Lens[]; error?: string }> {
  try {
    const res = await fetch('/api/drive/scan-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        brandHint: file.brand,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.lenses)) {
      return { success: true, lenses: data.lenses };
    }
    throw new Error(data.error || 'Cam listesi ayrıştırılamadı.');
  } catch (err: any) {
    console.error(`Error scanning ${file.name}:`, err);
    return { success: false, lenses: [], error: err.message };
  }
}

export async function uploadAndScanDocument(
  file: File,
  brandHint?: string
): Promise<{ success: boolean; lenses: Lens[]; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/drive/upload-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            brandHint,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.lenses)) {
          resolve({ success: true, lenses: data.lenses });
        } else {
          resolve({ success: false, lenses: [], error: data.error || 'Dosya okunamadı.' });
        }
      } catch (err: any) {
        resolve({ success: false, lenses: [], error: err.message });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, lenses: [], error: 'Dosya okuma hatası' });
    };
    reader.readAsDataURL(file);
  });
}
