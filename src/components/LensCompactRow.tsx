import React from 'react';
import { Lens, BrandDiscount } from '../types';
import { calculateLensFinancials, formatCurrency } from '../utils/pricing';
import { Plus, Check, Info } from 'lucide-react';

interface LensCompactRowProps {
  lens: Lens;
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  onOpenDetails: (lens: Lens) => void;
  onAddToList: (lens: Lens) => void;
  isAddedToActiveList?: boolean;
}

export const LensCompactRow: React.FC<LensCompactRowProps> = ({
  lens,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  onOpenDetails,
  onAddToList,
  isAddedToActiveList,
}) => {
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount);

  return (
    <div
      id={`lens-row-${lens.id}`}
      className="bg-white border-b border-slate-100 hover:bg-sky-50/40 p-3 sm:px-4 flex items-center justify-between gap-3 transition"
    >
      {/* Brand, Index & Name */}
      <div className="flex-1 min-w-0" onClick={() => onOpenDetails(lens)}>
        <div className="flex items-center gap-1.5 flex-wrap cursor-pointer">
          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
            {lens.brand}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
            {lens.index}
          </span>
          <span className="text-xs font-semibold text-slate-900 truncate">
            {lens.name}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 truncate mt-0.5">
          {lens.coating} • {lens.sphRange || 'Tüm diyoptriler'}
        </div>
      </div>

      {/* Pricing Columns */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        {/* Optician Mode: Wholesale + Discount */}
        {!isCustomerMode && (
          <div className="hidden xs:block">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">
              Net Alış (-%{fin.effectiveDiscountRate})
            </div>
            <div className="text-xs font-bold text-slate-800">
              {formatCurrency(fin.netWholesaleCost, lens.currency)}
            </div>
          </div>
        )}

        {/* Retail Price (Always visible) */}
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase">
            {isCustomerMode ? 'Satış Fiyatı' : 'Perakende (Kar: %' + fin.profitMarginPercent + ')'}
          </div>
          <div className="text-sm font-extrabold text-emerald-700">
            {formatCurrency(fin.retailPrice, lens.currency)}
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => onAddToList(lens)}
          className={`p-1.5 rounded-lg border transition ${
            isAddedToActiveList
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'border-slate-300 text-slate-700 hover:border-sky-500 hover:text-sky-600'
          }`}
          title="Listeye Ekle"
        >
          {isAddedToActiveList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
