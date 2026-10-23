import React from "react";
import {
  PackageX,
  Sparkles,
  Barcode,
  Search,
  AlertTriangle,
  Radio,
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";
import { OperatorProfile } from "../types";

interface NavbarProps {
  activeTab: "all" | "tracker" | "qc" | "batch-alert";
  setActiveTab: (tab: "all" | "tracker" | "qc" | "batch-alert") => void;
  operator: OperatorProfile;
  onOpenAutoInput: () => void;
  onOpenInboundInput: () => void;
  onOpenScanner: () => void;
  onOpenBatchAnalysis: () => void;
  onExportData: () => void;
  defectBatchCount: number;
  totalReturnsCount: number;
  onSimulateIncoming: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  operator,
  onOpenAutoInput,
  onOpenInboundInput,
  onOpenScanner,
  onOpenBatchAnalysis,
  onExportData,
  defectBatchCount,
  totalReturnsCount,
  onSimulateIncoming,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F7F7F7] px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="max-w-7xl mx-auto bg-white border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Brand & Subtitle */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 bg-rose-500 border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <PackageX className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-black uppercase">
                  LUMIÈRE <span className="text-rose-500">COSMETICS</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 border border-black bg-[#DCFCE7] text-green-900 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-green-600 inline-block mr-1.5 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Logistics & Returns Portal &bull; Gudang Cikarang
              </p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center flex-wrap gap-1.5">
            <button
              id="tab-all-returns"
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "all"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black hover:bg-rose-100"
              }`}
            >
              Semua Retur ({totalReturnsCount})
            </button>
            <button
              id="tab-live-tracker"
              onClick={() => setActiveTab("tracker")}
              className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all flex items-center ${
                activeTab === "tracker"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black hover:bg-rose-100"
              }`}
            >
              <Search className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              Pelacakan Toko & Penerima
            </button>
            <button
              id="tab-qc-desk"
              onClick={() => setActiveTab("qc")}
              className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all flex items-center ${
                activeTab === "qc"
                  ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black hover:bg-purple-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" />
              Meja QC
            </button>
            <button
              id="tab-batch-alert"
              onClick={() => setActiveTab("batch-alert")}
              className={`px-3.5 py-2 border-2 border-black text-xs font-black uppercase tracking-wider transition-all flex items-center ${
                activeTab === "batch-alert"
                  ? "bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black"
                  : "bg-amber-100 text-amber-950 hover:bg-amber-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-black stroke-[2.5]" />
              Batch Defect {defectBatchCount > 0 && `(${defectBatchCount})`}
            </button>
          </nav>

          {/* Right Operator Info & Action CTA */}
          <div className="flex items-center gap-2.5 justify-between sm:justify-end flex-wrap">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-black leading-tight uppercase">{operator.name}</p>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                ID: {operator.operatorId} &bull; {operator.role}
              </p>
            </div>
            <div className="w-10 h-10 bg-black border-2 border-black rounded-full overflow-hidden flex items-center justify-center text-white font-black text-xs">
              SA
            </div>
            
            <div className="flex items-center gap-2">
              <button
                id="btn-inbound-input"
                onClick={onOpenInboundInput}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 border-2 border-black text-white text-xs font-black uppercase tracking-wider flex items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                title="Input Inbound: Penerimaan Barang dari Driver"
              >
                <Truck className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                <span>+ Inbound Driver</span>
              </button>

              <button
                id="btn-scan-barcode"
                onClick={onOpenScanner}
                className="px-3 py-2 bg-white hover:bg-slate-100 border-2 border-black text-black text-xs font-black uppercase tracking-wider flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                title="Scan Barcode Resi atau Dus Kosmetik"
              >
                <Barcode className="w-4 h-4 mr-1.5 text-black stroke-[2.5]" />
                <span className="hidden sm:inline">Scan Resi</span>
              </button>

              <button
                id="btn-auto-input-ai"
                onClick={onOpenAutoInput}
                className="px-3 py-2 bg-rose-500 hover:bg-rose-600 border-2 border-black text-white text-xs font-black uppercase tracking-wider flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                title="Input Otomatis Resi / Pesan Retur via AI"
              >
                <Sparkles className="w-4 h-4 mr-1 text-amber-200 stroke-[2.5]" />
                <span>AI</span>
              </button>

              <button
                id="btn-simulate-event"
                onClick={onSimulateIncoming}
                className="p-2 bg-white hover:bg-slate-100 border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                title="Simulasi Real-Time Webhook Retur"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-bar: Quick Action Bar */}
        <div className="mt-3 pt-3 border-t-2 border-black flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-600 uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-black inline-block"></span>
            <span>Lokasi Kerja: <strong className="text-black">{operator.warehouseLocation}</strong></span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onExportData}
              className="text-[11px] font-black uppercase text-black hover:text-rose-600 flex items-center transition-colors underline underline-offset-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 stroke-[2.5]" /> Ekspor CSV
            </button>
            <button
              onClick={onOpenBatchAnalysis}
              className="text-[11px] font-black uppercase text-amber-900 hover:text-rose-600 flex items-center transition-colors underline underline-offset-2 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1 stroke-[2.5]" /> AI Defect Audit
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

