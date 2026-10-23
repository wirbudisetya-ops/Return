import React, { useState } from "react";
import {
  Truck,
  X,
  Barcode,
  Store,
  UserCheck,
  Package,
  Layers,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { CosmeticReturnItem, CosmeticCategory } from "../types";
import { COSMETIC_PRODUCTS_CATALOG } from "../data/mockReturns";

interface InboundReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInboundReturn: (newReturn: CosmeticReturnItem) => void;
  defaultTrackingNumber?: string;
  defaultStoreName?: string;
}

const POPULAR_STORES = [
  "Toko Kosmetik ABC Sejahtera Solo",
  "Aura Beauty Mart Solo Baru",
  "Glow Point Surakarta Grand",
  "Toko Cantik Bintang Raya Solo",
  "Harmoni Kosmetik Kartasuro",
  "Mitra Sehat & Cantik Palur",
  "Toko Kosmetik ABC Malioboro",
  "Beauty Corner Nusa Indah Sleman",
  "Glow Mart Yogyakarta City",
  "Official Store ABC Beauty Direct",
];

const DEFAULT_DRIVERS = [
  { name: "Pak Joko (Armada Driver Inbound 01)", vehicle: "B 9821 TXX - Truk Engkel Box" },
  { name: "Hendra (Driver Box 02)", vehicle: "B 3144 KOP - Blindvan Inbound" },
  { name: "Suryadi (Driver Pick-up 01)", vehicle: "B 1290 PZK - GrandMax Pick-up" },
  { name: "Agus Santoso (Driver Ekspedisi J&T)", vehicle: "B 4410 SX - Mobil Box" },
];

export const InboundReceivingModal: React.FC<InboundReceivingModalProps> = ({
  isOpen,
  onClose,
  onAddInboundReturn,
  defaultTrackingNumber = "",
  defaultStoreName = "",
}) => {
  const [storeName, setStoreName] = useState(defaultStoreName || "");
  const [trackingNumber, setTrackingNumber] = useState(
    defaultTrackingNumber || `RET-INB-${Date.now().toString().slice(-6)}`
  );
  const [driverName, setDriverName] = useState(DEFAULT_DRIVERS[0].name);
  const [driverVehicle, setDriverVehicle] = useState(DEFAULT_DRIVERS[0].vehicle);
  const [inboundStaffName, setInboundStaffName] = useState("Agus Prasetyo (Staff Inbound Dock 1)");
  const [colliCount, setColliCount] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState(COSMETIC_PRODUCTS_CATALOG[0]);
  const [quantity, setQuantity] = useState<number>(2);
  const [returnReason, setReturnReason] = useState("Barang Rusak / Kemasan Cacat Saat Pengiriman");
  const [inboundNotes, setInboundNotes] = useState(
    "Diterima dari driver di Inbound Dock 01. Paket siap diserahterimakan ke Operator Retur."
  );
  const [channel, setChannel] = useState<"Toko Offline" | "Shopee" | "Tokopedia" | "TikTok Shop" | "Lazada">("Toko Offline");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert("Silakan masukkan atau pilih Nama Toko asal retur.");
      return;
    }

    const now = new Date().toISOString();
    const returnId = `RET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReturnItem: CosmeticReturnItem = {
      id: returnId,
      dcLocation: "DC_SOLO",
      orderId: `SJ/RET/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`,
      trackingNumber: trackingNumber.trim() || `TRK-${Date.now().toString().slice(-6)}`,
      courier: driverName.includes("Driver") ? "Armada Driver Internal" : "Ekspedisi Logistik",
      channel: channel,
      storeName: storeName.trim(),
      driverName: driverName,
      driverVehicle: driverVehicle,
      inboundStaffName: inboundStaffName,
      inboundReceivedAt: now,
      inboundNotes: inboundNotes,
      colliCount: Number(colliCount) || 1,
      handoverStatus: "MENUNGGU_KONFIRMASI_OPERATOR",
      storageBin: "Pallet Transit Inbound Area Dock 1",
      customerName: `Pic Toko (${storeName.trim()})`,
      customerPhone: "0812-8899-7766",
      customerCity: storeName.includes("Bandung") ? "Bandung" : storeName.includes("Surabaya") ? "Surabaya" : "Jakarta",
      productName: selectedProduct.name,
      category: selectedProduct.category as CosmeticCategory,
      shadeOrVariant: selectedProduct.variants[0] || "Standard",
      sku: selectedProduct.sku,
      quantity: Number(quantity) || 1,
      unitPrice: selectedProduct.unitPrice,
      totalValue: selectedProduct.unitPrice * (Number(quantity) || 1),
      batchNumber: selectedProduct.defaultBatch || "B240801",
      expiryDate: "2027-09-30",
      returnReason: returnReason,
      customerNotes: `Retur dari ${storeName} diantar oleh ${driverName} (${colliCount} koli).`,
      evidencePhotos: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
      ],
      status: "RECEIVED",

      priority: "HIGH",
      disposition: "QC_HOLD",
      resolution: "REPLACE_NEW",
      refundAmount: 0,
      hygieneScore: 50,
      hygieneChecklist: {
        sealIntact: false,
        noSwatchOrFingerprints: true,
        pumpDropperSterile: true,
        batchAndExpMatch: true,
        noLeakageOrCracks: false,
        smellAndTextureNormal: true,
      },
      aiAnalysisSummary: `Barang retur dari ${storeName} baru saja diterima di Inbound oleh ${inboundStaffName}. Menunggu verifikasi fisik & serah terima ke operator retur.`,
      operatorNotes: `Barang masih berada di pallet transit dock inbound. Menunggu konfirmasi penerimaan operator retur.`,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `tl-inb-${Date.now()}-1`,
          timestamp: now,
          status: "REQUESTED",
          title: `Surat Jalan Retur dari Toko Diterbitkan`,
          description: `Surat jalan retur diterbitkan dari ${storeName} sejumlah ${colliCount} koli.`,
          operatorName: `Store Staff (${storeName})`,
          location: storeName,
        },
        {
          id: `tl-inb-${Date.now()}-2`,
          timestamp: now,
          status: "RECEIVED",
          title: `Barang Tiba & Diinput Pihak Inbound`,
          description: `Staff Inbound ${inboundStaffName} menerima ${colliCount} koli dari Driver ${driverName} (${driverVehicle}). Siap diserahterimakan ke Operator Retur.`,
          operatorName: inboundStaffName,
          location: "Inbound Receiving Dock 01",
        },
      ],
    };

    onAddInboundReturn(newReturnItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#F7F7F7] border-2 border-black w-full max-w-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black my-8 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 border-2 border-black bg-blue-600 text-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Truck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-black uppercase tracking-wider">
                  Input Inbound: Penerimaan Barang dari Driver
                </h3>
                <span className="px-2 py-0.5 border border-black bg-[#FEF08A] text-amber-950 text-[10px] font-black uppercase">
                  Tahap 1: Inbound Dock
                </span>
              </div>
              <p className="text-xs text-slate-600 font-bold">
                Pihak Inbound mendata barang retur yang dibawa driver dengan scan barcode / pilih nama toko.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-[#F7F7F7]">
          {/* Section 1: Store & Barcode */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-black flex items-center">
                <Store className="w-4 h-4 mr-1.5 stroke-[2.5] text-rose-600" />
                1. Toko Asal & Identitas Resi / Barcode
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Wajib Diisi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Nama Toko / Counter Retail:
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Toko Kosmetik ABC Sejahtera..."
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold text-black focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Barcode Resi / No. Surat Jalan Retur:
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Scan barcode resi toko..."
                    className="w-full bg-white border-2 border-black pl-9 pr-3 py-2 text-xs font-mono font-bold text-black focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Store Selector Pills */}
            <div>
              <span className="text-[11px] font-black uppercase text-slate-700 block mb-1.5">
                ⚡ Pilih Cepat Nama Toko / Marketplace:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_STORES.map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setStoreName(st);
                      if (st.includes("Shopee")) setChannel("Shopee");
                      else if (st.includes("TikTok")) setChannel("TikTok Shop");
                      else if (st.includes("Tokopedia")) setChannel("Tokopedia");
                      else setChannel("Toko Offline");
                    }}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase border border-black transition-all ${
                      storeName === st
                        ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-slate-100 hover:bg-rose-100 text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Driver & Inbound Staff */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-black flex items-center">
                <Truck className="w-4 h-4 mr-1.5 stroke-[2.5] text-blue-600" />
                2. Driver yang Membawa & Staff Inbound Penerima
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-blue-100 text-blue-900">
                Logistik Internal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Nama Driver Pengantar:
                </label>
                <select
                  value={driverName}
                  onChange={(e) => {
                    setDriverName(e.target.value);
                    const found = DEFAULT_DRIVERS.find((d) => d.name === e.target.value);
                    if (found) setDriverVehicle(found.vehicle);
                  }}
                  className="w-full bg-white border-2 border-black px-2.5 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {DEFAULT_DRIVERS.map((d, i) => (
                    <option key={i} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                  <option value="Driver Ekspedisi Lainnya">Driver Ekspedisi Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Plat & Jenis Kendaraan:
                </label>
                <input
                  type="text"
                  value={driverVehicle}
                  onChange={(e) => setDriverVehicle(e.target.value)}
                  placeholder="Contoh: B 9821 TXX..."
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold text-black focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Staff Inbound Dock (Penerima):
                </label>
                <input
                  type="text"
                  value={inboundStaffName}
                  onChange={(e) => setInboundStaffName(e.target.value)}
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Jumlah Koli / Dus Diterima:
                </label>
                <input
                  type="number"
                  min={1}
                  value={colliCount}
                  onChange={(e) => setColliCount(Number(e.target.value))}
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Channel Penjualan:
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full bg-white border-2 border-black px-2.5 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <option value="Toko Offline">Toko Offline / Counter Retail</option>
                  <option value="Shopee">Shopee Mall</option>
                  <option value="Tokopedia">Tokopedia Official</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="Lazada">Lazada Mall</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Product Detail & Initial Defect Reason */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-xs font-black uppercase text-black flex items-center">
                <Package className="w-4 h-4 mr-1.5 stroke-[2.5] text-purple-600" />
                3. Data Produk Kosmetik & Alasan Retur
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Pilih Produk Kosmetik:
                </label>
                <select
                  value={selectedProduct.sku}
                  onChange={(e) => {
                    const prod = COSMETIC_PRODUCTS_CATALOG.find((p) => p.sku === e.target.value);
                    if (prod) setSelectedProduct(prod);
                  }}
                  className="w-full bg-white border-2 border-black px-2.5 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {COSMETIC_PRODUCTS_CATALOG.map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} ({p.sku}) - Rp {p.unitPrice.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-black block mb-1">
                  Kuantitas (Pcs):
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-black block mb-1">
                Alasan Retur dari Toko:
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-white border-2 border-black px-2.5 py-2 text-xs font-bold text-black focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <option value="Barang Rusak / Kemasan Cacat Saat Pengiriman">
                  Barang Rusak / Kemasan Cacat Saat Pengiriman
                </option>
                <option value="Pecah / Tumpah dalam Pengiriman">Pecah / Tumpah dalam Pengiriman</option>
                <option value="Salah Kirim Varian / Shade Warna">Salah Kirim Varian / Shade Warna</option>
                <option value="Kedaluwarsa / Batch Expired">Kedaluwarsa / Batch Expired</option>
                <option value="Segel Rusak / Terbuka Sebelum Diterima">Segel Rusak / Terbuka Sebelum Diterima</option>
                <option value="Tester Display Return / Overstock Toko">Tester Display Return / Overstock Toko</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-black block mb-1">
                Catatan Serah Terima Inbound:
              </label>
              <input
                type="text"
                value={inboundNotes}
                onChange={(e) => setInboundNotes(e.target.value)}
                placeholder="Kondisi koli saat diturunkan dari mobil driver..."
                className="w-full bg-white border-2 border-black px-3 py-2 text-xs font-medium text-black focus:outline-none focus:bg-rose-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>

          {/* Banner Workflow Notice */}
          <div className="p-3 bg-[#FEF08A] border-2 border-black text-amber-950 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-800 stroke-[2.5]" />
            <span>
              Setelah diinput, status barang menjadi <strong>"MENUNGGU KONFIRMASI OPERATOR"</strong> di Pallet Transit Dock. Operator Retur akan mengonfirmasi serah terima fisik barang & menetapkan rak penyimpanan.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-black bg-white hover:bg-slate-100 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 border-2 border-black bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 stroke-[2.5]" />
              Simpan & Daftarkan Serah Terima Inbound
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
