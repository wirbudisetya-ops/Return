import React, { useState } from "react";
import {
  X,
  LogIn,
  Mail,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  Building2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AuthorizedUser } from "../types";
import { loginWithGoogle, logoutUser, PRIMARY_ADMIN_EMAIL } from "../data/firebase";

interface LoginAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthorizedUser | null;
  onLoginSuccess: (user: AuthorizedUser) => void;
  onLogout: () => void;
  authorizedUsers: AuthorizedUser[];
  onRequestAccess?: (email: string) => void;
}

export const LoginAuthModal: React.FC<LoginAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  authorizedUsers,
  onRequestAccess,
}) => {
  const [customEmail, setCustomEmail] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedEmailAlert, setUnauthorizedEmailAlert] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler: Real Firebase Google Sign-In with Popup
  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setAuthError(null);
    setUnauthorizedEmailAlert(null);

    try {
      const fbUser = await loginWithGoogle();
      const email = fbUser.email?.toLowerCase() || "";

      // Check if user is in authorized list
      const matched = authorizedUsers.find(
        (u) => u.email.toLowerCase() === email
      );

      if (matched && matched.status === "ACTIVE") {
        onLoginSuccess({
          ...matched,
          uid: fbUser.uid,
          photoURL: fbUser.photoURL || undefined,
        });
        onClose();
      } else if (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
        // Primary Super Admin fallback
        const adminUser: AuthorizedUser = {
          uid: fbUser.uid,
          email: PRIMARY_ADMIN_EMAIL,
          displayName: fbUser.displayName || "Wira Budi Setya (Super Admin)",
          role: "SUPER_ADMIN",
          allowedDCs: ["DC_SOLO", "DC_JOGJA"],
          status: "ACTIVE",
          canEditReturns: true,
          canConfirmOperator: true,
          canProcessManualReturns: true,
          canManageUsers: true,
          addedAt: new Date().toISOString(),
          addedBy: "System",
          photoURL: fbUser.photoURL || undefined,
        };
        onLoginSuccess(adminUser);
        onClose();
      } else {
        // Authenticated with Google, but not yet authorized in the app
        setUnauthorizedEmailAlert(email);
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError(err.message || "Gagal masuk dengan Google.");
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Handler: Quick Email Login / Switch (for preview testing or credential sign-in)
  const handleQuickEmailLogin = (user: AuthorizedUser) => {
    onLoginSuccess(user);
    onClose();
  };

  const handleCustomEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setUnauthorizedEmailAlert(null);

    const emailTrim = customEmail.trim().toLowerCase();
    if (!emailTrim || !emailTrim.includes("@")) {
      setAuthError("Masukkan alamat email yang valid.");
      return;
    }

    const matched = authorizedUsers.find(
      (u) => u.email.toLowerCase() === emailTrim
    );

    if (matched) {
      if (matched.status !== "ACTIVE") {
        setAuthError(`Akses untuk email ${emailTrim} sedang dinonaktifkan oleh Administrator.`);
        return;
      }
      onLoginSuccess(matched);
      onClose();
    } else {
      setUnauthorizedEmailAlert(emailTrim);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Masuk Sistem Retur PT ABC
              </h2>
              <p className="text-xs text-slate-300">
                Otorisasi Berbasis Email via Firebase Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Currently Logged In Account Card */}
          {currentUser && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm uppercase shadow-xs">
                  {currentUser.displayName?.charAt(0) || currentUser.email.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-950">
                      {currentUser.displayName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-mono block">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  onLogout();
                }}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}

          {/* Unauthorized Email Alert */}
          {unauthorizedEmailAlert && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-start space-x-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900">
                    Email Belum Diberi Izin Otorisasi
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Email <strong className="font-mono">{unauthorizedEmailAlert}</strong> berhasil diverifikasi via Firebase, namun belum terdaftar dalam daftar otorisasi staf.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-amber-700">Hubungi Administrator: {PRIMARY_ADMIN_EMAIL}</span>
                {onRequestAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestAccess(unauthorizedEmailAlert);
                      setUnauthorizedEmailAlert(null);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold cursor-pointer"
                  >
                    Minta Izin Akses
                  </button>
                )}
              </div>
            </div>
          )}

          {/* General Error */}
          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Method 1: Google Login Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoadingGoogle}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 hover:border-indigo-500 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {isLoadingGoogle ? "Menghubungkan ke Google..." : "Masuk dengan Akun Google (Popup)"}
              </span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Pilih akun Google Anda yang telah diizinkan oleh admin sistem.
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              Atau Pilih Akun Terdaftar
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Quick Account Switcher */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Akun Staf yang Telah Diotorisasi:
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {authorizedUsers.map((u) => {
                const isCurrent = currentUser?.email.toLowerCase() === u.email.toLowerCase();
                return (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => handleQuickEmailLogin(u)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/20"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {u.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">
                            {u.displayName}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white font-mono uppercase">
                              Aktif
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {u.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-indigo-700">
                        {u.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Email Input Form */}
          <form onSubmit={handleCustomEmailSubmit} className="pt-2 border-t border-slate-200 space-y-2">
            <label className="text-[11px] font-bold text-slate-700 block">
              Cek / Masuk dengan Email Lain:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="masukkan.email@ptabc.co.id"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>PT ABC Logistics & Distribution Center</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 font-bold hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
