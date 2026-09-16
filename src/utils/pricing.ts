import { Lens, BrandDiscount, LensFinancials } from '../types';

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
  const multiplier = pairCount;

  const singleWholesaleList = Number(lens.wholesalePrice) || 0;
  const singleRetail = customRetailPrice !== undefined ? Number(customRetailPrice) : Number(lens.retailPrice) || 0;

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
    pairCount,
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
