import React, { useState } from 'react';
import { CustomList, CustomListItem, BrandDiscount, Lens } from '../types';
import { calculateLensFinancials, formatCurrency } from '../utils/pricing';
import { 
  Plus, Trash2, Share2, Printer, Copy, Check, MessageSquare, 
  FolderPlus, ChevronRight, Edit3, User, Sparkles, ShieldCheck 
} from 'lucide-react';

interface CustomListsViewProps {
  customLists: CustomList[];
  onUpdateLists: (lists: CustomList[]) => void;
  brandDiscounts: BrandDiscount[];
  isCustomerMode: boolean;
  pairCount: 1 | 2;
  onOpenCatalog: () => void;
}

export const CustomListsView: React.FC<CustomListsViewProps> = ({
  customLists,
  onUpdateLists,
  brandDiscounts,
  isCustomerMode,
  pairCount,
  onOpenCatalog,
}) => {
  const [selectedListId, setSelectedListId] = useState<string>(
    customLists[0]?.id || ''
  );
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const activeList = customLists.find((l) => l.id === selectedListId) || customLists[0];

  // Calculate totals for active list
  const listFinancials = React.useMemo(() => {
    if (!activeList || activeList.items.length === 0) {
      return { totalWholesale: 0, totalRetail: 0, totalProfit: 0, profitMargin: 0 };
    }

    let totalWholesale = 0;
    let totalRetail = 0;

    activeList.items.forEach((item) => {
      const q = item.quantity as 1 | 2;
      const fin = calculateLensFinancials(
        item.lensSnapshot,
        brandDiscounts,
        q,
        item.customRetailPrice
      );
      totalWholesale += fin.netWholesaleCost;
      totalRetail += fin.retailPrice;
    });

    const totalProfit = totalRetail - totalWholesale;
    const profitMargin = totalRetail > 0 ? (totalProfit / totalRetail) * 100 : 0;

    return {
      totalWholesale,
      totalRetail,
      totalProfit,
      profitMargin: Number(profitMargin.toFixed(1)),
    };
  }, [activeList, brandDiscounts]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList: CustomList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newListName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
    };

    const next = [...customLists, newList];
    onUpdateLists(next);
    setSelectedListId(newList.id);
    setNewListName('');
    setIsCreatingList(false);
  };

  const handleDeleteList = (listId: string) => {
    if (customLists.length <= 1) {
      alert('En az bir liste kalmalıdır.');
      return;
    }
    if (window.confirm('Bu listeyi ve içindeki camları silmek istediğinize emin misiniz?')) {
      const next = customLists.filter((l) => l.id !== listId);
      onUpdateLists(next);
      if (selectedListId === listId) {
        setSelectedListId(next[0].id);
      }
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (!activeList) return;
    const nextItems = activeList.items.filter((i) => i.id !== itemId);
    const updated = customLists.map((l) =>
      l.id === activeList.id ? { ...l, items: nextItems, updatedAt: new Date().toISOString() } : l
    );
    onUpdateLists(updated);
  };

  const handleUpdateItemPrice = (itemId: string, newPrice: number) => {
    if (!activeList) return;
    const nextItems = activeList.items.map((i) =>
      i.id === itemId ? { ...i, customRetailPrice: newPrice } : i
    );
    const updated = customLists.map((l) =>
      l.id === activeList.id ? { ...l, items: nextItems, updatedAt: new Date().toISOString() } : l
    );
    onUpdateLists(updated);
  };

  const handleUpdateItemQuantity = (itemId: string, quantity: 1 | 2) => {
    if (!activeList) return;
    const nextItems = activeList.items.map((i) =>
      i.id === itemId ? { ...i, quantity } : i
    );
    const updated = customLists.map((l) =>
      l.id === activeList.id ? { ...l, items: nextItems, updatedAt: new Date().toISOString() } : l
    );
    onUpdateLists(updated);
  };

  // Generate WhatsApp message (WITHOUT WHOLESALE DATA - 100% Safe for Customers!)
  const generateWhatsAppText = () => {
    if (!activeList || activeList.items.length === 0) return '';
    let text = `👓 *OPTİK CAM FİYAT TEKLİFİ*\n`;
    text += `📋 *Liste:* ${activeList.name}\n`;
    if (activeList.patientName) {
      text += `👤 *Hasta / Müşteri:* ${activeList.patientName}\n`;
    }
    text += `📅 *Tarih:* ${new Date().toLocaleDateString('tr-TR')}\n\n`;

    activeList.items.forEach((item, index) => {
      const lens = item.lensSnapshot;
      const qText = item.quantity === 2 ? 'Çift Cam' : 'Tek Cam';
      const price = item.customRetailPrice ?? (lens.retailPrice * item.quantity);
      text += `${index + 1}. *${lens.brand} - ${lens.name}*\n`;
      text += `   • İndeks: ${lens.index} | Kaplama: ${lens.coating}\n`;
      text += `   • Miktar: ${qText}\n`;
      text += `   • Satış Fiyatı: ${formatCurrency(price, lens.currency)}\n\n`;
    });

    text += `*Toplam Tutar: ${formatCurrency(listFinancials.totalRetail)}*\n`;
    text += `_Tüm camlarımız orijinal garanti belgesi ve temizleme kiti ile teslim edilir._`;
    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    });
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Official Catalog Guidance Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-sky-900 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>Onaylı Liste Kuralı:</strong> Özel listeleriniz sadece yöneticinin güncel kataloğundan seçilen camları içerir.
          </span>
        </div>
        <button
          onClick={onOpenCatalog}
          className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline whitespace-nowrap"
        >
          Katalogdan Cam Seç +
        </button>
      </div>

      {/* Top Bar: List Selector and New List Button */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* List Tabs / Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {customLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedListId === list.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{list.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedListId === list.id ? 'bg-sky-800 text-sky-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {list.items.length}
              </span>
            </button>
          ))}

          <button
            onClick={() => setIsCreatingList(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-sky-700 hover:bg-sky-50 border border-dashed border-sky-300 flex items-center gap-1 whitespace-nowrap transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Liste</span>
          </button>
        </div>

        {/* Share and Print Actions */}
        {activeList && activeList.items.length > 0 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={handleCopyWhatsApp}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition"
              title="Müşteri Teklif Metnini Kopyala"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotice ? 'Kopyalandı' : 'Metni Kopyala'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition"
              title="WhatsApp İle Paylaş"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              title="Yazdır / PDF Olarak Kaydet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* New List Modal / Inline Form */}
      {isCreatingList && (
        <form
          onSubmit={handleCreateList}
          className="bg-white p-4 rounded-2xl border border-sky-300 shadow-sm flex items-center gap-2"
        >
          <input
            type="text"
            required
            autoFocus
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Liste veya Müşteri Adı (örn: Ahmet Yılmaz Progresif Teklifi, Ofis Paketleri)..."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition"
          >
            Oluştur
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingList(false)}
            className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium"
          >
            İptal
          </button>
        </form>
      )}

      {/* Active List Content */}
      {activeList && (
        <div className="space-y-3">
          {/* List Title and Delete */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{activeList.name}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({activeList.items.length} cam eklendi)
                </span>
              </h2>
            </div>
            <button
              onClick={() => handleDeleteList(activeList.id)}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Listeyi Sil</span>
            </button>
          </div>

          {/* List Financial Summary Banner */}
          {activeList.items.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Retail (Perakende - Always visible) */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                    Toplam Perakende Satış
                  </span>
                  <span className="text-xl font-black text-emerald-700">
                    {formatCurrency(listFinancials.totalRetail)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    Müşteri fiyatı toplamı
                  </span>
                </div>

                {/* Optician Mode: Wholesale and Profit */}
                {!isCustomerMode ? (
                  <>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-600 uppercase block">
                        Toplam Toptan Maliyet
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {formatCurrency(listFinancials.totalWholesale)}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        İskontolu net depolar borcu
                      </span>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-800 uppercase block">
                          Tahmini Net Kar
                        </span>
                        <span className="text-xs font-extrabold text-sky-800 bg-sky-200/70 px-1.5 py-0.2 rounded">
                          %{listFinancials.profitMargin} Marj
                        </span>
                      </div>
                      <span className="text-xl font-black text-sky-700">
                        +{formatCurrency(listFinancials.totalProfit)}
                      </span>
                      <span className="text-[10px] text-sky-600 block mt-0.5">
                        Kazanç Tutarı
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold block text-slate-800">Müşteri Görünümü</span>
                      Teklif metnini WhatsApp veya PDF olarak paylaşabilirsiniz.
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                      Güvenli Mod
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* List Items */}
          {activeList.items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bu listede henüz cam yok</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Katalogdan beğendiğiniz camları "Özel Listeye Ekle" butonuna basarak buraya toplayabilir ve teklif oluşturabilirsiniz.
                </p>
              </div>
              <button
                onClick={onOpenCatalog}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs"
              >
                Fiyat Kataloğuna Git
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {activeList.items.map((item, idx) => {
                const lens = item.lensSnapshot;
                const fin = calculateLensFinancials(
                  lens,
                  brandDiscounts,
                  item.quantity as 1 | 2,
                  item.customRetailPrice
                );

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {lens.brand}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {lens.index} İndeks
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {lens.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{lens.coating}</span>
                        <span>•</span>
                        <span>{lens.deliveryType === 'stock' ? 'Stok Cam' : 'RX Özel Üretim'}</span>
                      </div>
                    </div>

                    {/* Quantity Selector & Price Input */}
                    <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
                      {/* Quantity: 1x vs 2x */}
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={() => handleUpdateItemQuantity(item.id, 2)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                            item.quantity === 2
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Çift (2x)
                        </button>
                        <button
                          onClick={() => handleUpdateItemQuantity(item.id, 1)}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                            item.quantity === 1
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Tek (1x)
                        </button>
                      </div>

                      {/* Optician Mode: Wholesale info */}
                      {!isCustomerMode && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                            Toptan Alış
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {formatCurrency(fin.netWholesaleCost, lens.currency)}
                          </span>
                        </div>
                      )}

                      {/* Retail Price (Editable) */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          Satış Fiyatı (₺)
                        </span>
                        <input
                          type="number"
                          value={item.customRetailPrice ?? (lens.retailPrice * item.quantity)}
                          onChange={(e) =>
                            handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 rounded-lg border border-slate-300 text-right text-xs font-black text-emerald-700 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Listeden Çıkar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
