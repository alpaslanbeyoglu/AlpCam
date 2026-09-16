import React, { useState } from 'react';
import { Lens, LensCategory } from '../types';
import { X, Plus, Sparkles } from 'lucide-react';

interface AddLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLens: (lens: Lens) => void;
  existingBrands: string[];
}

export const AddLensModal: React.FC<AddLensModalProps> = ({
  isOpen,
  onClose,
  onAddLens,
  existingBrands,
}) => {
  if (!isOpen) return null;

  const [brand, setBrand] = useState(existingBrands[0] || 'Essilor');
  const [customBrand, setCustomBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LensCategory>('single_vision');
  const [index, setIndex] = useState('1.60');
  const [material, setMaterial] = useState('MR-8 Yüksek İndeks');
  const [coating, setCoating] = useState('Süper Antirefle + Mavi Işık Koruma');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>(1000);
  const [retailPrice, setRetailPrice] = useState<number | ''>(2800);
  const [sphRange, setSphRange] = useState('-6.00 / +4.00');
  const [cylMax, setCylMax] = useState(2.0);
  const [deliveryType, setDeliveryType] = useState<'stock' | 'rx'>('stock');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrand = brand === 'other' ? (customBrand.trim() || 'Özel Marka') : brand;
    if (!name.trim()) return;

    const newLens: Lens = {
      id: `custom-lens-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      brand: finalBrand,
      name: name.trim(),
      category,
      index,
      material: material.trim(),
      coating: coating.trim(),
      wholesalePrice: Number(wholesalePrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      currency: 'TRY',
      sphRange: sphRange.trim(),
      cylMax: Number(cylMax) || 2.0,
      deliveryType,
      notes: notes.trim(),
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    onAddLens(newLens);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Kataloğa Yeni Cam Ekle</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-xs">
          {/* Brand */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Marka</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white"
              >
                {existingBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="other">+ Farklı Bir Marka Gir</option>
              </select>
            </div>

            {brand === 'other' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Marka Adı</label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Örn: Rodenstock"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kırılma İndeksi</label>
              <select
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white"
              >
                <option value="1.50">1.50 (Standart Organik)</option>
                <option value="1.53">1.53 (Trivex - Kırılmaz)</option>
                <option value="1.56">1.56 (Orta İndeks)</option>
                <option value="1.59">1.59 (Polikarbon)</option>
                <option value="1.60">1.60 (%30 İnce MR-8)</option>
                <option value="1.67">1.67 (%40 Süper İnce)</option>
                <option value="1.74">1.74 (%50 Ultra İnce)</option>
              </select>
            </div>
          </div>

          {/* Model Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cam / Model Adı</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ormix 1.60 Crizal Sapphire HR veya DriveSafe 1.60"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
            />
          </div>

          {/* Category & Delivery */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cam Tipi / Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LensCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white"
              >
                <option value="single_vision">Tek Odaklı (Uzak / Yakın)</option>
                <option value="progressive">Progresif (Çok Odaklı)</option>
                <option value="office">Ofis / Bilgisayar</option>
                <option value="bifocal">Bifokal (Çift Odaklı)</option>
                <option value="photochromic">Fotokromik (Transitions)</option>
                <option value="sun_polarized">Güneş / Polarize</option>
                <option value="drive">Sürüş Camı</option>
                <option value="custom_rx">Özel Üretim RX</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teslimat Durumu</label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as 'stock' | 'rx')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white"
              >
                <option value="stock">Stok Cam (Aynı Gün)</option>
                <option value="rx">RX Özel Üretim (3-5 İş Günü)</option>
              </select>
            </div>
          </div>

          {/* Coating & Material */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kaplama</label>
              <input
                type="text"
                value={coating}
                onChange={(e) => setCoating(e.target.value)}
                placeholder="Örn: Crizal Rock, DuraVision, BlueBlock"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hammadde</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Örn: Organik CR-39, MR-8, Polikarbon"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* TOPTAN & PERAKENDE FİYATLARI (ÇOK ÖNEMLİ) */}
          <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-200 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Toptan Liste Fiyatı (₺)
              </label>
              <input
                type="number"
                required
                min="0"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Örn: 850"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Depo liste alış fiyatı</span>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Tavsiye Perakende Fiyat (₺)
              </label>
              <input
                type="number"
                required
                min="0"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Örn: 2400"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-emerald-700 bg-white"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Müşteri satış fiyatı</span>
            </div>
          </div>

          {/* Spherical & Cylindrical */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diyoptri Aralığı (SPH)</label>
              <input
                type="text"
                value={sphRange}
                onChange={(e) => setSphRange(e.target.value)}
                placeholder="-6.00 / +4.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maksimum Silindirik (CYL)</label>
              <input
                type="number"
                step="0.25"
                value={cylMax}
                onChange={(e) => setCylMax(Number(e.target.value))}
                placeholder="2.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Optisyen Açıklaması / Not</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Geniş kanal, garantili kaplama..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
            >
              Camı Kataloğa Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
