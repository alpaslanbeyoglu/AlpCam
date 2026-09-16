import React, { useState } from 'react';
import { Lens, LensCategory } from '../types';
import { normalizeBrandName, isContactLens } from '../utils/pricing';
import { X, Plus, Glasses, Eye } from 'lucide-react';

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

  const [productType, setProductType] = useState<'eyeglass_lens' | 'contact_lens'>('eyeglass_lens');
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

  // Contact lens specific fields
  const [baseCurve, setBaseCurve] = useState('8.6');
  const [diameter, setDiameter] = useState('14.2');
  const [boxContent, setBoxContent] = useState('6\'lı Kutu');
  const [wearPeriod, setWearPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [lensType, setLensType] = useState<'spheric' | 'toric' | 'multifocal' | 'color'>('spheric');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawBrand = brand === 'other' ? (customBrand.trim() || 'Özel Marka') : brand;
    const finalBrand = normalizeBrandName(rawBrand);
    if (!name.trim()) return;

    const newLens: Lens = {
      id: `custom-lens-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      brand: finalBrand,
      name: name.trim(),
      productType,
      category: productType === 'contact_lens' ? 'contact_lens' : category,
      index: productType === 'contact_lens' ? `BC ${baseCurve}` : index,
      material: material.trim(),
      coating: coating.trim(),
      wholesalePrice: Number(wholesalePrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      currency: 'TRY',
      sphRange: sphRange.trim(),
      cylMax: productType === 'contact_lens' && lensType !== 'toric' ? undefined : Number(cylMax) || 2.0,
      deliveryType,
      notes: notes.trim(),
      baseCurve: productType === 'contact_lens' ? baseCurve : undefined,
      diameter: productType === 'contact_lens' ? diameter : undefined,
      boxContent: productType === 'contact_lens' ? boxContent : undefined,
      wearPeriod: productType === 'contact_lens' ? wearPeriod : undefined,
      lensType: productType === 'contact_lens' ? lensType : undefined,
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
            <h3 className="font-bold text-sm text-slate-900">
              Kataloğa Yeni {productType === 'contact_lens' ? 'Kontakt Lens' : 'Gözlük Camı'} Ekle
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Type Selector Tabs */}
        <div className="px-4 pt-3 pb-1 border-b border-slate-100 bg-white">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setProductType('eyeglass_lens');
                setCategory('single_vision');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                productType === 'eyeglass_lens'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Glasses className="w-4 h-4" />
              <span>Gözlük Camı</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setProductType('contact_lens');
                setCategory('contact_lens');
                if (material === 'MR-8 Yüksek İndeks') setMaterial('Silikon Hidrojel');
                if (coating.includes('Antirefle')) setCoating('Nem Matriksi & UV Blokaj');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                productType === 'contact_lens'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Kontakt Lens</span>
            </button>
          </div>
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

            {brand === 'other' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Marka Adı</label>
                <input
                  type="text"
                  required
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder={productType === 'contact_lens' ? 'Örn: CooperVision, Alcon' : 'Örn: Seiko, Zeiss'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            ) : productType === 'eyeglass_lens' ? (
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
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temel Eğri (BC)</label>
                <input
                  type="text"
                  value={baseCurve}
                  onChange={(e) => setBaseCurve(e.target.value)}
                  placeholder="8.6"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Model Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {productType === 'contact_lens' ? 'Lens Model / Ürün Adı' : 'Cam / Model Adı'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={productType === 'contact_lens' ? 'Örn: Biofinity Aylık Lens (6\'lı Kutu)' : 'Örn: Ormix 1.60 Crizal Sapphire HR'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium"
            />
          </div>

          {/* Eyeglass Category OR Contact Lens Type */}
          {productType === 'eyeglass_lens' ? (
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
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lens Tipi</label>
                <select
                  value={lensType}
                  onChange={(e) => setLensType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white"
                >
                  <option value="spheric">Sferik (Numaralı)</option>
                  <option value="toric">Torik (Astigmatlı)</option>
                  <option value="multifocal">Multifokal (Uzak-Yakın)</option>
                  <option value="color">Renkli Lens</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kullanım Süresi</label>
                <select
                  value={wearPeriod}
                  onChange={(e) => setWearPeriod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white"
                >
                  <option value="daily">Günlük</option>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kutu İçeriği</label>
                <input
                  type="text"
                  value={boxContent}
                  onChange={(e) => setBoxContent(e.target.value)}
                  placeholder="6'lı Kutu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Coating & Material */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {productType === 'contact_lens' ? 'Özellik / Teknoloji' : 'Kaplama'}
              </label>
              <input
                type="text"
                value={coating}
                onChange={(e) => setCoating(e.target.value)}
                placeholder={productType === 'contact_lens' ? 'Örn: Aquaform, HydraGlyde' : 'Örn: Crizal Rock, DuraVision'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hammadde / Materyal</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder={productType === 'contact_lens' ? 'Örn: Comfilcon A %48 Su' : 'Örn: Organik CR-39, MR-8'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>
          </div>

          {/* TOPTAN & PERAKENDE FİYATLARI */}
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
                placeholder="-12.00 / +8.00"
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
              placeholder="Örn: Yüksek oksijen geçirgenliği, konforlu kullanım..."
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
              {productType === 'contact_lens' ? 'Lensi Kataloğa Ekle' : 'Camı Kataloğa Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
