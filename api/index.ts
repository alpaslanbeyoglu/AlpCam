import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
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
  listType: 'perakende' | 'toptan' | 'kampanya' | 'genel';
  sizeFormatted?: string;
  downloadUrl: string;
  driveViewUrl: string;
}

// Helper to deduce brand and category from filename
function inferFileInfo(fileName: string, mimeType: string, id: string): ParsedDriveFile {
  const lower = fileName.toLowerCase();
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

  let listType: 'perakende' | 'toptan' | 'kampanya' | 'genel' = 'genel';
  if (lower.includes('kampanya')) listType = 'kampanya';
  else if (lower.includes('toptan') || lower.includes('tfl') || lower.includes('cv toptan')) listType = 'toptan';
  else if (lower.includes('perakende') || lower.includes('parakende') || lower.includes('pfl')) listType = 'perakende';

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
    downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    driveViewUrl: `https://drive.google.com/file/d/${id}/view`,
  };
}

// Parse Google Drive shared folder HTML
async function fetchDriveFolderFiles(folderUrl: string): Promise<ParsedDriveFile[]> {
  try {
    const res = await fetch(folderUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Google Drive klasörüne erişilemedi: HTTP ${res.status}`);
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
        files.push(inferFileInfo(name, mime, id));
      }
    }

    return files;
  } catch (err: any) {
    console.error('Error in fetchDriveFolderFiles:', err);
    throw err;
  }
}

// Generate lenses using Gemini with model fallback and Admin Price Mode decision
async function analyzeBufferWithGemini(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  brandHint?: string,
  priceMode: 'wholesale' | 'retail' | 'auto' = 'auto',
  profitMarkup: number = 2.0,
  productTypeHint: 'auto' | 'eyeglass_lens' | 'contact_lens' = 'auto'
) {
  const b64 = buffer.toString('base64');
  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
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
  let detectedListType: 'perakende' | 'toptan' | 'kampanya' | 'genel' = 'genel';
  if (fileName.toLowerCase().includes('pfl') || fileName.toLowerCase().includes('perakende')) {
    detectedListType = 'perakende';
  } else if (fileName.toLowerCase().includes('tfl') || fileName.toLowerCase().includes('toptan')) {
    detectedListType = 'toptan';
  } else if (fileName.toLowerCase().includes('kampanya') || fileName.toLowerCase().includes('kampanyasi')) {
    detectedListType = 'kampanya';
  }

  if (priceMode === 'wholesale' || detectedListType === 'toptan') {
    adminInstruction = `\n*** YÖNETİCİ TALİMATI: Bu belge KESİNLİKLE TOPTAN (ALIŞ / TFL) FİYAT LİSTESİDİR. Belgedeki tüm fiyat sütunlarını wholesalePrice olarak kaydet.`;
  } else if (priceMode === 'retail' || detectedListType === 'perakende') {
    adminInstruction = `\n*** YÖNETİCİ TALİMATI: Bu belge KESİNLİKLE PERAKENDE (TAVSİYE EDİLEN SATIŞ / PFL) FİYAT LİSTESİDİR. Belgedeki tüm fiyatları retailPrice olarak kaydet.`;
  }

  let productTypeInstruction = '';
  if (productTypeHint === 'contact_lens' || fileName.toLowerCase().includes('lens') || fileName.toLowerCase().includes('coopervision') || fileName.toLowerCase().includes('opsa') || fileName.toLowerCase().includes('alcon') || fileName.toLowerCase().includes('bausch')) {
    productTypeInstruction = `\n*** YÖNETİCİ TALİMATI: Bu liste KONTAKT LENS listesidir. productType değerini 'contact_lens' yap, kutu adedi, değişim sıklığı (aylık/günlük/15 günlük), BC eğrisi ve lens tipini (sferik/torik/multifokal/renkli) eksiksiz çıkar.`;
  } else if (productTypeHint === 'eyeglass_lens') {
    productTypeInstruction = `\n*** YÖNETİCİ TALİMATI: Bu liste GÖZLÜK CAMI listesidir. productType değerini 'eyeglass_lens' yap.`;
  }

  const prompt = `Sen Türkiye optik gözlük camı ve kontakt lens sektöründe en üst düzey uzman yapay zekasın.
Verilen dosya (${fileName}) bir optik cam veya kontakt lens fiyat listesi, toptan (TFL) / perakende (PFL) katalogu, kampanya tablosu veya PDF broşürüdür.
${brandHint ? `Öncelikli Marka: ${brandHint}` : ''}
${adminInstruction}
${productTypeInstruction}

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
        const fileListType: 'perakende' | 'toptan' | 'kampanya' | 'genel' = 
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
          if (priceMode === 'wholesale' || fileListType === 'toptan') {
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
        
        // Wait and retry if it's a 503 or 429
        if (err?.status === 503 || err?.message?.includes('503') || err?.status === 429 || err?.message?.includes('429')) {
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
        
        // Break out of the while loop to move to the next model
        break;
      }
    }
  }

  throw lastError || new Error('Tüm Gemini modelleri yanıt veremedi.');
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

    let targetUrl = rawUrl.trim();
    // Check if it's a Google Sheet
    const sheetMatch = rawUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetMatch && sheetMatch[1]) {
      targetUrl = `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/gviz/tq?tqx=out:csv`;
    } else {
      const driveFileMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/);
      if (driveFileMatch && driveFileMatch[1]) {
        targetUrl = `https://drive.google.com/uc?export=download&id=${driveFileMatch[1]}`;
      }
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Google Drive dosyasına erişilemedi (HTTP ${response.status})`,
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
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

async function downloadDriveFileBuffer(fileId: string): Promise<Buffer> {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  let downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let response = await fetch(downloadUrl, {
    headers: { 'User-Agent': userAgent },
    redirect: 'follow',
  });

  // Check if Google Drive returned a virus scan confirmation HTML page
  let contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const htmlText = await response.text();
    const cookies = response.headers.get('set-cookie') || '';
    
    // Look for confirm token
    const confirmMatch = htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) || htmlText.match(/name="confirm"\s+value="([^"]+)"/);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const confirmedUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
      response = await fetch(confirmedUrl, {
        headers: {
          'User-Agent': userAgent,
          ...(cookies ? { Cookie: cookies } : {})
        },
        redirect: 'follow',
      });
    } else {
      // Direct alternate link
      const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
      const directRes = await fetch(directUrl, {
        headers: { 'User-Agent': userAgent },
        redirect: 'follow',
      });
      if (directRes.ok && !(directRes.headers.get('content-type') || '').includes('text/html')) {
        response = directRes;
      }
    }
  }

  if (!response.ok) {
    throw new Error(`Google Drive dosyası indirilemedi (HTTP ${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0) {
    throw new Error('İndirilen dosya içeriği boş.');
  }
  return buffer;
}

// Scan a specific file from Google Drive
app.post('/api/drive/scan-file', async (req, res) => {
  const { fileId, fileName, mimeType, brandHint, priceMode, profitMarkup, productTypeHint } = req.body || {};
  try {
    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId zorunludur.' });
    }

    const lowerName = (fileName || '').toLowerCase();
    const isLargeHoya = lowerName.includes('hoya') && (lowerName.includes('perakende') || lowerName.includes('toptan'));

    // HOYA Perakende & Toptan files are 24MB, which exceeds Gemini inlineData 20MB limit and causes Cloud Run proxy timeouts
    if (isLargeHoya) {
      console.log(`[Drive Scanner] Known large HOYA catalog file detected (${fileName}). Serving verified catalog.`);
      const hoyaLenses = DRIVE_EXTRACTED_LENSES.filter(l => (l.brand || '').toLowerCase().includes('hoya'));
      if (hoyaLenses.length > 0) {
        return res.json({
          success: true,
          fileId,
          fileName,
          count: hoyaLenses.length,
          brand: 'HOYA',
          modelUsed: 'pre-extracted-catalog',
          lenses: hoyaLenses,
        });
      }
    }

    console.log(`[Drive Scanner] Downloading file: ${fileName} (${fileId}) with priceMode: ${priceMode}...`);
    const buffer = await downloadDriveFileBuffer(fileId);
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
