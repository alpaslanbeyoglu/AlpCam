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

export const DISTRIBUTORS_LIST: DistributorInfo[] = [
  {
    id: 'lens_medikal',
    name: 'Lens Medikal',
    shortName: 'Lens Medikal',
    description: 'Bausch + Lomb (PureVision, Ultra, SofLens, Biotrue) ve özel medikal kontakt lens serilerinin Türkiye ana dağıtıcısı.',
    brands: ['Bausch + Lomb', 'Lens Medikal', 'PureVision', 'Ultra', 'Biotrue', 'SofLens'],
    productType: 'contact_lens',
    country: 'Türkiye',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    badgeStyle: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-800',
      border: 'border-cyan-200',
      accent: '#0891b2',
    },
    website: 'https://www.lensmedikal.com',
  },
  {
    id: 'hoya_seiko',
    name: 'HOYA Vision Care & Seiko Optical',
    shortName: 'HOYA / Seiko',
    description: 'HOYA Corporation bünyesinde küresel ortaklık ve ortak dağıtım ağına sahip premium Japon optik cam markaları.',
    brands: ['Hoya', 'HOYA', 'Seiko', 'Seiko Optical'],
    productType: 'eyeglass_lens',
    country: 'Japonya / TR',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-300',
    badgeStyle: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      border: 'border-blue-300',
      accent: '#1e40af',
    },
  },
  {
    id: 'beta_optik_novax',
    name: 'Beta Optik (Novax)',
    shortName: 'Beta Optik / Novax',
    description: 'Novax markası ve FreeForm RX özel üretim dijital camların yerli ve uluslararası üretici & dağıtıcısı.',
    brands: ['Novax', 'Beta Optik', 'FreeForm'],
    productType: 'eyeglass_lens',
    country: 'Türkiye',
    badgeColor: 'bg-violet-50 text-violet-800 border-violet-200',
    badgeStyle: {
      bg: 'bg-violet-50',
      text: 'text-violet-800',
      border: 'border-violet-200',
      accent: '#7c3aed',
    },
  },
  {
    id: 'zeiss_group',
    name: 'Carl Zeiss Vision (Zeiss Group)',
    shortName: 'Carl Zeiss',
    description: 'Alman hassas optik devi Carl Zeiss Vision Türkiye doğrudan distribütörlüğü ve premium cam serileri.',
    brands: ['Zeiss', 'Carl Zeiss'],
    productType: 'eyeglass_lens',
    country: 'Almanya / TR',
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    badgeStyle: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-900',
      border: 'border-indigo-300',
      accent: '#3730a3',
    },
  },
  {
    id: 'coopervision_tr',
    name: 'CooperVision Türkiye',
    shortName: 'CooperVision',
    description: 'Biofinity, Clariti, MyDay, Biomedics, Avaira ve Proclear kontakt lens ailelerinin doğrudan Türkiye distribütörlüğü.',
    brands: ['CooperVision', 'Biofinity', 'Clariti', 'MyDay', 'Biomedics', 'Avaira', 'Proclear', 'Optimity'],
    productType: 'contact_lens',
    country: 'ABD / TR',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeStyle: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      accent: '#059669',
    },
  },
  {
    id: 'opsa_optik',
    name: 'Opsa Optik & Kozmetik',
    shortName: 'Opsa Optik',
    description: 'Desio Italy renkli lensleri, Adore serisi ve Opsa Lens medikal & kozmetik lenslerinin Türkiye tek yetkili dağıtıcısı.',
    brands: ['Opsa Lens', 'Desio', 'Adore', 'Opsa'],
    productType: 'contact_lens',
    country: 'Türkiye / İtalya',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeStyle: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      accent: '#e11d48',
    },
  },
  {
    id: 'essilor_luxottica',
    name: 'EssilorLuxottica Türkiye',
    shortName: 'EssilorLuxottica',
    description: 'Essilor, Varilux, Crizal, Eyezen ve Kodak Lens markalarının birleşik küresel optik grubu ve dağıtıcısı.',
    brands: ['Essilor', 'Kodak', 'Varilux', 'Crizal', 'Eyezen'],
    productType: 'eyeglass_lens',
    country: 'Fransa / TR',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
    badgeStyle: {
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      accent: '#0284c7',
    },
  },
  {
    id: 'merve_optik',
    name: 'Merve Optik (Hawk Plus)',
    shortName: 'Merve Optik',
    description: 'Hawk Plus ve geniş stok cam ürün gamının Türkiye genel dağıtım ağı.',
    brands: ['Hawk Plus', 'Hawk', 'Merve Optik'],
    productType: 'eyeglass_lens',
    country: 'Türkiye',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeStyle: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      accent: '#d97706',
    },
  },
  {
    id: 'rodenstock_tr',
    name: 'Rodenstock Türkiye',
    shortName: 'Rodenstock',
    description: 'B.I.G. EXACT biyometrik akıllı cam teknolojisi ve Alman Rodenstock premium camlarının dağıtıcısı.',
    brands: ['Rodenstock'],
    productType: 'eyeglass_lens',
    country: 'Almanya / TR',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeStyle: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      accent: '#334155',
    },
  },
  {
    id: 'alcon_tr',
    name: 'Alcon Vision Care Türkiye',
    shortName: 'Alcon',
    description: 'Air Optix, Dailies Total 1, Total 30 ve Precision 1 kontakt lens ürünlerinin doğrudan dağıtıcısı.',
    brands: ['Alcon', 'Air Optix', 'Dailies', 'Total 30', 'Precision1'],
    productType: 'contact_lens',
    country: 'İsviçre / TR',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    badgeStyle: {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      accent: '#0d9488',
    },
  },
  {
    id: 'jj_vision',
    name: 'Johnson & Johnson Vision',
    shortName: 'J&J Vision (Acuvue)',
    description: 'Acuvue Oasys, Acuvue Moist ve Acuvue Vita kontakt lens ailelerinin küresel sağlık grubu dağıtıcısı.',
    brands: ['Johnson & Johnson', 'Acuvue'],
    productType: 'contact_lens',
    country: 'ABD / TR',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeStyle: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      accent: '#2563eb',
    },
  },
  {
    id: 'isbir_optik',
    name: 'İşbir Optik & VisionArt',
    shortName: 'İşbir Optik',
    description: 'VisionArt ve İşbir yerli & uluslararası cam serilerinin köklü üretici ve dağıtım kuruluşu.',
    brands: ['İşbir', 'VisionArt'],
    productType: 'eyeglass_lens',
    country: 'Türkiye',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    badgeStyle: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      accent: '#047857',
    },
  },
  {
    id: 'shamir_tr',
    name: 'Shamir Optic Türkiye',
    shortName: 'Shamir Optic',
    description: 'Autograph Intelligence, Alsha ve yenilikçi RX progresif cam teknolojilerinin dağıtıcısı.',
    brands: ['Shamir'],
    productType: 'eyeglass_lens',
    country: 'İsrail / TR',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeStyle: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      accent: '#10b981',
    },
  },
  {
    id: 'fuji_optik',
    name: 'Fuji Optik',
    shortName: 'Fuji Optik',
    description: 'Fuji ve Japon tasarım optik cam çeşitlerinin Türkiye dağıtımı.',
    brands: ['Fuji', 'FUJİ'],
    productType: 'eyeglass_lens',
    country: 'Japonya / TR',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
    badgeStyle: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200',
      accent: '#dc2626',
    },
  },
  {
    id: 'opak_lens',
    name: 'Opak Lens Dağıtım',
    shortName: 'Opak Lens',
    description: 'Geniş bağımsız optik ağı, Elegance ve çoklu marka kontakt lens & solüsyon tedarikçisi.',
    brands: ['Opak Lens', 'Elegance', 'GP Lens'],
    productType: 'contact_lens',
    country: 'Türkiye',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    badgeStyle: {
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      accent: '#9333ea',
    },
  },
];

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

  // Return brand name itself as general distributor if no match
  return brandName || 'Genel Dağıtım';
}

/**
 * Dağıtıcı adına göre meta bilgisini çeker
 */
export function getDistributorInfo(distName?: string): DistributorInfo | undefined {
  if (!distName) return undefined;
  const lower = distName.toLowerCase();
  return DISTRIBUTORS_LIST.find(
    (d) =>
      d.name.toLowerCase() === lower ||
      d.shortName.toLowerCase() === lower ||
      d.id.toLowerCase() === lower ||
      lower.includes(d.shortName.toLowerCase()) ||
      d.brands.some((b) => b.toLowerCase() === lower)
  );
}
