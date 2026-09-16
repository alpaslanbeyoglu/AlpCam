import React from 'react';
import { Globe, Smartphone, CheckCircle, Terminal, HelpCircle, Sparkles, ShieldCheck } from 'lucide-react';

export const GithubGuideView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Introduction Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Globe className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              GitHub Pages Yayınlama & Telefonda Kurulum Kılavuzu
            </h2>
            <p className="text-xs text-slate-500">
              Bu uygulama tamamen istemci tarafında (Client-side SPA) çalışacak şekilde sıfır sunucu bağımlılığıyla mimarilendirilmiştir.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>GitHub Pages İle %100 Tam Uyumlu:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-800">
            Uygulama arka plan sunucusu gerektirmez, statik dosya olarak GitHub Pages üzerinde ücretsiz barındırılabilir. Tüm optik veriler, iskontolarınız ve Google Drive bağlantısı yerel depolamada (LocalStorage) ve Google Drive üzerinden canlı olarak çalışır.
          </p>
        </div>
      </div>

      {/* GitHub Pages Deployment Steps */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-600" />
          <span>GitHub Pages'e Yükleme Adımları (3 Dakika)</span>
        </h3>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0">
              1
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-slate-900">GitHub Repository Oluşturun</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                GitHub hesabınıza girin ve yeni bir repository (depo) oluşturun (örneğin: <code>optik-fiyat-listesi</code>).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0">
              2
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-slate-900">Projeyi Derleyin (Build)</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Uygulama <code>vite.config.ts</code> içerisinde <code>base: './'</code> ayarı hazır olarak yapılandırılmıştır. Terminalden şu komutları çalıştırın:
              </p>
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1">
                <div># Bağımlılıkları kurun ve derleyin:</div>
                <div className="text-emerald-400">npm run build</div>
                <div className="text-slate-400 mt-2"># GitHub Pages için gh-pages paketini kurup yayınlayabilirsiniz:</div>
                <div className="text-sky-300">npx gh-pages -d dist</div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs shrink-0">
              3
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-bold text-slate-900">GitHub Pages Ayarını Aktifleştirin</h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                GitHub reposunda <strong>Settings &gt; Pages</strong> sekmesine gidin. <strong>Branch:</strong> kısmında <code>gh-pages</code> (veya <code>main / root</code>) seçip <strong>Save</strong> butonuna basın.
              </p>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px]">
                Uygulama adresiniz: <strong>https://kullaniciadiniz.github.io/optik-fiyat-listesi/</strong> olacaktır.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone Usage & PWA Guide */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Telefonda Uygulama Olarak Kullanma (Ana Ekrana Ekleme)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* iOS Safari */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block text-sm">iPhone / iPad (Safari)</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>GitHub Pages linkini Safari tarayıcısında açın.</li>
              <li>Alttaki <strong>Paylaş</strong> (kare içinden yukarı ok) simgesine dokunun.</li>
              <li>Aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.</li>
              <li>Sağ üstteki <strong>Ekle</strong> butonuna basın. Artık App Store uygulaması gibi tam ekran çalışır.</li>
            </ol>
          </div>

          {/* Android Chrome */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block text-sm">Android (Chrome)</span>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>GitHub Pages linkini Chrome tarayıcısında açın.</li>
              <li>Sağ üstteki <strong>üç nokta</strong> menüsüne dokunun.</li>
              <li><strong>"Uygulamayı Yükle"</strong> veya <strong>"Ana Ekrana Ekle"</strong> seçeneğine dokunun.</li>
              <li>Uygulama telefonunuzun uygulama çekmecesine anında eklenir ve internetsiz de açılır.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
