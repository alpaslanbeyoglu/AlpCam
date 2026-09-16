import { Lens, BrandDiscount, LensFinancials } from '../types';
import { getDistributorForBrand } from '../data/distributors';

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

  // Perakende listelerden gelen ürünlerde toptan liste fiyatı belirtilmemişse,
  // liste (perakende) fiyatı üzerinden marka iskontosu uygulanarak net alış hesaplanır.
  if (singleWholesaleList === 0 && singleRetail > 0) {
    singleWholesaleList = singleRetail;
  }

  const wholesaleListPrice = singleWholesaleList * multiplier;
  const netWholesaleCost = wholesaleListPrice * (1 - rate / 100);
  const retailPrice = singleRetail * multiplier;
  const profitAmount = retailPrice - netWholesaleCost;
  const profitMarginPercent = retailPrice > 0 ? (profitAmount / retailPrice) * 100 : 0;

  return {
    wholesaleListPrice: Math.round(wholesaleListPrice),
    effectiveDiscountRate: rate,
    netWholesaleCost: Math.round(netWholesaleCost),
    retailPrice: Math.round(retailPrice),
    profitAmount: Math.round(profitAmount),
    profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
    pairCount: (isContact ? 1 : pairCount) as 1 | 2,
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
  return {
    ...lens,
    brand: normBrand || lens.brand,
    distributor: finalDistributor,
    productType: isContact ? 'contact_lens' : 'eyeglass_lens',
    category: isContact ? 'contact_lens' : lens.category,
  };
}

/**
 * Türkçe Para Formatı (₺)
 */
export function formatCurrency(amount: number, currency: string = 'TRY'): string {
  const val = Math.round(Number(amount) || 0);
  const formatted = val.toLocaleString('tr-TR');
  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'EUR') return `€${formatted}`;
  return `₺${formatted}`;
}
