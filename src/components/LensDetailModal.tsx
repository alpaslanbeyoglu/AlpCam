import React, { useState } from 'react';
import { Lens, BrandDiscount, CustomList } from '../types';
import { calculateLensFinancials, formatCurrency } from '../utils/pricing';
import { X, Sparkles, Plus, Check, ShieldCheck, CheckCircle2, Sliders } from 'lucide-react';

interface LensDetailModalProps {
  lens: Lens | null;
  onClose: () => void;
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  customLists: CustomList[];
  onAddToList: (lens: Lens, listId: string, customPrice?: number) => void;
}

export const LensDetailModal: React.FC<LensDetailModalProps> = ({
  lens,
  onClose,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  customLists,
  onAddToList,
}) => {
  if (!lens) return null;

  const [selectedListId, setSelectedListId] = useState<string>(
    customLists[0]?.id || ''
  );
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const customPrice = customPriceInput ? parseFloat(customPriceInput) : undefined;
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount, customPrice);

  const handleAdd = () => {
    if (!selectedListId && customLists.length > 0) {
      onAddToList(lens, customLists[0].id, customPrice);
    } else {
      onAddToList(lens, selectedListId, customPrice);
    }
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
              {lens.brand}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              {lens.index} İndeks
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Title and features */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {lens.name}
            </h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-sky-50 border border-sky-100 p-2 rounded-xl">
              <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{lens.coating}</span>
            </div>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Hammadde</span>
              <span className="font-semibold text-slate-800">{lens.material}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Teslimat / Stok</span>
              <span className="font-semibold text-slate-800">
                {lens.deliveryType === 'stock' ? 'Stok (Aynı Gün)' : 'RX Özel Üretim (3-5 İş Günü)'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Diyoptri Sferik (SPH)</span>
              <span className="font-semibold text-slate-800">{lens.sphRange || 'Standart üretim'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Maks Silindirik (CYL)</span>
              <span className="font-semibold text-slate-800">± {lens.cylMax ?? 2.00} Dpt</span>
            </div>
          </div>

          {lens.notes && (
            <div className="bg-amber-50/60 border border-amber-200 text-amber-900 text-xs p-2.5 rounded-xl">
              <span className="font-semibold block mb-0.5">Optisyen Notu:</span>
              <span>{lens.notes}</span>
            </div>
          )}

          {/* Pricing & Profit Simulator */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold flex items-center justify-between">
              <span>{pairCount === 2 ? 'Çift Cam (2x) Fiyat Özeti' : 'Tek Cam (1x) Fiyat Özeti'}</span>
              {!isCustomerMode && (
                <span className="text-emerald-400 font-bold">
                  Net Kar: %{fin.profitMarginPercent}
                </span>
              )}
            </div>

            <div className="p-3.5 space-y-3 bg-white">
              {isCustomerMode ? (
                /* Customer mode */
                <div className="text-center py-2 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Tavsiye Edilen Satış Fiyatı</span>
                  <div className="text-3xl font-black text-slate-900">
                    {formatCurrency(fin.retailPrice, lens.currency)}
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block font-semibold">
                    KDV Dahil • Orijinal Garanti Sertifikalı
                  </span>
                </div>
              ) : (
                /* Optician mode */
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Toptan Liste Fiyatı:</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(fin.wholesaleListPrice, lens.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Marka İskontosu:</span>
                    <span className="font-bold text-sky-600">
                      -%{fin.effectiveDiscountRate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 bg-slate-50 p-2 rounded-lg">
                    <span className="font-bold text-slate-800">Net Alış Maliyeti:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatCurrency(fin.netWholesaleCost, lens.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Standart Perakende Fiyat:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(lens.retailPrice * pairCount, lens.currency)}
                    </span>
                  </div>

                  {/* Custom Price simulator */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Müşteriye Özel Satış Fiyatı Tanımla (₺):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customPriceInput}
                        onChange={(e) => setCustomPriceInput(e.target.value)}
                        placeholder={`Örn: ${lens.retailPrice}`}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                      />
                      {customPriceInput && (
                        <button
                          onClick={() => setCustomPriceInput('')}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Sıfırla
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Tahmini Net Kar</span>
                      <span className="text-base font-black text-emerald-700">
                        {formatCurrency(fin.profitAmount, lens.currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">Kar Marjı</span>
                      <span className="text-sm font-black text-emerald-700">
                        %{fin.profitMarginPercent}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add to Custom List Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              Özel Listeye veya Teklif Sepetine Ekle:
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
              >
                {customLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.items.length} cam)
                  </option>
                ))}
              </select>

              <button
                onClick={handleAdd}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Eklendi</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ekle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
