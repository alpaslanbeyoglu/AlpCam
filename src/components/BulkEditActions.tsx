import React, { useState } from 'react';
import { Sliders, Percent, DollarSign, Tag, Trash2, Check, AlertCircle, RefreshCw, Minimize2, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lens } from '../types';

interface BulkEditActionsProps {
  selectedCount: number;
  onBulkUpdate: (updates: Partial<Lens> | { priceMultiplier: number; type: 'percent' | 'fixed' }) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  isAdmin: boolean;
}

export const BulkEditActions: React.FC<BulkEditActionsProps> = ({
  selectedCount,
  onBulkUpdate,
  onBulkDelete,
  isAdmin,
}) => {
  // On mobile devices, default to minimized so it doesn't block the screen
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'price' | 'fields' | 'delete' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Price change state
  const [priceValue, setPriceValue] = useState<string>('10');
  const [priceType, setPriceType] = useState<'percent' | 'fixed'>('percent');

  // Field change state
  const [targetField, setTargetField] = useState<string>('category');
  const [fieldValue, setFieldValue] = useState<string>('');

  if (!isAdmin || selectedCount === 0) return null;

  const handleApplyPrice = async () => {
    const val = parseFloat(priceValue);
    if (isNaN(val)) return;
    
    setIsProcessing(true);
    await onBulkUpdate({ priceMultiplier: val, type: priceType });
    setIsProcessing(false);
    setMode(null);
    setIsOpen(false);
  };

  const handleApplyField = async () => {
    if (!fieldValue.trim()) return;
    
    setIsProcessing(true);
    await onBulkUpdate({ [targetField]: fieldValue });
    setIsProcessing(false);
    setMode(null);
    setIsOpen(false);
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    await onBulkDelete();
    setIsProcessing(false);
    setMode(null);
    setIsOpen(false);
  };

  // Minimized state: sleek, unobtrusive floating pill button in bottom corner
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6">
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full shadow-xl border border-sky-500/40 backdrop-blur-md transition-all text-xs font-bold hover:scale-105 active:scale-95 group ring-2 ring-sky-400/20"
          title="Toplu Düzenleme Aracını Aç"
        >
          <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
          </div>
          <span className="hidden xs:inline">Toplu Düzenle</span>
          <span className="bg-sky-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
            {selectedCount}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl px-2 sm:px-4">
      <div className="bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-white/10 p-3.5 sm:p-4 backdrop-blur-xl ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold truncate">Toplu Düzenleme</h3>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  {selectedCount} ürün
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Filtrelenen ürünleri tek seferde güncelle</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isOpen ? (
              <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-1.5"
              >
                <span>İşlem Seç</span>
                <RefreshCw className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setMode(null);
                }}
                className="px-2.5 py-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold transition"
              >
                Kapat
              </button>
            )}

            {/* Minimize button so mobile users can tuck the toolbar away */}
            <button
              onClick={() => {
                setIsMinimized(true);
                setIsOpen(false);
                setMode(null);
              }}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition flex items-center gap-1 text-xs"
              title="Ekranı engellememesi için küçült"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden xs:inline">Gizle</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
                {/* Mode Selection */}
                {!mode && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMode('price')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-center space-y-1"
                    >
                      <Percent className="w-5 h-5 mx-auto text-amber-400" />
                      <span className="text-[10px] font-bold block">Fiyat Değiştir</span>
                    </button>
                    <button
                      onClick={() => setMode('fields')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-center space-y-1"
                    >
                      <Tag className="w-5 h-5 mx-auto text-sky-400" />
                      <span className="text-[10px] font-bold block">Alanları Güncelle</span>
                    </button>
                    <button
                      onClick={() => setMode('delete')}
                      className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 transition text-center space-y-1"
                    >
                      <Trash2 className="w-5 h-5 mx-auto text-rose-400" />
                      <span className="text-[10px] font-bold block">Seçilenleri Sil</span>
                    </button>
                  </div>
                )}

                {/* Price Mode */}
                {mode === 'price' && (
                  <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-300">Toplu Fiyat Güncelleme</span>
                      <button onClick={() => setMode(null)} className="text-[10px] text-slate-500 hover:text-slate-300">Geri</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-slate-800 rounded-lg border border-white/10 overflow-hidden">
                        <input
                          type="number"
                          value={priceValue}
                          onChange={(e) => setPriceValue(e.target.value)}
                          className="w-full px-3 py-2 bg-transparent text-sm font-mono focus:outline-none"
                          placeholder="Oran..."
                        />
                        <select
                          value={priceType}
                          onChange={(e) => setPriceType(e.target.value as any)}
                          className="bg-slate-700 text-[10px] font-bold px-2 py-1 outline-none border-l border-white/10"
                        >
                          <option value="percent">% Zam/İndirim</option>
                          <option value="fixed">Sabit ₺ Değişim</option>
                        </select>
                      </div>
                      <button
                        onClick={handleApplyPrice}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Uygula
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 italic">Negatif değerler indirim, pozitif değerler zam olarak uygulanır. Hem toptan hem perakende fiyatları güncellenir.</p>
                  </div>
                )}

                {/* Fields Mode */}
                {mode === 'fields' && (
                  <div className="space-y-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-300">Toplu Alan Güncelleme</span>
                      <button onClick={() => setMode(null)} className="text-[10px] text-slate-500 hover:text-slate-300">Geri</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={targetField}
                        onChange={(e) => setTargetField(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none"
                      >
                        <option value="category">Kategori (Örn: progressive, photochromic)</option>
                        <option value="distributor">Üst Dağıtıcı / Firma</option>
                        <option value="brand">Marka</option>
                        <option value="deliveryType">Teslimat Türü (stock/rx)</option>
                        <option value="notes">Not Ekle</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={fieldValue}
                          onChange={(e) => setFieldValue(e.target.value)}
                          className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                          placeholder="Yeni değer..."
                        />
                        <button
                          onClick={handleApplyField}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Güncelle'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Mode */}
                {mode === 'delete' && (
                  <div className="space-y-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Toplu Silme İşlemi</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Filtrelenmiş olan <strong>{selectedCount}</strong> ürünü kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setMode(null)}
                        className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white"
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={isProcessing}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-[10px] font-bold text-white transition flex items-center gap-2"
                      >
                        {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Evet, Hepsini Sil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
