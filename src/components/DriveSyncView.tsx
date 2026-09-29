import React, { useState, useEffect, useRef } from 'react';
import { DriveSyncConfig, Lens, ParsedDriveFile } from '../types';
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
  fetchFromDriveUrl,
  parseExcelOrCsvData,
} from '../utils/driveSync';
import { isContactLens } from '../utils/pricing';
import { getDistributorForBrand, getDistributorInfo, DISTRIBUTORS_LIST } from '../data/distributors';
import { FlipbookViewer } from './FlipbookViewer';
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
  BookOpen,
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
  const [driveFiles, setDriveFiles] = useState<DriveFolderFileInfo[]>(() => {
    try {
      const cached = localStorage.getItem('optik_drive_files_list_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load cached drive files:', e);
    }
    return KNOWN_DRIVE_FILES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('optik_drive_files_list_v1', JSON.stringify(driveFiles));
    } catch (e) {
      console.error('Failed to save drive files to localStorage:', e);
    }
  }, [driveFiles]);

  const handleRemoveFileFromList = (fileId: string) => {
    setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });
    setStatusMessage({
      type: 'success',
      message: 'Dosya listeden kaldırıldı. Bir sonraki taramada veya güncellemede göz ardı edilecektir.',
    });
  };

  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileFilterBrand, setFileFilterBrand] = useState<string>('all');
  const [fileFilterDistributor, setFileFilterDistributor] = useState<string>('all');
  const [fileFilterFormat, setFileFilterFormat] = useState<string>('all');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [fileTypeTab, setFileTypeTab] = useState<'all' | 'eyeglass' | 'contact' | 'toptan' | 'kampanyalar' | 'karisik'>('all');

  // Multi-selection and Single List Import Modal state
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFileForModal, setSelectedFileForModal] = useState<DriveFolderFileInfo | null>(null);
  const [modalImportMode, setModalImportMode] = useState<'replace_brand' | 'merge' | 'replace_all'>('replace_brand');
  const [directLinkInput, setDirectLinkInput] = useState<string>('');
  const [isDirectLinkScanning, setIsDirectLinkScanning] = useState<boolean>(false);

  // Admin Price Mode & Product Type decision state
  const [adminPriceMode, setAdminPriceMode] = useState<'auto' | 'wholesale' | 'retail' | 'karisik'>('auto');
  const [profitMarkup, setProfitMarkup] = useState<number>(2.0);
  const [productTypeHint, setProductTypeHint] = useState<'auto' | 'eyeglass_lens' | 'contact_lens'>('auto');

  // Scanning state
  const [subTab, setSubTab] = useState<'files' | 'scanning' | 'manual_json'>('files');
  const [copied, setCopied] = useState(false);
  const [manualJsonText, setManualJsonText] = useState<string>('');
  const [manualJsonError, setManualJsonError] = useState<string | null>(null);
  const [parsedManualLenses, setParsedManualLenses] = useState<Lens[] | null>(null);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const PROMPT_TEXT = `Sen optik ve oküler ürün kataloglarını (optik camlar, kontakt lensler, kaplamalar ve laboratuvar işçilik hizmetleri) analiz etmekle görevli uzman bir veri işleme asistanısın.

GÖREV:
Sana sunulan belge, görsel veya metin formatındaki optik fiyat listesini satır satır analiz et ve aşağıdaki strict (katı) kurallara uygun, temiz ve geçerli tek bir JSON dizisi (array) oluştur.

KURALLAR VE ALAN KISITLAMALARI:

1. ÇIKTI FORMATI:
   - Sadece ve sadece geçerli bir JSON dizisi (array) döndür.
   - Kod bloğundan önce veya sonra hiçbir açıklama, selamlama veya dipnot YAZMA.
   - Yorum satırı (// veya /* */) KULLANMA.

2. ALAN TİPLERİ VE DEĞER KISITLAMALARI:

   - productType (string):
     * "eyeglass_lens" (Gözlük camları)
     * "contact_lens" (Kontakt lensler)
     * "service" (Kaplama, renklendirme, özel işçilik ve imalat hizmetleri)

   - category (string):
     * "single_vision" (Tek odaklı)
     * "progressive" (Progresif)
     * "office" (Ofis/Degresif/Yakın-Orta)
     * "bifocal" (Bifokal)
     * "photochromic" (Fotokromik/Kolormatik)
     * "drive" (Sürüş)
     * "sun_polarized" (Güneş / Polarize)
     * "myopia_control" (Miyopi kontrol / Defocus)
     * "specialty" (Bikonveks, Bikonkav, Lentiküler, Medikal vb.)
     * "therapeutic" (Terapatik / FL41 / Özel filtreler)
     * "contact_lens" (Kontakt lensler)
     * "customization" (İşçilik, çap küçültme, prizma, kaplama silme vb.)

   - index (string veya null):
     * İzin verilen değerler: "1.49", "1.50", "1.53", "1.56", "1.57", "1.58", "1.59", "1.60", "1.61", "1.67", "1.74", "1.80", "1.90"
     * Hizmetler (service) veya indeksi belirtilmeyen ürünler için null geç.

   - deliveryType (string):
     * "stock" (Stok camlar)
     * "rx" (Özel üretim / Sipariş camlar)
     * "custom" (İşçilik, kaplama farkı, filtre boyama hizmetleri)

   - KONTAKT LENS ALANLARI (Sadece productType = "contact_lens" ise doldur, aksi halde null bırak):
     * wearPeriod: "daily" | "monthly" | null
     * lensType: "spheric" | "toric" | "multifocal" | "color" | null

3. VARYASYONLAR VE FİYATLANDIRMA:
   - Aynı model altında farklı materyal (örn: Beyaz, Transitions, Polarize), farklı numara grupları (örn: 6/2, 8/4) veya indeks ayrımı varsa, her bir kombinasyonu ayrı bir JSON nesnesi (item) olarak kır veya name/series alanında belirterek açıkça ayır.
   - Fiyatlar sayısal (number) olmalıdır. Para birimi simgelerini (₺, $, €) kaldır.
   - Bilinmeyen veya belgede yer almayan alanlar için null kullan.

JSON ŞEMASI:

[
  {
    "brand": "Marka Adı (Örn: Novax, Zeiss, Selcon)",
    "series": "Ürün Serisi / Ailesi (Örn: Nucleo, SmartLife, Excelite) veya null",
    "name": "Tam Ürün Adı / Varyasyon Açıklaması",
    "productType": "eyeglass_lens | contact_lens | service",
    "category": "single_vision | progressive | office | bifocal | photochromic | drive | sun_polarized | myopia_control | specialty | therapeutic | contact_lens | customization",
    "index": "1.61",
    "material": "Hammadde (Örn: Organik, MR-8, Polikarbon, Trivex, Mineral) veya null",
    "coating": "Kaplama Bilgisi (Örn: PixarUV Granite, DuraVision, HMC) veya null",
    "wholesalePrice": null,
    "retailPrice": 2500,
    "currency": "TRY",
    "sphRange": "-6.00 / +6.00",
    "cylMax": 2,
    "diameter": "70/75",
    "baseCurve": "8.6",
    "boxContent": "6'lı Kutu",
    "wearPeriod": "daily | monthly",
    "lensType": "spheric | toric | multifocal | color",
    "deliveryType": "stock | rx | custom",
    "code": "Sipariş / Ürün Kodu"
  }
]`;

  const handleValidateManualJson = (text: string) => {
    setManualJsonText(text);
    if (!text.trim()) {
      setManualJsonError(null);
      setParsedManualLenses(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setManualJsonError('Hata: JSON verisi bir dizi (Array - [ ... ]) formatında olmalıdır.');
        setParsedManualLenses(null);
        return;
      }

      if (parsed.length === 0) {
        setManualJsonError('Hata: JSON dizisi boş.');
        setParsedManualLenses(null);
        return;
      }

      const invalidItems: string[] = [];
      const validatedLenses: Lens[] = parsed.map((item: any, idx: number) => {
        if (!item.brand || !item.name) {
          invalidItems.push(`Satır ${idx + 1}: "brand" (marka) ve "name" (ürün adı) alanları zorunludur.`);
        }
        
        return {
          id: item.id || `manual-${idx}-${Date.now()}`,
          brand: String(item.brand || '').trim(),
          name: String(item.name || '').trim(),
          productType: item.productType || (isContactLens(item) ? 'contact_lens' : 'eyeglass_lens'),
          category: item.category || 'single_vision',
          index: String(item.index || '1.50'),
          material: String(item.material || ''),
          coating: String(item.coating || ''),
          wholesalePrice: Number(item.wholesalePrice || 0),
          retailPrice: Number(item.retailPrice || 0),
          currency: item.currency || 'TRY',
          sphRange: item.sphRange || '',
          cylMax: item.cylMax || undefined,
          diameter: item.diameter || '',
          baseCurve: item.baseCurve || '',
          boxContent: item.boxContent || '',
          wearPeriod: item.wearPeriod || undefined,
          lensType: item.lensType || undefined,
          deliveryType: item.deliveryType || 'stock',
          notes: item.notes || '',
          isCustom: true,
          updatedAt: new Date().toISOString(),
          sourceListType: item.sourceListType || 'genel',
          sourceFileName: 'Manuel JSON İçe Aktarma'
        };
      });

      if (invalidItems.length > 0) {
        setManualJsonError(`Doğrulama Hatası:\n${invalidItems.slice(0, 3).join('\n')}${invalidItems.length > 3 ? '\n...ve dahası' : ''}`);
        setParsedManualLenses(null);
        return;
      }

      setManualJsonError(null);
      setParsedManualLenses(validatedLenses);
    } catch (err: any) {
      setManualJsonError(`Geçersiz JSON formatı: ${err.message || 'Lütfen parantezleri ve virgülleri kontrol edin.'}`);
      setParsedManualLenses(null);
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleValidateManualJson(text);
    };
    reader.readAsText(file);
  };

  const handleApplyManualLenses = (mode: 'merge' | 'replace') => {
    if (!parsedManualLenses || parsedManualLenses.length === 0) return;
    onUpdateLenses(parsedManualLenses, mode);

    setStatusMessage({
      type: 'success',
      message: `Manuel olarak girilen ${parsedManualLenses.length} ürün başarıyla yüklendi ve Firestore veritabanına kaydedildi (${
        mode === 'replace' ? 'Mevcut katalog sıfırlandı' : 'Mevcut kataloğa eklendi'
      }).`,
    });

    setManualJsonText('');
    setParsedManualLenses(null);
  };

  const [activeFlipbookFile, setActiveFlipbookFile] = useState<ParsedDriveFile | null>(null);
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
      try {
        const files = await fetchDriveFiles(folderUrl);
        if (isMounted && files && files.length > 0) {
          setDriveFiles(files);
        }
      } catch (err) {
        console.warn('Could not refresh drive files on mount, keeping current/cached list of files:', err);
      } finally {
        if (isMounted) {
          setIsLoadingFiles(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [folderUrl]);

  // Explicit folder refresh handler (invoked by user click)
  const handleRefreshFolderFiles = async () => {
    setIsLoadingFiles(true);
    setStatusMessage({
      type: 'info',
      message: 'Google Drive klasörü taranıyor ve güncel dosya listesi alınıyor...',
    });
    try {
      const files = await fetchDriveFiles(folderUrl);
      setDriveFiles(files);
      const updatedCfg: DriveSyncConfig = {
        ...config,
        sourceUrl: folderUrl,
        lastSyncTime: new Date().toISOString(),
      };
      onSaveConfig(updatedCfg);
      setStatusMessage({
        type: 'success',
        message: `Google Drive klasörü başarıyla güncellendi! ${files.length} adet belge listelendi.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: `Klasör güncellenemedi: ${err.message || 'Bilinmeyen hata oluştu'}`,
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

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
          let nextType: 'toptan' | 'karisik' | 'kampanya' = 'toptan';
          if (f.listType === 'toptan') {
            nextType = 'karisik';
          } else if (f.listType === 'karisik') {
            nextType = 'kampanya';
          } else {
            nextType = 'toptan';
          }

          // Also sync folderCategory so that filtering updates instantly
          let folderCategory: 'toptan_fiyatlar' | 'karisik' | 'kampanyalar' = 'toptan_fiyatlar';
          if (nextType === 'karisik') {
            folderCategory = 'karisik';
          } else if (nextType === 'kampanya') {
            folderCategory = 'kampanyalar';
          }

          return { ...f, listType: nextType, folderCategory };
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
      matchTypeTab = f.folderCategory === 'toptan_fiyatlar' || f.listType === 'toptan';
    } else if (fileTypeTab === 'kampanyalar') {
      matchTypeTab = f.folderCategory === 'kampanyalar' || f.listType === 'kampanya';
    } else if (fileTypeTab === 'karisik') {
      matchTypeTab = f.folderCategory === 'karisik' || f.listType === 'karisik';
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

    const effectivePriceMode =
      adminPriceMode !== 'auto'
        ? adminPriceMode
        : file.listType === 'toptan'
        ? 'wholesale'
        : file.listType === 'perakende'
        ? 'retail'
        : file.listType === 'karisik'
        ? 'karisik'
        : 'auto';

    const isRetailList = effectivePriceMode === 'retail';
    const isKarisikList = effectivePriceMode === 'karisik';

    setStatusMessage({
      type: 'info',
      message: `"${file.name}" dosyası Google Drive'dan indiriliyor ve Gemini AI Vision ile taranıyor (Fiyat Modu: ${
        isKarisikList
          ? 'Karışık Liste (Maliyet Ürün Kodunda, Perakende Açık) - Kod çözücü devrede!'
          : isRetailList
          ? 'Perakende Liste - Kâr çarpanı uygulanmaz, listedeki tavsiye satış fiyatı doğrudan aktarılır'
          : `Toptan Alış + ${effectiveFileMarkup}x Kâr Marjı`
      })...`,
    });

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
      if ((res as any).isDeleted) {
        setStatusMessage({
          type: 'error',
          message: `"${file.name}" dosyası Google Drive'dan silindiği veya erişilemez olduğu için listeden kaldırıldı.`,
        });
        handleRemoveFileFromList(file.id);
      } else {
        setStatusMessage({
          type: 'error',
          message: res.error || 'Dosya taranırken bir hata oluştu veya ürün bulunamadı.',
        });
      }
    }
  };

  // Handle Batch Scan of all or selected files
  const handleBatchScanAll = async () => {
    if (!driveFiles || driveFiles.length === 0) return;

    setSubTab('scanning');
    setIsBatchScanning(true);
    setStatusMessage({
      type: 'info',
      message: 'Drive klasöründeki belgeler yönetici kurallarıyla taranıyor...',
    });

    const targetFiles = driveFiles; // Scan all detected files from the drive folder
    
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
          : file.listType === 'karisik'
          ? 'karisik'
          : 'auto';

      try {
        const res = await scanSingleDriveFile(file, {
          priceMode: effectivePriceMode,
          profitMarkup: effectivePriceMode === 'retail' ? 1.0 : effectiveFileMarkup,
          productTypeHint: productTypeHint,
        });

        if (res.success && res.lenses.length > 0) {
          // Real-time update: Add lenses to catalog as soon as file is finished
          onUpdateLenses(res.lenses, 'merge');
          
          // Update file state locally
          setDriveFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: 'completed', extractedCount: res.lenses.length } : f))
          );
        } else if (!res.success) {
          console.error(`Error scanning ${file.name}:`, res.error);
          if ((res as any).isDeleted) {
            console.log(`Auto-removing deleted file from list during batch scan: ${file.name}`);
            handleRemoveFileFromList(file.id);
          } else {
            setDriveFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, status: 'error', errorMessage: res.error } : f))
            );
          }
        }
      } catch (err: any) {
        console.error(`Fatal error scanning ${file.name}:`, err);
        setDriveFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'error', errorMessage: err.message } : f))
        );
      }
    }

    setIsBatchScanning(false);
    setStatusMessage({
      type: 'success',
      message: `Toplu tarama tamamlandı! Tüm ürünler kataloğa gerçek zamanlı olarak eklendi.`,
    });
  };

  // Handle selection toggling
  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  // Handle Dedicated Single File Import with Mode Decision (replace_brand, merge, replace_all)
  const handleExecuteImportSingleFile = async (
    file: DriveFolderFileInfo,
    mode: 'replace_brand' | 'merge' | 'replace_all' = modalImportMode
  ) => {
    setSelectedFileForModal(null);
    setScanningFileId(file.id);

    const isContact = file.productType === 'contact_lens' || isContactLens(file.name);
    const effectiveFileMarkup =
      file.profitMarkup !== undefined && file.profitMarkup > 0 ? file.profitMarkup : profitMarkup;

    const effectivePriceMode =
      adminPriceMode !== 'auto'
        ? adminPriceMode
        : file.listType === 'toptan'
        ? 'wholesale'
        : file.listType === 'perakende'
        ? 'retail'
        : file.listType === 'karisik'
        ? 'karisik'
        : 'auto';

    setStatusMessage({
      type: 'info',
      message: `"${file.name}" listesi Google Drive'dan taranıyor ve sisteme dahil ediliyor...`,
    });

    try {
      const res = await scanSingleDriveFile(file, {
        priceMode: effectivePriceMode,
        profitMarkup: effectivePriceMode === 'retail' ? 1.0 : effectiveFileMarkup,
        productTypeHint: isContact ? 'contact_lens' : 'eyeglass_lens',
      });

      if (res.success && res.lenses.length > 0) {
        if (mode === 'replace_brand') {
          // Clean existing lenses for this brand and insert the new list
          const brandLower = file.brand.trim().toLowerCase();
          const remainingLenses = lenses.filter(
            (l) => l.brand.trim().toLowerCase() !== brandLower
          );
          onUpdateLenses([...remainingLenses, ...res.lenses], 'replace');
          setStatusMessage({
            type: 'success',
            message: `"${file.brand}" markasının eski listesi silindi ve Drive'daki güncel listeden ${res.lenses.length} adet yeni ürün başarıyla sisteme yüklendi!`,
          });
        } else if (mode === 'replace_all') {
          onUpdateLenses(res.lenses, 'replace');
          setStatusMessage({
            type: 'success',
            message: `Tüm katalog sıfırlandı ve sadece "${file.name}" dosyasından ${res.lenses.length} ürün yüklendi!`,
          });
        } else {
          // Merge mode
          onUpdateLenses(res.lenses, 'merge');
          setStatusMessage({
            type: 'success',
            message: `"${file.name}" dosyasından ${res.lenses.length} ürün mevcut kataloğunuza başarıyla eklendi!`,
          });
        }

        // Update local file status
        setDriveFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'completed', extractedCount: res.lenses.length }
              : f
          )
        );
      } else {
        if ((res as any).isDeleted) {
          setStatusMessage({
            type: 'error',
            message: `"${file.name}" dosyası Google Drive'dan silindiği veya erişilemez olduğu için listeden kaldırıldı.`,
          });
          handleRemoveFileFromList(file.id);
        } else {
          setStatusMessage({
            type: 'error',
            message: res.error || 'Dosyadan ürün bilgileri okunamadı.',
          });
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: `İçe aktarma hatası: ${err.message || 'Bilinmeyen hata'}`,
      });
    } finally {
      setScanningFileId(null);
    }
  };

  // Handle Scanning Selected Multiple Files
  const handleBatchScanSelected = async () => {
    const targetFiles = driveFiles.filter((f) => selectedFileIds.has(f.id));
    if (targetFiles.length === 0) return;

    setSubTab('scanning');
    setIsBatchScanning(true);
    setStatusMessage({
      type: 'info',
      message: `Seçilen ${targetFiles.length} liste taranıyor ve sisteme dahil ediliyor...`,
    });

    for (let i = 0; i < targetFiles.length; i++) {
      const file = targetFiles[i];
      const effectiveFileMarkup =
        file.profitMarkup !== undefined && file.profitMarkup > 0 ? file.profitMarkup : profitMarkup;
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

      try {
        const res = await scanSingleDriveFile(file, {
          priceMode: effectivePriceMode,
          profitMarkup: effectivePriceMode === 'retail' ? 1.0 : effectiveFileMarkup,
          productTypeHint: productTypeHint,
        });

        if (res.success && res.lenses.length > 0) {
          onUpdateLenses(res.lenses, 'merge');
          setDriveFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'completed', extractedCount: res.lenses.length }
                : f
            )
          );
        } else if (!(res as any).success && (res as any).isDeleted) {
          console.log(`Auto-removing deleted file from list during batch selected scan: ${file.name}`);
          handleRemoveFileFromList(file.id);
        }
      } catch (err) {
        console.error(`Error scanning selected file ${file.name}:`, err);
      }
    }

    setIsBatchScanning(false);
    setSelectedFileIds(new Set());
    setStatusMessage({
      type: 'success',
      message: `Seçilen ${targetFiles.length} listenin tümü başarıyla taranarak kataloğunuza dahil edildi!`,
    });
  };

  // Direct Drive URL / Share Link Import
  const handleDirectLinkScan = async () => {
    if (!directLinkInput.trim()) return;

    setIsDirectLinkScanning(true);
    setStatusMessage({
      type: 'info',
      message: 'Belirtilen bağlantı taranıyor ve ürünler ayrıştırılıyor...',
    });

    try {
      const url = directLinkInput.trim();
      const isSheetOrCsv = url.includes('spreadsheets') || url.endsWith('.csv') || url.endsWith('.xlsx');

      if (isSheetOrCsv) {
        const buffer = await fetchFromDriveUrl(url);
        const res = parseExcelOrCsvData(buffer);
        if (res.success && res.lenses.length > 0) {
          onUpdateLenses(res.lenses, 'merge');
          setStatusMessage({
            type: 'success',
            message: `E-Tablo/Excel linkinden ${res.lenses.length} ürün başarıyla sisteme aktarıldı!`,
          });
          setDirectLinkInput('');
        } else {
          throw new Error('Dosyada geçerli ürün satırı bulunamadı.');
        }
      } else {
        // Assume document/PDF link or drive file
        // Extract real Google Drive ID if it is a Drive link, otherwise pass the full URL
        const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        const extractedId = driveFileMatch && driveFileMatch[1] ? driveFileMatch[1] : url;

        const syntheticFile: DriveFolderFileInfo = {
          id: extractedId,
          name: 'Bağlantıdan İçe Aktarılan Liste',
          brand: 'Genel',
          format: 'pdf',
          mimeType: 'application/pdf',
          listType: 'genel',
          driveViewUrl: url,
          downloadUrl: url,
          status: 'pending',
        };

        const res = await scanSingleDriveFile(syntheticFile, {
          priceMode: adminPriceMode,
          profitMarkup,
          productTypeHint,
        });

        if (res.success && res.lenses.length > 0) {
          onUpdateLenses(res.lenses, 'merge');
          setStatusMessage({
            type: 'success',
            message: `Bağlantıdaki belgeden ${res.lenses.length} ürün başarıyla taranarak sisteme eklendi!`,
          });
          setDirectLinkInput('');
        } else {
          throw new Error(res.error || 'Belgeden ürün okunamadı.');
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: `Bağlantı taranamadı: ${err.message || 'Lütfen linkin herkese açık paylaşıldığından emin olun.'}`,
      });
    } finally {
      setIsDirectLinkScanning(false);
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

        {/* COMMON FEEDBACK & PREVIEW AREA */}
        <div className="px-4 sm:px-5">
          {statusMessage.type && (
            <div
              className={`p-4 mt-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
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
              </div>
            </div>
          )}

          {previewLenses && previewLenses.length > 0 && (
            <div className="bg-white rounded-2xl border border-sky-200 shadow-lg shadow-sky-500/5 overflow-hidden mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="p-4 bg-sky-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">AI Tarama Önizlemesi: {previewSourceName}</h2>
                    <p className="text-[10px] opacity-90 leading-tight">
                      Aşağıdaki ürünler başarıyla tespit edildi ve kataloğunuza işlendi.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewLenses(null)}
                    className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-2"
                  >
                    <span>Kapat</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-sm">
                    <tr>
                      <th className="p-2.5 font-bold text-slate-500 uppercase tracking-wider w-16">Tür</th>
                      <th className="p-2.5 font-bold text-slate-500 uppercase tracking-wider">Marka / Ürün Adı</th>
                      <th className="p-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Perakende</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewLenses.slice(0, 10).map((pl, idx) => (
                      <tr key={idx} className="hover:bg-sky-50/30 transition-colors">
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 text-[10px] font-bold uppercase">
                            {isContactLens(pl) ? 'LENS' : 'CAM'}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-900">
                          <span className="font-bold text-sky-700 mr-1.5">[{pl.brand}]</span>
                          {pl.name}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {pl.retailPrice} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 mt-4">
          <button
            onClick={() => setSubTab('files')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
              subTab === 'files'
                ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Drive Klasör Listesi</span>
          </button>
          <button
            onClick={() => setSubTab('scanning')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
              subTab === 'scanning'
                ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Tarama Merkezi</span>
            {isBatchScanning && (
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setSubTab('manual_json')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
              subTab === 'manual_json'
                ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Manuel JSON Yükle (Sınırsız)</span>
          </button>
        </div>

        {/* DRIVE CONTENT TABS */}
        {subTab === 'files' && (
          <>
            {/* Direct Drive Link / Single File URL Input Bar */}
            <div className="p-3.5 sm:p-4 bg-sky-50/80 border-b border-sky-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              <div className="flex-1 space-y-1">
                <span className="font-bold text-sky-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Google Drive'dan Yenilenen Tekil Liste / E-Tablo Linki Yapıştır:</span>
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={directLinkInput}
                    onChange={(e) => setDirectLinkInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... veya https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <button
                    onClick={handleDirectLinkScan}
                    disabled={isDirectLinkScanning || !directLinkInput.trim()}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    {isDirectLinkScanning ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isDirectLinkScanning ? 'İşleniyor...' : 'Sisteme Dahil Et'}</span>
                  </button>
                </div>
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
                  <button
                    onClick={handleRefreshFolderFiles}
                    disabled={isLoadingFiles}
                    title="Klasördeki güncel dosyaları Google Drive'dan listele"
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                    <span>{isLoadingFiles ? 'Yenileniyor...' : 'Klasörü Güncelle'}</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setFolderUrl(KNOWN_DRIVE_FOLDER_URL);
                        handleRefreshFolderFiles();
                      }}
                      title="Varsayılan Klasör URL'sine Sıfırla"
                      className="px-2.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-600 transition shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                <button
                  onClick={handleBatchScanAll}
                  disabled={isBatchScanning || driveFiles.length === 0}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  title="Klasördeki tüm belgeleri AI ile tarayıp kataloğa aktar"
                >
                  {isBatchScanning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{isBatchScanning ? 'Taranıyor...' : 'Tüm Klasörü Tara & Ekle'}</span>
                </button>

                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-[11px] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Son Senkron: <strong>{config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleDateString('tr-TR') : 'Şimdi'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {subTab === 'scanning' && (
          <div className="p-4 sm:p-6 bg-slate-50 space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-sky-100 text-sky-600 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">AI Tarama & İşlem Merkezi</h3>
                  <p className="text-xs text-slate-500">Tüm Drive belgelerini toplu olarak tarayın, fiyatlandırın ve kataloğunuza ekleyin.</p>
                </div>
             </div>

             {/* BATCH PROGRESS BAR (Internal to tab) */}
             {isBatchScanning && (
               <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-sm font-bold text-sky-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                      <span>Sistem Dosyaları İşliyor ({batchProgress.current} / {batchProgress.total})</span>
                    </span>
                    <span className="text-sky-700 font-mono text-xs">{batchProgress.filename}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-sky-600 transition-all duration-500 shadow-[0_0_10px_rgba(2,132,199,0.3)]"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-sky-600/80 italic font-medium">
                    * Taraması tamamlanan her dosyadaki ürünler anlık olarak kataloğunuza eklenmektedir. Beklemenize gerek kalmadan diğer sekmelerde işlem yapabilirsiniz.
                  </p>
               </div>
             )}

             {!isBatchScanning && (
                <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                   <Sparkles className="w-12 h-12 text-sky-200 mx-auto mb-4" />
                   <h4 className="text-lg font-bold text-slate-800">Toplu İşleme Hazır</h4>
                   <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                      Aşağıdaki butona tıklayarak Drive klasöründeki tüm fiyat listelerini AI ile taratıp kataloğunuza anında ekleyebilirsiniz.
                   </p>
                </div>
             )}
          </div>
        )}

        {subTab === 'manual_json' && (
          <div className="p-4 sm:p-6 bg-slate-50 space-y-4 animate-in fade-in">
             <div className="flex flex-col lg:flex-row gap-5">
               {/* Left column: Instructions and Prompt */}
               <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                     <Sparkles className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900 text-sm">Ücretsiz Yapay Zeka ile Dönüştürün</h3>
                     <p className="text-xs text-slate-500 leading-relaxed">
                       Dosyalarınızı ChatGPT, Claude, Gemini veya DeepSeek gibi dilediğiniz ücretsiz yapay zekaya okutarak saniyeler içinde sistemimizin anlayacağı formata çevirtebilirsiniz.
                     </p>
                   </div>
                 </div>

                 <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                       <FileText className="w-3.5 h-3.5 text-indigo-600" />
                       <span>Kopyalanacak Yapay Zeka Komutu (Prompt):</span>
                     </span>
                     <button
                       type="button"
                       onClick={() => {
                         navigator.clipboard.writeText(PROMPT_TEXT);
                         setCopied(true);
                         setTimeout(() => setCopied(false), 2000);
                       }}
                       className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 border ${
                         copied
                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                           : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600'
                       }`}
                     >
                       {copied ? (
                         <>
                           <Check className="w-3 h-3" />
                           <span>Kopyalandı!</span>
                         </>
                       ) : (
                         <>
                           <Download className="w-3 h-3" />
                           <span>Komutu Kopyala</span>
                         </>
                       )}
                     </button>
                   </div>
                   <textarea
                     readOnly
                     value={PROMPT_TEXT}
                     className="w-full h-32 p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 focus:outline-none resize-none font-medium"
                   />
                   <p className="text-[10px] text-slate-500 leading-tight">
                     💡 <strong>Nasıl Yapılır?</strong> Yukarıdaki komutu kopyalayın, ChatGPT veya Claude'a yapıştırın ve fiyat listenizin PDF/fotoğrafını ekleyip gönderin. Çıkan JSON kodunu buraya yapıştırın.
                   </p>
                 </div>
               </div>

               {/* Right column: Paste Area and Load */}
               <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                       <Upload className="w-4 h-4 text-sky-600" />
                       <span>Yapay Zekadan Gelen JSON Kodu:</span>
                     </span>
                     
                     <button
                       type="button"
                       onClick={() => jsonFileInputRef.current?.click()}
                       className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
                     >
                       <Upload className="w-3.5 h-3.5" />
                       <span>JSON Dosyası Seç</span>
                     </button>
                     <input
                       ref={jsonFileInputRef}
                       type="file"
                       accept=".json"
                       onChange={handleJsonFileUpload}
                       className="hidden"
                     />
                   </div>

                   <textarea
                     value={manualJsonText}
                     onChange={(e) => handleValidateManualJson(e.target.value)}
                     placeholder="Yapay zekanın ürettiği JSON dizisini buraya yapıştırın... [ { ... } ]"
                     className="w-full h-44 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                   />

                   {manualJsonError && (
                     <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 whitespace-pre-line animate-in fade-in">
                       <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                       <span>{manualJsonError}</span>
                     </div>
                   )}

                   {parsedManualLenses && parsedManualLenses.length > 0 && (
                     <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                       <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                       <div>
                         <strong>Başarılı!</strong> {parsedManualLenses.length} adet ürün düzgün biçimde doğrulandı.
                       </div>
                     </div>
                   )}
                 </div>

                 {parsedManualLenses && parsedManualLenses.length > 0 && (
                   <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                     <button
                       type="button"
                       onClick={() => handleApplyManualLenses('merge')}
                       className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                     >
                       <Plus className="w-3.5 h-3.5" />
                       <span>Kataloğa Ekle (Birleştir)</span>
                     </button>
                     <button
                       type="button"
                       onClick={() => handleApplyManualLenses('replace')}
                       className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                     >
                       <Check className="w-3.5 h-3.5" />
                       <span>Kataloğu Sıfırla ve Bunu Yükle</span>
                     </button>
                   </div>
                 )}
               </div>
             </div>

             {/* Live parsed items preview if loaded */}
             {parsedManualLenses && parsedManualLenses.length > 0 && (
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-2 animate-in fade-in slide-in-from-top-2">
                 <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-700">İçe Aktarılacak Ürünler Önizlemesi ({parsedManualLenses.length} Ürün):</span>
                   <button
                     type="button"
                     onClick={() => {
                       setManualJsonText('');
                       setParsedManualLenses(null);
                     }}
                     className="text-[10px] text-rose-600 hover:underline font-bold"
                   >
                     Temizle
                   </button>
                 </div>
                 <div className="max-h-56 overflow-y-auto">
                   <table className="w-full text-left text-xs">
                     <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                       <tr>
                         <th className="p-2">Marka</th>
                         <th className="p-2">Model</th>
                         <th className="p-2">Tür</th>
                         <th className="p-2 text-right">Toptan</th>
                         <th className="p-2 text-right">Perakende</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {parsedManualLenses.slice(0, 50).map((l, i) => (
                         <tr key={i} className="hover:bg-slate-50">
                           <td className="p-2 font-bold text-sky-800">{l.brand}</td>
                           <td className="p-2">{l.name}</td>
                           <td className="p-2">
                             <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                               {isContactLens(l) ? 'Kontakt Lens' : `Gözlük Camı (${l.index})`}
                             </span>
                           </td>
                           <td className="p-2 text-right font-mono text-emerald-700 font-bold">{l.wholesalePrice > 0 ? `${l.wholesalePrice} ₺` : '-'}</td>
                           <td className="p-2 text-right font-mono text-slate-900 font-bold">{l.retailPrice > 0 ? `${l.retailPrice} ₺` : '-'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   {parsedManualLenses.length > 50 && (
                     <div className="p-2 bg-slate-50 text-center text-[10px] text-slate-500">
                       ve {parsedManualLenses.length - 50} adet ürün daha listede...
                     </div>
                   )}
                 </div>
               </div>
             )}
          </div>
        )}

        {/* DRIVE CONFIG AREA (ONLY SHOW IF NOT SCANNING TAB OR MOVE IT) */}
        {subTab === 'files' && isAdmin && (
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
                <div className="grid grid-cols-2 gap-1 text-[11px]">
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
                    🏢 Toptan
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
                  <button
                    onClick={() => setAdminPriceMode('karisik')}
                    className={`py-1.5 px-2 rounded-lg font-semibold transition border ${
                      adminPriceMode === 'karisik'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌀 Karışık (Kodlu)
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {adminPriceMode === 'wholesale'
                    ? 'Yönetici kararı: Listeler toptan alış maliyetidir. Satış fiyatı kâr çarpanıyla türetilir.'
                    : adminPriceMode === 'retail'
                    ? 'Yönetici kararı: Listeler doğrudan son kullanıcı perakende tavsiye satış fiyatıdır.'
                    : adminPriceMode === 'karisik'
                    ? 'Yönetici kararı: Karışık listelerdir. Perakende fiyatı açık yazılıdır, toptan maliyeti kodun içinden otomatik çözülür.'
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

        {/* AI SCAN CONTROLS (Moved here for better separation) */}
        {subTab === 'scanning' && isAdmin && (
          <div className="px-4 sm:p-6 bg-slate-50 border-t border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-slate-900 text-base">Toplu İşlem Kontrolü</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Klasördeki tüm belgeleri sizin belirlediğiniz kâr marjı ve fiyat kurallarıyla tek seferde tarar.
                </p>
                
                <button
                  onClick={handleBatchScanAll}
                  disabled={isBatchScanning}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold transition shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {isBatchScanning ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  <span>Tüm Drive Klasörünü AI ile Tara ({driveFiles.length} Belge)</span>
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <SlidersHorizontal className="w-5 h-5 text-slate-600" />
                  <h3 className="font-bold text-slate-900 text-base">Fiyatlandırma Kuralları</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">Toptan Liste Kâr Çarpanı:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        value={profitMarkup}
                        onChange={(e) => setProfitMarkup(parseFloat(e.target.value))}
                        className="w-16 px-2 py-1.5 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      />
                      <button 
                        onClick={handleApplyGlobalMarkupToAllWholesale}
                        className="text-[10px] text-sky-600 font-bold hover:underline"
                      >
                        Tümüne Uygula
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 font-medium">Fiyat Tespit Modu:</span>
                    <select
                      value={adminPriceMode}
                      onChange={(e) => setAdminPriceMode(e.target.value as any)}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="auto">Otomatik Algıla</option>
                      <option value="wholesale">Toptan Alış (Kâr Ekle)</option>
                      <option value="retail">Perakende Satış (Direkt)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY ACTIONS - Wrapped in files tab only */}
        {subTab === 'files' && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => setSubTab('scanning')}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Toplu Tarama Paneline Git</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Dosya/Fotoğraf Tara</span>
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
                  <span className="text-xs text-slate-500">
                    Sistemde yöneticinin Drive klasöründen yüklediği güncel toptan/perakende listesi etkindir.
                  </span>
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
        )}
      </div>

      {/* DRIVE FILES DIRECTORY - Wrapped in files tab */}
      {subTab === 'files' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          {/* ... existing files list ... */}
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
        <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 mt-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Google Drive Klasör Yapısı (Aktif Bölüm):</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFileTypeTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition border ${
                fileTypeTab === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              📁 Tüm Belgeler ({driveFiles.length})
            </button>
            <button
              onClick={() => setFileTypeTab('kampanyalar')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                fileTypeTab === 'kampanyalar'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
              }`}
            >
              <span>🎁 Kampanyalar Klasörü</span>
              <span className="opacity-80">
                ({driveFiles.filter((f) => f.folderCategory === 'kampanyalar' || f.listType === 'kampanya').length})
              </span>
            </button>
            <button
              onClick={() => setFileTypeTab('toptan')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                fileTypeTab === 'toptan'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
              }`}
            >
              <span>🏢 Toptan Fiyatlar Klasörü</span>
              <span className="opacity-80">
                ({driveFiles.filter((f) => f.folderCategory === 'toptan_fiyatlar' || f.listType === 'toptan').length})
              </span>
            </button>
            <button
              onClick={() => setFileTypeTab('karisik')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                fileTypeTab === 'karisik'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
              }`}
              title="Perakende fiyatı açık yazılı, toptan maliyeti ürün kodunda gizli olan karışık listeler"
            >
              <span>🌀 Karışık Klasör (Kod Maliyetli)</span>
              <span className="opacity-80">
                ({driveFiles.filter((f) => f.folderCategory === 'karisik' || f.listType === 'karisik').length})
              </span>
            </button>
          </div>

          <div className="border-t border-slate-200/60 my-1"></div>

          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Ürün Türüne Göre Hızlı Filtrele:</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFileTypeTab('eyeglass')}
              className={`px-3 py-1.2 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                fileTypeTab === 'eyeglass'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              <span>👓 Gözlük Camı Listeleri</span>
              <span className="opacity-80">
                ({driveFiles.filter((f) => f.category !== 'contact_lens' && !f.name.toLowerCase().includes('lens')).length})
              </span>
            </button>
            <button
              onClick={() => setFileTypeTab('contact')}
              className={`px-3 py-1.2 rounded-lg font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                fileTypeTab === 'contact'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-teal-700 border-slate-200 hover:bg-teal-50'
              }`}
            >
              <span>👁️ Kontakt Lens Listeleri</span>
              <span className="opacity-80">
                ({driveFiles.filter((f) => f.category === 'contact_lens' || f.name.toLowerCase().includes('lens')).length})
              </span>
            </button>
          </div>
        </div>

        {/* Multi-Selection Sticky Action Bar (When 1 or more files are selected) */}
        {selectedFileIds.size > 0 && (
          <div className="bg-sky-900 text-white p-3 rounded-2xl shadow-lg border border-sky-700 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                {selectedFileIds.size}
              </span>
              <span className="font-bold text-xs">
                {selectedFileIds.size} adet liste seçildi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFileIds(new Set())}
                className="px-3 py-1.5 bg-sky-800 hover:bg-sky-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Seçimi İptal Et
              </button>
              <button
                onClick={handleBatchScanSelected}
                disabled={isBatchScanning}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black shadow-sm transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seçilenleri Sisteme Dahil Et</span>
              </button>
            </div>
          </div>
        )}

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredFiles.map((file) => {
            const isScanningThis = scanningFileId === file.id;
            const isContact = file.category === 'contact_lens' || file.name.toLowerCase().includes('lens');
            const fileDist = file.distributor || getDistributorForBrand(file.brand, file.name);
            const distInfo = fileDist ? getDistributorInfo(fileDist) : undefined;
            const isSelected = selectedFileIds.has(file.id);

            return (
              <div
                key={file.id}
                className={`p-3.5 bg-slate-50/70 hover:bg-slate-50 border rounded-xl transition flex flex-col justify-between gap-3 group relative ${
                  isSelected ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-400/30' : 'border-slate-200/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectFile(file.id)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                        title="Toplu işlem için seç"
                      />
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
                    const isKarisik = file.listType === 'karisik' || adminPriceMode === 'karisik';
                    const isRetail = !isKarisik && file.listType === 'perakende' && adminPriceMode !== 'wholesale';
                    const isWholesale = !isKarisik && (file.listType === 'toptan' || adminPriceMode === 'wholesale');
                    const effectiveFileMarkup = file.profitMarkup !== undefined && file.profitMarkup > 0 ? file.profitMarkup : profitMarkup;
                    const profitPercent = Math.round((effectiveFileMarkup - 1) * 100);

                    if (isKarisik) {
                      return (
                        <div className="p-2.5 rounded-lg border text-xs space-y-1 bg-purple-50/80 border-purple-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                              <span>Karışık Liste (Kod Maliyetli):</span>
                            </span>
                            <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-purple-800 border border-purple-300">
                              Otomatik Çözücü 🧬
                            </span>
                          </div>
                          <p className="text-[10px] text-purple-800/90 leading-relaxed">
                            Açıkça yazılı perakende fiyata ek olarak, ürün kodundaki gizli toptan maliyetleri (örn: <code className="font-mono bg-purple-100 px-1 py-0.2 rounded font-bold text-purple-950">JLM240</code> → <strong className="text-purple-950">240 ₺</strong>) otomatik çözer.
                          </p>
                        </div>
                      );
                    }

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
                  {file.status === 'error' && file.errorMessage && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-700 flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="font-medium line-clamp-2" title={file.errorMessage}>
                        Hata: {file.errorMessage}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveFlipbookFile(file)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
                    title="Orijinal PDF Belgesini İncele"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>İncele</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedFileForModal(file)}
                      disabled={isScanningThis || isBatchScanning}
                      className="px-3 py-1.5 text-[11px] font-extrabold bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-lg transition shadow-xs flex items-center gap-1.5"
                      title="Bu listeyi seçin ve sisteme dahil etme seçeneklerini belirleyin"
                    >
                      {isScanningThis ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          <span>Dahil Ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Sisteme Dahil Et</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* SINGLE RENEWED LIST IMPORT MODAL (Interactive Choice Dialog) */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 space-y-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-5 text-white flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Drive'dan Liste Dahil Et
                </span>
                <h3 className="text-base font-bold tracking-tight">
                  {selectedFileForModal.brand} Fiyat Listesi
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1">
                  Dosya: {selectedFileForModal.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 block text-xs uppercase tracking-wider">
                  1. İçe Aktarma ve Yenileme Modunu Seçin:
                </label>
                <div className="space-y-2">
                  {/* Option 1: Replace Brand */}
                  <div
                    onClick={() => setModalImportMode('replace_brand')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      modalImportMode === 'replace_brand'
                        ? 'bg-sky-50/80 border-sky-600 text-sky-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-1.5 rounded-xl bg-sky-600 text-white mt-0.5">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-sm">
                        🔄 Sadece Bu Markanın Camlarını Yenile (Önerilen)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Kataloğunuzdaki eski <strong>{selectedFileForModal.brand}</strong> camları silinir ve yerine bu yeni listedeki güncel fiyatlar yüklenir. Diğer markalarınıza dokunulmaz.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Merge */}
                  <div
                    onClick={() => setModalImportMode('merge')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      modalImportMode === 'merge'
                        ? 'bg-sky-50/80 border-sky-600 text-sky-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-1.5 rounded-xl bg-emerald-600 text-white mt-0.5">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-sm">
                        ➕ Mevcut Kataloğa İlave Et (Birleştir / Merge)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Mevcut camlarınızın hiçbiri silinmez; yeni listedeki camlar kataloğa eklenir.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Replace All */}
                  <div
                    onClick={() => setModalImportMode('replace_all')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      modalImportMode === 'replace_all'
                        ? 'bg-rose-50/80 border-rose-600 text-rose-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="p-1.5 rounded-xl bg-rose-600 text-white mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-sm text-rose-900">
                        ⚠️ Tüm Kataloğu Sıfırla ve Sadece Bunu Yükle
                      </div>
                      <p className="text-[11px] text-rose-700">
                        Diğer tüm cam listeleri temizlenir, sistem sadece bu yeni liste ile sıfırdan başlar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleExecuteImportSingleFile(selectedFileForModal, modalImportMode)}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Bu Listeyi Sisteme Dahil Et</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDITIONAL ADMIN TOOLS: EXCEL & CATALOG MANAGEMENT */}
      {subTab === 'files' && isAdmin && (
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

      {/* FLIPBOOK VIEWER MODAL */}
      {activeFlipbookFile && (
        <FlipbookViewer
          pdfUrl={activeFlipbookFile.downloadUrl}
          title={activeFlipbookFile.name}
          onClose={() => setActiveFlipbookFile(null)}
        />
      )}
    </div>
  );
};
