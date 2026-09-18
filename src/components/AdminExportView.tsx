import React, { useState, useMemo } from 'react';
import { Lens, BrandDiscount, CustomList } from '../types';
import { 
  FileJson, 
  Download, 
  Copy, 
  Check, 
  Database, 
  Sliders, 
  FolderHeart, 
  Shield, 
  Filter, 
  Search,
  Eye,
  AlertCircle
} from 'lucide-react';

interface AdminExportViewProps {
  isAdmin: boolean;
  lenses: Lens[];
  brandDiscounts: BrandDiscount[];
  customLists: CustomList[];
  showToast: (msg: string) => void;
}

export const AdminExportView: React.FC<AdminExportViewProps> = ({
  isAdmin,
  lenses,
  brandDiscounts,
  customLists,
  showToast
}) => {
  const [activeExportType, setActiveExportType] = useState<'catalog' | 'discounts' | 'lists'>('catalog');
  const [copied, setCopied] = useState(false);

  // Filter States for Catalog Export
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'eyeglass_lens' | 'contact_lens'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Available brands derived from current lenses
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    lenses.forEach((l) => {
      if (l.brand) set.add(l.brand.trim());
    });
    return Array.from(set).sort();
  }, [lenses]);

  // Filtered Catalog Items based on export selections
  const filteredExportLenses = useMemo(() => {
    if (activeExportType !== 'catalog') return [];
    return lenses.filter((l) => {
      if (selectedBrand !== 'all' && l.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
        return false;
      }
      if (selectedProductType !== 'all' && l.productType !== selectedProductType) {
        return false;
      }
      const price = l.retailPrice || 0;
      if (minPrice && price < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && price > parseFloat(maxPrice)) {
        return false;
      }
      return true;
    });
  }, [lenses, activeExportType, selectedBrand, selectedProductType, minPrice, maxPrice]);

  // Generate JSON based on active tab and filters
  const exportJsonString = useMemo(() => {
    let rawData: any;
    if (activeExportType === 'catalog') {
      // Strips unnecessary or system metadata keys if wanted, but preserving schema for clean importing
      rawData = filteredExportLenses.map((l) => ({
        brand: l.brand,
        name: l.name,
        productType: l.productType,
        category: l.category,
        index: l.index,
        material: l.material,
        coating: l.coating,
        wholesalePrice: l.wholesalePrice,
        retailPrice: l.retailPrice,
        currency: l.currency,
        sphRange: l.sphRange || undefined,
        cylMax: l.cylMax || undefined,
        diameter: l.diameter || undefined,
        baseCurve: l.baseCurve || undefined,
        boxContent: l.boxContent || undefined,
        wearPeriod: l.wearPeriod || undefined,
        lensType: l.lensType || undefined,
        deliveryType: l.deliveryType || 'stock',
        notes: l.notes || undefined,
        updatedAt: l.updatedAt
      }));
    } else if (activeExportType === 'discounts') {
      rawData = brandDiscounts;
    } else {
      rawData = customLists;
    }

    return JSON.stringify(rawData, null, 2);
  }, [activeExportType, filteredExportLenses, brandDiscounts, customLists]);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportJsonString);
    setCopied(true);
    showToast('JSON verisi panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `optikcam_${activeExportType}_${timestamp}.json`;
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${fileName} başarıyla indirildi.`);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md mx-auto space-y-4 shadow-xs">
          <Shield className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-base font-bold text-amber-900">Yönetici Girişi Gerekli</h2>
          <p className="text-xs text-amber-700 leading-relaxed">
            Yönetici JSON Çıktı Merkezi'ne erişmek için üst menüden yönetici şifrenizle giriş yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-sky-500/20 rounded-xl border border-sky-500/30 text-sky-300">
              <FileJson className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Yönetici JSON Çıktı Merkezi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Tüm katalog ürünlerinizi, iskonto oranlarınızı veya müşteri sipariş listelerinizi filtrelenmiş JSON dosyaları halinde yedekleyebilir, dışa aktarabilir ya da farklı cihazlara taşımak için indirebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-2xl transition border border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="text-xs">{copied ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span className="text-xs">JSON Olarak İndir</span>
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Export Selectors and Filter Settings */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Output Source Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1. Çıktı Kaynağını Seçin
            </h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveExportType('catalog')}
                className={`flex items-center justify-between p-3.5 rounded-xl transition text-left border ${
                  activeExportType === 'catalog'
                    ? 'bg-sky-50/50 border-sky-300 text-sky-950 font-bold'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className={`w-4 h-4 ${activeExportType === 'catalog' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Katalog Ürünleri ({lenses.length})</span>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-600">
                  {lenses.length} adet
                </span>
              </button>

              <button
                onClick={() => setActiveExportType('discounts')}
                className={`flex items-center justify-between p-3.5 rounded-xl transition text-left border ${
                  activeExportType === 'discounts'
                    ? 'bg-sky-50/50 border-sky-300 text-sky-950 font-bold'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className={`w-4 h-4 ${activeExportType === 'discounts' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="text-xs">İskonto Oranları</span>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-600">
                  {brandDiscounts.length} firma
                </span>
              </button>

              <button
                onClick={() => setActiveExportType('lists')}
                className={`flex items-center justify-between p-3.5 rounded-xl transition text-left border ${
                  activeExportType === 'lists'
                    ? 'bg-sky-50/50 border-sky-300 text-sky-950 font-bold'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-700 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FolderHeart className={`w-4 h-4 ${activeExportType === 'lists' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Kayıtlı Müşteri Listeleri</span>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-600">
                  {customLists.length} liste
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Filters Panel: Only shown for Catalog Source */}
          {activeExportType === 'catalog' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-sky-600" />
                  <span>2. Çıktı Filtreleri</span>
                </h2>
                {(selectedBrand !== 'all' || selectedProductType !== 'all' || minPrice || maxPrice) && (
                  <button
                    onClick={() => {
                      setSelectedBrand('all');
                      setSelectedProductType('all');
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-bold"
                  >
                    Sıfırla
                  </button>
                )}
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marka Seçimi</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="all">Tüm Markalar (Hepsi)</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ürün Türü</label>
                  <select
                    value={selectedProductType}
                    onChange={(e) => setSelectedProductType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="all">Gözlük Camı & Kontakt Lens</option>
                    <option value="eyeglass_lens">Yalnızca Gözlük Camları</option>
                    <option value="contact_lens">Yalnızca Kontakt Lensler</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perakende Fiyat Aralığı (₺)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min fiyat"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center"
                    />
                    <input
                      type="number"
                      placeholder="Max fiyat"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Filtreye Uygun Ürün:</span>
                  <span className="font-bold text-sky-700 text-xs">
                    {filteredExportLenses.length} / {lenses.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info & Schema Hint */}
          <div className="bg-indigo-50/55 rounded-2xl border border-indigo-100 p-4 space-y-2.5 text-xs">
            <div className="flex gap-2 text-indigo-900 font-bold items-center">
              <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Yedekleme & Taşıma İpucu</span>
            </div>
            <p className="text-[11px] text-indigo-950/80 leading-relaxed font-medium">
              Buradan dışa aktardığınız ürün JSON kodunu kopyalayarak, başka bir OptikCam paneline gidip <strong>{"Google Drive -> Manuel JSON Yükle"}</strong> sekmesinden doğrudan veritabanına geri yükleyebilirsiniz. Bu sayede hiçbir kota aşımı olmadan veritabanınızı saniyeler içinde yedekleyebilirsiniz.
            </p>
          </div>

        </div>

        {/* Right Column: Code Editor style Previewer */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-slate-900 text-slate-300 rounded-3xl overflow-hidden shadow-lg border border-slate-800 flex flex-col h-[520px]">
            {/* Terminal Header */}
            <div className="px-5 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-850 shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-500 ml-2">
                  {activeExportType === 'catalog'
                    ? `filtered_catalog_export.json (${filteredExportLenses.length} items)`
                    : `${activeExportType}_export.json`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                  title="Metni Kopyala"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                  title="Dosya Olarak İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code Body Area */}
            <div className="p-4 font-mono text-xs overflow-auto flex-1 bg-slate-900 text-sky-400 custom-scrollbar leading-relaxed">
              <pre className="whitespace-pre">
                {exportJsonString}
              </pre>
            </div>

            {/* Terminal Footer Info Bar */}
            <div className="px-5 py-2 bg-slate-950 text-[10px] text-slate-500 font-mono border-t border-slate-850 shrink-0 flex items-center justify-between">
              <span>Encoding: UTF-8</span>
              <span>Size: {(exportJsonString.length / 1024).toFixed(1)} KB</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
