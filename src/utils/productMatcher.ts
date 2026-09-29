import { Lens } from '../types';
import { sanitizeLens, normalizeBrandName, isContactLensSolution } from './pricing';

/**
 * Normalizes text for robust matching by removing punctuation, accents, and extra whitespace.
 */
export function normalizeProductText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generates a unique, deterministic fingerprint for a product so that updated price lists
 * can automatically identify the same product across different scans/imports.
 */
export function getProductFingerprint(lens: Partial<Lens>): string {
  const sanitized = sanitizeLens(lens as Lens);
  const brand = normalizeBrandName(sanitized.brand) || 'genel';
  const name = normalizeProductText(sanitized.name);
  const index = sanitized.index ? sanitized.index.replace(/[^0-9.]/g, '') : '';
  const category = sanitized.category || 'single_vision';
  const deliveryType = sanitized.deliveryType || 'stock';
  const productType = sanitized.productType || (isContactLensSolution(sanitized) ? 'solution' : 'eyeglass_lens');

  // If product has a distinctive product code or barcode, incorporate it
  const productCode = sanitized.productCode ? normalizeProductText(sanitized.productCode) : '';

  if (productCode && productCode.length >= 4) {
    return `${normalizeProductText(brand)}_${productCode}`;
  }

  return `${normalizeProductText(brand)}_${name}_${index}_${category}_${deliveryType}_${productType}`;
}

export interface SmartMergeResult {
  merged: Lens[];
  updatedCount: number;
  addedCount: number;
  supersededOldIds: string[];
}

/**
 * Merges incoming lenses with the existing catalog:
 * - If a product already exists (same fingerprint or same ID):
 *   Updates its price (wholesalePrice, retailPrice), currency, notes, deliveryType, updatedAt.
 * - Supersedes and cleans up old duplicates.
 * - Adds completely new products.
 */
export function smartMergeCatalog(
  existingCatalog: Lens[],
  incomingLenses: Lens[]
): SmartMergeResult {
  const existingMap = new Map<string, Lens>();
  const fingerprintToExistingMap = new Map<string, Lens[]>();

  // Index existing lenses
  existingCatalog.forEach((lens) => {
    const sanitized = sanitizeLens(lens);
    existingMap.set(sanitized.id, sanitized);

    const fp = getProductFingerprint(sanitized);
    const list = fingerprintToExistingMap.get(fp) || [];
    list.push(sanitized);
    fingerprintToExistingMap.set(fp, list);
  });

  const updatedIds = new Set<string>();
  const supersededOldIds: string[] = [];
  let updatedCount = 0;
  let addedCount = 0;

  const resultCatalogMap = new Map<string, Lens>();
  // Populate initially with existing lenses
  existingCatalog.forEach((l) => resultCatalogMap.set(l.id, l));

  // Process incoming lenses
  incomingLenses.forEach((incoming) => {
    const sanitizedIncoming = sanitizeLens(incoming);
    const fp = getProductFingerprint(sanitizedIncoming);
    const matchedExistingList = fingerprintToExistingMap.get(fp) || [];

    // Also check direct ID match
    const directIdMatch = existingMap.get(sanitizedIncoming.id);

    if (directIdMatch || matchedExistingList.length > 0) {
      // Choose primary existing record to update
      const targetExisting = directIdMatch || matchedExistingList[0];
      
      const updatedLens: Lens = {
        ...targetExisting,
        ...sanitizedIncoming,
        id: targetExisting.id, // Keep existing ID for continuity
        wholesalePrice: sanitizedIncoming.wholesalePrice !== undefined && sanitizedIncoming.wholesalePrice > 0 
          ? sanitizedIncoming.wholesalePrice 
          : targetExisting.wholesalePrice,
        retailPrice: sanitizedIncoming.retailPrice !== undefined && sanitizedIncoming.retailPrice > 0 
          ? sanitizedIncoming.retailPrice 
          : targetExisting.retailPrice,
        currency: sanitizedIncoming.currency || targetExisting.currency || 'TRY',
        deliveryType: sanitizedIncoming.deliveryType || targetExisting.deliveryType,
        notes: sanitizedIncoming.notes || targetExisting.notes,
        updatedAt: new Date().toISOString(),
      };

      resultCatalogMap.set(targetExisting.id, updatedLens);
      updatedIds.add(targetExisting.id);
      updatedCount++;

      // If there were extra duplicate records for this product in the old catalog, mark them for removal
      matchedExistingList.forEach((extra) => {
        if (extra.id !== targetExisting.id) {
          resultCatalogMap.delete(extra.id);
          supersededOldIds.push(extra.id);
        }
      });
    } else {
      // New product
      const newId = sanitizedIncoming.id || `lens_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newLens: Lens = {
        ...sanitizedIncoming,
        id: newId,
        updatedAt: new Date().toISOString(),
      };
      resultCatalogMap.set(newId, newLens);
      addedCount++;
    }
  });

  return {
    merged: Array.from(resultCatalogMap.values()),
    updatedCount,
    addedCount,
    supersededOldIds,
  };
}
