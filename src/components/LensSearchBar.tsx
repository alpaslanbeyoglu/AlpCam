import React from 'react';
import { Search, X, Filter, Sparkles, SlidersHorizontal, ArrowUpDown, Eye, Glasses, Building2, Droplet } from 'lucide-react';
import { LensCategory, ProductType } from '../types';

interface LensSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  catalogSection: 'regular' | 'campaign';
  setCatalogSection: (section: 'regular' | 'campaign') => void;
  regularCount: number;
  campaignCount: number;
  selectedProductType: 'all' | 'eyeglass_lens' | 'contact_lens' | 'solution';
  setSelectedProductType: (val: 'all' | 'eyeglass_lens' | 'contact_lens' | 'solution') => void;
  eyeglassCount: number;
  contactLensCount: number;
  solutionCount: number;
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
  isAdmin?: boolean;
  onDeleteBrand?: (brand: string) => void;
  onDeleteDistributor?: (distributor: string) => void;
  onBulkPriceIncrease?: (percent: number, brand?: string) => void;
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
  catalogSection,
  setCatalogSection,
  regularCount,
  campaignCount,
  selectedProductType,
  setSelectedProductType,
  eyeglassCount,
  contactLensCount,
  solutionCount,
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
  isAdmin,
  onDeleteBrand,
  onDeleteDistributor,
  onBulkPriceIncrease,
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

  const [confirmDeleteBrand, setConfirmDeleteBrand] = React.useState<string | null>(null);
  const [confirmDeleteDist, setConfirmDeleteDist] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (confirmDeleteBrand) {
      const timer = setTimeout(() => setConfirmDeleteBrand(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteBrand]);

  React.useEffect(() => {
    if (confirmDeleteDist) {
      const timer = setTimeout(() => setConfirmDeleteDist(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteDist]);

  const activeCategories =
    selectedProductType === 'contact_lens' ? CONTACT_LENS_CATEGORIES : EYEGLASS_CATEGORIES;

  return (
    <div className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 sm:py-3 space-y-2">
      {/* 1. Catalog Section Toggle (Standart Liste vs Kampanyalı Ürünler) */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setCatalogSection('regular')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            catalogSection === 'regular'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Glasses className="w-3.5 h-3.5 text-blue-600" />
          <span>Standart Fiyat Listesi</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {regularCount}
          </span>
        </button>

        <button
          onClick={() => setCatalogSection('campaign')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            catalogSection === 'campaign'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-amber-700 bg-amber-50/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Kampanyalı Ürünler & Fırsatlar</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${catalogSection === 'campaign' ? 'bg-slate-950 text-amber-300' : 'bg-amber-100 text-amber-800'}`}>
            {campaignCount}
          </span>
        </button>
      </div>

      {/* 2. Search Input & Product Type & View Mode */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              selectedProductType === 'contact_lens'
                ? 'Lens adı, marka, BC, kutu ara...'
                : 'Cam adı, marka, dağıtıcı, ürün kodu ara...'
            }
            className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bulk Price Increase Button for Admin */}
        {isAdmin && onBulkPriceIncrease && (
          <button
            onClick={() => {
              const pctStr = prompt('Katalog fiyatlarına uygulanacak toplu zam yüzdesini girin (Örn: 10 veya 15):', '10');
              if (pctStr !== null) {
                const pct = parseFloat(pctStr);
                if (!isNaN(pct)) {
                  onBulkPriceIncrease(pct, selectedBrand);
                } else {
                  alert('Geçerli bir sayı girmelisiniz.');
                }
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 transition shadow-2xs shrink-0"
            title="Katalog fiyatlarına toplu zam uygula"
          >
            <span>📈 Toplu Zam</span>
          </button>
        )}

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
            showAdvanced || hasActiveFilters
              ? 'bg-sky-50 border-sky-300 text-sky-700'
              : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          title="Filtreler ve Dağıtıcı Firmalar"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtreler</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* 3. Product Type Tabs (Tümü, Gözlük Camları, Kontakt Lensler) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0">
          <button
            onClick={() => setSelectedProductType('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              selectedProductType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Tümü</span>
            <span className="px-1 py-0.2 rounded-full bg-slate-200/80 text-[9px] text-slate-700">
              {eyeglassCount + contactLensCount + solutionCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('eyeglass_lens')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              selectedProductType === 'eyeglass_lens'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <Glasses className="w-3.5 h-3.5 shrink-0" />
            <span>Gözlük Camları</span>
            <span className={`px-1 py-0.2 rounded-full text-[9px] ${selectedProductType === 'eyeglass_lens' ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
              {eyeglassCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('contact_lens')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              selectedProductType === 'contact_lens'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-teal-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>Kontakt Lensler</span>
            <span className={`px-1 py-0.2 rounded-full text-[9px] ${selectedProductType === 'contact_lens' ? 'bg-teal-700 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
              {contactLensCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('solution')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              selectedProductType === 'solution'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 shrink-0" />
            <span>Solüsyonlar</span>
            <span className={`px-1 py-0.2 rounded-full text-[9px] ${selectedProductType === 'solution' ? 'bg-purple-700 text-white' : 'bg-slate-200/80 text-slate-700'}`}>
              {solutionCount}
            </span>
          </button>
        </div>

        {/* View Mode (Cards vs Compact Table) */}
        <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              viewMode === 'cards' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-500'
            }`}
          >
            Kart
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
              viewMode === 'compact' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-500'
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* 4. Collapsible Advanced Filters & Distributors Panel (Non-Complex First Page) */}
      {showAdvanced && (
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              <span>Gelişmiş Filtreler ve Dağıtıcı Firmalar</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <span>Filtreleri Sıfırla</span>
              </button>
            )}
          </div>

          {/* Dağıtıcı / Firma Seçimi */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-600" />
              <span>Dağıtıcı / Üst Firma:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => {
                  setSelectedDistributor('all');
                  setSelectedBrand('all');
                  setSelectedIndex('all');
                  setSelectedCategory('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedDistributor === 'all'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50'
                }`}
              >
                Tüm Firmalar
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                    selectedDistributor === dist.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                  title={dist.name}
                >
                  <span>{dist.shortName || dist.name}</span>
                  <span className={`text-[10px] px-1.5 rounded-full font-mono ${selectedDistributor === dist.name ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {dist.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Marka Seçimi */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marka:</span>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedBrand === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tüm Markalar
              </button>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(selectedBrand === brand ? 'all' : brand)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedBrand === brand
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Index and Category Chips */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {selectedProductType !== 'contact_lens' && (
          <>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5 shrink-0">İndeks:</span>
            <button
              onClick={() => setSelectedIndex('all')}
              className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold whitespace-nowrap transition ${
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
                className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold whitespace-nowrap transition ${
                  selectedIndex === idx
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {idx}
              </button>
            ))}

            <span className="text-slate-300 mx-0.5 shrink-0">|</span>
          </>
        )}

        {/* Category Pills */}
        {activeCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold whitespace-nowrap transition ${
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
            <span className="font-semibold text-indigo-700">
              {' • Dağıtıcı: '}{selectedDistributor}
              {isAdmin && onDeleteDistributor && (
                <button
                  onClick={() => {
                    if (confirmDeleteDist !== selectedDistributor) {
                      setConfirmDeleteDist(selectedDistributor);
                      return;
                    }
                    setConfirmDeleteDist(null);
                    onDeleteDistributor(selectedDistributor);
                  }}
                  className={`ml-1.5 font-bold border rounded px-1.5 py-0.2 text-[10px] inline-flex items-center transition ${
                    confirmDeleteDist === selectedDistributor
                      ? 'border-rose-400 bg-rose-600 text-white animate-pulse'
                      : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                  title={confirmDeleteDist === selectedDistributor ? 'Silmek için tekrar tıklayın' : 'Tüm ürünlerini sil'}
                >
                  {confirmDeleteDist === selectedDistributor ? 'Emin misiniz?' : 'Firmayı Sil'}
                </button>
              )}
            </span>
          )}
          {selectedBrand !== 'all' && (
            <span className="font-semibold text-slate-700">
              {' • '}{selectedBrand}
              {isAdmin && onDeleteBrand && (
                <button
                  onClick={() => {
                    if (confirmDeleteBrand !== selectedBrand) {
                      setConfirmDeleteBrand(selectedBrand);
                      return;
                    }
                    setConfirmDeleteBrand(null);
                    onDeleteBrand(selectedBrand);
                  }}
                  className={`ml-1.5 font-bold border rounded px-1.5 py-0.2 text-[10px] inline-flex items-center transition ${
                    confirmDeleteBrand === selectedBrand
                      ? 'border-rose-400 bg-rose-600 text-white animate-pulse'
                      : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                  title={confirmDeleteBrand === selectedBrand ? 'Silmek için tekrar tıklayın' : 'Tüm ürünlerini sil'}
                >
                  {confirmDeleteBrand === selectedBrand ? 'Emin misiniz?' : 'Markayı Sil'}
                </button>
              )}
            </span>
          )}
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
