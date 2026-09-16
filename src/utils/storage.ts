import { Lens, BrandDiscount, CustomList, DriveSyncConfig } from '../types';
import { INITIAL_LENSES } from '../data/initialLenses';
import { INITIAL_DISCOUNTS } from '../data/initialDiscounts';

const KEYS = {
  LENSES: 'optik_lenses_v1',
  DISCOUNTS: 'optik_brand_discounts_v1',
  CUSTOM_LISTS: 'optik_custom_lists_v1',
  DRIVE_CONFIG: 'optik_drive_config_v1',
  CUSTOMER_MODE: 'optik_customer_mode_v1',
  PAIR_SELECTION: 'optik_pair_count_v1',
  ADMIN_PIN: 'optik_admin_pin_v1',
  IS_ADMIN: 'optik_is_admin_session_v1',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load lenses from storage:', err);
  }
  return INITIAL_LENSES;
}

export function saveStoredLenses(lenses: Lens[]): void {
  try {
    localStorage.setItem(KEYS.LENSES, JSON.stringify(lenses));
  } catch (err) {
    console.error('Failed to save lenses to storage:', err);
  }
}

export function loadStoredDiscounts(): BrandDiscount[] {
  try {
    const raw = localStorage.getItem(KEYS.DISCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load discounts from storage:', err);
  }
  return INITIAL_DISCOUNTS;
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
  return [
    {
      id: 'default-vitrin-list',
      name: 'Vitrin & Çok Satanlar',
      description: 'Mağazada en çok önerdiğimiz popüler cam paketleri',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: 'item-1',
          lensId: 'essilor-ormix-160-sapphire-hr',
          lensSnapshot: INITIAL_LENSES[2],
          quantity: 2,
          customRetailPrice: 3200,
          notes: 'Vidalı ve nilör çerçeveler için tavsiye',
        },
        {
          id: 'item-2',
          lensId: 'zeiss-clearview-160-blueprotect',
          lensSnapshot: INITIAL_LENSES[9],
          quantity: 2,
          customRetailPrice: 3800,
          notes: 'Masa başı ve bilgisayar kullanıcıları',
        },
      ],
    },
  ];
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
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load drive config:', err);
  }
  return {
    sourceUrl: '',
    sourceType: 'sheet_csv',
    autoSyncOnLoad: false,
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
