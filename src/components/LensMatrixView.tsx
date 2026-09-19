import React, { useState, useMemo } from 'react';
import { 
  Table2, 
  Sparkles, 
  Check, 
  Plus, 
  Search, 
  Printer, 
  Eye, 
  EyeOff, 
  Glasses, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Filter,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { Lens, BrandDiscount } from '../types';
import { calculateLensFinancials, formatCurrency } from '../utils/pricing';

interface LensMatrixViewProps {
  lenses: Lens[];
  brandDiscounts: BrandDiscount[];
  pairCount: 1 | 2;
  setPairCount?: (count: 1 | 2) => void;
  isCustomerMode: boolean;
  isAdmin: boolean;
  onOpenDetails: (lens: Lens) => void;
  onAddToList: (lens: Lens, pairCount: 1 | 2) => void;
  isAddedToActiveList: (lensId: string) => boolean;
  initialBrand?: string;
  initialSeries?: string;
}

// Visual color swatches for photochromic and polarized lenses
const COLOR_SWATCHES = [
  { name: 'Emerald Green', color: '#065f46', label: 'Zümrüt Yeşil' },
  { name: 'Bronze Brown', color: '#78350f', label: 'Bronz Kahve' },
  { name: 'Silver Grey', color: '#475569', label: 'Gümüş Füme' },
  { name: 'Oceanic Blue', color: '#1e40af', label: 'Okyanus Mavi' },
];

export const LensMatrixView: React.FC<LensMatrixViewProps> = ({
  lenses,
  brandDiscounts,
  pairCount,
  setPairCount,
  isCustomerMode,
  isAdmin,
  onOpenDetails,
  onAddToList,
  isAddedToActiveList,
  initialBrand,
  initialSeries,
}) => {
  // 1. Get all unique brands that have lenses
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(lenses.map((l) => l.brand.trim()))).filter((b): b is string => Boolean(b));
    // Prioritize HOYA, Zeiss, Seiko, Novax if available
    const priority = ['HOYA', 'Zeiss', 'Carl Zeiss', 'Seiko', 'Novax', 'Essilor', 'Rodenstock', 'Shamir'];
    return brands.sort((a, b) => {
      const idxA = priority.findIndex((p) => a.toLowerCase().includes(p.toLowerCase()));
      const idxB = priority.findIndex((p) => b.toLowerCase().includes(p.toLowerCase()));
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [lenses]);

  // Selected Brand State
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    if (initialBrand && availableBrands.includes(initialBrand)) return initialBrand;
    const hoya = availableBrands.find((b) => b.toLowerCase().includes('hoya'));
    return hoya || availableBrands[0] || 'HOYA';
  });

  // Filter lenses for selected brand
  const brandLenses = useMemo(() => {
    return lenses.filter((l) => l.brand.trim().toLowerCase() === selectedBrand.trim().toLowerCase());
  }, [lenses, selectedBrand]);

  // 2. Extract series / model families for this brand
  const availableSeries = useMemo(() => {
    const seriesSet = new Set<string>();
    brandLenses.forEach((l) => {
      const name = l.name.trim();
      // Heuristic: take first 1 or 2 words before index or coating
      const words = name.split(/\s+/);
      let family = words[0];
      if (words.length > 1 && !/^\d\.\d+/.test(words[1]) && !['1.50','1.53','1.56','1.60','1.67','1.74'].includes(words[1])) {
        family = `${words[0]} ${words[1]}`;
      }
      seriesSet.add(family);
    });
    
    // Specifically ensure 'Balansis' is prominent if HOYA
    const arr = Array.from(seriesSet);
    return arr.sort((a, b) => {
      if (a.toLowerCase().includes('balansis')) return -1;
      if (b.toLowerCase().includes('balansis')) return 1;
      return a.localeCompare(b);
    });
  }, [brandLenses]);

  // Selected Series State
  const [selectedSeries, setSelectedSeries] = useState<string>(() => {
    if (initialSeries && availableSeries.includes(initialSeries)) return initialSeries;
    const balansis = availableSeries.find((s) => s.toLowerCase().includes('balansis'));
    return balansis || availableSeries[0] || 'Balansis';
  });

  // Sync selectedSeries if availableSeries changes
  React.useEffect(() => {
    if (!availableSeries.includes(selectedSeries)) {
      const balansis = availableSeries.find((s) => s.toLowerCase().includes('balansis'));
      setSelectedSeries(balansis || availableSeries[0] || '');
    }
  }, [availableSeries, selectedSeries]);

  // Filter lenses for selected series
  const seriesLenses = useMemo(() => {
    if (!selectedSeries) return brandLenses;
    const term = selectedSeries.toLowerCase();
    return brandLenses.filter((l) => l.name.toLowerCase().includes(term));
  }, [brandLenses, selectedSeries]);

  // Search filter inside the matrix
  const [matrixSearch, setMatrixSearch] = useState('');
  
  // Segment Filter: All, White/Clear, Photochromic, Polarized
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'white' | 'photochromic' | 'polarized'>('all');

  // Selected cell for Quick Action drawer/modal
  const [activeCellLens, setActiveCellLens] = useState<Lens | null>(null);

  // Group lenses into distinct sub-tables (like the catalog sheet in the user's image)
  const matrixGroups = useMemo(() => {
    let filtered = seriesLenses;
    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase();
      filtered = filtered.filter((l) => 
        l.name.toLowerCase().includes(q) || 
        l.coating.toLowerCase().includes(q) || 
        l.material.toLowerCase().includes(q) || 
        l.index.includes(q)
      );
    }

    // Split into categories:
    // 1. Beyaz Camlar (Clear)
    const whiteLenses = filtered.filter(
      (l) => l.category !== 'photochromic' && l.category !== 'sun_polarized' && !l.name.toLowerCase().includes('sensity') && !l.name.toLowerCase().includes('polarize')
    );

    // 2. Sensity Original Fotokromik (or standard Photochromic)
    const sensityOrigLenses = filtered.filter(
      (l) => (l.category === 'photochromic' || l.name.toLowerCase().includes('sensity original')) && !l.name.toLowerCase().includes('sensity 2')
    );

    // 3. Sensity 2 Fotokromik
    const sensity2Lenses = filtered.filter(
      (l) => l.name.toLowerCase().includes('sensity 2')
    );

    // 4. Polarize Camlar (Sun / Polarized)
    const polarLenses = filtered.filter(
      (l) => l.category === 'sun_polarized' || l.name.toLowerCase().includes('polariz')
    );

    const groups: {
      id: string;
      title: string;
      categoryTag: string;
      subtitle?: string;
      swatches?: typeof COLOR_SWATCHES;
      themeColor: 'amber' | 'slate' | 'emerald' | 'blue';
      lenses: Lens[];
    }[] = [];

    if (whiteLenses.length > 0 && (selectedSegment === 'all' || selectedSegment === 'white')) {
      groups.push({
        id: 'white',
        title: 'Beyaz Camlar',
        categoryTag: 'PROGRESSIVE CAMLAR',
        subtitle: 'Standart Şeffaf Yüksek Performanslı Camlar',
        themeColor: 'amber',
        lenses: whiteLenses,
      });
    }

    if (sensityOrigLenses.length > 0 && (selectedSegment === 'all' || selectedSegment === 'photochromic')) {
      groups.push({
        id: 'sensity_orig',
        title: 'Sensity Original Fotokromik Camlar',
        categoryTag: 'FOTOKROMİK TEKNOLOJİSİ',
        subtitle: 'Işığa Duyarlı Hızlı Renk Değiştiren Camlar',
        swatches: COLOR_SWATCHES.slice(0, 3), // Green, Brown, Grey
        themeColor: 'slate',
        lenses: sensityOrigLenses,
      });
    }

    if (sensity2Lenses.length > 0 && (selectedSegment === 'all' || selectedSegment === 'photochromic')) {
      groups.push({
        id: 'sensity_2',
        title: 'Sensity 2 Fotokromik Camlar',
        categoryTag: 'YENİ NESİL FOTOKROMİK',
        subtitle: 'Ekstra Hızlı Kararma & Açılma • Mavi Renk Seçeneği',
        swatches: COLOR_SWATCHES, // Green, Brown, Grey, Blue
        themeColor: 'slate',
        lenses: sensity2Lenses,
      });
    }

    if (polarLenses.length > 0 && (selectedSegment === 'all' || selectedSegment === 'polarized')) {
      groups.push({
        id: 'polarized',
        title: 'Polarize Camlar',
        categoryTag: 'GÜNEŞ & POLARİZE',
        subtitle: 'Maksimum Parlama Önleyici Yüksek Kontrast',
        swatches: COLOR_SWATCHES.slice(0, 3),
        themeColor: 'emerald',
        lenses: polarLenses,
      });
    }

    // Fallback: If no standard groups match, treat all series lenses as one custom matrix
    if (groups.length === 0 && filtered.length > 0) {
      groups.push({
        id: 'general',
        title: `${selectedSeries || selectedBrand} Fiyat Matrisi`,
        categoryTag: 'ÖZEL FİYAT LİSTESİ',
        themeColor: 'amber',
        lenses: filtered,
      });
    }

    return groups;
  }, [seriesLenses, matrixSearch, selectedSegment, selectedSeries, selectedBrand]);

  // Helper to build a 2D matrix (Rows: Index/Material, Columns: Coating) for a set of lenses
  const buildMatrixForGroup = (groupLenses: Lens[]) => {
    // Collect unique Row Keys: e.g. "1.50 ORGANIC", "1.53 PNX", "1.60 EYAS", "1.67 EYNOA", "1.74 EYVIA"
    const rowMap = new Map<string, { index: string; material: string; displayLabel: string }>();
    
    // Preferred order of optical indices
    const indexOrder = ['1.50', '1.53', '1.49', '1.56', '1.58', '1.59', '1.60', '1.61', '1.67', '1.74', '1.80', '1.90'];

    groupLenses.forEach((l) => {
      const idx = l.index || '1.50';
      const mat = l.material || '';
      // Normalizing material label
      let matClean = mat;
      if (mat.toLowerCase().includes('cr-39') || mat.toLowerCase().includes('organik')) matClean = 'ORGANIC';
      else if (mat.toLowerCase().includes('pnx') || mat.toLowerCase().includes('trivex')) matClean = 'PNX';
      else if (mat.toLowerCase().includes('eyas') || mat.toLowerCase().includes('mr-8')) matClean = 'EYAS';
      else if (mat.toLowerCase().includes('eynoa') || idx === '1.67') matClean = 'EYNOA';
      else if (mat.toLowerCase().includes('eyvia') || idx === '1.74') matClean = 'EYVIA';
      
      const key = `${idx} ${matClean}`.trim();
      if (!rowMap.has(key)) {
        rowMap.set(key, { index: idx, material: matClean, displayLabel: key });
      }
    });

    const rows = Array.from(rowMap.values()).sort((a, b) => {
      const orderA = indexOrder.indexOf(a.index);
      const orderB = indexOrder.indexOf(b.index);
      if (orderA !== -1 && orderB !== -1) return orderA - orderB;
      return a.index.localeCompare(b.index);
    });

    // Collect unique Column Keys: e.g. "Hi-Vision LongLife", "HVLL BlueControl", "HVLL UV Control", "Hard Mirror"
    const colSet = new Set<string>();
    groupLenses.forEach((l) => {
      const c = l.coating || 'Standart';
      colSet.add(c);
    });

    // Priority ordering for coatings
    const coatingOrder = [
      'Hi-Vision LongLife', 
      'HVLL BlueControl', 
      'HVLL UV Control', 
      'Hard Mirror', 
      'Hi-Vision Aqua (Back-AR)', 
      'HV-SUN', 
      'Hi-Vision LayR', 
      'SuperResistantCoat', 
      'DuraVision Platinum', 
      'Crizal Sapphire HR'
    ];

    const columns = Array.from(colSet).sort((a, b) => {
      const orderA = coatingOrder.findIndex((co) => a.toLowerCase().includes(co.toLowerCase()));
      const orderB = coatingOrder.findIndex((co) => b.toLowerCase().includes(co.toLowerCase()));
      if (orderA !== -1 && orderB !== -1) return orderA - orderB;
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Matrix lookup cell: map `rowKey_colKey` -> Lens
    const cellLookup = new Map<string, Lens>();
    groupLenses.forEach((l) => {
      const idx = l.index || '1.50';
      let matClean = l.material || '';
      if (matClean.toLowerCase().includes('cr-39') || matClean.toLowerCase().includes('organik')) matClean = 'ORGANIC';
      else if (matClean.toLowerCase().includes('pnx') || matClean.toLowerCase().includes('trivex')) matClean = 'PNX';
      else if (matClean.toLowerCase().includes('eyas') || matClean.toLowerCase().includes('mr-8')) matClean = 'EYAS';
      else if (matClean.toLowerCase().includes('eynoa') || idx === '1.67') matClean = 'EYNOA';
      else if (matClean.toLowerCase().includes('eyvia') || idx === '1.74') matClean = 'EYVIA';
      
      const rowKey = `${idx} ${matClean}`.trim();
      const colKey = l.coating || 'Standart';
      cellLookup.set(`${rowKey}___${colKey}`, l);
    });

    return { rows, columns, cellLookup };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 space-y-4">
      {/* Top Header & Interactive Matrix Controller */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Brand Badge */}
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/60">
                <Table2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Katalog Fiyat Matrisi (Matrix Table)
                  </h2>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    2D Katalog Düzeni
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optik üreticilerin basılı fiyat kataloglarındaki <span className="font-semibold text-slate-700">İndeks × Kaplama</span> tablosu
                </p>
              </div>
            </div>
          </div>

          {/* Quick Selectors: Brand, Series & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Marka:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {availableBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Series / Family Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Model / Seri:</span>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-amber-700 focus:outline-hidden cursor-pointer"
              >
                {availableSeries.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Pair / Single Count Toggle (Çift vs Tek Cam) */}
            {setPairCount && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setPairCount(2)}
                  className={`px-2 py-1 rounded-lg transition ${
                    pairCount === 2 ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="2 Cam (Çift Fiyatı)"
                >
                  Çift (x2)
                </button>
                <button
                  onClick={() => setPairCount(1)}
                  className={`px-2 py-1 rounded-lg transition ${
                    pairCount === 1 ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="1 Cam (Tek Fiyatı)"
                >
                  Tek Cam
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              title="Katalog Matrisini Yazdır / Müşteriye Sun"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Yazdır</span>
            </button>
          </div>
        </div>

        {/* Filter Pills & Matrix In-Table Search */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Sub-Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedSegment('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedSegment === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tümü ({seriesLenses.length})
            </button>
            <button
              onClick={() => setSelectedSegment('white')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                selectedSegment === 'white'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <span>Beyaz Camlar</span>
            </button>
            <button
              onClick={() => setSelectedSegment('photochromic')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                selectedSegment === 'photochromic'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sensity / Fotokromik</span>
            </button>
            <button
              onClick={() => setSelectedSegment('polarized')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                selectedSegment === 'polarized'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span>Polarize / Güneş</span>
            </button>
          </div>

          {/* Search inside the matrix */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              placeholder="İndeks, kaplama veya hammadde ara..."
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Info Notice for Optical Matrix Interpretation */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-amber-900">
        <div className="flex items-center gap-2 truncate">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate">
            <span className="font-bold">Katalog İpuçları:</span> Yıldızlı (<span className="font-bold text-amber-600">*</span>) fiyatlar <span className="font-bold">stok hızlı teslimat</span>, diğerleri <span className="font-bold">özel üretim (Rx)</span> camlarıdır. Tire (<span className="font-bold">-</span>) işareti üretilmeyen kombinasyonları belirtir.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] font-bold text-slate-600">
          <span>Gösterim:</span>
          <span className="bg-white border border-amber-200 px-2 py-0.5 rounded font-mono text-amber-900">
            {pairCount === 2 ? 'Çift Cam (x2)' : 'Tek Cam'}
          </span>
        </div>
      </div>

      {/* Matrix Tables (Sub-groups like Balansis Beyaz, Sensity, Polarize) */}
      <div className="space-y-6">
        {matrixGroups.map((group) => {
          const { rows, columns, cellLookup } = buildMatrixForGroup(group.lenses);

          return (
            <div 
              key={group.id} 
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
            >
              {/* Table Group Banner (Direct visual translation from optical catalog page) */}
              <div 
                className={`px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  group.themeColor === 'amber'
                    ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white border-amber-600'
                    : group.themeColor === 'emerald'
                    ? 'bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white border-emerald-800'
                    : 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-white border-slate-800'
                }`}
              >
                {/* Left: Model & Category Title */}
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                    <span className="text-xs font-black tracking-wider uppercase">
                      {selectedSeries.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-wide uppercase flex items-center gap-2">
                      <span>{group.title}</span>
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium">
                      {group.subtitle || group.categoryTag}
                    </p>
                  </div>
                </div>

                {/* Right: Color Swatches if Fotokromik or Polarize */}
                {group.swatches && (
                  <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 shrink-0">
                    <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                      Renkler:
                    </span>
                    <div className="flex items-center gap-2">
                      {group.swatches.map((sw) => (
                        <div 
                          key={sw.name} 
                          className="flex items-center gap-1 group/swatch" 
                          title={sw.label}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs inline-block"
                            style={{ backgroundColor: sw.color }}
                          />
                          <span className="text-[10px] font-semibold text-white/90">
                            {sw.label.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Responsive Scrollable Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    {/* Header Row: Top Left Title & Coating Columns */}
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700">
                      <th className="py-2.5 px-3.5 text-xs font-black uppercase tracking-wider text-slate-800 w-44 bg-slate-100/70 border-r border-slate-200/80 sticky left-0 z-10">
                        İndeks & Hammadde
                      </th>
                      {columns.map((col) => (
                        <th 
                          key={col} 
                          className="py-2.5 px-3 text-xs font-extrabold text-center text-slate-800 border-r border-slate-200/60 last:border-r-0"
                        >
                          <div className="font-bold text-[12px]">{col}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rows.map((row, rIdx) => {
                      return (
                        <tr 
                          key={row.displayLabel}
                          className={`hover:bg-amber-50/50 transition duration-150 ${
                            rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Row Header: Index & Material */}
                          <td className="py-3 px-3.5 font-extrabold text-slate-900 border-r border-slate-200/80 bg-slate-50/80 sticky left-0 z-10 shadow-xs whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-amber-700 text-xs font-black bg-amber-100/80 px-1.5 py-0.5 rounded">
                                {row.index}
                              </span>
                              <span className="text-slate-800 text-xs font-bold tracking-tight">
                                {row.material}
                              </span>
                            </div>
                          </td>

                          {/* Matrix Cells */}
                          {columns.map((col) => {
                            const cellKey = `${row.displayLabel}___${col}`;
                            const lens = cellLookup.get(cellKey);

                            if (!lens) {
                              // Combination does not exist (-)
                              return (
                                <td 
                                  key={col} 
                                  className="py-3 px-3 text-center text-slate-300 font-bold border-r border-slate-200/40 last:border-r-0 select-none"
                                  title="Bu kombinasyon üretilmemektedir"
                                >
                                  -
                                </td>
                              );
                            }

                            // Calculate pricing & financials
                            const financials = calculateLensFinancials(lens, brandDiscounts, pairCount);
                            const displayPrice = isCustomerMode
                              ? (pairCount === 2 ? lens.retailPrice * 2 : lens.retailPrice)
                              : financials.retailPrice;
                            const isStock = lens.deliveryType === 'stock';
                            const isAdded = isAddedToActiveList(lens.id);

                            return (
                              <td 
                                key={col} 
                                onClick={() => setActiveCellLens(lens)}
                                className="py-2.5 px-2.5 text-center border-r border-slate-200/50 last:border-r-0 cursor-pointer group transition relative hover:bg-amber-100/60"
                                title={`Tıkla: ${lens.name} (${pairCount === 2 ? 'Çift Cam' : 'Tek Cam'})`}
                              >
                                <div className="flex flex-col items-center justify-center">
                                  {/* Price with Asterisk for Stock */}
                                  <div className="flex items-center justify-center gap-0.5 font-mono text-xs sm:text-[13px] font-black text-slate-900 group-hover:text-amber-800">
                                    <span>{formatCurrency(displayPrice, lens.currency)}</span>
                                    {isStock && (
                                      <span 
                                        className="text-amber-600 font-black text-sm leading-none ml-0.5" 
                                        title="Stok Cam (Hızlı Teslimat)"
                                      >
                                        *
                                      </span>
                                    )}
                                  </div>

                                  {/* In Admin & Optician Mode: Show Wholesale & Margin */}
                                  {!isCustomerMode && financials.wholesaleListPrice > 0 && (
                                    <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                      <span className="text-emerald-700 font-bold">
                                        Net: {formatCurrency(financials.netWholesaleCost, lens.currency)}
                                      </span>
                                      {financials.profitMarginPercent > 0 && (
                                        <span className="text-[9px] bg-emerald-50 text-emerald-800 font-mono px-1 rounded">
                                          %{Math.round(financials.profitMarginPercent)}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Badge for Added to Quote */}
                                  {isAdded && (
                                    <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded-full">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Listede</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Drawer / Modal when a Matrix Cell is Clicked */}
      {activeCellLens && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    {activeCellLens.brand}
                  </span>
                  <span className="text-xs text-white/90 font-bold">
                    {activeCellLens.index} İndeks
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1 leading-snug">
                  {activeCellLens.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveCellLens(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Key Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hammadde</span>
                  <span className="font-extrabold text-slate-800">{activeCellLens.material || '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Kaplama</span>
                  <span className="font-extrabold text-slate-800">{activeCellLens.coating || '-'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Teslimat Tipi</span>
                  <span className={`font-extrabold inline-flex items-center gap-1 ${
                    activeCellLens.deliveryType === 'stock' ? 'text-amber-700' : 'text-slate-700'
                  }`}>
                    {activeCellLens.deliveryType === 'stock' ? 'Stok Cam (* Hızlı Teslimat)' : 'Özel Sipariş (Rx)'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Kategori</span>
                  <span className="font-extrabold text-slate-800 capitalize">{activeCellLens.category}</span>
                </div>
              </div>

              {/* Price Calculation Box */}
              {(() => {
                const fin = calculateLensFinancials(activeCellLens, brandDiscounts, pairCount);
                const isStock = activeCellLens.deliveryType === 'stock';

                return (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs text-amber-900 mb-1">
                      <span className="font-bold">
                        {pairCount === 2 ? 'Çift Cam (2 Adet) Perakende:' : 'Tek Cam (1 Adet) Perakende:'}
                      </span>
                      {isStock && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.2 rounded">
                          Stok Ürün (*)
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-slate-900 font-mono">
                      {formatCurrency(
                        isCustomerMode ? (pairCount === 2 ? activeCellLens.retailPrice * 2 : activeCellLens.retailPrice) : fin.retailPrice,
                        activeCellLens.currency
                      )}
                    </div>

                    {!isCustomerMode && fin.wholesaleListPrice > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-600">İskontolu Net Alış:</span>
                        <span className="font-mono font-bold text-emerald-800">
                          {formatCurrency(fin.netWholesaleCost, activeCellLens.currency)}
                          {fin.profitMarginPercent > 0 && (
                            <span className="ml-1 text-[10px] text-emerald-600 font-normal">
                              (%{Math.round(fin.profitMarginPercent)} Kâr)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    onAddToList(activeCellLens, pairCount);
                    setActiveCellLens(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Teklife / Listeye Ekle ({pairCount === 2 ? 'Çift' : 'Tek'})</span>
                </button>
                <button
                  onClick={() => {
                    onOpenDetails(activeCellLens);
                    setActiveCellLens(null);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                  title="Detaylı Cam Bilgi Kartını Aç"
                >
                  Detaylar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
