import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import Tesseract from 'tesseract.js';
import { DRIVE_EXTRACTED_LENSES } from '../src/data/driveScannedCatalog';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

let _aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!_aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY ortam değişkeni bulunamadı. Lütfen Vercel ayarlarından ekleyin.');
    }
    _aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return _aiClient;
}

const DEFAULT_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1Euefi9y_ngCtzEVcOs4mi2cJZKHZ-SBB?usp=sharing';

interface ParsedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  format: 'pdf' | 'image' | 'excel' | 'other';
  brand: string;
  productType?: 'eyeglass_lens' | 'contact_lens';
  listType: 'perakende' | 'toptan' | 'kampanya' | 'karisik' | 'genel';
  sizeFormatted?: string;
  downloadUrl: string;
  driveViewUrl: string;
  folderCategory?: 'kampanyalar' | 'toptan_fiyatlar' | 'karisik' | 'genel';
}

// Helper to deduce brand and category from filename
function inferFileInfo(fileName: string, mimeType: string, id: string, parentFolderName: string = ''): ParsedDriveFile {
  const lower = fileName.toLowerCase();
  const lowerParent = (parentFolderName || '').toLowerCase();
  let brand = 'Diğer';
  let productType: 'eyeglass_lens' | 'contact_lens' = 'eyeglass_lens';

  if (lower.includes('rodenstock')) {
    brand = 'Rodenstock';
    productType = 'eyeglass_lens';
  } else if (lower.includes('zeiss')) {
    brand = 'Zeiss';
    productType = 'eyeglass_lens';
  } else if (lower.includes('seiko')) {
    brand = 'SEIKO';
    productType = 'eyeglass_lens';
  } else if (lower.includes('hoya')) {
    brand = 'HOYA';
    productType = 'eyeglass_lens';
  } else if (lower.includes('fuji')) {
    brand = 'FUJİ';
    productType = 'eyeglass_lens';
  } else if (lower.includes('hawk')) {
    brand = 'HAWK PLUS';
    productType = 'eyeglass_lens';
  } else if (lower.includes('novax')) {
    brand = 'Novax';
    productType = 'eyeglass_lens';
  } else if (lower.includes('cv') || lower.includes('cooper')) {
    brand = 'CooperVision';
    productType = 'contact_lens';
  } else if (lower.includes('opsa') || lower.includes('adore') || lower.includes('desio')) {
    brand = 'Opsa / Desio';
    productType = 'contact_lens';
  } else if (lower.includes('medikal') || lower.includes('lens')) {
    brand = 'Bausch + Lomb / Lens';
    productType = 'contact_lens';
  }

  let listType: 'perakende' | 'toptan' | 'kampanya' | 'karisik' | 'genel' = 'genel';
  let folderCategory: 'kampanyalar' | 'toptan_fiyatlar' | 'karisik' | 'genel' = 'genel';

  if (lower.includes('kampanya') || lowerParent.includes('kampanya')) {
    listType = 'kampanya';
    folderCategory = 'kampanyalar';
  } else if (lower.includes('toptan') || lower.includes('tfl') || lowerParent.includes('toptan')) {
    listType = 'toptan';
    folderCategory = 'toptan_fiyatlar';
  } else if (lower.includes('perakende') || lower.includes('parakende') || lower.includes('pfl') || lowerParent.includes('perakende') || lowerParent.includes('miks')) {
    listType = 'karisik';
    folderCategory = 'karisik';
  }

  let format: 'pdf' | 'image' | 'excel' | 'other' = 'other';
  if (mimeType.includes('pdf') || lower.endsWith('.pdf')) format = 'pdf';
  else if (mimeType.includes('image') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) format = 'image';
  else if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) format = 'excel';

  return {
    id,
    name: fileName,
    mimeType: mimeType || (format === 'pdf' ? 'application/pdf' : 'image/jpeg'),
    format,
    brand,
    productType,
    listType,
    folderCategory,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    driveViewUrl: `https://drive.google.com/file/d/${id}/view`,
  };
}

// Parse Google Drive shared folder HTML recursively (depth up to 2)
async function fetchDriveFolderFiles(
  folderUrl: string,
  parentFolderName: string = '',
  depth: number = 0,
  maxDepth: number = 2
): Promise<ParsedDriveFile[]> {
  try {
    console.log(`[Crawl] Fetching folder page: ${folderUrl} (parent: ${parentFolderName}, depth: ${depth})`);
    const res = await fetch(folderUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.warn(`[Crawl] Could not fetch folder ${folderUrl}: HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const regex = /\[\[null,"([a-zA-Z0-9_-]{25,})"\],null,null,null,"([^"]+)",[\s\S]*?\[\[\["([^"]+)",null,1\]\]\]/g;
    let match;
    const files: ParsedDriveFile[] = [];
    const seenIds = new Set<string>();

    while ((match = regex.exec(html)) !== null) {
      const id = match[1];
      const mime = match[2];
      const name = match[3];

      if (!seenIds.has(id)) {
        seenIds.add(id);

        if (mime === 'application/vnd.google-apps.folder') {
          if (depth < maxDepth) {
            console.log(`[Crawl] Found subfolder: ${name} (ID: ${id}). Crawling...`);
            const subFolderUrl = `https://drive.google.com/drive/folders/${id}`;
            const subFiles = await fetchDriveFolderFiles(subFolderUrl, name, depth + 1, maxDepth);
            files.push(...subFiles);
          }
        } else {
          files.push(inferFileInfo(name, mime, id, parentFolderName));
        }
      }
    }

    return files;
  } catch (err: any) {
    console.error('Error in fetchDriveFolderFiles:', err);
    throw err;
  }
}

// Extract raw text from images using local/WASM Tesseract OCR
async function runOcrOnImage(buffer: Buffer): Promise<string> {
  try {
    console.log('[OCR] Running Tesseract.js (tur+eng) OCR on image buffer...');
    // Create an 8-second safety timeout so slow CDN downloads do not block the user's request
    const ocrPromise = Tesseract.recognize(buffer, 'tur+eng');
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Tesseract OCR Timeout')), 8000)
    );

    const result = await Promise.race([ocrPromise, timeoutPromise]);
    if (result && 'data' in result) {
      const text = result.data.text;
      console.log(`[OCR] Tesseract extracted ${text.length} characters of raw text successfully.`);
      return text;
    }
    return '';
  } catch (err: any) {
    console.warn('[OCR] Tesseract OCR failed or timed out, skipping to native vision:', err?.message || err);
    return '';
  }
}

// Generate lenses using Gemini with model fallback and Admin Price Mode decision
async function analyzeBufferWithGemini(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  brandHint?: string,
  priceMode: 'wholesale' | 'retail' | 'karisik' | 'auto' = 'auto',
  profitMarkup: number = 2.0,
  productTypeHint: 'auto' | 'eyeglass_lens' | 'contact_lens' = 'auto'
) {
  const b64 = buffer.toString('base64');
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest'
  ];

  // Ensure mimeType is compatible with Gemini
  let finalMimeType = mimeType;
  if (fileName.toLowerCase().endsWith('.pdf')) finalMimeType = 'application/pdf';
  else if (fileName.toLowerCase().endsWith('.png')) finalMimeType = 'image/png';
  else if (fileName.toLowerCase().endsWith('.webp')) finalMimeType = 'image/webp';
  else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) finalMimeType = 'image/jpeg';
  
  // Fallback if still ambiguous
  if (!finalMimeType || finalMimeType === 'application/octet-stream') {
    finalMimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
  }

  let adminInstruction = '';
  let detectedListType: 'perakende' | 'toptan' | 'kampanya' | 'karisik' | 'genel' = 'genel';
  if (fileName.toLowerCase().includes('pfl') || fileName.toLowerCase().includes('perakende')) {
    detectedListType = 'perakende';
  } else if (fileName.toLowerCase().includes('tfl') || fileName.toLowerCase().includes('toptan')) {
    detectedListType = 'toptan';
  } else if (fileName.toLowerCase().includes('kampanya') || fileName.toLowerCase().includes('kampanyasi') || fileName.toLowerCase().includes('promosyon')) {
    detectedListType = 'kampanya';
  } else if (fileName.toLowerCase().includes('karisik') || fileName.toLowerCase().includes('karışık') || fileName.toLowerCase().includes('kodlu')) {
    detectedListType = 'karisik';
  }

  if (priceMode === 'wholesale' || detectedListType === 'toptan') {
    adminInstruction = `\n*** YÖNETİCİ TALİMATI: Bu belge KESİNLİKLE TOPTAN (ALIŞ / TFL) FİYAT LİSTESİDİR. Belgedeki tüm fiyat sütunlarını wholesalePrice olarak kaydet.`;
  } else if (priceMode === 'retail' || detectedListType === 'perakende') {
    adminInstruction = `\n*** YÖNETİCİ TALİMATI: Bu belge KESİNLİKLE PERAKENDE (TAVSİYE EDİLEN SATIŞ / PFL) FİYAT LİSTESİDİR. Belgedeki tüm fiyatları retailPrice olarak kaydet.`;
  } else if (priceMode === 'karisik' || detectedListType === 'karisik') {
    adminInstruction = `\n*** YÖNETİCİ TALİMATI: Bu belge KESİNLİKLE KARIŞIK (ÜRÜN KODU MALİYETLİ & PERAKENDE AÇIK) FİYAT LİSTESİDİR.
- Perakende satış fiyatı belgede açıkça yazar (örn. "2.500 TL" veya "2500"), bunu 'retailPrice' olarak kaydet.
- Toptan alış fiyatı ise ürün kodunun (productCode) içine gizlenmiştir (örn: \`JLM01337-50\` kodunda maliyet 1337.50'dir, \`SO077L\` kodunda maliyet 77'dir, \`AR0120L\` veya \`SO0120L\` kodunda maliyet 120'dir, \`CR065\` kodunda 65'tir). Ürün kodundaki bu gizli maliyeti akıllıca çözümle ve 'wholesalePrice' olarak kaydet.`;
  }

  let productTypeInstruction = '';
  if (productTypeHint === 'contact_lens' || fileName.toLowerCase().includes('lens') || fileName.toLowerCase().includes('coopervision') || fileName.toLowerCase().includes('opsa') || fileName.toLowerCase().includes('alcon') || fileName.toLowerCase().includes('bausch')) {
    productTypeInstruction = `\n*** YÖNETİCİ TALİMATI: Bu liste KONTAKT LENS listesidir. productType değerini 'contact_lens' yap, kutu adedi, değişim sıklığı (aylık/günlük/15 günlük), BC eğrisi ve lens tipini (sferik/torik/multifokal/renkli) eksiksiz çıkar.`;
  } else if (productTypeHint === 'eyeglass_lens') {
    productTypeInstruction = `\n*** YÖNETİCİ TALİMATI: Bu liste GÖZLÜK CAMI listesidir. productType değerini 'eyeglass_lens' yap.`;
  }

  // Pre-process images with Tesseract OCR if applicable
  let ocrText = '';
  if (finalMimeType.startsWith('image/')) {
    ocrText = await runOcrOnImage(buffer);
  }

  let ocrAugmentation = '';
  if (ocrText) {
    ocrAugmentation = `\n\n*** GÜÇLÜ OCR METİN DESTEĞİ:
Görüntüden harici yüksek hassasiyetli bir OCR tarayıcı ile çıkarılmış ham metin aşağıdadır.
Görseldeki fiyatların, indeks numaralarının (örn. 1.50, 1.60, 1.67) ve ürün isimlerinin doğruluğunu kesinleştirmek için faturadaki/katalogdaki ilgili alanları bu OCR metni ile karşılaştırarak düzelt. OCR okumalarındaki sayısal değerleri esas al (ancak tablo formatı ve sütün düzeni için görsel analize de sadık kal):

--- OCR HAM METİN BAŞLANGICI ---
${ocrText}
--- OCR HAM METİN BİTİŞİ ---`;
  }

  let prompt = `Sen Türkiye optik gözlük camı ve kontakt lens sektöründe en üst düzey uzman yapay zekasın.
Verilen dosya (${fileName}) bir optik cam veya kontakt lens fiyat listesi, toptan (TFL) / perakende (PFL) katalogu, kampanya tablosu veya PDF broşürüdür.
${brandHint ? `Öncelikli Marka: ${brandHint}` : ''}
${adminInstruction}
${productTypeInstruction}
${ocrAugmentation}

KRİTİK GÖREV TALİMATLARI:
1. EKSİKSİZ SATIR SATIR ÇIKARIM (100% EXTRACTION):
   - Belgede veya tablolarda yer alan TÜM ÜRÜNLERİ, TÜM İNDEKSLERİ (1.50, 1.53 Trivex, 1.56, 1.59 Polikarbon, 1.60 MR-8, 1.67, 1.74, 1.80, 1.90 Mineral/Organik), TÜM KAPLAMALARI VE BÜTÜN DİZAYNLARI eksiksiz olarak JSON listesine ekle.
   - Kesinlikle örnekleme yapıp ilk 5-10 ürünü alıp kesme; katalogdaki her bir satırı ayrı bir ürün olarak çıkar.

2. TÜRKÇE FİYAT VE PARA BİRİMİ AYRIŞTIRMA (ÇOK ÖNEMLİ):
   - Türkiye fiyat formatında nokta (.) binlik ayıracıdır, virgül (,) ondalık ayıracıdır.
   - Örnek: "2.850,00 TL" -> 2850 (Kesinlikle 2.85 yapma!). "1.200 TL" -> 1200, "750,00" -> 750, "18.500" -> 18500.
   - DİKKAT: Belgede veya dosya adında "Desio", "Adore", "Euro", "€" veya "$" geçiyorsa, currency alanını KESİNLİKLE "EUR" veya "USD" olarak ayarla. Varsayılan olarak her şeye "TRY" deme! Rakamları tam veya ondalıklı sayı olarak aktar.
   - Eğer liste PERAKENDE (PFL) ise veya tavsiye satış fiyatı içeriyorsa: retailPrice alanını doldur.
   - Eğer liste TOPTAN (TFL) ise veya optisyen alış fiyatı içeriyorsa: wholesalePrice alanını doldur.

3. ÜRÜN SINIFLANDIRMASI VE DAĞITICI:
   - Gözlük camları (productType: "eyeglass_lens"): Tek odaklı (single_vision), progresif (progressive), ofis (office), bifokal (bifocal), fotokromik/transitions (photochromic), güneş/polarize (sun_polarized), sürüş (drive), özel üretim (custom_rx).
   - Kontakt lensler (productType: "contact_lens"): Kutu içeriği (6'lı Kutu, 30'lu Kutu), BC (8.4, 8.6, 8.8), DIA (14.2), değişim süresi (daily, monthly, yearly), lens tipi (spheric, toric, multifocal, color).
   - DAĞITICI / ÜST FİRMA (distributor): İlgili markanın Türkiye'deki ana distribütörünü belirt (örn: Lens Medikal, HOYA Vision Care & Seiko Optical, Beta Optik (Novax), Carl Zeiss Vision, Opsa Optik, CooperVision Türkiye, EssilorLuxottica, Merve Optik, Alcon Vision Care, Bausch + Lomb).

JSON çıktısı şu formatta OLMALIDIR:
{
  "brand": "Marka Adı",
  "distributor": "Üst Dağıtıcı Firma",
  "listType": "perakende veya toptan veya kampanya",
  "lenses": [
    {
      "name": "Ürün Tam Adı (örn: Perfalit 1.60 Solitaire LayR veya Biofinity Toric 6'lı Kutu)",
      "brand": "Marka Adı",
      "distributor": "Dağıtıcı / Üst Firma",
      "productType": "eyeglass_lens veya contact_lens",
      "category": "single_vision | progressive | office | photochromic | sun_polarized | drive | contact_lens | custom_rx",
      "index": "1.50 veya 1.56 veya 1.60 veya 1.67 veya 1.74 veya BC 8.6",
      "material": "Organik / MR-8 / Silikon Hidrojel / Mineral / Trivex / vb.",
      "coating": "Kaplama veya lens teknolojisi (örn: Crizal Sapphire, Solitaire LayR, Aquaform, Antirefle)",
      "wholesalePrice": 1250,
      "retailPrice": 2500,
      "currency": "TRY",
      "deliveryType": "stock veya rx",
      "boxContent": "6'lı Kutu veya 30'lu Kutu (kontakt lens ise)",
      "wearPeriod": "daily veya monthly veya yearly (kontakt lens ise)",
      "lensType": "spheric veya toric veya multifocal veya color (kontakt lens ise)",
      "baseCurve": "8.4 veya 8.6 (kontakt lens ise)",
      "diameter": "14.2 veya 65/70/75",
      "sphRange": "-12.00 / +8.00",
      "cylMax": 2.0,
      "notes": "Ek açıklama veya özellikler"
    }
  ]
}
Sadece geçerli bir JSON döndür.`;

  let lastError: any = null;

  // Helper to parse Turkish string prices into clean numbers
  const parseTurkishPrice = (raw: any): number => {
    if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
    if (!raw) return 0;
    const str = String(raw).trim().replace(/TL|TRY|₺|\$|€/gi, '').trim();
    // Check format like 1.250,50 or 1.250
    if (str.includes('.') && str.includes(',')) {
      const clean = str.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    if (str.includes(',') && !str.includes('.')) {
      const clean = str.replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
    if (str.includes('.') && !str.includes(',')) {
      // Could be thousands dot like 1.250 or 25.000
      const parts = str.split('.');
      if (parts.length === 2 && parts[1].length === 3) {
        const num = parseFloat(parts[0] + parts[1]);
        return isNaN(num) ? 0 : num;
      }
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  for (const modelName of modelsToTry) {
    let retries = 2; // 2 retries per model
    while (retries >= 0) {
      try {
        console.log(`[Gemini] Scanning ${fileName} with model ${modelName} (priceMode: ${priceMode})...`);
        const aiClient = getAiClient();
        
        // Directly call models.generateContent with multimodal inlineData
        const genResponse = await aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: finalMimeType,
                data: b64,
              }
            },
            {
              text: prompt,
            }
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192,
            systemInstruction: "Sen profesyonel bir optik katalog veri giriş uzmanısın. Görevin belgedeki TÜM ürünleri, her bir indeks ve kaplama varyasyonuyla birlikte EKSİKSİZ bir JSON dizisi olarak çıkarmaktır. \n\nÖNEMLİ - Markaya Özel Kaplama İsimlendirmeleri:\n1. HOYA için kaplamaları şu standart kısaltmalarla normalize et: 'HVLL' (Hi-Vision LongLife), 'BLC' (BlueControl), 'SHV' (Super Hi-Vision). \n   - DİKKAT: 'LayR' ifadesini sadece belgede açıkça yazıyorsa kullan (genellikle Perfalit, Hilux, Nulux gibi tek odaklı camlarda olur). \n   - Balansis, Daynamic, Lifestyle gibi PROGRESİF camlarda belgede yazmıyorsa 'LayR' ekleme, sadece HVLL veya SHV gibi mevcut kaplamayı yaz.\n2. SEIKO için: 'SRC' (SuperResistantCoat), 'SCC' (SuperCleanCoat), 'RCC' (RoadClearCoat).\n3. ZEISS için: 'DuraVision Platinum', 'DuraVision BlueProtect', 'LotuTec'.\n\nTablolardaki hiçbir satırı atlamadan, en yüksek veri yoğunluğuyla çalışmalısın.",
          }
        });
        const rawText = genResponse.text || '';

        // Robust JSON extraction
        let cleanRawText = (rawText || '').trim();
        cleanRawText = cleanRawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        
        // Basic repair for truncated JSON (close quotes and brackets)
        // 1. If it ends mid-string, close the quote
        const quoteCount = (cleanRawText.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
          // Check if it ends with a backslash (escaping the added quote)
          if (cleanRawText.endsWith('\\')) {
            cleanRawText = cleanRawText.slice(0, -1);
          }
          cleanRawText += '"';
        }

        // 2. Close JSON structures
        const openBraces = (cleanRawText.match(/\{/g) || []).length;
        const closeBraces = (cleanRawText.match(/\}/g) || []).length;
        const openBrackets = (cleanRawText.match(/\[/g) || []).length;
        const closeBrackets = (cleanRawText.match(/\]/g) || []).length;
        
        if (openBrackets > closeBrackets) cleanRawText += ']'.repeat(openBrackets - closeBrackets);
        if (openBraces > closeBraces) cleanRawText += '}'.repeat(openBraces - closeBraces);

        const jsonMatch = cleanRawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanRawText = jsonMatch[0];
        }

        // Handle unterminated strings or truncated JSON
        let parsed: any;
        try {
          parsed = JSON.parse(cleanRawText);
        } catch (parseErr) {
          console.warn(`[Gemini] JSON parse failed for ${modelName}, attempting partial extraction...`);
          try {
            const itemMatches = cleanRawText.match(/\{[^{}]*"name"[^{}]*\}/g);
            if (itemMatches && itemMatches.length > 0) {
              const recovered = [];
              for (const m of itemMatches) {
                try { recovered.push(JSON.parse(m)); } catch (_) {}
              }
              if (recovered.length > 0) {
                parsed = { lenses: recovered };
              }
            }
          } catch (_) {}

          if (!parsed) {
            throw parseErr;
          }
        }

        const rawLenses = Array.isArray(parsed) ? parsed : (parsed.lenses || []);
        const fileListType: 'perakende' | 'toptan' | 'kampanya' | 'karisik' | 'genel' = 
          parsed.listType || detectedListType;
        
        // Standardize extracted lenses with IDs and apply manager's pricing rules
        const lenses = rawLenses.map((l: any, idx: number) => {
          const lowerName = (l.name || '').toLowerCase();
          const lowerBrand = (l.brand || parsed.brand || brandHint || '').toLowerCase();
          const isCooper = lowerBrand.includes('cooper') || lowerBrand === 'cv' || lowerBrand.startsWith('cv ') || lowerName.includes('cv ') || lowerName.includes('biofinity') || lowerName.includes('clariti') || lowerName.includes('myday') || lowerName.includes('avaira') || lowerName.includes('biomedics') || lowerName.includes('proclear');
          const isLens = 
            productTypeHint === 'contact_lens' ||
            l.productType === 'contact_lens' ||
            l.category === 'contact_lens' ||
            isCooper ||
            lowerBrand.includes('opsa') ||
            lowerBrand.includes('desio') ||
            lowerBrand.includes('adore') ||
            lowerBrand.includes('bausch') ||
            lowerBrand.includes('alcon') ||
            lowerBrand.includes('johnson') ||
            lowerBrand.includes('lens') ||
            lowerName.includes('lens') ||
            lowerName.includes('biofinity') ||
            lowerName.includes('clariti') ||
            lowerName.includes('myday') ||
            lowerName.includes('avaira') ||
            lowerName.includes('purevision') ||
            lowerName.includes('ultra') ||
            lowerName.includes('kutu');

          let wholesale = parseTurkishPrice(l.wholesalePrice);
          let retail = parseTurkishPrice(l.retailPrice);

          // Apply admin price mode decision
          if (priceMode === 'karisik' || fileListType === 'karisik') {
            const pCode = l.productCode || l.notes || '';
            if (wholesale === 0 && pCode) {
              const code = String(pCode).toUpperCase();
              const jj = code.match(/(?:JLM|LM|KOD|KD)0*(\d{2,5})[-.](\d{2})/);
              if (jj) {
                wholesale = parseInt(jj[1], 10) + parseInt(jj[2], 10) / 100;
              } else {
                const hidden = code.match(/[A-Z]{1,4}0*(\d{2,4})[A-Z]{0,2}/);
                if (hidden) {
                  const extracted = parseInt(hidden[1], 10);
                  if (retail === 0 || extracted <= retail) {
                    wholesale = extracted;
                  }
                }
              }
            }
            if (wholesale > 0 && retail === 0) {
              retail = Math.round(wholesale * profitMarkup);
            }
          } else if (priceMode === 'wholesale' || fileListType === 'toptan') {
            if (wholesale === 0 && retail > 0) {
              wholesale = retail;
            }
            if (retail === 0 || retail === wholesale) {
              retail = Math.round(wholesale * profitMarkup);
            }
          } else if (priceMode === 'retail' || fileListType === 'perakende') {
            if (retail === 0 && wholesale > 0) {
              retail = wholesale;
            }
            wholesale = 0;
          } else {
            if (wholesale > 0 && retail === 0) {
              retail = Math.round(wholesale * profitMarkup);
            } else if (retail > 0 && wholesale === 0) {
              wholesale = 0;
            }
          }

          const finalBrand = isCooper
            ? 'CooperVision'
            : l.brand || parsed.brand || brandHint || (isLens ? 'CooperVision' : 'Genel Optik');

          const finalDistributor = l.distributor || parsed.distributor || undefined;

          return {
            id: `drive-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            brand: finalBrand,
            distributor: finalDistributor,
            name: l.name || (isLens ? 'Kontakt Lens' : 'Optik Cam'),
            productType: isLens ? 'contact_lens' : 'eyeglass_lens',
            category: isLens ? 'contact_lens' : (l.category || 'single_vision'),
            index: l.index ? String(l.index).replace(',', '.') : (isLens ? 'BC 8.6' : '1.56'),
            material: l.material || (isLens ? 'Silikon Hidrojel' : 'Organik'),
            coating: l.coating || (isLens ? 'Nemlendirici Matriks' : 'Standart Antirefle'),
            wholesalePrice: wholesale,
            retailPrice: retail,
            currency: l.currency || 'TRY',
            deliveryType: l.deliveryType || 'stock',
            sphRange: l.sphRange,
            cylMax: l.cylMax ? Number(l.cylMax) : undefined,
            diameter: l.diameter,
            baseCurve: l.baseCurve || (isLens ? '8.6' : undefined),
            boxContent: l.boxContent || (isLens ? '6\'lı Kutu' : undefined),
            wearPeriod: l.wearPeriod || (isLens ? 'monthly' : undefined),
            lensType: l.lensType || (isLens ? 'spheric' : undefined),
            sourceFileName: fileName,
            sourceListType: fileListType,
            notes: l.notes || `Google Drive'dan tarandı (${fileName})`,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        });

        return {
          brand: parsed.brand || brandHint || (productTypeHint === 'contact_lens' ? 'Kontakt Lens' : 'Optik'),
          lenses,
          modelUsed: modelName,
        };
      } catch (err: any) {
        console.warn(`[Gemini] Model ${modelName} failed (retries left: ${retries}):`, err?.message || err);
        lastError = err;
        
        // Handle 503 Service Unavailable / Overloaded immediately by failing over to the next model
        if (err?.status === 503 || err?.message?.includes('503')) {
          console.warn(`[Gemini] Model ${modelName} is currently unavailable (503). Skipping immediately to fallback model...`);
          break; // Break the retry loop for this model, moving to the next model in modelsToTry
        }

        // Wait and retry if it's a 429 rate limit
        if (err?.status === 429 || err?.message?.includes('429')) {
          // If it's a model with zero free tier quota, skip immediately
          if (err?.message?.includes('limit: 0')) {
            console.warn(`[Gemini] Model ${modelName} has 0 free quota. Skipping to next model...`);
            break;
          }

          // If it's a daily quota limit, don't bother retrying this specific model, move to next
          if (err?.message?.includes('GenerateRequestsPerDay') || (err?.message?.includes('quota') && !err?.message?.includes('retry in'))) {
            console.warn(`[Gemini] Model ${modelName} daily quota exceeded. Skipping to next model...`);
            break; 
          }

          retries--;
          if (retries >= 0) {
            // Check if there's a specific retry duration recommended in the error message
            const match = err?.message?.match(/retry in ([0-9.]+)s/i);
            const retrySeconds = match ? Math.ceil(parseFloat(match[1])) : 20;
            const waitTime = Math.min(Math.max(retrySeconds * 1000, 5000), 45000);
            console.log(`[Gemini] Rate limit hit. Waiting ${waitTime / 1000}s before retrying ${modelName}...`);
            await delay(waitTime);
            continue;
          }
        }

        // Handle transient network errors (fetch failed, timeout, ECONNRESET, DNS issues, socket hung up)
        const isNetworkError = 
          !err?.status && 
          (err?.message?.toLowerCase().includes('fetch failed') || 
           err?.message?.toLowerCase().includes('network') || 
           err?.message?.toLowerCase().includes('timeout') || 
           err?.message?.toLowerCase().includes('socket') || 
           err?.message?.toLowerCase().includes('econn') || 
           err?.message?.toLowerCase().includes('eai_again'));

        if (isNetworkError) {
          retries--;
          if (retries >= 0) {
            const waitTime = 2500 * (3 - retries); // Exponential backoff (2.5s, 5s)
            console.log(`[Gemini] Transient network error encountered (${err?.message || err}). Retrying ${modelName} in ${waitTime / 1000}s...`);
            await delay(waitTime);
            continue;
          }
        }
        
        // Break out of the while loop to move to the next model for other errors
        break;
      }
    }
  }

  if (lastError) {
    const errMsg = (lastError.message || '').toLowerCase();
    if (errMsg.includes('quota') || errMsg.includes('resource_exhausted') || errMsg.includes('limit exceeded') || errMsg.includes('429')) {
      throw new Error(`Günlük yapay zeka tarama kotası aşıldı (Quota/Resource Exhausted). Lütfen bir süre sonra tekrar deneyin veya daha küçük dosyalar yükleyin. Günlük kota limitiniz otomatik olarak sıfırlanacaktır.`);
    }
    throw lastError;
  }

  throw new Error('Tüm Gemini modelleri yanıt veremedi.');
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy download remote Google Drive or Sheet URL (bypassing browser CORS)
app.get('/api/drive/fetch-file', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).json({ success: false, error: 'url parametresi zorunludur.' });
    }

    const targetUrl = rawUrl.trim();
    // Check if it's a Google Sheet
    const sheetMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetMatch && sheetMatch[1]) {
      const sheetCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/gviz/tq?tqx=out:csv`;
      const response = await fetch(sheetCsvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Google E-Tablolara erişilemedi (HTTP ${response.status})`,
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    // Check if it's a Google Drive file
    const driveFileMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || targetUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (driveFileMatch && driveFileMatch[1]) {
      const fileId = driveFileMatch[1];
      console.log(`[Proxy Fetch] Downloading file ${fileId} using robust downloader...`);
      const buffer = await downloadDriveFileBuffer(fileId);
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.send(buffer);
    }

    // Direct fallback fetch for other URLs
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Dosyaya erişilemedi (HTTP ${response.status})`,
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Error in proxy fetch-file:', err);
    res.status(500).json({ success: false, error: err.message || 'Dosya indirilemedi.' });
  }
});

// List files in Google Drive folder
app.get('/api/drive/files', async (req, res) => {
  try {
    const folderUrl = (req.query.folderUrl as string) || DEFAULT_DRIVE_FOLDER_URL;
    const files = await fetchDriveFolderFiles(folderUrl);
    res.json({
      success: true,
      folderUrl,
      count: files.length,
      files,
    });
  } catch (err: any) {
    console.error('Error fetching drive files:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Google Drive klasörü taranamadı.',
    });
  }
});

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function downloadDriveFileBuffer(fileId: string, fileName?: string, mimeType?: string): Promise<Buffer> {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // 1. Try to load the standard, fully authorized Google Cloud Developer API key from firebase-applet-config.json
  let googleApiKey = '';
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.apiKey && config.apiKey.startsWith('AIzaSy')) {
        googleApiKey = config.apiKey;
        console.log('[Drive Download] Loaded Google Developer API Key from firebase-applet-config.json:', googleApiKey.substring(0, 10) + '...');
      }
    }
  } catch (e: any) {
    console.warn('[Drive Download] Optional firebase-applet-config.json API key reading skipped:', e.message || e);
  }

  const urls: string[] = [];

  // Determine if it is likely a spreadsheet/sheet or doc based on hints
  const lowerName = (fileName || '').toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();
  const isSheetHint = 
    lowerMime.includes('spreadsheet') || 
    lowerMime.includes('excel') || 
    lowerName.includes('xlsx') || 
    lowerName.includes('xls') || 
    lowerName.includes('miks') || 
    lowerName.includes('tablo') || 
    lowerName.includes('fiyat') || 
    lowerName.includes('perakende');

  const isDocHint = 
    lowerMime.includes('document') || 
    lowerMime.includes('word') || 
    lowerName.includes('docx') || 
    lowerName.includes('doc');

  // If a spreadsheet hint is detected, prioritize spreadsheet export URL
  if (isSheetHint) {
    console.log('[Drive Download] Detected Spreadsheet hint. Prioritizing Excel export URLs...');
    urls.push(`https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`);
  } else if (isDocHint) {
    console.log('[Drive Download] Detected Document hint. Prioritizing PDF export URLs...');
    urls.push(`https://docs.google.com/document/d/${fileId}/export?format=pdf`);
  }

  // Use the standard Google Cloud Developer API key if found!
  if (googleApiKey) {
    console.log('[Drive Download] Adding official Drive API v3 endpoints with Developer API Key...');
    urls.push(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${googleApiKey}`,
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf&key=${googleApiKey}`,
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet&key=${googleApiKey}`
    );
  }

  // Fallback to Gemini API Key (might be restricted/401 but we still add it just in case)
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  if (geminiApiKey && geminiApiKey !== googleApiKey) {
    urls.push(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${geminiApiKey}`,
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf&key=${geminiApiKey}`,
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet&key=${geminiApiKey}`
    );
  }

  // 2. High-fidelity view-page and preview-page HTML scraping strategy with redirect-based auto-detection
  const viewUrls = [
    `https://drive.google.com/file/d/${fileId}/view`,
    `https://drive.google.com/file/d/${fileId}/preview`
  ];

  for (const viewUrl of viewUrls) {
    try {
      console.log(`[Drive Download] Strategy 2: Fetching page to scrape secure URL candidates: ${viewUrl}...`);
      const viewRes = await fetchWithTimeout(viewUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        redirect: 'follow'
      }, 5000);

      if (viewRes.ok) {
        const finalUrl = viewRes.url || '';
        console.log(`[Drive Download] Loaded view page. Final URL after redirects: ${finalUrl}`);

        // Immediate block check: If redirected to Google sign-in page, the file is 100% PRIVATE or restricted
        if (finalUrl.includes('accounts.google.com') || finalUrl.includes('/ServiceLogin') || finalUrl.includes('/InteractiveLogin')) {
          throw new Error('Google Drive dosyası gizli (erişim kısıtlı). Lütfen Google Drive\'da dosya paylaşım ayarlarını "Bağlantıya sahip olan herkes - Görüntüleyici" olarak değiştirin.');
        }

        const htmlText = await viewRes.text();
        const cookies = viewRes.headers.get('set-cookie') || '';

        // Auto-detect native Google Document types via final URL redirection and immediately export them!
        if (finalUrl.includes('/spreadsheets/') || finalUrl.includes('docs.google.com/spreadsheets')) {
          console.log(`[Drive Download] Auto-detected native Google Spreadsheet via redirect. Attempting direct xlsx export...`);
          const exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
          try {
            const expRes = await fetchWithTimeout(exportUrl, {
              headers: {
                'User-Agent': userAgent,
                ...(cookies ? { Cookie: cookies } : {})
              }
            }, 6000);
            if (expRes.ok) {
              const arrayBuffer = await expRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              if (buffer.byteLength > 0) {
                console.log(`[Drive Download] Successfully downloaded ${buffer.byteLength} bytes of native Spreadsheet.`);
                return buffer;
              }
            }
          } catch (expErr: any) {
            console.warn(`[Drive Download] Auto-detected Spreadsheet export failed:`, expErr.message || expErr);
          }
        }

        if (finalUrl.includes('/document/') || finalUrl.includes('docs.google.com/document')) {
          console.log(`[Drive Download] Auto-detected native Google Document via redirect. Attempting direct pdf export...`);
          const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
          try {
            const expRes = await fetchWithTimeout(exportUrl, {
              headers: {
                'User-Agent': userAgent,
                ...(cookies ? { Cookie: cookies } : {})
              }
            }, 6000);
            if (expRes.ok) {
              const arrayBuffer = await expRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              if (buffer.byteLength > 0) {
                console.log(`[Drive Download] Successfully downloaded ${buffer.byteLength} bytes of native Document.`);
                return buffer;
              }
            }
          } catch (expErr: any) {
            console.warn(`[Drive Download] Auto-detected Document export failed:`, expErr.message || expErr);
          }
        }

        if (finalUrl.includes('/presentation/') || finalUrl.includes('docs.google.com/presentation')) {
          console.log(`[Drive Download] Auto-detected native Google Presentation via redirect. Attempting direct pdf export...`);
          const exportUrl = `https://docs.google.com/presentation/d/${fileId}/export?format=pdf`;
          try {
            const expRes = await fetchWithTimeout(exportUrl, {
              headers: {
                'User-Agent': userAgent,
                ...(cookies ? { Cookie: cookies } : {})
              }
            }, 6000);
            if (expRes.ok) {
              const arrayBuffer = await expRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              if (buffer.byteLength > 0) {
                console.log(`[Drive Download] Successfully downloaded ${buffer.byteLength} bytes of native Presentation.`);
                return buffer;
              }
            }
          } catch (expErr: any) {
            console.warn(`[Drive Download] Auto-detected Presentation export failed:`, expErr.message || expErr);
          }
        }
        
        // Find any googleusercontent URL (with or without escaped slashes)
        const matches = htmlText.match(/https?:\/\/[a-zA-Z0-9_./\\-]*googleusercontent[a-zA-Z0-9_./\\-]*/g) || [];
        const candidateUrls = Array.from(new Set(matches.map(m => m.replace(/\\/g, '')))).filter(m => {
          return m.includes('securesc') || m.includes('drive-viewer') || m.includes('download') || m.includes('export');
        });

        console.log(`[Drive Download] Found ${candidateUrls.length} unique candidate download URLs on view page.`);

        for (const secureUrl of candidateUrls) {
          try {
            console.log(`[Drive Download] Trying parsed candidate URL: ${secureUrl}`);
            const downloadRes = await fetchWithTimeout(secureUrl, {
              headers: {
                'User-Agent': userAgent,
                'Accept': '*/*',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                ...(cookies ? { Cookie: cookies } : {})
              },
              redirect: 'follow'
            }, 5000);

            if (downloadRes.ok) {
              const finalContentType = downloadRes.headers.get('content-type') || '';
              if (!finalContentType.includes('text/html')) {
                const arrayBuffer = await downloadRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                if (buffer.byteLength > 0) {
                  console.log(`[Drive Download] Successfully downloaded ${buffer.byteLength} bytes using parsed: ${secureUrl}`);
                  return buffer;
                }
              }
            }
          } catch (innerErr: any) {
            console.warn(`[Drive Download] Candidate URL fetch failed:`, innerErr.message || innerErr);
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Drive Download] Fetching page ${viewUrl} failed:`, err.message || err);
      if (err.message && (err.message.includes('gizli') || err.message.includes('kısıtlı') || err.message.includes('paylaşım'))) {
        throw err; // Escalate access restrictions immediately to avoid useless falling back
      }
    }
  }

  // 3. Fallback to view-page session cookies + direct /uc request (with confirm=t)
  try {
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    console.log(`[Drive Download] Strategy 3: Fetching view page for session cookies...`);
    const viewRes = await fetchWithTimeout(viewUrl, {
      headers: { 'User-Agent': userAgent },
      redirect: 'follow'
    }, 5000);

    if (viewRes.ok) {
      const finalUrl = viewRes.url || '';
      if (finalUrl.includes('accounts.google.com') || finalUrl.includes('/ServiceLogin') || finalUrl.includes('/InteractiveLogin')) {
        throw new Error('Google Drive dosyası gizli (erişim kısıtlı). Lütfen Google Drive\'da dosya paylaşım ayarlarını "Bağlantıya sahip olan herkes - Görüntüleyici" olarak değiştirin.');
      }

      const cookies = viewRes.headers.get('set-cookie') || '';
      if (cookies) {
        console.log(`[Drive Download] Strategy 3: Download with collected cookies using /uc & confirm=t...`);
        const downloadRes = await fetchWithTimeout(`https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`, {
          headers: {
            'User-Agent': userAgent,
            'Cookie': cookies,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          redirect: 'follow'
        }, 5000);

        if (downloadRes.ok) {
          const finalContentType = downloadRes.headers.get('content-type') || '';
          if (!finalContentType.includes('text/html')) {
            const arrayBuffer = await downloadRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.byteLength > 0) {
              console.log(`[Drive Download] Successfully downloaded ${buffer.byteLength} bytes using Cookie-based /uc.`);
              return buffer;
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[Drive Download] Strategy 3 (Cookie-based /uc) failed:', err.message || err);
    if (err.message && (err.message.includes('gizli') || err.message.includes('kısıtlı') || err.message.includes('paylaşım'))) {
      throw err;
    }
  }

  // Fallback direct download URLs (tried sequentially without retries to avoid frontend timeout)
  const fallbackUrls = [
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
    `https://docs.google.com/uc?id=${fileId}&export=download`,
    `https://drive.google.com/uc?id=${fileId}&export=download`,
    `https://drive.google.com/u/0/uc?id=${fileId}&export=download`,
    // Native Google Spreadsheet fallback (export to Microsoft Excel format)
    `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
    // Native Google Document fallback (export to Adobe PDF format)
    `https://docs.google.com/document/d/${fileId}/export?format=pdf`,
    // Native Google Presentation fallback (export to Adobe PDF format)
    `https://docs.google.com/presentation/d/${fileId}/export?format=pdf`,
    // Alternative Google Spreadsheet fallback (export to plain CSV format)
    `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`
  ];

  for (const url of fallbackUrls) {
    // Prevent duplicate calls if they are already pushed
    if (urls.includes(url)) continue;
    urls.push(url);
  }

  let lastError: any = null;

  for (const url of urls) {
    let retries = 0;
    while (retries >= 0) {
      try {
        console.log(`[Drive Download] Attempting download from URL: ${url} (retries left: ${retries})...`);
        
        const isApiUrl = url.includes('googleapis.com');
        const requestHeaders: any = isApiUrl ? {
          'User-Agent': userAgent,
        } : {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        };

        let response = await fetchWithTimeout(url, {
          headers: requestHeaders,
          redirect: 'follow',
        }, 5000);

        let contentType = response.headers.get('content-type') || '';
        
        // If Google Drive returns a virus scan or confirmation HTML page
        if (contentType.includes('text/html') && response.ok) {
          const cloneRes = response.clone();
          const htmlText = await cloneRes.text();
          const cookies = response.headers.get('set-cookie') || '';
          
          // Look for confirm token
          const confirmMatch = htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) || htmlText.match(/name="confirm"\s+value="([^"]+)"/);
          if (confirmMatch) {
            const confirmToken = confirmMatch[1];
            const confirmedUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
            console.log(`[Drive Download] Found confirm token ${confirmToken}. Downloading confirmed URL...`);
            response = await fetchWithTimeout(confirmedUrl, {
              headers: {
                ...requestHeaders,
                ...(cookies ? { Cookie: cookies } : {})
              },
              redirect: 'follow',
            }, 5000);
            contentType = response.headers.get('content-type') || '';
          } else {
            // Check if this HTML is actually an error/block page or login wall
            if (response.url.includes('accounts.google.com') || (htmlText.includes('Google Drive') && (htmlText.includes('quota') || htmlText.includes('access denied')))) {
              throw new Error(`Google Drive erişim reddedildi veya kota aşıldı (HTML yanıtı). (Immediate skip)`);
            }
          }
        }

        if (response.ok) {
          const finalContentType = response.headers.get('content-type') || '';
          if (response.url.includes('accounts.google.com')) {
            throw new Error('Google Drive dosyası gizli (erişim kısıtlı). Lütfen Google Drive\'da dosya paylaşım ayarlarını "Bağlantıya sahip olan herkes - Görüntüleyici" olarak değiştirin.');
          }
          // If response is still HTML, it means download didn't happen (login wall or access block)
          if (finalContentType.includes('text/html')) {
            throw new Error('Erişim engellendi veya oturum açma sayfası döndürüldü. (Immediate skip)');
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.byteLength > 0) {
            console.log(`[Drive Download] Successfully downloaded ${buffer.byteLength} bytes from: ${url}`);
            return buffer;
          }
        }
        
        // Skip retries on failure (like 401, 403, 500, etc.) as we have many fallback URLs
        throw new Error(`HTTP ${response.status}: ${response.statusText} (Immediate skip)`);
      } catch (err: any) {
        console.warn(`[Drive Download] Failed downloading from ${url}:`, err.message || err);
        lastError = err;

        if (err.message && err.message.includes('Immediate skip')) {
          break; // break the retry loop, try the next URL in the array immediately
        }

        retries--;
        if (retries >= 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  throw new Error(`Google Drive dosyası indirilemedi. Lütfen dosyanın Google Drive'da paylaşıma açık ('Bağlantıya sahip olan herkes - Görüntüleyici' olarak) ayarlandığından emin olun. (Detay: ${lastError?.message || 'Bağlantı kısıtlandı/500'}).`);
}

// Scan a specific file from Google Drive
app.post('/api/drive/scan-file', async (req, res) => {
  const { fileId, fileName, mimeType, brandHint, priceMode, profitMarkup, productTypeHint } = req.body || {};
  try {
    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId zorunludur.' });
    }

    const lowerName = (fileName || '').toLowerCase();
    // HOYA & SEIKO catalogs are large (12-24MB)
    // We used to bypass these to avoid timeouts, but now we allow AI scanning with optimized settings.
    // We only use the fallback if the file is extremely massive or if the AI scan fails.
    
    console.log(`[Drive Scanner] Downloading file: ${fileName} (${fileId}) with priceMode: ${priceMode}...`);
    const buffer = await downloadDriveFileBuffer(fileId, fileName, mimeType);
    console.log(`[Drive Scanner] Downloaded ${fileName} (${buffer.byteLength} bytes). Processing with Gemini...`);

    // Guard against files exceeding Gemini inlineData 15MB safe threshold
    if (buffer.byteLength > 15 * 1024 * 1024) {
      console.log(`[Drive Scanner] Buffer ${Math.round(buffer.byteLength / (1024 * 1024))}MB exceeds 15MB safe threshold. Matching against extracted catalog.`);
      const matched = DRIVE_EXTRACTED_LENSES.filter(l => {
        const b = (l.brand || '').toLowerCase();
        const hint = (brandHint || '').toLowerCase();
        if (hint && (b.includes(hint) || hint.includes(b))) return true;
        if (lowerName.includes('hoya') && b.includes('hoya')) return true;
        if (lowerName.includes('seiko') && b.includes('seiko')) return true;
        if (lowerName.includes('zeiss') && b.includes('zeiss')) return true;
        if (lowerName.includes('rodenstock') && b.includes('rodenstock')) return true;
        return false;
      });
      if (matched.length > 0) {
        return res.json({
          success: true,
          fileId,
          fileName,
          count: matched.length,
          brand: matched[0].brand,
          modelUsed: 'catalog-fallback-size-limit',
          lenses: matched,
        });
      }
    }

    const result = await analyzeBufferWithGemini(
      buffer,
      mimeType || 'application/pdf',
      fileName || 'price_list.pdf',
      brandHint,
      priceMode || 'auto',
      profitMarkup || 2.0,
      productTypeHint || 'auto'
    );

    res.json({
      success: true,
      fileId,
      fileName,
      count: result.lenses.length,
      brand: result.brand,
      modelUsed: result.modelUsed,
      lenses: result.lenses,
    });
  } catch (err: any) {
    console.error('[Drive Scanner] Scan error:', err);

    // Fallback on error to pre-extracted catalog if available
    const lowerName = (fileName || '').toLowerCase();
    const hint = (brandHint || '').toLowerCase();
    const matched = DRIVE_EXTRACTED_LENSES.filter(l => {
      const b = (l.brand || '').toLowerCase();
      if (hint && (b.includes(hint) || hint.includes(b))) return true;
      if (lowerName.includes('hoya') && b.includes('hoya')) return true;
      if (lowerName.includes('seiko') && b.includes('seiko')) return true;
      if (lowerName.includes('zeiss') && b.includes('zeiss')) return true;
      if (lowerName.includes('rodenstock') && b.includes('rodenstock')) return true;
      if (lowerName.includes('cooper') && b.includes('cooper')) return true;
      if (lowerName.includes('fuji') && (b.includes('fujı') || b.includes('fuji'))) return true;
      return false;
    });

    if (matched.length > 0) {
      console.log(`[Drive Scanner] Recovered ${matched.length} lenses for ${fileName} from catalog fallback on error: ${err.message}`);
      return res.json({
        success: true,
        fileId,
        fileName,
        count: matched.length,
        brand: matched[0].brand,
        modelUsed: 'catalog-fallback-on-error',
        lenses: matched,
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || 'Dosya taranırken yapay zeka hatası oluştu.',
    });
  }
});

// Upload and scan local file (PDF or image)
app.post('/api/drive/upload-scan', async (req, res) => {
  try {
    const { fileData, fileName, mimeType, brandHint, priceMode, profitMarkup, productTypeHint } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'fileData (base64) zorunludur.' });
    }

    // Strip data:image/...;base64, prefix if present
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await analyzeBufferWithGemini(
      buffer,
      mimeType || 'application/pdf',
      fileName || 'uploaded_doc.pdf',
      brandHint,
      priceMode || 'auto',
      profitMarkup || 2.0,
      productTypeHint || 'auto'
    );

    res.json({
      success: true,
      fileName,
      count: result.lenses.length,
      brand: result.brand,
      lenses: result.lenses,
    });
  } catch (err: any) {
    console.error('[Upload Scan] Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Yüklenen belge taranamadı.',
    });
  }
});

// Start Express server and mount Vite middleware
async function start() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Optik Fiyat Listesi sunucusu http://localhost:${PORT} portunda çalışıyor`);
  });
}

// Vercel Serverless Function ortamında `listen` yerine `app` dışa aktarılır.
if (!process.env.VERCEL) {
  start();
}

export default app;
