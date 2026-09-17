export type ProductType = 'eyeglass_lens' | 'contact_lens';

export type LensCategory = 
  | 'single_vision' // Tek Odaklı
  | 'progressive'   // Progresif
  | 'office'        // Ofis / Yakın-Orta
  | 'bifocal'       // Bifokal
  | 'sun_polarized' // Güneş / Polarize
  | 'photochromic'  // Fotokromik (Transitions)
  | 'drive'         // Sürüş Camı
  | 'custom_rx'     // Özel Üretim
  | 'contact_lens'; // Kontakt Lens

export type LensIndex = '1.50' | '1.53' | '1.56' | '1.59' | '1.60' | '1.67' | '1.74' | '1.80' | '1.90';

export interface Lens {
  id: string;
  distributor?: string;     // Dağıtıcı / Üst Firma / Distribütör (örn: Lens Medikal, HOYA Vision Care & Seiko, Carl Zeiss Vision, Beta Optik (Novax), Opsa Optik, CooperVision Türkiye)
  brand: string;            // Marka (Essilor, Zeiss, Shamir, Hoya, Kodak, Novax, CooperVision, vb.)
  name: string;             // Model / Ürün Adı (örn: Varilux Comfort Max veya Biofinity XR)
  productType?: ProductType;// Ürün Türü: 'eyeglass_lens' (Gözlük Camı) veya 'contact_lens' (Kontakt Lens)
  category: LensCategory;   // Kategori
  index: string;            // Kırılma İndeksi (1.50, 1.56, 1.60, 1.67, 1.74) veya Kontakt Lens BC/Özellik
  material: string;         // Hammadde (Organik CR-39, MR-8, Silikon Hidrojel, vb.)
  coating: string;          // Kaplama veya Yüzey Teknolojisi (Antirefle, Crizal, Aquaform, vb.)
  wholesalePrice: number;   // TOPTAN Liste Fiyatı (Alış - KDV hariç veya dahil liste fiyatı)
  retailPrice: number;      // PERAKENDE Tavsiye Edilen Satış Fiyatı (Müşteri liste fiyatı)
  currency: 'TRY' | 'USD' | 'EUR';
  sphRange?: string;        // Sferik Aralık (örn: -6.00 / +6.00 veya -12.00 / +8.00)
  cylMax?: number;          // Maksimum Silindirik (örn: 2.00 veya 4.00)
  diameter?: string;        // Çap / DIA (örn: 65/70/75 veya 14.2)
  baseCurve?: string;       // Temel Eğri / BC (Kontakt Lensler için örn: 8.4, 8.6, 8.8)
  boxContent?: string;      // Kutu İçeriği (örn: 6'lı Kutu, 30'lu Kutu, Tek Şişe)
  wearPeriod?: 'daily' | 'monthly' | 'yearly' | 'fortnightly'; // Değişim Sıklığı: Günlük, Aylık, Yıllık, 15 Günlük
  lensType?: 'spheric' | 'toric' | 'multifocal' | 'color'; // Kontakt Lens Tipi: Sferik, Torik (Astigmat), Multifokal, Renkli
  deliveryType: 'stock' | 'rx'; // Stok Cam/Lens (Aynı gün) vs RX Özel Üretim (3-5 gün)
  notes?: string;           // Açıklama / Özellikler
  productCode?: string;     // Liste / Ürün Kodu (örn: JLM01337-50 veya SO077L)
  costCode?: string;        // Kod içindeki maliyet şablonu
  isCustom?: boolean;       // Kullanıcı tarafından eklenen özel ürün
  sourceFileId?: string;    // Geldiği Drive dosya ID'si
  sourceFileName?: string;  // Geldiği PDF/Katalog dosya adı
  sourceListType?: 'perakende' | 'toptan' | 'kampanya' | 'genel'; // Liste tipi (PFL, TFL, Kampanya)
  isCampaign?: boolean;     // Kampanyalı ürün mü
  campaignInfo?: string;    // Kampanya bilgisi/adı (örn: '2026 Yaz Kampanyası')
  campaignValidity?: string;// Kampanya geçerlilik tarihi (örn: '01.06.2026 - 31.10.2026')
  regularPrice?: number;    // O camın normal listedeki perakende fiyatı
  regularWholesalePrice?: number; // O camın normal listedeki toptan alış fiyatı
  updatedAt?: string;
}

export interface BrandDiscount {
  brand: string;
  distributor?: string;    // Bağlı olduğu Üst Dağıtıcı Firma (örn: Lens Medikal, HOYA Vision Care & Seiko)
  discount1: number;       // 1. İskonto yüzdesi (örn: %45)
  discount2?: number;      // 2. Kademeli İskonto yüzdesi (örn: +%10)
  categoryOverrides?: Record<string, { discount1: number; discount2?: number }>;
}

export interface CustomListItem {
  id: string;
  lensId: string;
  lensSnapshot: Lens;       // Kayıt anındaki cam bilgisi
  customRetailPrice?: number; // Kullanıcının müşteriye özel belirlediği perakende fiyat
  quantity: number;         // 1: Tek Cam, 2: Çift Cam
  notes?: string;
  prescription?: {
    patientName?: string;
    rSph?: string;
    rCyl?: string;
    rAxis?: string;
    lSph?: string;
    lCyl?: string;
    lAxis?: string;
    addition?: string;
    pd?: string;
  };
}

export interface CustomList {
  id: string;
  name: string;             // Liste adı (örn: "En Çok Sattığım Progresifler", "Ahmet Bey Teklifi")
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: CustomListItem[];
  patientName?: string;
  targetProfitMargin?: number;
}

export interface DriveSyncConfig {
  sourceUrl: string;        // Google Drive veya Google Sheet linki
  sourceType: 'sheet_csv' | 'drive_file' | 'direct_url';
  lastSyncTime?: string;
  lastSyncItemCount?: number;
  autoSyncOnLoad: boolean;
  driveFolderId?: string;
}

export interface ParsedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  extractedLenses?: Lens[];
}

export interface LensFinancials {
  wholesaleListPrice: number;      // Liste Toptan Fiyatı
  effectiveDiscountRate: number;    // Efektif Net İskonto % (örn: %46.0)
  netWholesaleCost: number;        // İskontolu Net Alış Maliyeti
  retailPrice: number;             // Tavsiye / Belirlenen Perakende Fiyatı
  profitAmount: number;            // Kar Tutarı (₺)
  profitMarginPercent: number;     // Kar Marjı (%) = ((Satış - Alış) / Satış) * 100
  pairCount: 1 | 2;                // 1 = Tek cam, 2 = Çift cam
  isCostFromCode?: boolean;        // Maliyet kod sütunundaki şablondan mı çözümlendi
  codeCostResult?: {
    rawCode: string;
    parsedCost: number;
    patternDescription?: string;
  };
}
