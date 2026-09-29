import React from 'react';
import { X, Sparkles, Glasses, Check, Award, Star } from 'lucide-react';

interface HoyaProgressiveTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeries?: string;
}

export const HoyaProgressiveTableModal: React.FC<HoyaProgressiveTableModalProps> = ({
  isOpen,
  onClose,
  initialSeries = 'Balansis',
}) => {
  if (!isOpen) return null;

  const models = [
    { key: 'amplitude', name: 'Amplitude Plus', colBg: 'bg-slate-100 text-slate-800' },
    { key: 'daynamic', name: 'Daynamic', colBg: 'bg-emerald-100 text-emerald-900' },
    { key: 'balansis', name: 'Balansis', colBg: 'bg-amber-100 text-amber-900 font-black' },
    { key: 'lifestyle', name: 'iD Lifestyle 4', colBg: 'bg-cyan-100 text-cyan-900' },
    { key: 'myself', name: 'iD MySelf', colBg: 'bg-blue-100 text-blue-900' },
    { key: 'mysense', name: 'iD MySense', colBg: 'bg-indigo-100 text-indigo-900' },
  ];

  const features = [
    { title: 'IntelliSense Teknolojisi', desc: 'Kullanıcının "Görsel Duyusal Zekasına" göre görüş alanını optimize eder.', vals: [false, false, false, false, true, true] },
    { title: 'Aksiyel Uzunluk', desc: 'Her bir gözün aksiyel uzunluğunu cam tasarımına entegre ederek distorsiyonu azaltır.', vals: [false, false, false, false, true, true] },
    { title: 'Kişiselleştirilmiş Tasarımlar', desc: 'Kullanıcının yaşam tarzına göre görsel ihtiyaçlarını karşılamak için sınırsız tasarım.', vals: [false, false, false, true, true, true] },
    { title: 'Akıllı Analiz', desc: 'Görsel performansı etkileyen temel faktörleri dikkate alarak optimize edilmiş görüş sağlar.', vals: [false, false, false, true, true, true] },
    { title: 'AdapTease Technology', desc: 'Güç değişiminin olduğu bölgede görüş alanı genişletir, uzak görüşten ödün vermez.', vals: [false, false, false, true, true, true] },
    { title: '3D Binocular Vision', desc: 'Camın periferik bölgelerinde oluşabilecek istenmeyen prizmatik etkileri telafi eder.', vals: [false, false, true, true, true, true] },
    { title: 'Binocular Harmonization Technology', desc: 'Sağ ve sol göz reçetesini ayrı ayrı bileşenler olarak değerlendirerek hesaplar.', vals: [false, false, true, true, true, true] },
    { title: 'Inset Optimisation', desc: 'Monoküler PD ölçümlerini dahil ederek hassas inset hesaplaması yapar.', vals: [false, false, true, true, true, true] },
    { title: 'Binocular Eye Model', desc: 'Beş farklı binoküler değerlendirme yönteminin birleşimiyle tasarımın performansını analiz eder.', vals: [false, false, true, true, true, true] },
    { title: 'Yaşam Tarzına Göre Kişiselleştirme', desc: 'Hastaların yaşam tarzı ve aktivitelerine göre önceden tanımlanmış tasarım varyasyonları.', vals: ['3', '∞', '∞', 'Var', 'Var', 'Var'] },
    { title: 'Otomatik Ayarlama', desc: 'Prizmatik reçetelerde oluşan prizma etkisine bağlı olarak kayma gösteren progressive ayarı.', vals: [false, false, true, true, true, true] },
    { title: 'Entegre Çift Yüzey Tasarımı', desc: 'Dikey ve yatay progressive bileşenleri camın ön ve arka yüzeyine dağıtan entegre tasarım.', vals: [false, true, true, true, true, true] },
    { title: 'Stabil Görüş', desc: 'Dinamik durumlarda stabil görüntü algısı sağlar.', vals: [false, true, true, true, true, true] },
    { title: 'Görüş Alanı Genişletme', desc: 'Camın periferine kadar görsel alanları maksimize eder.', vals: [true, true, true, true, true, true] },
    { title: 'Güç Optimizasyonu', desc: 'Diyoptri değerine göre tasarım varyasyonu oluşturur.', vals: [true, true, true, true, true, true] },
    { title: 'Yeni HOYA iSelect', desc: 'Bireysel reçeteyi, kullanım geçmişini, kullanım parametrelerini ve yaşam tarzı tercihlerini kaydeder.', vals: [true, true, true, true, true, true] },
    { title: 'Çoklu Koridor Uzunlukları', desc: 'Her çerçeve tipi için uygun progressive dağılım sağlar.', vals: ['2', '2', '2', '6', '6', '7'] },
    { title: 'QuicScan Teknolojisi', desc: 'HOYA\'nın arka yüzey teknolojisi ile progressive bileşeni camın arka yüzeyine yerleştirir.', vals: [true, true, true, true, true, true] },
    { title: 'QuicFocus Teknolojisi', desc: 'Yakın okuma gücünü ve monoküler PD\'yi dikkate alarak inset hesaplamasını hassas şekilde yapar.', vals: [true, true, true, true, true, true] },
  ];

  const ratings = [
    { name: 'Geniş görüş alanları', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Hareket halinde stabil görüş hissi', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Geniş ara mesafe görüş alanı', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Yan bakışlarda dahi net ve doğru görüş', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Yakın ve uzak arasında hızlı geçiş', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Sürüş sırasında konfor', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Okuma sırasında konfor', scores: [2, 3, 4, 5, 5, 5] },
    { name: 'Kolay adaptasyon', scores: [3, 4, 4, 5, 5, 5] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Glasses className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  HOYA VISION CARE
                </span>
                <span className="text-xs text-slate-400">Resmi Katalog Karşılaştırma</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Progresif Camlar Özellik ve Performans Kıyaslama Tablosu
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 text-xs">
          {/* Table 1: Features matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>1. Teknik Özellikler ve Teknolojik Donanım Karşılaştırması</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                      <th className="p-3 font-extrabold w-1/3">Özellikler & Avantajlar</th>
                      {models.map((m) => (
                        <th key={m.key} className={`p-3 text-center font-black ${m.colBg} border-l border-slate-200`}>
                          {m.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {features.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{f.title}</span>
                          <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{f.desc}</span>
                        </td>
                        {f.vals.map((val, vIdx) => (
                          <td key={vIdx} className="p-3 text-center border-l border-slate-100 align-middle">
                            {typeof val === 'boolean' ? (
                              val ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold mx-auto">
                                  ●
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )
                            ) : (
                              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                {val}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Table 2: Performance Ratings */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>2. Performans ve Konfor Değerlendirme Puanları</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200">
                      <th className="p-3 font-extrabold w-1/3">Performans Kriteri</th>
                      {models.map((m) => (
                        <th key={m.key} className={`p-3 text-center font-black ${m.colBg} border-l border-slate-200`}>
                          {m.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ratings.map((r, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-bold text-slate-900">{r.name}</td>
                        {r.scores.map((score, sIdx) => (
                          <td key={sIdx} className="p-3 text-center border-l border-slate-100 align-middle">
                            <div className="flex items-center justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <div
                                  key={star}
                                  className={`w-3.5 h-1.5 rounded-xs ${
                                    star <= score
                                      ? sIdx === 2
                                        ? 'bg-amber-500'
                                        : sIdx >= 3
                                        ? 'bg-blue-600'
                                        : 'bg-slate-700'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            * Tablodaki veriler HOYA Vision Care resmi teknik progresif portföy kıyaslama kılavuzundan derlenmiştir.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
          >
            Tabloyu Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
