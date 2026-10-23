import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  ScanLine,
  CheckCircle2,
  Package,
  Store,
  Printer,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Inbox,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  CosmeticReturnItem,
  DistributionCenter,
  ScannedManualItem,
} from "../types";
import { getIndonesianLiveDateTime, formatIndonesianCurrency, formatISODateToIndonesian } from "../data/dateUtils";
import { saveManualReturnItems } from "../data/storage";
import { ReturManualForm } from "./ReturManualForm";
import { PrintReturnSlipModal } from "./PrintReturnSlipModal";

interface ManualReturnStandaloneViewProps {
  returns: CosmeticReturnItem[];
  activeDC: DistributionCenter;
  onSaveReturn: (item: CosmeticReturnItem) => void;
  onUpdateReturn?: (item: CosmeticReturnItem) => void;
  defaultStaffName: string;
  onNavigateToConfirm: () => void;
  selectedReturnId?: string | null;
  onClearSelectedReturnId?: () => void;
}

export const ManualReturnStandaloneView: React.FC<ManualReturnStandaloneViewProps> = ({
  returns,
  activeDC,
  onSaveReturn,
  onUpdateReturn,
  defaultStaffName,
  onNavigateToConfirm,
  selectedReturnId,
  onClearSelectedReturnId,
}) => {
  const [currentLiveTime, setCurrentLiveTime] = useState(getIndonesianLiveDateTime());

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(getIndonesianLiveDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter confirmed manual returns for this DC:
  // "jika retur manual yang sudah diterima dan dikonfirmasi oleh operator retur maka akan muncul di menu nomor 5"
  const confirmedManualReturns = useMemo(() => {
    return returns.filter(
      (r) =>
        r.dcLocation === activeDC &&
        r.returnMethod === "MANUAL" &&
        r.handoverStatus === "SUDAH_DITERIMA_OPERATOR"
    );
  }, [returns, activeDC]);

  // Active return being processed in Menu 5
  const [activeTargetReturn, setActiveTargetReturn] = useState<CosmeticReturnItem | null>(null);

  // Auto-select if selectedReturnId prop is provided from Menu 2 navigation
  useEffect(() => {
    if (selectedReturnId) {
      const found = returns.find((r) => r.id === selectedReturnId);
      if (found) {
        setActiveTargetReturn(found);
      }
    }
  }, [selectedReturnId, returns]);

  // Success summary modal/banner state
  const [successInfo, setSuccessInfo] = useState<{
    isOpen: boolean;
    savedId: string;
    storeName: string;
    totalItems: number;
    totalPcs: number;
    totalVal: number;
  }>({
    isOpen: false,
    savedId: "",
    storeName: "",
    totalItems: 0,
    totalPcs: 0,
    totalVal: 0,
  });

  // Print Modal State
  const [itemToPrint, setItemToPrint] = useState<CosmeticReturnItem | null>(null);

  // Search filter for confirmed returns
  const [filterSearch, setFilterSearch] = useState("");

  const filteredConfirmedReturns = useMemo(() => {
    if (!filterSearch.trim()) return confirmedManualReturns;
    const q = filterSearch.toLowerCase();
    return confirmedManualReturns.filter(
      (r) =>
        r.storeName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        (r.acceptedByOperator && r.acceptedByOperator.toLowerCase().includes(q))
    );
  }, [confirmedManualReturns, filterSearch]);

  // Handler when user saves manual return items
  const handleSaveManualItems = (
    returnId: string,
    items: ScannedManualItem[],
    isFinal: boolean,
    notes?: string
  ) => {
    const updatedList = saveManualReturnItems(
      returnId,
      items,
      defaultStaffName,
      isFinal,
      notes
    );

    const updatedItem = updatedList.find((r) => r.id === returnId);
    if (updatedItem && onUpdateReturn) {
      onUpdateReturn(updatedItem);
      setActiveTargetReturn(updatedItem);
    }
  };

  // Success callback from ReturManualForm
  const handleSuccess = (
    savedId: string,
    storeName: string,
    totalItems: number,
    totalPcs: number,
    totalVal: number
  ) => {
    setSuccessInfo({
      isOpen: true,
      savedId,
      storeName,
      totalItems,
      totalPcs,
      totalVal,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // User selects a return from the confirmed list
  const handleSelectReturnToProcess = (item: CosmeticReturnItem) => {
    setActiveTargetReturn(item);
    setSuccessInfo((prev) => ({ ...prev, isOpen: false }));
    // Smooth scroll down to the workstation
    setTimeout(() => {
      document.getElementById("manual-workstation")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 font-mono">
                <ScanLine className="w-3.5 h-3.5" />
                <span>Pemeriksaan & Hasil Retur Manual</span>
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
              <span>Menu 5: RETUR MANUAL</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Memproses retur manual yang telah diterima & dikonfirmasi oleh Operator Retur. Scan barcode produk, cek harga HET & provisi, tentukan kondisi (<strong>STOCK</strong>, <strong>BAD</strong>, <strong>NED</strong>, <strong>DEMOLISH</strong>), dan simpan daftar barang retur.
            </p>
          </div>

          {/* Live Clock Card */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 sm:text-right shrink-0">
            <div className="flex items-center sm:justify-end space-x-1.5 text-xs text-emerald-200 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Waktu Operasional Live</span>
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

      {/* Success Notification Modal / Banner */}
      {successInfo.isOpen && (
        <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-emerald-950">
                    Hasil Retur Manual Berhasil Disimpan & Selesai!
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono bg-emerald-200 text-emerald-900 uppercase">
                    TERSIMPAN
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Toko: <strong className="text-emerald-950">{successInfo.storeName}</strong> • ID Dokumen:{" "}
                  <strong className="font-mono text-emerald-950">{successInfo.savedId}</strong>
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-900 font-medium pt-1">
                  <span>
                    Jumlah Item: <strong>{successInfo.totalItems} jenis produk</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Fisik: <strong>{successInfo.totalPcs} pcs</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total Nilai: <strong>{formatIndonesianCurrency(successInfo.totalVal)}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  const savedObj = returns.find((r) => r.id === successInfo.savedId);
                  if (savedObj) setItemToPrint(savedObj);
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cetak Tanda Terima</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessInfo((prev) => ({ ...prev, isOpen: false }));
                  setActiveTargetReturn(null);
                  onClearSelectedReturnId?.();
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Proses Retur Lainnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BAGIAN 1: DAFTAR RETUR MANUAL YANG SUDAH DITERIMA & DIKONFIRMASI OPERATOR */}
      {/* "kemudian jika retur manual yang sudah diterima dan dikonfirmasi oleh operator retur */}
      {/* maka akan muncul di menu nomor 5, yang nantinya ketika di klik maka akan langsung memroses" */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Retur Manual Terkonfirmasi Operator
                </h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full font-mono">
                  {confirmedManualReturns.length} Toko
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pilih retur toko di bawah ini untuk langsung memproses dan menginput barang di Menu 5.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Cari toko / no dokumen..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTargetReturn(null);
                onClearSelectedReturnId?.();
                document.getElementById("manual-workstation")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>+ Input Baru</span>
            </button>
          </div>
        </div>

        {/* List of Confirmed Manual Returns */}
        {filteredConfirmedReturns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredConfirmedReturns.map((ret) => {
              const isSelected = activeTargetReturn?.id === ret.id;
              const hasItems = ret.manualItems && ret.manualItems.length > 0;
              const isProcessed = ret.manualProcessingStatus === "SELESAI";

              return (
                <div
                  key={ret.id}
                  onClick={() => handleSelectReturnToProcess(ret)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                    isSelected
                      ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40 shadow-xs"
                      : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80 bg-white"
                  }`}
                >
                  {/* Active Indicator Pin */}
                  {isSelected && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-extrabold font-mono tracking-wider shadow-xs">
                      SEDANG DIPROSES
                    </span>
                  )}

                  <div className="space-y-2">
                    {/* Top row: Store Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <Store className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {ret.storeName}
                        </h3>
                      </div>

                      {/* Processing Badge */}
                      {isProcessed ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono shrink-0">
                          ✓ Selesai ({ret.manualItems?.length || 0} item)
                        </span>
                      ) : hasItems ? (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono shrink-0">
                          Draf ({ret.manualItems?.length || 0} item)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold font-mono shrink-0">
                          Siap Diproses
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>No. Dokumen:</span>
                        <strong className="font-mono text-slate-800">{ret.id}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fisik Diterima:</span>
                        <strong className="text-slate-800 font-bold">{ret.colliCount || 1} Koli</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Operator Retur:</span>
                        <span className="text-slate-700 font-medium">
                          {ret.acceptedByOperator || "Operator DC"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Lokasi Rak:</span>
                        <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                          {ret.storageBin || "Rak Retur"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-[11px] font-normal text-slate-400">
                      {ret.acceptedDayFormatted?.split("-")[0] || "Terkonfirmasi"}
                    </span>

                    <span className="text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>{isSelected ? "Sedang Aktif" : "Proses Retur Ini"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              {filterSearch
                ? `Tidak ada retur terkonfirmasi yang cocok dengan "${filterSearch}"`
                : "Belum ada retur manual berstatus 'Sudah Diterima Operator'"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
              Barang retur dari Inbound (Menu 1) harus terlebih dahulu dikonfirmasi oleh Operator Retur di{" "}
              <strong>Menu 2</strong>, kemudian otomatis muncul di sini untuk proses QC dan scan barcode.
            </p>
            <div className="pt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onNavigateToConfirm}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <span>Buka Menu 2 (Konfirmasi Operator)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN 2: WORKSTATION FORM RETUR MANUAL & DAFTAR BARANG YANG SUDAH DIINPUT */}
      {/* ========================================================================= */}
      <div id="manual-workstation" className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        <ReturManualForm
          activeDC={activeDC}
          targetReturn={activeTargetReturn}
          onSaveManualItems={handleSaveManualItems}
          onSaveNewReturn={onSaveReturn}
          defaultStaffName={defaultStaffName}
          onSuccess={handleSuccess}
          onClearTargetReturn={() => {
            setActiveTargetReturn(null);
            onClearSelectedReturnId?.();
          }}
        />
      </div>

      {/* Warehouse Standard Operating Notice */}
      <div className="p-4 bg-slate-100/70 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            Standar SOP PT ABC DC {activeDC === "DC_SOLO" ? "Solo" : "Jogja"}: Setiap item retur manual tercatat lengkap dengan barcode, klasifikasi kondisi fisik, jumlah pcs, serta nilai harga HET & provisi.
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateToConfirm}
          className="text-emerald-700 font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <span>Cek Daftar di Menu 2</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Print Slip Modal */}
      {itemToPrint && (
        <PrintReturnSlipModal
          item={itemToPrint}
          isOpen={true}
          onClose={() => setItemToPrint(null)}
          onPrintDone={() => {}}
        />
      )}
    </div>
  );
};
