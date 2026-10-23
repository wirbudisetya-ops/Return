import React from "react";
import {
  Package,
  Truck,
  HelpCircle,
  Send,
  Inbox,
  Store,
  Building2,
  ArrowRightLeft,
  User,
  RotateCcw,
  Clock,
  Sparkles,
  ScanLine,
  Percent,
} from "lucide-react";
import { DistributionCenter, OperatorProfile } from "../types";

export type AppTabType =
  | "store-return"
  | "driver-confirm"
  | "anonymous-return"
  | "jogja-send-solo"
  | "solo-receive-jogja"
  | "manual-return"
  | "cek-harga-provisi"
  | "store-database";

interface SidebarProps {
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
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
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
  soloReceivePendingCount = 0,
  onResetData,
}) => {
  const isSolo = activeDC === "DC_SOLO";

  const mainNavItems = [
    {
      id: "store-return" as AppTabType,
      label: "1. Input Retur Toko",
      icon: Package,
      badge: null,
      badgeColor: "",
    },
    {
      id: "driver-confirm" as AppTabType,
      label: "2. Data Retur & Konfirmasi",
      icon: Truck,
      badge: pendingConfirmCount > 0 ? `${pendingConfirmCount} Antre` : null,
      badgeColor: "bg-amber-500 text-slate-950 font-bold",
    },
    {
      id: "anonymous-return" as AppTabType,
      label: "3. Retur Tanpa Nama Toko",
      icon: HelpCircle,
      badge: anonymousCount > 0 ? `${anonymousCount}` : null,
      badgeColor: "bg-blue-500/30 text-blue-200",
    },
    ...(!isSolo
      ? [
          {
            id: "jogja-send-solo" as AppTabType,
            label: "4. Kirim Retur ke Solo",
            icon: Send,
            badge: null,
            badgeColor: "",
          },
        ]
      : [
          {
            id: "solo-receive-jogja" as AppTabType,
            label: "4. Retur dari DC Jogja",
            icon: Inbox,
            badge: soloReceivePendingCount > 0 ? `${soloReceivePendingCount} Masuk` : null,
            badgeColor: "bg-blue-500 text-white animate-pulse",
          },
        ]),
    {
      id: "manual-return" as AppTabType,
      label: "5. RETUR MANUAL",
      icon: ScanLine,
      badge: "Scan & QC",
      badgeColor: "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30",
    },
  ];

  const toolNavItems = [
    {
      id: "cek-harga-provisi" as AppTabType,
      label: "Cek Harga Provisi",
      icon: ScanLine,
      badge: "-70%",
      badgeColor: "bg-emerald-500 text-slate-950 font-black tracking-wide",
    },
  ];

  const secondaryNavItems = [
    {
      id: "store-database" as AppTabType,
      label: "Database Master Toko",
      icon: Store,
      badge: null,
      badgeColor: "",
    },
  ];

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-slate-900 text-slate-200 flex flex-col shrink-0 md:h-screen md:sticky md:top-0 border-r border-slate-800 select-none shadow-xl z-40">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/90 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <Building2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xs font-bold text-white tracking-tight uppercase leading-snug truncate">
              {companyName}
            </h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <p className="text-[10px] font-semibold text-blue-300 truncate">
                {departmentName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hub Gudang Selection Card */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pusat Distribusi (DC)
          </span>
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              isSolo ? "bg-blue-400" : "bg-sky-400"
            }`}
          />
        </div>

        {/* DC Solo / Jogja Toggle Switch */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onSelectDC("DC_SOLO")}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              isSolo
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>DC SOLO</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectDC("DC_JOGJA")}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              !isSolo
                ? "bg-sky-600 text-white shadow-sm shadow-sky-600/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <span>DC JOGJA</span>
          </button>
        </div>

        <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-400">
          <span>Total Retur Terdata:</span>
          <span className="font-mono font-bold text-blue-400">{totalReturnsCount} Item</span>
        </div>
      </div>

      {/* Navigation Menus List on the Left */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Menu Utama Retur */}
        <div>
          <div className="px-3 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Menu Alur Retur
            </span>
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-400"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        item.badgeColor || (isActive ? "bg-white text-blue-700" : "bg-blue-500 text-white")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Alat & Fitur Provisi */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Alat Scan & Harga
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
              Diskon 70%
            </span>
          </div>
          <nav className="space-y-1">
            {toolNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                    isActive
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30"
                      : "text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-emerald-400 group-hover:text-emerald-300"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        item.badgeColor || (isActive ? "bg-white text-emerald-900" : "bg-emerald-500 text-slate-950")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Master Database */}
        <div>
          <div className="px-3 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Master & Database
            </span>
          </div>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group text-left ${
                    isActive
                      ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-blue-400"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Operator Info & Footer in Sidebar */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {operator.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {operator.role} &bull; Shift {operator.shift}
              </p>
            </div>
          </div>

          <button
            onClick={onResetData}
            title="Reset ke data bawaan demo"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
