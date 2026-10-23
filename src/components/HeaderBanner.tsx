import React, { useState, useEffect } from "react";
import {
  Building2,
  Clock,
  MapPin,
  RefreshCw,
  Store,
  Truck,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Users,
  Send,
  Inbox,
  Package,
} from "lucide-react";
import { DistributionCenter, OperatorProfile } from "../types";
import { getIndonesianLiveDateTime } from "../data/dateUtils";

export type AppTabType =
  | "store-return"
  | "driver-confirm"
  | "anonymous-return"
  | "store-database"
  | "jogja-send-solo"
  | "solo-receive-jogja";

interface HeaderBannerProps {
  companyName: string;
  departmentName: string;
  activeDC: DistributionCenter;
  onSelectDC: (dc: DistributionCenter) => void;
  activeTab: AppTabType;
  onSelectTab: (tab: AppTabType) => void;
  operator: OperatorProfile;
  pendingConfirmCount: number;
  totalReturnsCount: number;
  anonymousCount: number;
  jogjaSendCount?: number;
  soloReceivePendingCount?: number;
  onOpenStoreDatabase: () => void;
  onResetData: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  companyName,
  departmentName,
  activeDC,
  onSelectDC,
  activeTab,
  onSelectTab,
  operator,
  pendingConfirmCount,
  totalReturnsCount,
  anonymousCount,
  jogjaSendCount = 0,
  soloReceivePendingCount = 0,
  onOpenStoreDatabase,
  onResetData,
}) => {
  const [liveTime, setLiveTime] = useState(getIndonesianLiveDateTime());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getIndonesianLiveDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dcAddress =
    activeDC === "DC_SOLO"
      ? "Gudang Hub DC Solo"
      : "Gudang Hub DC Jogja (DIY)";

  return (
    <header className="bg-white border-b-2 border-slate-900 sticky top-0 z-30 shadow-md">
      {/* Top Bar: Company Name & Department Identity */}
      <div className="bg-slate-950 text-white px-4 py-2.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          
          {/* Company & Division Title */}
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-9 h-9 bg-rose-500 rounded-lg flex items-center justify-center font-black text-white text-base shadow-sm border border-rose-400">
              🏢
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-widest text-amber-300 uppercase">
                  {companyName}
                </span>
                <span className="text-slate-500 text-xs hidden sm:inline">&bull;</span>
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  {dcAddress}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                {departmentName}
              </h1>
            </div>
          </div>

          {/* Live Real-time Clock */}
          <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg shadow-inner">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-300 leading-tight">
                {liveTime.dayName}, {liveTime.formattedDate}
              </p>
              <p className="text-xs font-mono font-black text-emerald-300 tracking-wider">
                {liveTime.timeString}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Bar: Distribution Center Switcher & Operator Details */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* DC SOLO vs DC JOGJA Selection Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase text-slate-600">
              Pusat Distribusi:
            </span>
            <div className="inline-flex rounded-lg border-2 border-slate-900 bg-slate-100 p-0.5 shadow-xs">
              <button
                id="btn-dc-solo"
                onClick={() => onSelectDC("DC_SOLO")}
                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center cursor-pointer ${
                  activeDC === "DC_SOLO"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                <span>DC SOLO</span>
              </button>
              <button
                id="btn-dc-jogja"
                onClick={() => onSelectDC("DC_JOGJA")}
                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center cursor-pointer ${
                  activeDC === "DC_JOGJA"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
                <span>DC JOGJA (DIY)</span>
              </button>
            </div>

            <div className="flex items-center text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-3 py-1 rounded-md">
              <span>📍 {dcAddress}</span>
            </div>
          </div>

          {/* Operator Profile */}
          <div className="flex items-center gap-2.5 justify-end">
            <div className="text-right">
              <p className="text-xs font-black text-slate-950 leading-tight">{operator.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                {operator.role} &bull; Shift {operator.shift}
              </p>
            </div>
            <button
              onClick={onResetData}
              title="Reset ke Data Bawaan"
              className="p-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 shadow-2xs active:scale-95 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Third Bar: Core Functional Navigation Menus */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-2">
            
            {/* Menu 1: Input Retur Toko */}
            <button
              id="tab-store-return"
              onClick={() => onSelectTab("store-return")}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all flex items-center cursor-pointer ${
                activeTab === "store-return"
                  ? "bg-rose-500 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5"
                  : "bg-white border-slate-300 text-slate-800 hover:border-slate-900 hover:bg-rose-50"
              }`}
            >
              <Store className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>1. Input Retur Toko</span>
            </button>

            {/* Menu 2: Data Retur Driver & Konfirmasi Operator */}
            <button
              id="tab-driver-confirm"
              onClick={() => onSelectTab("driver-confirm")}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all flex items-center cursor-pointer relative ${
                activeTab === "driver-confirm"
                  ? "bg-amber-400 border-slate-900 text-amber-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5"
                  : "bg-white border-slate-300 text-slate-800 hover:border-slate-900 hover:bg-yellow-50"
              }`}
            >
              <Truck className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>2. Data Retur Driver & Konfirmasi</span>
              {pendingConfirmCount > 0 && (
                <span className="ml-2 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-mono font-black rounded border border-slate-900 animate-bounce">
                  {pendingConfirmCount} Antre
                </span>
              )}
            </button>

            {/* Menu 3: Retur Tanpa Keterangan Toko */}
            <button
              id="tab-anonymous-return"
              onClick={() => onSelectTab("anonymous-return")}
              className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all flex items-center cursor-pointer ${
                activeTab === "anonymous-return"
                  ? "bg-purple-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5"
                  : "bg-white border-slate-300 text-slate-800 hover:border-slate-900 hover:bg-purple-50"
              }`}
            >
              <HelpCircle className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>3. Retur Tanpa Nama Toko</span>
              {anonymousCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-slate-900 text-white text-[10px] font-mono font-black rounded">
                  {anonymousCount}
                </span>
              )}
            </button>

            {/* DC SPECIFIC MENUS: 
                - DC JOGJA: RETUR KIRIM SOLO
                - DC SOLO: RETUR DARI JOGJA */}
            {activeDC === "DC_JOGJA" ? (
              <button
                id="tab-jogja-send-solo"
                onClick={() => onSelectTab("jogja-send-solo")}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all flex items-center cursor-pointer ${
                  activeTab === "jogja-send-solo"
                    ? "bg-blue-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5"
                    : "bg-blue-50 border-blue-300 text-blue-900 hover:border-slate-900 hover:bg-blue-100"
                }`}
              >
                <Send className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                <span>🚚 RETUR KIRIM SOLO</span>
              </button>
            ) : (
              <button
                id="tab-solo-receive-jogja"
                onClick={() => onSelectTab("solo-receive-jogja")}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all flex items-center cursor-pointer relative ${
                  activeTab === "solo-receive-jogja"
                    ? "bg-indigo-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5"
                    : "bg-indigo-50 border-indigo-300 text-indigo-950 hover:border-slate-900 hover:bg-indigo-100"
                }`}
              >
                <Inbox className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                <span>📥 RETUR DARI JOGJA</span>
                {soloReceivePendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-mono font-black rounded border border-slate-900 animate-pulse">
                    {soloReceivePendingCount} Masuk
                  </span>
                )}
              </button>
            )}

            {/* Menu 5: Database Master Toko */}
            <button
              id="tab-store-database"
              onClick={() => onSelectTab("store-database")}
              className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg border-2 transition-all flex items-center cursor-pointer ${
                activeTab === "store-database"
                  ? "bg-emerald-600 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] -translate-y-0.5"
                  : "bg-white border-slate-300 text-slate-800 hover:border-slate-900 hover:bg-emerald-50"
              }`}
            >
              <Building2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              <span>Database Toko</span>
            </button>
          </nav>

          {/* Quick Counter */}
          <div className="text-[11px] font-black uppercase tracking-wide bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5">
            Total Retur {activeDC === "DC_SOLO" ? "Solo" : "Jogja"}:{" "}
            <span className="text-rose-600 font-mono font-black text-xs">{totalReturnsCount} Item</span>
          </div>
        </div>
      </div>
    </header>
  );
};
