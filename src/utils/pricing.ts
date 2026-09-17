import { Lens, BrandDiscount, LensFinancials } from '../types';
import { getDistributorForBrand } from '../data/distributors';
import { getLensCostWithCodeParser } from './costCodeParser';

// Global exchange rates memory
let globalExchangeRates = { EUR: 40.0, USD: 36.0, loaded: false };

export function setGlobalExchangeRates(rates: { EUR: number; USD: number }) {
  globalExchangeRates = { ...rates, loaded: true };
}

/**
 * Kademeli / Basamaklı iskonto formülü:
 * Örneğin 40 + 10 iskonto:
 * 100 TL * (1 - 0.40) * (1 - 0.10) = 54 TL net alış (Efektif %46.0 iskonto)
 */
export function calculateCompoundDiscountRate(d1: number, d2: number = 0): number {
  const p1 = Math.max(0, Math.min(100, Number(d1) || 0));
  const p2 = Math.max(0, Math.min(100, Number(d2) || 0));

  if (p2 === 0) return p1;

  const netMultiplier = (1 - p1 / 100) * (1 - p2 / 100);
  const effectiveDiscount = (1 - netMultiplier) * 100;
  return Number(effectiveDiscount.toFixed(2));
}

/**
 * Bir cam için geçerli marka ve kategori iskontosunu tespit eder
 */
export function getEffectiveDiscountRate(
  lens: Lens,
  brandDiscounts: BrandDiscount[]
): { rate: number; d1: number; d2: number; isCustom: boolean } {
  const match = brandDiscounts.find(
    (b) => b.brand.trim().toLowerCase() === lens.brand.trim().toLowerCase()
  );

  if (!match) {
    return { rate: 0, d1: 0, d2: 0, isCustom: false };
  }

  // Kategoriye özel istisna var mı?
  if (match.categoryOverrides && match.categoryOverrides[lens.category]) {
    const override = match.categoryOverrides[lens.category];
    const rate = calculateCompoundDiscountRate(override.discount1, override.discount2);
    return { rate, d1: override.discount1, d2: override.discount2 || 0, isCustom: true };
  }

  const rate = calculateCompoundDiscountRate(match.discount1, match.discount2);
  return { rate, d1: match.discount1, d2: match.discount2 || 0, isCustom: false };
}

/**
 * Toptan, Perakende, İskontolu Maliyet ve Kar Analizini hesaplar
 */
export function calculateLensFinancials(
  lens: Lens,
  brandDiscounts: BrandDiscount[],
  pairCount: 1 | 2 = 2,
  customRetailPrice?: number
): LensFinancials {
  const { rate } = getEffectiveDiscountRate(lens, brandDiscounts);
  const isContact = lens.productType === 'contact_lens' || lens.category === 'contact_lens';
  // Kontakt lenslerde çift cam/tek cam seçeneği olmaz; fiyat daima 1 Kutu üzerinden hesaplanır.
  const multiplier = isContact ? 1 : pairCount;

  let singleWholesaleList = Number(lens.wholesalePrice) || 0;
  const singleRetail = customRetailPrice !== undefined ? Number(customRetailPrice) : Number(lens.retailPrice) || 0;

  // Koddan maliyet tespiti (J&J Acuvue formatı veya Optik Gizli Maliyet Kodu SO077L vb.)
  const codeCostData = getLensCostWithCodeParser(lens);
  const isCostFromCode = codeCostData.isDerivedFromCode && !!codeCostData.parsedResult?.parsedCost;

  if (isCostFromCode && codeCostData.parsedResult?.parsedCost) {
    // Eğer toptan fiyat belirtilmemişse veya koddan daha hassas maliyet gelmişse
    if (singleWholesaleList === 0 || singleWholesaleList === singleRetail) {
      singleWholesaleList = codeCostData.parsedResult.parsedCost;
    }
  } else if (singleWholesaleList === 0 && singleRetail > 0) {
    // Perakende listelerden gelen ürünlerde toptan liste fiyatı belirtilmemişse,
    // liste (perakende) fiyatı üzerinden marka iskontosu uygulanarak net alış hesaplanır.
    singleWholesaleList = singleRetail;
  }

  const wholesaleListPrice = Number((singleWholesaleList * multiplier).toFixed(2));
  // Eğer ürünün maliyeti doğrudan koddan net olarak çıkarılmışsa ve marka iskontosu 0 ise direkt net maliyet odur.
  // Marka iskontosu girilmişse (örn: optisyenin ek özel anlaşması) o da uygulanabilir.
  const netWholesaleCost = Number((wholesaleListPrice * (1 - rate / 100)).toFixed(2));
  const retailPrice = Number((singleRetail * multiplier).toFixed(2));
  const profitAmount = Number((retailPrice - netWholesaleCost).toFixed(2));
  const profitMarginPercent = retailPrice > 0 ? (profitAmount / retailPrice) * 100 : 0;

  return {
    wholesaleListPrice,
    effectiveDiscountRate: rate,
    netWholesaleCost,
    retailPrice,
    profitAmount,
    profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
    pairCount: (isContact ? 1 : pairCount) as 1 | 2,
    isCostFromCode,
    codeCostResult: isCostFromCode && codeCostData.parsedResult?.parsedCost
      ? {
          rawCode: codeCostData.parsedResult.rawCode,
          parsedCost: codeCostData.parsedResult.parsedCost * multiplier,
          patternDescription: codeCostData.parsedResult.patternDescription,
        }
      : undefined,
  };
}

/**
 * Marka isimlerini standart yazılışa normalize eder
 */
export function normalizeBrandName(rawBrand?: string): string {
  if (!rawBrand) return '';
  const trimmed = rawBrand.trim();
  const lower = trimmed.toLowerCase();

  // Kontakt lens markaları
  if (
    lower === 'cv' ||
    lower.startsWith('cv ') ||
    lower.startsWith('cv-') ||
    lower.startsWith('cv_') ||
    lower.includes('cv toptan') ||
    lower.includes('cv fiyat') ||
    lower.includes('cooper') ||
    lower.includes('coopervision')
  ) {
    return 'CooperVision';
  }
  if (lower.includes('bausch')) return 'Bausch + Lomb';
  if (lower.includes('alcon')) return 'Alcon';
  if (lower.includes('desio')) return 'Desio';
  if (lower.includes('adore')) return 'Adore';
  if (lower.includes('opsa')) return 'Opsa Lens';
  if (lower.includes('lens medikal') || lower.includes('lensmedikal')) return 'Lens Medikal';
  if (lower.includes('johnson') || lower.includes('acuvue')) return 'Johnson & Johnson';

  // Gözlük camı markaları
  if (lower.includes('rodenstock')) return 'Rodenstock';
  if (lower.includes('zeiss')) return 'Zeiss';
  if (lower.includes('essilor')) return 'Essilor';
  if (lower.includes('hoya')) return 'Hoya';
  if (lower.includes('seiko')) return 'Seiko';
  if (lower.includes('shamir')) return 'Shamir';
  if (lower.includes('novax')) return 'Novax';
  if (lower.includes('kodak')) return 'Kodak';
  if (lower.includes('hawk')) return 'Hawk Plus';
  if (lower.includes('fuji') || lower.includes('fujı')) return 'Fuji';
  if (lower.includes('visionart') || lower.includes('vision art')) return 'VisionArt';
  if (lower.includes('işbir') || lower.includes('isbir')) return 'İşbir';

  return trimmed;
}

export const CONTACT_LENS_BRANDS = [
  'CooperVision',
  'Bausch + Lomb',
  'Alcon',
  'Desio',
  'Adore',
  'Opsa Lens',
  'Lens Medikal',
];

export const EYEGLASS_LENS_BRANDS = [
  'Essilor',
  'Zeiss',
  'Rodenstock',
  'Hoya',
  'Seiko',
  'Shamir',
  'Novax',
  'Kodak',
  'Hawk Plus',
  'Fuji',
  'VisionArt',
  'İşbir',
];

export function isContactLensBrand(brand: string): boolean {
  const norm = normalizeBrandName(brand);
  return CONTACT_LENS_BRANDS.some((b) => b.toLowerCase() === norm.toLowerCase());
}

export function isEyeglassBrand(brand: string): boolean {
  const norm = normalizeBrandName(brand);
  return EYEGLASS_LENS_BRANDS.some((b) => b.toLowerCase() === norm.toLowerCase());
}

/**
 * Ürünün Kontakt Lens mi yoksa Gözlük Camı mı olduğunu belirler
 */
export function isContactLens(
  lensOrName: Lens | string | { name?: string; brand?: string; category?: string; productType?: string }
): boolean {
  if (typeof lensOrName === 'string') {
    const textLower = lensOrName.toLowerCase();
    return (
      textLower.includes('lens') ||
      textLower.includes('cooper') ||
      textLower.includes('cv ') ||
      textLower.startsWith('cv ') ||
      textLower.startsWith('cv_') ||
      textLower.startsWith('cv-') ||
      textLower.includes('cv toptan') ||
      textLower.includes('cv fiyat') ||
      textLower.includes('opsa') ||
      textLower.includes('adore') ||
      textLower.includes('desio') ||
      textLower.includes('bausch') ||
      textLower.includes('alcon') ||
      textLower.includes('acuvue') ||
      textLower.includes('johnson') ||
      textLower.includes('biofinity') ||
      textLower.includes('clariti') ||
      textLower.includes('myday') ||
      textLower.includes('avaira') ||
      textLower.includes('biomedics') ||
      textLower.includes('proclear') ||
      textLower.includes('optimity') ||
      textLower.includes('purevision') ||
      textLower.includes('soflens') ||
      textLower.includes('air optix') ||
      textLower.includes('dailies') ||
      textLower.includes('kutu') ||
      textLower.includes('kontakt') ||
      textLower.includes('hidrojel')
    );
  }

  const item = lensOrName;
  const brandNorm = normalizeBrandName(item.brand);
  if (CONTACT_LENS_BRANDS.includes(brandNorm)) return true;
  if (item.productType === 'contact_lens') return true;
  if (item.productType === 'eyeglass_lens' && !item.brand?.toLowerCase().includes('cooper') && !item.brand?.toLowerCase().includes('cv')) return false;
  if (item.category === 'contact_lens') return true;

  const brandLower = (item.brand || '').toLowerCase();
  const nameLower = (item.name || '').toLowerCase();
  const matLower = ((item as any).material || '').toLowerCase();
  return (
    brandLower.includes('cooper') ||
    brandLower === 'cv' ||
    brandLower.startsWith('cv ') ||
    brandLower.includes('opsa') ||
    brandLower.includes('adore') ||
    brandLower.includes('desio') ||
    brandLower.includes('bausch') ||
    brandLower.includes('alcon') ||
    brandLower.includes('johnson') ||
    brandLower.includes('lens medikal') ||
    nameLower.includes('lens') ||
    nameLower.includes('biofinity') ||
    nameLower.includes('clariti') ||
    nameLower.includes('myday') ||
    nameLower.includes('avaira') ||
    nameLower.includes('biomedics') ||
    nameLower.includes('proclear') ||
    nameLower.includes('optimity') ||
    nameLower.includes('purevision') ||
    nameLower.includes('soflens') ||
    nameLower.includes('air optix') ||
    nameLower.includes('dailies') ||
    nameLower.includes('kutu') ||
    matLower.includes('kontakt') ||
    matLower.includes('hidrojel')
  );
}

export function getProductType(lens: Lens): 'eyeglass_lens' | 'contact_lens' {
  return isContactLens(lens) ? 'contact_lens' : 'eyeglass_lens';
}

/**
 * Ürünün marka ve productType değerlerini garanti altına alır
 */
export function sanitizeLens(lens: Lens): Lens {
  const normBrand = normalizeBrandName(lens.brand);
  const isContact = isContactLens({ ...lens, brand: normBrand });
  const finalDistributor = lens.distributor?.trim() || getDistributorForBrand(normBrand, lens.name, lens.distributor);
  
  let finalCurrency = lens.currency || 'TRY';
  // Desio ve Adore gibi markaların listeleri genellikle Euro (EUR) bazlıdır.
  if (normBrand.toLowerCase() === 'desio' || normBrand.toLowerCase() === 'adore') {
    finalCurrency = 'EUR';
  }

  let wPrice = lens.wholesalePrice;
  let rPrice = lens.retailPrice;

  // Tüm fiyatları otomatik TL'ye (TRY) çevir
  if (finalCurrency !== 'TRY' && globalExchangeRates.loaded) {
    const rate = finalCurrency === 'EUR' ? globalExchangeRates.EUR : globalExchangeRates.USD;
    if (wPrice) wPrice = Math.round(wPrice * rate);
    if (rPrice) rPrice = Math.round(rPrice * rate);
    finalCurrency = 'TRY';
  }

  return {
    ...lens,
    brand: normBrand || lens.brand,
    distributor: finalDistributor,
    productType: isContact ? 'contact_lens' : 'eyeglass_lens',
    category: isContact ? 'contact_lens' : lens.category,
    wholesalePrice: wPrice,
    retailPrice: rPrice,
    currency: finalCurrency,
  };
}

/**
 * Türkçe Para Formatı (₺) - Kuruşlu tutarlar için (örn: 1.337,50 ₺) hassas basamak desteği
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  const num = Number(amount) || 0;
  const hasDecimals = Math.abs(num - Math.round(num)) > 0.001;
  const formatted = num.toLocaleString('tr-TR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'EUR') return `€${formatted}`;
  return `₺${formatted}`;
}

export interface LensCampaignDetails {
  isCampaign: boolean;
  campaignTitle: string;
  campaignPeriod: string;
  regularRetailPrice: number;
  regularWholesalePrice?: number;
  discountPercent: number;
  savingsAmount: number;
  hasExplicitRegularPrice: boolean;
  matchedRegularLens?: Lens | null;
  matchedRegularName?: string;
  matchedSource: 'catalog_match' | 'explicit' | 'estimated';
  wholesaleSavingsAmount?: number;
  wholesaleDiscountPercent?: number;
}

/**
 * Verilen ürünün kampanyalı olup olmadığını tespit eder
 */
export function isCampaignLens(lens: Lens): boolean {
  return Boolean(
    lens.isCampaign ||
    lens.sourceListType === 'kampanya' ||
    lens.notes?.toLowerCase().includes('kampanya') ||
    lens.name.toLowerCase().includes('kampanya') ||
    lens.sourceFileName?.toLowerCase().includes('kampanya') ||
    lens.campaignInfo
  );
}

/**
 * İsmi tokenize edip karşılaştırma için temizler (stop-words ve kampanya ibarelerini eler)
 */
function cleanTokensForMatching(text: string): string[] {
  if (!text) return [];
  const stopWords = new Set([
    'kampanya', 'kampanyasi', 'kampanyası', 'yaz', 'kış', 'kis', 'bahar',
    'özel', 'ozel', 'stok', 'stock', 'fırsat', 'firsat', '2025', '2026', '2024',
    'kmp', 'fiyat', 'fiyatı', 'fiyati', 've', 'ile', 'cam', 'camı', 'cami', 'lens',
    'adet', 'kutu', 'katalog', 'liste', 'listesi', 'pfl', 'tfl'
  ]);

  return text
    .toLowerCase()
    .replace(/[®™©()[\],.\-+/]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !stopWords.has(t));
}

/**
 * Kampanyalı ürün için, ait olduğu markanın normal listesindeki (PFL / standart katalog)
 * karşılığı olan ürünü bulur ve normal liste fiyatlarını oradan çeker.
 */
export function findMatchingRegularLens(
  campaignLens: Lens,
  catalog: Lens[] = []
): { matchedLens: Lens | null; score: number } {
  if (!catalog || catalog.length === 0) {
    return { matchedLens: null, score: 0 };
  }

  const brandNormalized = campaignLens.brand.trim().toLowerCase();
  const productType = campaignLens.productType || 'eyeglass_lens';
  const campaignTokens = new Set(cleanTokensForMatching(campaignLens.name));
  const campaignCoatingTokens = new Set(cleanTokensForMatching(campaignLens.coating || ''));

  // Sadece aynı markaya ait, kampanya OLMAYAN normal liste ürünlerini filtrele
  const candidates = catalog.filter((item) => {
    if (item.id === campaignLens.id) return false;
    if (item.brand.trim().toLowerCase() !== brandNormalized) return false;
    if (isCampaignLens(item)) return false;
    if ((item.productType || 'eyeglass_lens') !== productType) return false;
    return true;
  });

  if (candidates.length === 0) {
    return { matchedLens: null, score: 0 };
  }

  let bestCandidate: Lens | null = null;
  let highestScore = 0;

  for (const cand of candidates) {
    let score = 0;

    // 1. İndeks Eşleşmesi (Temel kriter)
    if (campaignLens.index && cand.index) {
      if (campaignLens.index === cand.index) {
        score += 50;
      } else {
        // İndeksler farklı ise aynı cam olamaz
        continue;
      }
    }

    // 2. Kategori Eşleşmesi (Tek Odaklı, Progresif vb.)
    if (campaignLens.category && cand.category) {
      if (campaignLens.category === cand.category) {
        score += 25;
      } else if (
        (campaignLens.category === 'photochromic' && cand.category === 'single_vision') ||
        (campaignLens.category === 'single_vision' && cand.category === 'photochromic')
      ) {
        score -= 10;
      } else {
        score -= 40;
      }
    }

    // 3. İsim ve Model Eşleşmesi
    const candTokens = cleanTokensForMatching(cand.name);
    for (const token of candTokens) {
      if (campaignTokens.has(token)) {
        if (['perfalit', 'cosmolit', 'hilux', 'hoyalux', 'balansis', 'lifestyle', 'myself', 'sync', 'colormatic', 'miyosmart', 'as'].includes(token)) {
          score += 35;
        } else {
          score += 15;
        }
      }
    }

    // 4. Kaplama Eşleşmesi
    if (cand.coating && campaignLens.coating) {
      const candCoatingTokens = cleanTokensForMatching(cand.coating);
      let sharedCoating = 0;
      for (const cToken of candCoatingTokens) {
        if (campaignCoatingTokens.has(cToken)) {
          sharedCoating++;
        }
      }
      if (sharedCoating > 0) {
        score += sharedCoating * 15;
      }
      if (cand.coating.toLowerCase().trim() === campaignLens.coating.toLowerCase().trim()) {
        score += 25;
      }
    }

    // 5. Perakende (PFL) listesi önceliği
    if (cand.sourceListType === 'perakende') {
      score += 15;
    }

    // 6. Teslim Tipi (Stok / RX)
    if (cand.deliveryType === campaignLens.deliveryType) {
      score += 10;
    }

    if (score > highestScore) {
      highestScore = score;
      bestCandidate = cand;
    }
  }

  // Eşik puan (en az indeks + model adı örtüşmeli)
  if (bestCandidate && highestScore >= 50) {
    return { matchedLens: bestCandidate, score: highestScore };
  }

  return { matchedLens: null, score: 0 };
}

/**
 * Kampanyalı ürünün kampanya bilgisi, normal listedeki fiyatı ve indirim avantajını hesaplar.
 * Markanın normal listesindeki ürünleri tarayarak gerçek liste fiyatını oradan çeker.
 */
export function getCampaignDetails(
  lens: Lens,
  pairCount: 1 | 2 = 1,
  catalog: Lens[] = []
): LensCampaignDetails {
  const isCampaign = isCampaignLens(lens);

  if (!isCampaign) {
    return {
      isCampaign: false,
      campaignTitle: '',
      campaignPeriod: '',
      regularRetailPrice: 0,
      discountPercent: 0,
      savingsAmount: 0,
      hasExplicitRegularPrice: false,
      matchedSource: 'estimated',
    };
  }

  // Kampanya başlığı
  let campaignTitle = lens.campaignInfo || '';
  if (!campaignTitle) {
    if (lens.sourceFileName?.toLowerCase().includes('yaz') || lens.notes?.toLowerCase().includes('yaz')) {
      campaignTitle = `${lens.brand} 2026 Yaz Kampanyası`;
    } else if (lens.notes?.toLowerCase().includes('kampanya')) {
      const match = lens.notes.match(/([^.-]*kampanya[^.-]*)/i);
      campaignTitle = match ? match[0].trim() : `${lens.brand} Özel Kampanya`;
    } else if (lens.name.toLowerCase().includes('kampanya')) {
      campaignTitle = `${lens.brand} Özel Kampanyası`;
    } else {
      campaignTitle = `${lens.brand} Fiyat Kampanyası`;
    }
  }

  // Kampanya geçerlilik süresi
  const campaignPeriod = lens.campaignValidity || '01.06.2026 - 31.10.2026';

  // 1. Markanın Normal Listesinden Eşleşen Ürünü ve Fiyatı Bul
  const { matchedLens } = findMatchingRegularLens(lens, catalog);

  let baseRegularRetail = 0;
  let baseRegularWholesale = 0;
  let matchedSource: 'catalog_match' | 'explicit' | 'estimated' = 'estimated';
  let hasExplicitRegularPrice = false;

  if (matchedLens && matchedLens.retailPrice > 0) {
    // Normal listeden çekilen perakende ve toptan liste fiyatları
    baseRegularRetail = matchedLens.retailPrice;
    if (matchedLens.wholesalePrice > 0) {
      baseRegularWholesale = matchedLens.wholesalePrice;
    }
    matchedSource = 'catalog_match';
    hasExplicitRegularPrice = true;
  } else if (lens.regularPrice && lens.regularPrice > lens.retailPrice) {
    // Üründe tanımlı açık normal liste fiyatı
    baseRegularRetail = lens.regularPrice;
    if (lens.regularWholesalePrice && lens.regularWholesalePrice > 0) {
      baseRegularWholesale = lens.regularWholesalePrice;
    }
    matchedSource = 'explicit';
    hasExplicitRegularPrice = true;
  } else {
    // Tahmini standart katalog çarpanı
    baseRegularRetail = Math.round((lens.retailPrice * 1.35) / 10) * 10;
    if (lens.wholesalePrice > 0) {
      baseRegularWholesale = Math.round((lens.wholesalePrice * 1.35) / 10) * 10;
    }
    matchedSource = 'estimated';
  }

  // Toptan normal fiyat bulunamadıysa ama perakende varsa ve wholesalePrice varsa
  if (!baseRegularWholesale && lens.wholesalePrice > 0) {
    baseRegularWholesale = Math.round((lens.wholesalePrice * 1.35) / 10) * 10;
  }

  const multiplier = lens.productType === 'contact_lens' ? 1 : pairCount;
  const regularRetailPrice = baseRegularRetail * multiplier;
  const currentRetailPrice = (lens.retailPrice || 0) * multiplier;
  const savingsAmount = Math.max(0, regularRetailPrice - currentRetailPrice);
  const discountPercent = regularRetailPrice > 0 
    ? Math.round((savingsAmount / regularRetailPrice) * 100) 
    : 0;

  let wholesaleSavingsAmount: number | undefined;
  let wholesaleDiscountPercent: number | undefined;
  const regularWholesalePrice = baseRegularWholesale ? baseRegularWholesale * multiplier : undefined;

  if (regularWholesalePrice && lens.wholesalePrice > 0) {
    const currentWholesale = lens.wholesalePrice * multiplier;
    wholesaleSavingsAmount = Math.max(0, regularWholesalePrice - currentWholesale);
    wholesaleDiscountPercent = regularWholesalePrice > 0
      ? Math.round((wholesaleSavingsAmount / regularWholesalePrice) * 100)
      : 0;
  }

  return {
    isCampaign: true,
    campaignTitle,
    campaignPeriod,
    regularRetailPrice,
    regularWholesalePrice,
    discountPercent,
    savingsAmount,
    hasExplicitRegularPrice,
    matchedRegularLens: matchedLens || null,
    matchedRegularName: matchedLens ? matchedLens.name : undefined,
    matchedSource,
    wholesaleSavingsAmount,
    wholesaleDiscountPercent,
  };
}

