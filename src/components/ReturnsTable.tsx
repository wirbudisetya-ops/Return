import React, { useState } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Package,
  Layers,
  ChevronDown,
  Printer,
  ShieldAlert,
  Store,
  Truck,
  UserCheck,
  MapPin,
} from "lucide-react";
import {
  CosmeticReturnItem,
  ReturnStatus,
  ReturnDisposition,
  CosmeticCategory,
} from "../types";

interface ReturnsTableProps {
  returns: CosmeticReturnItem[];
  onSelectReturn: (item: CosmeticReturnItem) => void;
  onOpenQCInspection: (item: CosmeticReturnItem) => void;
  onOpenPrintSlip: (item: CosmeticReturnItem) => void;
  onOpenOperatorConfirm?: (item: CosmeticReturnItem) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const ReturnsTable: React.FC<ReturnsTableProps> = ({
  returns,
  onSelectReturn,
  onOpenQCInspection,
  onOpenPrintSlip,
  onOpenOperatorConfirm,
  statusFilter,
  setStatusFilter,
}) => {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [dispositionFilter, setDispositionFilter] = useState<string>("ALL");
  const [handoverFilter, setHandoverFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "value" | "priority">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = returns.filter((item) => {
    // Search query
    const q = search.toLowerCase();
    const matchesSearch =
      item.id.toLowerCase().includes(q) ||
      item.trackingNumber.toLowerCase().includes(q) ||
      item.orderId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q) ||
      (item.storeName && item.storeName.toLowerCase().includes(q)) ||
      (item.driverName && item.driverName.toLowerCase().includes(q)) ||
      (item.acceptedByOperator && item.acceptedByOperator.toLowerCase().includes(q)) ||
      (item.storageBin && item.storageBin.toLowerCase().includes(q));

    // Status filter
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "RECEIVED" &&
        (item.status === "RECEIVED" || item.status === "INSPECTING")) ||
      item.status === statusFilter;

    // Handover filter
    const matchesHandover =
      handoverFilter === "ALL" || item.handoverStatus === handoverFilter;

    // Channel filter
    const matchesChannel = channelFilter === "ALL" || item.channel === channelFilter;

    // Category filter
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

    // Disposition filter
    const matchesDisposition =
      dispositionFilter === "ALL" || item.disposition === dispositionFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesHandover &&
      matchesChannel &&
      matchesCategory &&
      matchesDisposition
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date") {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    }
    if (sortBy === "value") {
      return sortOrder === "desc" ? b.totalValue - a.totalValue : a.totalValue - b.totalValue;
    }
    if (sortBy === "priority") {
      const rank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const rankA = rank[a.priority] || 0;
      const rankB = rank[b.priority] || 0;
      return sortOrder === "desc" ? rankB - rankA : rankA - rankB;
    }
    return 0;
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case "REQUESTED":
        return (
          <span className="px-2 py-0.5 border border-black bg-slate-200 text-black text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Pengajuan
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="px-2 py-0.5 border border-black bg-[#E0F2FE] text-blue-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            In-Transit
          </span>
        );
      case "RECEIVED":
        return (
          <span className="px-2 py-0.5 border border-black bg-[#FEF08A] text-amber-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Di Gudang
          </span>
        );
      case "INSPECTING":
        return (
          <span className="px-2 py-0.5 border border-black bg-[#F3E8FF] text-purple-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Uji QC
          </span>
        );
      case "DISPOSITION_DECIDED":
        return (
          <span className="px-2 py-0.5 border border-black bg-[#FFE4E6] text-rose-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Disposisi
          </span>
        );
      case "REFUNDED_REPLACED":
        return (
          <span className="px-2 py-0.5 border border-black bg-[#E0E7FF] text-indigo-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Solusi
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 border border-black bg-[#DCFCE7] text-green-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Selesai
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-0.5 border border-black bg-red-300 text-red-950 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Ditolak
          </span>
        );
    }
  };

  const getHandoverBadge = (item: CosmeticReturnItem) => {
    if (item.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR") {
      return (
        <span className="px-2 py-0.5 border border-black bg-[#FEF08A] text-amber-950 text-[10px] font-black uppercase tracking-wider inline-flex items-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block mr-1 animate-pulse" />
          Menunggu Konfirmasi Operator
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 border border-black bg-[#DCFCE7] text-green-950 text-[10px] font-black uppercase tracking-wider inline-flex items-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
        <CheckCircle2 className="w-3 h-3 text-green-700 mr-1 stroke-[2.5]" />
        Diterima: {item.acceptedByOperator || "Operator"}
      </span>
    );
  };

  return (
    <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Search & Filters Bar */}
      <div className="p-4 sm:p-5 border-b-2 border-black space-y-3 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Toko, Driver, Penerima, Rak Bin, ID, Resi, Batch..."
              className="w-full bg-white border-2 border-black pl-10 pr-4 py-2 text-xs font-bold text-black placeholder-slate-400 focus:outline-none focus:bg-rose-50/50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Handover Status */}
            <select
              value={handoverFilter}
              onChange={(e) => setHandoverFilter(e.target.value)}
              className="bg-[#FEF08A] border-2 border-black px-2.5 py-2 text-xs font-black uppercase text-amber-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
            >
              <option value="ALL">SERAH TERIMA: SEMUA</option>
              <option value="MENUNGGU_KONFIRMASI_OPERATOR">⚠️ MENUNGGU KONFIRMASI OPERATOR</option>
              <option value="SUDAH_DITERIMA_OPERATOR">✅ SUDAH DITERIMA OPERATOR</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border-2 border-black px-2.5 py-2 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
            >
              <option value="ALL">STATUS PIPELINE</option>
              <option value="REQUESTED">Pengajuan</option>
              <option value="IN_TRANSIT">Dalam Pengiriman</option>
              <option value="RECEIVED">Tiba di Gudang</option>
              <option value="INSPECTING">Sedang Uji QC</option>
              <option value="DISPOSITION_DECIDED">Disposisi Ditetapkan</option>
              <option value="REFUNDED_REPLACED">Penyelesaian</option>
              <option value="COMPLETED">Selesai</option>
            </select>

            {/* Channel */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-white border-2 border-black px-2.5 py-2 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
            >
              <option value="ALL">SEMUA CHANNEL</option>
              <option value="Toko Offline">Toko Offline / Counter</option>
              <option value="Shopee">Shopee</option>
              <option value="Tokopedia">Tokopedia</option>
              <option value="TikTok Shop">TikTok Shop</option>
              <option value="Lazada">Lazada</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border-2 border-black px-2.5 py-2 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
            >
              <option value="ALL">SEMUA KATEGORI</option>
              <option value="SKINCARE">Skincare</option>
              <option value="MAKEUP">Makeup</option>
              <option value="BODYCARE">Bodycare</option>
              <option value="FRAGRANCE">Fragrance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-black border-collapse">
          <thead className="bg-black text-white font-black uppercase text-[10px] tracking-wider border-b-2 border-black">
            <tr>
              <th className="px-4 py-3 border-r border-slate-800">ID & Resi</th>
              <th className="px-4 py-3 border-r border-slate-800">Toko Asal & Driver</th>
              <th className="px-4 py-3 border-r border-slate-800">Serah Terima & Penerima Real-Time</th>
              <th className="px-4 py-3 border-r border-slate-800">Produk Kosmetik</th>
              <th className="px-4 py-3 border-r border-slate-800">Batch / EXP</th>
              <th className="px-4 py-3 border-r border-slate-800">Status Pipeline</th>
              <th className="px-4 py-3 border-r border-slate-800 text-right">Nilai Total</th>
              <th className="px-4 py-3 text-center">Aksi Operator</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black font-medium">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-xs font-bold uppercase">
                  Tidak ada data retur yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr
                  key={item.id}
                  id={`row-return-${item.id}`}
                  className="hover:bg-rose-50/60 transition-colors group"
                >
                  {/* ID & Resi */}
                  <td className="px-4 py-3 font-mono border-r border-slate-200">
                    <div className="font-black text-rose-600">{item.id}</div>
                    <div className="text-[11px] font-bold text-slate-800">{item.trackingNumber}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">{item.courier}</div>
                  </td>

                  {/* Toko Asal & Driver */}
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div className="font-black text-black flex items-center">
                      <Store className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
                      <span>{item.storeName || "Toko Retail"}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-bold mt-0.5 flex items-center">
                      <Truck className="w-3 h-3 mr-1 text-blue-600 shrink-0" />
                      <span>{item.driverName || "Driver"} ({item.driverVehicle || "Armada"})</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-slate-500 mt-0.5">
                      Channel: {item.channel} &bull; {item.colliCount || 1} Koli
                    </div>
                  </td>

                  {/* Serah Terima & Penerima Real-Time */}
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div className="mb-1">{getHandoverBadge(item)}</div>
                    <div className="text-[11px] text-slate-700 font-bold flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                      <span>Lokasi: {item.storageBin || "Pallet Transit Inbound"}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Inbound: {item.inboundStaffName || "Staff Dock"}
                    </div>
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3 border-r border-slate-200">
                    <div className="font-bold text-black line-clamp-1">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {item.shadeOrVariant} &bull; Qty: <strong className="text-black font-black">{item.quantity} pcs</strong>
                    </div>
                  </td>

                  {/* Batch */}
                  <td className="px-4 py-3 font-mono border-r border-slate-200">
                    <div className="flex items-center space-x-1">
                      <span
                        className={`font-black ${
                          item.isDefectBatchAlert ? "text-amber-700 bg-amber-200 px-1 border border-black" : "text-slate-800"
                        }`}
                      >
                        {item.batchNumber}
                      </span>
                      {item.isDefectBatchAlert && (
                        <span title="Batch defect alert" className="text-xs">⚠️</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">EXP: {item.expiryDate}</div>
                  </td>

                  {/* Status Pipeline */}
                  <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Total Value */}
                  <td className="px-4 py-3 text-right font-mono font-black text-black border-r border-slate-200">
                    {formatRupiah(item.totalValue)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      {item.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR" && onOpenOperatorConfirm && (
                        <button
                          onClick={() => onOpenOperatorConfirm(item)}
                          className="px-2 py-1 bg-[#FEF08A] hover:bg-yellow-300 border-2 border-black text-amber-950 text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] flex items-center"
                          title="Konfirmasi Terima Fisik Barang dari Inbound"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                          Konfirmasi Terima
                        </button>
                      )}
                      <button
                        onClick={() => onSelectReturn(item)}
                        className="p-1.5 bg-white hover:bg-black hover:text-white border-2 border-black text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        title="Buka Pelacakan & Riwayat Detail"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => onOpenQCInspection(item)}
                        className="p-1.5 bg-[#F3E8FF] hover:bg-purple-600 hover:text-white border-2 border-black text-purple-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        title="Meja Uji QC & Higienitas"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={() => onOpenPrintSlip(item)}
                        className="p-1.5 bg-[#FFE4E6] hover:bg-rose-500 hover:text-white border-2 border-black text-rose-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        title="Cetak Label Tag Retur / BAPB"
                      >
                        <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="p-3.5 border-t-2 border-black bg-white flex flex-wrap items-center justify-between text-xs text-slate-700">
        <div className="font-bold uppercase text-[11px]">
          Menampilkan <strong className="text-black">{sorted.length}</strong> dari{" "}
          <strong className="text-black">{returns.length}</strong> total retur
        </div>
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          *Real-time Store & Receiver tracking active &bull; Lumière Cikarang Hub
        </div>
      </div>
    </div>
  );
};

