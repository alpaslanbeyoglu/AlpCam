import React, { useState, useEffect } from 'react';
import { DistributorInfo, DISTRIBUTORS_LIST } from '../data/distributors';
import { loadStoredDistributors, saveStoredDistributors } from '../utils/storage';
import { Building2, Plus, Edit2, Trash2, Save, X, Search, Globe, Shield, CheckCircle2, Layers, Tag } from 'lucide-react';

interface DefinitionsViewProps {
  isAdmin: boolean;
  showToast: (msg: string) => void;
}

export const DefinitionsView: React.FC<DefinitionsViewProps> = ({ isAdmin, showToast }) => {
  const [distributors, setDistributors] = useState<DistributorInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentDistId, setCurrentDistId] = useState<string | null>(null);

  // Form fields for create/edit
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const [brandsInput, setBrandsInput] = useState('');
  const [productType, setProductType] = useState<'all' | 'eyeglass_lens' | 'contact_lens'>('all');
  const [country, setCountry] = useState('Türkiye');
  const [website, setWebsite] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  useEffect(() => {
    const loaded = loadStoredDistributors();
    setDistributors(loaded);
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md mx-auto space-y-4 shadow-sm">
          <Shield className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-amber-900">Yönetici Yetkisi Gerekli</h2>
          <p className="text-xs text-amber-700">
            Firmalar, markalar ve hiyerarşik yapı tanımları sayfasına erişmek için üst menüden yönetici girişi yapmalısınız.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenNew = () => {
    setCurrentDistId(null);
    setName('');
    setShortName('');
    setDescription('');
    setBrandsInput('');
    setProductType('all');
    setCountry('Türkiye');
    setWebsite('');
    setContactInfo('');
    setIsEditing(true);
  };

  const handleOpenEdit = (dist: DistributorInfo) => {
    setCurrentDistId(dist.id);
    setName(dist.name);
    setShortName(dist.shortName || dist.name);
    setDescription(dist.description || '');
    setBrandsInput(dist.brands ? dist.brands.join(', ') : '');
    setProductType(dist.productType || 'all');
    setCountry(dist.country || 'Türkiye');
    setWebsite(dist.website || '');
    setContactInfo(dist.contactInfo || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Firma / Dağıtıcı adı boş olamaz.');
      return;
    }

    const brandList = brandsInput
      .split(',')
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const newDist: DistributorInfo = {
      id: currentDistId || `dist_${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim() || name.trim(),
      description: description.trim(),
      brands: brandList.length > 0 ? brandList : [name.trim()],
      productType,
      country: country.trim() || 'Türkiye',
      website: website.trim() || undefined,
      contactInfo: contactInfo.trim() || undefined,
      badgeStyle: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-200',
        accent: '#4f46e5',
      },
    };

    let updated: DistributorInfo[];
    if (currentDistId) {
      updated = distributors.map((d) => (d.id === currentDistId ? newDist : d));
      showToast(`"${newDist.name}" bilgileri başarıyla güncellendi.`);
    } else {
      updated = [newDist, ...distributors];
      showToast(`"${newDist.name}" yeni firma olarak sisteme eklendi.`);
    }

    setDistributors(updated);
    saveStoredDistributors(updated);
    setIsEditing(false);
  };

  const handleDelete = (id: string, distName: string) => {
    if (window.confirm(`"${distName}" adlı firmayı ve bağlı marka hiyerarşisini silmek istediğinize emin misiniz?`)) {
      const updated = distributors.filter((d) => d.id !== id);
      setDistributors(updated);
      saveStoredDistributors(updated);
      showToast(`"${distName}" sistemden kaldırıldı.`);
    }
  };

  const filteredDistributors = distributors.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.shortName?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.brands.some((b) => b.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-300">
              <Layers className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Firma ve Marka Hiyerarşi Tanımları
            </h1>
          </div>
          <p className="text-sm text-slate-300 max-w-2xl">
            Optik sektöründeki dağıtıcı üst firmaları, bu firmaların temsil ettiği markaları ve ürün hiyerarşilerini buradan yönetebilir, yeni firmalar ekleyebilir ve düzenleyebilirsiniz.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Üst Firma / Dağıtıcı Ekle</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Firma adı, kısa ad, açıklama veya marka ara..."
          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg bg-slate-100"
          >
            Temizle
          </button>
        )}
      </div>

      {/* Grid of Distributors / Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDistributors.map((dist) => (
          <div
            key={dist.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <h3 className="text-base font-bold text-slate-900">{dist.name}</h3>
                  </div>
                  {dist.shortName && dist.shortName !== dist.name && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                      {dist.shortName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {dist.country || 'Türkiye'}
                  </span>
                </div>
              </div>

              {dist.description && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {dist.description}
                </p>
              )}

              {/* Brands Hierarchy Pill Tags */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  <span>Bağlı Markalar ({dist.brands.length})</span>
                  <span>
                    {dist.productType === 'contact_lens'
                      ? 'Kontakt Lens'
                      : dist.productType === 'eyeglass_lens'
                      ? 'Gözlük Camı'
                      : 'Genel Optik'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                  {dist.brands.map((b) => (
                    <span
                      key={b}
                      className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200/80 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-indigo-500" />
                      <span>{b}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID: {dist.id}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(dist)}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Düzenle</span>
                </button>
                <button
                  onClick={() => handleDelete(dist.id, dist.name)}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sil</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDistributors.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Aramanıza uygun firma bulunamadı</h3>
          <p className="text-xs text-slate-500">Farklı anahtar kelimeler deneyebilir veya yeni bir üst firma ekleyebilirsiniz.</p>
        </div>
      )}

      {/* Edit / Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold">
                  {currentDistId ? 'Firma ve Marka Tanımını Düzenle' : 'Yeni Üst Firma / Dağıtıcı Ekle'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Firma / Üst Kurum Adı *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="örn: Merve Optik / HOYA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kısa İsim (Etiket)</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="örn: Merve Optik"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ürün Grubu</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 bg-white font-medium"
                  >
                    <option value="all">Genel Optik (Cam & Lens)</option>
                    <option value="eyeglass_lens">Gözlük Camı</option>
                    <option value="contact_lens">Kontakt Lens</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Menşei / Ülke</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="örn: Türkiye / Japonya"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bünyesindeki Markalar (Hiyerarşi - virgülle ayırın) *
                </label>
                <textarea
                  value={brandsInput}
                  onChange={(e) => setBrandsInput(e.target.value)}
                  placeholder="örn: Hoya, Seiko, BlueControl, Sensity, Hilux"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Bu firmaya bağlı markalar, katalogdaki camlar ve fiyat listeleri taranırken otomatik olarak bu firma ile ilişkilendirilir.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Firma Açıklaması ve Bilgi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Firma hakkında dağıtım portföyü ve açıklamalar..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium h-20 resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Web Sitesi</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="örn: https://www.hoya.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">İletişim / Destek Bilgisi</label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="örn: 0212 555 4433"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
