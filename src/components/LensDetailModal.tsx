import React, { useState } from 'react';
import { Lens, BrandDiscount, CustomList } from '../types';
import { calculateLensFinancials, formatCurrency, getCampaignDetails } from '../utils/pricing';
import { parseCostFromCode } from '../utils/costCodeParser';
import { X, Sparkles, Plus, Check, ShieldCheck, CheckCircle2, Sliders, Eye, Glasses, Package, Building2, ExternalLink, Trash2, Edit2, Save, Tag, Barcode } from 'lucide-react';
import { getDistributorForBrand, getDistributorInfo } from '../data/distributors';

interface LensDetailModalProps {
  lens: Lens | null;
  onClose: () => void;
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  isCustomerMode: boolean;
  customLists: CustomList[];
  catalog?: Lens[];
  onAddToList: (lens: Lens, listId: string, customPrice?: number) => void;
  isAdmin?: boolean;
  onDeleteLens?: (lensId: string) => void;
  onUpdateLens?: (updatedLens: Lens) => void;
}

export const LensDetailModal: React.FC<LensDetailModalProps> = ({
  lens,
  onClose,
  brandDiscounts,
  pairCount,
  isCustomerMode,
  customLists,
  catalog,
  onAddToList,
  isAdmin,
  onDeleteLens,
  onUpdateLens,
}) => {
  const [selectedListId, setSelectedListId] = useState<string>(
    customLists[0]?.id || ''
  );
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editing States for Admin Corrections
  const [isEditing, setIsEditing] = useState(false);
  const [editBrand, setEditBrand] = useState(lens.brand || '');
  const [editName, setEditName] = useState(lens.name || '');
  const [editProductType, setEditProductType] = useState(lens.productType || 'eyeglass_lens');
  const [editCategory, setEditCategory] = useState(lens.category || 'single_vision');
  const [editIndex, setEditIndex] = useState(lens.index || '');
  const [editMaterial, setEditMaterial] = useState(lens.material || '');
  const [editCoating, setEditCoating] = useState(lens.coating || '');
  const [editWholesalePrice, setEditWholesalePrice] = useState(String(lens.wholesalePrice || 0));
  const [editRetailPrice, setEditRetailPrice] = useState(String(lens.retailPrice || 0));
  const [editCurrency, setEditCurrency] = useState(lens.currency || 'TRY');
  const [editSphRange, setEditSphRange] = useState(lens.sphRange || '');
  const [editCylMax, setEditCylMax] = useState(String(lens.cylMax || ''));
  const [editDiameter, setEditDiameter] = useState(lens.diameter || '');
  const [editBaseCurve, setEditBaseCurve] = useState(lens.baseCurve || '');
  const [editBoxContent, setEditBoxContent] = useState(lens.boxContent || '');
  const [editWearPeriod, setEditWearPeriod] = useState(lens.wearPeriod || 'monthly');
  const [editLensType, setEditLensType] = useState(lens.lensType || 'spheric');
  const [editDeliveryType, setEditDeliveryType] = useState(lens.deliveryType || 'stock');
  const [editNotes, setEditNotes] = useState(lens.notes || '');
  const [editDistributor, setEditDistributor] = useState(lens.distributor || '');
  const [editProductCode, setEditProductCode] = useState(lens.productCode || '');

  React.useEffect(() => {
    if (showDeleteConfirm) {
      const timer = setTimeout(() => setShowDeleteConfirm(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showDeleteConfirm]);

  // Synchronize edit form states if lens changes
  React.useEffect(() => {
    setEditBrand(lens.brand || '');
    setEditName(lens.name || '');
    setEditProductType(lens.productType || 'eyeglass_lens');
    setEditCategory(lens.category || 'single_vision');
    setEditIndex(lens.index || '');
    setEditMaterial(lens.material || '');
    setEditCoating(lens.coating || '');
    setEditWholesalePrice(String(lens.wholesalePrice || 0));
    setEditRetailPrice(String(lens.retailPrice || 0));
    setEditCurrency(lens.currency || 'TRY');
    setEditSphRange(lens.sphRange || '');
    setEditCylMax(String(lens.cylMax || ''));
    setEditDiameter(lens.diameter || '');
    setEditBaseCurve(lens.baseCurve || '');
    setEditBoxContent(lens.boxContent || '');
    setEditWearPeriod(lens.wearPeriod || 'monthly');
    setEditLensType(lens.lensType || 'spheric');
    setEditDeliveryType(lens.deliveryType || 'stock');
    setEditNotes(lens.notes || '');
    setEditDistributor(lens.distributor || '');
    setEditProductCode(lens.productCode || '');
    setIsEditing(false);
  }, [lens]);

  const handleSave = () => {
    if (!onUpdateLens) return;
    const updated: Lens = {
      ...lens,
      brand: editBrand.trim(),
      name: editName.trim(),
      productCode: editProductCode.trim() || undefined,
      productType: editProductType as any,
      category: editCategory as any,
      index: editIndex.trim(),
      material: editMaterial.trim(),
      coating: editCoating.trim(),
      wholesalePrice: parseFloat(editWholesalePrice) || 0,
      retailPrice: parseFloat(editRetailPrice) || 0,
      currency: editCurrency as any,
      sphRange: editSphRange.trim() || undefined,
      cylMax: editCylMax ? parseFloat(editCylMax) : undefined,
      diameter: editDiameter.trim() || undefined,
      baseCurve: editBaseCurve.trim() || undefined,
      boxContent: editBoxContent.trim() || undefined,
      wearPeriod: editWearPeriod as any,
      lensType: editLensType as any,
      deliveryType: editDeliveryType as any,
      notes: editNotes.trim() || undefined,
      distributor: editDistributor.trim() || undefined,
    };
    onUpdateLens(updated);
    setIsEditing(false);
  };

  const customPrice = customPriceInput ? parseFloat(customPriceInput) : undefined;
  const fin = calculateLensFinancials(lens, brandDiscounts, pairCount, customPrice);
  const campaign = getCampaignDetails(lens, pairCount, catalog);
  const isZeroPriceCampaign = campaign.isCampaign && (fin.retailPrice <= 0 || !lens.retailPrice || lens.retailPrice === 0);
  const previewCodeCost = editProductCode ? parseCostFromCode(editProductCode) : null;
  const isContact = isEditing ? (editProductType === 'contact_lens') : (lens.productType === 'contact_lens');
  const distributorName = isEditing ? editDistributor : (lens.distributor || getDistributorForBrand(lens.brand, lens.name));
  const distributorInfo = distributorName ? getDistributorInfo(distributorName) : undefined;

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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
              {lens.brand}
            </span>

            {distributorName && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  distributorInfo?.badgeColor || 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}
                title={`Üst Dağıtıcı / Distribütör: ${distributorName}`}
              >
                <Building2 className="w-3 h-3" />
                <span>{distributorInfo?.shortName || distributorName}</span>
              </span>
            )}

            {isContact ? (
              <>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Kontakt Lens</span>
                </span>
                {lens.wearPeriod && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {lens.wearPeriod}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                  <Glasses className="w-3.5 h-3.5" />
                  <span>Gözlük Camı</span>
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {lens.index} İndeks
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && onUpdateLens && (
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isEditing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                }`}
                title={isEditing ? 'Kataloğa Değişiklikleri Kaydet' : 'Özellikleri Düzenle'}
              >
                {isEditing ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Kaydet</span>
                  </>
                ) : (
                  <>
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Düzenle</span>
                  </>
                )}
              </button>
            )}

            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                İptal
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition shrink-0"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[75vh]">
          {isEditing ? (
            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3">
                <p className="font-bold">Yönetici Düzeltme Modu</p>
                <p className="text-[11px] opacity-90 mt-0.5">AI dosya taramasında veya veri ayrıştırmada oluşabilecek hataları buradan elle düzeltebilirsiniz.</p>
              </div>

              {/* Ürün Türü & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Ürün Türü</label>
                  <select
                    value={editProductType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setEditProductType(val);
                      if (val === 'contact_lens') {
                        setEditCategory('contact_lens');
                      } else {
                        setEditCategory('single_vision');
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="eyeglass_lens">Gözlük Camı</option>
                    <option value="contact_lens">Kontakt Lens</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cam/Lens Tipi (Kategori)</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                  >
                    {editProductType === 'contact_lens' ? (
                      <option value="contact_lens">Kontakt Lens</option>
                    ) : (
                      <>
                        <option value="single_vision">Tek Odaklı (Single Vision)</option>
                        <option value="progressive">Progresif (Uzak-Yakın)</option>
                        <option value="office">Ofis / Dijital</option>
                        <option value="bifocal">Bifokal</option>
                        <option value="photochromic">Fotokromik (Colormatic)</option>
                        <option value="sun_polarized">Güneş / Polarize</option>
                        <option value="drive">Sürüş Camı</option>
                        <option value="custom_rx">Özel Üretim (RX)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Marka & Dağıtıcı Firma */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Marka</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    placeholder="örn: Shamir, Essilor, Zeiss"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Distribütör / Toptancı</label>
                  <input
                    type="text"
                    value={editDistributor}
                    onChange={(e) => setEditDistributor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    placeholder="örn: Opak Optik, Beta Optik"
                  />
                </div>
              </div>

              {/* Cam Adı */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ürün Tam Adı</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  placeholder="örn: 1.60 PixAR Clean Orma"
                />
              </div>

              {/* Ürün Kodu / Fiyat Listesi Maliyet Kodu */}
              <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>Ürün Kodu (Fiyat Listesindeki Gizli/Açık Maliyet Kodu)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">JLM01337-50, SO077L vb.</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editProductCode}
                    onChange={(e) => setEditProductCode(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-white font-mono text-xs font-semibold focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                    placeholder="örn: JLM01337-50 veya SO077L"
                  />
                  {previewCodeCost && previewCodeCost.parsedCost ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (previewCodeCost.parsedCost) {
                          setEditWholesalePrice(String(previewCodeCost.parsedCost));
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0"
                      title="Koddan çözümlenen maliyeti toptan fiyata aktar"
                    >
                      <span>Maliyete Aktar ({formatCurrency(previewCodeCost.parsedCost, editCurrency)})</span>
                    </button>
                  ) : null}
                </div>
                {previewCodeCost && previewCodeCost.parsedCost ? (
                  <p className="text-[10px] text-amber-300 font-medium">
                    ✓ Koddan Algılanan Maliyet: {formatCurrency(previewCodeCost.parsedCost, editCurrency)} ({previewCodeCost.patternDescription})
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400">
                    Fiyat listelerinde ürünle aynı sırada yer alan kodlar otomatik toptan alış maliyeti olarak çözümlenir.
                  </p>
                )}
              </div>

              {/* Fiyatlar ve Para Birimi */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Toptan Fiyatı (Maliyet)</label>
                  <input
                    type="number"
                    value={editWholesalePrice}
                    onChange={(e) => setEditWholesalePrice(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-slate-800 bg-white font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Perakende Fiyatı (Satış)</label>
                  <input
                    type="number"
                    value={editRetailPrice}
                    onChange={(e) => setEditRetailPrice(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-slate-300 text-slate-800 bg-white font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Para Birimi</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white font-semibold"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              {/* İndeks & Materyal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {editProductType === 'contact_lens' ? 'Temel Eğri (BC)' : 'Kırılma İndeksi (İncelik)'}
                  </label>
                  <input
                    type="text"
                    value={editIndex}
                    onChange={(e) => setEditIndex(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    placeholder={editProductType === 'contact_lens' ? 'örn: 8.6, 8.4' : 'örn: 1.50, 1.60, 1.67'}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Hammadde / Materyal</label>
                  <input
                    type="text"
                    value={editMaterial}
                    onChange={(e) => setEditMaterial(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    placeholder="örn: MR-8, Organik, Silikon Hidrojel"
                  />
                </div>
              </div>

              {/* Kaplama & Diyoptri Aralığı */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kaplama / Teknoloji</label>
                  <input
                    type="text"
                    value={editCoating}
                    onChange={(e) => setEditCoating(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    placeholder="örn: Antirefle, Crizal Sapphire"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sferik Diyoptri Aralığı (SPH)</label>
                  <input
                    type="text"
                    value={editSphRange}
                    onChange={(e) => setEditSphRange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    placeholder="örn: -6.00 / +6.00"
                  />
                </div>
              </div>

              {/* Teslimat Sınıfı & Kısıtlamalar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Stok / Reçete (Teslimat)</label>
                  <select
                    value={editDeliveryType}
                    onChange={(e) => setEditDeliveryType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="stock">Stok (Aynı Gün)</option>
                    <option value="rx">RX Reçete (Özel Üretim)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {editProductType === 'contact_lens' ? 'Değişim Sıklığı' : 'Maks Silindirik Limit (CYL)'}
                  </label>
                  {editProductType === 'contact_lens' ? (
                    <select
                      value={editWearPeriod}
                      onChange={(e) => setEditWearPeriod(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    >
                      <option value="daily">Günlük Kullanım (Daily)</option>
                      <option value="fortnightly">15 Günlük (Fortnightly)</option>
                      <option value="monthly">Aylık Kullanım (Monthly)</option>
                      <option value="yearly">Yıllık Kullanım (Yearly)</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={editCylMax}
                      onChange={(e) => setEditCylMax(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                      placeholder="örn: 2.00, 4.00"
                      step="0.25"
                    />
                  )}
                </div>
              </div>

              {editProductType === 'contact_lens' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kutu İçeriği / Ambalaj</label>
                    <input
                      type="text"
                      value={editBoxContent}
                      onChange={(e) => setEditBoxContent(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                      placeholder="örn: 6 Adet Kutu"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kontakt Lens Tasarımı</label>
                    <select
                      value={editLensType}
                      onChange={(e) => setEditLensType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                    >
                      <option value="spheric">Sferik (Klasik)</option>
                      <option value="toric">Torik (Astigmatlı)</option>
                      <option value="multifocal">Multifokal (Uzak-Yakın)</option>
                      <option value="color">Renkli Kozmetik</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Açıklama / Notlar</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white h-16 resize-none focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  placeholder="Ürüne dair özel optisyen açıklamaları..."
                />
              </div>

              {/* Save / Cancel buttons block */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Katalog Güncellemesini Kaydet</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title and features */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {lens.name}
                </h2>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-sky-50 border border-sky-100 p-2 rounded-xl">
                  {isContact ? (
                    <>
                      <Package className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{lens.boxContent || 'Kutu İçi: 6 Adet'} • {lens.material || 'Silikon Hidrojel'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{lens.coating}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Campaign Information & Regular Price Comparison Card */}
              {campaign.isCampaign && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-2 border-amber-400 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span>{campaign.campaignTitle}</span>
                    </div>
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      %{campaign.discountPercent} Avantaj
                    </span>
                  </div>

                  {/* Ait Olduğu Markanın Normal Liste Eşleşmesi */}
                  <div className="bg-white/95 p-2.5 rounded-xl border border-amber-200/90 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Ait Olduğu Markanın Normal Liste Eşleşmesi:</span>
                      {campaign.matchedSource === 'catalog_match' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 border border-emerald-200">
                          <Check className="w-3 h-3" /> PFL Listesinden Çekildi
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium text-[10px]">Standart Katalog Fiyatı</span>
                      )}
                    </div>
                    <div className="font-bold text-slate-800 text-xs">
                      {campaign.matchedRegularName || `${lens.brand} Normal Liste Karşılığı`}
                    </div>
                  </div>

                  {/* Perakende Satış Fiyatı Karşılaştırması */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/80">
                    <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Normal Liste Satış (PFL)</span>
                      <span className="text-sm font-bold text-slate-400 line-through">
                        {formatCurrency(campaign.regularRetailPrice, lens.currency)}
                      </span>
                    </div>
                    <div className="bg-amber-500/15 p-2.5 rounded-xl border border-amber-400/80 shadow-2xs">
                      <span className="text-amber-800 block text-[10px] font-bold uppercase">Kampanyalı Satış Fiyatı</span>
                      <span className="text-sm font-black text-amber-700">
                        {formatCurrency(fin.retailPrice, lens.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Optisyen Toptan Alış Fiyatı Karşılaştırması (Müşteri Modunda Değilken) */}
                  {!isCustomerMode && campaign.regularWholesalePrice && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60">
                      <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">Normal Liste Toptan</span>
                        <span className="text-xs font-bold text-slate-400 line-through">
                          {formatCurrency(campaign.regularWholesalePrice, lens.currency)}
                        </span>
                      </div>
                      <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                        <span className="text-emerald-800 block text-[10px] font-bold uppercase">Kampanyalı Net Alış</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-black text-emerald-700">
                            {formatCurrency(fin.netWholesaleCost, lens.currency)}
                          </span>
                          {campaign.wholesaleSavingsAmount ? (
                            <span className="text-[10px] text-emerald-800 font-bold">
                              +{formatCurrency(campaign.wholesaleSavingsAmount, lens.currency)} Kazanç
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-amber-950 px-0.5 pt-0.5 font-medium flex-wrap gap-1">
                    <span>Geçerlilik: <strong className="text-amber-900">{campaign.campaignPeriod}</strong></span>
                    <span className="text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300">
                      Müşteri Tasarrufu: {formatCurrency(campaign.savingsAmount, lens.currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Distributor / Parent Company Card */}
              {distributorName && (
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-950 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Dağıtıcı / Distribütör Üst Firma</span>
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                      {distributorInfo?.country || 'Türkiye'}
                    </span>
                  </div>
                  <p className="text-indigo-900 font-medium">
                    {distributorInfo?.name || distributorName}
                  </p>
                  {distributorInfo?.description && (
                    <p className="text-indigo-700/80 text-[11px] mt-0.5">
                      {distributorInfo.description}
                    </p>
                  )}
                  {distributorInfo?.brands && distributorInfo.brands.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-indigo-200/60 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-semibold text-indigo-800">Grup / Dağıtılan Markalar:</span>
                      {distributorInfo.brands.map((b) => (
                        <span
                          key={b}
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            b.toLowerCase() === lens.brand.toLowerCase()
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-white text-indigo-900 border border-indigo-200'
                          }`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ürün / Liste Kodu Analizi (Cost Code Analysis - Yalnızca Optisyen Görünümünde) */}
              {!isCustomerMode && (lens.productCode || fin.isCostFromCode) && (
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-3.5 border border-slate-800 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold">
                        <Barcode className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Fiyat Listesi Ürün / Maliyet Kodu</span>
                        <span className="font-mono text-sm font-bold text-white tracking-wide">{lens.productCode || fin.codeCostResult?.rawCode}</span>
                      </div>
                    </div>
                    {fin.isCostFromCode && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        Koddan Çözümlendi
                      </span>
                    )}
                  </div>

                  {fin.isCostFromCode && (
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Otomatik Hesaplanmış Toptan Alış:</span>
                        <span className="text-sm font-black text-amber-400">
                          {formatCurrency(fin.codeCostResult?.parsedCost || fin.netWholesaleCost, lens.currency)}
                        </span>
                      </div>
                      <div className="text-right max-w-[65%]">
                        <span className="text-[10px] text-slate-400 block">Şablon Açıklaması:</span>
                        <span className="text-[11px] text-slate-300 font-medium leading-tight block">
                          {fin.codeCostResult?.patternDescription || 'Fiyat listesi kod sütunu kuralı'}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    💡 Fiyat listelerinde ürünün aynın sırasında yazan kodlar (örneğin J&J JLM... formatı veya SO...L gibi optik cam kodları) optisyenin gerçek toptan maliyetidir ve karlılık hesabına yansıtılır.
                  </p>
                </div>
              )}

              {/* Technical Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {isContact ? (
                  <>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Kullanım Süresi</span>
                      <span className="font-semibold text-slate-800">{lens.wearPeriod || 'Aylık'}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Kutu Ambalajı</span>
                      <span className="font-semibold text-slate-800">{lens.boxContent || '6 Adet / Kutu'}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Temel Eğri (BC)</span>
                      <span className="font-semibold text-slate-800">{lens.baseCurve ? `${lens.baseCurve} mm` : '8.60 mm'}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Çap (DIA)</span>
                      <span className="font-semibold text-slate-800">{lens.diameter ? `${lens.diameter} mm` : '14.20 mm'}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Diyoptri Sferik (SPH)</span>
                      <span className="font-semibold text-slate-800">{lens.sphRange || '-0.50 / -10.00'}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Materyal / Su Oranı</span>
                      <span className="font-semibold text-slate-800">{lens.material || '%48 Su / Silikon Hidrojel'}</span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                  <span>
                    {isContact
                      ? pairCount === 2
                        ? '2 Kutu Lens Fiyat Özeti'
                        : '1 Kutu Lens Fiyat Özeti'
                      : pairCount === 2
                      ? 'Çift Cam (2x) Fiyat Özeti'
                      : 'Tek Cam (1x) Fiyat Özeti'}
                  </span>
                  {!isCustomerMode && (
                    <span className="text-emerald-400 font-bold">
                      Net Kar: %{fin.profitMarginPercent}
                    </span>
                  )}
                </div>

                <div className="p-3.5 space-y-3 bg-white">
                  {isZeroPriceCampaign ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-amber-950 font-extrabold text-sm">
                        <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                        <span>{campaign.campaignTitle || 'Özel Kampanya Paket Koşulları'}</span>
                      </div>
                      <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        {lens.notes || `Bu kampanyalı ürün için liste fiyatı tanımlanmamış olup, sadece kampanya koşulları ve paket detayları geçerlidir.`}
                      </p>
                      <div className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block border border-amber-200">
                        Geçerlilik: {campaign.campaignPeriod || '01.06.2026 - 31.10.2026'}
                      </div>
                    </div>
                  ) : isCustomerMode ? (
                    /* Customer mode */
                    <div className="text-center py-2 space-y-1">
                      <span className="text-xs text-slate-500 font-medium">Tavsiye Edilen Satış Fiyatı</span>
                      <div className="text-3xl font-black text-slate-900">
                        {formatCurrency(fin.retailPrice, lens.currency)}
                      </div>
                      <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block font-semibold">
                        KDV Dahil • Orijinal Barkodlu Ürün
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
                        {list.name} ({list.items.length} ürün)
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

                  {isAdmin && onDeleteLens && (
                    <button
                      onClick={() => {
                        if (!showDeleteConfirm) {
                          setShowDeleteConfirm(true);
                          return;
                        }
                        setShowDeleteConfirm(false);
                        onDeleteLens(lens.id);
                        onClose();
                      }}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        showDeleteConfirm
                          ? 'border-rose-400 bg-rose-600 text-white animate-pulse'
                          : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                      title={showDeleteConfirm ? 'Silmek için tekrar tıklayın' : 'Katalogdan Sil'}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{showDeleteConfirm ? 'Emin misiniz?' : 'Katalogdan Sil'}</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
