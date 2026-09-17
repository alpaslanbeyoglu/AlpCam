/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Lens, BrandDiscount, CustomList, DriveSyncConfig } from './types';
import { INITIAL_LENSES } from './data/initialLenses';
import { INITIAL_DISCOUNTS } from './data/initialDiscounts';
import {
  loadStoredLenses,
  saveStoredLenses,
  loadStoredDiscounts,
  saveStoredDiscounts,
  loadStoredCustomLists,
  saveStoredCustomLists,
  loadStoredDriveConfig,
  saveStoredDriveConfig,
  loadCustomerMode,
  saveCustomerMode,
  loadPairCount,
  savePairCount,
  loadAdminPin,
  saveAdminPin,
  loadIsAdminSession,
  saveIsAdminSession,
} from './utils/storage';
import { fetchFromDriveUrl, parseExcelOrCsvData } from './utils/driveSync';
import { sanitizeLens, setGlobalExchangeRates } from './utils/pricing';
import { getDistributorForBrand, getDistributorInfo } from './data/distributors';

// Components
import { Navbar } from './components/Navbar';
import { LensSearchBar } from './components/LensSearchBar';
import { LensCard } from './components/LensCard';
import { LensCompactRow } from './components/LensCompactRow';
import { LensDetailModal } from './components/LensDetailModal';
import { BrandDiscountsView } from './components/BrandDiscountsView';
import { CustomListsView } from './components/CustomListsView';
import { DriveSyncView } from './components/DriveSyncView';
import { AddLensModal } from './components/AddLensModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { useExchangeRates } from './hooks/useExchangeRates';

import {
  Plus,
  Sparkles,
  Cloud,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  FolderHeart,
  Search,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    'catalog' | 'custom_lists' | 'discounts' | 'drive_sync'
  >('catalog');

  // Core Data
  const [lenses, setLenses] = useState<Lens[]>(() => loadStoredLenses());
  const [brandDiscounts, setBrandDiscounts] = useState<BrandDiscount[]>(() => loadStoredDiscounts());
  const [customLists, setCustomLists] = useState<CustomList[]>(() => loadStoredCustomLists());
  const [driveConfig, setDriveConfig] = useState<DriveSyncConfig>(() => loadStoredDriveConfig());

  // App Settings
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(() => loadCustomerMode());
  const [pairCount, setPairCount] = useState<1 | 2>(() => loadPairCount());

  // Administrator Role & PIN
  const [adminPin, setAdminPin] = useState<string>(() => loadAdminPin());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadIsAdminSession());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<'all' | 'eyeglass_lens' | 'contact_lens'>('all');
  const [selectedDistributor, setSelectedDistributor] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<'all' | 'stock' | 'rx'>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc' | 'index_asc'>('price_asc');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sphCheck, setSphCheck] = useState('');
  const [cylCheck, setCylCheck] = useState('');

  // Modals & Feedback
  const [detailLens, setDetailLens] = useState<Lens | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDriveWorking, setIsDriveWorking] = useState(false);
  const [driveWorkingText, setDriveWorkingText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const exchangeRates = useExchangeRates();

  useEffect(() => {
    if (!exchangeRates.loading) {
      setGlobalExchangeRates({ EUR: exchangeRates.EUR, USD: exchangeRates.USD });
    }
  }, [exchangeRates]);

  // Persistence Effects
  useEffect(() => {
    saveStoredLenses(lenses);
  }, [lenses]);

  useEffect(() => {
    saveStoredDiscounts(brandDiscounts);
  }, [brandDiscounts]);

  useEffect(() => {
    saveStoredCustomLists(customLists);
  }, [customLists]);

  useEffect(() => {
    saveStoredDriveConfig(driveConfig);
  }, [driveConfig]);

  useEffect(() => {
    saveCustomerMode(isCustomerMode);
  }, [isCustomerMode]);

  useEffect(() => {
    savePairCount(pairCount);
  }, [pairCount]);

  useEffect(() => {
    saveAdminPin(adminPin);
  }, [adminPin]);

  useEffect(() => {
    saveIsAdminSession(isAdmin);
  }, [isAdmin]);

  // Auto-sync on startup if enabled
  useEffect(() => {
    if (driveConfig.autoSyncOnLoad && driveConfig.sourceUrl) {
      handleDriveAutoSync();
    }
  }, []);

  const handleDriveAutoSync = async () => {
    if (!driveConfig.sourceUrl) return;

    // Folders cannot be parsed as a single tabular sheet
    const isFolder = driveConfig.sourceUrl.includes('/folders/') || driveConfig.sourceType === 'drive_folder';
    if (isFolder) {
      return;
    }

    setIsSyncing(true);
    try {
      const buffer = await fetchFromDriveUrl(driveConfig.sourceUrl);
      const res = parseExcelOrCsvData(buffer);
      if (res.success && res.lenses.length > 0) {
        setLenses(res.lenses);
        setDriveConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toISOString(),
          lastSyncItemCount: res.lenses.length,
        }));
        showToast(`Google Drive'dan ${res.lenses.length} ürün otomatik güncellendi`);
      }
    } catch (err: any) {
      console.warn('Auto sync skipped/unavailable:', err?.message || err);
    } finally {
      setIsSyncing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Available brands and indices from current lenses based on active product type
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    lenses.forEach((l) => {
      const sanitized = sanitizeLens(l);
      if (selectedProductType === 'eyeglass_lens' && sanitized.productType === 'contact_lens') return;
      if (selectedProductType === 'contact_lens' && sanitized.productType !== 'contact_lens') return;
      
      // Filter by selected distributor
      if (selectedDistributor !== 'all') {
        const dist = sanitized.distributor || getDistributorForBrand(sanitized.brand, sanitized.name);
        if (
          !dist.toLowerCase().includes(selectedDistributor.toLowerCase()) &&
          !selectedDistributor.toLowerCase().includes(dist.toLowerCase())
        ) {
          return;
        }
      }

      if (sanitized.brand) set.add(sanitized.brand.trim());
    });
    return Array.from(set).sort();
  }, [lenses, selectedProductType, selectedDistributor]);

  const availableDistributors = useMemo(() => {
    const map = new Map<string, { name: string; shortName: string; count: number }>();
    lenses.forEach((l) => {
      const sanitized = sanitizeLens(l);
      if (selectedProductType === 'eyeglass_lens' && sanitized.productType === 'contact_lens') return;
      if (selectedProductType === 'contact_lens' && sanitized.productType !== 'contact_lens') return;
      const dist = sanitized.distributor || getDistributorForBrand(sanitized.brand, sanitized.name);
      if (dist && dist !== 'Genel Dağıtım') {
        const info = getDistributorInfo(dist);
        const name = info?.name || dist;
        const shortName = info?.shortName || dist;
        const existing = map.get(name);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(name, { name, shortName, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [lenses, selectedProductType]);

  const availableIndices = useMemo(() => {
    const set = new Set<string>();
    lenses.forEach((l) => {
      const sanitized = sanitizeLens(l);
      if (selectedProductType === 'eyeglass_lens' && sanitized.productType === 'contact_lens') return;
      if (selectedProductType === 'contact_lens' && sanitized.productType !== 'contact_lens') return;

      // Filter by selected distributor
      if (selectedDistributor !== 'all') {
        const dist = sanitized.distributor || getDistributorForBrand(sanitized.brand, sanitized.name);
        if (
          !dist.toLowerCase().includes(selectedDistributor.toLowerCase()) &&
          !selectedDistributor.toLowerCase().includes(dist.toLowerCase())
        ) {
          return;
        }
      }

      // Filter by selected brand
      if (selectedBrand !== 'all') {
        if (sanitized.brand.trim().toLowerCase() !== selectedBrand.trim().toLowerCase()) {
          return;
        }
      }

      if (sanitized.index && !sanitized.index.startsWith('BC')) {
        set.add(sanitized.index.trim());
      }
    });
    return Array.from(set).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [lenses, selectedProductType, selectedDistributor, selectedBrand]);

  const handleProductTypeChange = (val: 'all' | 'eyeglass_lens' | 'contact_lens') => {
    setSelectedProductType(val);
    setSelectedDistributor('all');
    setSelectedBrand('all');
    setSelectedIndex('all');
    setSelectedCategory('all');
  };

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    if (brand !== 'all') {
      const match = lenses.find(l => {
        const sanitized = sanitizeLens(l);
        return sanitized.brand && sanitized.brand.trim().toLowerCase() === brand.trim().toLowerCase();
      });
      if (match) {
        const sanitized = sanitizeLens(match);
        if (sanitized.productType === 'contact_lens') {
          setSelectedProductType('contact_lens');
        } else {
          setSelectedProductType('eyeglass_lens');
        }
      }
    } else if (selectedDistributor === 'all') {
      setSelectedProductType('all');
    }
    setSelectedIndex('all');
    setSelectedCategory('all');
  };

  const handleDistributorChange = (distributor: string) => {
    setSelectedDistributor(distributor);
    if (distributor !== 'all') {
      const match = lenses.find(l => {
        const sanitized = sanitizeLens(l);
        const dist = sanitized.distributor || getDistributorForBrand(sanitized.brand, sanitized.name);
        return dist && (dist.toLowerCase().includes(distributor.toLowerCase()) || distributor.toLowerCase().includes(dist.toLowerCase()));
      });
      if (match) {
        const sanitized = sanitizeLens(match);
        if (sanitized.productType === 'contact_lens') {
          setSelectedProductType('contact_lens');
        } else {
          setSelectedProductType('eyeglass_lens');
        }
      }
    } else if (selectedBrand === 'all') {
      setSelectedProductType('all');
    }
    setSelectedBrand('all');
    setSelectedIndex('all');
    setSelectedCategory('all');
  };

  const eyeglassCount = useMemo(
    () => lenses.filter((l) => sanitizeLens(l).productType !== 'contact_lens').length,
    [lenses]
  );
  const contactLensCount = useMemo(
    () => lenses.filter((l) => sanitizeLens(l).productType === 'contact_lens').length,
    [lenses]
  );

  // Fast filter & search algorithm
  const filteredLenses = useMemo(() => {
    return lenses
      .map(sanitizeLens)
      .filter((lens) => {
        // 0. Product Type (eyeglass_lens vs contact_lens)
        if (selectedProductType === 'eyeglass_lens' && lens.productType === 'contact_lens') {
          return false;
        }
        if (selectedProductType === 'contact_lens' && lens.productType !== 'contact_lens') {
          return false;
        }

        // 1. Text Search (multi-term search)
        if (searchTerm.trim()) {
          const queryTerms = searchTerm.toLowerCase().trim().split(/\s+/);
          const targetString = `${lens.brand} ${lens.name} ${lens.index || ''} ${lens.coating || ''} ${lens.material || ''} ${lens.notes || ''} ${lens.wearPeriod || ''} ${lens.baseCurve || ''} ${lens.diameter || ''} ${lens.boxContent || ''}`.toLowerCase();
          const matchesAllTerms = queryTerms.every((term) => targetString.includes(term));
          if (!matchesAllTerms) return false;
        }

        // 1.5 Distributor
        if (selectedDistributor !== 'all') {
          const lensDist = lens.distributor || getDistributorForBrand(lens.brand, lens.name);
          const matchDist =
            lensDist.toLowerCase().includes(selectedDistributor.toLowerCase()) ||
            selectedDistributor.toLowerCase().includes(lensDist.toLowerCase());
          if (!matchDist) return false;
        }

        // 2. Brand
        if (selectedBrand !== 'all') {
          if (lens.brand.trim().toLowerCase() !== selectedBrand.trim().toLowerCase()) {
            return false;
          }
        }

        // 3. Index
        if (selectedIndex !== 'all') {
          if (lens.index.trim() !== selectedIndex.trim()) {
            return false;
          }
        }

        // 4. Category
        if (selectedCategory !== 'all') {
          if (selectedProductType === 'contact_lens') {
            if (selectedCategory === 'single_vision' && lens.lensType && lens.lensType !== 'spheric') return false;
            if (selectedCategory === 'custom_rx' && lens.lensType && lens.lensType !== 'toric') return false;
            if (selectedCategory === 'progressive' && lens.lensType && lens.lensType !== 'multifocal') return false;
            if (selectedCategory === 'photochromic' && lens.lensType && lens.lensType !== 'color') return false;
          } else {
            if (lens.category !== selectedCategory) {
              return false;
            }
          }
        }

        // 5. Delivery type (Stock vs RX)
        if (selectedDelivery !== 'all') {
          if (lens.deliveryType !== selectedDelivery) {
            return false;
          }
        }

        // 6. SPH range check
        if (sphCheck.trim() && lens.sphRange) {
          const sphNum = parseFloat(sphCheck.replace(',', '.'));
          if (!isNaN(sphNum)) {
            // Parse e.g. "-6.00 / +4.00"
            const parts = lens.sphRange.match(/([+-]?\d+(?:\.\d+)?)/g);
            if (parts && parts.length >= 2) {
              const min = parseFloat(parts[0]);
              const max = parseFloat(parts[1]);
              const realMin = Math.min(min, max);
              const realMax = Math.max(min, max);
              if (sphNum < realMin || sphNum > realMax) {
                return false;
              }
            }
          }
        }

        // 7. CYL check
        if (cylCheck.trim() && lens.cylMax !== undefined) {
          const cylNum = Math.abs(parseFloat(cylCheck.replace(',', '.')));
          if (!isNaN(cylNum)) {
            if (cylNum > lens.cylMax) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return a.retailPrice - b.retailPrice;
        }
        if (sortBy === 'price_desc') {
          return b.retailPrice - a.retailPrice;
        }
        if (sortBy === 'index_asc') {
          return (parseFloat(a.index) || 0) - (parseFloat(b.index) || 0);
        }
        return a.name.localeCompare(b.name, 'tr');
      });
  }, [
    lenses,
    searchTerm,
    selectedProductType,
    selectedDistributor,
    selectedBrand,
    selectedIndex,
    selectedCategory,
    selectedDelivery,
    sortBy,
    sphCheck,
    cylCheck,
    exchangeRates,
  ]);

  // Add to active custom list
  const handleAddToList = (lens: Lens, targetListId?: string, customPrice?: number) => {
    let listId = targetListId;
    let currentLists = [...customLists];

    if (currentLists.length === 0) {
      const defaultList: CustomList = {
        id: `list-${Date.now()}`,
        name: 'Yeni Liste',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
      };
      currentLists.push(defaultList);
      listId = defaultList.id;
    } else if (!listId) {
      listId = currentLists[0].id;
    }

    const updatedLists = currentLists.map((list) => {
      if (list.id === listId) {
        const newItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          lensId: lens.id,
          lensSnapshot: lens,
          quantity: pairCount,
          customRetailPrice: customPrice,
        };
        return {
          ...list,
          items: [...list.items, newItem],
          updatedAt: new Date().toISOString(),
        };
      }
      return list;
    });

    setCustomLists(updatedLists);
    showToast(`"${lens.name}" listeye eklendi`);
  };

  const handleUpdateLenses = (newLenses: Lens[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setLenses(newLenses);
    } else {
      // Merge unique by name, but update prices if TFL/PFL lists are mixed
      const mergedMap = new Map<string, Lens>();
      
      // First, add all existing lenses
      lenses.forEach((l) => mergedMap.set(l.name.toLowerCase().trim(), l));

      // Then process new lenses
      newLenses.forEach((newLens) => {
        const key = newLens.name.toLowerCase().trim();
        const existing = mergedMap.get(key);
        
        if (existing) {
          // If the lens exists, intelligently merge the pricing
          const updated = { ...existing };
          
          // TFL/Toptan sets wholesalePrice
          if (newLens.sourceListType === 'toptan' || newLens.wholesalePrice > 0) {
            updated.wholesalePrice = newLens.wholesalePrice > 0 ? newLens.wholesalePrice : updated.wholesalePrice;
          }
          // PFL/Perakende sets retailPrice
          if (newLens.sourceListType === 'perakende' || newLens.retailPrice > 0) {
            updated.retailPrice = newLens.retailPrice > 0 ? newLens.retailPrice : updated.retailPrice;
          }
          
          mergedMap.set(key, updated);
        } else {
          // It's a brand new lens
          mergedMap.set(key, newLens);
        }
      });

      setLenses(Array.from(mergedMap.values()));
    }
  };

  const handleResetCatalog = () => {
    setLenses([]);
    showToast('Katalogdaki tüm veriler başarıyla temizlendi');
  };

  const handleDeleteLens = (lensId: string) => {
    setLenses((prev) => prev.filter((l) => l.id !== lensId));
    showToast('Ürün katalogdan başarıyla kaldırıldı.');
  };

  const handleDeleteBrand = (brandName: string) => {
    const brandLower = brandName.trim().toLowerCase();
    setLenses((prev) => prev.filter((l) => l.brand.trim().toLowerCase() !== brandLower));
    setSelectedBrand('all');
    showToast(`"${brandName}" markası ve tüm ürünleri silindi.`);
  };

  const handleDeleteDistributor = (distributorName: string) => {
    const distLower = distributorName.trim().toLowerCase();
    setLenses((prev) => prev.filter((l) => (l.distributor || '').trim().toLowerCase() !== distLower));
    setSelectedDistributor('all');
    showToast(`"${distributorName}" firması ve tüm ürünleri silindi.`);
  };

  const activeList = customLists[0];
  const isLensInActiveList = (lensId: string) => {
    return activeList?.items.some((i) => i.lensId === lensId) || false;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedProductType('all');
    setSelectedDistributor('all');
    setSelectedBrand('all');
    setSelectedIndex('all');
    setSelectedCategory('all');
    setSelectedDelivery('all');
    setSphCheck('');
    setCylCheck('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-sky-500 selection:text-white pb-16 sm:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCustomerMode={isCustomerMode}
        setIsCustomerMode={setIsCustomerMode}
        pairCount={pairCount}
        setPairCount={setPairCount}
        customListCount={customLists.reduce((acc, l) => acc + l.items.length, 0)}
        lastSyncTime={driveConfig.lastSyncTime}
        onQuickSync={driveConfig.sourceUrl ? handleDriveAutoSync : () => setActiveTab('drive_sync')}
        isSyncing={isSyncing}
        isDriveWorking={isDriveWorking}
        isAdmin={isAdmin}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Floating Background Drive Task Indicator (When user browses Catalog or Lists while scan continues) */}
      {isDriveWorking && activeTab !== 'drive_sync' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 z-40 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-sky-500/40 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 animate-pulse text-sky-400" />
              <span>Drive Taraması Arka Planda Sürüyor</span>
            </span>
            <span className="text-[11px] text-slate-300 max-w-[240px] sm:max-w-xs truncate">
              {driveWorkingText || 'Belgeler taranıyor ve ürünler ayrıştırılıyor...'}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('drive_sync')}
            className="ml-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
          >
            İlerlemeyi Gör
          </button>
        </div>
      )}

      {/* Main Tab Views (Persisted in DOM so background Drive scans and user filters are never cancelled on tab switch) */}
      <main className="flex-1">
        {/* TAB 1: CATALOG & INSTANT SEARCH */}
        <div className={activeTab === 'catalog' ? 'block' : 'hidden'}>
          {/* Search and Filters Bar */}
          <LensSearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedProductType={selectedProductType}
            setSelectedProductType={handleProductTypeChange}
            eyeglassCount={eyeglassCount}
            contactLensCount={contactLensCount}
            selectedDistributor={selectedDistributor}
            setSelectedDistributor={handleDistributorChange}
            availableDistributors={availableDistributors}
            selectedBrand={selectedBrand}
            setSelectedBrand={handleBrandChange}
            availableBrands={availableBrands}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            availableIndices={availableIndices}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedDelivery={selectedDelivery}
            setSelectedDelivery={setSelectedDelivery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            sphCheck={sphCheck}
            setSphCheck={setSphCheck}
            cylCheck={cylCheck}
            setCylCheck={setCylCheck}
            totalMatches={filteredLenses.length}
            onResetFilters={resetFilters}
            isAdmin={isAdmin}
            onDeleteBrand={handleDeleteBrand}
            onDeleteDistributor={handleDeleteDistributor}
          />

          {/* Results Grid / List */}
          <div className="max-w-7xl mx-auto p-3 sm:p-4">
            {filteredLenses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 mt-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Aradığınız kriterlere uygun cam bulunamadı</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Arama terimini değiştirebilir veya filtreleri sıfırlayabilirsiniz.
                  </p>
                </div>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : viewMode === 'cards' ? (
              /* Cards View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredLenses.map((lens) => (
                  <LensCard
                    key={lens.id}
                    lens={lens}
                    brandDiscounts={brandDiscounts}
                    pairCount={pairCount}
                    isCustomerMode={isCustomerMode}
                    onOpenDetails={(l) => setDetailLens(l)}
                    onAddToList={(l) => handleAddToList(l)}
                    isAddedToActiveList={isLensInActiveList(lens.id)}
                    isAdmin={isAdmin}
                    onDeleteLens={handleDeleteLens}
                  />
                ))}
              </div>
            ) : (
              /* Compact List View */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredLenses.map((lens) => (
                    <LensCompactRow
                      key={lens.id}
                      lens={lens}
                      brandDiscounts={brandDiscounts}
                      pairCount={pairCount}
                      isCustomerMode={isCustomerMode}
                      onOpenDetails={(l) => setDetailLens(l)}
                      onAddToList={(l) => handleAddToList(l)}
                      isAddedToActiveList={isLensInActiveList(lens.id)}
                      isAdmin={isAdmin}
                      onDeleteLens={handleDeleteLens}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Button to Add Custom Lens (Admin Only or prompts Login) */}
          <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
            <button
              onClick={() => {
                if (!isAdmin) {
                  setIsAdminModalOpen(true);
                  showToast('Kataloğa yeni cam eklemek için Yönetici Girişi gereklidir');
                } else {
                  setIsAddModalOpen(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-lg hover:shadow-xl transition text-xs font-bold ${
                isAdmin ? 'bg-slate-900 hover:bg-slate-800' : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={isAdmin ? 'Kataloğa Yeni Cam Ekle' : 'Kataloğa Cam Ekle (Yönetici Girişi Gerekir)'}
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span className="hidden xs:inline">Yeni Cam Ekle</span>
              {!isAdmin && (
                <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-md border border-amber-500/40">
                  Yönetici
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 2: CUSTOM LISTS */}
        <div className={activeTab === 'custom_lists' ? 'block' : 'hidden'}>
          <CustomListsView
            customLists={customLists}
            onUpdateLists={setCustomLists}
            brandDiscounts={brandDiscounts}
            isCustomerMode={isCustomerMode}
            pairCount={pairCount}
            onOpenCatalog={() => setActiveTab('catalog')}
          />
        </div>

        {/* TAB 3: BRAND DISCOUNTS */}
        <div className={activeTab === 'discounts' ? 'block' : 'hidden'}>
          <BrandDiscountsView
            discounts={brandDiscounts}
            onSaveDiscounts={setBrandDiscounts}
            availableBrands={availableBrands}
          />
        </div>

        {/* TAB 4: GOOGLE DRIVE SYNC */}
        <div className={activeTab === 'drive_sync' ? 'block' : 'hidden'}>
          <DriveSyncView
            config={driveConfig}
            onSaveConfig={setDriveConfig}
            lenses={lenses}
            onUpdateLenses={handleUpdateLenses}
            onResetToDefaultCatalog={handleResetCatalog}
            isAdmin={isAdmin}
            onOpenAdminModal={() => setIsAdminModalOpen(true)}
            onScanningStatusChange={(busy, text) => {
              setIsDriveWorking(busy);
              setDriveWorkingText(text || '');
            }}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] sm:text-xs font-medium text-slate-400 bg-slate-100 border-t border-slate-200 mt-auto">
        OptikCam Uygulaması &copy; {new Date().getFullYear()} Stualp. Tüm hakları saklıdır.
      </footer>

      {/* Lens Detail Modal */}
      {detailLens && (
        <LensDetailModal
          lens={detailLens}
          onClose={() => setDetailLens(null)}
          brandDiscounts={brandDiscounts}
          pairCount={pairCount}
          isCustomerMode={isCustomerMode}
          customLists={customLists}
          onAddToList={(lens, listId, customPrice) => {
            handleAddToList(lens, listId, customPrice);
          }}
          isAdmin={isAdmin}
          onDeleteLens={handleDeleteLens}
        />
      )}

      {/* Manual Add Lens Modal */}
      <AddLensModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddLens={(newLens) => {
          setLenses([newLens, ...lenses]);
          showToast(`"${newLens.name}" kataloğa eklendi`);
        }}
        existingBrands={availableBrands}
      />

      {/* Admin Login & Security Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        adminPin={adminPin}
        onLoginSuccess={() => {
          setIsAdmin(true);
          showToast('👑 Yönetici Girişi Yapıldı (Tüm Yetkiler Açık)');
        }}
        onLogout={() => {
          setIsAdmin(false);
          showToast('Yönetici Oturumu Kapatıldı (Optisyen Modu Aktif)');
        }}
        onChangePin={(newPin) => {
          setAdminPin(newPin);
          saveAdminPin(newPin);
          showToast('Yönetici PIN şifresi başarıyla güncellendi');
        }}
      />
    </div>
  );
}
