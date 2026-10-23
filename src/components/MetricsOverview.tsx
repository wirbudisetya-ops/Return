import React from "react";
import {
  PackageCheck,
  Truck,
  RotateCcw,
  ShieldAlert,
  Flame,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { CosmeticReturnItem, ReturnStatus } from "../types";

interface MetricsOverviewProps {
  returns: CosmeticReturnItem[];
  selectedStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  returns,
  selectedStatusFilter,
  onSelectStatusFilter,
}) => {
  const total = returns.length;
  const pendingHandover = returns.filter(
    (r) => r.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR"
  ).length;
  const inTransit = returns.filter((r) => r.status === "IN_TRANSIT").length;
  const needsInspection = returns.filter(
    (r) => (r.status === "RECEIVED" || r.status === "INSPECTING") && r.handoverStatus === "SUDAH_DITERIMA_OPERATOR"
  ).length;
  const restocked = returns.filter((r) => r.disposition === "RESTOCK").length;
  const completed = returns.filter((r) => r.status === "COMPLETED").length;

  const totalRefundAmount = returns.reduce((acc, curr) => {
    return acc + (curr.refundAmount || (curr.resolution === "REFUND_100" ? curr.totalValue : 0));
  }, 0);

  const totalValueAtRisk = returns.reduce((acc, curr) => acc + curr.totalValue, 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const statCards = [
    {
      id: "all",
      label: "Total Retur Masuk",
      count: total,
      sublabel: `Total Valuasi: ${formatRupiah(totalValueAtRisk)}`,
      icon: RotateCcw,
      bg: "bg-white",
      hoverBg: "hover:bg-slate-50",
      accentTag: "Semua Channel",
    },
    {
      id: "PENDING_HANDOVER",
      label: "Antrean Serah Terima Inbound",
      count: pendingHandover,
      sublabel: "Fisik tiba di Dock, butuh konfirmasi",
      icon: UserCheck,
      bg: "bg-[#FEF08A]", // Bright Amber/Yellow
      hoverBg: "hover:bg-yellow-300",
      accentTag: pendingHandover > 0 ? "⚠️ Konfirmasi Segera" : "Lengkap",
    },
    {
      id: "IN_TRANSIT",
      label: "Sedang Dibawa Driver",
      count: inTransit,
      sublabel: "Armada & kurir menuju hub",
      icon: Truck,
      bg: "bg-[#E0F2FE]", // Soft blue
      hoverBg: "hover:bg-sky-200",
      accentTag: "In-Transit",
    },
    {
      id: "RECEIVED_INSPECTING",
      label: "Antrean Uji QC & Higienitas",
      count: needsInspection,
      sublabel: "Segel, Swatch & Kebocoran",
      icon: ShieldAlert,
      bg: "bg-[#F3E8FF]", // Purple
      hoverBg: "hover:bg-purple-200",
      accentTag: "Meja QC",
    },
    {
      id: "RESTOCK",
      label: "Lolos Restock (Grade A)",
      count: restocked,
      sublabel: "Segel utuh & siap jual lagi",
      icon: PackageCheck,
      bg: "bg-[#FFE4E6]", // Rose pink
      hoverBg: "hover:bg-rose-200",
      accentTag: "Kondisi Steril",
    },
    {
      id: "COMPLETED",
      label: "Retur Selesai & Refund",
      count: completed,
      sublabel: `Tuntas: ${formatRupiah(totalRefundAmount)}`,
      icon: CheckCircle2,
      bg: "bg-[#DCFCE7]", // Green
      hoverBg: "hover:bg-green-200",
      accentTag: "Closed Cases",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {statCards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.id === "all" && selectedStatusFilter === "ALL") ||
          (card.id === "IN_TRANSIT" && selectedStatusFilter === "IN_TRANSIT") ||
          (card.id === "RECEIVED_INSPECTING" &&
            (selectedStatusFilter === "RECEIVED" || selectedStatusFilter === "INSPECTING")) ||
          (card.id === "COMPLETED" && selectedStatusFilter === "COMPLETED");

        return (
          <div
            key={card.id}
            id={`metric-card-${card.id}`}
            onClick={() => {
              if (card.id === "all") onSelectStatusFilter("ALL");
              else if (card.id === "PENDING_HANDOVER") onSelectStatusFilter("RECEIVED");
              else if (card.id === "IN_TRANSIT") onSelectStatusFilter("IN_TRANSIT");
              else if (card.id === "RECEIVED_INSPECTING") onSelectStatusFilter("RECEIVED");
              else if (card.id === "COMPLETED") onSelectStatusFilter("COMPLETED");
            }}
            className={`p-4 border-2 border-black ${card.bg} ${card.hoverBg} text-black cursor-pointer transition-all duration-150 relative flex flex-col justify-between ${
              isSelected
                ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1 ring-2 ring-black"
                : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 line-clamp-1">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-black stroke-[2.5] shrink-0" />
              </div>

              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-3xl font-black text-black tracking-tight">{card.count}</span>
                <span className="text-[11px] text-slate-700 font-bold uppercase">Item</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-black/20 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-600 truncate font-mono">
                {card.sublabel}
              </span>
              <span className="self-start text-[9px] font-black uppercase px-1.5 py-0.2 border border-black bg-white/70">
                {card.accentTag}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

