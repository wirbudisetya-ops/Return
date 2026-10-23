import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  Users,
  Package,
  Truck,
  CheckCircle2,
  Search,
  Sparkles,
  User,
  FileText,
  Hash,
} from "lucide-react";
import { CosmeticReturnItem, DistributionCenter, StoreDirectoryItem } from "../types";
import { getIndonesianLiveDateTime } from "../data/dateUtils";
import { loadStoreDirectory, addStoreToDirectory } from "../data/storeDirectory";
import { TIM_ABSOLUTE_MEMBERS } from "../data/mockReturns";

interface ReturSFMFormProps {
  activeDC: DistributionCenter;
  onSaveReturn: (item: CosmeticReturnItem) => void;
  defaultStaffName: string;
  onSuccess: (savedId: string) => void;
  selectedStoreShared?: StoreDirectoryItem | null;
  onStoreChangeShared?: (store: StoreDirectoryItem | null) => void;
}

export const ReturSFMForm: React.FC<ReturSFMFormProps> = ({
  activeDC,
  onSaveReturn,
  onSuccess,
  selectedStoreShared,
  onStoreChangeShared,
}) => {
  const [storeList, setStoreList] = useState<StoreDirectoryItem[]>([]);
  useEffect(() => {
    setStoreList(loadStoreDirectory(activeDC));
  }, [activeDC]);

  // SFM Number
  const [sfmNumber, setSfmNumber] = useState("");

  // Store selection state
  const [storeQuery, setStoreQuery] = useState(selectedStoreShared?.name || "");
  const [selectedStore, setSelectedStore] = useState<StoreDirectoryItem | null>(
    selectedStoreShared || null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tim Absolute Receiver state
  const [selectedMember, setSelectedMember] = useState<string>("ALFIAN");
  const [customReceiverName, setCustomReceiverName] = useState("");

  // Logistics state
  const [driverName, setDriverName] = useState("");
  const [colliCount, setColliCount] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const effectiveReceiverName =
    selectedMember === "Lainnya" ? customReceiverName.trim() : selectedMember;

  const filteredStores = storeList.filter((s) =>
    s.name.toLowerCase().includes(storeQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedStoreShared) {
      setSelectedStore(selectedStoreShared);
      setStoreQuery(selectedStoreShared.name);
    }
  }, [selectedStoreShared]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStore = (store: StoreDirectoryItem) => {
    setSelectedStore(store);
    setStoreQuery(store.name);
    setIsDropdownOpen(false);
    onStoreChangeShared?.(store);
  };

  const handleAddNewStore = () => {
    if (!storeQuery.trim()) return;
    const newStore: StoreDirectoryItem = {
      id: `STR-CUSTOM-${Date.now()}`,
      name: storeQuery.trim(),
      code: `CUST-${String(Date.now()).slice(-4)}`,
      dcLocation: activeDC,
      city: activeDC === "DC_SOLO" ? "Surakarta & Sekitarnya" : "DIY",
      address: activeDC === "DC_SOLO" ? "Gudang Hub DC Solo" : "DIY",
    };
    const updated = addStoreToDirectory(newStore);
    setStoreList(updated.filter((s) => s.dcLocation === activeDC));
    setSelectedStore(newStore);
    setIsDropdownOpen(false);
    onStoreChangeShared?.(newStore);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sfmNumber.trim()) {
      alert("Silakan masukkan Nomor SFM (Surat Formulir Masuk).");
      return;
    }
    if (!storeQuery.trim()) {
      alert("Silakan masukkan atau pilih Nama Toko terlebih dahulu.");
      return;
    }
    if (!effectiveReceiverName) {
      alert("Silakan pilih atau masukkan Nama Penerima (Tim Absolute).");
      return;
    }

    const liveNow = getIndonesianLiveDateTime();
    const cleanSFM = sfmNumber.trim().toUpperCase();
    const newId = `RET-${activeDC === "DC_SOLO" ? "SLO" : "JOG"}-${Date.now().toString().slice(-4)}`;

    const newItem: CosmeticReturnItem = {
      id: newId,
      dcLocation: activeDC,
      returnMethod: "SFM",
      sfmNumber: cleanSFM,
      orderId: cleanSFM.startsWith("SFM") ? cleanSFM : `SFM-${cleanSFM}`,
      trackingNumber: `TRK-${cleanSFM}`,
      courier: driverName ? `Driver: ${driverName.trim()}` : "Armada Inbound DC",
      channel: "Toko Offline",
      storeName: storeQuery.trim(),
      driverName: driverName.trim() || "Driver Mitra",
      driverVehicle: "-",
      inboundStaffName: effectiveReceiverName,
      inboundReceivedAt: liveNow.isoString,
      inboundDayFormatted: liveNow.fullString,
      inboundNotes:
        notes.trim() ||
        `Retur Dokumen SFM (${cleanSFM}): Diterima ${colliCount} koli dari toko ${storeQuery.trim()}.`,
      colliCount: Math.max(1, Number(colliCount) || 1),
      handoverStatus: "MENUNGGU_KONFIRMASI_OPERATOR",
      storageBin: `Area Transit Inbound ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}`,
      customerName: `Pic Toko (${storeQuery.trim()})`,
      customerPhone: "-",
      customerCity: activeDC === "DC_SOLO" ? "Surakarta" : "DIY",
      productName: `Paket Retur Dokumen SFM (${cleanSFM})`,
      category: "SKINCARE",
      shadeOrVariant: "Standard Dokumen SFM",
      sku: `SFM-${cleanSFM}`,
      quantity: Math.max(1, Number(colliCount) || 1),
      unitPrice: 100000,
      totalValue: (Math.max(1, Number(colliCount)) || 1) * 100000,
      batchNumber: cleanSFM,
      expiryDate: "2027-12-31",
      returnReason: `Retur SFM Toko (${cleanSFM})`,
      customerNotes: notes.trim() || `Dokumen SFM No. ${cleanSFM} dari ${storeQuery.trim()}.`,
      evidencePhotos: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
      ],
      status: "RECEIVED",
      priority: "MEDIUM",
      disposition: "QC_HOLD",
      hygieneScore: 85,
      hygieneChecklist: {
        sealIntact: true,
        noSwatchOrFingerprints: true,
        pumpDropperSterile: true,
        batchAndExpMatch: true,
        noLeakageOrCracks: true,
        smellAndTextureNormal: true,
      },
      createdAt: liveNow.isoString,
      updatedAt: liveNow.isoString,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: liveNow.isoString,
          status: "RECEIVED",
          title: `Diterima Tim Absolute (Dokumen SFM: ${cleanSFM})`,
          description: `Penerima Tim Absolute ${effectiveReceiverName} menerima ${colliCount} koli dari ${storeQuery.trim()} (SFM: ${cleanSFM}, Driver: ${driverName || "Mitra"}). Menunggu konfirmasi Operator Retur.`,
          operatorName: effectiveReceiverName,
          location: `Inbound Dock ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}`,
        },
      ],
    };

    onSaveReturn(newItem);
    onSuccess(newId);

    // Reset form
    setSfmNumber("");
    setStoreQuery("");
    setSelectedStore(null);
    setDriverName("");
    setColliCount(1);
    setNotes("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header Penjelasan Mode SFM */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-blue-950">
            Formulir Retur SFM (Surat Formulir Masuk)
          </p>
          <p className="text-blue-700 mt-0.5 leading-relaxed">
            Gunakan opsi ini untuk mencatat penerimaan paket retur dari toko mitra yang disertai dokumen resmi <strong>Nomor SFM</strong> dan jumlah koli/dus fisik.
          </p>
        </div>
      </div>

      {/* Field Tambahan Baru: Nomor SFM */}
      <div className="bg-slate-50/80 border border-blue-200 rounded-xl p-4 shadow-xs">
        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-blue-600" />
            <span>Nomor Dokumen SFM</span>
            <span className="text-rose-500 font-bold">*</span>
          </span>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
            Wajib Diisi
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={sfmNumber}
            onChange={(e) => setSfmNumber(e.target.value)}
            placeholder="Contoh: SFM-2026-0891 atau SFM/SLO/9021..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition-all uppercase"
            required
            autoFocus
          />
          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
          <span>💡 Masukkan nomor formulir / surat jalan retur SFM yang tertera pada lembar dokumen fisik dari toko.</span>
        </p>
      </div>

      {/* Section 1: Store Selector with Search */}
      <div className="space-y-2 relative" ref={dropdownRef}>
        <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-600" />
            <span>Nama Toko Asal Retur</span>
            <span className="text-rose-500 font-bold">*</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            Ketik nama toko untuk mencari
          </span>
        </label>

        <div className="relative">
          <input
            type="text"
            value={storeQuery}
            onChange={(e) => {
              setStoreQuery(e.target.value);
              setSelectedStore(null);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Contoh: Toko Kosmetik ABC, Aura Beauty, Glow Point, Toko Cantik..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition-all"
            required
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 z-40 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto mt-1 divide-y divide-slate-100">
            {filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  className="px-4 py-2.5 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-800">{store.name}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-mono font-medium text-slate-500">
                    {store.code}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Toko "{storeQuery}" belum terdaftar di database.
                </p>
                <button
                  type="button"
                  onClick={handleAddNewStore}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  + Tambahkan "{storeQuery}"
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Store Chips */}
        <div className="pt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Toko Populer:</span>
          {storeList.slice(0, 4).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectStore(s)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 rounded-lg text-[11px] font-medium text-slate-600 cursor-pointer transition-colors"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Tim Absolute Selector */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Penerima Inbound (Tim Absolute)</span>
            <span className="text-rose-500 font-bold">*</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            Pilih staff yang menerima barang
          </span>
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
                    ? "bg-blue-600 border-blue-600 text-white shadow-xs font-bold"
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
                ? "bg-blue-600 border-blue-600 text-white shadow-xs font-bold"
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
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>
        )}
      </div>

      {/* Section 3: Detail Koli, Driver, Catatan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
        {/* Koli */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Jumlah Koli / Dus</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={colliCount}
            onChange={(e) => setColliCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Driver */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Driver Pengantar</span>
          </label>
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            placeholder="Contoh: Pak Joko"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Catatan Kondisi Fisik
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Kardus utuh, segel aman..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[11px] text-slate-400">
          * Nomor SFM dan waktu otomatis tercatat pada antrean verifikasi operator.
        </p>

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Simpan Data Retur SFM</span>
        </button>
      </div>
    </form>
  );
};
