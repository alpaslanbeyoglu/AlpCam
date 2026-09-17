/**
 * Optik cam ve kontakt lens fiyat listelerinde yer alan "Ürün Kodu" / "Kod"
 * sütunundaki gizli maliyet (toptan alış) fiyatlarını çözümleme motoru.
 * 
 * Sektörel Örnekler:
 * 1) Johnson & Johnson Acuvue Şablonu:
 *    - JLM01337-50 => 1337.50 TL (JLM: Johnson Lens Maliyet, 01337: Lira, 50: Kuruş)
 *    - JLM00840-00 => 840.00 TL
 *    - JLM00205-00 => 205.00 TL
 *    - JLM03167-00 => 3167.00 TL
 * 
 * 2) Optik Cam Gizli Maliyet Kodu Şablonu (Örn: GURUP 6/2 | FİYAT 850 | KOD SO077L):
 *    - SO077L => 77 TL maliyet (Perakende 850 TL iken '077' optisyenin 77 TL net alış maliyetidir)
 *    - SO095L => 95 TL maliyet
 *    - AR0120L => 120 TL maliyet
 *    - CR065 => 65 TL maliyet
 */

export interface ParsedCostResult {
  hasCostCode: boolean;
  rawCode: string;
  parsedCost?: number;
  pattern?: 'jj_format' | 'hidden_optics_code' | 'delimited_cost' | 'direct_numeric';
  patternDescription?: string;
  confidence: 'high' | 'medium';
}

/**
 * Verilen kod metninden toptan maliyet fiyatını çıkarır
 */
export function parseCostFromCode(code: string | undefined | null, retailPrice?: number): ParsedCostResult {
  if (!code || typeof code !== 'string') {
    return { hasCostCode: false, rawCode: '', confidence: 'medium' };
  }

  const trimmed = code.trim().toUpperCase();
  if (trimmed.length < 3) {
    return { hasCostCode: false, rawCode: trimmed, confidence: 'medium' };
  }

  // 1. ŞABLON: Johnson & Johnson ve Benzeri Kuruşlu Format (Örn: JLM01337-50, JLM00840-00, LM01608-00)
  // Format: [Harfler][0-9]{3,5}[-.][0-9]{2}
  const jjMatch = trimmed.match(/^[A-Z]*0*(\d{2,5})[-.](\d{2})$/);
  if (jjMatch) {
    const liras = parseInt(jjMatch[1], 10);
    const kurus = parseInt(jjMatch[2], 10);
    const cost = Number((liras + kurus / 100).toFixed(2));
    if (cost > 0) {
      return {
        hasCostCode: true,
        rawCode: trimmed,
        parsedCost: cost,
        pattern: 'jj_format',
        patternDescription: `Koddan Çözümlendi (${trimmed} ➔ ${cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`,
        confidence: 'high',
      };
    }
  }

  // Metin içinde geçen kuruşlu kod (örn: "Kod: JLM01337-50")
  const jjSubMatch = trimmed.match(/(?:JLM|LM|KOD|KD)0*(\d{2,5})[-.](\d{2})/);
  if (jjSubMatch) {
    const liras = parseInt(jjSubMatch[1], 10);
    const kurus = parseInt(jjSubMatch[2], 10);
    const cost = Number((liras + kurus / 100).toFixed(2));
    if (cost > 0) {
      return {
        hasCostCode: true,
        rawCode: trimmed,
        parsedCost: cost,
        pattern: 'jj_format',
        patternDescription: `Koddan Çözümlendi (${jjSubMatch[0]} ➔ ${cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`,
        confidence: 'high',
      };
    }
  }

  // 2. ŞABLON: Optik Cam Gizli Maliyet Kodu (Örn: SO077L, SO095L, SO0125L, CR055L, AR085)
  // Harf öneki + 0 ile başlayan veya 2-4 haneli rakam + opsiyonel harf soneki
  const hiddenMatch = trimmed.match(/^([A-Z]{1,4})0*(\d{2,4})([A-Z]{0,2})$/);
  if (hiddenMatch) {
    const rawNumStr = hiddenMatch[2];
    const cost = parseInt(rawNumStr, 10);

    // Perakende fiyatı varsa tutarlılık kontrolü:
    // Perakende 850 iken maliyet 77 veya 77.00 mantıklıdır
    if (cost > 0) {
      let isReasonable = true;
      if (retailPrice && retailPrice > 0) {
        // Maliyet perakendeden büyük olamaz (en fazla perakendeye eşit)
        if (cost > retailPrice) {
          isReasonable = false;
        }
      }

      if (isReasonable) {
        return {
          hasCostCode: true,
          rawCode: trimmed,
          parsedCost: cost,
          pattern: 'hidden_optics_code',
          patternDescription: `Gizli Maliyet Kodu (${trimmed} ➔ ${cost} ₺ Maliyet)`,
          confidence: 'high',
        };
      }
    }
  }

  // 3. ŞABLON: Sayısal veya Tireli Kod (Örn: 01337-50 veya 00840-00)
  const numericDelimitedMatch = trimmed.match(/^0*(\d{2,5})[-/](\d{2})$/);
  if (numericDelimitedMatch) {
    const liras = parseInt(numericDelimitedMatch[1], 10);
    const kurus = parseInt(numericDelimitedMatch[2], 10);
    const cost = Number((liras + kurus / 100).toFixed(2));
    return {
      hasCostCode: true,
      rawCode: trimmed,
      parsedCost: cost,
      pattern: 'delimited_cost',
      patternDescription: `Maliyet Kodu (${trimmed} ➔ ${cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺)`,
      confidence: 'high',
    };
  }

  return {
    hasCostCode: false,
    rawCode: trimmed,
    confidence: 'medium',
  };
}

/**
 * Ürünün kodundan maliyet çıkarma işlemini güvenli olarak uygular.
 * Eğer ürünün açıkça toptan fiyatı yoksa ya da koddan maliyet tespit edilmişse döndürür.
 */
export function getLensCostWithCodeParser(lens: {
  productCode?: string;
  costCode?: string;
  notes?: string;
  wholesalePrice?: number;
  retailPrice?: number;
}): {
  effectiveWholesale: number;
  parsedResult?: ParsedCostResult;
  isDerivedFromCode: boolean;
} {
  const codeToTest = lens.productCode || lens.costCode;
  
  // Önce doğrudan kod alanını test et
  if (codeToTest) {
    const parsed = parseCostFromCode(codeToTest, lens.retailPrice);
    if (parsed.hasCostCode && parsed.parsedCost && parsed.parsedCost > 0) {
      return {
        effectiveWholesale: lens.wholesalePrice && lens.wholesalePrice > 0 ? lens.wholesalePrice : parsed.parsedCost,
        parsedResult: parsed,
        isDerivedFromCode: true,
      };
    }
  }

  // Notlar veya model adında kod geçiyor olabilir (örn: "Kod: SO077L" veya "JLM01337-50")
  if (lens.notes) {
    const codeInNotes = lens.notes.match(/([A-Z]{2,4}\d{3,5}[A-Z\d-]*)/i);
    if (codeInNotes) {
      const parsed = parseCostFromCode(codeInNotes[1], lens.retailPrice);
      if (parsed.hasCostCode && parsed.parsedCost && parsed.parsedCost > 0) {
        return {
          effectiveWholesale: lens.wholesalePrice && lens.wholesalePrice > 0 ? lens.wholesalePrice : parsed.parsedCost,
          parsedResult: parsed,
          isDerivedFromCode: true,
        };
      }
    }
  }

  return {
    effectiveWholesale: lens.wholesalePrice || 0,
    isDerivedFromCode: false,
  };
}
