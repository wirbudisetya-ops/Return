import React, { useState } from "react";
import {
  Barcode,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  Sparkles,
  Camera,
  RefreshCw,
} from "lucide-react";
import { CosmeticReturnItem, ReturnStatus } from "../types";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  returns: CosmeticReturnItem[];
  onSelectReturn: (item: CosmeticReturnItem) => void;
  onAdvanceStatus: (item: CosmeticReturnItem, nextStatus: ReturnStatus, note?: string) => void;
  onOpenAutoInputWithTracking: (trackingNumber: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  returns,
  onSelectReturn,
  onAdvanceStatus,
  onOpenAutoInputWithTracking,
}) => {
  const [scannedCode, setScannedCode] = useState("");
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);
  const [scanResult, setScanResult] = useState<CosmeticReturnItem | null>(null);
  const [notFound, setNotFound] = useState(false);

  if (!isOpen) return null;

  const handleScanSubmit = (codeToSearch: string) => {
    const code = codeToSearch.trim();
    if (!code) return;

    const matched = returns.find(
      (r) =>
        r.trackingNumber.toLowerCase() === code.toLowerCase() ||
        r.id.toLowerCase() === code.toLowerCase() ||
        r.orderId.toLowerCase() === code.toLowerCase() ||
        r.batchNumber.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      setScanResult(matched);
      setNotFound(false);
    } else {
      setScanResult(null);
      setNotFound(true);
    }
  };

  const sampleBarcodes = [
    { label: "SPX Shopee Xpress", code: "SPXID02918274619" },
    { label: "J&T Tokopedia", code: "TKP01982341258" },
    { label: "J&T TikTok Shop", code: "JX9920194812" },
    { label: "Batch B240801", code: "B240801" },
    { label: "Resi Baru (Belum Terdata)", code: "SPXID9988112233" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#F7F7F7] border-2 border-black w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 border-2 border-black bg-rose-500 text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Barcode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-black uppercase tracking-wider">
                Scanner Barcode & Resi Pengembalian
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                Gunakan scanner laser USB/Bluetooth atau masukkan nomor resi manual.
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
        <div className="p-6 space-y-6 bg-[#F7F7F7]">
          {/* Laser Scanner Simulated Viewfinder */}
          <div className="relative bg-white border-2 border-dashed border-black p-6 text-center overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {/* Red Laser Barcode Line animation */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse" />

            <div className="relative z-10 space-y-2">
              <Camera className="w-8 h-8 text-black mx-auto stroke-[2]" />
              <p className="text-xs font-black text-black uppercase tracking-wider">
                Arahkan barcode resi / kode dus kosmetik ke garis sensor merah
              </p>
              <p className="text-[10px] text-slate-600 font-bold">
                Mendukung Code128, QR Code, DataMatrix, dan EAN-13
              </p>
            </div>
          </div>

          {/* Quick Barcode Presets */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider block mb-2">
              ⚡ Simulasi Scan Cepat (Pilih Salah Satu Barcode):
            </label>
            <div className="flex flex-wrap gap-2">
              {sampleBarcodes.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setScannedCode(item.code);
                    handleScanSubmit(item.code);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border-2 border-black text-xs text-black font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  {item.label}: <strong className="text-rose-600">{item.code}</strong>
                </button>
              ))}
            </div>
          </div>

          {/* Manual / Scanner Input Box */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type="text"
                autoFocus
                value={scannedCode}
                onChange={(e) => {
                  setScannedCode(e.target.value);
                  handleScanSubmit(e.target.value);
                }}
                placeholder="Scan barcode resi ekspedisi atau ketik nomor..."
                className="w-full bg-white border-2 border-black pl-10 pr-4 py-2.5 text-xs text-black font-mono font-bold placeholder-slate-400 focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            <button
              onClick={() => handleScanSubmit(scannedCode)}
              className="px-5 py-2.5 border-2 border-black bg-black text-white hover:bg-slate-800 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Cari
            </button>
          </div>

          {/* Scan Match Result */}
          {scanResult && (
            <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-700 stroke-[2.5]" />
                  <span className="text-xs font-black text-black font-mono">
                    {scanResult.id} - {scanResult.trackingNumber}
                  </span>
                </div>
                <span className="px-2 py-0.5 border border-black text-[10px] font-black uppercase bg-[#DCFCE7] text-green-950 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {scanResult.status}
                </span>
              </div>

              <div className="text-xs space-y-1 text-black font-bold">
                <div><strong>Produk:</strong> {scanResult.productName} ({scanResult.shadeOrVariant})</div>
                <div><strong>Customer:</strong> {scanResult.customerName} ({scanResult.channel})</div>
                <div><strong>Alasan Retur:</strong> {scanResult.returnReason}</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-black">
                <button
                  onClick={() => {
                    onSelectReturn(scanResult);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 border-2 border-black bg-white hover:bg-slate-100 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Buka Detail
                </button>

                {(scanResult.status === "REQUESTED" || scanResult.status === "IN_TRANSIT") && (
                  <button
                    onClick={() => {
                      onAdvanceStatus(
                        scanResult,
                        "RECEIVED",
                        "Paket berhasil di-scan check-in di meja unboxing operator."
                      );
                      onClose();
                    }}
                    className="px-4 py-1.5 border-2 border-black bg-[#DCFCE7] hover:bg-green-300 text-green-950 text-xs font-black uppercase tracking-wider flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                    Check-in Tiba di Gudang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Not Found -> Offer AI Auto-Input */}
          {notFound && scannedCode && (
            <div className="p-4 bg-amber-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex items-center space-x-2 text-amber-950">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700 stroke-[2.5]" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Resi "{scannedCode}" Belum Terdaftar di Sistem
                </span>
              </div>
              <p className="text-xs text-slate-700 font-bold">
                Paket fisik baru saja tiba namun tiket retur belum dibuat? Anda dapat langsung membuat data retur baru secara otomatis dengan AI.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAutoInputWithTracking(scannedCode);
                  }}
                  className="px-4 py-2 border-2 border-black bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider flex items-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                  Buat Retur Baru untuk Resi Ini via AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
