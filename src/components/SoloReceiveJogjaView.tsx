import React, { useState } from "react";
import {
  Inbox,
  Package,
  Store,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  User,
  Truck,
  X,
} from "lucide-react";
import {
  JogjaToSoloTransferItem,
  JogjaTransferCondition,
} from "../types";
import {
  TIM_ABSOLUTE_MEMBERS,
  JOGJA_CONDITION_OPTIONS,
} from "../data/mockReturns";
import { getIndonesianLiveDateTime } from "../data/dateUtils";

interface SoloReceiveJogjaViewProps {
  transfers: JogjaToSoloTransferItem[];
  onConfirmTimAbsolute: (
    transferId: string,
    timAbsoluteName: string,
    timAbsoluteNotes?: string,
    driverName?: string,
    verifiedQty?: number
  ) => void;
  onNavigateToDriverConfirm: () => void;
}

export const SoloReceiveJogjaView: React.FC<SoloReceiveJogjaViewProps> = ({
  transfers,
  onConfirmTimAbsolute,
  onNavigateToDriverConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [conditionFilter, setConditionFilter] = useState<string>("ALL");

  const [selectedTransferForConfirm, setSelectedTransferForConfirm] =
    useState<JogjaToSoloTransferItem | null>(null);
  const [selectedStaffOption, setSelectedStaffOption] = useState<string>("ALFIAN");
  const [customStaffName, setCustomStaffName] = useState("");
  const [driverName, setDriverName] = useState("Ekspedisi Internal Solo-Jogja");
  const [verifiedQuantity, setVerifiedQuantity] = useState<number>(1);
  const [timAbsoluteNotes, setTimAbsoluteNotes] = useState(
    "Fisik barang transfer dari DC Jogja telah tiba di Inbound DC Solo."
  );

  const handleOpenConfirmModal = (item: JogjaToSoloTransferItem) => {
    setSelectedTransferForConfirm(item);
    setVerifiedQuantity(item.quantity);
    setDriverName(`Ekspedisi DC Jogja (Pengirim: ${item.senderName})`);
    setTimAbsoluteNotes(
      `Barang dari ${item.storeName} (${item.condition}) telah tiba di Inbound DC Solo.`
    );
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferForConfirm) return;

    const effectiveStaff =
      selectedStaffOption === "Lainnya"
        ? customStaffName.trim()
        : selectedStaffOption;

    if (!effectiveStaff) {
      alert("Harap pilih atau isi nama Tim Absolute penerima!");
      return;
    }

    onConfirmTimAbsolute(
      selectedTransferForConfirm.id,
      effectiveStaff,
      timAbsoluteNotes.trim(),
      driverName.trim(),
      verifiedQuantity
    );

    setSelectedTransferForConfirm(null);
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.receivedByTimAbsolute &&
        t.receivedByTimAbsolute.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PENDING"
        ? t.transferStatus === "MENUNGGU_PENERIMAAN_SOLO"
        : t.transferStatus !== "MENUNGGU_PENERIMAAN_SOLO";

    const matchesCondition =
      conditionFilter === "ALL" ? true : t.condition === conditionFilter;

    return matchesSearch && matchesStatus && matchesCondition;
  });

  const pendingCount = transfers.filter(
    (t) => t.transferStatus === "MENUNGGU_PENERIMAAN_SOLO"
  ).length;
  const receivedCount = transfers.filter(
    (t) => t.transferStatus !== "MENUNGGU_PENERIMAAN_SOLO"
  ).length;

  return (
    <div className="space-y-4 font-sans max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Penerimaan Antar Hub
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-1">
            Retur Masuk dari DC Jogja
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfirmasi fisik barang kiriman dari DC Jogja saat tiba di Inbound DC Solo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingCount} Menunggu Konfirmasi</span>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{receivedCount} Selesai Diterima</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari toko, nomor ID, pengirim Jogja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua ({transfers.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-white font-bold"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100"
            }`}
          >
            Menunggu ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("RECEIVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === "RECEIVED"
                ? "bg-emerald-600 text-white font-bold"
                : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
            }`}
          >
            Selesai ({receivedCount})
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredTransfers.length > 0 ? (
          filteredTransfers.map((item) => {
            const isPending = item.transferStatus === "MENUNGGU_PENERIMAAN_SOLO";

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{item.storeName}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md font-mono">
                      {item.quantity} {item.quantityUnit}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md">
                      Kondisi: {item.condition}
                    </span>
                    {isPending ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold text-[10px] rounded-full">
                        Menunggu Tim Absolute
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-full">
                        Diterima di Solo
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>ID: <strong className="font-mono text-slate-700">{item.id}</strong></span>
                    <span>•</span>
                    <span>Dikirim oleh: <strong>{item.senderName}</strong> (DC Jogja)</span>
                    <span>•</span>
                    <span>Waktu: {item.sentDayFormatted}</span>
                  </div>

                  {item.senderNotes && (
                    <p className="text-xs text-slate-600 italic mt-1">
                      "{item.senderNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  {isPending ? (
                    <button
                      onClick={() => handleOpenConfirmModal(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terima Barang</span>
                    </button>
                  ) : (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Diterima oleh:</span>
                      <span className="text-xs font-semibold text-slate-800">{item.receivedByTimAbsolute}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-400 text-xs">
            Tidak ada data kiriman retur dari Jogja yang sesuai filter.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedTransferForConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">Konfirmasi Kedatangan Inbound</span>
                <h2 className="text-base font-bold text-slate-800">
                  Terima Retur: {selectedTransferForConfirm.storeName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTransferForConfirm(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Penerima Inbound (Tim Absolute) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIM_ABSOLUTE_MEMBERS.map((member) => (
                    <button
                      type="button"
                      key={member}
                      onClick={() => {
                        setSelectedStaffOption(member);
                        setCustomStaffName("");
                      }}
                      className={`p-2 rounded-xl border font-semibold transition-all ${
                        selectedStaffOption === member
                          ? "bg-blue-600 border-blue-600 text-white font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {member}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Jumlah Fisik Diterima
                </label>
                <input
                  type="number"
                  min="1"
                  value={verifiedQuantity}
                  onChange={(e) => setVerifiedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Catatan Penerimaan
                </label>
                <input
                  type="text"
                  value={timAbsoluteNotes}
                  onChange={(e) => setTimAbsoluteNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTransferForConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Konfirmasi Penerimaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
