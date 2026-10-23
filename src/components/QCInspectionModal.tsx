import React, { useState } from "react";
import {
  ShieldCheck,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  RotateCcw,
  Sparkles,
  PackageCheck,
  FileCheck,
  Camera,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  CosmeticReturnItem,
  HygieneChecklist,
  ReturnDisposition,
  ResolutionType,
} from "../types";

interface QCInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CosmeticReturnItem | null;
  onSaveInspection: (updatedItem: CosmeticReturnItem) => void;
  operatorName: string;
}

export const QCInspectionModal: React.FC<QCInspectionModalProps> = ({
  isOpen,
  onClose,
  item,
  onSaveInspection,
  operatorName,
}) => {
  if (!isOpen || !item) return null;

  const [checklist, setChecklist] = useState<HygieneChecklist>(
    item.hygieneChecklist || {
      sealIntact: false,
      noSwatchOrFingerprints: true,
      pumpDropperSterile: true,
      batchAndExpMatch: true,
      noLeakageOrCracks: true,
      smellAndTextureNormal: true,
    }
  );

  const [disposition, setDisposition] = useState<ReturnDisposition>(
    item.disposition || "QC_HOLD"
  );
  const [resolution, setResolution] = useState<ResolutionType>(
    item.resolution || "REPLACE_NEW"
  );
  const [notes, setNotes] = useState(item.operatorNotes || "");

  // Calculate score based on checklist
  const calculateScore = (cl: HygieneChecklist) => {
    let score = 0;
    if (cl.sealIntact) score += 30;
    if (cl.noSwatchOrFingerprints) score += 20;
    if (cl.pumpDropperSterile) score += 15;
    if (cl.batchAndExpMatch) score += 15;
    if (cl.noLeakageOrCracks) score += 10;
    if (cl.smellAndTextureNormal) score += 10;
    return score;
  };

  const currentScore = calculateScore(checklist);

  const handleToggle = (key: keyof HygieneChecklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);

    // Auto-suggest disposition based on checklist
    const newScore = calculateScore(updated);
    if (newScore >= 90) {
      setDisposition("RESTOCK");
      setResolution("EXCHANGE_VARIANT");
    } else if (!updated.noLeakageOrCracks || !updated.smellAndTextureNormal) {
      setDisposition("DISPOSAL");
      setResolution("REPLACE_NEW");
    } else if (!updated.sealIntact && updated.noSwatchOrFingerprints) {
      setDisposition("REWORK");
      setResolution("REPLACE_NEW");
    } else if (!updated.batchAndExpMatch) {
      setDisposition("VENDOR_RETURN");
      setResolution("REFUND_100");
    } else {
      setDisposition("QC_HOLD");
    }
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const updatedItem: CosmeticReturnItem = {
      ...item,
      status: "DISPOSITION_DECIDED",
      hygieneChecklist: checklist,
      hygieneScore: currentScore,
      disposition,
      resolution,
      operatorNotes: notes,
      inspectedBy: operatorName,
      inspectedAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          status: "DISPOSITION_DECIDED",
          title: `Inspeksi QC Selesai: Disposisi ${disposition}`,
          description: `Skor Higienitas: ${currentScore}/100. Solusi: ${resolution.replace(
            "_",
            " "
          )}. Catatan: ${notes || "Pemeriksaan fisik sesuai standar CPKB."}`,
          operatorName,
          location: "Ruang QC Retur Cikarang",
        },
        ...item.timeline,
      ],
    };

    onSaveInspection(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#F7F7F7] border-2 border-black w-full max-w-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 border-2 border-black bg-[#F3E8FF] text-purple-950 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-black uppercase tracking-wider">
                Meja Inspeksi QC & Uji Higienitas Kosmetik
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Verifikasi kondisi fisik paket {item.id} &bull; {item.productName}
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
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Summary Banner */}
          <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-600 font-bold uppercase text-[10px] block">Produk & Varian:</span>
              <strong className="text-black font-black text-sm">{item.productName}</strong>
              <span className="text-slate-600 font-medium ml-1">({item.shadeOrVariant})</span>
            </div>
            <div>
              <span className="text-slate-600 font-bold uppercase text-[10px] block">Batch Produksi:</span>
              <strong className="text-black font-mono font-black">{item.batchNumber}</strong>
            </div>
            <div>
              <span className="text-slate-600 font-bold uppercase text-[10px] block">Skor Higienitas Terhitung:</span>
              <span
                className={`inline-block px-3 py-1 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  currentScore >= 80
                    ? "bg-[#DCFCE7] text-green-950"
                    : currentScore >= 50
                    ? "bg-[#FEF08A] text-amber-950"
                    : "bg-[#FFE4E6] text-rose-950"
                }`}
              >
                {currentScore} / 100 ({currentScore >= 80 ? "Layak Restock" : currentScore >= 50 ? "Perlu Rework/Karantina" : "Limbah Rusak"})
              </span>
            </div>
          </div>

          {/* 6-Point Cosmetic Hygiene Checklist */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-3">
              1. Checklist Standar Higienitas & Fisik Kosmetik (CPKB):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  key: "sealIntact" as const,
                  label: "Segel Shrink / Hologram Masih Utuh",
                  desc: "Plastik pelindung belum dibuka sama sekali oleh customer.",
                  weight: "+30 Poin",
                },
                {
                  key: "noSwatchOrFingerprints" as const,
                  label: "Steril (Tanpa Bekas Swatch / Colek)",
                  desc: "Formula belum pernah tersentuh jari atau aplikator luar.",
                  weight: "+20 Poin",
                },
                {
                  key: "pumpDropperSterile" as const,
                  label: "Pipet / Nozzle / Pump Steril & Kering",
                  desc: "Jalur keluaran cairan belum terisi residu formula luar.",
                  weight: "+15 Poin",
                },
                {
                  key: "batchAndExpMatch" as const,
                  label: "Batch & Tanggal EXP Sesuai Faktur",
                  desc: "Nomor batch pada botol identik dengan data faktur pesanan.",
                  weight: "+15 Poin",
                },
                {
                  key: "noLeakageOrCracks" as const,
                  label: "Tidak Ada Kebocoran / Kaca Retak",
                  desc: "Wadah primer kedap udara dan bebas retakan mikroskopis.",
                  weight: "+10 Poin",
                },
                {
                  key: "smellAndTextureNormal" as const,
                  label: "Aroma, Warna & Tekstur Normal",
                  desc: "Bebas dari oksidasi, bau tengik/asam, atau emulsi pecah.",
                  weight: "+10 Poin",
                },
              ].map((check) => {
                const checked = checklist[check.key];
                return (
                  <div
                    key={check.key}
                    onClick={() => handleToggle(check.key)}
                    className={`p-3 border-2 border-black cursor-pointer transition-all flex items-start space-x-3 text-xs ${
                      checked
                        ? "bg-[#DCFCE7] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white text-slate-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 text-black focus:ring-black border-2 border-black"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-black">{check.label}</span>
                        <span className="text-[10px] text-black font-mono font-black">
                          {check.weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{check.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Disposition Selection */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-2">
              2. Tetapkan Keputusan Disposisi Barang Fisik:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              {[
                {
                  id: "RESTOCK" as ReturnDisposition,
                  label: "🟢 Restock",
                  desc: "Grade A Siap Jual",
                },
                {
                  id: "QC_HOLD" as ReturnDisposition,
                  label: "🟡 Karantina QC",
                  desc: "Uji Retensi Lab",
                },
                {
                  id: "REWORK" as ReturnDisposition,
                  label: "🔵 Rework Dus",
                  desc: "Ganti Box Luar",
                },
                {
                  id: "DISPOSAL" as ReturnDisposition,
                  label: "🔴 Musnah Limbah",
                  desc: "Limbah B3 Rusak",
                },
                {
                  id: "VENDOR_RETURN" as ReturnDisposition,
                  label: "🟣 Retur Pabrik",
                  desc: "Klaim ke Vendor",
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDisposition(opt.id)}
                  className={`p-3 border-2 border-black text-center transition-all ${
                    disposition === opt.id
                      ? "bg-rose-500 text-white font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                      : "bg-white text-black hover:bg-slate-50 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  <div className="font-black text-xs uppercase">{opt.label}</div>
                  <div className="text-[10px] mt-0.5 font-bold uppercase">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Customer Resolution */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-2">
              3. Tindakan Penyelesaian untuk Customer:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: "REFUND_100" as ResolutionType, label: "Refund Dana Penuh (100%)" },
                { id: "EXCHANGE_VARIANT" as ResolutionType, label: "Tukar Shade / Varian Sesuai" },
                { id: "REPLACE_NEW" as ResolutionType, label: "Kirim Unit Baru Bebas Ongkir" },
                { id: "REJECT_RETURN" as ResolutionType, label: "Tolak Retur (Fraud/Rusak)" },
              ].map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setResolution(res.id)}
                  className={`p-2.5 border-2 border-black text-center transition-all ${
                    resolution === res.id
                      ? "bg-[#DCFCE7] text-black font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      : "bg-white text-black hover:bg-slate-50 font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operator Inspection Note */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-1">
              Catatan Khusus Operator QC:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kondisi segel foil terbuka 50%, botol kaca tidak pecah, cairan sudah mulai menguning. Disetujui pemusnahan limbah..."
              className="w-full bg-white border-2 border-black p-3 text-xs font-bold text-black placeholder-slate-400 focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-black">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border-2 border-black bg-white hover:bg-slate-100 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Batal
            </button>
            <button
              id="btn-save-qc-inspection"
              onClick={handleSave}
              className="px-5 py-2.5 border-2 border-black bg-[#DCFCE7] hover:bg-green-300 text-green-950 text-xs font-black uppercase tracking-wider flex items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Simpan Hasil QC & Disposisi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
