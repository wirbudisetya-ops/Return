import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  X,
  Store,
  Truck,
  UserCheck,
  Package,
  Clock,
  HelpCircle,
  Users,
} from "lucide-react";
import { CosmeticReturnItem, DistributionCenter, OperatorProfile } from "../types";
import { getIndonesianLiveDateTime } from "../data/dateUtils";

interface OperatorConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CosmeticReturnItem | null;
  operator: OperatorProfile;
  activeDC: DistributionCenter;
  onConfirm: (
    itemId: string,
    operatorName: string,
    storageBin: string,
    notes?: string
  ) => void;
}

export const OperatorConfirmModal: React.FC<OperatorConfirmModalProps> = ({
  isOpen,
  onClose,
  item,
  operator,
  activeDC,
  onConfirm,
}) => {
  const dcRacks =
    activeDC === "DC_SOLO"
      ? [
          "Rak Retur Solo A-01 (Skincare & Serum)",
          "Rak Retur Solo A-02 (Cairan Rusak / Bocor)",
          "Rak Retur Solo B-01 (Makeup & Lip Tint)",
          "Rak Retur Solo C-05 (Counter Offline Store)",
          "Rak Karantina Tanpa Identitas (Bin B-03)",
          "Rak Restock Grade A Solo (Baris 1)",
          "Area Pemusnahan Limbah B3 Solo",
        ]
      : [
          "Rak Retur Jogja Blok J-01 (Skincare & Krim)",
          "Rak Retur Jogja Blok J-02 (Makeup & Foundation)",
          "Rak Retur Jogja Blok J-05 (Counter Offline)",
          "Rak Karantina Jogja (Tanpa Identitas)",
          "Rak Restock Grade A Jogja (Baris 1)",
          "Area Transit Limbah B3 Jogja",
        ];

  const [storageBin, setStorageBin] = useState(dcRacks[0]);
  const [operatorName, setOperatorName] = useState(operator.name);
  const [operatorNotes, setOperatorNotes] = useState(
    "Fisik barang telah diperiksa & diterima lengkap dari Tim Absolute Inbound."
  );
  const [liveConfirmTime, setLiveConfirmTime] = useState(getIndonesianLiveDateTime());

  useEffect(() => {
    if (item?.storageBin && dcRacks.includes(item.storageBin)) {
      setStorageBin(item.storageBin);
    } else {
      setStorageBin(dcRacks[0]);
    }
    setOperatorName(operator.name);
    setLiveConfirmTime(getIndonesianLiveDateTime());
  }, [item, activeDC, operator]);

  if (!isOpen || !item) return null;

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(item.id, operatorName.trim() || operator.name, storageBin, operatorNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-xl shadow-xl text-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Konfirmasi Penerimaan Operator
              </h2>
              <p className="text-xs text-slate-400">
                Verifikasi fisik retur ({activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmSubmit} className="p-6 space-y-4">
          
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-700">Data Paket Inbound</span>
              <span className="font-mono font-bold text-blue-600">ID: {item.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 block">Toko Asal:</span>
                <span className="font-bold text-slate-800">{item.storeName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Jumlah Kuantitas:</span>
                <span className="font-bold text-slate-800">
                  {item.returnMethod === "MANUAL"
                    ? `${item.quantity || 1} Pcs`
                    : `${item.colliCount || 1} Koli / Dus`}
                </span>
              </div>

              {/* Tipe Retur */}
              <div>
                <span className="text-[11px] text-slate-400 block">Metode Retur:</span>
                {item.returnMethod === "SFM" || item.sfmNumber ? (
                  <span className="font-bold font-mono text-blue-700">
                    Retur SFM ({item.sfmNumber || item.orderId})
                  </span>
                ) : item.returnMethod === "MANUAL" || item.itemCondition ? (
                  <span className="font-bold text-emerald-700">
                    Retur Manual [{item.itemCondition || "STOCK"}]
                  </span>
                ) : (
                  <span className="font-medium text-slate-700">Retur Standar</span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Penerima Inbound:</span>
                <span className="font-medium text-slate-700">{item.inboundStaffName}</span>
              </div>

              {item.returnMethod === "MANUAL" && item.productName && (
                <div className="col-span-2 pt-1 border-t border-slate-200">
                  <span className="text-[11px] text-slate-400 block">Item Produk & Barcode:</span>
                  <span className="font-semibold text-slate-900">{item.productName}</span>
                  {item.barcode && (
                    <span className="ml-2 font-mono text-[11px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      {item.barcode}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Operator Retur <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pilih Lokasi Rak Penyimpanan <span className="text-rose-500">*</span>
              </label>
              <select
                value={storageBin}
                onChange={(e) => setStorageBin(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              >
                {dcRacks.map((rack) => (
                  <option key={rack} value={rack}>
                    {rack}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Catatan Pemeriksaan Operator
              </label>
              <textarea
                rows={2}
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Catatan kondisi fisik kardus atau kemasan..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Konfirmasi & Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
