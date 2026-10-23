import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  User,
  Users,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { CosmeticReturnItem, DistributionCenter } from "../types";
import { getIndonesianLiveDateTime } from "../data/dateUtils";
import { TIM_ABSOLUTE_MEMBERS } from "../data/mockReturns";

interface InputAnonymousReturnViewProps {
  activeDC: DistributionCenter;
  onSaveReturn: (item: CosmeticReturnItem) => void;
  defaultStaffName: string;
  onNavigateToConfirm: () => void;
}

export const InputAnonymousReturnView: React.FC<InputAnonymousReturnViewProps> = ({
  activeDC,
  onSaveReturn,
  defaultStaffName,
  onNavigateToConfirm,
}) => {
  const [currentLiveTime, setCurrentLiveTime] = useState(getIndonesianLiveDateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(getIndonesianLiveDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [colliCount, setColliCount] = useState<number>(1);
  const [selectedMember, setSelectedMember] = useState<string>("ALFIAN");
  const [customReceiverName, setCustomReceiverName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [physicalDescription, setPhysicalDescription] = useState("");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastSavedId, setLastSavedId] = useState("");

  const effectiveReceiverName =
    selectedMember === "Lainnya" ? customReceiverName.trim() : selectedMember;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveReceiverName) {
      alert("Silakan pilih atau masukkan Nama Penerima (Tim Absolute).");
      return;
    }
    if (!colliCount || colliCount < 1) {
      alert("Silakan masukkan Jumlah yang diterima (minimal 1).");
      return;
    }

    const liveNow = getIndonesianLiveDateTime();
    const newId = `RET-ANON-${activeDC === "DC_SOLO" ? "SLO" : "JOG"}-${Date.now().toString().slice(-4)}`;

    const newItem: CosmeticReturnItem = {
      id: newId,
      dcLocation: activeDC,
      isAnonymousStore: true,
      orderId: `ANON-${newId}`,
      trackingNumber: `TRK-ANON-${Date.now().toString().slice(-6)}`,
      courier: driverName.trim() || "Ekspedisi / Driver Titipan (Tanpa Identitas Toko)",
      channel: "Toko Offline",
      storeName: "⚠️ TANPA KETERANGAN NAMA TOKO",
      driverName: driverName.trim() || "Driver Mitra",
      driverVehicle: "-",
      inboundStaffName: effectiveReceiverName,
      inboundReceivedAt: liveNow.isoString,
      inboundDayFormatted: liveNow.fullString,
      inboundNotes: `Retur tanpa nama toko diterima ${colliCount} koli/pcs oleh Tim Absolute ${effectiveReceiverName}.${physicalDescription ? ` Ciri: ${physicalDescription.trim()}` : ""}`,
      colliCount: Number(colliCount) || 1,
      handoverStatus: "MENUNGGU_KONFIRMASI_OPERATOR",
      storageBin: `Rak Karantina Tanpa Identitas (${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"})`,
      customerName: "Anonim (Belum Teridentifikasi)",
      customerPhone: "-",
      customerCity: activeDC === "DC_SOLO" ? "Wilayah Solo Raya" : "Wilayah DIY",
      productName: `Paket Retur Anonim (${colliCount} Koli/Pcs)`,
      category: "SKINCARE",
      shadeOrVariant: "Belum Teridentifikasi",
      sku: "ANON-ITEM",
      quantity: Number(colliCount) || 1,
      unitPrice: 50000,
      totalValue: (Number(colliCount) || 1) * 50000,
      batchNumber: "UNLABELLED",
      expiryDate: "2027-12-31",
      returnReason: "Retur Tanpa Keterangan Nama Toko / Surat Jalan Hilang",
      customerNotes: physicalDescription.trim() || "Paket tiba di gudang tanpa label pengirim / surat jalan.",
      evidencePhotos: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
      ],
      status: "RECEIVED",
      priority: "HIGH",
      disposition: "QC_HOLD",
      hygieneScore: 50,
      hygieneChecklist: {
        sealIntact: false,
        noSwatchOrFingerprints: true,
        pumpDropperSterile: true,
        batchAndExpMatch: false,
        noLeakageOrCracks: true,
        smellAndTextureNormal: true,
      },
      createdAt: liveNow.isoString,
      updatedAt: liveNow.isoString,
      timeline: [
        {
          id: `tl-anon-${Date.now()}`,
          timestamp: liveNow.isoString,
          status: "RECEIVED",
          title: "Penerimaan Retur Tanpa Nama Toko oleh Tim Absolute",
          description: `Penerima Tim Absolute ${effectiveReceiverName} menerima ${colliCount} koli/pcs tanpa label nama toko pengirim. Memerlukan konfirmasi & investigasi Operator Retur.`,
          operatorName: effectiveReceiverName,
          location: `Inbound Receiving ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}`,
        },
      ],
    };

    onSaveReturn(newItem);
    setLastSavedId(newId);
    setSavedSuccess(true);

    setColliCount(1);
    setDriverName("");
    setPhysicalDescription("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 font-sans">
      {/* Header Info */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Khusus Paket Tanpa Identitas
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Retur Tanpa Keterangan Nama Toko
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan form ini jika paket datang tanpa surat jalan atau label pengirim.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            {currentLiveTime.dayName}, {currentLiveTime.formattedDate}
          </span>
          <span className="text-base font-mono font-bold text-slate-800 tracking-tight">
            {currentLiveTime.timeString} WIB
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Data Retur Tanpa Toko Berhasil Disimpan (ID: {lastSavedId})
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Barang masuk ke antrean konfirmasi & rak karantina investigasi.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setSavedSuccess(false)}
              className="px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100/80 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={onNavigateToConfirm}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <span>Lihat Antrean</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Simple Form */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Jumlah Koli / Unit */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Jumlah Koli / Barang Diterima</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={colliCount}
                onChange={(e) => setColliCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                required
                autoFocus
              />
              <span className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 whitespace-nowrap">
                Koli / Dus
              </span>
            </div>
          </div>

          {/* Tim Absolute Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Penerima Inbound (Tim Absolute)</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TIM_ABSOLUTE_MEMBERS.map((member) => {
                const isSelected = selectedMember === member;
                return (
                  <button
                    key={member}
                    type="button"
                    onClick={() => {
                      setSelectedMember(member);
                      setCustomReceiverName("");
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold"
                        : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <User className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span>{member}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedMember("Lainnya")}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMember === "Lainnya"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold"
                    : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${selectedMember === "Lainnya" ? "text-white" : "text-slate-400"}`} />
                <span>Lainnya</span>
              </button>
            </div>

            {selectedMember === "Lainnya" && (
              <div className="pt-1.5">
                <input
                  type="text"
                  value={customReceiverName}
                  onChange={(e) => setCustomReceiverName(e.target.value)}
                  placeholder="Ketik nama staff penerima lainnya..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  required
                />
              </div>
            )}
          </div>

          {/* Optional Driver & Ciri Fisik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Driver Pengantar (Opsional)</span>
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Contoh: Ekspedisi / Driver Mitra"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ciri Kemasan / Fisik Paket (Opsional)
              </label>
              <input
                type="text"
                value={physicalDescription}
                onChange={(e) => setPhysicalDescription(e.target.value)}
                placeholder="Contoh: Lakban cokelat tanpa nota..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              * Waktu dan tanggal otomatis dicatat saat data disimpan.
            </p>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Retur Tanpa Toko</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
