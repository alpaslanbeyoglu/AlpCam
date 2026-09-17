export interface DistributorInfo {
  id: string;
  name: string;             // Tam Dağıtıcı / Üst Firma Adı (örn: Lens Medikal, HOYA Vision Care & Seiko)
  shortName: string;        // Kısa ad (örn: Lens Medikal, HOYA / Seiko)
  description: string;      // Dağıtıcı açıklaması ve portföy bilgisi
  brands: string[];         // Bünyesindeki markalar
  productType: 'all' | 'eyeglass_lens' | 'contact_lens';
  country?: string;
  badgeColor?: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    accent: string;
  };
  contactInfo?: string;
  website?: string;
}

import { INITIAL_DISTRIBUTORS_LIST } from './initialDistributors';
import { loadStoredDistributors } from '../utils/storage';

/**
 * Bir marka veya ürün adı verildiğinde varsayılan Dağıtıcı / Üst Firma bilgisini otomatik tespit eder
 */
export function getDistributorForBrand(
  brandName?: string,
  lensName?: string,
  existingDistributor?: string
): string {
  if (existingDistributor && existingDistributor.trim()) {
    return existingDistributor.trim();
  }

  const brand = (brandName || '').toLowerCase().trim();
  const name = (lensName || '').toLowerCase().trim();
  const combined = `${brand} ${name}`;

  // 0. Check dynamic distributors from storage/definitions first
  const storedDistributors = loadStoredDistributors();
  const matchedStored = storedDistributors.find(d => 
    d.brands.some(b => {
      const bLow = b.toLowerCase();
      return brand === bLow || name.includes(bLow) || combined.includes(bLow);
    })
  );
  if (matchedStored) return matchedStored.name;

  // 1. Lens Medikal (Bausch + Lomb, PureVision, Ultra, SofLens, Biotrue)
  if (
    brand.includes('lens medikal') ||
    brand.includes('bausch') ||
    combined.includes('purevision') ||
    combined.includes('soflens') ||
    combined.includes('biotrue') ||
    combined.includes('ultra b+l') ||
    combined.includes('ultra kontakt')
  ) {
    return 'Lens Medikal';
  }

  // 2. HOYA & Seiko (Ortak çalışan grup)
  if (
    brand.includes('hoya') ||
    brand.includes('seiko') ||
    combined.includes('hilux') ||
    combined.includes('nulux') ||
    combined.includes('hoyalux') ||
    combined.includes('hi-vision') ||
    combined.includes('super resistant') ||
    combined.includes('seiko prime') ||
    combined.includes('seiko curved') ||
    combined.includes('seiko brilliance')
  ) {
    return 'HOYA Vision Care & Seiko Optical';
  }

  // 3. Beta Optik (Novax)
  if (
    brand.includes('novax') ||
    brand.includes('beta optik') ||
    combined.includes('novax')
  ) {
    return 'Beta Optik (Novax)';
  }

  // 4. Carl Zeiss Vision (Zeiss Group)
  if (
    brand.includes('zeiss') ||
    combined.includes('duravision') ||
    combined.includes('lotutec') ||
    combined.includes('clarlet') ||
    combined.includes('energizeme')
  ) {
    return 'Carl Zeiss Vision (Zeiss Group)';
  }

  // 5. CooperVision Türkiye
  if (
    brand.includes('cooper') ||
    brand === 'cv' ||
    brand.startsWith('cv ') ||
    combined.includes('biofinity') ||
    combined.includes('clariti') ||
    combined.includes('myday') ||
    combined.includes('avaira') ||
    combined.includes('biomedics') ||
    combined.includes('proclear') ||
    combined.includes('optimity')
  ) {
    return 'CooperVision Türkiye';
  }

  // 6. Opsa Optik (Desio, Adore, Opsa)
  if (
    brand.includes('opsa') ||
    brand.includes('desio') ||
    brand.includes('adore') ||
    combined.includes('desio') ||
    combined.includes('adore')
  ) {
    return 'Opsa Optik & Kozmetik';
  }

  // 7. EssilorLuxottica (Essilor, Kodak, Varilux, Crizal)
  if (
    brand.includes('essilor') ||
    brand.includes('kodak') ||
    combined.includes('varilux') ||
    combined.includes('crizal') ||
    combined.includes('eyezen') ||
    combined.includes('ormex') ||
    combined.includes('airwear')
  ) {
    return 'EssilorLuxottica Türkiye';
  }

  // 8. Merve Optik (Hawk Plus)
  if (
    brand.includes('hawk') ||
    brand.includes('merve optik') ||
    combined.includes('hawk plus')
  ) {
    return 'Merve Optik (Hawk Plus)';
  }

  // 9. Rodenstock Türkiye
  if (
    brand.includes('rodenstock') ||
    combined.includes('solitaire') ||
    combined.includes('multigressiv') ||
    combined.includes('impression')
  ) {
    return 'Rodenstock Türkiye';
  }

  // 10. Alcon Vision Care
  if (
    brand.includes('alcon') ||
    combined.includes('air optix') ||
    combined.includes('dailies') ||
    combined.includes('total 30') ||
    combined.includes('precision 1') ||
    combined.includes('freshlook')
  ) {
    return 'Alcon Vision Care Türkiye';
  }

  // 11. Johnson & Johnson Vision
  if (
    brand.includes('johnson') ||
    brand.includes('acuvue') ||
    combined.includes('acuvue') ||
    combined.includes('oasys')
  ) {
    return 'Johnson & Johnson Vision';
  }

  // 12. İşbir Optik & VisionArt
  if (
    brand.includes('işbir') ||
    brand.includes('isbir') ||
    brand.includes('visionart') ||
    combined.includes('visionart')
  ) {
    return 'İşbir Optik & VisionArt';
  }

  // 13. Shamir Optic
  if (brand.includes('shamir') || combined.includes('autograph') || combined.includes('alsha')) {
    return 'Shamir Optic Türkiye';
  }

  // 14. Fuji Optik
  if (brand.includes('fuji') || brand.includes('fujı')) {
    return 'Fuji Optik';
  }

  // 15. Opak Lens
  if (brand.includes('opak') || brand.includes('elegance')) {
    return 'Opak Lens Dağıtım';
  }

  // Fallback to initial list if not found in stored
  const initialMatched = INITIAL_DISTRIBUTORS_LIST.find(d => 
    d.brands.some(b => {
      const bLow = b.toLowerCase();
      return brand === bLow || name.includes(bLow) || combined.includes(bLow);
    })
  );
  if (initialMatched) return initialMatched.name;

  // Return brand name itself as general distributor if no match
  return brandName || 'Genel Dağıtım';
}

/**
 * Dağıtıcı adına göre meta bilgisini çeker (dinamik depolama destekli)
 */
export function getDistributorInfo(distName?: string): DistributorInfo | undefined {
  if (!distName) return undefined;
  const list = loadStoredDistributors();
  const lower = distName.toLowerCase();
  return list.find(
    (d) =>
      d.name.toLowerCase() === lower ||
      d.shortName?.toLowerCase() === lower ||
      d.id.toLowerCase() === lower ||
      (d.shortName && lower.includes(d.shortName.toLowerCase())) ||
      d.brands.some((b) => b.toLowerCase() === lower || lower.includes(b.toLowerCase()))
  );
}

export const DISTRIBUTORS_LIST = INITIAL_DISTRIBUTORS_LIST;
