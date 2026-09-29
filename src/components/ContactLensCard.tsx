import React from 'react';
import { Lens, BrandDiscount } from '../types';
import { calculateLensFinancials, formatCurrency, getCampaignDetails } from '../utils/pricing';
import { Plus, Check, Info, Sparkles, Building2, Eye, Package, Scale, Printer } from 'lucide-react';
import { getDistributorForBrand, getDistributorInfo } from '../data/distributors';
import { getEnhancedLensSpecs } from '../utils/lensSpecsHelper';
import { exportLensCardToPDF } from '../utils/lensCardExport';

interface ContactLensCardProps {
  lens: Lens;
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  setPairCount?: (count: 1 | 2) => void;
  isCustomerMode: boolean;
  catalog?: Lens[];
  onOpenDetails: (lens: Lens) => void;
  onAddToList: (lens: Lens, pairCount: 1 | 2) => void;
  isAddedToActiveList?: boolean;
  isAdmin?: boolean;
  isComparing?: boolean;
  onToggleCompare?: (lens: Lens) => void;
}

const BRAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  coopervision: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  alcon: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'bausch & lomb': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  'johnson & johnson': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  hoya: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  essilor: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

export const ContactLensCard: React.FC<ContactLensCardProps> = ({
  lens,
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
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount);
  const campaign = getCampaignDetails(lens, pairCount, catalog);
  const isCampaign = campaign.isCampaign;
  const specs = getEnhancedLensSpecs(lens);

  const brandKey = lens.brand.trim().toLowerCase();
  const brandStyle = BRAND_COLORS[brandKey] || {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  };

  const distributorName = lens.distributor || getDistributorForBrand(lens.brand, lens.name);
  const distributorInfo = distributorName ? getDistributorInfo(distributorName) : undefined;
  const isStock = lens.deliveryType === 'stock';

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md ${
      isCampaign ? 'border-2 border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-teal-300'
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
              {lens.brand}
            </span>
            {distributorName && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${distributorInfo?.badgeColor || 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <span>{distributorInfo?.shortName || distributorName}</span>
              </span>
            )}
            <span className="bg-teal-50 text-teal-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Kontakt Lens</span>
            </span>
            {specs.wearPeriodText && (
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                {specs.wearPeriodText}
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(lens)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
            title="Detaylı Bilgi & Reçete"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lens Name */}
        <div>
          <h3
            onClick={() => onOpenDetails(lens)}
            className="text-base font-bold text-slate-900 hover:text-teal-600 transition cursor-pointer leading-snug"
          >
            {lens.name}
          </h3>
          {lens.productCode && !isCustomerMode && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] bg-slate-900 text-slate-100 px-2 py-0.5 rounded font-mono w-fit">
              <span className="text-amber-400 font-bold">KOD:</span>
              <span>{lens.productCode}</span>
            </div>
          )}
        </div>

        {/* Contact Lens Specifications */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="font-bold">{specs.boxContent || lens.boxContent || '6 Adet / Kutu'}</span>
            </div>
            <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
              💧 {specs.waterContent} Su
            </span>
          </div>

          {/* Base Curve & DIA Specs */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60">
            <div>
              <span className="text-slate-400 block text-[10px]">Temel Eğri (BC):</span>
              <span className={`font-mono font-extrabold px-1.5 py-0.5 rounded inline-block text-xs ${
                specs.hasMultipleBaseCurves 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}>
                {specs.baseCurve} mm
              </span>
              {specs.hasMultipleBaseCurves && (
                <span className="block text-[9px] text-amber-700 font-bold mt-0.5">
                  Çift Eğri ({specs.baseCurveOptions.join(' / ')})
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Çap (DIA):</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block text-xs">
                {specs.diameter} mm
              </span>
            </div>
          </div>

          {/* Material & Oxygen Dk/t */}
          <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 gap-1">
            <span className="text-slate-600 truncate max-w-[120px]" title={specs.material}>
              {specs.material}
            </span>
            <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
              💨 {specs.oxygenTransmissibility || '100+ Dk/t'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Pricing & Add */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-500 font-semibold">
                {pairCount === 2 ? '2 Kutu (Çift Göz):' : '1 Kutu (Tek Göz):'}
              </span>
              {isStock && (
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded">
                  Stok (*)
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              {formatCurrency(
                isCustomerMode ? (pairCount === 2 ? lens.retailPrice * 2 : lens.retailPrice) : fin.retailPrice,
                lens.currency
              )}
            </div>
          </div>

          {!isCustomerMode && fin.wholesaleListPrice > 0 && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold">Net Alış / Kâr</span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {formatCurrency(fin.netWholesaleCost, lens.currency)}
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
            onClick={() => onAddToList(lens, pairCount)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
              isAddedToActiveList
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            {isAddedToActiveList ? (
              <>
                <Check className="w-4 h-4" />
                <span>Teklif Listesinde Var</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Teklife Ekle ({pairCount === 2 ? '2 Kutu' : '1 Kutu'})</span>
              </>
            )}
          </button>

          {onToggleCompare && (
            <button
              onClick={() => onToggleCompare(lens)}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
                isComparing
                  ? 'bg-amber-500 border-amber-600 text-slate-950 font-bold shadow-2xs'
                  : 'border-slate-300 hover:bg-amber-50 text-slate-600 hover:text-amber-800 bg-white'
              }`}
              title={isComparing ? 'Kıyaslamadan Çıkar' : 'Kıyaslama Modülüne Ekle'}
            >
              <Scale className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => exportLensCardToPDF(lens, pairCount)}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-teal-50 text-teal-700 transition bg-white"
            title="Kontakt Lens Bilgi Kartını PDF / Yazdır"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
