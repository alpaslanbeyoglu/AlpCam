import React from 'react';
import { Search, X, Filter, Sparkles, SlidersHorizontal, ArrowUpDown, Eye, Glasses, Building2, Droplet, LayoutGrid, List, Table2 } from 'lucide-react';
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
  viewMode: 'cards' | 'compact' | 'matrix';
  setViewMode: (mode: 'cards' | 'compact' | 'matrix') => void;
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
  { id: 'all', label: 'Tüm Odaklar' },
  { id: 'single_vision', label: 'Tek Odaklı (Single)' },
  { id: 'progressive', label: 'Çok Odaklı (Multi/Prog)' },
  { id: 'office', label: 'Ofis / Dijital' },
  { id: 'bifocal', label: 'Bifokal' },
  { id: 'photochromic', label: 'Fotokromik (Transitions)' },
  { id: 'sun_polarized', label: 'Güneş / Polarize' },
  { id: 'drive', label: 'Sürüş Camı' },
];

const CONTACT_LENS_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tüm Lensler' },
  { id: 'transparent', label: 'Şeffaf Lens' },
  { id: 'color', label: 'Renkli Lens' },
  { id: 'spheric', label: 'Normal (Sferik)' },
  { id: 'toric', label: 'Astigmat (Torik)' },
  { id: 'multifocal', label: 'Uzak-Yakın (Odaklı)' },
];

const SOLUTION_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tüm Solüsyonlar' },
  { id: 'multi_purpose', label: 'Çok Amaçlı' },
  { id: 'hydrogen_peroxide', label: 'Peroksit Sistemler' },
  { id: 'dry_eye', label: 'Göz Kuruluğu / Suni Gözyaşı' },
  { id: 'hard_lens', label: 'Sert Lens Bakım' },
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
    selectedProductType === 'contact_lens' 
      ? CONTACT_LENS_CATEGORIES 
      : selectedProductType === 'solution' 
      ? SOLUTION_CATEGORIES 
      : EYEGLASS_CATEGORIES;

  return (
    <div className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 sm:py-3 space-y-3">
      {/* 1. Product Type Selection (Top Level Context) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 shrink-0">
          <button
            onClick={() => setSelectedProductType('eyeglass_lens')}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition flex items-center gap-2 border ${
              selectedProductType === 'eyeglass_lens'
                ? 'bg-white text-blue-700 border-blue-200 shadow-sm'
                : 'text-slate-600 border-transparent hover:bg-white/50'
            }`}
          >
            <Glasses className="w-4 h-4" />
            <span>Gözlük Camları</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedProductType === 'eyeglass_lens' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
              {eyeglassCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('contact_lens')}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition flex items-center gap-2 border ${
              selectedProductType === 'contact_lens'
                ? 'bg-white text-teal-700 border-teal-200 shadow-sm'
                : 'text-slate-600 border-transparent hover:bg-white/50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Kontakt Lens</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedProductType === 'contact_lens' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>
              {contactLensCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedProductType('solution')}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition flex items-center gap-2 border ${
              selectedProductType === 'solution'
                ? 'bg-white text-purple-700 border-purple-200 shadow-sm'
                : 'text-slate-600 border-transparent hover:bg-white/50'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Solüsyonlar</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedProductType === 'solution' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
              {solutionCount}
            </span>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'cards' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
            title="Kart Görünümü"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'compact' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
            title="Liste Görünümü"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`p-1.5 rounded-lg transition ${viewMode === 'matrix' ? 'bg-amber-500 text-slate-950 shadow-sm font-bold' : 'text-slate-400 hover:bg-slate-50'}`}
            title="Katalog Fiyat Matrisi (2D Tablo Görünümü)"
          >
            <Table2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Catalog Section Toggle (Standart Liste vs Kampanyalı Ürünler) */}
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

      {/* 2. Search Input & Primary Filters Toggle */}
      <div className="flex items-center gap-2">
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
                ? 'Lens adı, marka, BC, renk, özellik ara...'
                : selectedProductType === 'solution'
                ? 'Solüsyon adı, özellik, tip ara...'
                : 'Cam adı, kaplama, özellik, ürün kodu ara...'
            }
            className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-100 border-none text-slate-900 placeholder:text-slate-400 text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition shadow-inner"
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

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
            showAdvanced || hasActiveFilters
              ? 'bg-sky-600 border-sky-600 text-white shadow-md'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Gelişmiş</span>
          {hasActiveFilters && (
            <span className={`w-2 h-2 rounded-full animate-pulse ${showAdvanced ? 'bg-white' : 'bg-sky-600'}`}></span>
          )}
        </button>
      </div>

      {/* 3. Main Hierarchical Filter Row (Marka, Stok/RX, Odak, Index) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* Brand Dropdown (Prominent in Hierarchy) */}
        <div className="shrink-0 min-w-[120px]">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold border transition ${
              selectedBrand !== 'all' 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <option value="all">Tüm Markalar</option>
            {availableBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {selectedProductType === 'eyeglass_lens' && (
          <div className="shrink-0">
            <select
              value={selectedDelivery}
              onChange={(e) => setSelectedDelivery(e.target.value as any)}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition ${
                selectedDelivery !== 'all' 
                  ? 'bg-sky-700 text-white border-sky-700' 
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <option value="all">Stok/RX</option>
              <option value="stock">Stok</option>
              <option value="rx">RX</option>
            </select>
          </div>
        )}

        <div className="h-4 w-[1px] bg-slate-200 mx-1 shrink-0" />

        {/* Category/Odak Chips */}
        <div className="flex items-center gap-1 shrink-0">
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {selectedProductType === 'eyeglass_lens' && availableIndices.length > 0 && (
          <>
            <div className="h-4 w-[1px] bg-slate-200 mx-1 shrink-0" />
            <div className="flex items-center gap-1 shrink-0">
              {availableIndices.map((idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx === selectedIndex ? 'all' : idx)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition border ${
                    selectedIndex === idx
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {idx}n
                </button>
              ))}
            </div>
          </>
        )}
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

          {/* Marka Seçimi (Only shown here if product type is 'all' or something else, but we moved it up) */}
          {selectedProductType === 'all' && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marka Seçimi:</span>
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
          )}
        </div>
      )}


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
