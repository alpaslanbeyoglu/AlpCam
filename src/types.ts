export type LensCategory = 
  | 'single_vision' // Tek Odaklı
  | 'progressive'   // Progresif
  | 'office'        // Ofis / Yakın-Orta
  | 'bifocal'       // Bifokal
  | 'sun_polarized' // Güneş / Polarize
  | 'photochromic'  // Fotokromik (Transitions)
  | 'drive'         // Sürüş Camı
  | 'custom_rx';    // Özel Üretim

export type LensIndex = '1.50' | '1.53' | '1.56' | '1.59' | '1.60' | '1.67' | '1.74' | '1.80' | '1.90';

export interface Lens {
  id: string;
  brand: string;            // Marka (Essilor, Zeiss, Shamir, Hoya, Kodak, Novax, vb.)
  name: string;             // Model / Ürün Adı (örn: Varilux Comfort Max 1.60 Crizal Sapphire HR)
  category: LensCategory;   // Kategori
  index: string;            // Kırılma İndeksi (1.50, 1.56, 1.60, 1.67, 1.74)
  material: string;         // Hammadde (Organik CR-39, Polikarbon, MR-8, Trivex, vb.)
  coating: string;          // Kaplama (Antirefle, Blue Cut, Crizal, DuraVision, vb.)
  wholesalePrice: number;   // TOPTAN Liste Fiyatı (Alış - KDV hariç veya dahil liste fiyatı)
  retailPrice: number;      // PERAKENDE Tavsiye Edilen Satış Fiyatı (Müşteri liste fiyatı)
  currency: 'TRY' | 'USD' | 'EUR';
  sphRange?: string;        // Sferik Aralık (örn: -6.00 / +6.00)
  cylMax?: number;          // Maksimum Silindirik (örn: 2.00 veya 4.00)
  diameter?: string;        // Çap (örn: 65/70/75)
  deliveryType: 'stock' | 'rx'; // Stok Cam (Aynı gün) vs RX Özel Üretim (3-5 gün)
  notes?: string;           // Açıklama / Özellikler
  isCustom?: boolean;       // Kullanıcı tarafından eklenen özel cam
  updatedAt?: string;
}

export interface BrandDiscount {
  brand: string;
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

export interface LensFinancials {
  wholesaleListPrice: number;      // Liste Toptan Fiyatı
  effectiveDiscountRate: number;    // Efektif Net İskonto % (örn: %46.0)
  netWholesaleCost: number;        // İskontolu Net Alış Maliyeti
  retailPrice: number;             // Tavsiye / Belirlenen Perakende Fiyatı
  profitAmount: number;            // Kar Tutarı (₺)
  profitMarginPercent: number;     // Kar Marjı (%) = ((Satış - Alış) / Satış) * 100
  pairCount: 1 | 2;                // 1 = Tek cam, 2 = Çift cam
}
