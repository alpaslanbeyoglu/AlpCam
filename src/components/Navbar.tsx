import React from 'react';
import { Eye, EyeOff, Sparkles, Cloud, Sliders, ShieldCheck, Lock, Unlock, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalog' | 'custom_lists' | 'discounts' | 'drive_sync';
  setActiveTab: (tab: 'catalog' | 'custom_lists' | 'discounts' | 'drive_sync') => void;
  isCustomerMode: boolean;
  setIsCustomerMode: (val: boolean) => void;
  pairCount: 1 | 2;
  setPairCount: (count: 1 | 2) => void;
  customListCount: number;
  lastSyncTime?: string;
  onQuickSync?: () => void;
  isSyncing?: boolean;
  isDriveWorking?: boolean;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isCustomerMode,
  setIsCustomerMode,
  pairCount,
  setPairCount,
  customListCount,
  onQuickSync,
  isSyncing,
  isDriveWorking,
  isAdmin,
  onOpenAdminModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner for Customer Privacy Mode */}
      {isCustomerMode ? (
        <div className="bg-emerald-600 text-white px-3 py-1 text-[10px] sm:text-xs font-semibold flex items-center justify-between tracking-wide shadow-xs">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
            <span className="truncate">MÜŞTERİ MODU</span>
            <span className="hidden md:inline text-emerald-100 font-normal">
              — Alış fiyatları ve kâr oranları gizlendi
            </span>
          </div>
          <button
            onClick={() => setIsCustomerMode(false)}
            className="bg-white/20 hover:bg-white/30 text-white px-1.5 py-0.5 rounded text-[10px] font-bold transition shrink-0 ml-2"
          >
            Optisyene Dön
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 text-slate-200 px-3 py-0.5 text-[10px] sm:text-[11px] font-medium flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-slate-300 font-semibold truncate text-[10px] sm:text-xs">Optisyen</span>
            {isAdmin ? (
              <span className="text-amber-400 font-bold flex items-center gap-0.5 truncate text-[10px]">
                <span>• 👑 Yönetici</span>
              </span>
            ) : (
              <span className="text-slate-400 truncate text-[10px] hidden xs:inline">
                • Standart Mod
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAdminModal}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isAdmin ? <Unlock className="w-2.5 h-2.5 text-amber-400" /> : <Lock className="w-2.5 h-2.5" />}
              <span>{isAdmin ? 'Açık' : 'Yönetici'}</span>
            </button>

            <button
              onClick={() => setIsCustomerMode(true)}
              className="flex items-center gap-0.5 text-sky-300 hover:text-sky-200 font-semibold text-[10px]"
            >
              <EyeOff className="w-3 h-3 text-sky-300 shrink-0" />
              <span className="hidden xs:inline">Gizle</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Title */}
        <div 
          onClick={() => setActiveTab('catalog')} 
          className="flex items-center gap-1.5 cursor-pointer select-none truncate"
        >
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl shadow-xs overflow-hidden shrink-0">
            <img src="/logo.svg" alt="OptikCam Logo" className="w-full h-full object-cover" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1">
              <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-900 leading-none">
                OptikCam
              </h1>
              <span className="bg-sky-100 text-sky-800 text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-full uppercase shrink-0">
                Pro
              </span>
            </div>
            <p className="text-[9px] text-slate-400 hidden sm:block leading-none mt-0.5">
              Gözlükçü Cam Fiyat Listesi & İskonto Rehberi
            </p>
          </div>
        </div>

        {/* Global Controls: Çift/Tek Cam & Müşteri Modu & Sync */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Pair / Single Toggle (Çift Cam vs Tek Cam) */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[10px] sm:text-xs font-bold border border-slate-200">
            <button
              onClick={() => setPairCount(2)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition ${
                pairCount === 2
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Çift
            </button>
            <button
              onClick={() => setPairCount(1)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition ${
                pairCount === 1
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Tek
            </button>
          </div>

          {/* Privacy Toggle Button */}
          <button
            onClick={() => setIsCustomerMode(!isCustomerMode)}
            className={`flex items-center justify-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition border h-[24px] sm:h-auto ${
              isCustomerMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title={isCustomerMode ? 'Müşteri Modu devrede (Toptan gizli)' : 'Toptan modunda (Müşteriye göstermeyin)'}
          >
            {isCustomerMode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Müşteri</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Gizlilik</span>
              </>
            )}
          </button>

          {/* Google Drive Quick Sync (only if admin or quick sync configured) */}
          {onQuickSync && (
            <button
              onClick={onQuickSync}
              disabled={isSyncing}
              className={`p-1 sm:p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition shrink-0 ${
                isSyncing ? 'animate-spin text-sky-600 bg-sky-50' : ''
              }`}
              title={isAdmin ? "Google Drive Senkronizasyonu" : "Yöneticinin Drive Listesini Güncelle"}
            >
              <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Mobile-Friendly Tab Bar */}
      <nav className="max-w-7xl mx-auto px-1.5 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1 sm:py-1.5">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold whitespace-nowrap transition ${
            activeTab === 'catalog'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span>Fiyat Kataloğu</span>
        </button>

        <button
          onClick={() => setActiveTab('custom_lists')}
          className={`flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold whitespace-nowrap transition relative ${
            activeTab === 'custom_lists'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Özel Listelerim</span>
          {customListCount > 0 && (
            <span
              className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${
                activeTab === 'custom_lists'
                  ? 'bg-sky-850 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {customListCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold whitespace-nowrap transition ${
            activeTab === 'discounts'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span>İskontolarım</span>
        </button>

        <button
          onClick={() => setActiveTab('drive_sync')}
          className={`flex items-center gap-1 px-2.5 py-1 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-bold whitespace-nowrap transition relative ${
            activeTab === 'drive_sync'
              ? 'bg-sky-600 text-white shadow-xs'
              : isDriveWorking
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Cloud className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isDriveWorking ? 'text-amber-600 animate-pulse' : 'text-amber-500'}`} />
          <span>Google Drive</span>
          {isDriveWorking && (
            <span className="flex items-center gap-0.5 bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1 rounded-md animate-pulse shrink-0">
              <span className="w-1 h-1 rounded-full bg-amber-600 animate-ping" />
              <span>Sürüyor</span>
            </span>
          )}
          {!isDriveWorking && !isAdmin && <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />}
        </button>

      </nav>
    </header>
  );
};
