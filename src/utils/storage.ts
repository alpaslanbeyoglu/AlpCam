import { Lens, BrandDiscount, CustomList, DriveSyncConfig } from '../types';
import { INITIAL_LENSES } from '../data/initialLenses';
import { INITIAL_DISCOUNTS } from '../data/initialDiscounts';
import { sanitizeLens, normalizeBrandName } from './pricing';
import { DistributorInfo } from '../data/distributors';
import { INITIAL_DISTRIBUTORS_LIST } from '../data/initialDistributors';

const KEYS = {
  LENSES: 'optik_lenses_v1',
  DISCOUNTS: 'optik_brand_discounts_v1',
  CUSTOM_LISTS: 'optik_custom_lists_v1',
  DRIVE_CONFIG: 'optik_drive_config_v1',
  CUSTOMER_MODE: 'optik_customer_mode_v1',
  PAIR_SELECTION: 'optik_pair_count_v1',
  ADMIN_PIN: 'optik_admin_pin_v1',
  IS_ADMIN: 'optik_is_admin_session_v1',
  DISTRIBUTORS: 'optik_distributors_v1',
};

const DEFAULT_ADMIN_PIN = '1923';

export function loadAdminPin(): string {
  try {
    const pin = localStorage.getItem(KEYS.ADMIN_PIN);
    return pin ? pin.trim() : DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
}

export function saveAdminPin(pin: string): void {
  try {
    localStorage.setItem(KEYS.ADMIN_PIN, pin.trim());
  } catch (err) {
    console.error('Failed to save admin pin:', err);
  }
}

export function loadIsAdminSession(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.IS_ADMIN);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return false;
  }
}

export function saveIsAdminSession(isAdmin: boolean): void {
  try {
    localStorage.setItem(KEYS.IS_ADMIN, JSON.stringify(isAdmin));
  } catch (err) {
    console.error('Failed to save admin session:', err);
  }
}

export function loadStoredLenses(): Lens[] {
  try {
    const raw = localStorage.getItem(KEYS.LENSES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitizedList = parsed.map(sanitizeLens);
        saveStoredLenses(sanitizedList);
        return sanitizedList;
      }
    }
  } catch (err) {
    console.error('Failed to load lenses from storage:', err);
  }
  return [];
}

export function saveStoredLenses(lenses: Lens[]): void {
  try {
    const sanitized = lenses.map(sanitizeLens);
    localStorage.setItem(KEYS.LENSES, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save lenses to storage:', err);
  }
}

export function loadStoredDiscounts(): BrandDiscount[] {
  try {
    const raw = localStorage.getItem(KEYS.DISCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load discounts from storage:', err);
  }
  return [];
}

export function saveStoredDiscounts(discounts: BrandDiscount[]): void {
  try {
    localStorage.setItem(KEYS.DISCOUNTS, JSON.stringify(discounts));
  } catch (err) {
    console.error('Failed to save discounts to storage:', err);
  }
}

export function loadStoredCustomLists(): CustomList[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_LISTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load custom lists from storage:', err);
  }
  return [];
}

export function saveStoredCustomLists(lists: CustomList[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOM_LISTS, JSON.stringify(lists));
  } catch (err) {
    console.error('Failed to save custom lists to storage:', err);
  }
}

export function loadStoredDriveConfig(): DriveSyncConfig {
  try {
    const raw = localStorage.getItem(KEYS.DRIVE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.sourceUrl) {
        const isFolder = parsed.sourceUrl.includes('/folders/');
        return {
          ...parsed,
          autoSyncOnLoad: isFolder ? false : Boolean(parsed.autoSyncOnLoad),
        };
      }
    }
  } catch (err) {
    console.error('Failed to load drive config:', err);
  }
  return {
    sourceUrl: 'https://drive.google.com/drive/folders/1Euefi9y_ngCtzEVcOs4mi2cJZKHZ-SBB?usp=sharing',
    sourceType: 'sheet_csv',
    autoSyncOnLoad: false,
    lastSyncTime: new Date().toISOString(),
    lastSyncItemCount: 45,
  };
}

export function saveStoredDriveConfig(config: DriveSyncConfig): void {
  try {
    localStorage.setItem(KEYS.DRIVE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save drive config:', err);
  }
}

export function loadCustomerMode(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOMER_MODE);
    return raw ? JSON.parse(raw) : false;
  } catch {
    return false;
  }
}

export function saveCustomerMode(isCustomerMode: boolean): void {
  try {
    localStorage.setItem(KEYS.CUSTOMER_MODE, JSON.stringify(isCustomerMode));
  } catch (err) {
    console.error('Failed to save customer mode:', err);
  }
}

export function loadPairCount(): 1 | 2 {
  try {
    const raw = localStorage.getItem(KEYS.PAIR_SELECTION);
    return raw === '1' ? 1 : 2;
  } catch {
    return 2;
  }
}

export function savePairCount(pairCount: 1 | 2): void {
  try {
    localStorage.setItem(KEYS.PAIR_SELECTION, String(pairCount));
  } catch (err) {
    console.error('Failed to save pair count:', err);
  }
}

export function loadStoredDistributors(): DistributorInfo[] {
  try {
    const raw = localStorage.getItem(KEYS.DISTRIBUTORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load distributors from storage:', err);
  }
  // Return the default initial distributors list if empty or never saved
  return INITIAL_DISTRIBUTORS_LIST;
}

export function saveStoredDistributors(distributors: DistributorInfo[]): void {
  try {
    localStorage.setItem(KEYS.DISTRIBUTORS, JSON.stringify(distributors));
  } catch (err) {
    console.error('Failed to save distributors to storage:', err);
  }
}

export function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanUndefined(obj[key]);
    }
  }
  return cleaned;
}

