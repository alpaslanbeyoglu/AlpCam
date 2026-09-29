import React, { useState } from 'react';
import { Lens, BrandDiscount, CustomList } from '../types';
import { calculateLensFinancials, formatCurrency, sanitizeLens } from '../utils/pricing';
import { getEnhancedLensSpecs } from '../utils/lensSpecsHelper';
import { exportComparisonToPDF, generateComparisonWhatsAppText } from '../utils/comparisonExport';
import { 
  X, Plus, Trash2, Printer, MessageSquare, Copy, Check, 
  Sparkles, Layers, ShieldCheck, Scale, Search, Eye, Glasses, 
  Package, Info, ArrowRight, ExternalLink 
} from 'lucide-react';

interface LensComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lenses: Lens[];
  onRemoveFromCompare: (lensId: string) => void;
  onClearCompare: () => void;
  onAddLensToCompare?: (lens: Lens) => void;
  catalog: Lens[];
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  customLists: CustomList[];
  onAddToList: (lens: Lens, listId: string) => void;
  onOpenDetails: (lens: Lens) => void;
}

export const LensComparisonModal: React.FC<LensComparisonModalProps> = ({
  isOpen,
  onClose,
  lenses,
  onRemoveFromCompare,
  onClearCompare,
  onAddLensToCompare,
  catalog,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  customLists,
  onAddToList,
  onOpenDetails,
}) => {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>(customLists[0]?.id || '');
  const [showAddSearch, setShowAddSearch] = useState(false);

  if (!isOpen) return null;

  const handleCopyWhatsApp = () => {
    const storeName = customLists[0]?.opticianStoreName;
    const text = generateComparisonWhatsAppText(lenses, pairCount, storeName);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    });
  };

  const handleOpenWhatsApp = () => {
    const storeName = customLists[0]?.opticianStoreName;
    const text = encodeURIComponent(generateComparisonWhatsAppText(lenses, pairCount, storeName));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrintPDF = () => {
    const storeName = customLists[0]?.opticianStoreName;
    exportComparisonToPDF(lenses, pairCount, storeName, isCustomerMode);
  };

  // Filter catalog for adding another lens
  const candidateLenses = catalog
    .filter(c => !lenses.some(l => l.id === c.id))
    .filter(c => {
      if (!searchCatalogQuery.trim()) return true;
      const q = searchCatalogQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        (c.coating && c.coating.toLowerCase().includes(q)) ||
        (c.index && c.index.includes(q))
      );
    })
    .slice(0, 8);

  const specsList = lenses.map(l => {
    const s = sanitizeLens(l);
    const specs = getEnhancedLensSpecs(s);
    const fin = calculateLensFinancials(s, brandDiscounts, pairCount);
    const retailPrice = s.retailPrice * (specs.isContact ? (pairCount === 2 ? 2 : 1) : pairCount);
    return {
      raw: l,
      sanitized: s,
      specs,
      fin,
      retailPrice,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>Cam & Lens Kıyaslama Modülü</span>
                <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.2 rounded-full">
                  {lenses.length} Ürün
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Seçtiğiniz ürünlerin optik parametrelerini, temel eğrilerini, kaplamalarını ve fiyatlarını yan yana karşılaştırın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Export Actions */}
            <button
              onClick={handlePrintPDF}
              className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Kıyaslama Tablosunu PDF Olarak Yazdır / Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF / Yazdır</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Müşteriye WhatsApp Kıyaslama Metni Gönder"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleCopyWhatsApp}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
              title="Kıyaslama Özetini Kopyala"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedNotice ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {lenses.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Kıyaslanacak ürün seçilmedi</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Katalog kartlarındaki "Kıyasla" butonuna basarak 2 veya daha fazla camı veya kontakt lensi buraya ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <>
              {/* Add More Product Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Kıyaslama Listesi:</span>
                  <button
                    onClick={() => setShowAddSearch(!showAddSearch)}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Listeye Başka Cam / Lens Ekle</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClearCompare}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tümünü Temizle</span>
                  </button>
                </div>
              </div>

              {/* Add Product Search Dropdown if open */}
              {showAddSearch && onAddLensToCompare && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-sky-600 shrink-0" />
                    <input
                      type="text"
                      value={searchCatalogQuery}
                      onChange={(e) => setSearchCatalogQuery(e.target.value)}
                      placeholder="Katalogdan cam veya kontakt lens ara (örn: Zeiss, Biofinity, Hoya 1.60, Acuvue)..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-sky-300 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => setShowAddSearch(false)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Kapat
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    {candidateLenses.map((cand) => (
                      <div
                        key={cand.id}
                        className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-1 shadow-2xs hover:border-sky-400 transition"
                      >
                        <div className="truncate flex-1">
                          <span className="text-[10px] font-bold text-sky-700 uppercase block truncate">
                            {cand.brand}
                          </span>
                          <span className="text-xs font-bold text-slate-900 block truncate" title={cand.name}>
                            {cand.name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            onAddLensToCompare(cand);
                            setShowAddSearch(false);
                          }}
                          className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold shrink-0"
                        >
                          + Ekle
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Matrix Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[650px]">
                    {/* Table Headers: Products Side by Side */}
                    <thead>
                      <tr className="bg-slate-900 text-white divide-x divide-slate-800">
                        <th className="p-3 w-44 font-bold text-slate-300 text-[11px] uppercase tracking-wider bg-slate-950">
                          Karşılaştırılan Kriterler
                        </th>
                        {specsList.map(({ raw, sanitized, specs, fin, retailPrice }) => (
                          <th key={raw.id} className="p-3.5 min-w-[200px] align-top bg-slate-900 relative">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                                {sanitized.brand}
                              </span>
                              <button
                                onClick={() => onRemoveFromCompare(raw.id)}
                                className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition"
                                title="Kıyaslamadan Çıkar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <h4
                              onClick={() => onOpenDetails(raw)}
                              className="font-black text-sm text-white mt-1.5 cursor-pointer hover:text-sky-300 transition leading-snug"
                            >
                              {sanitized.name}
                            </h4>

                            <div className="text-[11px] text-slate-300 font-semibold mt-1">
                              {specs.isContact ? (
                                <span className="text-teal-300 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Kontakt Lens
                                </span>
                              ) : (
                                <span className="text-sky-300 flex items-center gap-1">
                                  <Glasses className="w-3 h-3" /> {specs.index} İndeks Cam
                                </span>
                              )}
                            </div>

                            {/* Price in Header */}
                            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-baseline justify-between">
                              <span className="text-[10px] text-slate-400 font-medium uppercase">
                                Satış ({pairCount === 2 ? 'Çift' : 'Tek'}):
                              </span>
                              <span className="text-base font-black text-emerald-400">
                                {formatCurrency(retailPrice, sanitized.currency)}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {/* --- BÖLÜM 1: TEMEL OPTİK & TEKNİK ÖZELLİKLER --- */}
                      <tr className="bg-sky-50/90 text-sky-950 font-bold">
                        <td colSpan={specsList.length + 1} className="px-3 py-2 text-xs uppercase tracking-wide">
                          🔬 1. Temel Optik & Teknik Spesifikasyonlar
                        </td>
                      </tr>

                      {/* Temel Eğri (BC) - Only for contact lenses or highlighted */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          🎯 Temel Eğri (BC)
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3">
                            {specs.isContact ? (
                              <div>
                                <span className={`font-black text-xs px-2 py-0.5 rounded-md border inline-block ${
                                  specs.hasMultipleBaseCurves
                                    ? 'bg-amber-100 text-amber-950 border-amber-300'
                                    : 'bg-teal-50 text-teal-900 border-teal-200'
                                }`}>
                                  {specs.baseCurve} mm
                                </span>
                                {specs.hasMultipleBaseCurves && (
                                  <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                                    Seçenekli Çift Eğri ({specs.baseCurveOptions.join(' & ')} mm)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">- (Gözlük Camı)</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Kırılma İndeksi (İncelik) */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          💎 Kırılma İndeksi
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3">
                            {specs.isContact ? (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            ) : (
                              <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {specs.index} İndeks
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Çap (DIA / Ø) */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          📏 Çap (DIA / Ø)
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3 font-semibold text-slate-800">
                            {specs.isContact ? `${specs.diameter} mm` : `Ø ${specs.diameter} mm`}
                          </td>
                        ))}
                      </tr>

                      {/* Hammadde / Polimer Materyal */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          🧪 Hammadde / Polimer
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3 font-medium text-slate-800">
                            {specs.material}
                          </td>
                        ))}
                      </tr>

                      {/* Optik Netlik (Abbe) & Oksijen İletkenliği (Dk/t) */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          🌈 Abbe Değeri / Oksijen (Dk/t)
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3">
                            {specs.isContact ? (
                              <span className="font-bold text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                💨 {specs.oxygenTransmissibility || '100+ Dk/t'}
                              </span>
                            ) : (
                              <span className="font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                🌈 {specs.abbeValue} Abbe (Yüksek Netlik)
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Su İçeriği & Yoğunluk */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          💧 Su Oranı / Yoğunluk
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3 font-medium text-slate-800">
                            {specs.isContact ? `💧 ${specs.waterContent}` : `⚖️ ${specs.density}`}
                          </td>
                        ))}
                      </tr>

                      {/* UV Filtre Koruması */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          ☀️ UV Koruması
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3 font-bold text-emerald-800">
                            {specs.uvProtection}
                          </td>
                        ))}
                      </tr>

                      {/* --- BÖLÜM 2: KAPLAMA, KONFOR & KULLANIM NİTELİKLERİ --- */}
                      <tr className="bg-sky-50/90 text-sky-950 font-bold">
                        <td colSpan={specsList.length + 1} className="px-3 py-2 text-xs uppercase tracking-wide">
                          ✨ 2. Kaplama, Konfor & Ambalaj Özellikleri
                        </td>
                      </tr>

                      {/* Kaplama & Teknoloji */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          ✨ Kaplama / Yüzey
                        </td>
                        {specsList.map(({ raw, sanitized, specs }) => (
                          <td key={raw.id} className="p-3 font-bold text-slate-900">
                            {sanitized.coating || (specs.isContact ? 'Özel Konfor Yüzeyi' : 'Standart Kaplama')}
                          </td>
                        ))}
                      </tr>

                      {/* Kullanım Süresi / Çerçeve Uyumu */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          ⏱️ Kullanım / Çerçeve Uyumu
                        </td>
                        {specsList.map(({ raw, specs }) => (
                          <td key={raw.id} className="p-3 font-medium text-slate-800">
                            {specs.isContact ? specs.wearPeriodText : specs.frameCompatibility}
                          </td>
                        ))}
                      </tr>

                      {/* Kutu / Teslimat Türü */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          📦 Paket / Tedarik
                        </td>
                        {specsList.map(({ raw, sanitized, specs }) => (
                          <td key={raw.id} className="p-3 font-medium text-slate-800">
                            {specs.isContact ? specs.boxContent : (sanitized.deliveryType === 'stock' ? 'Stok Cam (Aynı Gün)' : 'RX Özel Üretim (3-5 Gün)')}
                          </td>
                        ))}
                      </tr>

                      {/* Üretim Aralığı (SPH / CYL) */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                          🌐 SPH / CYL Limiti
                        </td>
                        {specsList.map(({ raw, sanitized, specs }) => (
                          <td key={raw.id} className="p-3 font-semibold text-slate-800">
                            SPH: {specs.sphRangeText} {specs.cylMaxText ? `| CYL: ${specs.cylMaxText}` : (sanitized.cylMax ? `| CYL: ±${sanitized.cylMax}` : '')}
                          </td>
                        ))}
                      </tr>

                      {/* Ürünün Kendine Özgü Nitelikleri */}
                      <tr className="hover:bg-slate-50/80 divide-x divide-slate-100 bg-amber-50/30">
                        <td className="p-3 font-bold text-amber-950 bg-amber-100/50">
                          💡 Ürüne Özel Güçlü Yönler
                        </td>
                        {specsList.map(({ raw, sanitized, specs }) => (
                          <td key={raw.id} className="p-3 text-[11px] text-amber-950 leading-relaxed">
                            {sanitized.notes || (
                              specs.isContact
                                ? 'Yüksek nem tutma kapasitesi, biyouyumlu konfor tasarımı.'
                                : 'Üstün optik netlik ve çizilmeye karşı dayanıklı yüzey mimarisi.'
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* --- BÖLÜM 3: FİYATLANDIRMA & KÂR (OPTİSYEN MODU DAHİL) --- */}
                      <tr className="bg-emerald-50 text-emerald-950 font-bold">
                        <td colSpan={specsList.length + 1} className="px-3 py-2 text-xs uppercase tracking-wide">
                          💰 3. Fiyatlandırma ve Teklif Özeti
                        </td>
                      </tr>

                      {/* Perakende Fiyat */}
                      <tr className="divide-x divide-slate-100">
                        <td className="p-3 font-bold text-slate-800 bg-emerald-50/50">
                          Tavsiye Satış Tutarı ({pairCount === 2 ? 'Çift / 2 Kutu' : 'Tek / 1 Kutu'})
                        </td>
                        {specsList.map(({ raw, sanitized, retailPrice }) => (
                          <td key={raw.id} className="p-3 bg-emerald-50/70">
                            <span className="text-lg font-black text-emerald-700 block">
                              {formatCurrency(retailPrice, sanitized.currency)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold block">
                              KDV Dahil Müşteri Fiyatı
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Optisyen Görünümü: Toptan & Net Kâr */}
                      {!isCustomerMode && (
                        <>
                          <tr className="divide-x divide-slate-100">
                            <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                              Toptan Maliyet (Depo Alış)
                            </td>
                            {specsList.map(({ raw, sanitized, fin }) => (
                              <td key={raw.id} className="p-3 font-bold text-slate-800">
                                <div>{formatCurrency(fin.netWholesaleCost, sanitized.currency)}</div>
                                <span className="text-[10px] text-slate-400 font-normal">İskontolu Net Alış</span>
                              </td>
                            ))}
                          </tr>

                          <tr className="divide-x divide-slate-100">
                            <td className="p-3 font-bold text-slate-700 bg-slate-50/50">
                              Net Kâr & Kâr Marjı
                            </td>
                            {specsList.map(({ raw, sanitized, fin }) => (
                              <td key={raw.id} className="p-3">
                                <span className="text-sm font-black text-sky-700 block">
                                  +{formatCurrency(fin.profitAmount, sanitized.currency)}
                                </span>
                                <span className="text-[10px] font-extrabold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                                  %{fin.profitMarginPercent} Marj
                                </span>
                              </td>
                            ))}
                          </tr>
                        </>
                      )}

                      {/* Quick Add to Custom List Row */}
                      <tr className="divide-x divide-slate-100 bg-slate-50">
                        <td className="p-3 font-bold text-slate-700">
                          Özel Listeye Ekle
                        </td>
                        {specsList.map(({ raw }) => (
                          <td key={raw.id} className="p-3">
                            <button
                              onClick={() => onAddToList(raw, selectedListId || customLists[0]?.id || '')}
                              className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Listeye Aktar</span>
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Hedef Liste:</span>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
            >
              {customLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
            >
              Kapat
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Kıyaslama Raporu (PDF / Yazdır)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
