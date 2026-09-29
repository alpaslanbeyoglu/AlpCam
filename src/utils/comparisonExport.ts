import { Lens } from '../types';
import { formatCurrency, sanitizeLens, calculateLensFinancials } from './pricing';
import { getEnhancedLensSpecs } from './lensSpecsHelper';

export function exportComparisonToPDF(
  lenses: Lens[],
  pairCount: 1 | 2 = 2,
  storeName?: string,
  isCustomerMode: boolean = true
): void {
  if (lenses.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Lütfen tarayıcınızın pop-up engelleyicisini kapatınız.');
    return;
  }

  const storeTitle = storeName ? storeName.toUpperCase() : 'PROFESYONEL OPTİK DANIŞMANLIĞI';
  const hasContact = lenses.some(l => l.productType === 'contact_lens' || l.category === 'contact_lens');
  const hasEyeglass = lenses.some(l => l.productType !== 'contact_lens' && l.category !== 'contact_lens');

  let title = '👓 OPTİK CAM VE LENS KIYASLAMA TABLOSU';
  if (hasContact && !hasEyeglass) title = '👁️ KONTAKT LENS KIYASLAMA VE ÖZELLİK TABLOSU';
  else if (!hasContact && hasEyeglass) title = '👓 OPTİK CAM KIYASLAMA VE ÖZELLİK TABLOSU';

  const specsList = lenses.map(l => {
    const s = sanitizeLens(l);
    return {
      lens: s,
      specs: getEnhancedLensSpecs(s),
      price: s.retailPrice * (s.productType === 'contact_lens' ? (pairCount === 2 ? 2 : 1) : pairCount),
    };
  });

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Ürün Kıyaslama Raporu - ${storeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 25px; margin: 0; background: #fff; line-height: 1.35; }
    .report-container { max-width: 1000px; margin: 0 auto; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
    .store-name { font-size: 20px; font-weight: 900; color: #0369a1; text-transform: uppercase; margin: 0 0 3px 0; }
    .report-title { font-size: 13px; font-weight: 700; color: #475569; margin: 0; }
    .meta { font-size: 11px; text-align: right; color: #64748b; }
    
    .table-container { width: 100%; overflow-x: auto; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 12px; vertical-align: top; word-break: break-word; }
    
    .th-feature { width: 22%; background: #f8fafc; color: #334155; font-weight: 800; font-size: 11px; text-transform: uppercase; }
    .th-product { background: #f0f9ff; color: #0369a1; font-weight: 900; font-size: 13px; text-align: center; border-bottom: 2px solid #0284c7; }
    .brand-tag { display: inline-block; font-size: 10px; font-weight: 800; background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; }
    .product-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; }
    
    .category-row { background: #e0f2fe; color: #0369a1; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .row-label { font-weight: 700; color: #475569; background: #f8fafc; font-size: 11px; }
    
    .highlight-bc { background: #fef3c7; color: #92400e; font-weight: 800; padding: 3px 6px; border-radius: 4px; display: inline-block; border: 1px solid #fde68a; }
    .highlight-val { font-weight: 800; color: #0f172a; }
    .price-cell { background: #f0fdf4; color: #166534; font-size: 15px; font-weight: 900; text-align: center; }
    
    .guarantee-box { margin-top: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; font-size: 11px; color: #166534; }
    .footer { margin-top: 25px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    
    .print-btn-bar { text-align: center; margin: 20px 0; }
    .print-btn { background: #0284c7; color: #fff; border: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    
    @media print {
      body { padding: 5px; }
      .no-print { display: none !important; }
      table { font-size: 11px; }
      th, td { padding: 6px 8px; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div>
        <h1 class="store-name">🏬 ${storeTitle}</h1>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta">
        <div><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</div>
        <div>Müşteri Karşılaştırma & Bilgilendirme Raporu</div>
      </div>
    </div>

    <div class="print-btn-bar no-print">
      <button onclick="window.print()" class="print-btn">
        🖨️ Kıyaslama Raporunu PDF Olarak Kaydet / Yazdır
      </button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="th-feature">Kıyaslanan Kriterler</th>
            ${specsList.map(item => `
              <th class="th-product">
                <span class="brand-badge">${item.lens.brand}</span>
                <div class="product-title">${item.lens.name}</div>
                <div style="font-size: 10px; color: #64748b; font-weight: normal; margin-top: 2px;">
                  ${item.specs.isContact ? 'Kontakt Lens' : `${item.specs.index} İndeks Cam`}
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <!-- TEMEL OPTİK & TEKNİK BİLGİLER -->
          <tr class="category-row">
            <td colspan="${specsList.length + 1}">🔬 1. Temel Optik & Teknik Özellikler</td>
          </tr>
          <tr>
            <td class="row-label">Ürün Türü & Kategori</td>
            ${specsList.map(i => `<td><strong>${i.specs.isContact ? 'Kontakt Lens' : 'Gözlük Camı'}</strong> (${i.lens.category})</td>`).join('')}
          </tr>
          <tr>
            <td class="row-label">Temel Eğri (BC) / İndeks</td>
            ${specsList.map(i => `
              <td>
                ${i.specs.isContact 
                  ? `<span class="highlight-bc">🎯 BC: ${i.specs.baseCurve} mm</span> ${i.specs.hasMultipleBaseCurves ? '<br><small style="color:#d97706;font-weight:bold;">(Çift Eğri Seçenekli)</small>' : ''}` 
                  : `<span class="highlight-val">💎 ${i.specs.index} İndeks</span>`}
              </td>
            `).join('')}
          </tr>
          <tr>
            <td class="row-label">Çap (DIA / Ø)</td>
            ${specsList.map(i => `<td>${i.specs.isContact ? `${i.specs.diameter} mm` : `Ø ${i.specs.diameter} mm`}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-label">Hammadde / Materyal</td>
            ${specsList.map(i => `<td>${i.specs.material}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-label">Optik Netlik / Oksijen (Dk/t)</td>
            ${specsList.map(i => `
              <td>
                ${i.specs.isContact 
                  ? `<strong>💨 ${i.specs.oxygenTransmissibility || 'Standart'}</strong>` 
                  : `<strong>🌈 ${i.specs.abbeValue} Abbe Değeri</strong>`}
              </td>
            `).join('')}
          </tr>
          <tr>
            <td class="row-label">Su Oranı / Özgül Ağırlık</td>
            ${specsList.map(i => `
              <td>${i.specs.isContact ? `💧 ${i.specs.waterContent}` : `⚖️ ${i.specs.density}`}</td>
            `).join('')}
          </tr>
          <tr>
            <td class="row-label">UV Koruma Seviyesi</td>
            ${specsList.map(i => `<td>☀️ ${i.specs.uvProtection}</td>`).join('')}
          </tr>

          <!-- KAPLAMA & KULLANIM NİTELİKLERİ -->
          <tr class="category-row">
            <td colspan="${specsList.length + 1}">✨ 2. Kaplama, Konfor & Ambalaj Özellikleri</td>
          </tr>
          <tr>
            <td class="row-label">Kaplama / Yüzey Teknolojisi</td>
            ${specsList.map(i => `<td><strong>${i.lens.coating || (i.specs.isContact ? 'Özel Konfor Yüzeyi' : 'Standart Kaplama')}</strong></td>`).join('')}
          </tr>
          <tr>
            <td class="row-label">Kullanım Süresi / Çerçeve Uyumu</td>
            ${specsList.map(i => `<td>${i.specs.isContact ? i.specs.wearPeriodText : i.specs.frameCompatibility}</td>`).join('')}
          </tr>
          <tr>
            <td class="row-label">Kutu / Tedarik Türü</td>
            ${specsList.map(i => `
              <td>${i.specs.isContact ? i.specs.boxContent : (i.lens.deliveryType === 'stock' ? 'Stok Cam (Aynı Gün)' : 'RX Özel Üretim')}</td>
            `).join('')}
          </tr>
          <tr>
            <td class="row-label">Sferik & Silindirik Üretim Aralığı</td>
            ${specsList.map(i => `<td>SPH: ${i.specs.sphRangeText} ${i.specs.cylMaxText ? `| CYL: ${i.specs.cylMaxText}` : ''}</td>`).join('')}
          </tr>
          ${specsList.some(i => i.lens.notes) ? `
            <tr>
              <td class="row-label">Ürün & Optisyen Notu</td>
              ${specsList.map(i => `<td><small>${i.lens.notes || '-'}</small></td>`).join('')}
            </tr>
          ` : ''}

          <!-- FİYATLANDIRMA -->
          <tr class="category-row">
            <td colspan="${specsList.length + 1}">💰 3. Satış Fiyatı & Teklif</td>
          </tr>
          <tr>
            <td class="row-label">Tavsiye Satış Tutarı (${pairCount === 2 ? 'Çift / 2 Kutu' : 'Tek / 1 Kutu'})</td>
            ${specsList.map(i => `
              <td class="price-cell">
                ${formatCurrency(i.price, i.lens.currency)}
                <div style="font-size: 10px; font-weight: normal; color: #15803d; margin-top: 2px;">KDV Dahil</div>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div class="guarantee-box">
      <strong>🛡️ Kalite & Garanti Güvencesi:</strong><br>
      Kıyaslama tablosunda sunulan tüm optik camlar ve kontakt lensler %100 orijinal barkodlu olup, üretici/distribütör garantisiyle teslim edilmektedir. Doğru ürün seçimi ve göz konforunuz için optisyeninizle görüşebilirsiniz.
    </div>

    <div class="footer">
      Optik Yönetim ve Satış Asistanı • Çoklu Ürün Kıyaslama ve Karar Destek Raporu
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function generateComparisonWhatsAppText(
  lenses: Lens[],
  pairCount: 1 | 2 = 2,
  storeName?: string
): string {
  if (lenses.length === 0) return '';
  const storeHeader = storeName ? `🏬 *${storeName.toUpperCase()}*\n` : '';
  let text = `${storeHeader}⚖️ *OPTİK ÜRÜN KIYASLAMA VE ÖZELLİK REHBERİ*\n`;
  text += `📅 *Tarih:* ${new Date().toLocaleDateString('tr-TR')}\n\n`;

  lenses.forEach((l, index) => {
    const s = sanitizeLens(l);
    const specs = getEnhancedLensSpecs(s);
    const price = s.retailPrice * (specs.isContact ? (pairCount === 2 ? 2 : 1) : pairCount);
    const qText = specs.isContact ? (pairCount === 2 ? '2 Kutu' : '1 Kutu') : (pairCount === 2 ? 'Çift Cam' : 'Tek Cam');

    text += `*${index + 1}. SEÇENEK: ${s.brand} - ${s.name}*\n`;
    if (specs.isContact) {
      text += `   • Temel Eğri (BC): ${specs.baseCurve} mm ${specs.hasMultipleBaseCurves ? '(Çift Eğri)' : ''}\n`;
      text += `   • Çap: ${specs.diameter} mm | Su Oranı: ${specs.waterContent}\n`;
      if (specs.oxygenTransmissibility) text += `   • Oksijen (Dk/t): ${specs.oxygenTransmissibility}\n`;
      text += `   • Kullanım / Kutu: ${specs.wearPeriodText} • ${specs.boxContent}\n`;
    } else {
      text += `   • İndeks: ${specs.index} | Abbe Netlik: ${specs.abbeValue} Abbe\n`;
      text += `   • Kaplama: ${s.coating || 'Yüksek Kalite'}\n`;
      text += `   • Materyal: ${specs.material} | UV: ${specs.uvProtection}\n`;
    }
    text += `   • Fiyat (${qText}): *${formatCurrency(price, s.currency)}* (KDV Dahil)\n\n`;
  });

  text += `_✨ Tüm ürünlerimiz %100 orijinal barkodlu ve distribütör garantilidir._`;
  return text;
}
