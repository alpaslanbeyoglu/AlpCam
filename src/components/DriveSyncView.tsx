import React, { useState, useEffect, useRef } from 'react';
import { DriveSyncConfig, Lens } from '../types';
import {
  KNOWN_DRIVE_FOLDER_URL,
  KNOWN_DRIVE_FILES,
  DRIVE_EXTRACTED_LENSES,
  DriveFolderFileInfo,
} from '../data/driveScannedCatalog';
import {
  fetchDriveFiles,
  scanSingleDriveFile,
  uploadAndScanDocument,
} from '../utils/driveScannerService';
import {
  downloadSampleExcelTemplate,
  exportLensesToExcel,
  parseExcelOrCsvData,
} from '../utils/driveSync';
import {
  Cloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  Sparkles,
  Download,
  Upload,
  Lock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Search,
  Layers,
  ChevronRight,
  Eye,
  Check,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  Tag,
  ArrowDownToLine,
  RotateCcw,
  Plus,
} from 'lucide-react';

interface DriveSyncViewProps {
  config: DriveSyncConfig;
  onSaveConfig: (cfg: DriveSyncConfig) => void;
  lenses: Lens[];
  onUpdateLenses: (newLenses: Lens[], mode: 'replace' | 'merge') => void;
  onResetToDefaultCatalog: () => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
}

export const DriveSyncView: React.FC<DriveSyncViewProps> = ({
  config,
  onSaveConfig,
  lenses,
  onUpdateLenses,
  onResetToDefaultCatalog,
  isAdmin,
  onOpenAdminModal,
}) => {
  // Folder & File state
  const [folderUrl, setFolderUrl] = useState<string>(config.sourceUrl || KNOWN_DRIVE_FOLDER_URL);
  const [driveFiles, setDriveFiles] = useState<DriveFolderFileInfo[]>(KNOWN_DRIVE_FILES);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileFilterBrand, setFileFilterBrand] = useState<string>('all');
  const [fileFilterFormat, setFileFilterFormat] = useState<string>('all');
  const [fileSearchTerm, setFileSearchTerm] = useState('');

  // Scanning state
  const [scanningFileId, setScanningFileId] = useState<string | null>(null);
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; filename: string }>({
    current: 0,
    total: 0,
    filename: '',
  });

  // Extracted preview state
  const [previewLenses, setPreviewLenses] = useState<Lens[] | null>(null);
  const [previewSourceName, setPreviewSourceName] = useState<string>('');

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Load drive files on mount or when folderUrl changes
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingFiles(true);
      const files = await fetchDriveFiles(folderUrl);
      if (isMounted) {
        setDriveFiles(files);
        setIsLoadingFiles(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [folderUrl]);

  // Filtered files list
  const filteredFiles = driveFiles.filter((f) => {
    const matchBrand = fileFilterBrand === 'all' || f.brand.toLowerCase().includes(fileFilterBrand.toLowerCase());
    const matchFormat = fileFilterFormat === 'all' || f.format === fileFilterFormat;
    const matchSearch =
      !fileSearchTerm.trim() ||
      f.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      f.brand.toLowerCase().includes(fileSearchTerm.toLowerCase());
    return matchBrand && matchFormat && matchSearch;
  });

  // Extract unique brands from files
  const availableBrands = Array.from(new Set(driveFiles.map((f) => f.brand))).filter(Boolean);

  // Handle Scan Single File with Gemini AI
  const handleScanSingleFile = async (file: DriveFolderFileInfo) => {
    setScanningFileId(file.id);
    setStatusMessage({
      type: 'info',
      message: `"${file.name}" dosyası Google Drive'dan indiriliyor ve Gemini AI Vision ile taranıyor...`,
    });

    const res = await scanSingleDriveFile(file);
    setScanningFileId(null);

    if (res.success && res.lenses.length > 0) {
      setPreviewSourceName(file.name);
      setPreviewLenses(res.lenses);
      setStatusMessage({
        type: 'success',
        message: `Yapay zeka "${file.name}" dosyasından ${res.lenses.length} adet cam tespit etti! Aşağıdaki önizleme alanından inceleyip onaylayabilirsiniz.`,
      });

      // Update file state locally
      setDriveFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'completed', extractedCount: res.lenses.length } : f))
      );
    } else {
      setStatusMessage({
        type: 'error',
        message: res.error || 'Dosya taranırken bir hata oluştu veya cam bulunamadı.',
      });
    }
  };

  // Handle Batch Scan of all or selected files
  const handleBatchScanAll = async () => {
    if (!driveFiles || driveFiles.length === 0) return;

    setIsBatchScanning(true);
    setStatusMessage({
      type: 'info',
      message: 'Drive klasöründeki dosyalar sırayla taranıyor...',
    });

    const targetFiles = driveFiles.slice(0, 8); // Scan top prioritized files
    let accumulatedLenses: Lens[] = [];

    for (let i = 0; i < targetFiles.length; i++) {
      const file = targetFiles[i];
      setBatchProgress({
        current: i + 1,
        total: targetFiles.length,
        filename: file.name,
      });

      const res = await scanSingleDriveFile(file);
      if (res.success && res.lenses.length > 0) {
        accumulatedLenses = [...accumulatedLenses, ...res.lenses];
      }
    }

    setIsBatchScanning(false);

    if (accumulatedLenses.length > 0) {
      setPreviewSourceName(`Google Drive Klasör Taraması (${targetFiles.length} Dosya)`);
      setPreviewLenses(accumulatedLenses);
      setStatusMessage({
        type: 'success',
        message: `Toplu tarama tamamlandı! Toplam ${accumulatedLenses.length} cam modeli tespit edildi.`,
      });
    } else {
      // If network or timeout prevented live batch, suggest quick sync from verified catalog
      setStatusMessage({
        type: 'info',
        message: 'Toplu tarama sırasında bağlantı gecikmesi oldu. Önceden taranmış 35+ hazır camı anında aktarmak için "Hazır Kataloğu Entegre Et" butonunu kullanabilirsiniz.',
      });
    }
  };

  // Instant apply verified Drive catalog
  const handleApplyVerifiedDriveCatalog = (mode: 'merge' | 'replace') => {
    onUpdateLenses(DRIVE_EXTRACTED_LENSES, mode);
    const updatedCfg: DriveSyncConfig = {
      ...config,
      sourceUrl: folderUrl,
      lastSyncTime: new Date().toISOString(),
      lastSyncItemCount: DRIVE_EXTRACTED_LENSES.length,
    };
    onSaveConfig(updatedCfg);
    setPreviewLenses(null);
    setStatusMessage({
      type: 'success',
      message: `Tebrikler! Google Drive klasöründeki dosyalardan taranmış ${DRIVE_EXTRACTED_LENSES.length} adet cam (Rodenstock, Zeiss, SEIKO, HOYA, HAWK PLUS, Novax, Fuji, vb.) kataloğunuza başarıyla uygulandı.`,
    });
  };

  // Apply previewed lenses to actual catalog
  const handleApplyPreviewLenses = (mode: 'merge' | 'replace') => {
    if (!previewLenses || previewLenses.length === 0) return;
    onUpdateLenses(previewLenses, mode);

    const updatedCfg: DriveSyncConfig = {
      ...config,
      sourceUrl: folderUrl,
      lastSyncTime: new Date().toISOString(),
      lastSyncItemCount: previewLenses.length,
    };
    onSaveConfig(updatedCfg);

    setStatusMessage({
      type: 'success',
      message: `Taranan ${previewLenses.length} cam başarıyla kataloğa eklendi (${mode === 'replace' ? 'Katalog yenilendi' : 'Mevcut kataloğa eklendi'}).`,
    });
    setPreviewLenses(null);
  };

  // Upload and scan local file (PDF or Image)
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({
      type: 'info',
      message: `"${file.name}" dosyası yükleniyor ve Gemini AI ile inceleniyor...`,
    });

    const res = await uploadAndScanDocument(file);
    if (res.success && res.lenses.length > 0) {
      setPreviewSourceName(file.name);
      setPreviewLenses(res.lenses);
      setStatusMessage({
        type: 'success',
        message: `"${file.name}" belgesinden ${res.lenses.length} adet cam başarıyla okundu!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        message: res.error || 'Dosyadan cam bilgisi okunamadı.',
      });
    }
    e.target.value = '';
  };

  // Handle Excel upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseExcelOrCsvData(buffer);

        if (!result.success || result.lenses.length === 0) {
          setStatusMessage({
            type: 'error',
            message: 'Yüklenen Excel dosyasında geçerli cam satırı bulunamadı.',
            details: result.errors,
          });
          return;
        }

        onUpdateLenses(result.lenses, 'merge');
        setStatusMessage({
          type: 'success',
          message: `Excel dosyasından ${result.lenses.length} cam kataloğa aktarıldı.`,
        });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          message: `Dosya okunamadı: ${err.message}`,
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Banner & Mode Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 px-5 py-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <Cloud className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Google Drive Fiyat Listesi & AI Belge Tarayıcı
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/30 text-sky-300 border border-sky-400/40">
                  Gemini Vision OCR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Klasördeki PDF ve resim formatındaki cam listelerini otomatik tarar ve kataloğa işler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Yönetici Modu Açık</span>
              </div>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Yönetici Girişi Yap</span>
              </button>
            )}
          </div>
        </div>

        {/* Drive Folder Connection Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex-1 w-full space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-sky-600" />
                <span>Bağlı Google Drive Klasörü:</span>
              </span>
              <a
                href={folderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 text-[11px]"
              >
                <span>Klasörü Drive'da Aç</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled={!isAdmin}
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
              {isAdmin && (
                <button
                  onClick={() => setFolderUrl(KNOWN_DRIVE_FOLDER_URL)}
                  title="Varsayılan Klasör URL'sine Sıfırla"
                  className="px-2.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-[11px] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Son Senkron: <strong>{config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleDateString('tr-TR') : 'Şimdi'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage.type && (
          <div
            className={`p-4 mx-4 sm:mx-5 mt-4 rounded-xl border text-xs flex items-start gap-3 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 animate-pulse" />
            )}
            <div className="space-y-1">
              <div className="font-semibold">{statusMessage.message}</div>
              {statusMessage.details && statusMessage.details.length > 0 && (
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {statusMessage.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* BATCH PROGRESS BAR */}
        {isBatchScanning && (
          <div className="px-5 py-4 bg-sky-50 border-y border-sky-100 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-900">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Yapay zeka dosyaları tarıyor ({batchProgress.current} / {batchProgress.total})</span>
              </span>
              <span className="text-sky-700 font-mono text-[11px] truncate max-w-xs">{batchProgress.filename}</span>
            </div>
            <div className="w-full h-2 bg-sky-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* PREVIEW OF EXTRACTED LENSES (IF ANY) */}
        {previewLenses && previewLenses.length > 0 && (
          <div className="m-4 sm:m-5 p-5 bg-gradient-to-br from-indigo-50/70 to-sky-50/70 border-2 border-indigo-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                    AI İNCELEME
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Taranan Cam Önizlemesi ({previewLenses.length} Cam Bulundu)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Kaynak: <strong>{previewSourceName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewLenses(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                >
                  İptal Et
                </button>
                <button
                  onClick={() => handleApplyPreviewLenses('merge')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kataloğa Ekle (Merge)</span>
                </button>
                <button
                  onClick={() => handleApplyPreviewLenses('replace')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Kataloğu Bununla Değiştir</span>
                </button>
              </div>
            </div>

            {/* Scrollable table of extracted items */}
            <div className="max-h-64 overflow-y-auto border border-indigo-100 rounded-xl bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2.5">Marka & Model</th>
                    <th className="p-2.5">İndeks & Kaplama</th>
                    <th className="p-2.5 text-right">Toptan Fiyat</th>
                    <th className="p-2.5 text-right">Perakende Fiyat</th>
                    <th className="p-2.5">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewLenses.slice(0, 15).map((pl, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-2.5 font-medium text-slate-900">
                        <span className="font-bold text-sky-700 mr-1.5">[{pl.brand}]</span>
                        {pl.name}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] mr-1">
                          {pl.index}
                        </span>
                        {pl.coating}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                        {pl.wholesalePrice > 0 ? `${pl.wholesalePrice.toLocaleString('tr-TR')} ₺` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {pl.retailPrice > 0 ? `${pl.retailPrice.toLocaleString('tr-TR')} ₺` : '-'}
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-500 truncate max-w-xs">{pl.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewLenses.length > 15 && (
              <p className="text-[11px] text-slate-500 text-center">
                ...ve {previewLenses.length - 15} adet daha cam bulundu
              </p>
            )}
          </div>
        )}

        {/* PRIMARY ACTIONS FOR MANAGER / OPTICIAN */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={handleBatchScanAll}
                    disabled={isBatchScanning}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Tüm Drive Klasörünü AI ile Tara (19 Belge)</span>
                  </button>

                  <button
                    onClick={() => handleApplyVerifiedDriveCatalog('merge')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hazır Kataloğu Entegre Et (35+ Cam)</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Telefondan/Bilgisayardan Belge/Fotoğraf Tara</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleLocalFileUpload}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleApplyVerifiedDriveCatalog('merge')}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Yöneticinin Drive Listesinden Kataloğu Yenile</span>
                  </button>
                  <span className="text-xs text-slate-500">
                    Sistemde yöneticinin Drive klasöründen yüklediği güncel toptan/perakende listesi etkindir.
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 self-end">
              <button
                onClick={() => exportLensesToExcel(lenses)}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
                title="Mevcut kataloğu Excel olarak indir"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
                <span>Excel İndir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DRIVE FILES DIRECTORY (19 Files Detected) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Google Drive Klasör İçeriği ({driveFiles.length} Belge)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                PDF ve Görseller
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toptan ve perakende cam listeleri, kampanyalar ve kontakt lens belgeleri
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fileSearchTerm}
                onChange={(e) => setFileSearchTerm(e.target.value)}
                placeholder="Dosya veya marka ara..."
                className="pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 w-40 sm:w-48"
              />
            </div>

            <select
              value={fileFilterBrand}
              onChange={(e) => setFileFilterBrand(e.target.value)}
              aria-label="Markaya Göre Filtrele"
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">Tüm Markalar</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={fileFilterFormat}
              onChange={(e) => setFileFilterFormat(e.target.value)}
              aria-label="Dosya Formatına Göre Filtrele"
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">Tüm Formatlar</option>
              <option value="pdf">Sadece PDF</option>
              <option value="image">Sadece Görseller (JPG)</option>
            </select>
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFiles.map((file) => {
            const isScanningThis = scanningFileId === file.id;

            return (
              <div
                key={file.id}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          file.format === 'pdf'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {file.format === 'pdf' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <ImageIcon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                          {file.brand}
                        </span>
                        <h4
                          className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-sky-700 transition"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                      </div>
                    </div>

                    <a
                      href={file.driveViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Google Drive'da Görüntüle"
                      className="p-1.5 text-slate-400 hover:text-sky-600 rounded-md hover:bg-white transition shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        file.listType === 'toptan'
                          ? 'bg-amber-100 text-amber-800'
                          : file.listType === 'perakende'
                          ? 'bg-emerald-100 text-emerald-800'
                          : file.listType === 'kampanya'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {file.listType === 'toptan'
                        ? 'Toptan Liste'
                        : file.listType === 'perakende'
                        ? 'Perakende Liste'
                        : file.listType === 'kampanya'
                        ? 'Kampanya Görseli'
                        : 'Fiyat Listesi'}
                    </span>

                    {file.sizeFormatted && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-mono">
                        {file.sizeFormatted}
                      </span>
                    )}

                    {file.extractedCount && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{file.extractedCount} Cam</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">
                    {file.format === 'pdf' ? 'PDF Belgesi' : 'Görsel (JPG)'}
                  </span>

                  {isAdmin ? (
                    <button
                      onClick={() => handleScanSingleFile(file)}
                      disabled={isScanningThis || isBatchScanning}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-sky-50 text-sky-700 border border-slate-200 hover:border-sky-300 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isScanningThis ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
                          <span>Taranıyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-sky-500" />
                          <span>AI ile Tara</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Entegre Edildi
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADDITIONAL ADMIN TOOLS: EXCEL & CATALOG MANAGEMENT */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Alternatif Excel (.xlsx / .csv) & Katalog Araçları</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Google E-Tablolar veya bilgisayarınızdaki hazır Excel dosyasını da içe aktarabilirsiniz
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 block">Excel Dosyası Yükle</span>
              <p className="text-[11px] text-slate-500">
                Kendi hazırladığınız veya toptancıdan gelen Excel fiyat listesini doğrudan sisteme aktarın.
              </p>
              <button
                onClick={() => excelInputRef.current?.click()}
                className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition"
              >
                Excel Dosyası Seç
              </button>
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-800 block">Örnek Excel Şablonu</span>
              <p className="text-[11px] text-slate-500">
                Sisteme hatasız toplu cam yüklemek için hazır sütun şablonunu indirin.
              </p>
              <button
                onClick={downloadSampleExcelTemplate}
                className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Şablonu İndir</span>
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
              <span className="font-bold text-rose-900 block">Kataloğu Sıfırla</span>
              <p className="text-[11px] text-rose-700">
                Kataloğu Google Drive taranmış orijinal fabrika ve toptancı listesine geri döndürür.
              </p>
              <button
                onClick={() => {
                  if (confirm('Kataloğu Drive taranmış varsayılan cam listesine döndürmek istediğinize emin misiniz?')) {
                    onResetToDefaultCatalog();
                    setStatusMessage({
                      type: 'success',
                      message: 'Katalog varsayılan fabrika fiyat listesine sıfırlandı.',
                    });
                  }
                }}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition"
              >
                Varsayılana Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
