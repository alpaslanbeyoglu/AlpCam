import { Lens } from '../types';

export interface EnhancedLensSpecs {
  isContact: boolean;
  baseCurve: string;
  hasMultipleBaseCurves: boolean;
  baseCurveOptions: string[];
  diameter: string;
  waterContent: string;
  oxygenTransmissibility: string;
  material: string;
  uvProtection: string;
  boxContent: string;
  wearPeriodText: string;
  sphRangeText: string;
  cylMaxText?: string;
  index: string;
  abbeValue: number | string;
  density: string;
  frameCompatibility: string;
  highlightSpecs: { label: string; value: string; icon?: string }[];
}

/**
 * Computes or infers detailed technical specifications for both
 * contact lenses and optical eyeglass lenses based on industry data.
 */
export function getEnhancedLensSpecs(lens: Lens): EnhancedLensSpecs {
  const isContact =
    lens.productType === 'contact_lens' ||
    lens.category === 'contact_lens' ||
    Boolean(lens.wearPeriod || lens.baseCurve || lens.boxContent || lens.lensType);

  const nameLower = (lens.name || '').toLowerCase();
  const brandLower = (lens.brand || '').toLowerCase();
  const indexStr = lens.index || '1.50';
  const indexNum = parseFloat(indexStr) || 1.50;

  if (isContact) {
    // 1. Base Curve Detection (BC)
    let baseCurve = lens.baseCurve || '';
    let diameter = lens.diameter || '';
    let waterContent = lens.waterContent || '';
    let oxygen = lens.oxygenTransmissibility || '';
    let material = lens.material || '';
    let uv = lens.uvProtection || '';
    let box = lens.boxContent || '';
    let wearPeriodText = 'Aylık Değişim';

    if (lens.wearPeriod === 'daily' || nameLower.includes('1-day') || nameLower.includes('1 day') || nameLower.includes('daily') || nameLower.includes('oneday')) {
      wearPeriodText = 'Günlük Kullan-At';
    } else if (lens.wearPeriod === 'fortnightly' || nameLower.includes('oasys') || nameLower.includes('15 gün')) {
      wearPeriodText = '15 Günlük Değişim';
    } else if (lens.wearPeriod === 'yearly' || nameLower.includes('yıllık')) {
      wearPeriodText = 'Yıllık / Konvansiyonel';
    } else {
      wearPeriodText = 'Aylık Değişim';
    }

    // Infer famous contact lens specs if missing or standardize them
    if (nameLower.includes('oasys') && !nameLower.includes('1-day') && !nameLower.includes('1 day')) {
      if (!baseCurve) baseCurve = '8.4 / 8.8';
      if (!diameter) diameter = '14.0';
      if (!waterContent) waterContent = '%38 Su';
      if (!oxygen) oxygen = '147 Dk/t';
      if (!material) material = 'Senofilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 1 UV (%99.9 UVB, %96.1 UVA)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('oasys') && (nameLower.includes('1-day') || nameLower.includes('1 day'))) {
      if (!baseCurve) baseCurve = '8.5 / 9.0';
      if (!diameter) diameter = '14.3';
      if (!waterContent) waterContent = '%38 Su (HydraLuxe)';
      if (!oxygen) oxygen = '121 Dk/t';
      if (!material) material = 'Senofilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 1 UV (%99.9 UVB, %96.1 UVA)';
      if (!box) box = "30'lu Kutu";
    } else if (nameLower.includes('moist')) {
      if (!baseCurve) baseCurve = '8.5 / 9.0';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%58 Su (Lacreon)';
      if (!oxygen) oxygen = '28 Dk/t';
      if (!material) material = 'Etafilcon A (Hidrojel)';
      if (!uv) uv = 'Sınıf 2 UV (%97 UVB, %82 UVA)';
      if (!box) box = "30'lu Kutu";
    } else if (nameLower.includes('trueye')) {
      if (!baseCurve) baseCurve = '8.5 / 9.0';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%46 Su (Hydraclear 1)';
      if (!oxygen) oxygen = '118 Dk/t';
      if (!material) material = 'Narafilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 1 UV (%99.9 UVB, %96.1 UVA)';
      if (!box) box = "30'lu Kutu";
    } else if (nameLower.includes('vita')) {
      if (!baseCurve) baseCurve = '8.4 / 8.8';
      if (!diameter) diameter = '14.0';
      if (!waterContent) waterContent = '%41 Su (HydraMax)';
      if (!oxygen) oxygen = '147 Dk/t';
      if (!material) material = 'Senofilcon C (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 1 UV (%99.9 UVB, %96.1 UVA)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('biofinity') && nameLower.includes('toric')) {
      if (!baseCurve) baseCurve = '8.7';
      if (!diameter) diameter = '14.5';
      if (!waterContent) waterContent = '%48 Su (Aquaform)';
      if (!oxygen) oxygen = '116 Dk/t';
      if (!material) material = 'Comfilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'UV Korumalı';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('biofinity')) {
      if (!baseCurve) baseCurve = '8.6';
      if (!diameter) diameter = '14.0';
      if (!waterContent) waterContent = '%48 Su (Aquaform)';
      if (!oxygen) oxygen = '160 Dk/t';
      if (!material) material = 'Comfilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Yüksek Oksijen Geçirgenliği';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('air optix') && nameLower.includes('night')) {
      if (!baseCurve) baseCurve = '8.4 / 8.6';
      if (!diameter) diameter = '13.8';
      if (!waterContent) waterContent = '%24 Su (Aqua)';
      if (!oxygen) oxygen = '175 Dk/t';
      if (!material) material = 'Lotrafilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sürekli Gece-Gündüz Kullanım';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('air optix') && nameLower.includes('astigmatism')) {
      if (!baseCurve) baseCurve = '8.7';
      if (!diameter) diameter = '14.5';
      if (!waterContent) waterContent = '%33 Su (SmartShield)';
      if (!oxygen) oxygen = '108 Dk/t';
      if (!material) material = 'Lotrafilcon B (Silikon Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('air optix') || nameLower.includes('hydraglyde')) {
      if (!baseCurve) baseCurve = '8.6';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%33 Su (HydraGlyde)';
      if (!oxygen) oxygen = '138 Dk/t';
      if (!material) material = 'Lotrafilcon B (Silikon Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('total 1') || nameLower.includes('total1')) {
      if (!baseCurve) baseCurve = '8.5';
      if (!diameter) diameter = '14.1';
      if (!waterContent) waterContent = '%33-%80+ Su Gradyanı';
      if (!oxygen) oxygen = '156 Dk/t';
      if (!material) material = 'Delefilcon A (Su Gradyanlı)';
      if (!box) box = "30'lu Kutu";
    } else if (nameLower.includes('total 30') || nameLower.includes('total30')) {
      if (!baseCurve) baseCurve = '8.4';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%55-%100 Su Gradyanı';
      if (!oxygen) oxygen = '154 Dk/t';
      if (!material) material = 'Lehfilcon A (Su Gradyanlı Silikon)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('precision 1') || nameLower.includes('precision1')) {
      if (!baseCurve) baseCurve = '8.3';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%51 Su (SMARTSURFACE)';
      if (!oxygen) oxygen = '100 Dk/t';
      if (!material) material = 'Verofilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 1 UV (%90+ UVA, %99+ UVB)';
      if (!box) box = "30'lu Kutu";
    } else if (nameLower.includes('ultra') && brandLower.includes('bausch')) {
      if (!baseCurve) baseCurve = '8.5';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%46 Su (MoistureSeal)';
      if (!oxygen) oxygen = '163 Dk/t';
      if (!material) material = 'Samfilcon A (Silikon Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('purevision') && nameLower.includes('toric')) {
      if (!baseCurve) baseCurve = '8.9';
      if (!diameter) diameter = '14.5';
      if (!waterContent) waterContent = '%36 Su (HD Optik)';
      if (!oxygen) oxygen = '91 Dk/t';
      if (!material) material = 'Balafilcon A (Silikon Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('purevision')) {
      if (!baseCurve) baseCurve = '8.6';
      if (!diameter) diameter = '14.0';
      if (!waterContent) waterContent = '%36 Su (HD Optik)';
      if (!oxygen) oxygen = '130 Dk/t';
      if (!material) material = 'Balafilcon A (Silikon Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('soflens 38') || nameLower.includes('optima fw')) {
      if (!baseCurve) baseCurve = '8.4 / 8.7 / 9.0';
      if (!diameter) diameter = '14.0';
      if (!waterContent) waterContent = '%38.6 Su';
      if (!oxygen) oxygen = '24 Dk/t';
      if (!material) material = 'Polymacon (Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('soflens')) {
      if (!baseCurve) baseCurve = '8.6';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%59 Su';
      if (!oxygen) oxygen = '22 Dk/t';
      if (!material) material = 'Hilafilcon B (Hidrojel)';
      if (!box) box = "6'lı Kutu";
    } else if (nameLower.includes('clariti')) {
      if (!baseCurve) baseCurve = '8.6';
      if (!diameter) diameter = '14.1';
      if (!waterContent) waterContent = '%56 Su (WetLoc)';
      if (!oxygen) oxygen = '86 Dk/t';
      if (!material) material = 'Somofilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 2 UV Blokajı';
      if (!box) box = "30'lu Kutu";
    } else if (nameLower.includes('myday')) {
      if (!baseCurve) baseCurve = '8.4';
      if (!diameter) diameter = '14.2';
      if (!waterContent) waterContent = '%54 Su (Smart Silicone)';
      if (!oxygen) oxygen = '100 Dk/t';
      if (!material) material = 'Stenfilcon A (Silikon Hidrojel)';
      if (!uv) uv = 'Sınıf 1 UV Blokajı';
      if (!box) box = "30'lu Kutu";
    }

    // Default contact lens values if still empty
    if (!baseCurve) baseCurve = '8.6';
    if (!diameter) diameter = '14.2';
    if (!waterContent) waterContent = '%48 Su';
    if (!oxygen) oxygen = '100+ Dk/t';
    if (!material) material = 'Silikon Hidrojel';
    if (!box) box = "6'lı Kutu";

    const baseCurveOptions = baseCurve.split(/[\/,;]+/).map(s => s.trim()).filter(Boolean);
    const hasMultipleBaseCurves = baseCurveOptions.length > 1;

    const highlights = [
      { label: 'Temel Eğri (BC)', value: `${baseCurve} mm`, icon: '🎯' },
      { label: 'Çap (DIA)', value: `${diameter} mm`, icon: '📏' },
      { label: 'Su İçeriği', value: waterContent, icon: '💧' },
      { label: 'Oksijen (Dk/t)', value: oxygen, icon: '💨' },
      { label: 'Ambalaj', value: box, icon: '📦' },
    ];
    if (uv) highlights.push({ label: 'UV Koruması', value: uv, icon: '☀️' });

    return {
      isContact: true,
      baseCurve,
      hasMultipleBaseCurves,
      baseCurveOptions,
      diameter,
      waterContent,
      oxygenTransmissibility: oxygen,
      material,
      uvProtection: uv || 'UV Blokajı',
      boxContent: box,
      wearPeriodText,
      sphRangeText: lens.sphRange || '-0.50 / -10.00',
      cylMaxText: lens.cylMax ? `±${lens.cylMax}` : undefined,
      index: baseCurve,
      abbeValue: '-',
      density: '-',
      frameCompatibility: 'Kontakt Lens Uygulaması',
      highlightSpecs: highlights,
    };
  }

  // 2. Optical Eyeglass Lens Specs
  let abbeValue: number | string = lens.abbeValue || 58;
  let density = '1.32 g/cm³';
  let frameCompatibility = 'Tam & Yarım Çerçeve';
  let uv = lens.uvProtection || 'UV380';

  if (indexNum >= 1.74) {
    abbeValue = 33;
    density = '1.47 g/cm³';
    frameCompatibility = 'Tam Çerçeve (Ultra İnce)';
    uv = 'UV400 (%100 Koruma)';
  } else if (indexNum >= 1.67) {
    abbeValue = 32;
    density = '1.35 g/cm³';
    frameCompatibility = 'Tüm Çerçeveler & Faset Uyumlu';
    uv = 'UV400 (%100 Koruma)';
  } else if (indexNum >= 1.60) {
    abbeValue = 41;
    density = '1.30 g/cm³';
    frameCompatibility = 'Faset (Çerçevesiz) & Nilör İçin İdeal (Yüksek Direnç MR-8)';
    uv = 'UV400 (%100 Koruma)';
  } else if (indexStr === '1.59' || nameLower.includes('poly') || nameLower.includes('airwear')) {
    abbeValue = 31;
    density = '1.20 g/cm³';
    frameCompatibility = 'Kırılmaz / Spor / Çocuk Çerçeveleri';
    uv = 'UV400 (%100 Koruma)';
  } else if (indexStr === '1.53' || nameLower.includes('trivex') || nameLower.includes('pnx') || nameLower.includes('t-rex')) {
    abbeValue = 45;
    density = '1.11 g/cm³ (Ultra Hafif)';
    frameCompatibility = 'Faset (Çerçevesiz) İçin En Güvenli Kırılmaz Materyal';
    uv = 'UV400 (%100 Koruma)';
  } else if (indexNum >= 1.56) {
    abbeValue = 38;
    density = '1.28 g/cm³';
    frameCompatibility = 'Tam Çerçeve';
    uv = 'UV400';
  } else {
    // 1.50
    abbeValue = 58;
    density = '1.32 g/cm³';
    frameCompatibility = 'Tam Çerçeve (Yüksek Optik Netlik)';
    uv = lens.coating?.toLowerCase().includes('uv') ? 'UV400 Filtreli' : 'UV380 Standart';
  }

  const highlights = [
    { label: 'Kırılma İndeksi', value: `${indexStr} İndeks`, icon: '💎' },
    { label: 'Abbe Değeri', value: `${abbeValue} Abbe`, icon: '🌈' },
    { label: 'UV Koruması', value: uv, icon: '☀️' },
    { label: 'Özgül Ağırlık', value: density, icon: '⚖️' },
    { label: 'Çap (Ø)', value: lens.diameter ? `Ø ${lens.diameter} mm` : 'Ø 65 / 70 / 75 mm', icon: '📏' },
  ];

  return {
    isContact: false,
    baseCurve: '',
    hasMultipleBaseCurves: false,
    baseCurveOptions: [],
    diameter: lens.diameter || '65/70/75',
    waterContent: '',
    oxygenTransmissibility: '',
    material: lens.material || 'Organik CR-39',
    uvProtection: uv,
    boxContent: '',
    wearPeriodText: '',
    sphRangeText: lens.sphRange || '-8.00 / +6.00',
    cylMaxText: lens.cylMax !== undefined ? `±${lens.cylMax}` : undefined,
    index: indexStr,
    abbeValue,
    density,
    frameCompatibility,
    highlightSpecs: highlights,
  };
}
