import React, { useState } from "react";
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  Package,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertCircle,
  QrCode,
  UserCheck,
  Printer,
  ChevronRight,
  Store,
} from "lucide-react";
import { CosmeticReturnItem, ReturnStatus } from "../types";

interface RealtimeTrackerProps {
  returns: CosmeticReturnItem[];
  onSelectReturn: (item: CosmeticReturnItem) => void;
  onAdvanceStatus: (item: CosmeticReturnItem, nextStatus: ReturnStatus, note?: string) => void;
  onOpenQCInspection: (item: CosmeticReturnItem) => void;
  onOpenPrintSlip: (item: CosmeticReturnItem) => void;
  onOpenOperatorConfirm?: (item: CosmeticReturnItem) => void;
}

export const RealtimeTracker: React.FC<RealtimeTrackerProps> = ({
  returns,
  onSelectReturn,
  onAdvanceStatus,
  onOpenQCInspection,
  onOpenPrintSlip,
  onOpenOperatorConfirm,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(returns[0]?.id || "");

  const activeItem = returns.find((r) => r.id === selectedId) || returns[0];

  const filteredItems = returns.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.trackingNumber.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.orderId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      (item.storeName && item.storeName.toLowerCase().includes(q)) ||
      (item.driverName && item.driverName.toLowerCase().includes(q)) ||
      (item.acceptedByOperator && item.acceptedByOperator.toLowerCase().includes(q)) ||
      (item.storageBin && item.storageBin.toLowerCase().includes(q))
    );
  });

  const statusSteps: { status: ReturnStatus; label: string; desc: string; bg: string }[] = [
    { status: "REQUESTED", label: "Surat Jalan", desc: "Toko / Customer", bg: "bg-slate-100" },
    { status: "IN_TRANSIT", label: "Driver/Kurir", desc: "Menuju Hub", bg: "bg-[#E0F2FE]" },
    { status: "RECEIVED", label: "Inbound & Operator", desc: "Serah Terima", bg: "bg-[#FEF08A]" },
    { status: "INSPECTING", label: "Inspeksi QC", desc: "Uji Higienitas", bg: "bg-[#F3E8FF]" },
    { status: "DISPOSITION_DECIDED", label: "Disposisi", desc: "Restock/Musnah", bg: "bg-[#FFE4E6]" },
    { status: "REFUNDED_REPLACED", label: "Penyelesaian", desc: "Ganti/Refund", bg: "bg-[#E0E7FF]" },
    { status: "COMPLETED", label: "Selesai", desc: "Tuntas & Arsip", bg: "bg-[#DCFCE7]" },
  ];

  const getStepIndex = (status: ReturnStatus): number => {
    const map: Record<ReturnStatus, number> = {
      REQUESTED: 0,
      IN_TRANSIT: 1,
      RECEIVED: 2,
      INSPECTING: 3,
      DISPOSITION_DECIDED: 4,
      REFUNDED_REPLACED: 5,
      COMPLETED: 6,
      REJECTED: 0,
    };
    return map[status] ?? 0;
  };

  const currentStepIndex = activeItem ? getStepIndex(activeItem.status) : 0;

  const getNextStatusAction = (item: CosmeticReturnItem) => {
    if (item.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR" && onOpenOperatorConfirm) {
      return {
        next: "RECEIVED" as ReturnStatus,
        label: "Konfirmasi Terima Fisik (Operator)",
        color: "bg-[#FEF08A] hover:bg-yellow-300 text-amber-950",
        action: "CONFIRM_HANDOVER",
      };
    }

    switch (item.status) {
      case "REQUESTED":
        return {
          next: "IN_TRANSIT" as ReturnStatus,
          label: "Paket Diserahkan ke Driver / Ekspedisi",
          color: "bg-[#E0F2FE] hover:bg-sky-200 text-blue-950",
        };
      case "IN_TRANSIT":
        return {
          next: "RECEIVED" as ReturnStatus,
          label: "Konfirmasi: Paket Tiba di Gudang Retur",
          color: "bg-[#FEF08A] hover:bg-yellow-300 text-amber-950",
        };
      case "RECEIVED":
        return {
          next: "INSPECTING" as ReturnStatus,
          label: "Mulai Uji QC & Cek Higienitas",
          color: "bg-[#F3E8FF] hover:bg-purple-200 text-purple-950",
          action: "QC",
        };
      case "INSPECTING":
        return {
          next: "DISPOSITION_DECIDED" as ReturnStatus,
          label: "Tetapkan Disposisi & Grade",
          color: "bg-[#FFE4E6] hover:bg-rose-200 text-rose-950",
          action: "QC",
        };
      case "DISPOSITION_DECIDED":
        return {
          next: "REFUNDED_REPLACED" as ReturnStatus,
          label: "Proses Refund / Kirim Pengganti",
          color: "bg-[#E0E7FF] hover:bg-indigo-200 text-indigo-950",
        };
      case "REFUNDED_REPLACED":
        return {
          next: "COMPLETED" as ReturnStatus,
          label: "Tandai Retur Selesai & Arsipkan",
          color: "bg-[#DCFCE7] hover:bg-green-300 text-green-950",
        };
      default:
        return null;
    }
  };

  const nextAction = activeItem ? getNextStatusAction(activeItem) : null;

  return (
    <div className="space-y-6">
      {/* Search and Quick Filters */}
      <div className="bg-white border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Toko (Toko Kosmetik ABC / Aura Beauty), Driver, Rak, Resi, atau PIC..."
              className="w-full bg-white border-2 border-black pl-10 pr-4 py-2.5 text-xs font-bold text-black placeholder-slate-400 focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-black cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs font-bold text-black uppercase">
            <span>Ditemukan: <strong className="text-rose-600 font-black">{filteredItems.length}</strong> retur aktif</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar List & Live Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Return Queue List (4 Cols) */}
        <div className="lg:col-span-4 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[750px]">
          <div className="pb-3 border-b-2 border-black flex items-center justify-between">
            <span className="text-xs font-black text-black uppercase tracking-wider">
              Antrean Pelacakan ({filteredItems.length})
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-[#DCFCE7] text-green-900">
              Live Sync
            </span>
          </div>

          <div className="overflow-y-auto space-y-2 mt-3 pr-1 flex-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase">
                Tidak ada data retur yang cocok dengan pencarian toko/resi ini.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === activeItem?.id;
                const isPendingHandover = item.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR";

                return (
                  <div
                    key={item.id}
                    id={`track-item-${item.id}`}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 cursor-pointer transition-all border-2 border-black text-xs ${
                      isSelected
                        ? "bg-rose-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                        : "bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-black">{item.id}</span>
                      {isPendingHandover ? (
                        <span className="px-1.5 py-0.2 border border-black text-[9px] font-black uppercase bg-[#FEF08A] text-amber-950 animate-pulse">
                          ⚠️ Serah Terima
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 border border-black text-[9px] font-black uppercase tracking-wider ${
                            item.status === "COMPLETED"
                              ? "bg-[#DCFCE7] text-green-950"
                              : item.status === "IN_TRANSIT"
                              ? "bg-[#E0F2FE] text-blue-950"
                              : item.status === "RECEIVED" || item.status === "INSPECTING"
                              ? "bg-[#FEF08A] text-amber-950"
                              : "bg-[#F3E8FF] text-purple-950"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="font-black text-black flex items-center gap-1 text-[11px] truncate">
                      <Store className="w-3 h-3 text-rose-600 shrink-0" />
                      <span>{item.storeName || "Toko Retail"}</span>
                    </div>

                    <div className="font-bold text-slate-800 truncate mt-0.5 text-[11px]">
                      {item.productName}
                    </div>

                    <div className="text-slate-600 flex items-center justify-between mt-1.5 pt-1.5 border-t border-black/10 text-[10px] font-medium">
                      <span>{item.driverName || "Driver"}</span>
                      <span className="font-mono font-black text-emerald-800">{item.storageBin ? item.storageBin.split("(")[0] : "Pallet Transit"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Tracking Visualizer & Deep Dive (8 Cols) */}
        {activeItem ? (
          <div className="lg:col-span-8 space-y-5">
            {/* Header & Status Card */}
            <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-5">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-2xl font-black text-black font-mono">{activeItem.id}</span>
                    <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-[#FFE4E6] text-rose-950">
                      {activeItem.channel}
                    </span>
                    {activeItem.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR" ? (
                      <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-[#FEF08A] text-amber-950">
                        ⚠️ Menunggu Konfirmasi Operator
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-[#DCFCE7] text-green-950">
                        ✅ Diterima: {activeItem.acceptedByOperator || "Operator"}
                      </span>
                    )}
                    {activeItem.isDefectBatchAlert && (
                      <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-amber-300 text-amber-950">
                        ⚠️ Defect Alert: {activeItem.batchNumber}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-black mt-2 flex items-center">
                    <Store className="w-4 h-4 mr-1.5 text-rose-600 shrink-0" />
                    {activeItem.storeName || "Toko Retail"}
                  </h3>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {activeItem.productName} <span className="text-slate-600 font-medium">({activeItem.shadeOrVariant})</span>
                  </div>

                  <div className="text-xs text-slate-700 mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                    <span>Resi: <strong className="text-black font-mono font-bold">{activeItem.trackingNumber}</strong></span>
                    <span>Driver: <strong className="text-black font-bold">{activeItem.driverName || "Internal"}</strong> ({activeItem.driverVehicle || "-"})</span>
                    <span>Lokasi Rak: <strong className="text-emerald-800 font-bold">{activeItem.storageBin || "Pallet Transit"}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenPrintSlip(activeItem)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border-2 border-black text-black text-xs font-black uppercase tracking-wider flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    title="Cetak Label Tag Retur & BAPB"
                  >
                    <Printer className="w-4 h-4 mr-1.5 text-black stroke-[2.5]" /> Label / BAPB
                  </button>
                  {nextAction && (
                    <button
                      id="btn-advance-status"
                      onClick={() => {
                        if (nextAction.action === "CONFIRM_HANDOVER" && onOpenOperatorConfirm) {
                          onOpenOperatorConfirm(activeItem);
                        } else if (nextAction.action === "QC") {
                          onOpenQCInspection(activeItem);
                        } else {
                          onAdvanceStatus(activeItem, nextAction.next);
                        }
                      }}
                      className={`px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center cursor-pointer ${nextAction.color}`}
                    >
                      <span>{nextAction.label}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Pipeline Steps */}
              <div className="pt-6">
                <div className="text-xs font-black text-black mb-3 uppercase tracking-wider">
                  Pipeline Pengembalian Real-Time:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {statusSteps.map((step, idx) => {
                    const isDone = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    return (
                      <div
                        key={step.status}
                        className={`p-3 border-2 border-black text-center transition-all relative ${
                          isCurrent
                            ? "bg-rose-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5 font-black"
                            : isDone
                            ? "bg-[#DCFCE7] text-green-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-bold"
                            : "bg-slate-100 text-slate-400 opacity-70"
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1.5">
                          {isDone ? (
                            <CheckCircle2
                              className={`w-4 h-4 stroke-[2.5] ${
                                isCurrent ? "text-white animate-pulse" : "text-green-800"
                              }`}
                            />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                          )}
                        </div>
                        <div className="text-[11px] font-black uppercase truncate">{step.label}</div>
                        <div className={`text-[9px] font-bold uppercase mt-0.5 truncate ${isCurrent ? "text-rose-100" : "text-slate-600"}`}>
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inbound & Operator Handover Details Card */}
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <span className="text-xs font-black text-black uppercase tracking-wider flex items-center">
                  <UserCheck className="w-4 h-4 mr-1.5 stroke-[2.5] text-emerald-600" />
                  Status Serah Terima Barang & Penerima Real-Time
                </span>
                {activeItem.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR" && onOpenOperatorConfirm && (
                  <button
                    onClick={() => onOpenOperatorConfirm(activeItem)}
                    className="px-3 py-1 bg-[#FEF08A] hover:bg-yellow-300 border-2 border-black text-amber-950 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                  >
                    Konfirmasi Terima Fisik Sekarang &rarr;
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-3 bg-slate-50 border border-black/20 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-slate-500">
                    1. Penerimaan Tahap Inbound Dock
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Staff Inbound:</span>
                    <span className="text-black font-black">{activeItem.inboundStaffName || "Agus Prasetyo"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Driver Pengantar:</span>
                    <span className="text-black font-bold">{activeItem.driverName || "Pak Joko"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Armada / Plat:</span>
                    <span className="text-black font-bold">{activeItem.driverVehicle || "B 9821 TXX"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Jumlah Koli:</span>
                    <span className="text-black font-bold">{activeItem.colliCount || 1} Koli</span>
                  </div>
                  {activeItem.inboundNotes && (
                    <div className="pt-1 text-[11px] text-slate-600 italic">
                      "{activeItem.inboundNotes}"
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/70 border border-black/20 space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-emerald-800">
                    2. Konfirmasi Penerimaan Operator Retur
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Operator Penerima:</span>
                    <span className="text-black font-black">
                      {activeItem.acceptedByOperator || "Belum Diterima Operator"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Waktu Serah Terima:</span>
                    <span className="text-black font-mono font-bold">
                      {activeItem.acceptedAt ? new Date(activeItem.acceptedAt).toLocaleString("id-ID") : "Menunggu Handover"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lokasi Rak Simpan:</span>
                    <span className="text-emerald-900 font-black">
                      {activeItem.storageBin || "Pallet Transit Inbound"}
                    </span>
                  </div>
                  {activeItem.operatorConfirmationNotes && (
                    <div className="pt-1 text-[11px] text-slate-700 italic">
                      "{activeItem.operatorConfirmationNotes}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details & Live Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Product & Hygiene Summary Card */}
              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <span className="text-xs font-black text-black uppercase tracking-wider">
                    Detail Produk & Higienitas
                  </span>
                  <button
                    onClick={() => onOpenQCInspection(activeItem)}
                    className="text-xs font-black uppercase text-rose-600 hover:underline cursor-pointer"
                  >
                    Buka Meja QC &rarr;
                  </button>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  <div className="flex justify-between py-1 border-b border-black/10">
                    <span className="text-slate-600">Kategori Kosmetik</span>
                    <span className="text-black font-black uppercase">{activeItem.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/10">
                    <span className="text-slate-600">Batch & Expire</span>
                    <span className="text-black font-mono font-black">
                      {activeItem.batchNumber} (EXP: {activeItem.expiryDate})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/10">
                    <span className="text-slate-600">Alasan Retur</span>
                    <span className="text-rose-600 font-bold text-right max-w-[200px]">
                      {activeItem.returnReason}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/10">
                    <span className="text-slate-600">Keputusan Disposisi</span>
                    <span className="font-black text-black uppercase">
                      {activeItem.disposition || "Belum Ditetapkan"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/10">
                    <span className="text-slate-600">Solusi Pelanggan</span>
                    <span className="font-black text-green-700 uppercase">
                      {activeItem.resolution?.replace("_", " ") || "Dalam Evaluasi"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Skor Higienitas QC</span>
                    <span className="font-black text-black">
                      {activeItem.hygieneScore}/100
                    </span>
                  </div>
                </div>

                {/* Evidence Photos */}
                {activeItem.evidencePhotos && activeItem.evidencePhotos.length > 0 && (
                  <div className="pt-2 border-t border-black/10">
                    <span className="text-[11px] font-black uppercase text-black block mb-2">
                      Foto Bukti Fisik / Unboxing:
                    </span>
                    <div className="flex items-center space-x-2">
                      {activeItem.evidencePhotos.map((photo, i) => (
                        <a
                          key={i}
                          href={photo}
                          target="_blank"
                          rel="noreferrer"
                          className="block relative w-16 h-16 border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all"
                        >
                          <img
                            src={photo}
                            alt="Bukti Retur"
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline Feed Log */}
              <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
                  <span className="text-xs font-black text-black uppercase tracking-wider flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-black stroke-[2.5]" />
                    Riwayat Jejak Logistik & QC
                  </span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 border border-black bg-slate-100">
                    {activeItem.timeline.length} Log
                  </span>
                </div>

                <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
                  {activeItem.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative pl-5 pb-1 text-xs">
                      {/* Line connector */}
                      {idx < activeItem.timeline.length - 1 && (
                        <div className="absolute left-1.5 top-2 -bottom-2 w-0.5 bg-black" />
                      )}
                      {/* Node dot */}
                      <div
                        className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center ${
                          idx === 0 ? "bg-rose-500 ring-2 ring-black" : "bg-white"
                        }`}
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-black">{event.title}</span>
                          <span className="text-[10px] text-slate-600 font-mono font-bold">
                            {new Date(event.timestamp).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            WIB
                          </span>
                        </div>
                        <p className="text-slate-700 mt-0.5 text-[11px] font-medium">{event.description}</p>
                        <div className="mt-1 flex items-center text-[10px] font-bold text-slate-500 space-x-2 uppercase">
                          <span>👤 {event.operatorName}</span>
                          <span>📍 {event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 bg-white border-2 border-black text-center text-slate-500 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Pilih tiket retur dari antrean di sebelah kiri.
          </div>
        )}
      </div>
    </div>
  );
};

