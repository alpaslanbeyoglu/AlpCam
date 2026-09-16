import React from 'react';
import { Eye, EyeOff, Sparkles, Cloud, Sliders, ShieldCheck, Lock, Unlock, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalog' | 'custom_lists' | 'discounts' | 'drive_sync' | 'github_guide';
  setActiveTab: (tab: 'catalog' | 'custom_lists' | 'discounts' | 'drive_sync' | 'github_guide') => void;
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
        <div className="bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold flex items-center justify-between tracking-wide shadow-inner">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-100" />
            <span>MÜŞTERİ MODU AKTİF</span>
            <span className="hidden sm:inline text-emerald-100 font-normal">
              — Toptan alış fiyatları ve kar oranları gizlendi
            </span>
          </div>
          <button
            onClick={() => setIsCustomerMode(false)}
            className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] font-medium transition"
          >
            Optisyen Moduna Dön
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 text-slate-200 px-3 py-1 text-[11px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Optisyen / Toptan Modu</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            {isAdmin ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span>👑 Yönetici Yetkisi Devrede</span>
              </span>
            ) : (
              <span className="text-slate-400">
                Standart Optisyen (Katalog Yönetici Korumalı)
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAdminModal}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isAdmin ? 'Yönetici ayarları veya çıkış' : 'Yönetici Girişi Yap'}
            >
              {isAdmin ? <Unlock className="w-3 h-3 text-amber-400" /> : <Lock className="w-3 h-3" />}
              <span>{isAdmin ? 'Yönetici Açık' : 'Yönetici Girişi'}</span>
            </button>

            <button
              onClick={() => setIsCustomerMode(true)}
              className="flex items-center gap-1 text-sky-300 hover:text-sky-200 transition"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Müşteriye Göster (Gizle)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main App Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Title */}
        <div 
          onClick={() => setActiveTab('catalog')} 
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl shadow-sm overflow-hidden shrink-0">
            <img src="/logo.svg" alt="OptikCam Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-tight">
                OptikCam
              </h1>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
              Gözlükçü Cam Fiyat Listesi & İskonto Rehberi
            </p>
          </div>
        </div>

        {/* Global Controls: Çift/Tek Cam & Müşteri Modu & Sync */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Pair / Single Toggle (Çift Cam vs Tek Cam) */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setPairCount(2)}
              className={`px-2 py-1 rounded-md transition ${
                pairCount === 2
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Çift Cam (2x) Fiyatı"
            >
              Çift Cam
            </button>
            <button
              onClick={() => setPairCount(1)}
              className={`px-2 py-1 rounded-md transition ${
                pairCount === 1
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tek Cam (1x) Fiyatı"
            >
              Tek Cam
            </button>
          </div>

          {/* Privacy Toggle Button */}
          <button
            onClick={() => setIsCustomerMode(!isCustomerMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isCustomerMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title={isCustomerMode ? 'Müşteri Modu devrede (Toptan gizli)' : 'Toptan modunda (Müşteriye göstermeyin)'}
          >
            {isCustomerMode ? (
              <>
                <Eye className="w-4 h-4 text-emerald-600" />
                <span className="hidden xs:inline">Müşteri</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-slate-500" />
                <span className="hidden xs:inline">Gizlilik</span>
              </>
            )}
          </button>

          {/* Google Drive Quick Sync (only if admin or quick sync configured) */}
          {onQuickSync && (
            <button
              onClick={onQuickSync}
              disabled={isSyncing}
              className={`p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition ${
                isSyncing ? 'animate-spin text-sky-600' : ''
              }`}
              title={isAdmin ? "Google Drive Senkronizasyonu" : "Yöneticinin Drive Listesini Güncelle"}
            >
              <Cloud className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Mobile-Friendly Tab Bar */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'catalog'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fiyat Kataloğu</span>
        </button>

        <button
          onClick={() => setActiveTab('custom_lists')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
            activeTab === 'custom_lists'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Özel Listelerim</span>
          {customListCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'custom_lists'
                  ? 'bg-sky-800 text-sky-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {customListCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'discounts'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>İskontolarım</span>
        </button>

        <button
          onClick={() => setActiveTab('drive_sync')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition relative ${
            activeTab === 'drive_sync'
              ? 'bg-sky-600 text-white shadow-xs'
              : isDriveWorking
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cloud className={`w-3.5 h-3.5 ${isDriveWorking ? 'text-amber-600 animate-pulse' : 'text-amber-500'}`} />
          <span>Google Drive</span>
          {isDriveWorking && (
            <span className="flex items-center gap-1 bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
              <span>İşlem Sürüyor</span>
            </span>
          )}
          {!isDriveWorking && !isAdmin && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
        </button>

        <button
          onClick={() => setActiveTab('github_guide')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ml-auto ${
            activeTab === 'github_guide'
              ? 'bg-slate-800 text-white'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <span>GitHub Pages Kılavuzu</span>
        </button>
      </nav>
    </header>
  );
};
