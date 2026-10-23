import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  Download,
  FileSpreadsheet,
  Plus,
  Eye,
  Printer,
  CheckCircle2,
  XCircle,
  Building2,
  Filter,
  Package,
  Clock,
  User,
  Truck,
  HelpCircle,
  ChevronRight,
  ScanLine,
} from "lucide-react";
import { CosmeticReturnItem, DistributionCenter } from "../types";
import { formatIndonesianCurrency, formatISODateToIndonesian } from "../data/dateUtils";

interface DriverReturnsConfirmViewProps {
  returns: CosmeticReturnItem[];
  activeDC: DistributionCenter;
  onOpenConfirmModal: (item: CosmeticReturnItem) => void;
  onOpenPrintSlip: (item: CosmeticReturnItem) => void;
  onExportCSV: () => void;
  onNavigateToInput: () => void;
  onProcessManualReturn?: (item: CosmeticReturnItem) => void;
}

export const DriverReturnsConfirmView: React.FC<DriverReturnsConfirmViewProps> = ({
  returns,
  activeDC,
  onOpenConfirmModal,
  onOpenPrintSlip,
  onExportCSV,
  onNavigateToInput,
  onProcessManualReturn,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "CONFIRMED" | "ANONYMOUS">("ALL");

  const dcReturns = useMemo(() => {
    return returns.filter((r) => r.dcLocation === activeDC);
  }, [returns, activeDC]);

  const filteredList = useMemo(() => {
    return dcReturns.filter((item) => {
      // Status filter
      if (statusFilter === "PENDING" && item.handoverStatus !== "MENUNGGU_KONFIRMASI_OPERATOR") return false;
      if (statusFilter === "CONFIRMED" && item.handoverStatus !== "SUDAH_DITERIMA_OPERATOR") return false;
      if (statusFilter === "ANONYMOUS" && !item.isAnonymousStore) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.storeName?.toLowerCase().includes(q) ||
          item.driverName?.toLowerCase().includes(q) ||
          item.inboundStaffName?.toLowerCase().includes(q) ||
          item.orderId?.toLowerCase().includes(q) ||
          item.id?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dcReturns, statusFilter, searchTerm]);

  const pendingCount = dcReturns.filter((r) => r.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR").length;
  const confirmedCount = dcReturns.filter((r) => r.handoverStatus === "SUDAH_DITERIMA_OPERATOR").length;
  const anonCount = dcReturns.filter((r) => r.isAnonymousStore).length;

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Data Retur Penjualan & Konfirmasi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar paket retur dari toko mitra & driver di {activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onNavigateToInput}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Retur Baru</span>
          </button>

          <button
            onClick={onExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Chips Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
            statusFilter === "ALL"
              ? "bg-blue-600 border-blue-600 text-white shadow-xs font-bold"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="text-[10px] uppercase block opacity-80 font-medium">Total Retur</span>
          <span className="text-lg font-bold font-mono">{dcReturns.length} Item</span>
        </button>

        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
            statusFilter === "PENDING"
              ? "bg-amber-500 border-amber-500 text-white shadow-xs font-bold"
              : "bg-amber-50/50 border-amber-200 text-amber-900 hover:bg-amber-50"
          }`}
        >
          <span className="text-[10px] uppercase block font-semibold opacity-90">Antrean Konfirmasi</span>
          <span className="text-lg font-bold font-mono">{pendingCount} Antre</span>
        </button>

        <button
          onClick={() => setStatusFilter("CONFIRMED")}
          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
            statusFilter === "CONFIRMED"
              ? "bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold"
              : "bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-50"
          }`}
        >
          <span className="text-[10px] uppercase block font-semibold opacity-90">Sudah Selesai</span>
          <span className="text-lg font-bold font-mono">{confirmedCount} Selesai</span>
        </button>

        <button
          onClick={() => setStatusFilter("ANONYMOUS")}
          className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
            statusFilter === "ANONYMOUS"
              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold"
              : "bg-indigo-50/50 border-indigo-200 text-indigo-900 hover:bg-indigo-50"
          }`}
        >
          <span className="text-[10px] uppercase block font-semibold opacity-90">Tanpa Nama Toko</span>
          <span className="text-lg font-bold font-mono">{anonCount} Item</span>
        </button>
      </div>

      {/* 3. Search Bar Filter Container */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama toko, driver, tim absolute, nomor surat jalan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
          Menampilkan <strong className="text-slate-800 font-bold">{filteredList.length}</strong> data
        </div>
      </div>

      {/* 4. Modern Clean Data Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4 w-36">Waktu Masuk</th>
                <th className="py-3 px-4">Toko & No. Dokumen</th>
                <th className="py-3 px-4">Driver & Koli</th>
                <th className="py-3 px-4">Penerima Inbound</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length > 0 ? (
                filteredList.map((item, idx) => {
                  const isPending = item.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR";

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* No. */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Waktu Masuk */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.inboundDayFormatted?.split(",")[0] || formatISODateToIndonesian(item.inboundReceivedAt)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {item.id}
                        </div>
                      </td>

                      {/* Toko & Dokumen */}
                      <td className="py-3.5 px-4">
                        {item.isAnonymousStore ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-md inline-block">
                            TANPA KETERANGAN NAMA TOKO
                          </span>
                        ) : (
                          <div className="font-bold text-slate-900 text-xs">
                            {item.storeName}
                          </div>
                        )}

                        {/* Metode Retur & Info Dokumen */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {item.returnMethod === "SFM" || item.sfmNumber ? (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold font-mono rounded">
                              SFM: {item.sfmNumber || item.orderId}
                            </span>
                          ) : item.returnMethod === "MANUAL" || item.itemCondition ? (
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                RETUR MANUAL
                              </span>
                              {item.itemCondition && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                                    item.itemCondition === "STOCK"
                                      ? "bg-emerald-100 text-emerald-900"
                                      : item.itemCondition === "BAD"
                                      ? "bg-rose-100 text-rose-900"
                                      : item.itemCondition === "NED"
                                      ? "bg-amber-100 text-amber-900"
                                      : "bg-purple-100 text-purple-900"
                                  }`}
                                >
                                  {item.itemCondition}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              SJ: {item.orderId || "-"}
                            </span>
                          )}
                        </div>

                        {/* Nama Produk jika Retur Manual */}
                        {item.returnMethod === "MANUAL" && item.productName && (
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-xs mt-0.5">
                            {item.productName}
                          </div>
                        )}
                      </td>

                      {/* Driver & Koli / Qty */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {item.driverName || "Driver Mitra"}
                        </div>
                        {item.returnMethod === "MANUAL" ? (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] rounded-md font-mono">
                            {item.quantity || 1} Pcs
                          </span>
                        ) : (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-md font-mono">
                            {item.colliCount || 1} Koli
                          </span>
                        )}
                      </td>

                      {/* Penerima Inbound */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {item.inboundStaffName || "Tim Absolute"}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Inbound Dock
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-semibold text-[10px] rounded-full inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            <span>Menunggu Operator</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Diterima Operator</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isPending ? (
                            <button
                              onClick={() => onOpenConfirmModal(item)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                            >
                              Konfirmasi
                            </button>
                          ) : (
                            <>
                              {item.returnMethod === "MANUAL" && onProcessManualReturn && (
                                <button
                                  onClick={() => onProcessManualReturn(item)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                  title="Proses & Scan Barang di Menu 5"
                                >
                                  <ScanLine className="w-3 h-3" />
                                  <span>Proses Menu 5</span>
                                </button>
                              )}
                              <button
                                onClick={() => onOpenPrintSlip(item)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Cetak</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada data retur yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
