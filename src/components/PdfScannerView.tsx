import React, { useState } from 'react';
import { Lens } from '../types';
import { 
  FileUp, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download, 
  Trash2, 
  ArrowRight, 
  Database,
  Eye,
  RefreshCw,
  Cpu,
  Check
} from 'lucide-react';

interface PdfScannerViewProps {
  onImportLenses: (lenses: Lens[]) => Promise<void>;
  onSuccessToast: (msg: string) => void;
}

export const PdfScannerView: React.FC<PdfScannerViewProps> = ({ onImportLenses, onSuccessToast }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [brandHint, setBrandHint] = useState<string>('');
  const [productTypeHint, setProductTypeHint] = useState<string>('auto');
  const [priceMode, setPriceMode] = useState<string>('auto');
  const [profitMarkup, setProfitMarkup] = useState<number>(2.0);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [scannedLenses, setScannedLenses] = useState<Lens[]>([]);
  const [scanRawBrand, setScanRawBrand] = useState<string>('');
  const [scanModelUsed, setScanModelUsed] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      if (base64String) {
        setFileBase64(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!fileBase64 && !selectedFile) {
      setErrorMsg('Lütfen taranacak bir PDF veya belge seçin.');
      return;
    }

    setIsScanning(true);
    setScanProgress('Belge yapay zeka ile taranıyor, optik veriler çıkarılıyor...');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/drive/upload-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: fileBase64,
          fileName: selectedFile?.name || 'price_list.pdf',
          mimeType: selectedFile?.type || 'application/pdf',
          brandHint,
          priceMode,
          profitMarkup,
          productTypeHint,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Tarama sırasında sunucu hatası oluştu.');
      }

      setScannedLenses(data.lenses || []);
      setScanRawBrand(data.brand || brandHint || 'Genel');
      setScanModelUsed(data.modelUsed || 'gemini-flash');
      onSuccessToast(`Başarıyla ${data.lenses?.length || 0} ürün taranıp JSON formatına dönüştürüldü!`);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || 'Belge taranamadı. Lütfen geçerli bir fiyat listesi PDF veya görseli yükleyin.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const handleImportToSystem = async () => {
    if (scannedLenses.length === 0) return;
    setIsImporting(true);
    try {
      await onImportLenses(scannedLenses);
      onSuccessToast(`${scannedLenses.length} adet taranan ürün başarıyla OptikCam veritabanına eklendi!`);
    } catch (err: any) {
      setErrorMsg('Sisteme yükleme hatası: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(scannedLenses, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    onSuccessToast('Taranan JSON verisi panoya kopyalandı.');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(scannedLenses, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile?.name ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'fiyat_listesi'}_taranmis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onSuccessToast('JSON dosyası bilgisayarınıza indirildi.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yapay Zeka Destekli Belge & Fiyat Listesi Çevirici</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              PDF / Belge Fiyat Listesi Tarayıcı & JSON Üretici
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Dışarıdan aldığınız herhangi bir optik cam veya kontakt lens PDF fiyat listesini, görselini veya tablosunu sisteme yükleyin; yapay zeka otomatik olarak tarasın, standart JSON formatına dönüştürsün ve dilerseniz tek tıkla veritabanınıza yükleyin.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-xs font-semibold shrink-0">
            <Cpu className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-white font-bold">Gemini Vision & OCR</div>
              <div className="text-slate-300 text-[11px]">Otomatik Ürün & Fiyat Çıkarımı</div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload & Configuration Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileUp className="w-4 h-4 text-sky-600" />
              <span>1. Dosya Seçimi ve Tarama Ayarları</span>
            </h2>

            {/* File Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Fiyat Listesi Dosyası (PDF, Görsel, Excel)</label>
              <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition ${
                selectedFile ? 'border-sky-500 bg-sky-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'
              }`}>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-sky-900">{selectedFile.name}</p>
                      <p className="text-[10px] text-sky-600 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Hazır</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700">PDF veya Fiyat Listesi Yükleyin</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Sürükleyip bırakın veya bilgisayardan seçin (.pdf, .png, .jpg)</p>
                    </div>
                  )}
                </div>
                <input type="file" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv" className="hidden" />
              </label>
            </div>

            {/* Brand & Type Hints */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Marka İpucu (İsteğe Bağlı)</label>
                <input
                  type="text"
                  placeholder="Örn: Zeiss, Hoya, Novax"
                  value={brandHint}
                  onChange={(e) => setBrandHint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Ürün Tipi</label>
                <select
                  value={productTypeHint}
                  onChange={(e) => setProductTypeHint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="auto">Otomatik Algıla</option>
                  <option value="eyeglass_lens">Gözlük Camı</option>
                  <option value="contact_lens">Kontakt Lens</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Fiyat Modu & Kar Marjı</label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={priceMode}
                  onChange={(e) => setPriceMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="auto">Otomatik (Toptan / Perakende)</option>
                  <option value="wholesale_only">Yalnızca Toptan Liste Fiyatı</option>
                  <option value="retail_only">Yalnızca Perakende Fiyatı</option>
                </select>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap">Kar Çarpanı:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={profitMarkup}
                    onChange={(e) => setProfitMarkup(parseFloat(e.target.value) || 2.0)}
                    className="w-full bg-transparent text-xs font-bold text-right focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={isScanning || !selectedFile}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition ${
                isScanning || !selectedFile
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{scanProgress || 'Taranıyor...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Yapay Zeka ile Tara ve JSON Üret</span>
                </>
              )}
            </button>
          </div>

          {/* Tips Box */}
          <div className="bg-indigo-50/60 rounded-3xl border border-indigo-100 p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Nasıl Çalışır?</span>
            </div>
            <ul className="text-[11px] text-indigo-950/80 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
              <li>PDF veya fotoğraflarınızdaki tablolardan marka, model, indeks, SPH, CYL ve fiyat sütunları yapay zeka tarafından okunur.</li>
              <li>Sonuçlar anında standart <strong>OptikCam JSON</strong> şablonuna dönüştürülür.</li>
              <li>Ürünleri inceledikten sonra tek tıkla doğrudan kendi veritabanınıza aktarabilirsiniz.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Output JSON & Table Preview */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-[650px]">
            {/* Header with Switcher & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>2. Üretilen JSON Çıktısı</span>
                </h2>
                {scannedLenses.length > 0 && (
                  <span className="bg-sky-100 text-sky-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {scannedLenses.length} Ürün Bulundu
                  </span>
                )}
              </div>

              {scannedLenses.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                    <button
                      onClick={() => setActiveTab('table')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        activeTab === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tablo
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        activeTab === 'json' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      JSON
                    </button>
                  </div>

                  <button
                    onClick={handleCopyJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    title="JSON Kopyala"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    title="JSON İndir"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>İndir</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-4">
              {scannedLenses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Henüz taranmış veri bulunmuyor</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Sol taraftan bir fiyat listesi yükleyip "Yapay Zeka ile Tara ve JSON Üret" butonuna basın.
                    </p>
                  </div>
                </div>
              ) : activeTab === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3">Marka / Model</th>
                        <th className="p-3">İndeks / Kategori</th>
                        <th className="p-3">SPH / CYL</th>
                        <th className="p-3 text-right">Toptan (₺)</th>
                        <th className="p-3 text-right">Perakende (₺)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {scannedLenses.map((lens, idx) => (
                        <tr key={lens.id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{lens.brand}</div>
                            <div className="text-[11px] text-slate-500">{lens.name}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold">{lens.index || '1.50'}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{lens.category}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600">
                            {lens.sphRange || 'Standart'} {lens.cylMax ? `/ CYL ${lens.cylMax}` : ''}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800">
                            ₺{lens.wholesalePrice?.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-bold text-sky-700">
                            ₺{lens.retailPrice?.toLocaleString('tr-TR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto h-full shadow-inner">
                  {JSON.stringify(scannedLenses, null, 2)}
                </pre>
              )}
            </div>

            {/* Footer Import Action */}
            {scannedLenses.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-500 font-medium">
                  Kaynak: <span className="font-bold text-slate-700">{scanRawBrand}</span> ({scannedLenses.length} ürün)
                </div>
                <button
                  onClick={handleImportToSystem}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sisteme (Veritabanına) Aktar ve Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
