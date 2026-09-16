import * as XLSX from 'xlsx';
import { Lens, LensCategory } from '../types';

export interface ParseResult {
  success: boolean;
  lenses: Lens[];
  totalRows: number;
  importedCount: number;
  errors: string[];
}

/**
 * Google Drive veya Google Sheet linkini doğrudan veri çekilebilir URL'ye dönüştürür.
 */
export function convertGoogleDriveUrl(rawUrl: string): { url: string; type: 'sheet' | 'drive_file' | 'direct' } {
  const url = rawUrl.trim();

  // 1. Google Sheets URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const spreadsheetId = sheetMatch[1];
    // Google Sheets public export URL as CSV
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
    return { url: exportUrl, type: 'sheet' };
  }

  // 2. Google Drive File Share Link: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    return { url: directDownloadUrl, type: 'drive_file' };
  }

  return { url, type: 'direct' };
}

/**
 * Uzak Google Drive / Google Sheets URL'sinden veri çeker
 */
export async function fetchFromDriveUrl(driveUrl: string): Promise<ArrayBuffer> {
  const { url } = convertGoogleDriveUrl(driveUrl);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/csv, application/json, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Bağlantı hatası (${response.status} ${response.statusText}). Lütfen dosyanın Google Drive'da "Bağlantıya sahip herkes görüntüleyebilir" olarak paylaşıldığından emin olun.`
    );
  }

  return await response.arrayBuffer();
}

/**
 * Excel / CSV içeriğini Lens nesnelerine dönüştürür.
 */
export function parseExcelOrCsvData(buffer: ArrayBuffer | string): ParseResult {
  const errors: string[] = [];
  try {
    let workbook: XLSX.WorkBook;
    if (typeof buffer === 'string') {
      workbook = XLSX.read(buffer, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'array' });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, lenses: [], totalRows: 0, importedCount: 0, errors: ['Çalışma sayfasında veri bulunamadı.'] };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      return { success: false, lenses: [], totalRows: 0, importedCount: 0, errors: ['Tabloda satır bulunamadı.'] };
    }

    const lenses: Lens[] = [];

    rawData.forEach((row, index) => {
      // Normalleştirilmiş anahtar arama
      const normalizedRow: Record<string, unknown> = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
        normalizedRow[cleanKey] = row[key];
      });

      // Kolon eşleştirme
      const brand = findFieldValue(normalizedRow, ['marka', 'brand', 'uretici', 'firma']) || 'Genel';
      const name = findFieldValue(normalizedRow, ['model', 'camadi', 'ad', 'urun', 'name', 'cam', 'lensname']) || `Cam ${index + 1}`;
      
      const rawCategory = findFieldValue(normalizedRow, ['kategori', 'category', 'tip', 'tur', 'type']) || 'single_vision';
      const category = normalizeCategory(rawCategory);

      const indexVal = findFieldValue(normalizedRow, ['indeks', 'index', 'kirilmaindeksi']) || '1.50';
      const material = findFieldValue(normalizedRow, ['hammadde', 'malzeme', 'material']) || 'Organik';
      const coating = findFieldValue(normalizedRow, ['kaplama', 'coating', 'ar', 'antirefle']) || 'Standart AR';

      // Toptan & Perakende Ayrımı (Çok Önemli!)
      const wholesaleRaw = findFieldValue(normalizedRow, ['toptan', 'toptanfiyat', 'alis', 'alisfiyati', 'maliyet', 'wholesale', 'bayifiyati', 'optisyenfiyati']);
      const retailRaw = findFieldValue(normalizedRow, ['perakende', 'perakendefiyat', 'satis', 'satisfiyati', 'musterifiyati', 'retail', 'liste', 'tavsiyesatis']);

      const wholesalePrice = parsePrice(wholesaleRaw);
      const retailPrice = parsePrice(retailRaw);

      if (wholesalePrice <= 0 && retailPrice <= 0) {
        errors.push(`Satır ${index + 2} (${name}): Toptan veya perakende fiyatı tespit edilemedi.`);
        return;
      }

      const currencyRaw = findFieldValue(normalizedRow, ['parabirimi', 'para', 'currency', 'birim']) || 'TRY';
      const currency = normalizeCurrency(currencyRaw);

      const sphRange = findFieldValue(normalizedRow, ['diyoptri', 'numara', 'sph', 'sferik', 'aralik']) || '-6.00 / +4.00';
      const cylMaxRaw = findFieldValue(normalizedRow, ['cyl', 'silindirik', 'maxcyl', 'astigmat']);
      const cylMax = cylMaxRaw ? parseFloat(String(cylMaxRaw)) : 2.0;

      const diameter = findFieldValue(normalizedRow, ['cap', 'diameter']) || '70';
      const deliveryRaw = findFieldValue(normalizedRow, ['stok', 'teslimat', 'delivery', 'tur']) || 'stock';
      const deliveryType: 'stock' | 'rx' = String(deliveryRaw).toLowerCase().includes('rx') || String(deliveryRaw).toLowerCase().includes('özel') ? 'rx' : 'stock';

      const notes = findFieldValue(normalizedRow, ['not', 'aciklama', 'notes', 'ozellikler']) || '';

      const lensId = `drive-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;

      lenses.push({
        id: lensId,
        brand: String(brand).trim(),
        name: String(name).trim(),
        category,
        index: cleanIndex(String(indexVal)),
        material: String(material).trim(),
        coating: String(coating).trim(),
        wholesalePrice,
        retailPrice: retailPrice > 0 ? retailPrice : Math.round(wholesalePrice * 2.5),
        currency,
        sphRange: String(sphRange).trim(),
        cylMax,
        diameter: String(diameter).trim(),
        deliveryType,
        notes: String(notes).trim(),
        isCustom: false,
        updatedAt: new Date().toISOString(),
      });
    });

    return {
      success: lenses.length > 0,
      lenses,
      totalRows: rawData.length,
      importedCount: lenses.length,
      errors,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen ayrıştırma hatası';
    return {
      success: false,
      lenses: [],
      totalRows: 0,
      importedCount: 0,
      errors: [message],
    };
  }
}

function findFieldValue(row: Record<string, unknown>, candidateKeys: string[]): string {
  for (const key of candidateKeys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]);
    }
  }
  return '';
}

function parsePrice(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // "1.250,50 ₺", "1,250.00", "₺ 850" vb. formatları temizle
  let str = String(val).replace(/[^\d.,]/g, '').trim();
  if (!str) return 0;

  // Türkçe virgül ayracı tespiti
  if (str.includes(',') && str.includes('.')) {
    // 1.250,00 -> 1250.00
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // 1250,50 -> 1250.50
    str = str.replace(',', '.');
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function normalizeCategory(raw: string): LensCategory {
  const lower = String(raw).toLowerCase();
  if (lower.includes('prog')) return 'progressive';
  if (lower.includes('ofis') || lower.includes('office') || lower.includes('dijital') || lower.includes('bilgisayar')) return 'office';
  if (lower.includes('bifokal') || lower.includes('bifocal')) return 'bifocal';
  if (lower.includes('foto') || lower.includes('trans') || lower.includes('colormatic')) return 'photochromic';
  if (lower.includes('güneş') || lower.includes('polar')) return 'sun_polarized';
  if (lower.includes('sürüş') || lower.includes('drive')) return 'drive';
  if (lower.includes('rx') || lower.includes('özel')) return 'custom_rx';
  return 'single_vision';
}

function cleanIndex(raw: string): string {
  const match = raw.match(/1[.,]\d{2}/);
  if (match) return match[0].replace(',', '.');
  return raw || '1.50';
}

function normalizeCurrency(raw: string): 'TRY' | 'USD' | 'EUR' {
  const upper = String(raw).toUpperCase();
  if (upper.includes('USD') || upper.includes('$')) return 'USD';
  if (upper.includes('EUR') || upper.includes('€')) return 'EUR';
  return 'TRY';
}

/**
 * Optisyenin Google Drive'a koyabileceği örnek Excel dosyasını (.xlsx) oluşturur ve indirir
 */
export function downloadSampleExcelTemplate(): void {
  const templateRows = [
    {
      'Marka': 'Essilor',
      'Model': 'Orma 1.50 Crizal Easy',
      'Kategori': 'Tek Odaklı',
      'İndeks': '1.50',
      'Hammadde': 'Organik CR-39',
      'Kaplama': 'Crizal Easy Pro AR',
      'Toptan Fiyat': 420,
      'Perakende Fiyat': 1250,
      'Para Birimi': 'TRY',
      'Diyoptri Aralığı': '-6.00 / +6.00',
      'Maksimum Silindirik': 2.00,
      'Teslimat': 'Stok',
      'Not': 'Kolay temizlenen standart organik cam'
    },
    {
      'Marka': 'Zeiss',
      'Model': 'ClearView 1.60 BlueProtect',
      'Kategori': 'Tek Odaklı',
      'İndeks': '1.60',
      'Hammadde': 'MR-8 İnce İndeks',
      'Kaplama': 'DuraVision BlueProtect',
      'Toptan Fiyat': 1350,
      'Perakende Fiyat': 3800,
      'Para Birimi': 'TRY',
      'Diyoptri Aralığı': '-8.00 / +6.00',
      'Maksimum Silindirik': 2.00,
      'Teslimat': 'Stok',
      'Not': 'Ekran koruyucu mavi filtreli'
    },
    {
      'Marka': 'Shamir',
      'Model': 'Autograph Intelligence 1.60 Progresif',
      'Kategori': 'Progresif',
      'İndeks': '1.60',
      'Hammadde': 'MR-8',
      'Kaplama': 'Glacier Expression',
      'Toptan Fiyat': 4200,
      'Perakende Fiyat': 11200,
      'Para Birimi': 'TRY',
      'Diyoptri Aralığı': '-8.00 / +6.00',
      'Maksimum Silindirik': 4.00,
      'Teslimat': 'RX',
      'Not': 'AI destekli kişiye özel progresif'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cam Fiyat Listesi');
  XLSX.writeFile(wb, 'Optik_Cam_Fiyat_Sablonu.xlsx');
}

/**
 * Mevcut cam listesini Excel (.xlsx) olarak dışa aktarır
 */
export function exportLensesToExcel(lenses: Lens[]): void {
  const exportRows = lenses.map((l) => ({
    'Marka': l.brand,
    'Model': l.name,
    'Kategori': l.category,
    'İndeks': l.index,
    'Hammadde': l.material,
    'Kaplama': l.coating,
    'Toptan Fiyat': l.wholesalePrice,
    'Perakende Fiyat': l.retailPrice,
    'Para Birimi': l.currency,
    'Diyoptri Aralığı': l.sphRange || '',
    'Maksimum Silindirik': l.cylMax || 2.0,
    'Çap': l.diameter || '70',
    'Teslimat': l.deliveryType === 'stock' ? 'Stok' : 'RX Özel Üretim',
    'Not': l.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fiyat Listesi');
  XLSX.writeFile(wb, `Optik_Cam_Katalogu_${new Date().toISOString().split('T')[0]}.xlsx`);
}
