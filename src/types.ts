export type DistributionCenter = "DC_SOLO" | "DC_JOGJA";

export type ReturnInputMethod = "SFM" | "MANUAL";

export type ManualItemCondition = "STOCK" | "BAD" | "NED" | "DEMOLISH";

export type JogjaTransferCondition = "BAD" | "NED" | "STOCK" | "BELUM PROSES";

export type JogjaSenderOption = "OKI" | "NARYO" | "JULI" | "Lainnya";

export interface JogjaToSoloTransferItem {
  id: string; // e.g. "TF-JOG-2026-001"
  storeName: string; // nama toko asal
  condition: JogjaTransferCondition; // BAD | NED | STOCK | BELUM PROSES
  quantity: number; // Jumlah pcs / koli
  quantityUnit: "Koli" | "Pcs" | "Dus" | "Paket";
  senderName: string; // OKI, NARYO, JULI, atau nama lainnya
  senderNotes?: string;
  sentAt: string; // ISO date string
  sentDayFormatted: string; // e.g. "Kamis, 20 Agustus 2026 - 14:30:00 WIB"
  
  // Inter-DC Transfer Status
  transferStatus: "MENUNGGU_PENERIMAAN_SOLO" | "DITERIMA_TIM_ABSOLUTE" | "SELESAI_OPERATOR_SOLO";
  
  // Penerimaan Tim Absolute di DC Solo
  receivedByTimAbsolute?: string; // ALFIAN, RENALDI, FANI, HERI, YANUAR, dll.
  receivedAtTimAbsolute?: string; // ISO date string
  receivedDayFormatted?: string;
  driverName?: string; // Driver pengantar antar DC
  timAbsoluteNotes?: string;
  
  // Operator Retur DC Solo
  acceptedByOperatorSolo?: string;
  acceptedAtOperatorSolo?: string;
  storageBinSolo?: string;
  
  // ID return item yang terbuat di sistem DC Solo
  linkedReturnId?: string;
}

export interface StoreDirectoryItem {
  id: string;
  name: string;
  code: string;
  dcLocation: DistributionCenter;
  city: string;
  address?: string;
  picName?: string;
  phone?: string;
}

export type ReturnStatus =
  | "REQUESTED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "INSPECTING"
  | "DISPOSITION_DECIDED"
  | "REFUNDED_REPLACED"
  | "COMPLETED"
  | "REJECTED";

export type ReturnDisposition =
  | "RESTOCK"
  | "QC_HOLD"
  | "REWORK"
  | "DISPOSAL"
  | "VENDOR_RETURN";

export type ResolutionType =
  | "REFUND_100"
  | "EXCHANGE_VARIANT"
  | "REPLACE_NEW"
  | "STORE_CREDIT"
  | "REJECT_RETURN";

export type CosmeticCategory =
  | "SKINCARE"
  | "MAKEUP"
  | "BODYCARE"
  | "HAIRCARE"
  | "FRAGRANCE";

export interface HygieneChecklist {
  sealIntact: boolean;
  noSwatchOrFingerprints: boolean;
  pumpDropperSterile: boolean;
  batchAndExpMatch: boolean;
  noLeakageOrCracks: boolean;
  smellAndTextureNormal: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: ReturnStatus;
  title: string;
  description: string;
  operatorName: string;
  location: string;
  courierDetail?: string;
}

export interface ScannedManualItem {
  id: string;
  barcode: string;
  productName: string;
  brand?: string;
  category?: string;
  unitPrice: number;
  provisionPrice?: number;
  quantity: number;
  condition: ManualItemCondition;
  notes?: string;
  scannedAt?: string;
}

export interface CosmeticReturnItem {
  id: string;
  dcLocation: DistributionCenter; // DC SOLO atau DC JOGJA
  isAnonymousStore?: boolean; // True jika diterima tanpa keterangan nama toko
  orderId: string;
  trackingNumber: string;
  originalTrackingNumber?: string;
  courier: string;
  channel: "Shopee" | "Tokopedia" | "TikTok Shop" | "Lazada" | "Toko Offline" | "Website";
  storeName: string; // Nama Toko / Counter / Distributor / Mall ("TANPA KETERANGAN TOKO" jika anonim)
  driverName?: string; // Nama Driver yang membawa barang ke gudang
  driverVehicle?: string; // Plat nomor / armada mobil driver
  inboundStaffName: string; // Nama staff Inbound/Penerima yang input barang saat tiba
  inboundReceivedAt: string; // Waktu barang diterima pihak inbound dari driver (ISO String)
  inboundDayFormatted?: string; // e.g., "Jumat, 21 Agustus 2026, 14:30:00 WIB"
  inboundNotes?: string;
  colliCount: number; // Jumlah Koli / Dus / Box / Pcs
  handoverStatus: "MENUNGGU_KONFIRMASI_OPERATOR" | "SUDAH_DITERIMA_OPERATOR" | "DALAM_PROSES_QC" | "SELESAI";
  acceptedByOperator?: string; // Nama Operator Retur yang mengonfirmasi penerimaan fisik
  acceptedAt?: string; // Waktu konfirmasi oleh operator retur
  acceptedDayFormatted?: string; // e.g. "Jumat, 21 Agustus 2026, 14:35:10 WIB"
  storageBin?: string; // Lokasi Rak / Bin Penyimpanan di gudang
  operatorConfirmationNotes?: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  productName: string;
  category: CosmeticCategory;
  shadeOrVariant: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  batchNumber: string;
  expiryDate: string;
  returnReason: string;
  customerNotes: string;
  evidencePhotos: string[];
  status: ReturnStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  disposition?: ReturnDisposition;
  resolution?: ResolutionType;
  refundAmount?: number;
  replacementTrackingNumber?: string;
  hygieneScore: number;
  hygieneChecklist: HygieneChecklist;
  aiAnalysisSummary?: string;
  operatorNotes?: string;
  
  // Jenis Input Retur (SFM vs Manual)
  returnMethod?: "SFM" | "MANUAL";
  sfmNumber?: string; // Nomor dokumen SFM untuk Retur SFM
  barcode?: string; // Barcode produk yang di-scan untuk Retur Manual
  itemCondition?: "STOCK" | "BAD" | "NED" | "DEMOLISH"; // Kondisi barang untuk Retur Manual
  
  // Rincian Hasil Barang Retur Manual yang Diinput & Disimpan
  manualItems?: ScannedManualItem[];
  manualProcessingStatus?: "BELUM_DIPROSES" | "SEDANG_DIPROSES" | "SELESAI";
  manualProcessedAt?: string;
  manualProcessedBy?: string;
  
  inspectedBy?: string;
  inspectedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  isDefectBatchAlert?: boolean;
}

export interface BatchRiskReport {
  batchNumber: string;
  productName: string;
  returnCount: number;
  predominantReason: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedUnitsEst: number;
  recommendedAction: string;
}

export interface OperatorProfile {
  id: string;
  name: string;
  role: string;
  warehouseLocation: string;
  dcLocation: DistributionCenter;
  shift: string;
}

export type StaffRole =
  | "SUPER_ADMIN"
  | "OPERATOR_SOLO"
  | "OPERATOR_JOGJA"
  | "INBOUND_STAFF"
  | "VIEWER";

export interface AuthorizedUser {
  uid?: string;
  email: string;
  displayName: string;
  role: StaffRole;
  allowedDCs: DistributionCenter[];
  status: "ACTIVE" | "PENDING" | "REVOKED";
  canEditReturns: boolean;
  canConfirmOperator: boolean;
  canProcessManualReturns: boolean;
  canManageUsers: boolean;
  addedAt: string;
  addedBy: string;
  photoURL?: string;
  lastLoginAt?: string;
}

