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
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Hash,
  Layers,
} from "lucide-react";
import { CosmeticReturnItem, DistributionCenter, StoreDirectoryItem, ReturnInputMethod } from "../types";
import { getIndonesianLiveDateTime } from "../data/dateUtils";
import { loadStoreDirectory, addStoreToDirectory } from "../data/storeDirectory";
import { TIM_ABSOLUTE_MEMBERS } from "../data/mockReturns";

interface InputStoreReturnViewProps {
  activeDC: DistributionCenter;
  onSaveReturn: (item: CosmeticReturnItem) => void;
  defaultStaffName: string;
  onNavigateToConfirm: () => void;
  onNavigateToManualReturn?: () => void;
}

export const InputStoreReturnView: React.FC<InputStoreReturnViewProps> = ({
  activeDC,
  onSaveReturn,
  defaultStaffName,
  onNavigateToConfirm,
  onNavigateToManualReturn,
}) => {
  const [currentLiveTime, setCurrentLiveTime] = useState(getIndonesianLiveDateTime());

  // Jenis Retur: RETUR SFM vs RETUR MANUAL
  const [returnType, setReturnType] = useState<ReturnInputMethod>("SFM");

  // SFM Number
  const [sfmNumber, setSfmNumber] = useState("");

  // Store Directory & selection state
  const [storeList, setStoreList] = useState<StoreDirectoryItem[]>([]);
  const [storeQuery, setStoreQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreDirectoryItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tim Absolute Receiver state
  const [selectedMember, setSelectedMember] = useState<string>("ALFIAN");
  const [customReceiverName, setCustomReceiverName] = useState("");

  // Logistics state
  const [driverName, setDriverName] = useState("");
  const [colliCount, setColliCount] = useState<number>(1);
  const [notes, setNotes] = useState("");

  // Success state
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lastSavedId, setLastSavedId] = useState("");
  const [lastSavedType, setLastSavedType] = useState<ReturnInputMethod>("SFM");

  useEffect(() => {
    setStoreList(loadStoreDirectory(activeDC));
  }, [activeDC]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(getIndonesianLiveDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dropdown close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveReceiverName =
    selectedMember === "Lainnya" ? customReceiverName.trim() : selectedMember;

  const filteredStores = storeList.filter((s) =>
    s.name.toLowerCase().includes(storeQuery.toLowerCase())
  );

  const handleSelectStore = (store: StoreDirectoryItem) => {
    setSelectedStore(store);
    setStoreQuery(store.name);
    setIsDropdownOpen(false);
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi SFM jika jenis retur adalah SFM
    if (returnType === "SFM" && !sfmNumber.trim()) {
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

    const orderId =
      returnType === "SFM"
        ? cleanSFM.startsWith("SFM")
          ? cleanSFM
          : `SFM-${cleanSFM}`
        : `MANUAL-${Date.now().toString().slice(-6)}`;

    const trackingNumber =
      returnType === "SFM" ? `TRK-${cleanSFM}` : `TRK-MANUAL-${Date.now().toString().slice(-4)}`;

    const newItem: CosmeticReturnItem = {
      id: newId,
      dcLocation: activeDC,
      returnMethod: returnType,
      sfmNumber: returnType === "SFM" ? cleanSFM : undefined,
      orderId: orderId,
      trackingNumber: trackingNumber,
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
        (returnType === "SFM"
          ? `Retur SFM (${cleanSFM}): Diterima ${colliCount} koli dari toko ${storeQuery.trim()}.`
          : `Retur Manual: Diterima ${colliCount} koli dari toko ${storeQuery.trim()}.`),
      colliCount: Math.max(1, Number(colliCount) || 1),
      handoverStatus: "MENUNGGU_KONFIRMASI_OPERATOR",
      storageBin: `Area Transit Inbound ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}`,
      customerName: `Pic Toko (${storeQuery.trim()})`,
      customerPhone: "-",
      customerCity: activeDC === "DC_SOLO" ? "Surakarta" : "DIY",
      productName:
        returnType === "SFM"
          ? `Paket Retur Dokumen SFM (${cleanSFM})`
          : `Paket Retur Toko (${storeQuery.trim()})`,
      category: "SKINCARE",
      shadeOrVariant: returnType === "SFM" ? "Dokumen SFM" : "Retur Fisik Manual",
      sku: returnType === "SFM" ? `SFM-${cleanSFM}` : `RTR-MANUAL-${Date.now().toString().slice(-4)}`,
      quantity: Math.max(1, Number(colliCount) || 1),
      unitPrice: 100000,
      totalValue: (Math.max(1, Number(colliCount)) || 1) * 100000,
      batchNumber: returnType === "SFM" ? cleanSFM : `MANUAL-${Date.now().toString().slice(-4)}`,
      expiryDate: "2027-12-31",
      returnReason:
        returnType === "SFM"
          ? `Retur SFM Toko (${cleanSFM})`
          : `Retur Manual Toko (${storeQuery.trim()})`,
      customerNotes:
        notes.trim() ||
        (returnType === "SFM"
          ? `Dokumen SFM No. ${cleanSFM} dari ${storeQuery.trim()}.`
          : `Retur Manual dari ${storeQuery.trim()}.`),
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
          title:
            returnType === "SFM"
              ? `Diterima Tim Absolute (Dokumen SFM: ${cleanSFM})`
              : `Diterima Tim Absolute (Retur Manual)`,
          description:
            returnType === "SFM"
              ? `Penerima Tim Absolute ${effectiveReceiverName} menerima ${colliCount} koli dari ${storeQuery.trim()} (SFM: ${cleanSFM}, Driver: ${driverName || "Mitra"}). Menunggu konfirmasi Operator Retur.`
              : `Penerima Tim Absolute ${effectiveReceiverName} menerima ${colliCount} koli dari ${storeQuery.trim()} (Jenis: Retur Manual, Driver: ${driverName || "Mitra"}). Menunggu konfirmasi Operator Retur.`,
          operatorName: effectiveReceiverName,
          location: `Inbound Dock ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}`,
        },
      ],
    };

    onSaveReturn(newItem);
    setLastSavedId(newId);
    setLastSavedType(returnType);
    setSavedSuccess(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Reset fields
    setSfmNumber("");
    setStoreQuery("");
    setSelectedStore(null);
    setDriverName("");
    setColliCount(1);
    setNotes("");
  };

  const handleResetForm = () => {
    setSavedSuccess(false);
    setLastSavedId("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Penerimaan Inbound Toko
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-300">
                Pusat Distribusi:{" "}
                <strong className="text-white">
                  {activeDC === "DC_SOLO" ? "DC Solo (Surakarta)" : "DC Jogja (DIY)"}
                </strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Menu 1: Input Retur Toko</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Catat penerimaan koli retur fisik toko oleh Tim Absolute. Pilih jenis retur: <strong>RETUR SFM</strong> (dengan nomor SFM) atau <strong>RETUR MANUAL</strong>.
            </p>
          </div>

          {/* Live Clock Card */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 sm:text-right shrink-0">
            <div className="flex items-center sm:justify-end space-x-1.5 text-xs text-blue-200 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Waktu Operasional Real-time</span>
            </div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {currentLiveTime.timeString} WIB
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {currentLiveTime.dateString}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Card */}
      {savedSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-950">
                    Data Retur Toko Berhasil Disimpan!
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    lastSavedType === "SFM" ? "bg-blue-100 text-blue-900" : "bg-emerald-200 text-emerald-900"
                  }`}>
                    {lastSavedType === "SFM" ? "RETUR SFM" : "RETUR MANUAL"}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  ID Dokumen: <strong className="font-mono font-bold text-emerald-950">{lastSavedId}</strong>. Data telah masuk ke antrean <strong>Menu 2: Konfirmasi Terima Retur Toko</strong> untuk diverifikasi & dikonfirmasi oleh Operator Retur.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                + Input Retur Baru
              </button>

              <button
                type="button"
                onClick={onNavigateToConfirm}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Buka Konfirmasi Operator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Menu Jenis Retur (RETUR SFM vs RETUR MANUAL) */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pilih Jenis Retur</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500">
                Pilih metode retur yang digunakan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Pilihan 1: RETUR SFM */}
              <button
                type="button"
                onClick={() => setReturnType("SFM")}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                  returnType === "SFM"
                    ? "bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      returnType === "SFM"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">RETUR SFM</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Memiliki nomor formulir SFM dari toko
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    returnType === "SFM"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {returnType === "SFM" ? "Aktif" : "Pilih"}
                </span>
              </button>

              {/* Pilihan 2: RETUR MANUAL */}
              <button
                type="button"
                onClick={() => setReturnType("MANUAL")}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                  returnType === "MANUAL"
                    ? "bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      returnType === "MANUAL"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">RETUR MANUAL</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tanpa nomor SFM (retur manual koli biasa)
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    returnType === "MANUAL"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {returnType === "MANUAL" ? "Aktif" : "Pilih"}
                </span>
              </button>
            </div>
          </div>

          {/* Jika RETUR SFM: Tampilkan menu memasukkan Nomor SFM */}
          {returnType === "SFM" && (
            <div className="bg-blue-50/60 border border-blue-200/90 rounded-xl p-4 shadow-xs animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span>Nomor Dokumen SFM</span>
                  <span className="text-rose-500 font-bold">*</span>
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  Wajib Diisi untuk Retur SFM
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={sfmNumber}
                  onChange={(e) => setSfmNumber(e.target.value)}
                  placeholder="Masukkan nomor SFM (contoh: SFM-2026-0891 atau SFM/SLO/9021)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition-all uppercase"
                  required={returnType === "SFM"}
                  autoFocus
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                💡 Masukkan nomor formulir / surat jalan retur SFM yang tertera pada lembar dokumen fisik dari toko.
              </p>
            </div>
          )}

          {/* Jika RETUR MANUAL: Notifikasi singkat bahwa tidak perlu nomor SFM */}
          {returnType === "MANUAL" && (
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>
                  <strong>Mode Retur Manual Aktif:</strong> Tidak memerlukan nomor SFM. Anda dapat langsung menginput toko, penerima, dan koli.
                </span>
              </div>
              {onNavigateToManualReturn && (
                <button
                  type="button"
                  onClick={onNavigateToManualReturn}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                >
                  <span>Buka Menu 5 (Scan Barcode)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

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
                  setIsDropdownOpen(true);
                  if (selectedStore && selectedStore.name !== e.target.value) {
                    setSelectedStore(null);
                  }
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Cari atau ketik nama counter / toko (e.g. Matahari, Toko Cantik, Guardian...)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredStores.length > 0 ? (
                  filteredStores.map((store) => (
                    <div
                      key={store.id}
                      onClick={() => handleSelectStore(store)}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{store.name}</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {store.city} • Kode: {store.code}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        Pilih
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
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400 text-center sm:text-left">
              * Data retur {returnType === "SFM" ? "SFM" : "Manual"} langsung tercatat pada antrean verifikasi Menu 2 Operator Retur.
            </p>

            <button
              type="submit"
              className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 ${
                returnType === "SFM" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Data {returnType === "SFM" ? "Retur SFM" : "Retur Manual"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Warehouse Standard Operating Notice */}
      <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
          <span>
            Standar SOP PT ABC: Setiap retur (SFM maupun Manual) wajib melalui verifikasi fisik dan serah terima oleh Operator Retur di Menu 2.
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateToConfirm}
          className="text-blue-600 font-bold hover:underline shrink-0 ml-0 sm:ml-3 flex items-center gap-1 cursor-pointer"
        >
          <span>Ke Menu 2</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
