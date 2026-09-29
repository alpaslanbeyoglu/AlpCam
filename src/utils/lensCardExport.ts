import { Lens } from '../types';
import { formatCurrency, sanitizeLens } from './pricing';
import { getEnhancedLensSpecs } from './lensSpecsHelper';

export function generateLensWhatsAppMessage(
  lens: Lens,
  pairCount: 1 | 2 = 2,
  customPrice?: number,
  storeName?: string
): string {
  const sanitized = sanitizeLens(lens);
  const specs = getEnhancedLensSpecs(sanitized);
  const storeHeader = storeName ? `🏬 *${storeName.toUpperCase()}*\n` : '';
  const price = customPrice !== undefined ? customPrice : (sanitized.retailPrice * (specs.isContact ? (pairCount === 2 ? 2 : 1) : pairCount));
  const quantityText = specs.isContact
    ? (pairCount === 2 ? '2 Kutu (Çift Göz)' : '1 Kutu (Tek Göz)')
    : (pairCount === 2 ? 'Çift Cam (2 Adet)' : 'Tek Cam (1 Adet)');

  let message = `${storeHeader}`;
  if (specs.isContact) {
    message += `👁️ *KONTAKT LENS ÜRÜN & TEKNİK BİLGİ KARTI*\n\n`;
    message += `🏷️ *${sanitized.brand} - ${sanitized.name}*\n`;
    message += `📋 *Kullanım Süresi:* ${specs.wearPeriodText}\n`;
    message += `📦 *Kutu İçeriği:* ${specs.boxContent}\n\n`;
    message += `🔬 *Teknik Spesifikasyonlar:*\n`;
    message += `• *Temel Eğri (BC):* ${specs.baseCurve} mm ${specs.hasMultipleBaseCurves ? '(Çift Eğri Seçeneği)' : ''}\n`;
    message += `• *Çap (DIA):* ${specs.diameter} mm\n`;
    message += `• *Su İçeriği:* ${specs.waterContent}\n`;
    if (specs.oxygenTransmissibility) {
      message += `• *Oksijen Geçirgenliği:* ${specs.oxygenTransmissibility}\n`;
    }
    message += `• *Materyal / Polimer:* ${specs.material}\n`;
    message += `• *UV Koruma:* ${specs.uvProtection}\n`;
    message += `• *Diyoptri Aralığı:* ${specs.sphRangeText} ${specs.cylMaxText ? `| CYL: ${specs.cylMaxText}` : ''}\n\n`;
    message += `📦 *Miktar:* ${quantityText}\n`;
    message += `💰 *Tavsiye Satış Fiyatı:* *${formatCurrency(price, sanitized.currency)}* (KDV Dahil)\n\n`;
    message += `_✨ Tüm kontakt lenslerimiz %100 orijinal, barkodlu ve üretici güvenceli steril ambalajında teslim edilir._\n`;
    message += `_📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}_`;
  } else {
    message += `👓 *OPTİK CAM ÜRÜN & TEKNİK BİLGİ KARTI*\n\n`;
    message += `🏷️ *${sanitized.brand} - ${sanitized.name}*\n`;
    message += `✨ *Kaplama & Teknoloji:* ${sanitized.coating || 'Yüksek Kalite Standart Kaplama'}\n\n`;
    message += `🔬 *Teknik Özellikler:*\n`;
    message += `• *Kırılma İndeksi:* ${specs.index} İndeks\n`;
    message += `• *Abbe Değeri (Optik Netlik):* ${specs.abbeValue} Abbe\n`;
    message += `• *Hammadde / Materyal:* ${specs.material}\n`;
    message += `• *UV Koruma:* ${specs.uvProtection}\n`;
    message += `• *Özgül Ağırlık / Yoğunluk:* ${specs.density}\n`;
    message += `• *Çerçeve Uyumu:* ${specs.frameCompatibility}\n`;
    message += `• *Üretim Aralığı:* SPH: ${specs.sphRangeText} | CYL: ±${sanitized.cylMax ?? 2.00} Dpt\n`;
    message += `• *Teslimat Durumu:* ${sanitized.deliveryType === 'stock' ? 'Stok Cam (Aynı Gün)' : 'RX Özel Üretim (3-5 Gün)'}\n\n`;
    message += `📦 *Miktar:* ${quantityText}\n`;
    message += `💰 *Tavsiye Satış Fiyatı:* *${formatCurrency(price, sanitized.currency)}* (KDV Dahil)\n\n`;
    message += `_✨ Tüm camlarımız %100 orijinal, barkodlu ve garanti sertifikası ile teslim edilir._\n`;
    message += `_📅 Tarih: ${new Date().toLocaleDateString('tr-TR')}_`;
  }

  return message;
}

export function exportLensCardToPDF(
  lens: Lens,
  pairCount: 1 | 2 = 2,
  customPrice?: number,
  storeName?: string
): void {
  const sanitized = sanitizeLens(lens);
  const specs = getEnhancedLensSpecs(sanitized);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın pop-up engelleyicisini kapatınız.');
    return;
  }

  const storeTitle = storeName ? storeName.toUpperCase() : 'PROFESYONEL OPTİK DANIŞMANLIĞI';
  const price = customPrice !== undefined ? customPrice : (sanitized.retailPrice * (specs.isContact ? (pairCount === 2 ? 2 : 1) : pairCount));
  const quantityText = specs.isContact
    ? (pairCount === 2 ? '2 Kutu (Çift Göz Paketi)' : '1 Kutu (Tek Göz Paketi)')
    : (pairCount === 2 ? 'Çift Cam (2 Adet)' : 'Tek Cam (1 Adet)');

  const docTitle = specs.isContact
    ? '👁️ KONTAKT LENS ÜRÜN & TEKNİK BİLGİ KARTI'
    : '👓 OPTİK CAM ÜRÜN & TEKNİK BİLGİ KARTI';

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${sanitized.brand} - ${sanitized.name} | ${storeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 30px; margin: 0; background: #fff; line-height: 1.4; }
    .card-container { max-width: 760px; margin: 0 auto; border: 2px solid #0284c7; border-radius: 16px; padding: 25px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .store-name { font-size: 20px; font-weight: 900; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0; }
    .doc-title { font-size: 13px; font-weight: 700; color: #475569; margin: 0; }
    .meta { font-size: 11px; text-align: right; color: #64748b; }
    
    .product-hero { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 15px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand-badge { display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #0284c7; color: #fff; padding: 3px 8px; border-radius: 6px; margin-bottom: 6px; }
    .product-name { font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; }
    .product-sub { font-size: 12px; color: #475569; margin-top: 3px; }
    
    .price-badge { text-align: right; }
    .price-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .price-value { font-size: 22px; font-weight: 900; color: #059669; }
    
    .section-title { font-size: 13px; font-weight: 800; color: #0369a1; text-transform: uppercase; margin: 20px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; align-items: center; gap: 6px; }
    
    .specs-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
    .spec-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
    .spec-item.highlight { background: #f0fdfa; border-color: #5eead4; }
    .spec-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .spec-value { font-size: 13px; font-weight: 800; color: #0f172a; }
    
    .features-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 15px; margin-bottom: 20px; font-size: 12px; color: #92400e; }
    .guarantee-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 15px; font-size: 11px; color: #166534; line-height: 1.5; }
    
    .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    
    .print-btn-bar { text-align: center; margin-top: 25px; }
    .print-btn { background: #0284c7; color: #fff; border: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .print-btn:hover { background: #0369a1; }
    
    @media print {
      body { padding: 0; }
      .card-container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="header">
      <div>
        <h1 class="store-name">🏬 ${storeTitle}</h1>
        <div class="doc-title">${docTitle}</div>
      </div>
      <div class="meta">
        <div><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</div>
        <div>Profesyonel Danışmanlık ve Bilgilendirme</div>
      </div>
    </div>

    <div class="product-hero">
      <div>
        <span class="brand-badge">${sanitized.brand}</span>
        <h2 class="product-name">${sanitized.name}</h2>
        <div class="product-sub">
          ${specs.isContact ? `Kullanım: <strong>${specs.wearPeriodText}</strong> • Kutu: <strong>${specs.boxContent}</strong>` : `Kaplama: <strong>${sanitized.coating || 'Standart Yüksek Kalite'}</strong>`}
        </div>
      </div>
      <div class="price-badge">
        <div class="price-label">Tavsiye Satış Tutarı (${quantityText})</div>
        <div class="price-value">${formatCurrency(price, sanitized.currency)}</div>
      </div>
    </div>

    <div class="section-title">
      <span>🔬 Teknik Özellikler & Üretim Parametreleri</span>
    </div>

    <div class="specs-grid">
      ${specs.isContact ? `
        <div class="spec-item highlight">
          <div class="spec-label">🎯 Temel Eğri (Base Curve - BC)</div>
          <div class="spec-value">${specs.baseCurve} mm ${specs.hasMultipleBaseCurves ? '(Çift Eğri Üretim Seçenekli)' : ''}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">📏 Çap (Diameter - DIA)</div>
          <div class="spec-value">${specs.diameter} mm</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">💧 Su İçeriği</div>
          <div class="spec-value">${specs.waterContent}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">💨 Oksijen Geçirgenliği (Dk/t)</div>
          <div class="spec-value">${specs.oxygenTransmissibility || '100+ Dk/t'}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🧪 Materyal / Polimer Teknolojisi</div>
          <div class="spec-value">${specs.material}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">☀️ UV Koruması</div>
          <div class="spec-value">${specs.uvProtection}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🌐 Sferik / Silindirik Üretim Aralığı</div>
          <div class="spec-value">${specs.sphRangeText} ${specs.cylMaxText ? `| CYL: ${specs.cylMaxText}` : ''}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">📦 Teslimat / Tedarik</div>
          <div class="spec-value">${sanitized.deliveryType === 'stock' ? 'Stok Lens (Aynı Gün)' : 'Özel Sipariş / RX Lens'}</div>
        </div>
      ` : `
        <div class="spec-item highlight">
          <div class="spec-label">💎 Kırılma İndeksi (İncelik Oranı)</div>
          <div class="spec-value">${specs.index} İndeks</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🌈 Abbe Değeri (Optik Netlik)</div>
          <div class="spec-value">${specs.abbeValue} Abbe</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🧪 Hammadde / Materyal</div>
          <div class="spec-value">${specs.material}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">☀️ UV Filtre Koruması</div>
          <div class="spec-value">${specs.uvProtection}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">⚖️ Özgül Ağırlık / Yoğunluk</div>
          <div class="spec-value">${specs.density}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">👓 Çerçeve Uyumu & Direnç</div>
          <div class="spec-value">${specs.frameCompatibility}</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🌐 Sferik & Silindirik Güç Limiti</div>
          <div class="spec-value">SPH: ${specs.sphRangeText} | CYL: ±${sanitized.cylMax ?? 2.00} Dpt</div>
        </div>
        <div class="spec-item">
          <div class="spec-label">🚚 Teslimat / Üretim Türü</div>
          <div class="spec-value">${sanitized.deliveryType === 'stock' ? 'Stok Cam (Aynı Gün)' : 'RX Özel Üretim (3-5 İş Günü)'}</div>
        </div>
      `}
    </div>

    ${sanitized.notes ? `
      <div class="features-box">
        <strong>💡 Optisyen & Ürün Notu:</strong> ${sanitized.notes}
      </div>
    ` : ''}

    <div class="guarantee-box">
      <strong>🛡️ Orijinallik ve Garanti Sertifikası:</strong><br>
      Bu bilgi kartında yer alan tüm ürünler %100 orijinal, barkodlu ve distribütör/üretici garantisi ile sunulmaktadır. Göz sağlığınız ve net görüş konforunuz için profesyonel optik danışmanlık hizmetimiz devam etmektedir.
    </div>

    <div class="print-btn-bar no-print">
      <button onclick="window.print()" class="print-btn">
        🖨️ Bilgi Kartını PDF Olarak Kaydet / Yazdır
      </button>
    </div>

    <div class="footer">
      Optik Yönetim ve Satış Asistanı • Ürün ve Teknik Spesifikasyon Bilgilendirme Belgesi
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
