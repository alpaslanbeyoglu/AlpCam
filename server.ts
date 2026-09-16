import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini client strictly with server-side API key and User-Agent telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1Euefi9y_ngCtzEVcOs4mi2cJZKHZ-SBB?usp=sharing';

interface ParsedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  format: 'pdf' | 'image' | 'excel' | 'other';
  brand: string;
  listType: 'perakende' | 'toptan' | 'kampanya' | 'genel';
  sizeFormatted?: string;
  downloadUrl: string;
  driveViewUrl: string;
}

// Helper to deduce brand and category from filename
function inferFileInfo(fileName: string, mimeType: string, id: string): ParsedDriveFile {
  const lower = fileName.toLowerCase();
  let brand = 'Diğer';
  if (lower.includes('rodenstock')) brand = 'Rodenstock';
  else if (lower.includes('zeiss')) brand = 'Zeiss';
  else if (lower.includes('seiko')) brand = 'SEIKO';
  else if (lower.includes('hoya')) brand = 'HOYA';
  else if (lower.includes('fuji')) brand = 'FUJİ';
  else if (lower.includes('hawk')) brand = 'HAWK PLUS';
  else if (lower.includes('novax')) brand = 'Novax';
  else if (lower.includes('cv') || lower.includes('cooper')) brand = 'CooperVision';
  else if (lower.includes('opsa') || lower.includes('adore') || lower.includes('desio')) brand = 'Opsa / Desio';
  else if (lower.includes('medikal') || lower.includes('lens')) brand = 'Bausch + Lomb / Lens';

  let listType: 'perakende' | 'toptan' | 'kampanya' | 'genel' = 'genel';
  if (lower.includes('kampanya')) listType = 'kampanya';
  else if (lower.includes('toptan') || lower.includes('tfl')) listType = 'toptan';
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

// Generate lenses using Gemini with model fallback
async function analyzeBufferWithGemini(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  brandHint?: string
) {
  const b64 = buffer.toString('base64');
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

  const prompt = `Sen Türkiye optik gözlük ve cam sektöründe uzman bir yapay zekasın.
Verilen dosya (${fileName}) bir optik cam fiyat listesi, toptan/perakende katalogu veya kampanya görselidir.
${brandHint ? `Öncelikli Marka: ${brandHint}` : ''}

Lütfen bu belgeden optik cam modellerini, indekslerini, kaplamalarını, toptan ve perakende fiyatlarını tespit et.
Eğer belgede sadece toptan fiyat varsa wholesalePrice alanına yaz, retailPrice null bırak.
Eğer belgede sadece perakende fiyat varsa retailPrice alanına yaz, wholesalePrice null bırak.
Eğer kampanya görseli ise kampanya şartlarını ve modellerini çıkar.

JSON çıktısı şu formatta OLMALIDIR:
{
  "brand": "Marka Adı",
  "lenses": [
    {
      "name": "Cam Model Adı (örn: Perfalit 1.60 Solitaire Protect Balance 2)",
      "brand": "Marka Adı",
      "category": "single_vision veya progressive veya office veya photochromic veya sun_polarized veya custom_rx",
      "index": "1.50 veya 1.56 veya 1.60 veya 1.67 veya 1.74",
      "material": "Organik / Polikarbon / Trivex / MR-8 / Mineral",
      "coating": "Kaplama adı (örn: Antirefle, Crizal, DuraVision, SuperClean)",
      "wholesalePrice": 1250,
      "retailPrice": 2500,
      "currency": "TRY",
      "deliveryType": "stock veya rx",
      "notes": "Varsa sferik aralık, kampanya notu veya teslimat özelliği"
    }
  ]
}
Sadece geçerli bir JSON döndür.`;

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Scanning ${fileName} with model ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: mimeType.includes('pdf') ? 'application/pdf' : 'image/jpeg',
              data: b64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText.trim());
      const rawLenses = Array.isArray(parsed) ? parsed : (parsed.lenses || []);
      
      // Standardize extracted lenses with IDs
      const lenses = rawLenses.map((l: any, idx: number) => ({
        id: `drive-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        brand: l.brand || parsed.brand || brandHint || 'Genel',
        name: l.name || `${brandHint || 'Optik'} Cam`,
        category: l.category || 'single_vision',
        index: l.index ? String(l.index).replace(',', '.') : '1.56',
        material: l.material || 'Organik',
        coating: l.coating || 'Standart Antirefle',
        wholesalePrice: Number(l.wholesalePrice) || 0,
        retailPrice: Number(l.retailPrice) || (Number(l.wholesalePrice) ? Number(l.wholesalePrice) * 2 : 0),
        currency: l.currency || 'TRY',
        deliveryType: l.deliveryType || 'stock',
        notes: l.notes || `Google Drive'dan tarandı (${fileName})`,
        updatedAt: new Date().toISOString().split('T')[0],
      }));

      return {
        brand: parsed.brand || brandHint || 'Optik',
        lenses,
        modelUsed: modelName,
      };
    } catch (err: any) {
      console.warn(`[Gemini] Model ${modelName} failed on ${fileName}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('Tüm Gemini modelleri yanıt veremedi.');
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Scan a specific file from Google Drive
app.post('/api/drive/scan-file', async (req, res) => {
  try {
    const { fileId, fileName, mimeType, brandHint } = req.body;
    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId zorunludur.' });
    }

    console.log(`[Drive Scanner] Downloading file: ${fileName} (${fileId})...`);
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const fileRes = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!fileRes.ok) {
      return res.status(500).json({
        success: false,
        error: `Dosya indirilemedi (HTTP ${fileRes.status})`,
      });
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[Drive Scanner] Downloaded ${fileName} (${buffer.byteLength} bytes). Processing with Gemini...`);

    const result = await analyzeBufferWithGemini(
      buffer,
      mimeType || 'application/pdf',
      fileName || 'price_list.pdf',
      brandHint
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
    res.status(500).json({
      success: false,
      error: err.message || 'Dosya taranırken yapay zeka hatası oluştu.',
    });
  }
});

// Upload and scan local file (PDF or image)
app.post('/api/drive/upload-scan', async (req, res) => {
  try {
    const { fileData, fileName, mimeType, brandHint } = req.body;
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
      brandHint
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
  if (process.env.NODE_ENV !== 'production') {
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

start();
