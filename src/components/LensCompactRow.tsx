import React from 'react';
import { Lens, BrandDiscount } from '../types';
import { calculateLensFinancials, formatCurrency, getCampaignDetails } from '../utils/pricing';
import { Plus, Check, Info, Eye, Glasses, Trash2, Sparkles } from 'lucide-react';

interface LensCompactRowProps {
  lens: Lens;
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  onOpenDetails: (lens: Lens) => void;
  onAddToList: (lens: Lens) => void;
  isAddedToActiveList?: boolean;
  isAdmin?: boolean;
  onDeleteLens?: (lensId: string) => void;
}

export const LensCompactRow: React.FC<LensCompactRowProps> = ({
  lens,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  onOpenDetails,
  onAddToList,
  isAddedToActiveList,
  isAdmin,
  onDeleteLens,
}) => {
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount);
  const campaign = getCampaignDetails(lens, pairCount);
  const isContact = lens.productType === 'contact_lens';
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (showDeleteConfirm) {
      const timer = setTimeout(() => setShowDeleteConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteConfirm]);

  return (
    <div
      id={`lens-row-${lens.id}`}
      className={`border-b border-slate-100 p-3 sm:px-4 flex items-center justify-between gap-3 transition ${
        campaign.isCampaign ? 'bg-amber-50/20 hover:bg-amber-50/50' : 'bg-white hover:bg-sky-50/40'
      }`}
    >
      {/* Brand, Index & Name */}
      <div className="flex-1 min-w-0" onClick={() => onOpenDetails(lens)}>
        <div className="flex items-center gap-1.5 flex-wrap cursor-pointer">
          <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded">
            {lens.brand}
          </span>
          {isContact ? (
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Lens</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
              {lens.index}
            </span>
          )}
          {isContact && lens.wearPeriod && (
            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
              {lens.wearPeriod}
            </span>
          )}
          {campaign.isCampaign ? (
            <span
              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-white flex items-center gap-0.5 shadow-xs"
              title={`${campaign.campaignTitle} (${campaign.campaignPeriod})`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>KMP -%{campaign.discountPercent}</span>
            </span>
          ) : lens.sourceListType ? (
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                lens.sourceListType === 'toptan'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : lens.sourceListType === 'perakende'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {lens.sourceListType === 'toptan' ? 'TFL' : lens.sourceListType === 'perakende' ? 'PFL' : 'KMP'}
            </span>
          ) : null}
          <span className="text-xs font-semibold text-slate-900 truncate">
            {lens.name}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 truncate mt-0.5">
          {isContact
            ? `${lens.boxContent || '6 Adet Kutu'} ${lens.baseCurve ? `• BC: ${lens.baseCurve}` : ''} ${lens.diameter ? `• DIA: ${lens.diameter}` : ''}`
            : `${lens.coating} • ${lens.sphRange || 'Tüm diyoptriler'}`}
          {campaign.isCampaign && (
            <span className="text-amber-700 font-semibold ml-1.5">
              • {campaign.campaignTitle}
            </span>
          )}
        </div>
      </div>

      {/* Pricing Columns */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        {/* Optician Mode: Wholesale + Discount */}
        {!isCustomerMode && (
          <div className="hidden xs:block">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">
              {campaign.isCampaign ? 'Kampanya Alış' : `Net Alış (-%${fin.effectiveDiscountRate})`}
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-baseline gap-1 justify-end">
              <span>{formatCurrency(fin.netWholesaleCost, lens.currency)}</span>
              {campaign.isCampaign && campaign.regularWholesalePrice && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatCurrency(campaign.regularWholesalePrice, lens.currency)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Retail Price (Always visible) */}
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase">
            {isCustomerMode
              ? campaign.isCampaign ? 'Kampanyalı Satış' : 'Satış Fiyatı'
              : campaign.isCampaign ? `Perakende (-%${campaign.discountPercent})` : `Perakende (Kar: %${fin.profitMarginPercent})`}
          </div>
          <div className="text-sm font-extrabold flex items-baseline gap-1.5 justify-end">
            <span className={campaign.isCampaign ? 'text-amber-600' : 'text-emerald-700'}>
              {formatCurrency(fin.retailPrice, lens.currency)}
            </span>
            {campaign.isCampaign && (
              <span className="text-xs font-semibold text-slate-400 line-through">
                {formatCurrency(campaign.regularRetailPrice, lens.currency)}
              </span>
            )}
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

        {isAdmin && onDeleteLens && (
          <button
            onClick={() => {
              if (!showDeleteConfirm) {
                setShowDeleteConfirm(true);
                return;
              }
              setShowDeleteConfirm(false);
              onDeleteLens(lens.id);
            }}
            className={`p-1.5 border rounded-lg transition flex items-center justify-center gap-1 ${
              showDeleteConfirm
                ? 'border-rose-400 bg-rose-600 text-white animate-pulse px-2'
                : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            }`}
            title={showDeleteConfirm ? 'Silmek için tekrar tıklayın' : 'Katalogdan Sil'}
          >
            <Trash2 className="w-4 h-4" />
            {showDeleteConfirm && <span className="text-[9px] font-bold">Emin misiniz?</span>}
          </button>
        )}
      </div>
    </div>
  );
};
