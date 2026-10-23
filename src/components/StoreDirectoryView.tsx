import React, { useState, useEffect } from "react";
import {
  Store,
  Plus,
  Search,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  Clock,
  Package,
  User,
  Truck,
  X,
  Printer,
  ChevronRight,
} from "lucide-react";
import { CosmeticReturnItem, DistributionCenter, StoreDirectoryItem } from "../types";
import {
  loadStoreDirectory,
  addStoreToDirectory,
  deleteStoreFromDirectory,
} from "../data/storeDirectory";
import { formatISODateToIndonesian } from "../data/dateUtils";
import { ExcelStoreImportModal } from "./ExcelStoreImportModal";

interface StoreDirectoryViewProps {
  activeDC: DistributionCenter;
  returns: CosmeticReturnItem[];
  onSelectStoreForReturn?: (store: StoreDirectoryItem) => void;
  onOpenPrintSlip?: (item: CosmeticReturnItem) => void;
  onOpenConfirmModal?: (item: CosmeticReturnItem) => void;
}

export const StoreDirectoryView: React.FC<StoreDirectoryViewProps> = ({
  activeDC,
  returns,
  onSelectStoreForReturn,
  onOpenPrintSlip,
  onOpenConfirmModal,
}) => {
  const [stores, setStores] = useState<StoreDirectoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedStoreDetail, setSelectedStoreDetail] = useState<StoreDirectoryItem | null>(null);

  useEffect(() => {
    setStores(loadStoreDirectory(activeDC));
  }, [activeDC]);

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const newStore: StoreDirectoryItem = {
      id: `STR-${activeDC === "DC_SOLO" ? "SLO" : "JOG"}-${Date.now().toString().slice(-4)}`,
      name: newStoreName.trim(),
      code: `${newStoreName.substring(0, 3).toUpperCase()}-${String(Date.now()).slice(-3)}`,
      dcLocation: activeDC,
      city: activeDC === "DC_SOLO" ? "Surakarta" : "DIY",
    };

    const updated = addStoreToDirectory(newStore);
    setStores(updated.filter((s) => s.dcLocation === activeDC));
    setNewStoreName("");
    setIsAdding(false);
    setSuccessMessage(`Toko "${newStore.name}" berhasil ditambahkan.`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleImportSuccess = (addedCount: number) => {
    const updated = loadStoreDirectory(activeDC);
    setStores(updated);
    setSuccessMessage(`Berhasil mengimport ${addedCount} toko dari Excel.`);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleDeleteStore = (e: React.MouseEvent, storeId: string, storeName: string) => {
    e.stopPropagation();
    if (confirm(`Hapus toko "${storeName}" dari database?`)) {
      const updated = deleteStoreFromDirectory(storeId);
      setStores(updated.filter((s) => s.dcLocation === activeDC));
      if (selectedStoreDetail?.id === storeId) {
        setSelectedStoreDetail(null);
      }
    }
  };

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase())
  );

  const storeReturns = selectedStoreDetail
    ? returns.filter(
        (r) =>
          r.dcLocation === activeDC &&
          r.storeName?.toLowerCase() === selectedStoreDetail.name.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Database Master Toko Mitra
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {stores.length} toko terdaftar di {activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? "Batal" : "+ Tambah Toko"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Add New Form */}
      {isAdding && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 shadow-xs animate-in fade-in duration-150">
          <h2 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
            Tambah Toko Baru
          </h2>
          <form onSubmit={handleAddStore} className="flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              placeholder="Masukkan nama toko... Contoh: Aura Beauty Mart Solo"
              className="w-full sm:flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari toko mitra berdasarkan nama..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
          Total <strong className="text-slate-800 font-bold">{filtered.length}</strong> toko
        </div>
      </div>

      {/* Stores Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((store) => {
          const storeReturnCount = returns.filter(
            (r) =>
              r.dcLocation === activeDC &&
              r.storeName?.toLowerCase() === store.name.toLowerCase()
          ).length;

          return (
            <div
              key={store.id}
              onClick={() => setSelectedStoreDetail(store)}
              className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-mono font-medium text-slate-500">
                      {store.code}
                    </span>
                    <button
                      onClick={(e) => handleDeleteStore(e, store.id, store.name)}
                      title="Hapus toko"
                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {store.name}
                </h2>
                {store.city && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    📍 {store.city}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">
                  {storeReturnCount > 0 ? `${storeReturnCount} Riwayat Retur` : "Belum Ada Retur"}
                </span>
                <span className="text-blue-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>Detail</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Store History Modal */}
      {selectedStoreDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase">Riwayat Retur Toko</span>
                <h2 className="text-base font-bold text-slate-800">{selectedStoreDetail.name}</h2>
              </div>
              <button
                onClick={() => setSelectedStoreDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {storeReturns.length > 0 ? (
                storeReturns.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {ret.inboundDayFormatted?.split(",")[0] || formatISODateToIndonesian(ret.inboundReceivedAt)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Driver: {ret.driverName || "Mitra"} • Jumlah: {ret.colliCount || 1} Koli • Penerima: {ret.inboundStaffName}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        ret.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {ret.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR" ? "Menunggu" : "Diterima"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada catatan riwayat retur untuk toko ini.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedStoreDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {isExcelModalOpen && (
        <ExcelStoreImportModal
          activeDC={activeDC}
          onClose={() => setIsExcelModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};
