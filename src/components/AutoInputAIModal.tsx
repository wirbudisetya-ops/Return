import React, { useState } from "react";
import {
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  Layers,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Tag,
  DollarSign,
  Package,
} from "lucide-react";
import { CosmeticReturnItem, ReturnStatus } from "../types";
import { COSMETIC_PRODUCTS_CATALOG } from "../data/mockReturns";

interface AutoInputAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReturn: (item: CosmeticReturnItem) => void;
  operatorName: string;
}

export const AutoInputAIModal: React.FC<AutoInputAIModalProps> = ({
  isOpen,
  onClose,
  onSaveReturn,
  operatorName,
}) => {
  const [inputText, setInputText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const samplePresets = [
    {
      title: "💬 Chat Shopee: Lip Tint Pecah & Bocor",
      text: `Dari: Salsabila Nur (081299334411) - Bandung
Pesanan Shopee: SHOPEE-2026-891024
No. Resi Pengembalian: SPXID0981772635 (Shopee Xpress)
Produk: Airy Velvet Matte Lip Tint - Shade 04 Terracotta Muse
Jumlah: 2 pcs
Keluhan: Tutup lip tint retak dan cairannya meluber ke seluruh isi pouch make up. Saya minta ganti unit baru shade yang sama.
Batch tertera di box: B240801 | EXP: 2027-10-01`,
    },
    {
      title: "📦 Chat Tokopedia: Niacinamide Serum Salah Shade/Varian",
      text: `Nama Pembeli: Kevin Pratama (085611223344) - Surabaya
No Invoice: INV/20260820/TKP/99281741
Resi Retur: TKP09823417721 (J&T Express)
Produk yang diretur: Luminous Glow Niacinamide 10% Serum 30ml
Jumlah: 1 pcs (Harga Rp 139.000)
Alasan: Salah pesan varian. Produk masih tersegel plastik utuh, sama sekali belum dibuka atau di-swatch. Ingin tukar dengan yang 50ml Jumbo.
Batch: B240718`,
    },
    {
      title: "⚠️ WhatsApp Toko: Cushion Cermin Pecah & Tekstur Kering",
      text: `Customer Counter GI: Ibu Maya Lestari (08119876543)
No Nota: STORE-GI-2026-0044
Kurir: Dikirim Kurir Internal Toko
Barang: Flawless Radiant Serum Cushion SPF 35 - Shade 02 Natural Beige
Keluhan: Saat dibuka di rumah, cermin di dalam compact cushion retak seribu. Busa cushion juga agak mengering.
Batch: B240801`,
    },
    {
      title: "🛑 Retur TikTok Shop: Alergi & Gatal Kulit",
      text: `Pembeli: Amanda Zahra (087812345678) - Semarang
Order ID: TT-20260819-9948123
Resi J&T: JX8829104821
Produk: Barrier Relief Ceramide Moisturizer Gel 50g
Qty: 1 pcs
Alasan: Customer mengalami ruam merah setelah 1x pemakaian tipis. Minta pengembalian dana 100%.
Batch: B240801`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleParseWithAI = async () => {
    if (!inputText.trim() && !imagePreview) {
      setErrorMessage("Silakan masukkan teks keluhan / resi atau unggah foto dokumen retur.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/parse-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          imageBase64: imagePreview,
        }),
      });

      const json = await response.json();
      if (json.success && json.data) {
        setParsedData(json.data);
      } else {
        setErrorMessage("Gagal mengekstrak data retur. Silakan coba lagi.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Terjadi kesalahan komunikasi dengan server AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToReturns = () => {
    if (!parsedData) return;

    const newId = `RET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const isRestock = parsedData.suggestedDisposition?.toLowerCase().includes("restock");
    const isDisposal = parsedData.suggestedDisposition?.toLowerCase().includes("pemusnahan");
    const isQc = parsedData.suggestedDisposition?.toLowerCase().includes("karantina");
    const isRework = parsedData.suggestedDisposition?.toLowerCase().includes("rework");
    const isVendor = parsedData.suggestedDisposition?.toLowerCase().includes("pabrik") || parsedData.suggestedDisposition?.toLowerCase().includes("vendor");

    let disposition: any = "QC_HOLD";
    if (isRestock) disposition = "RESTOCK";
    else if (isDisposal) disposition = "DISPOSAL";
    else if (isQc) disposition = "QC_HOLD";
    else if (isRework) disposition = "REWORK";
    else if (isVendor) disposition = "VENDOR_RETURN";

    let resolution: any = "REPLACE_NEW";
    if (parsedData.recommendedSolution?.toLowerCase().includes("refund")) resolution = "REFUND_100";
    else if (parsedData.recommendedSolution?.toLowerCase().includes("tukar")) resolution = "EXCHANGE_VARIANT";
    else if (parsedData.recommendedSolution?.toLowerCase().includes("tolak")) resolution = "REJECT_RETURN";

    let category: any = "SKINCARE";
    if (/lip|cushion|foundation|mascara|powder|blush/i.test(parsedData.productName)) category = "MAKEUP";
    else if (/lotion|body wash/i.test(parsedData.productName)) category = "BODYCARE";
    else if (/hair/i.test(parsedData.productName)) category = "HAIRCARE";
    else if (/perfume|eau/i.test(parsedData.productName)) category = "FRAGRANCE";

    const unitPrice = parsedData.pricePerUnit || 125000;
    const quantity = parsedData.quantity || 1;
    const totalValue = unitPrice * quantity;

    const newItem: CosmeticReturnItem = {
      id: newId,
      dcLocation: "DC_SOLO",
      orderId: parsedData.orderId || `ORD-${Date.now().toString().slice(-6)}`,
      trackingNumber: parsedData.trackingNumber || `SPXID${Date.now().toString().slice(-9)}`,
      courier: parsedData.courier || "J&T Express",
      channel: (parsedData.channel as any) || "Shopee",
      storeName: parsedData.channel === "Toko Offline" ? (parsedData.customerName || "Toko Retail Mitra") : `Online (${parsedData.channel || "Official Store"})`,
      driverName: "Ekspedisi / Kurir Reguler",
      driverVehicle: "-",
      inboundStaffName: operatorName,
      inboundReceivedAt: now,
      inboundNotes: "Input langsung dari modul AI Portal.",
      colliCount: 1,
      handoverStatus: "SUDAH_DITERIMA_OPERATOR",
      acceptedByOperator: operatorName,
      acceptedAt: now,
      storageBin: "Rak A-01 (Meja Verifikasi Operator)",
      customerName: parsedData.customerName || "Customer",
      customerPhone: parsedData.customerPhone || "0812XXXXXXXX",
      customerCity: "Kota Pelanggan",
      productName: parsedData.productName || "Produk Kosmetik",
      category,
      shadeOrVariant: parsedData.shadeOrVariant || "Standard",
      sku: parsedData.sku || "CSM-SKU-AUTO",
      quantity,
      unitPrice,
      totalValue,
      batchNumber: parsedData.batchNumber || "B240801",
      expiryDate: parsedData.expiryDate || "2027-12-31",
      returnReason: parsedData.returnReason || "Klaim Retur Pelanggan",

      customerNotes: parsedData.customerNotes || inputText,
      evidencePhotos: imagePreview
        ? [imagePreview]
        : ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"],
      status: "REQUESTED",
      priority: parsedData.hygieneRisk === "Tinggi" ? "HIGH" : "MEDIUM",
      disposition,
      resolution,
      refundAmount: resolution === "REFUND_100" ? totalValue : 0,
      hygieneScore: isRestock ? 95 : isDisposal ? 15 : 60,
      hygieneChecklist: {
        sealIntact: isRestock,
        noSwatchOrFingerprints: isRestock,
        pumpDropperSterile: !isDisposal,
        batchAndExpMatch: true,
        noLeakageOrCracks: !isDisposal,
        smellAndTextureNormal: !isDisposal,
      },
      aiAnalysisSummary: parsedData.operatorSummary || "Retur diproses otomatis oleh modul AI Gemini.",
      operatorNotes: `Data direkam oleh operator ${operatorName}. Rekomendasi: ${parsedData.suggestedDisposition}.`,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          status: "REQUESTED",
          title: "Tiket Retur Dibuat Otomatis (AI Sync)",
          description: `Data diekstrak otomatis dari input channel ${parsedData.channel}.`,
          operatorName,
          location: "Gudang Retur Sentral",
        },
      ],
      isDefectBatchAlert: parsedData.batchNumber === "B240801",
    };

    onSaveReturn(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#F7F7F7] border-2 border-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black overflow-hidden my-4">
        {/* Modal Header */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 border-2 border-black bg-rose-500 text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-black uppercase tracking-wider flex items-center">
                Input Retur Otomatis via AI Gemini
                <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-[#FFE4E6] text-rose-950">
                  OCR & Chat NLP
                </span>
              </h2>
              <p className="text-xs text-slate-600 font-bold">
                Tempel teks keluhan chat marketplace, resi ekspedisi, atau unggah foto dokumen untuk ekstraksi data otomatis.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F7F7F7]">
          {/* Quick Presets for Operator testing */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-2">
              ⚡ Template Uji Cepat (Klik untuk Coba Langsung):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(preset.text);
                    setParsedData(null);
                  }}
                  className="text-left p-2.5 bg-white hover:bg-rose-50 border-2 border-black text-xs text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{preset.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black shrink-0 ml-2 stroke-[2.5]" />
                </button>
              ))}
            </div>
          </div>

          {/* Main Input Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-wider block">
                Teks Chat Komplain / Detail Resi / Faktur Retur:
              </label>
              <textarea
                rows={6}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tempel chat komplain pelanggan dari Shopee/TikTok/WhatsApp, nomor resi pengiriman balik, nomor pesanan, atau catatan kerusakan kosmetik di sini..."
                className="w-full bg-white border-2 border-black p-3.5 text-xs text-black placeholder-slate-400 focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono font-bold resize-none leading-relaxed"
              />
            </div>

            {/* Photo / Document Upload */}
            <div className="space-y-2 flex flex-col">
              <label className="text-xs font-black text-black uppercase tracking-wider block">
                Foto Bukti / Label Resi (Opsional):
              </label>
              <div className="flex-1 border-2 border-dashed border-black hover:bg-rose-50/50 p-4 flex flex-col items-center justify-center text-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group transition-all">
                {imagePreview ? (
                  <div className="relative w-full h-full min-h-[120px] flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 border-2 border-black object-contain shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 p-1 bg-black text-white hover:bg-rose-600 border border-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-black mb-2 stroke-[2]" />
                    <span className="text-xs font-black text-black uppercase">
                      Klik atau Drag Foto
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold mt-1">
                      Foto resi kurir, unboxing, atau botol kosmetik
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action to Parse */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs font-bold text-slate-600">
              *Didukung oleh model Gemini untuk standar higienitas CPKB & BPOM.
            </span>
            <button
              id="btn-trigger-ai-parse"
              type="button"
              disabled={isLoading}
              onClick={handleParseWithAI}
              className="px-5 py-2.5 border-2 border-black bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengekstrak Data Kosmetik...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 stroke-[2.5]" />
                  Ekstrak Otomatis Sekarang
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-100 border-2 border-black text-red-950 text-xs font-black uppercase flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-4 h-4 mr-2 text-red-700 shrink-0 stroke-[2.5]" />
              {errorMessage}
            </div>
          )}

          {/* AI Extracted Result Review */}
          {parsedData && (
            <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-700 stroke-[2.5]" />
                  <span className="text-sm font-black text-black uppercase tracking-wider">
                    Data Berhasil Diekstrak & Dianalisis
                  </span>
                </div>
                <span className="px-2.5 py-0.5 border border-black text-[10px] font-black uppercase bg-[#DCFCE7] text-green-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  Higienitas Risk: {parsedData.hygieneRisk || "Sedang"}
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Nama Customer</label>
                  <input
                    type="text"
                    value={parsedData.customerName || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, customerName: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={parsedData.customerPhone || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, customerPhone: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Saluran Pembelian (Channel)</label>
                  <input
                    type="text"
                    value={parsedData.channel || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, channel: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">No. Resi Pengembalian</label>
                  <input
                    type="text"
                    value={parsedData.trackingNumber || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, trackingNumber: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-rose-600 font-mono font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Ekspedisi Logistik</label>
                  <input
                    type="text"
                    value={parsedData.courier || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, courier: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">No. Order / Invoice</label>
                  <input
                    type="text"
                    value={parsedData.orderId || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, orderId: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Nama Produk Kosmetik</label>
                  <input
                    type="text"
                    value={parsedData.productName || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, productName: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Varian / Shade Warna</label>
                  <input
                    type="text"
                    value={parsedData.shadeOrVariant || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, shadeOrVariant: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Nomor Batch Produksi</label>
                  <input
                    type="text"
                    value={parsedData.batchNumber || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, batchNumber: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-amber-700 font-mono font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={parsedData.quantity || 1}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, quantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div>
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">Alasan Retur</label>
                  <input
                    type="text"
                    value={parsedData.returnReason || ""}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, returnReason: e.target.value })
                    }
                    className="w-full bg-white border-2 border-black p-2 text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:bg-rose-50"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-slate-600 font-bold uppercase text-[10px] block mb-1">
                    Rekomendasi Disposisi & Solusi Customer:
                  </label>
                  <div className="p-3 bg-slate-50 border-2 border-black flex flex-wrap items-center gap-3">
                    <span className="px-2.5 py-1 border border-black bg-[#FFE4E6] text-rose-950 font-black uppercase text-[10px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      Disposisi: {parsedData.suggestedDisposition || "QC Karantina"}
                    </span>
                    <span className="px-2.5 py-1 border border-black bg-[#E0F2FE] text-blue-950 font-black uppercase text-[10px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      Solusi: {parsedData.recommendedSolution || "Ganti Unit Baru"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: Save return */}
              <div className="flex justify-end space-x-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-slate-100 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Reset / Ekstrak Ulang
                </button>
                <button
                  id="btn-confirm-save-return"
                  type="button"
                  onClick={handleSaveToReturns}
                  className="px-5 py-2.5 border-2 border-black bg-[#DCFCE7] hover:bg-green-300 text-green-950 text-xs font-black uppercase tracking-wider flex items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                  Simpan & Daftarkan Tiket Retur
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
