import React from 'react';
import { Lens, BrandDiscount } from '../types';
import { calculateLensFinancials, formatCurrency, getCampaignDetails } from '../utils/pricing';
import { Plus, Check, Info, Sparkles, Building2, Eye, Package } from 'lucide-react';
import { getDistributorForBrand, getDistributorInfo } from '../data/distributors';

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
}) => {
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount);
  const campaign = getCampaignDetails(lens, pairCount, catalog);
  const isCampaign = campaign.isCampaign;

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
            {lens.wearPeriod && (
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                {lens.wearPeriod}
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetails(lens)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shrink-0"
            title="Detaylı Bilgi"
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
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Package className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-bold">{lens.boxContent || '6 Adet / Kutu'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
            {lens.baseCurve && (
              <div>
                <span className="text-slate-400 block text-[10px]">Temel Eğri (BC):</span>
                <span className="font-mono font-bold text-slate-800">{lens.baseCurve}</span>
              </div>
            )}
            {lens.diameter && (
              <div>
                <span className="text-slate-400 block text-[10px]">Çap (DIA):</span>
                <span className="font-mono font-bold text-slate-800">{lens.diameter}</span>
              </div>
            )}
          </div>

          {lens.material && (
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 truncate">
              <span className="font-semibold text-slate-700">Materyal:</span> {lens.material}
            </div>
          )}

          {lens.sphRange && (
            <div className="text-[11px] text-slate-500 truncate">
              <span className="font-semibold text-slate-700">Diyoptri:</span> {lens.sphRange}
            </div>
          )}
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

        {/* Add to List Button */}
        <button
          onClick={() => onAddToList(lens, pairCount)}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
            isAddedToActiveList
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          {isAddedToActiveList ? (
            <>
              <Check className="w-4 h-4" />
              <span>Teklif Listesinde Var (Ekle)</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Teklife Ekle ({pairCount === 2 ? '2 Kutu' : '1 Kutu'})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
