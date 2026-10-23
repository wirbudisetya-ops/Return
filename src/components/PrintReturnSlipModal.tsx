import React from "react";
import { Printer, X, Store, CheckCircle2, Truck, UserCheck, HelpCircle } from "lucide-react";
import { CosmeticReturnItem, DistributionCenter } from "../types";
import { formatISODateToIndonesian } from "../data/dateUtils";

interface PrintReturnSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CosmeticReturnItem | null;
  companyName: string;
  departmentName: string;
  activeDC: DistributionCenter;
}

export const PrintReturnSlipModal: React.FC<PrintReturnSlipModalProps> = ({
  isOpen,
  onClose,
  item,
  companyName,
  departmentName,
  activeDC,
}) => {
  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const dcTitle =
    item.dcLocation === "DC_SOLO" ? "DC SOLO (SURAKARTA)" : "DC JOGJA (DIY)";
  const dcSub =
    item.dcLocation === "DC_SOLO"
      ? "Gudang Hub DC Solo"
      : "Gudang Hub DC Jogja (DIY)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] text-slate-900 overflow-hidden my-4">
        
        {/* Header Controls (Hidden on print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black">
              <Printer className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Pratinjau Cetak Slip Tanda Terima Retur
              </h3>
              <p className="text-[11px] text-slate-300 font-bold">
                Bukti fisik serah terima Tim Absolute & Operator Retur {dcTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider flex items-center shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 stroke-[2.5]" /> Cetak Slip (Print)
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 bg-white text-slate-900 font-sans text-xs space-y-5 overflow-y-auto max-h-[80vh] print:max-h-none print:p-0">
          
          {/* Company & DC Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
                {companyName}
              </h1>
              <h2 className="text-xs font-black text-rose-700 uppercase">
                {departmentName} &bull; {dcTitle}
              </h2>
              <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                Alamat: {dcSub}
              </p>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs font-black text-slate-900 bg-slate-100 border border-slate-900 px-2 py-0.5 rounded inline-block">
                {item.id}
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-1">
                No. SJ: {item.orderId || "-"}
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2 bg-slate-100 border border-slate-300 rounded-lg">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              SURAT TANDA TERIMA RETUR FISIK BARANG INBOUND
            </h2>
            <span className="text-[10px] font-bold text-slate-700">
              Pusat Distribusi: <strong>{dcTitle}</strong>
            </span>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 bg-slate-50">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Toko Asal Retur:</span>
                {item.isAnonymousStore ? (
                  <span className="font-black text-purple-700 text-xs">⚠️ TANPA KETERANGAN NAMA TOKO</span>
                ) : (
                  <span className="font-black text-slate-950 text-xs">{item.storeName}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Driver Pengantar:</span>
                <span className="font-bold text-slate-900">{item.driverName || "Driver Mitra"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Kuantitas Fisik:</span>
                <span className="font-black text-slate-950 text-sm">
                  {item.returnMethod === "MANUAL"
                    ? `${item.quantity || 1} Pcs (Retur Manual)`
                    : `${item.colliCount || 1} Koli / Dus`}
                </span>
              </div>

              {/* Metode Retur */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Metode Retur:</span>
                {item.returnMethod === "SFM" || item.sfmNumber ? (
                  <span className="font-bold font-mono text-blue-900 text-xs">
                    RETUR SFM (No: {item.sfmNumber || item.orderId})
                  </span>
                ) : item.returnMethod === "MANUAL" || item.itemCondition ? (
                  <span className="font-bold text-emerald-900 text-xs">
                    RETUR MANUAL [{item.itemCondition || "STOCK"}]
                  </span>
                ) : (
                  <span className="font-medium text-slate-800 text-xs">STANDAR</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Waktu Diterima di Inbound:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {item.inboundDayFormatted || formatISODateToIndonesian(item.inboundReceivedAt)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Penerima (Tim Absolute):</span>
                <span className="font-bold text-slate-900 uppercase">{item.inboundStaffName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Status Serah Terima:</span>
                <span className="font-black text-emerald-800 uppercase">
                  {item.handoverStatus === "SUDAH_DITERIMA_OPERATOR"
                    ? `✓ DITERIMA OLEH ${item.acceptedByOperator || "OPERATOR"}`
                    : "⚠️ MENUNGGU KONFIRMASI OPERATOR"}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="border border-slate-300 rounded-lg p-3 bg-white space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-900 block">Lokasi Rak Simpan & Catatan:</span>
            <p className="text-xs font-bold text-slate-800">
              📍 Lokasi Rak: <strong>{item.storageBin || "Area Inbound Transit"}</strong>
            </p>
            {item.operatorConfirmationNotes && (
              <p className="text-xs font-medium text-slate-700 italic">
                Catatan Operator: "{item.operatorConfirmationNotes}"
              </p>
            )}
          </div>

          {/* Itemized Table for Scanned Manual Return Items */}
          {item.manualItems && item.manualItems.length > 0 && (
            <div className="border border-slate-300 rounded-lg overflow-hidden space-y-0">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 font-bold text-slate-900 text-[11px] flex justify-between items-center">
                <span>RINCIAN BARANG HASIL RETUR MANUAL ({item.manualItems.length} JENIS ITEM)</span>
                <span>TOTAL FISIK: {item.quantity} PCS</span>
              </div>
              <table className="w-full text-left text-[10px] border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="py-1.5 px-2 text-center w-8">No</th>
                    <th className="py-1.5 px-2">Barcode</th>
                    <th className="py-1.5 px-2">Nama Barang</th>
                    <th className="py-1.5 px-2 text-center">Kondisi</th>
                    <th className="py-1.5 px-2 text-center">Jumlah</th>
                    <th className="py-1.5 px-2 text-right">Harga HET</th>
                    <th className="py-1.5 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {item.manualItems.map((mItem, idx) => (
                    <tr key={mItem.id || idx}>
                      <td className="py-1 px-2 text-center font-mono">{idx + 1}</td>
                      <td className="py-1 px-2 font-mono font-bold">{mItem.barcode}</td>
                      <td className="py-1 px-2 font-medium">{mItem.productName}</td>
                      <td className="py-1 px-2 text-center font-bold">[{mItem.condition}]</td>
                      <td className="py-1 px-2 text-center font-bold font-mono">{mItem.quantity} pcs</td>
                      <td className="py-1 px-2 text-right font-mono">Rp {mItem.unitPrice.toLocaleString("id-ID")}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold">Rp {(mItem.quantity * mItem.unitPrice).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={4} className="py-1.5 px-2 text-right">TOTAL NILAI BARANG:</td>
                    <td className="py-1.5 px-2 text-center font-mono">{item.quantity} pcs</td>
                    <td></td>
                    <td className="py-1.5 px-2 text-right font-mono">Rp {item.totalValue.toLocaleString("id-ID")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center">
            <div className="border border-slate-300 rounded-lg p-3 space-y-10 bg-slate-50">
              <span className="text-[10px] font-black uppercase block">Diserahkan Oleh (Driver):</span>
              <div className="border-t border-slate-400 pt-1">
                <span className="text-xs font-bold block">{item.driverName || "( ......................... )"}</span>
                <span className="text-[9px] text-slate-500">Driver Pengantar</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 space-y-10 bg-slate-50">
              <span className="text-[10px] font-black uppercase block">Diterima Tim Absolute:</span>
              <div className="border-t border-slate-400 pt-1">
                <span className="text-xs font-bold block">{item.inboundStaffName || "( ......................... )"}</span>
                <span className="text-[9px] text-slate-500">Tim Absolute Inbound</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 space-y-10 bg-emerald-50/50">
              <span className="text-[10px] font-black uppercase block">Dikonfirmasi Operator Retur:</span>
              <div className="border-t border-slate-400 pt-1">
                <span className="text-xs font-bold block">
                  {item.acceptedByOperator || "( ......................... )"}
                </span>
                <span className="text-[9px] text-slate-500">Operator Retur</span>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-center text-slate-400 font-mono">
            Dokumen sah dicetak melalui Sistem Retur Gudang {companyName} &bull; {dcTitle}
          </div>
        </div>
      </div>
    </div>
  );
};
