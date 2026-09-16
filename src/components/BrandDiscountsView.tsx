import React, { useState } from 'react';
import { BrandDiscount } from '../types';
import { calculateCompoundDiscountRate, formatCurrency } from '../utils/pricing';
import { Sliders, Plus, Trash2, Check, RotateCcw, HelpCircle, ArrowRight } from 'lucide-react';
import { INITIAL_DISCOUNTS } from '../data/initialDiscounts';

interface BrandDiscountsViewProps {
  discounts: BrandDiscount[];
  onSaveDiscounts: (updated: BrandDiscount[]) => void;
  availableBrands: string[];
}

export const BrandDiscountsView: React.FC<BrandDiscountsViewProps> = ({
  discounts,
  onSaveDiscounts,
  availableBrands,
}) => {
  const [discountList, setDiscountList] = useState<BrandDiscount[]>(discounts);
  const [newBrandName, setNewBrandName] = useState('');
  const [newDiscount1, setNewDiscount1] = useState(40);
  const [newDiscount2, setNewDiscount2] = useState(0);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleUpdate = (
    index: number,
    field: 'discount1' | 'discount2',
    val: number
  ) => {
    const next = [...discountList];
    next[index] = {
      ...next[index],
      [field]: Math.max(0, Math.min(100, val)),
    };
    setDiscountList(next);
    onSaveDiscounts(next);
    triggerSaved();
  };

  const handleRemove = (index: number) => {
    const next = discountList.filter((_, i) => i !== index);
    setDiscountList(next);
    onSaveDiscounts(next);
    triggerSaved();
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    // Check if brand already exists
    const exists = discountList.some(
      (b) => b.brand.toLowerCase() === newBrandName.trim().toLowerCase()
    );
    if (exists) {
      alert('Bu marka zaten iskontolar listenizde mevcut!');
      return;
    }

    const next: BrandDiscount[] = [
      ...discountList,
      {
        brand: newBrandName.trim(),
        discount1: Number(newDiscount1) || 0,
        discount2: Number(newDiscount2) || 0,
      },
    ];

    setDiscountList(next);
    onSaveDiscounts(next);
    setNewBrandName('');
    setNewDiscount1(40);
    setNewDiscount2(0);
    triggerSaved();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Tüm marka iskontolarını varsayılan ayarlara sıfırlamak istiyor musunuz?')) {
      setDiscountList(INITIAL_DISCOUNTS);
      onSaveDiscounts(INITIAL_DISCOUNTS);
      triggerSaved();
    }
  };

  const triggerSaved = () => {
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header and explanation */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Marka Özel İskonto Tanımları
              </h2>
              <p className="text-xs text-slate-500">
                Distribütör ve depolarla anlaştığınız toptan alış iskontolarınızı girin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSavedNotice && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                Kaydedildi
              </span>
            )}
            <button
              onClick={handleResetDefaults}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Dön</span>
            </button>
          </div>
        </div>

        {/* Compound Discount Helper */}
        <div className="bg-sky-50/70 border border-sky-200 text-sky-900 p-3 rounded-xl text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Kademeli (Basamaklı) İskonto Desteği:</span>
          </div>
          <p className="text-sky-800 text-[11px] leading-relaxed">
            Optik sektöründe yaygın olan <strong>%40 + %10</strong> veya <strong>%50 + %5</strong> gibi çift kademeli iskontolar otomatik olarak hesaplanır. (Ör: 40+10 iskonto = 1.000 ₺ toptan liste cam için net maliyet 540 ₺ olur, efektif iskonto %46.0'dır).
          </p>
        </div>
      </div>

      {/* Brand Discounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Tanımlı Markalar ({discountList.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Değişiklikler anında tüm kataloğa uygulanır
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {discountList.map((item, index) => {
            const effective = calculateCompoundDiscountRate(item.discount1, item.discount2);
            // Sample calculation for a 1000 TL lens
            const sampleCost = Math.round(1000 * (1 - effective / 100));

            return (
              <div
                key={item.brand}
                className="p-3 sm:p-4 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Brand Name & Preview */}
                <div className="sm:w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.brand}</span>
                    <span className="text-xs font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                      Net: -%{effective}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>1.000 ₺ toptan</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-slate-800">{sampleCost} ₺ net alış</span>
                  </div>
                </div>

                {/* Discount Inputs */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Primary Discount */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 font-medium">1. İskonto %:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount1}
                      onChange={(e) => handleUpdate(index, 'discount1', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-center text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <span className="text-slate-400 font-bold text-xs">+</span>

                  {/* Secondary Discount */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 font-medium">2. Kademe %:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount2 || 0}
                      onChange={(e) => handleUpdate(index, 'discount2', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 text-center text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-auto sm:ml-2"
                    title="Markayı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Brand Form */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-sky-600" />
          <span>Yeni Marka İskontosu Ekle</span>
        </h3>

        <form onSubmit={handleAddBrand} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Marka Adı
            </label>
            <input
              type="text"
              required
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Örn: Hawk, Rodenstock, BBGR..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              1. İskonto (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={newDiscount1}
              onChange={(e) => setNewDiscount1(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              2. Kademeli İskonto (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={newDiscount2}
              onChange={(e) => setNewDiscount2(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Markayı Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
