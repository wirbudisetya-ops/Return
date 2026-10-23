import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Loader2,
  FileText,
  ShieldAlert,
  Download,
} from "lucide-react";
import { CosmeticReturnItem } from "../types";

interface BatchDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  returns: CosmeticReturnItem[];
}

export const BatchDefectModal: React.FC<BatchDefectModalProps> = ({
  isOpen,
  onClose,
  returns,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  if (!isOpen) return null;

  // Group returns by batch
  const batchMap: Record<string, CosmeticReturnItem[]> = {};
  returns.forEach((r) => {
    if (!batchMap[r.batchNumber]) batchMap[r.batchNumber] = [];
    batchMap[r.batchNumber].push(r);
  });

  const batchStats = Object.keys(batchMap).map((batchNumber) => {
    const list = batchMap[batchNumber];
    const products = Array.from(new Set(list.map((i) => i.productName)));
    const reasons = list.map((i) => i.returnReason);
    const count = list.length;
    const isCritical = count >= 2;

    return {
      batchNumber,
      count,
      products,
      reasons,
      isCritical,
      totalLoss: list.reduce((acc, curr) => acc + curr.totalValue, 0),
    };
  });

  const handleRunAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-batch-defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnsData: returns.map((r) => ({
            id: r.id,
            batchNumber: r.batchNumber,
            productName: r.productName,
            shadeOrVariant: r.shadeOrVariant,
            returnReason: r.returnReason,
            customerNotes: r.customerNotes,
            disposition: r.disposition,
          })),
        }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setAnalysisResult(json.data);
      }
    } catch (e) {
      console.error("Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#F7F7F7] border-2 border-black w-full max-w-4xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black overflow-hidden my-4">
        {/* Header */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 border-2 border-black bg-amber-400 text-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-black uppercase tracking-wider flex items-center">
                Analisis Kualitas Batch Kosmetik & Deteksi Anomali AI
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Peringatan dini cacat produksi massal, kebocoran packaging, atau degradasi formula.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] bg-[#F7F7F7]">
          {/* Top Batch Alert Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Total Batch Terekam</span>
              <div className="text-2xl font-black text-black font-mono mt-1">
                {batchStats.length} Batch
              </div>
            </div>
            <div className="p-4 bg-[#FEF3C7] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider">Batch Berisiko Anomali Tinggi</span>
              <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                {batchStats.filter((b) => b.isCritical).length} Batch
              </div>
            </div>
            <div className="p-4 bg-[#FFE4E6] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[10px] font-black uppercase text-rose-950 tracking-wider">Nilai Retur Berpotensi Recall</span>
              <div className="text-2xl font-black text-rose-950 font-mono mt-1">
                {formatRupiah(
                  batchStats
                    .filter((b) => b.isCritical)
                    .reduce((a, b) => a + b.totalLoss, 0)
                )}
              </div>
            </div>
          </div>

          {/* Batch Distribution Table */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-2">
              Daftar Batch Produksi Terindikasi Retur:
            </label>
            <div className="overflow-x-auto border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left text-xs text-black">
                <thead className="bg-slate-100 text-black uppercase text-[10px] font-black border-b-2 border-black">
                  <tr>
                    <th className="px-3.5 py-2.5">No. Batch</th>
                    <th className="px-3.5 py-2.5">Produk Terkait</th>
                    <th className="px-3.5 py-2.5">Frekuensi Retur</th>
                    <th className="px-3.5 py-2.5">Alasan Dominan</th>
                    <th className="px-3.5 py-2.5">Status Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/20 font-bold">
                  {batchStats.map((batch) => (
                    <tr key={batch.batchNumber} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2.5 font-mono font-black text-black">
                        {batch.batchNumber}
                      </td>
                      <td className="px-3.5 py-2.5">{batch.products.join(", ")}</td>
                      <td className="px-3.5 py-2.5 font-mono font-black">
                        {batch.count} pcs
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-700">
                        {batch.reasons.slice(0, 2).join(" / ")}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {batch.isCritical ? (
                          <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-[#FFE4E6] text-rose-950 flex items-center w-fit shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            <AlertTriangle className="w-3 h-3 mr-1 stroke-[2.5]" /> Kritis (Investigasi)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-[#DCFCE7] text-green-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Trigger Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center">
                <Sparkles className="w-4 h-4 text-amber-500 mr-1.5 stroke-[2.5]" />
                Jalankan Audit AI & Rekomendasi Corrective Action (CAPA)
              </h4>
              <p className="text-[11px] text-slate-600 font-bold">
                Gemini akan menganalisis tren kerusakan untuk tim Produksi, QC Maklon, dan Formulasi.
              </p>
            </div>
            <button
              id="btn-run-ai-batch-audit"
              disabled={isAnalyzing}
              onClick={handleRunAIAnalysis}
              className="px-5 py-2.5 border-2 border-black bg-amber-400 hover:bg-amber-500 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menganalisis Pola Cacat...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                  Audit Sekarang
                </>
              )}
            </button>
          </div>

          {/* AI Result Card */}
          {analysisResult && (
            <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 text-xs">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                  <span className="font-black text-black text-sm uppercase tracking-wider">
                    Hasil Laporan Kualitas Batch (CPKB Audit)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 border border-black text-[10px] font-black uppercase bg-[#FEF3C7] text-amber-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  Tingkat Keparahan: {analysisResult.severityLevel || "Perhatian Khusus"}
                </span>
              </div>

              <div>
                <strong className="text-black font-black uppercase text-[10px] block mb-1">Ringkasan Temuan:</strong>
                <p className="text-slate-800 font-bold leading-relaxed bg-[#F7F7F7] p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {analysisResult.summary}
                </p>
              </div>

              <div>
                <strong className="text-black font-black uppercase text-[10px] block mb-1">Dugaan Akar Masalah (Root Cause):</strong>
                <p className="text-amber-950 font-mono font-bold leading-relaxed bg-amber-50 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {analysisResult.suspectedRootCause}
                </p>
              </div>

              <div>
                <strong className="text-black font-black uppercase text-[10px] block mb-1">
                  Rekomendasi Tindakan Perbaikan untuk Pabrik & Gudang:
                </strong>
                <ul className="space-y-1.5 list-disc pl-5 text-slate-800 font-bold">
                  {analysisResult.recommendations?.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
