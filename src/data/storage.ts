import { CosmeticReturnItem, DistributionCenter, JogjaToSoloTransferItem, OperatorProfile, TimelineEvent } from "../types";
import { INITIAL_RETURNS, DEFAULT_OPERATOR, DC_OPERATORS, INITIAL_JOGJA_TRANSFERS } from "./mockReturns";
import { getIndonesianLiveDateTime } from "./dateUtils";

const STORAGE_KEY = "pt_abc_returns_dc_v1";
const OPERATOR_KEY = "pt_abc_operator_profile_v1";
const ACTIVE_DC_KEY = "pt_abc_active_dc_v1";
const TRANSFERS_KEY = "pt_abc_jogja_solo_transfers_v1";

export function getStoredActiveDC(): DistributionCenter | null {
  try {
    const dc = localStorage.getItem(ACTIVE_DC_KEY);
    if (dc === "DC_SOLO" || dc === "DC_JOGJA") {
      return dc as DistributionCenter;
    }
  } catch (e) {
    console.error("Failed to read active DC:", e);
  }
  return null;
}

export function saveActiveDC(dc: DistributionCenter): void {
  try {
    localStorage.setItem(ACTIVE_DC_KEY, dc);
  } catch (e) {
    console.error("Failed to save active DC:", e);
  }
}

export function loadReturns(dcFilter?: DistributionCenter): CosmeticReturnItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RETURNS));
      return dcFilter ? INITIAL_RETURNS.filter((r) => r.dcLocation === dcFilter) : INITIAL_RETURNS;
    }
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      const normalized = data.map((item) => ({
        ...item,
        dcLocation: item.dcLocation || "DC_SOLO",
        storeName: item.storeName || (item.isAnonymousStore ? "⚠️ TANPA KETERANGAN NAMA TOKO" : "Toko Mitra"),
        handoverStatus: item.handoverStatus || "MENUNGGU_KONFIRMASI_OPERATOR",
      }));
      return dcFilter ? normalized.filter((r: CosmeticReturnItem) => r.dcLocation === dcFilter) : normalized;
    }
    return dcFilter ? INITIAL_RETURNS.filter((r) => r.dcLocation === dcFilter) : INITIAL_RETURNS;
  } catch (e) {
    console.error("Failed to load returns from storage:", e);
    return dcFilter ? INITIAL_RETURNS.filter((r) => r.dcLocation === dcFilter) : INITIAL_RETURNS;
  }
}

export function saveReturns(returns: CosmeticReturnItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(returns));
  } catch (e) {
    console.error("Failed to save returns to storage:", e);
  }
  // Sync to Cloud Server immediately
  if (typeof window !== "undefined") {
    fetch("/api/live/returns-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returns }),
    }).catch(() => {});
  }
}

export function addReturnItem(newItem: CosmeticReturnItem): CosmeticReturnItem[] {
  const current = loadReturns();
  const exists = current.some((r) => r.id === newItem.id);
  const updated = exists
    ? current.map((r) => (r.id === newItem.id ? newItem : r))
    : [newItem, ...current];
  saveReturns(updated);

  // Push single item immediately to cloud for ultra-fast response
  if (typeof window !== "undefined") {
    fetch("/api/live/return-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    }).catch(() => {});
  }

  return updated;
}

export function updateReturnItem(updatedItem: CosmeticReturnItem): CosmeticReturnItem[] {
  const current = loadReturns();
  const updated = current.map((r) => (r.id === updatedItem.id ? updatedItem : r));
  saveReturns(updated);
  return updated;
}

export function saveManualReturnItems(
  returnId: string,
  manualItems: import("../types").ScannedManualItem[],
  operatorName: string,
  isFinal = true,
  notes?: string
): CosmeticReturnItem[] {
  const current = loadReturns();
  const { isoString } = getIndonesianLiveDateTime();

  const totalQty = manualItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalVal = manualItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);

  // Group by conditions
  const conditionMap: Record<string, number> = {};
  manualItems.forEach((it) => {
    conditionMap[it.condition] = (conditionMap[it.condition] || 0) + it.quantity;
  });
  const conditionSummary = Object.entries(conditionMap)
    .map(([c, q]) => `${c}: ${q} pcs`)
    .join(", ");

  const updated = current.map((item) => {
    if (item.id === returnId) {
      const newTimeline: TimelineEvent = {
        id: `tl-manual-qc-${Date.now()}`,
        timestamp: isoString,
        status: isFinal ? "INSPECTING" : item.status,
        title: isFinal
          ? "Pemeriksaan & Input Barang Retur Manual Selesai"
          : "Pembaruan Draf Barang Retur Manual",
        description: `Operator Retur ${operatorName} mencatat ${manualItems.length} jenis item (${totalQty} pcs, nilai: Rp ${totalVal.toLocaleString("id-ID")}). Kondisi: ${conditionSummary || "-"}.${notes ? ` Catatan: ${notes}` : ""}`,
        operatorName: operatorName,
        location: item.storageBin || "Meja QC Retur",
      };

      return {
        ...item,
        manualItems: manualItems,
        manualProcessingStatus: (isFinal ? "SELESAI" : "SEDANG_DIPROSES") as "SELESAI" | "SEDANG_DIPROSES",
        manualProcessedAt: isoString,
        manualProcessedBy: operatorName,
        quantity: totalQty > 0 ? totalQty : item.quantity,
        totalValue: totalVal > 0 ? totalVal : item.totalValue,
        status: isFinal ? ("INSPECTING" as const) : item.status,
        updatedAt: isoString,
        timeline: [newTimeline, ...item.timeline],
      };
    }
    return item;
  });

  saveReturns(updated);
  return updated;
}

export function confirmOperatorHandover(
  itemId: string,
  operatorName: string,
  storageBin: string,
  notes?: string
): CosmeticReturnItem[] {
  const current = loadReturns();
  const { isoString, fullString } = getIndonesianLiveDateTime();

  const updated = current.map((item) => {
    if (item.id === itemId) {
      const storeLabel = item.isAnonymousStore ? "Retur Tanpa Nama Toko" : item.storeName;
      const newTimeline: TimelineEvent = {
        id: `tl-confirm-${Date.now()}`,
        timestamp: isoString,
        status: item.status === "REQUESTED" || item.status === "IN_TRANSIT" ? "RECEIVED" : item.status,
        title: "Konfirmasi Fisik Diterima Operator Retur",
        description: `Barang dari ${storeLabel} telah diverifikasi fisik dan diterima oleh Operator Retur: ${operatorName}. Disimpan pada ${storageBin}.${notes ? ` Catatan: ${notes}` : ""}`,
        operatorName: operatorName,
        location: storageBin,
      };

      return {
        ...item,
        handoverStatus: "SUDAH_DITERIMA_OPERATOR" as const,
        acceptedByOperator: operatorName,
        acceptedAt: isoString,
        acceptedDayFormatted: fullString,
        storageBin: storageBin,
        operatorConfirmationNotes: notes || item.operatorConfirmationNotes,
        status: "RECEIVED" as const,
        updatedAt: isoString,
        timeline: [newTimeline, ...item.timeline],
      };
    }
    return item;
  });

  saveReturns(updated);
  return updated;
}

// ----------------------------------------------------
// JOGJA TO SOLO TRANSFER STORAGE & LOGIC
// ----------------------------------------------------

export function loadJogjaTransfers(): JogjaToSoloTransferItem[] {
  try {
    const raw = localStorage.getItem(TRANSFERS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSFERS_KEY, JSON.stringify(INITIAL_JOGJA_TRANSFERS));
      return INITIAL_JOGJA_TRANSFERS;
    }
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
    return INITIAL_JOGJA_TRANSFERS;
  } catch (e) {
    console.error("Failed to load Jogja transfers:", e);
    return INITIAL_JOGJA_TRANSFERS;
  }
}

export function saveJogjaTransfers(transfers: JogjaToSoloTransferItem[]): void {
  try {
    localStorage.setItem(TRANSFERS_KEY, JSON.stringify(transfers));
  } catch (e) {
    console.error("Failed to save Jogja transfers:", e);
  }
  // Sync to Cloud Server immediately
  if (typeof window !== "undefined") {
    fetch("/api/live/jogja-transfers-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfers }),
    }).catch(() => {});
  }
}

export function addJogjaTransfer(newTransfer: JogjaToSoloTransferItem): JogjaToSoloTransferItem[] {
  const current = loadJogjaTransfers();
  const exists = current.some((t) => t.id === newTransfer.id);
  const updated = exists
    ? current.map((t) => (t.id === newTransfer.id ? newTransfer : t))
    : [newTransfer, ...current];
  saveJogjaTransfers(updated);

  // Push single transfer immediately to cloud for ultra-fast response
  if (typeof window !== "undefined") {
    fetch("/api/live/jogja-transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTransfer),
    }).catch(() => {});
  }

  return updated;
}

export function confirmTimAbsoluteTransferReceipt(
  transferId: string,
  timAbsoluteName: string,
  timAbsoluteNotes?: string,
  driverName?: string,
  verifiedQty?: number
): {
  updatedTransfers: JogjaToSoloTransferItem[];
  createdReturnItem: CosmeticReturnItem;
} {
  const currentTransfers = loadJogjaTransfers();
  const { isoString, fullString } = getIndonesianLiveDateTime();
  const targetTransfer = currentTransfers.find((t) => t.id === transferId);

  if (!targetTransfer) {
    throw new Error(`Transfer dengan ID ${transferId} tidak ditemukan`);
  }

  const generatedReturnId = `RET-SLO-JOG-${Date.now().toString().slice(-4)}`;
  const finalQty = verifiedQty || targetTransfer.quantity;
  const effectiveDriver = driverName || "Ekspedisi DC Jogja (Pengirim: " + targetTransfer.senderName + ")";

  // 1. Create a new CosmeticReturnItem for DC SOLO
  const newReturnItem: CosmeticReturnItem = {
    id: generatedReturnId,
    dcLocation: "DC_SOLO",
    orderId: targetTransfer.id,
    trackingNumber: `TRK-JOG-SLO-${Date.now().toString().slice(-6)}`,
    courier: "Ekspedisi Antar DC Jogja-Solo",
    channel: "Toko Offline",
    storeName: `${targetTransfer.storeName} (Kondisi: ${targetTransfer.condition})`,
    driverName: effectiveDriver,
    inboundStaffName: timAbsoluteName,
    inboundReceivedAt: isoString,
    inboundDayFormatted: fullString,
    inboundNotes: `Retur Kirim dari DC Jogja. Kondisi: ${targetTransfer.condition}. Pengirim: ${targetTransfer.senderName}. Kuantitas: ${finalQty} ${targetTransfer.quantityUnit}. Catatan Jogja: "${targetTransfer.senderNotes || "-"}" | Catatan Tim Absolute: "${timAbsoluteNotes || "-"}"`,
    colliCount: finalQty,
    handoverStatus: "MENUNGGU_KONFIRMASI_OPERATOR",
    storageBin: "Area Inbound Transit Solo (Eks-Jogja)",
    customerName: `Pengirim Jogja: ${targetTransfer.senderName}`,
    customerPhone: "0812-3344-5566",
    customerCity: "Yogyakarta (Transfer ke Solo)",
    productName: `Kosmetik Retur Jogja (${targetTransfer.condition})`,
    category: "SKINCARE",
    shadeOrVariant: `Kondisi Fisik: ${targetTransfer.condition}`,
    sku: `RET-JOG-${targetTransfer.condition}`,
    quantity: finalQty,
    unitPrice: 100000,
    totalValue: finalQty * 100000,
    batchNumber: "TF-JOG-BATCH",
    expiryDate: "2027-12-31",
    returnReason: `Retur Transfer DC Jogja ke Solo - Status: ${targetTransfer.condition}`,
    customerNotes: targetTransfer.senderNotes || "Transfer retur fisik antar DC",
    evidencePhotos: [
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
    ],
    status: "RECEIVED",
    priority: targetTransfer.condition === "BAD" ? "URGENT" : targetTransfer.condition === "NED" ? "HIGH" : "MEDIUM",
    disposition: targetTransfer.condition === "BAD" ? "DISPOSAL" : targetTransfer.condition === "NED" ? "QC_HOLD" : "RESTOCK",
    hygieneScore: targetTransfer.condition === "BAD" ? 40 : 80,
    hygieneChecklist: {
      sealIntact: targetTransfer.condition !== "BAD",
      noSwatchOrFingerprints: true,
      pumpDropperSterile: true,
      batchAndExpMatch: true,
      noLeakageOrCracks: targetTransfer.condition !== "BAD",
      smellAndTextureNormal: true,
    },
    createdAt: isoString,
    updatedAt: isoString,
    timeline: [
      {
        id: `tl-inbound-${Date.now()}`,
        timestamp: isoString,
        status: "RECEIVED",
        title: "Diterima Tim Absolute di DC Solo",
        description: `Barang transfer retur dari DC Jogja (Pengirim: ${targetTransfer.senderName}) diterima oleh ${timAbsoluteName} (Tim Absolute). Menunggu konfirmasi operator retur Solo.`,
        operatorName: timAbsoluteName,
        location: "Inbound Gate DC Solo",
      },
    ],
  };

  // Add the newly created return item to DC Solo returns
  addReturnItem(newReturnItem);

  // 2. Update the transfer record
  const updatedTransfers = currentTransfers.map((t) => {
    if (t.id === transferId) {
      return {
        ...t,
        transferStatus: "DITERIMA_TIM_ABSOLUTE" as const,
        receivedByTimAbsolute: timAbsoluteName,
        receivedAtTimAbsolute: isoString,
        receivedDayFormatted: fullString,
        driverName: effectiveDriver,
        timAbsoluteNotes: timAbsoluteNotes,
        linkedReturnId: generatedReturnId,
      };
    }
    return t;
  });

  saveJogjaTransfers(updatedTransfers);
  return { updatedTransfers, createdReturnItem: newReturnItem };
}

export function loadOperator(dc?: DistributionCenter): OperatorProfile {
  const targetDC = dc || getStoredActiveDC() || "DC_SOLO";
  try {
    const key = `${OPERATOR_KEY}_${targetDC}`;
    const raw = localStorage.getItem(key);
    if (!raw) return DC_OPERATORS[targetDC] || DEFAULT_OPERATOR;
    return JSON.parse(raw);
  } catch {
    return DC_OPERATORS[targetDC] || DEFAULT_OPERATOR;
  }
}

export function saveOperator(profile: OperatorProfile): void {
  try {
    const key = `${OPERATOR_KEY}_${profile.dcLocation}`;
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save operator:", e);
  }
}

export function resetDefaultData(): {
  returns: CosmeticReturnItem[];
  transfers: JogjaToSoloTransferItem[];
} {
  saveReturns(INITIAL_RETURNS);
  saveJogjaTransfers(INITIAL_JOGJA_TRANSFERS);
  return { returns: INITIAL_RETURNS, transfers: INITIAL_JOGJA_TRANSFERS };
}

