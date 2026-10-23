import React, { useState, useEffect } from "react";
import {
  Clock,
  ScanLine,
  User,
  Shield,
  ShieldCheck,
  LogIn,
  Users,
  ChevronDown,
} from "lucide-react";
import { DistributionCenter, OperatorProfile, AuthorizedUser } from "../types";
import { getIndonesianLiveDateTime } from "../data/dateUtils";

interface TopNavbarProps {
  activeDC: DistributionCenter;
  operator: OperatorProfile;
  onSwitchDC: (dc: DistributionCenter) => void;
  onOpenDCModal: () => void;
  onOpenProvisionCheck?: () => void;
  currentUser: AuthorizedUser | null;
  onOpenAuthModal: () => void;
  onOpenUserManagementModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeDC,
  operator,
  onOpenDCModal,
  onOpenProvisionCheck,
  currentUser,
  onOpenAuthModal,
  onOpenUserManagementModal,
}) => {
  const [liveTime, setLiveTime] = useState(getIndonesianLiveDateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getIndonesianLiveDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isSolo = activeDC === "DC_SOLO";

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">SUPER ADMIN</span>;
      case "OPERATOR_SOLO":
        return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">OP. SOLO</span>;
      case "OPERATOR_JOGJA":
        return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">OP. JOGJA</span>;
      case "INBOUND_STAFF":
        return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">INBOUND</span>;
      case "VIEWER":
      default:
        return <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">VIEWER</span>;
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Active Hub Badge */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenDCModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
              isSolo
                ? "bg-blue-50/80 border-blue-200 text-blue-950 hover:bg-blue-100/80"
                : "bg-sky-50/80 border-sky-200 text-sky-950 hover:bg-sky-100/80"
            }`}
            title="Klik untuk memilih pusat distribusi"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSolo ? "bg-blue-600" : "bg-sky-600"
              }`}
            />
            <div className="text-left leading-tight">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Pusat Distribusi Aktif
              </span>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                {isSolo ? "DC SOLO (SURAKARTA)" : "DC JOGJA (DIY)"}
              </span>
            </div>
          </button>

          <span className="hidden xl:inline text-xs font-medium text-slate-400">
            • PT ABC Retur Logistik
          </span>
        </div>

        {/* Right: User Email Auth Pill, Cek Harga, and Clock */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Kelola Pengguna / Akses Email Button (For Admin) */}
          {currentUser?.canManageUsers && (
            <button
              onClick={onOpenUserManagementModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Kelola Otorisasi Email & Akses Staf"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Kelola Akses Email</span>
              <span className="sm:hidden">Akses</span>
            </button>
          )}

          {/* User Account / Email Pill */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer shadow-2xs"
            title="Klik untuk ganti akun atau cek izin akses"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
            </div>
            <div className="hidden md:block leading-tight text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 line-clamp-1 max-w-[120px]">
                  {currentUser ? currentUser.displayName.split(" ")[0] : "Masuk"}
                </span>
                {currentUser && getRoleBadge(currentUser.role)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block line-clamp-1 max-w-[120px]">
                {currentUser ? currentUser.email : "Klik untuk Login"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Cek Harga Provisi Quick Shortcut */}
          {onOpenProvisionCheck && (
            <button
              onClick={onOpenProvisionCheck}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Buka Menu Cek Harga Provisi (-70%)"
            >
              <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cek Provisi</span>
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded font-black">
                -70%
              </span>
            </button>
          )}

          {/* Live Digital Clock */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-100/90 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 text-slate-700 shadow-inner shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] font-medium text-slate-500 hidden md:block leading-tight">
                {liveTime.dayName}, {liveTime.formattedDate}
              </p>
              <p className="text-xs font-mono font-bold text-slate-800 tracking-wide">
                {liveTime.timeString}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
