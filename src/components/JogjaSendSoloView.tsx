import React, { useState } from "react";
import {
  Send,
  Package,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  MapPin,
  Truck,
  Box,
} from "lucide-react";
import {
  DistributionCenter,
  JogjaToSoloTransferItem,
  JogjaTransferCondition,
  JogjaSenderOption,
} from "../types";
import {
  JOGJA_SENDER_MEMBERS,
  JOGJA_CONDITION_OPTIONS,
} from "../data/mockReturns";
import { getIndonesianLiveDateTime } from "../data/dateUtils";

interface JogjaSendSoloViewProps {
  transfers: JogjaToSoloTransferItem[];
  onSaveTransfer: (newTransfer: JogjaToSoloTransferItem) => void;
  defaultSender?: string;
  onNavigateToConfirm?: () => void;
}

export const JogjaSendSoloView: React.FC<JogjaSendSoloViewProps> = ({
  transfers,
  onSaveTransfer,
  defaultSender = "OKI",
  onNavigateToConfirm,
}) => {
  const [storeName, setStoreName] = useState("");
  const [condition, setCondition] = useState<JogjaTransferCondition>("BAD");
  const [quantity, setQuantity] = useState<number>(1);
  const [quantityUnit, setQuantityUnit] = useState<"Koli" | "Pcs" | "Dus">("Koli");
  const [selectedSenderOption, setSelectedSenderOption] = useState<JogjaSenderOption>(
    defaultSender === "OKI" || defaultSender === "NARYO" || defaultSender === "JULI"
      ? (defaultSender as JogjaSenderOption)
      : "Lainnya"
  );
  const [customSenderName, setCustomSenderName] = useState(
    defaultSender !== "OKI" && defaultSender !== "NARYO" && defaultSender !== "JULI"
      ? defaultSender
      : ""
  );
  const [senderNotes, setSenderNotes] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [conditionFilter, setConditionFilter] = useState<string>("ALL");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const jogjaStoreSuggestions = [
    "Toko Kosmetik ABC Malioboro",
    "Beauty Corner Nusa Indah Sleman",
    "Glow Mart Yogyakarta City",
    "Toko Pesona Cantik Bantul",
    "Mitra Kosmetik Sejati Jogja",
    "Toko Harmoni Beauty Sleman",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim()) {
      alert("Harap masukkan nama toko asal retur!");
      return;
    }

    const effectiveSender =
      selectedSenderOption === "Lainnya"
        ? customSenderName.trim()
        : selectedSenderOption;

    if (!effectiveSender) {
      alert("Harap isi nama pengirim!");
      return;
    }

    const { isoString, fullString } = getIndonesianLiveDateTime();
    const newId = `TF-JOG-SLO-${Date.now().toString().slice(-4)}`;

    const newTransfer: JogjaToSoloTransferItem = {
      id: newId,
      storeName: storeName.trim(),
      condition,
      quantity: Number(quantity) || 1,
      quantityUnit,
      senderName: effectiveSender,
      senderNotes: senderNotes.trim() || undefined,
      sentAt: isoString,
      sentDayFormatted: fullString,
      transferStatus: "MENUNGGU_PENERIMAAN_SOLO",
    };

    onSaveTransfer(newTransfer);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);

    setStoreName("");
    setQuantity(1);
    setSenderNotes("");
    setCondition("BAD");
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.senderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PENDING"
        ? t.transferStatus === "MENUNGGU_PENERIMAAN_SOLO"
        : t.transferStatus === "DITERIMA_TIM_ABSOLUTE" || t.transferStatus === "SELESAI_OPERATOR_SOLO";

    const matchesCondition =
      conditionFilter === "ALL" ? true : t.condition === conditionFilter;

    return matchesSearch && matchesStatus && matchesCondition;
  });

  const pendingCount = transfers.filter((t) => t.transferStatus === "MENUNGGU_PENERIMAAN_SOLO").length;
  const receivedCount = transfers.filter((t) => t.transferStatus !== "MENUNGGU_PENERIMAAN_SOLO").length;

  return (
    <div className="space-y-4 font-sans max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Transfer Antar Hub
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-1">
            Kirim Retur ke Solo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengiriman fisik paket retur dari <strong>DC Jogja</strong> ke <strong>DC Solo</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingCount} Sedang Dikirim</span>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{receivedCount} Selesai di Solo</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengiriman retur ke DC Solo berhasil dicatat! Data langsung muncul di DC Solo.</span>
        </div>
      )}

      {/* Main Grid: Form Left, History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Form kirim */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Send className="w-4 h-4 text-blue-600" />
            <span>Formulir Pengiriman Barang</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Toko */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Nama Toko Asal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Toko Kosmetik ABC Malioboro..."
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {jogjaStoreSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStoreName(s)}
                    className="text-[10px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded-md text-slate-600 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Kondisi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Kondisi Barang <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {JOGJA_CONDITION_OPTIONS.map((opt) => {
                  const isSelected = condition === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setCondition(opt.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white font-bold shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kuantitas & Unit */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Jumlah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Satuan</label>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Koli">Koli / Dus</option>
                  <option value="Pcs">Pcs / Item</option>
                  <option value="Dus">Dus Besar</option>
                </select>
              </div>
            </div>

            {/* Pengirim */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Pengirim DC Jogja <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {JOGJA_SENDER_MEMBERS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setSelectedSenderOption(m as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      selectedSenderOption === m
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {selectedSenderOption === "Lainnya" && (
                <input
                  type="text"
                  placeholder="Ketik nama pengirim..."
                  value={customSenderName}
                  onChange={(e) => setCustomSenderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mt-1.5"
                  required
                />
              )}
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Catatan Tambahan</label>
              <input
                type="text"
                placeholder="Catatan nomor resi atau driver..."
                value={senderNotes}
                onChange={(e) => setSenderNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Retur ke Solo</span>
            </button>
          </form>
        </div>

        {/* List Riwayat Pengiriman */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Riwayat Pengiriman ({filteredTransfers.length})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari toko / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((item) => {
                const isPending = item.transferStatus === "MENUNGGU_PENERIMAAN_SOLO";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.storeName}</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[10px] rounded-md font-mono">
                          {item.quantity} {item.quantityUnit}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md">
                          {item.condition}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        ID: {item.id} • Pengirim: {item.senderName} • {item.sentDayFormatted?.split(",")[0]}
                      </div>
                    </div>

                    <div>
                      {isPending ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold text-[10px] rounded-full inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                          <span>Proses Pengiriman</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Diterima di Solo</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada data pengiriman transfer retur.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
