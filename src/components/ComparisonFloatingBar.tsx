import React from 'react';
import { Lens } from '../types';
import { Scale, X, Printer, ArrowRight, Trash2 } from 'lucide-react';
import { sanitizeLens } from '../utils/pricing';
import { exportComparisonToPDF } from '../utils/comparisonExport';

interface ComparisonFloatingBarProps {
  compareLenses: Lens[];
  onOpenComparison: () => void;
  onRemoveLens: (lensId: string) => void;
  onClear: () => void;
  pairCount: 1 | 2;
  storeName?: string;
}

export const ComparisonFloatingBar: React.FC<ComparisonFloatingBarProps> = ({
  compareLenses,
  onOpenComparison,
  onRemoveLens,
  onClear,
  pairCount,
  storeName,
}) => {
  if (compareLenses.length === 0) return null;

  return (
    <div className="fixed bottom-3 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 z-40 w-auto sm:w-[95%] max-w-3xl animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-2 sm:p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Count & Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 py-0.5">
          <div className="flex items-center gap-1.5 bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-xl text-xs font-bold border border-sky-400/30 shrink-0">
            <Scale className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{compareLenses.length} Ürün</span>
          </div>

          {/* Selected Product Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {compareLenses.map((l) => {
              const s = sanitizeLens(l);
              return (
                <div
                  key={s.id}
                  className="bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold px-2 py-1 rounded-xl flex items-center gap-1.5 shrink-0 max-w-[150px] sm:max-w-[200px]"
                >
                  <span className="truncate">{s.brand} - {s.name}</span>
                  <button
                    onClick={() => onRemoveLens(s.id)}
                    className="text-slate-400 hover:text-white transition p-0.5"
                    title="Kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => exportComparisonToPDF(compareLenses, pairCount, storeName)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title="Kıyaslama Raporunu PDF / Yazdır"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={onClear}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition border border-slate-700"
            title="Kıyaslama Listesini Temizle"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenComparison}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <span>Kıyasla</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
