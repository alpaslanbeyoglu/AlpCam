import React from 'react';
import { Search, X, Filter, Sparkles, SlidersHorizontal, ArrowUpDown, Eye, Glasses, Building2 } from 'lucide-react';
import { LensCategory, ProductType } from '../types';

interface LensSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedProductType: 'all' | 'eyeglass_lens' | 'contact_lens';
  setSelectedProductType: (val: 'all' | 'eyeglass_lens' | 'contact_lens') => void;
  eyeglassCount: number;
  contactLensCount: number;
  selectedDistributor?: string;
  setSelectedDistributor?: (dist: string) => void;
  availableDistributors?: { name: string; shortName: string; count: number }[];
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  availableBrands?: string[];
  selectedIndex: string;
  setSelectedIndex: (idx: string) => void;
  availableIndices?: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedDelivery: 'all' | 'stock' | 'rx';
  setSelectedDelivery: (val: 'all' | 'stock' | 'rx') => void;
  sortBy: 'price_asc' | 'price_desc' | 'name_asc' | 'index_asc';
  setSortBy: (val: 'price_asc' | 'price_desc' | 'name_asc' | 'index_asc') => void;
  viewMode: 'cards' | 'compact';
  setViewMode: (mode: 'cards' | 'compact') => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  sphCheck: string;
  setSphCheck: (val: string) => void;
  cylCheck: string;
  setCylCheck: (val: string) => void;
  totalMatches: number;
  onResetFilters: () => void;
}

const EYEGLASS_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tüm Cam Tipleri' },
  { id: 'single_vision', label: 'Tek Odaklı' },
  { id: 'progressive', label: 'Progresif' },
  { id: 'office', label: 'Ofis / Dijital' },
  { id: 'bifocal', label: 'Bifokal' },
  { id: 'photochromic', label: 'Fotokromik' },
  { id: 'sun_polarized', label: 'Güneş / Polarize' },
  { id: 'drive', label: 'Sürüş Camı' },
];

const CONTACT_LENS_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tüm Lens Tipleri' },
  { id: 'single_vision', label: 'Sferik Lensler' },
  { id: 'custom_rx', label: 'Torik (Astigmatlı)' },
  { id: 'progressive', label: 'Multifokal (Uzak-Yakın)' },
  { id: 'photochromic', label: 'Renkli Kozmetik' },
];

export const LensSearchBar: React.FC<LensSearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedProductType,
  setSelectedProductType,
  eyeglassCount,
  contactLensCount,
  selectedDistributor = 'all',
  setSelectedDistributor = (_dist: string) => {},
  availableDistributors = [],
  selectedBrand,
  setSelectedBrand,
  availableBrands = [],
  selectedIndex,
  setSelectedIndex,
  availableIndices = [],
  selectedCategory,
  setSelectedCategory,
  selectedDelivery,
  setSelectedDelivery,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  showAdvanced,
  setShowAdvanced,
  sphCheck,
  setSphCheck,
  cylCheck,
  setCylCheck,
  totalMatches,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedProductType !== 'all' ||
    selectedDistributor !== 'all' ||
    selectedBrand !== 'all' ||
    selectedIndex !== 'all' ||
    selectedCategory !== 'all' ||
    selectedDelivery !== 'all' ||
    sphCheck !== '' ||
    cylCheck !== '';

  const activeCategories =
    selectedProductType === 'contact_lens' ? CONTACT_LENS_CATEGORIES : EYEGLASS_CATEGORIES;

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-3 space-y-2.5">
      {/* Top Product Type Separation Tabs (Cam vs Kontakt Lens) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setSelectedProductType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedProductType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Tüm Ürünler</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 text-[10px] text-slate-700">
              {eyeglassCount + contactLensCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('eyeglass_lens')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedProductType === 'eyeglass_lens'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <Glasses className="w-3.5 h-3.5" />
            <span>Gözlük Camları</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedProductType === 'eyeglass_lens'
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {eyeglassCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('contact_lens')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedProductType === 'contact_lens'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-teal-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Kontakt Lensler</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedProductType === 'contact_lens'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {contactLensCount}
            </span>
          </button>
        </div>

        {/* View Mode (Cards vs Compact Table) */}
        <div className="hidden xs:flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'cards' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Kart Görünümü"
          >
            <span className="text-xs font-semibold px-1">Kart</span>
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'compact' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Kompakt Liste"
          >
            <span className="text-xs font-semibold px-1">Liste</span>
          </button>
        </div>
      </div>

      {/* Search Input and Advanced Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              selectedProductType === 'contact_lens'
                ? 'Kontakt lens adı, marka, dağıtıcı (Lens Medikal, CooperVision, Opsa), BC, kutu ara...'
                : 'Cam veya lens adı, marka, dağıtıcı (HOYA/Seiko, Beta Optik, Zeiss, Lens Medikal), indeks ara...'
            }
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced Filter Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
            showAdvanced || (sphCheck || cylCheck)
              ? 'bg-sky-50 border-sky-300 text-sky-700'
              : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          title="Gelişmiş Numara ve Sıralama Filtreleri"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtreler</span>
        </button>
      </div>

      {/* ÜST DAĞITICI / DİSTRİBÜTÖR FİRMALAR (Lens Medikal, HOYA & Seiko, Beta Optik, Zeiss, Opsa vb.) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 bg-slate-50/70 p-1.5 rounded-xl border border-slate-200/60">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1 flex items-center gap-1 whitespace-nowrap">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Dağıtıcı / Üst Firma:</span>
        </span>
        <button
          onClick={() => {
            setSelectedDistributor('all');
            setSelectedBrand('all');
            setSelectedIndex('all');
            setSelectedCategory('all');
          }}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
            selectedDistributor === 'all'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Tüm Dağıtıcılar
        </button>
        {availableDistributors.map((dist) => (
          <button
            key={dist.name}
            onClick={() => {
              setSelectedDistributor(selectedDistributor === dist.name ? 'all' : dist.name);
              setSelectedBrand('all');
              setSelectedIndex('all');
              setSelectedCategory('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
              selectedDistributor === dist.name
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-indigo-50 hover:text-indigo-900 hover:border-indigo-200'
            }`}
            title={dist.name}
          >
            <span>{dist.shortName || dist.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedDistributor === dist.name
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {dist.count}
            </span>
          </button>
        ))}
      </div>

      {/* Brand Chips Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Marka:</span>
        <button
          onClick={() => setSelectedBrand('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedBrand === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tümü
        </button>
        {availableBrands.map((brand) => (
          <button
            key={brand}
            onClick={() => setSelectedBrand(selectedBrand === brand ? 'all' : brand)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedBrand === brand
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Index and Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {selectedProductType !== 'contact_lens' && (
          <>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">İndeks:</span>
            <button
              onClick={() => setSelectedIndex('all')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                selectedIndex === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tümü
            </button>
            {availableIndices.map((idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                  selectedIndex === idx
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {idx}
              </button>
            ))}

            <span className="text-slate-300 mx-1">|</span>
          </>
        )}

        {/* Category Pills */}
        {activeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Advanced Diopter & Sorting Panel */}
      {showAdvanced && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          {/* SPH Check */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Reçete Sferik (SPH)
            </label>
            <input
              type="text"
              value={sphCheck}
              onChange={(e) => setSphCheck(e.target.value)}
              placeholder="Örn: -3.50 veya +2.00"
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs"
            />
          </div>

          {/* CYL Check */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Reçete Silindirik (CYL)
            </label>
            <input
              type="text"
              value={cylCheck}
              onChange={(e) => setCylCheck(e.target.value)}
              placeholder="Örn: -1.75 veya 2.00"
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs"
            />
          </div>

          {/* Delivery Type (Stok vs RX) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Teslimat Durumu
            </label>
            <select
              value={selectedDelivery}
              onChange={(e) => setSelectedDelivery(e.target.value as 'all' | 'stock' | 'rx')}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs"
            >
              <option value="all">Tümü (Stok + RX)</option>
              <option value="stock">Yalnızca Stok (Aynı Gün)</option>
              <option value="rx">Yalnızca RX (Özel Üretim)</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Sıralama
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs"
            >
              <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
              <option value="index_asc">İndeks (İncelik): Artan</option>
              <option value="name_asc">İsim (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count and Active Filter Reset */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
        <div>
          <span>{totalMatches} ürün listeleniyor</span>
          {selectedProductType === 'eyeglass_lens' && (
            <span className="font-semibold text-blue-700"> • Sadece Gözlük Camları</span>
          )}
          {selectedProductType === 'contact_lens' && (
            <span className="font-semibold text-teal-700"> • Sadece Kontakt Lensler</span>
          )}
          {selectedDistributor !== 'all' && (
            <span className="font-semibold text-indigo-700"> • Dağıtıcı: {selectedDistributor}</span>
          )}
          {selectedBrand !== 'all' && <span className="font-semibold text-slate-700"> • {selectedBrand}</span>}
          {selectedIndex !== 'all' && <span className="font-semibold text-slate-700"> • {selectedIndex} İndeks</span>}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Filtreleri Sıfırla</span>
          </button>
        )}
      </div>
    </div>
  );
};
