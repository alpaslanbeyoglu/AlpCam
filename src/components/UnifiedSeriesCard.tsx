import React, { useState, useMemo } from 'react';
import { Lens, BrandDiscount } from '../types';
import { calculateLensFinancials, formatCurrency, getCampaignDetails } from '../utils/pricing';
import { Plus, Check, Info, Sparkles, Building2, Glasses, Eye, Layers, ShieldCheck, Scale, Printer } from 'lucide-react';
import { getDistributorForBrand, getDistributorInfo } from '../data/distributors';
import { exportLensCardToPDF } from '../utils/lensCardExport';

interface UnifiedSeriesCardProps {
  seriesName: string;
  brand: string;
  lensesInSeries: Lens[];
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  catalog: Lens[];
  onOpenDetails: (lens: Lens) => void;
  onAddToList: (lens: Lens, pairCount: 1 | 2) => void;
  isAddedToActiveList?: (lensId: string) => boolean;
  isAdmin?: boolean;
  isComparing?: (lensId: string) => boolean;
  onToggleCompare?: (lens: Lens) => void;
}

const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  essilor: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  zeiss: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  shamir: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  hoya: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  kodak: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  novax: { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200' },
  seiko: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  visionart: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
};

export const UnifiedSeriesCard: React.FC<UnifiedSeriesCardProps> = ({
  seriesName,
  brand,
  lensesInSeries,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  catalog,
  onOpenDetails,
  onAddToList,
  isAddedToActiveList,
  isAdmin,
  isComparing,
  onToggleCompare,
}) => {
  // 1. Extract available tech / category segments in this series (White, Sensity 1, Sensity 2, Polarized)
  const segments = useMemo(() => {
    const segSet = new Set<'white' | 'sensity1' | 'sensity2' | 'polarized' | 'other'>();
    lensesInSeries.forEach((l) => {
      const nameL = l.name.toLowerCase();
      if (nameL.includes('sensity 2')) segSet.add('sensity2');
      else if (nameL.includes('sensity') || l.category === 'photochromic') segSet.add('sensity1');
      else if (nameL.includes('polariz') || l.category === 'sun_polarized') segSet.add('polarized');
      else segSet.add('white');
    });
    return Array.from(segSet);
  }, [lensesInSeries]);

  const [selectedSegment, setSelectedSegment] = useState<'white' | 'sensity1' | 'sensity2' | 'polarized' | 'other'>(segments[0] || 'white');

  // Filter lenses by selected segment
  const segmentLenses = useMemo(() => {
    return lensesInSeries.filter((l) => {
      const nameL = l.name.toLowerCase();
      if (selectedSegment === 'sensity2') return nameL.includes('sensity 2');
      if (selectedSegment === 'sensity1') return (nameL.includes('sensity') && !nameL.includes('sensity 2')) || l.category === 'photochromic';
      if (selectedSegment === 'polarized') return nameL.includes('polariz') || l.category === 'sun_polarized';
      if (selectedSegment === 'white') return !nameL.includes('sensity') && !nameL.includes('polariz') && l.category !== 'photochromic' && l.category !== 'sun_polarized';
      return true;
    });
  }, [lensesInSeries, selectedSegment]);

  // 2. Extract available indices for this segment
  const availableIndices = useMemo(() => {
    const set = new Set<string>();
    segmentLenses.forEach((l) => {
      if (l.index) set.add(l.index);
    });
    const order = ['1.50', '1.53', '1.56', '1.60', '1.67', '1.74'];
    return Array.from(set).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [segmentLenses]);

  const [selectedIndex, setSelectedIndex] = useState<string>(() => availableIndices[0] || '1.50');

  // Reset selectedIndex if not in availableIndices
  React.useEffect(() => {
    if (!availableIndices.includes(selectedIndex) && availableIndices.length > 0) {
      setSelectedIndex(availableIndices[0]);
    }
  }, [availableIndices, selectedIndex]);

  // Filter by selected index
  const indexLenses = useMemo(() => {
    return segmentLenses.filter((l) => l.index === selectedIndex);
  }, [segmentLenses, selectedIndex]);

  // 3. Extract available coatings for this index & segment
  const availableCoatings = useMemo(() => {
    const set = new Set<string>();
    indexLenses.forEach((l) => {
      if (l.coating) set.add(l.coating);
    });
    return Array.from(set);
  }, [indexLenses]);

  const [selectedCoating, setSelectedCoating] = useState<string>(() => availableCoatings[0] || 'Hi-Vision LongLife');

  // Reset selectedCoating if not available
  React.useEffect(() => {
    if (!availableCoatings.includes(selectedCoating) && availableCoatings.length > 0) {
      setSelectedCoating(availableCoatings[0]);
    }
  }, [availableCoatings, selectedCoating]);

  // 4. Find the exact matching lens
  const activeLens = useMemo(() => {
    const exact = indexLenses.find((l) => l.coating === selectedCoating);
    return exact || indexLenses[0] || lensesInSeries[0];
  }, [indexLenses, selectedCoating, lensesInSeries]);

  if (!activeLens) return null;

  // Financials & Campaign
  const fin = calculateLensFinancials(activeLens, brandDiscounts, pairCount);
  const campaign = getCampaignDetails(activeLens, pairCount, catalog);
  const isCampaign = campaign.isCampaign;

  const brandKey = brand.trim().toLowerCase();
  const brandStyle = BRAND_COLORS[brandKey] || {
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
  };

  const distributorName = activeLens.distributor || getDistributorForBrand(brand, activeLens.name);
  const distributorInfo = distributorName ? getDistributorInfo(distributorName) : undefined;
  const isStock = activeLens.deliveryType === 'stock';
  const isAdded = isAddedToActiveList ? isAddedToActiveList(activeLens.id) : false;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
      isCampaign ? 'border-2 border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-sky-300'
    }`}>
      {/* Campaign Banner if applicable */}
      {isCampaign && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] font-bold px-3 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1 font-extrabold truncate">
            <Sparkles className="w-3 h-3 text-amber-200 shrink-0" />
            <span>🔥 {campaign.campaignTitle}</span>
          </span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-black">
            %{campaign.discountPercent} Avantajlı
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${brandStyle.bg} ${brandStyle.text} ${brandStyle.border}`}>
              {brand}
            </span>
            {distributorName && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${distributorInfo?.badgeColor || 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <span>{distributorInfo?.shortName || distributorName}</span>
              </span>
            )}
            <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
              <Glasses className="w-3 h-3" />
              <span>Progresif / Çok Odaklı</span>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleCompare && (
              <button
                onClick={() => onToggleCompare(activeLens)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition shrink-0 ${
                  isComparing && isComparing(activeLens.id)
                    ? 'bg-amber-500 text-slate-950 shadow-2xs font-bold'
                    : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                }`}
                title={isComparing && isComparing(activeLens.id) ? 'Kıyaslamadan Çıkar' : 'Diğer Camlarla Kıyasla'}
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => exportLensCardToPDF(activeLens, pairCount)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 flex items-center justify-center transition shrink-0"
              title="Cam Bilgi Kartını PDF Olarak Yazdır / Kaydet"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onOpenDetails(activeLens)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
              title="Detaylı Cam Kartı Bilgileri"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Series Title */}
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>{seriesName}</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
              Ana Aile Kartı
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            {activeLens.name}
          </p>
        </div>

        {/* INTERACTIVE SELECTORS (Strict Hierarchy: Odak -> İndeks -> Şeffaf/Fotokromik/Polarize -> Kaplama) */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100 text-xs">
          {/* 1. Odak Tipi (Focus Badge Header) */}
          <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-200/80 text-[11px]">
            <span className="font-extrabold text-slate-500 uppercase text-[10px]">1. Odak Tipi:</span>
            <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {activeLens.category === 'progressive' ? 'Çok Odaklı (Progresif)' :
               activeLens.category === 'office' ? 'Ofis / Dijital Odaklı' :
               activeLens.category === 'bifocal' ? 'Bifokal Odaklı' : 'Tek Odaklı (Single Vision)'}
            </span>
          </div>

          {/* 2. Index Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                2. İndeks / Kalınlık:
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-700">
                {selectedIndex} İndeks
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {availableIndices.map((idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono transition ${
                    selectedIndex === idx
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {idx}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Şeffaf - Fotokromik - Polarize Selector */}
          {segments.length > 1 && (
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                3. Cam Tipi (Şeffaf / Fotokromik / Polarize):
              </span>
              <div className="flex flex-wrap gap-1">
                {segments.map((seg) => {
                  const label = 
                    seg === 'sensity2' ? 'Sensity 2 (Fotokromik)' :
                    seg === 'sensity1' ? 'Fotokromik (Sensity)' :
                    seg === 'polarized' ? 'Polarize (Güneş)' : 'Şeffaf (Beyaz)';
                  return (
                    <button
                      key={seg}
                      onClick={() => setSelectedSegment(seg)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                        selectedSegment === seg
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Coating Selector */}
          {availableCoatings.length > 0 && (
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                4. Kaplama / Yüzey Teknolojisi:
              </span>
              <div className="flex flex-wrap gap-1">
                {availableCoatings.map((coating) => (
                  <button
                    key={coating}
                    onClick={() => setSelectedCoating(coating)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition truncate max-w-full ${
                      selectedCoating === coating
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={coating}
                  >
                    {coating}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Pricing & Add to List */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-semibold">
                {activeLens.productType === 'contact_lens' || activeLens.category === 'contact_lens'
                  ? pairCount === 2 ? '2 Kutu (Çift):' : '1 Kutu (Tek):'
                  : pairCount === 2 ? 'Çift Cam (2 Adet):' : 'Tek Cam (1 Adet):'}
              </span>
              {isStock && (
                <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100 px-1.5 py-0.2 rounded" title="Stok Ürün (Hızlı Teslimat)">
                  {activeLens.productType === 'contact_lens' || activeLens.category === 'contact_lens' ? 'Stok Lens (*)' : 'Stok Cam (*)'}
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(
                isCustomerMode ? (pairCount === 2 ? activeLens.retailPrice * 2 : activeLens.retailPrice) : fin.retailPrice,
                activeLens.currency
              )}
            </div>
          </div>

          {!isCustomerMode && fin.wholesaleListPrice > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold">Net Alış / Kâr</span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {formatCurrency(fin.netWholesaleCost, activeLens.currency)}
              </span>
              {fin.profitMarginPercent > 0 && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1 rounded block mt-0.5">
                  %{Math.round(fin.profitMarginPercent)} Kâr
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddToList(activeLens, pairCount)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
              isAdded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Teklif Listesinde Var</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Teklife Ekle ({pairCount === 2 ? 'Çift' : 'Tek'} - {selectedIndex})</span>
              </>
            )}
          </button>

          {onToggleCompare && (
            <button
              onClick={() => onToggleCompare(activeLens)}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
                isComparing && isComparing(activeLens.id)
                  ? 'bg-amber-500 border-amber-600 text-slate-950 font-bold shadow-2xs'
                  : 'border-slate-300 hover:bg-amber-50 text-slate-600 hover:text-amber-800 bg-white'
              }`}
              title={isComparing && isComparing(activeLens.id) ? 'Kıyaslamadan Çıkar' : 'Kıyaslama Modülüne Ekle'}
            >
              <Scale className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => exportLensCardToPDF(activeLens, pairCount)}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-sky-50 text-sky-700 transition bg-white"
            title="Seçili Cam Bilgi Kartını PDF / Yazdır"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenDetails(activeLens)}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 transition bg-white"
            title="Özellikler & Detaylar"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
