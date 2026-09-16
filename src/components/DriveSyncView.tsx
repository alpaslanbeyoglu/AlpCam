import React, { useState, useRef } from 'react';
import { DriveSyncConfig, Lens } from '../types';
import {
  fetchFromDriveUrl,
  parseExcelOrCsvData,
  downloadSampleExcelTemplate,
  exportLensesToExcel,
  ParseResult,
} from '../utils/driveSync';
import {
  Cloud,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  FileUp,
  Database,
  ArrowRight,
  Lock,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Eye,
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
  const [driveUrl, setDriveUrl] = useState(config.sourceUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSyncOnLoad || false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncFromUrl = async (customUrl?: string) => {
    const urlToUse = customUrl || driveUrl;
    if (!urlToUse.trim()) {
      setSyncStatus({
        type: 'error',
        message: 'Lütfen geçerli bir Google Drive veya Google E-Tablo bağlantısı girin.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    try {
      const buffer = await fetchFromDriveUrl(urlToUse.trim());
      const result: ParseResult = parseExcelOrCsvData(buffer);

      if (!result.success || result.lenses.length === 0) {
        setSyncStatus({
          type: 'error',
          message: 'Dosya indirildi fakat geçerli cam satırı bulunamadı.',
          details: result.errors,
        });
        setIsSyncing(false);
        return;
      }

      // Save config and update catalog
      const updatedConfig: DriveSyncConfig = {
        ...config,
        sourceUrl: urlToUse.trim(),
        autoSyncOnLoad: autoSync,
        lastSyncTime: new Date().toISOString(),
        lastSyncItemCount: result.lenses.length,
      };
      onSaveConfig(updatedConfig);

      onUpdateLenses(result.lenses, importMode);

      setSyncStatus({
        type: 'success',
        message: `Google Drive senkronizasyonu başarılı! ${result.lenses.length} adet cam kataloğa entegre edildi.`,
        details: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setSyncStatus({
        type: 'error',
        message: `Senkronizasyon başarısız oldu: ${msg}`,
        details: [
          'Google Drive dosyasının "Bağlantıya sahip herkes görüntüleyebilir" olarak paylaşıldığından emin olun.',
          'Google E-Tablolar (Sheets) veya doğrudan .xlsx / .csv dosyası kullanın.',
        ],
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseExcelOrCsvData(buffer);

        if (!result.success || result.lenses.length === 0) {
          setSyncStatus({
            type: 'error',
            message: 'Yüklenen dosyada geçerli cam satırı bulunamadı.',
            details: result.errors,
          });
          setIsSyncing(false);
          return;
        }

        onUpdateLenses(result.lenses, importMode);

        const updatedConfig: DriveSyncConfig = {
          ...config,
          lastSyncTime: new Date().toISOString(),
          lastSyncItemCount: result.lenses.length,
        };
        onSaveConfig(updatedConfig);

        setSyncStatus({
          type: 'success',
          message: `Dosya başarıyla yüklendi! ${result.lenses.length} cam kataloğa aktarıldı.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Ayrıştırma hatası';
        setSyncStatus({
          type: 'error',
          message: `Dosya okunamadı: ${msg}`,
        });
      } finally {
        setIsSyncing(false);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // NON-ADMIN PROTECTED VIEW (Staff / Optician Mode)
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
        {/* Protected Notice Card */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  Google Drive & Liste Yükleme (Yönetici Korumalı)
                </h2>
                <p className="text-xs text-amber-100">
                  Bu modül sadece mağaza yöneticisinin yetkisindedir
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAdminModal}
              className="px-3.5 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span>Yönetici Girişi Yap</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Sistem Güvenliği ve Yetki Kuralı</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                Kullanıcıların sisteme rastgele harici liste veya dosya yüklemesi sistem bütünlüğünü korumak amacıyla kısıtlanmıştır.
                <strong> Sistemde yalnızca yöneticinin Google Drive veya Excel üzerinden yüklediği merkezi fiyat listesi geçerlidir.</strong>
              </p>
            </div>

            {/* What Opticians Can Do vs What Admin Does */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span>Optisyenlerin Yetkileri</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc pl-4">
                  <li>Yöneticinin yüklediği ana katalogdaki tüm camları arama ve filtreleme</li>
                  <li>Toptan ve perakende fiyatları inceleme, çift/tek cam hesaplama</li>
                  <li>Müşteri gizlilik moduna alarak ekranı müşteriye sunabilme</li>
                  <li><strong>Özel Listelerim:</strong> Ana katalogdan onaylı ürünleri seçerek müşteriye özel teklif paketleri ve WhatsApp teklifi hazırlama</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Yöneticinin Yetkileri</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc pl-4">
                  <li>Google Drive klasöründen en güncel cam fiyat listesini entegre etme</li>
                  <li>Bilgisayardan Excel (.xlsx) veya CSV dosyası yükleme</li>
                  <li>Kataloğa yeni cam ekleme veya katalog sıfırlama</li>
                  <li>Yönetici şifresini belirleme ve değiştirme</li>
                </ul>
              </div>
            </div>

            {/* Read-Only Quick Sync (if manager configured URL) */}
            {config.sourceUrl ? (
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-sky-900 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    <span>Yöneticinin Tanımladığı Drive Listesi Mevcut</span>
                  </div>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    {config.lastSyncTime ? (
                      <>Son güncelleme: {new Date(config.lastSyncTime).toLocaleString('tr-TR')} ({lenses.length} cam aktif)</>
                    ) : (
                      'Yönetici tarafından önceden bağlanmış liste kaynağı hazır.'
                    )}
                  </p>
                </div>

                <button
                  onClick={() => handleSyncFromUrl(config.sourceUrl)}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Güncelleniyor...' : 'Yöneticinin Listesini Yenile'}</span>
                </button>
              </div>
            ) : null}

            {syncStatus.message && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">{syncStatus.message}</div>
                  {syncStatus.details && syncStatus.details.length > 0 && (
                    <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-slate-600">
                      {syncStatus.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Admin Status Banner */}
      <div className="bg-amber-500 text-amber-950 p-3.5 px-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-900" />
          <span>👑 Yönetici Yetkisi Aktif: Google Drive ve Katalog Yönetimi Açık</span>
        </div>
        <button
          onClick={onOpenAdminModal}
          className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
        >
          Şifre / Çıkış
        </button>
      </div>

      {/* Header & Status Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Google Drive Fiyat Listesi Entegrasyonu
              </h2>
              <p className="text-xs text-slate-500">
                Google Drive klasörünüzdeki güncel Excel veya Google E-Tablo listesini sisteme bağlayın.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Yüklü Cam</span>
              <span className="text-sm font-bold text-slate-900">{lenses.length} Model</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Son Senkronizasyon</span>
              <span className="text-xs font-medium text-slate-700">
                {config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleDateString('tr-TR') : 'Henüz yapılmadı'}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus.type && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              syncStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold">{syncStatus.message}</div>
              {syncStatus.details && syncStatus.details.length > 0 && (
                <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-slate-600">
                  {syncStatus.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Connection Setup */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-sky-600" />
          <span>Yöntem 1: Canlı Google Drive / Google E-Tablo Bağlantısı</span>
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Google Drive Paylaşım Bağlantısı veya Google E-Tablo Linki:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/... veya https://drive.google.com/file/d/..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />

            <button
              onClick={handleSyncFromUrl}
              disabled={isSyncing}
              className={`px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 ${
                isSyncing ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Çekiliyor...' : 'Drive’dan Güncelle'}</span>
            </button>
          </div>
        </div>

        {/* Auto Sync and Mode options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => {
                setAutoSync(e.target.checked);
                onSaveConfig({ ...config, autoSyncOnLoad: e.target.checked });
              }}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
            />
            <span>Uygulama telefonda her açıldığında bu Drive linkinden otomatik güncelle</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">İçe Aktarma Modu:</span>
            <select
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
              className="px-2 py-1 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
            >
              <option value="replace">Mevcut Kataloğu Yenisiyle Değiştir</option>
              <option value="merge">Mevcut Kataloğun Üzerine Ekle (Merge)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manual File Upload (Excel / CSV) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileUp className="w-4 h-4 text-emerald-600" />
          <span>Yöntem 2: Cihazdan Excel (.xlsx) veya CSV Dosyası Yükle</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv, .json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV Dosyası Seç ve Yükle</span>
          </button>

          <span className="text-xs text-slate-400">
            Google Drive uygulamasından indirdiğiniz veya bilgisayarınızdaki .xlsx tablolarını doğrudan açabilirsiniz.
          </span>
        </div>
      </div>

      {/* Templates & Export Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Template Download */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-sky-600" />
            <h4 className="font-bold text-xs text-slate-900">Google Drive İçin Excel Şablonu</h4>
          </div>
          <p className="text-xs text-slate-500">
            Marka, Model, İndeks, Toptan Fiyat ve Perakende Fiyat kolonları hazır biçimlendirilmiş örnek Excel şablonunu indirin.
          </p>
          <button
            onClick={downloadSampleExcelTemplate}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Şablonu İndir (.xlsx)</span>
          </button>
        </div>

        {/* Export Catalog */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-xs text-slate-900">Mevcut Kataloğu Dışa Aktar</h4>
          </div>
          <p className="text-xs text-slate-500">
            Sistemdeki tüm camları toptan ve perakende fiyatlarıyla Excel dosyası olarak indirip Drive klasörünüze koyabilirsiniz.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportLensesToExcel(lenses)}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel Olarak İndir</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Kataloğu fabrika varsayılanlarına (30+ optik cam) sıfırlamak istiyor musunuz?')) {
                  onResetToDefaultCatalog();
                }
              }}
              className="py-2 px-3 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition"
              title="Varsayılan kataloğa dön"
            >
              Varsayılana Dön
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Google Drive Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Google Drive Klasöründeki Listeyi Sisteme Nasıl Bağlarsınız?</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div className="font-bold text-slate-900">Dosyayı Drive'a Yükleyin</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Excel veya Google E-Tablo dosyanızı Google Drive klasörünüze yükleyin. İndirdiğiniz şablon kolonlarını kullanmanız önerilir.
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <div className="font-bold text-slate-900">Paylaşım İznini Açın</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Dosyanın üzerine sağ tıklayıp <strong>Paylaş</strong> seçeneğine tıklayın. <em>Genel erişim</em> kısmından <strong>"Bağlantıya sahip olan herkes: Görüntüleyen"</strong> seçin ve bağlantıyı kopyalayın.
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div className="font-bold text-slate-900">Tek Tıkla Senkronize Edin</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Kopyaladığınız bağlantıyı yukarıdaki kutuya yapıştırıp <strong>Drive'dan Güncelle</strong> butonuna basın. Drive'da dosyayı güncellediğinizde sistem anında en yeni fiyatları çeker.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
