import React from 'react';
import { Lens, BrandDiscount, CustomList } from '../types';
import { calculateLensFinancials, formatCurrency, getCampaignDetails } from '../utils/pricing';
import { Plus, Check, Info, ShieldCheck, Sparkles, Clock, Layers, Eye, Glasses, Package, Building2, Trash2, Tag } from 'lucide-react';
import { getDistributorForBrand, getDistributorInfo } from '../data/distributors';

interface LensCardProps {
  lens: Lens;
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  catalog?: Lens[];
  onOpenDetails: (lens: Lens) => void;
  onAddToList: (lens: Lens) => void;
  isAddedToActiveList?: boolean;
  isAdmin?: boolean;
  onDeleteLens?: (lensId: string) => void;
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
  coopervision: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  alcon: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'bausch & lomb': { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  'johnson & johnson': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
};

const CATEGORY_NAMES: Record<string, string> = {
  single_vision: 'Tek Odaklı / Sferik',
  progressive: 'Progresif / Multifokal',
  office: 'Ofis / Dijital',
  bifocal: 'Bifokal',
  photochromic: 'Fotokromik / Renkli',
  sun_polarized: 'Güneş / Polarize',
  drive: 'Sürüş Camı',
  custom_rx: 'Özel Üretim / Torik',
};

export const LensCard: React.FC<LensCardProps> = ({
  lens,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  catalog,
  onOpenDetails,
  onAddToList,
  isAddedToActiveList,
  isAdmin,
  onDeleteLens,
}) => {
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount);
  const campaign = getCampaignDetails(lens, pairCount, catalog);
  const isZeroPriceCampaign = campaign.isCampaign && (fin.retailPrice <= 0 || !lens.retailPrice || lens.retailPrice === 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (showDeleteConfirm) {
      const timer = setTimeout(() => setShowDeleteConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteConfirm]);

  const brandKey = lens.brand.trim().toLowerCase();
  const brandStyle = BRAND_COLORS[brandKey] || {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
  };

  const isContact = lens.productType === 'contact_lens';
  const isCampaign = campaign.isCampaign;
  const distributorName = lens.distributor || getDistributorForBrand(lens.brand, lens.name);
  const distributorInfo = distributorName ? getDistributorInfo(distributorName) : undefined;

  return (
    <div
      id={`lens-card-${lens.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group ${
        isCampaign
          ? 'border-2 border-amber-400/90 bg-gradient-to-b from-amber-500/[0.04] via-white to-amber-500/[0.07] ring-3 ring-amber-400/20 shadow-md'
          : 'border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Campaign Banner if campaign product */}
      {isCampaign && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] sm:text-[11px] font-bold px-3 py-1.5 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-1.5 font-extrabold truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
            <span className="truncate">🔥 {campaign.campaignTitle}</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-black">
              %{campaign.discountPercent} Avantajlı
            </span>
            <span className="hidden sm:inline bg-black/25 px-1.5 py-0.5 rounded text-[9px] font-medium">
              {campaign.campaignPeriod}
            </span>
          </div>
        </div>
      )}

      {/* Top Header info */}
      <div className="p-3.5 sm:p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Brand & Category badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${brandStyle.bg} ${brandStyle.text} ${brandStyle.border}`}
            >
              {lens.brand}
            </span>

            {/* Üst Dağıtıcı / Distribütör Badge */}
            {distributorName && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  distributorInfo?.badgeColor || 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}
                title={`Ana Dağıtıcı / Üst Firma: ${distributorName}`}
              >
                <Building2 className="w-2.5 h-2.5 shrink-0" />
                <span>{distributorInfo?.shortName || distributorName}</span>
              </span>
            )}

            {/* Product Type Indicator */}
            {isContact ? (
              <span className="bg-teal-50 text-teal-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Kontakt Lens</span>
              </span>
            ) : (
              <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                <Glasses className="w-3 h-3" />
                <span>Cam</span>
              </span>
            )}

            {/* Technical parameter: Index for eyeglass, Wear period for contact lens */}
            {isContact ? (
              lens.wearPeriod && (
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                  {lens.wearPeriod}
                </span>
              )
            ) : (
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md">
                {lens.index} İndeks
              </span>
            )}

            <span className="bg-slate-50 text-slate-600 text-[11px] px-2 py-0.5 rounded-md border border-slate-100">
              {CATEGORY_NAMES[lens.category] || lens.category}
            </span>

            {/* List Type Badge */}
            {isCampaign ? (
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1 shadow-2xs"
                title="Kampanya Listesi Ürünü"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>KAMPANYA</span>
              </span>
            ) : lens.sourceListType ? (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  lens.sourceListType === 'toptan'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : lens.sourceListType === 'perakende'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
                title="Liste Tipi"
              >
                {lens.sourceListType === 'toptan' ? 'TFL' : lens.sourceListType === 'perakende' ? 'PFL' : 'KMP'}
              </span>
            ) : null}
          </div>

          {/* Delivery tag */}
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${
              lens.deliveryType === 'stock'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            {lens.deliveryType === 'stock' ? 'Stok' : 'RX'}
          </span>
        </div>

        {/* Lens Name */}
        <h3
          onClick={() => onOpenDetails(lens)}
          className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition cursor-pointer leading-snug"
        >
          {lens.name}
        </h3>

        {/* Ürün / Liste Kodu Rozeti (Yalnızca Optisyen Görünümünde) */}
        {!isCustomerMode && (lens.productCode || fin.isCostFromCode) && (
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-900 text-slate-100 px-2 py-0.5 rounded-md font-mono w-fit shadow-2xs border border-slate-700">
            <span className="text-amber-400 font-bold text-[10px]">KOD:</span>
            <span className="font-semibold tracking-wide">{lens.productCode || fin.codeCostResult?.rawCode}</span>
            {fin.isCostFromCode && (
              <span className="bg-amber-500/20 text-amber-300 px-1 rounded text-[10px] font-bold border border-amber-400/30">
                Maliyet: {formatCurrency(fin.codeCostResult?.parsedCost || fin.netWholesaleCost, lens.currency)}
              </span>
            )}
          </div>
        )}

        {/* Features / Coating / Contact Lens Specs */}
        <div className="text-xs text-slate-500 space-y-1">
          {isContact ? (
            /* Contact Lens Specific Spec Line */
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{lens.boxContent || '6 Adet / Kutu'}</span>
                {lens.baseCurve && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    BC: {lens.baseCurve}
                  </span>
                )}
                {lens.diameter && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    DIA: {lens.diameter}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lens.material || 'Silikon Hidrojel'}</span>
                {lens.sphRange && <span>Diyoptri: {lens.sphRange}</span>}
              </div>
            </div>
          ) : (
            /* Optical Eyeglass Lens Spec Line */
            <>
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{lens.coating}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{lens.material}</span>
                {lens.sphRange && <span>Diyoptri: {lens.sphRange}</span>}
              </div>
            </>
          )}
        </div>

        {/* ÖN GÖRÜNÜMDE KAMPANYA DETAYI & NORMAL LİSTE EŞLEŞMESİ BLOĞU */}
        {isCampaign && (
          <div className="mt-2.5 p-2.5 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/95 via-orange-50/60 to-amber-100/50 shadow-2xs space-y-2">
            {/* Başlık ve İndirim Rozeti */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 text-amber-950 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                <span className="truncate">{campaign.campaignTitle}</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs shrink-0">
                -%{campaign.discountPercent} Avantajlı
              </span>
            </div>

            {/* Markanın Normal Listesinden Eşleşen Ürün ve Normal Fiyatı */}
            <div className="bg-white/95 p-2 rounded-lg border border-amber-200/90 text-xs space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Normal Liste (PFL) Eşleşmesi:</span>
                {campaign.matchedSource === 'catalog_match' ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold text-[9px] flex items-center gap-0.5 border border-emerald-200 shrink-0">
                    <Check className="w-2.5 h-2.5" /> PFL'den Çekildi
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium text-[9px]">Standart Liste</span>
                )}
              </div>
              <div className="font-bold text-slate-800 text-[11px] truncate leading-tight" title={campaign.matchedRegularName || lens.name}>
                {campaign.matchedRegularName || `${lens.brand} Normal Liste Karşılığı`}
              </div>
              <div className="flex items-baseline justify-between text-[11px] pt-1 border-t border-slate-100">
                <span className="text-slate-500 text-[10px]">Normal Liste Perakende:</span>
                <span className="font-bold text-slate-700 line-through">
                  {formatCurrency(campaign.regularRetailPrice, lens.currency)}
                </span>
              </div>
            </div>

            {/* Kampanyalı Fiyat & Tasarruf Karşılaştırma Bandı */}
            <div className="flex items-center justify-between gap-1 text-[11px] bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-300/80">
              <span className="text-amber-950 font-medium text-[10px]">
                Müşteri Net Tasarrufu:
              </span>
              <span className="text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px] border border-emerald-300">
                {formatCurrency(campaign.savingsAmount, lens.currency)} Tasarruf
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Section (TOPTAN / PERAKENDE AYRIMI) */}
      <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 sm:p-4 space-y-2.5">
        {isZeroPriceCampaign ? (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-amber-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
              <span>{campaign.campaignTitle || 'Özel Kampanya Koşulları'}</span>
            </div>
            <p className="text-[11px] text-amber-900 font-medium">
              {lens.notes || `Bu kampanyalı ürün için net fiyat tanımlanmamıştır. Detaylar ve paket şartları için iletişime geçiniz.`}
            </p>
            <div className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block border border-amber-200">
              🏷️ Fiyat yerine kampanya detayları geçerlidir
            </div>
          </div>
        ) : isCustomerMode ? (
          /* MÜŞTERİ MODU: SADECE PERAKENDE FİYAT GÖRÜNÜR */
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {campaign.isCampaign
                  ? isContact
                    ? pairCount === 2 ? '2 Kutu Kampanyalı Satış:' : '1 Kutu Kampanyalı Satış:'
                    : `Kampanyalı Satış (${pairCount === 2 ? 'Çift Cam' : 'Tek Cam'}):`
                  : isContact
                  ? pairCount === 2 ? '2 Kutu (Sağ + Sol) Satış:' : '1 Kutu Tavsiye Satış:'
                  : `Tavsiye Satış (${pairCount === 2 ? 'Çift Cam' : 'Tek Cam'}):`}
              </span>
              {campaign.isCampaign ? (
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>%{campaign.discountPercent} İndirim</span>
                </span>
              ) : (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                  KDV Dahil
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-2xl font-black tracking-tight ${campaign.isCampaign ? 'text-amber-600' : 'text-slate-900'}`}>
                    {formatCurrency(fin.retailPrice, lens.currency)}
                  </span>
                  {campaign.isCampaign && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      {formatCurrency(campaign.regularRetailPrice, lens.currency)}
                    </span>
                  )}
                </div>
                {campaign.isCampaign && (
                  <div className="text-[11px] font-semibold text-slate-600 mt-0.5 flex items-center gap-1 flex-wrap">
                    <span>Normal Liste:</span>
                    <span className="font-bold text-slate-700">{formatCurrency(campaign.regularRetailPrice, lens.currency)}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {formatCurrency(campaign.savingsAmount, lens.currency)} Tasarruf
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onOpenDetails(lens)}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-0.5 shrink-0 self-start"
              >
                <span>Özellikler</span>
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* OPTİSYEN / TOPTAN MODU: TOPTAN LİSTE, İSKONTO, NET ALIŞ, PERAKENDE VE KAR ANALİZİ */
          <div className="space-y-2">
            {/* Wholesale Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Toptan & İskonto */}
              <div className={`p-2 rounded-xl border ${campaign.isCampaign ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span>Toptan Alış</span>
                  {campaign.isCampaign ? (
                    <span className="text-amber-600 font-bold">🔥 Kampanya</span>
                  ) : fin.isCostFromCode ? (
                    <span className="text-amber-700 bg-amber-100/90 px-1 py-0.2 rounded font-bold text-[9px] border border-amber-300" title={fin.codeCostResult?.patternDescription}>
                      🏷️ Kod Maliyeti
                    </span>
                  ) : (
                    <span className="text-sky-600 font-bold">-%{fin.effectiveDiscountRate}</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-col">
                  <div className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-base font-extrabold text-slate-800">
                      {lens.currency === 'EUR'
                        ? `${formatCurrency(lens.wholesalePrice, 'EUR')} (€)`
                        : formatCurrency(fin.netWholesaleCost, lens.currency)}
                    </span>
                    {campaign.isCampaign && campaign.regularWholesalePrice ? (
                      <span className="text-[11px] text-slate-400 line-through" title="Normal Liste Toptan Fiyatı">
                        {formatCurrency(campaign.regularWholesalePrice, lens.currency)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 line-through">
                        {formatCurrency(fin.wholesaleListPrice, lens.currency)}
                      </span>
                    )}
                  </div>
                  {campaign.isCampaign && campaign.regularWholesalePrice ? (
                    <span className="text-[9px] text-amber-800 font-semibold">
                      Normal Toptan: {formatCurrency(campaign.regularWholesalePrice, lens.currency)}
                      {campaign.wholesaleSavingsAmount ? ` (+${formatCurrency(campaign.wholesaleSavingsAmount, lens.currency)} Kazanç)` : ''}
                    </span>
                  ) : lens.currency === 'EUR' ? (
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Canlı Karşılığı: ~ {formatCurrency(fin.netWholesaleCost, 'TRY')}
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {isContact
                    ? pairCount === 2
                      ? '2 Kutu net alış maliyeti'
                      : '1 Kutu net alış maliyeti'
                    : pairCount === 2
                    ? 'Çift cam net maliyet'
                    : 'Tek cam net maliyet'}
                </div>
              </div>

              {/* Perakende & Kar */}
              <div className={`p-2 rounded-xl border ${campaign.isCampaign ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span>Perakende</span>
                  {campaign.isCampaign ? (
                    <span className="text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-bold">
                      %{campaign.discountPercent} İndirimli
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">%{fin.profitMarginPercent} Kar</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5 flex-wrap">
                  <span className={`text-base font-extrabold ${campaign.isCampaign ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {formatCurrency(fin.retailPrice, lens.currency)}
                  </span>
                  {campaign.isCampaign && (
                    <span className="text-[11px] text-slate-400 line-through">
                      {formatCurrency(campaign.regularRetailPrice, lens.currency)}
                    </span>
                  )}
                </div>
                {campaign.isCampaign ? (
                  <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                    Normal: <span className="font-bold text-slate-800">{formatCurrency(campaign.regularRetailPrice, lens.currency)}</span>
                    <span className="text-emerald-600 font-bold ml-1">
                      (+{formatCurrency(fin.profitAmount, lens.currency)} Kar)
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    + {formatCurrency(fin.profitAmount, lens.currency)} Net Kar
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onAddToList(lens)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              isAddedToActiveList
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
            }`}
          >
            {isAddedToActiveList ? (
              <>
                <Check className="w-4 h-4" />
                <span>Listeye Eklendi</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Özel Listeye Ekle</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenDetails(lens)}
            className="p-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 transition"
            title="Ürün Detayı & Reçete Uyumu"
          >
            <Info className="w-4 h-4" />
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
              className={`p-2 rounded-xl border transition duration-150 flex items-center justify-center gap-1 ${
                showDeleteConfirm
                  ? 'border-rose-400 bg-rose-600 text-white animate-pulse px-3'
                  : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
              }`}
              title={showDeleteConfirm ? 'Silmek için tekrar tıklayın' : 'Katalogdan Sil'}
            >
              <Trash2 className="w-4 h-4" />
              {showDeleteConfirm && <span className="text-[10px] font-bold">Emin misiniz?</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
