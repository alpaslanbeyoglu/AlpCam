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
import { isContactLens } from '../utils/pricing';
import { getDistributorForBrand, getDistributorInfo, DISTRIBUTORS_LIST } from '../data/distributors';
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
  SlidersHorizontal,
  Building2,
  Percent,
  Database,
} from 'lucide-react';

interface DriveSyncViewProps {
  config: DriveSyncConfig;
  onSaveConfig: (cfg: DriveSyncConfig) => void;
  lenses: Lens[];
  onUpdateLenses: (newLenses: Lens[], mode: 'replace' | 'merge') => void;
  onResetToDefaultCatalog: () => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onScanningStatusChange?: (isBusy: boolean, statusText?: string) => void;
}

export const DriveSyncView: React.FC<DriveSyncViewProps> = ({
  config,
  onSaveConfig,
  lenses,
  onUpdateLenses,
  onResetToDefaultCatalog,
  isAdmin,
  onOpenAdminModal,
  onScanningStatusChange,
}) => {
  // Folder & File state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [folderUrl, setFolderUrl] = useState<string>(config.sourceUrl || KNOWN_DRIVE_FOLDER_URL);
  const [driveFiles, setDriveFiles] = useState<DriveFolderFileInfo[]>(KNOWN_DRIVE_FILES);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileFilterBrand, setFileFilterBrand] = useState<string>('all');
  const [fileFilterDistributor, setFileFilterDistributor] = useState<string>('all');
  const [fileFilterFormat, setFileFilterFormat] = useState<string>('all');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [fileTypeTab, setFileTypeTab] = useState<'all' | 'eyeglass' | 'contact' | 'toptan' | 'perakende'>('all');

  // Admin Price Mode & Product Type decision state
  const [adminPriceMode, setAdminPriceMode] = useState<'auto' | 'wholesale' | 'retail'>('auto');
  const [profitMarkup, setProfitMarkup] = useState<number>(2.0);
  const [productTypeHint, setProductTypeHint] = useState<'auto' | 'eyeglass_lens' | 'contact_lens'>('auto');

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

  // System memory stats
  const memoryEyeglassCount = lenses.filter((l) => !isContactLens(l)).length;
  const memoryContactCount = lenses.filter((l) => isContactLens(l)).length;

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

  // Notify parent of background work so other tabs stay aware
  useEffect(() => {
    if (!onScanningStatusChange) return;
    if (isBatchScanning) {
      onScanningStatusChange(
        true,
        `Drive taranıyor (${batchProgress.current}/${batchProgress.total}): ${batchProgress.filename || 'Belge'}`
      );
    } else if (scanningFileId) {
      const file = driveFiles.find((f) => f.id === scanningFileId);
      onScanningStatusChange(true, `Belge taranıyor: ${file?.name || 'Drive Dosyası'}`);
    } else if (isLoadingFiles) {
      onScanningStatusChange(true, 'Google Drive dosyaları listeleniyor...');
    } else {
      onScanningStatusChange(false, '');
    }
  }, [isBatchScanning, batchProgress, scanningFileId, isLoadingFiles, driveFiles, onScanningStatusChange]);

  // Toggle single file's list type (wholesale vs retail decision by admin)
  const handleToggleFileListType = (fileId: string) => {
    setDriveFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          const nextType = f.listType === 'toptan' ? 'perakende' : 'toptan';
          return { ...f, listType: nextType };
        }
        return f;
      })
    );
  };

  // Update specific file's profit markup (no upper limit)
  const handleUpdateFileProfitMarkup = (fileId: string, markup: number) => {
    setDriveFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, profitMarkup: markup } : f))
    );
  };

  // Apply current global profit markup to all wholesale files
  const handleApplyGlobalMarkupToAllWholesale = () => {
    setDriveFiles((prev) =>
      prev.map((f) => (f.listType === 'toptan' ? { ...f, profitMarkup } : f))
    );
    setStatusMessage({
      type: 'info',
      message: `Tüm toptan liste kutularına ${profitMarkup}x (%${Math.round((profitMarkup - 1) * 100)} kâr marjı) çarpanı uygulandı.`,
    });
  };

  // Filtered files list
  const filteredFiles = driveFiles.filter((f) => {
    const fileDist = f.distributor || getDistributorForBrand(f.brand, f.name);
    const matchDistributor =
      fileFilterDistributor === 'all' ||
      fileDist.toLowerCase().includes(fileFilterDistributor.toLowerCase()) ||
      fileFilterDistributor.toLowerCase().includes(fileDist.toLowerCase());
    const matchBrand = fileFilterBrand === 'all' || f.brand.toLowerCase().includes(fileFilterBrand.toLowerCase());
    const matchFormat = fileFilterFormat === 'all' || f.format === fileFilterFormat;
    const matchSearch =
      !fileSearchTerm.trim() ||
      f.name.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      f.brand.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      fileDist.toLowerCase().includes(fileSearchTerm.toLowerCase());

    const isContactFile = f.category === 'contact_lens' || f.name.toLowerCase().includes('lens');

    let matchTypeTab = true;
    if (fileTypeTab === 'eyeglass') {
      matchTypeTab = !isContactFile;
    } else if (fileTypeTab === 'contact') {
      matchTypeTab = isContactFile;
    } else if (fileTypeTab === 'toptan') {
      matchTypeTab = f.listType === 'toptan';
    } else if (fileTypeTab === 'perakende') {
      matchTypeTab = f.listType === 'perakende';
    }

    return matchDistributor && matchBrand && matchFormat && matchSearch && matchTypeTab;
  });

  // Extract unique brands and distributors from files
  const availableBrands = Array.from(new Set(driveFiles.map((f) => f.brand))).filter(Boolean);
  const availableDistributors = Array.from(
    new Set(driveFiles.map((f) => f.distributor || getDistributorForBrand(f.brand, f.name)))
  ).filter(Boolean);

  // Handle Scan Single File with Gemini AI & Admin Price Decision
  const handleScanSingleFile = async (file: DriveFolderFileInfo) => {
    setScanningFileId(file.id);
    const isContact = file.productType === 'contact_lens' || isContactLens(file.name);
    const effectiveFileMarkup = file.profitMarkup !== undefined && file.profitMarkup > 0 ? file.profitMarkup : profitMarkup;
    const isRetailList = file.listType === 'perakende' || adminPriceMode === 'retail';

    setStatusMessage({
      type: 'info',
      message: `"${file.name}" dosyası Google Drive'dan indiriliyor ve Gemini AI Vision ile taranıyor (Fiyat Modu: ${
        isRetailList
          ? 'Perakende Liste - Kâr çarpanı uygulanmaz, listedeki tavsiye satış fiyatı doğrudan aktarılır'
          : `Toptan Alış + ${effectiveFileMarkup}x Kâr Marjı`
      })...`,
    });

    const effectivePriceMode =
      adminPriceMode !== 'auto'
        ? adminPriceMode
        : file.listType === 'toptan'
        ? 'wholesale'
        : file.listType === 'perakende'
        ? 'retail'
        : 'auto';

    const effectiveProductType =
      productTypeHint !== 'auto' ? productTypeHint : isContact ? 'contact_lens' : 'eyeglass_lens';

    const res = await scanSingleDriveFile(file, {
      priceMode: effectivePriceMode,
      profitMarkup: isRetailList ? 1.0 : effectiveFileMarkup,
      productTypeHint: effectiveProductType,
    });
    setScanningFileId(null);

    if (res.success && res.lenses.length > 0) {
      setPreviewSourceName(file.name);
      setPreviewLenses(res.lenses);
      const camCount = res.lenses.filter((l) => !isContactLens(l)).length;
      const lensCount = res.lenses.filter((l) => isContactLens(l)).length;
      setStatusMessage({
        type: 'success',
        message: `Yapay zeka "${file.name}" dosyasından ${res.lenses.length} ürün tespit etti (${camCount} Gözlük Camı, ${lensCount} Kontakt Lens)! Aşağıdan inceleyip onaylayabilirsiniz.`,
      });

      // Update file state locally
      setDriveFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'completed', extractedCount: res.lenses.length } : f))
      );
    } else {
      setStatusMessage({
        type: 'error',
        message: res.error || 'Dosya taranırken bir hata oluştu veya ürün bulunamadı.',
      });
    }
  };

  // Handle Batch Scan of all or selected files
  const handleBatchScanAll = async () => {
    if (!driveFiles || driveFiles.length === 0) return;

    setIsBatchScanning(true);
    setStatusMessage({
      type: 'info',
      message: 'Drive klasöründeki belgeler yönetici kurallarıyla taranıyor...',
    });

    const targetFiles = driveFiles.slice(0, 8); // Scan top prioritized files
    let accumulatedLenses: Lens[] = [];

    for (let i = 0; i < targetFiles.length; i++) {
      const file = targetFiles[i];
      const effectiveFileMarkup = file.profitMarkup !== undefined && file.profitMarkup > 0 ? file.profitMarkup : profitMarkup;
      setBatchProgress({
        current: i + 1,
        total: targetFiles.length,
        filename: file.name,
      });

      const effectivePriceMode =
        adminPriceMode !== 'auto'
          ? adminPriceMode
          : file.listType === 'toptan'
          ? 'wholesale'
          : file.listType === 'perakende'
          ? 'retail'
          : 'auto';

      const res = await scanSingleDriveFile(file, {
        priceMode: effectivePriceMode,
        profitMarkup: effectivePriceMode === 'retail' ? 1.0 : effectiveFileMarkup,
        productTypeHint: productTypeHint,
      });
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
        message: `Toplu tarama tamamlandı! Toplam ${accumulatedLenses.length} ürün tespit edildi.`,
      });
    }
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
      message: `Taranan ${previewLenses.length} ürün başarıyla sistem belleğine eklendi (${
        mode === 'replace' ? 'Katalog yenilendi' : 'Mevcut kataloğa eklendi'
      }).`,
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

    const res = await uploadAndScanDocument(file, undefined, {
      priceMode: adminPriceMode,
      profitMarkup,
      productTypeHint,
    });
    if (res.success && res.lenses.length > 0) {
      setPreviewSourceName(file.name);
      setPreviewLenses(res.lenses);
      setStatusMessage({
        type: 'success',
        message: `"${file.name}" belgesinden ${res.lenses.length} ürün başarıyla okundu!`,
      });
    } else {
      setStatusMessage({
        type: 'error',
        message: res.error || 'Dosyadan ürün bilgisi okunamadı.',
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

        {/* ADMIN DECISION PANEL: WHOLESALE VS RETAIL & MARKUP */}
        {isAdmin && (
          <div className="p-4 sm:p-5 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-200/60 text-amber-900">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Yönetici Fiyatlandırma & Liste Türü Kararı
                </h3>
              </div>
              <span className="text-[11px] font-medium text-amber-800">
                Tarama esnasında bu kurallar Gemini AI tarafından doğrudan uygulanır
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {/* Decision: Wholesale vs Retail */}
              <div className="bg-white p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Liste Fiyat Türü Kararı</span>
                </label>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <button
                    onClick={() => setAdminPriceMode('auto')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      adminPriceMode === 'auto'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚡ Otomatik
                  </button>
                  <button
                    onClick={() => setAdminPriceMode('wholesale')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      adminPriceMode === 'wholesale'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏢 Toptan (TFL)
                  </button>
                  <button
                    onClick={() => setAdminPriceMode('retail')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      adminPriceMode === 'retail'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏷️ Perakende
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {adminPriceMode === 'wholesale'
                    ? 'Yönetici kararı: Listeler toptan alış maliyetidir. Satış fiyatı kâr çarpanıyla türetilir.'
                    : adminPriceMode === 'retail'
                    ? 'Yönetici kararı: Listeler doğrudan son kullanıcı perakende tavsiye satış fiyatıdır.'
                    : 'Belge başlığı (PFL/TFL) ve içeriğe göre otomatik belirlenir.'}
                </p>
              </div>

              {/* Profit Markup Multiplier (No Limit) */}
              <div className="bg-white p-3 rounded-xl border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-700" />
                    <span>Varsayılan Toptan Kâr Marjı (Sınırsız)</span>
                  </label>
                  <span className="font-mono text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                    {profitMarkup}x (+%{Math.round((profitMarkup - 1) * 100)} Kâr)
                  </span>
                </div>

                {/* Quick Multiplier Chips */}
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    { mult: 1.5, label: '1.5x (%50)' },
                    { mult: 1.8, label: '1.8x (%80)' },
                    { mult: 2.0, label: '2.0x (%100)' },
                    { mult: 2.5, label: '2.5x (%150)' },
                    { mult: 3.0, label: '3.0x (%200)' },
                    { mult: 4.0, label: '4.0x (%300)' },
                    { mult: 5.0, label: '5.0x (%400)' },
                  ].map((m) => (
                    <button
                      key={m.mult}
                      onClick={() => setProfitMarkup(m.mult)}
                      className={`py-1 px-2 rounded-lg font-semibold transition border ${
                        profitMarkup === m.mult
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Free / Custom Input (No Max Limit) */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">Özel Çarpan / Kâr:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0.01"
                      step="0.05"
                      value={profitMarkup}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setProfitMarkup(val);
                        }
                      }}
                      placeholder="Örn: 2.75 veya 3.50 (Sınırsız)"
                      className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                      x
                    </span>
                  </div>
                  <button
                    onClick={handleApplyGlobalMarkupToAllWholesale}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition whitespace-nowrap"
                    title="Bu kâr marjını aşağıdaki tüm toptan liste kutularına uygula"
                  >
                    Tüm Kutulara Uygula
                  </button>
                </div>

                <p className="text-[10px] text-slate-500">
                  Örnek Hesaplama: Toptan <strong>1.000 ₺</strong> alış maliyetli cam/lens, perakende satış fiyatı olarak{' '}
                  <strong className="text-amber-800">{(1000 * profitMarkup).toLocaleString('tr-TR')} ₺</strong> (+%{Math.round((profitMarkup - 1) * 100)} kâr) hesaplanır.
                </p>
              </div>

              {/* Product Type Hint */}
              <div className="bg-white p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tarama Ürün Türü Kriteri</span>
                </label>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <button
                    onClick={() => setProductTypeHint('auto')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      productTypeHint === 'auto'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setProductTypeHint('eyeglass_lens')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      productTypeHint === 'eyeglass_lens'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    👓 Gözlük Camı
                  </button>
                  <button
                    onClick={() => setProductTypeHint('contact_lens')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      productTypeHint === 'contact_lens'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    👁️ Kontakt Lens
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Kontakt lensler için BC, kutu adedi, değişim sıklığı gibi özel nitelikler otomatik taranır.
                </p>
              </div>
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
                    Taranan Ürün Önizlemesi ({previewLenses.length} Ürün Bulundu)
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Kaynak: <strong>{previewSourceName}</strong> •{' '}
                  <span className="font-medium text-indigo-700">
                    {previewLenses.filter((l) => !isContactLens(l)).length} Gözlük Camı,{' '}
                    {previewLenses.filter((l) => isContactLens(l)).length} Kontakt Lens
                  </span>
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
                  <span>Kataloğa Ekle (Mevcut Verilerle Birleştir)</span>
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

            {/* Quick Profit Margin Recalculator for Previewed Products */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-indigo-100 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-600" />
                <span>Önizleme Listesi İçin Kâr Marjını Yeniden Hesapla:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => {
                      const updated = previewLenses.map((l) => {
                        const baseWholesale = l.wholesalePrice > 0 ? l.wholesalePrice : Math.round(l.retailPrice / 2);
                        return {
                          ...l,
                          wholesalePrice: baseWholesale,
                          retailPrice: Math.round(baseWholesale * pm),
                        };
                      });
                      setPreviewLenses(updated);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-900 rounded font-semibold text-[11px] border border-slate-200 transition"
                  >
                    {pm}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable table of extracted items */}
            <div className="max-h-64 overflow-y-auto border border-indigo-100 rounded-xl bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2.5">Tür</th>
                    <th className="p-2.5">Marka & Model</th>
                    <th className="p-2.5">Özellikler / İndeks</th>
                    <th className="p-2.5 text-right">Toptan Fiyat</th>
                    <th className="p-2.5 text-right">Perakende Fiyat</th>
                    <th className="p-2.5">Detay / Kutu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewLenses.slice(0, 20).map((pl, idx) => {
                    const isContact = isContactLens(pl);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5">
                          {isContact ? (
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold inline-flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Kontakt Lens</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Gözlük Camı
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          <span className="font-bold text-sky-700 mr-1.5">[{pl.brand}]</span>
                          {pl.name}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {isContact ? (
                            <span>
                              {pl.wearPeriod === 'daily' ? 'Günlük' : 'Aylık'} • BC {pl.baseCurve || '8.6'}
                            </span>
                          ) : (
                            <span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] mr-1">
                                {pl.index}
                              </span>
                              {pl.coating}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          {pl.wholesalePrice > 0 ? `${pl.wholesalePrice.toLocaleString('tr-TR')} ₺` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {pl.retailPrice > 0 ? `${pl.retailPrice.toLocaleString('tr-TR')} ₺` : '-'}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-500 truncate max-w-xs">
                          {isContact ? pl.boxContent || 'Kutu' : pl.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {previewLenses.length > 20 && (
              <p className="text-[11px] text-slate-500 text-center">
                ...ve {previewLenses.length - 20} adet daha ürün bulundu
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
                    onClick={() => {
                      if (window.confirm('Katalogdaki tüm verileri silmek istediğinize emin misiniz?')) {
                        onResetToDefaultCatalog();
                        setStatusMessage({
                          type: 'success',
                          message: 'Katalogdaki tüm veriler temizlendi.',
                        });
                      }
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                    title="Katalogdaki tüm ürünleri siler"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Kataloğu Temizle (Boşalt)</span>
                  </button>

                  <button
                    onClick={handleBatchScanAll}
                    disabled={isBatchScanning}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Tüm Drive Klasörünü AI ile Tara (19 Belge)</span>
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
                    onClick={() => {
                      if (window.confirm('Katalogdaki tüm verileri silmek istediğinize emin misiniz?')) {
                        onResetToDefaultCatalog();
                        setStatusMessage({
                          type: 'success',
                          message: 'Katalogdaki tüm veriler temizlendi.',
                        });
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Kataloğu Temizle</span>
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
              Gözlük camları (Rodenstock, Zeiss, Seiko, Hoya, Fuji...) ve Kontakt Lensler (CooperVision, Opsa, B+L...)
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
              value={fileFilterDistributor}
              onChange={(e) => setFileFilterDistributor(e.target.value)}
              aria-label="Dağıtıcı Üst Firmaya Göre Filtrele"
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tüm Dağıtıcılar</option>
              {availableDistributors.map((d) => (
                <option key={d} value={d}>
                  🏢 {d}
                </option>
              ))}
            </select>

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

        {/* Product Type & List Type Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFileTypeTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition ${
              fileTypeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tüm Belgeler ({driveFiles.length})
          </button>
          <button
            onClick={() => setFileTypeTab('eyeglass')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              fileTypeTab === 'eyeglass'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span>👓 Gözlük Camı Listeleri</span>
            <span className="opacity-80">
              ({driveFiles.filter((f) => f.category !== 'contact_lens' && !f.name.toLowerCase().includes('lens')).length})
            </span>
          </button>
          <button
            onClick={() => setFileTypeTab('contact')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              fileTypeTab === 'contact'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <span>👁️ Kontakt Lens Listeleri</span>
            <span className="opacity-80">
              ({driveFiles.filter((f) => f.category === 'contact_lens' || f.name.toLowerCase().includes('lens')).length})
            </span>
          </button>
          <button
            onClick={() => setFileTypeTab('toptan')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              fileTypeTab === 'toptan'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>🏢 Toptan Listeler (TFL)</span>
            <span className="opacity-80">
              ({driveFiles.filter((f) => f.listType === 'toptan').length})
            </span>
          </button>
          <button
            onClick={() => setFileTypeTab('perakende')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              fileTypeTab === 'perakende'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>🏷️ Perakende Listeler (PFL)</span>
            <span className="opacity-80">
              ({driveFiles.filter((f) => f.listType === 'perakende').length})
            </span>
          </button>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFiles.map((file) => {
            const isScanningThis = scanningFileId === file.id;
            const isContact = file.category === 'contact_lens' || file.name.toLowerCase().includes('lens');
            const fileDist = file.distributor || getDistributorForBrand(file.brand, file.name);
            const distInfo = fileDist ? getDistributorInfo(fileDist) : undefined;

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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                            {file.brand}
                          </span>
                          {fileDist && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileFilterDistributor(fileDist);
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border cursor-pointer hover:opacity-80 transition ${
                                distInfo?.badgeColor || 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                              title={`Üst Dağıtıcı: ${fileDist} (Filtrelemek için tıklayın)`}
                            >
                              🏢 {distInfo?.shortName || fileDist}
                            </span>
                          )}
                        </div>
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

                  {/* Badges & Product Type */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {/* Eyeglass vs Contact Lens Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                        isContact
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {isContact ? <Eye className="w-3 h-3" /> : null}
                      <span>{isContact ? 'Kontakt Lens' : 'Gözlük Camı'}</span>
                    </span>

                    {/* Wholesale vs Retail Badge with Admin Toggle Button */}
                    <button
                      onClick={() => isAdmin && handleToggleFileListType(file.id)}
                      disabled={!isAdmin}
                      title={isAdmin ? 'Tıklayarak Toptan / Perakende türünü değiştirin' : undefined}
                      className={`px-2 py-0.5 rounded-md font-semibold transition flex items-center gap-1 ${
                        file.listType === 'toptan'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                          : file.listType === 'perakende'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                          : file.listType === 'kampanya'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>
                        {file.listType === 'toptan'
                          ? 'Toptan (TFL)'
                          : file.listType === 'perakende'
                          ? 'Perakende (PFL)'
                          : file.listType === 'kampanya'
                          ? 'Kampanya'
                          : 'Liste'}
                      </span>
                      {isAdmin && <span className="text-[9px] opacity-70">⇄</span>}
                    </button>

                    {file.sizeFormatted && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-mono">
                        {file.sizeFormatted}
                      </span>
                    )}

                    {file.extractedCount && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{file.extractedCount} Ürün</span>
                      </span>
                    )}
                  </div>

                  {/* PRICE DISPLAY / PROFIT MARGIN OPTION */}
                  {(() => {
                    const isRetail = file.listType === 'perakende' && adminPriceMode !== 'wholesale';
                    const isWholesale = file.listType === 'toptan' || adminPriceMode === 'wholesale';
                    const effectiveFileMarkup = file.profitMarkup !== undefined && file.profitMarkup > 0 ? file.profitMarkup : profitMarkup;
                    const profitPercent = Math.round((effectiveFileMarkup - 1) * 100);

                    if (isRetail) {
                      return (
                        <div className="p-2.5 rounded-lg border text-xs space-y-1 bg-emerald-50/80 border-emerald-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Tavsiye Satış Fiyatı (PFL):</span>
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300">
                              Çarpan Yok (Liste Fiyatı)
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-800/90 leading-relaxed">
                            Bu listede doğrudan tavsiye edilen perakende satış fiyatları yer alır. Kâr çarpanı uygulanmaz; net alış maliyeti marka iskontonuz üzerinden hesaplanır.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div
                        className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition ${
                          isWholesale
                            ? 'bg-amber-50/80 border-amber-200'
                            : 'bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                            <Percent className="w-3 h-3 text-amber-700" />
                            <span>Toptan Kâr Marjı (Alış → Satış):</span>
                          </span>
                          <span
                            className={`font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded border ${
                              isWholesale
                                ? 'bg-white text-amber-800 border-amber-300 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300'
                            }`}
                          >
                            {effectiveFileMarkup}x {profitPercent >= 0 ? `(+%${profitPercent})` : ''}
                          </span>
                        </div>

                        {isAdmin ? (
                          <div className="space-y-1.5">
                            {/* Preset Buttons */}
                            <div className="grid grid-cols-4 gap-1 text-[10px]">
                              {[
                                { mult: 1.5, label: '1.5x' },
                                { mult: 2.0, label: '2.0x' },
                                { mult: 2.5, label: '2.5x' },
                                { mult: 3.0, label: '3.0x' },
                              ].map((m) => (
                                <button
                                  key={m.mult}
                                  type="button"
                                  onClick={() => handleUpdateFileProfitMarkup(file.id, m.mult)}
                                  className={`py-0.5 rounded font-bold transition border ${
                                    effectiveFileMarkup === m.mult
                                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                      : 'bg-white text-slate-700 border-amber-200/90 hover:bg-amber-100/70'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>

                            {/* Free / Custom Input (No Bounds / No Upper Limits) */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">
                                Özel Çarpan:
                              </span>
                              <div className="relative flex-1">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.05"
                                  value={effectiveFileMarkup}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0) {
                                      handleUpdateFileProfitMarkup(file.id, val);
                                    }
                                  }}
                                  placeholder="Sınırsız (Örn: 3.5, 5)"
                                  className="w-full px-2 py-0.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                />
                                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                                  x
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600">
                            Toptan liste fiyatı üzerine <strong>{effectiveFileMarkup}x</strong> (%{profitPercent}) kâr marjı uygulanmaktadır.
                          </div>
                        )}

                        {/* Live Price Conversion Demonstration */}
                        <div className="text-[10px] text-slate-600 pt-0.5 flex items-center justify-between border-t border-slate-200/70">
                          <span>Hesaplama:</span>
                          <span className="font-mono text-slate-800 font-semibold">
                            1.000 ₺ Alış ➔ <strong className="text-amber-800 font-bold">{(1000 * effectiveFileMarkup).toLocaleString('tr-TR')} ₺</strong> Satış
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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
              <span className="font-bold text-rose-900 block">Kataloğu Temizle (Boşalt)</span>
              <p className="text-[11px] text-rose-700">
                Tarayıcı belleğinde kalmış tüm eski demo verileri ve mevcut katalog listelerini tamamen silerek sıfırlar.
              </p>
              <button
                onClick={() => {
                  if (!showClearConfirm) {
                    setShowClearConfirm(true);
                    setTimeout(() => setShowClearConfirm(false), 4000);
                    return;
                  }
                  setShowClearConfirm(false);
                  onResetToDefaultCatalog();
                  setStatusMessage({
                    type: 'success',
                    message: 'Katalogdaki tüm eski veriler tamamen temizlendi.',
                  });
                }}
                className={`w-full py-2 rounded-lg font-bold transition ${
                  showClearConfirm
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-rose-100 hover:bg-rose-200 text-rose-900'
                }`}
              >
                {showClearConfirm ? 'Emin misiniz? (Evet, Tamamen Sil)' : 'Tüm Kataloğu Temizle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
