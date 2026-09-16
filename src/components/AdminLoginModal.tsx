import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  adminPin: string;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onChangePin: (newPin: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  adminPin,
  onLoginSuccess,
  onLogout,
  onChangePin,
}) => {
  if (!isOpen) return null;

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.trim() === adminPin.trim()) {
      setErrorMsg('');
      setEnteredPin('');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('Hatalı Yönetici Şifresi! Lütfen tekrar deneyin.');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.trim().length < 4) {
      setErrorMsg('Yeni şifre en az 4 haneli olmalıdır.');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }
    onChangePin(newPin.trim());
    setPinChangeSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      setPinChangeSuccess(false);
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isAdmin ? 'Yönetici Hesabı Aktif' : 'Yönetici Girişi (Admin)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAdmin ? 'Tüm katalog ve Google Drive yetkilerine sahipsiniz' : 'Google Drive ve katalog yönetimi için şifre girin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {isAdmin ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Yönetici Oturumu Açık</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Şu anda Google Drive senkronizasyonu, Excel yükleme ve ana kataloğa cam ekleme yetkiniz aktiftir.
                </p>
              </div>

              {isChangingPin ? (
                <form onSubmit={handleChangePinSubmit} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900">Yönetici Şifresini Değiştir</h4>

                  {errorMsg && (
                    <div className="text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {pinChangeSuccess && (
                    <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Şifreniz başarıyla güncellendi!</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Yeni PIN / Parola:
                    </label>
                    <input
                      type="password"
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Örn: 1923"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold tracking-widest bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Yeni PIN'i Tekrar Girin:
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Örn: 1923"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold tracking-widest bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition"
                    >
                      Yeni Şifreyi Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPin(false);
                        setErrorMsg('');
                      }}
                      className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold"
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setIsChangingPin(true)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>Yönetici Şifresini Değiştir</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center justify-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Yönetici Oturumunu Kapat (Optisyen Moduna Kilitle)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold block mb-1">Yetkilendirme Kuralı:</span>
                Google Drive'dan liste yükleme ve ana kataloğu düzenleme işlemi <strong>yalnızca yöneticide</strong> açıktır. Diğer optisyenler sistemdeki ürünler haricinde dışarıdan liste yükleyemez; sadece ana katalogdaki ürünlerle kendi teklif listelerini oluşturabilirler.
              </div>

              {errorMsg && (
                <div className="text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Yönetici PIN / Şifresi
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Yönetici şifrenizi girin..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-base tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  (Varsayılan ilk giriş şifresi: <code className="font-bold text-slate-700">1923</code>)
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Yönetici Olarak Giriş Yap</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Kapat
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
