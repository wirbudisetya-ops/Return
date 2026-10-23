import express from "express";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini SDK with User-Agent header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// ============================================================================
// SERVER-SIDE SHARED REAL-TIME DATA STORE (SHARED ACROSS ALL PHONES & PCS)
// ============================================================================
const DATA_FILE = path.join(process.cwd(), "shared-data-store.json");

interface SharedServerStore {
  returns: any[];
  jogjaTransfers: any[];
  updatedAt: string;
}

function loadSharedServerStore(): SharedServerStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.returns)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading shared data file:", err);
  }
  return {
    returns: [],
    jogjaTransfers: [],
    updatedAt: new Date().toISOString(),
  };
}

function saveSharedServerStore(store: SharedServerStore) {
  try {
    store.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing shared data file:", err);
  }
}

let sharedMemoryStore: SharedServerStore = loadSharedServerStore();

// SSE Broadcast Manager
type SSEClient = {
  id: string;
  res: express.Response;
};
let sseClientPool: SSEClient[] = [];

function broadcastToAllDevices(type: string, data: any) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  sseClientPool.forEach((client) => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // client connection dropped
    }
  });
}

// SSE Stream Endpoint: All devices (Phone & PC) connect to this
app.get("/api/live/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("\n");

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const newClient: SSEClient = { id: clientId, res };
  sseClientPool.push(newClient);

  // Send current state immediately on connection
  res.write(`data: ${JSON.stringify({ type: "INIT", data: sharedMemoryStore })}\n\n`);

  req.on("close", () => {
    sseClientPool = sseClientPool.filter((c) => c.id !== clientId);
  });
});

// GET Current State Endpoint
app.get("/api/live/data", (_req, res) => {
  res.json({
    success: true,
    data: sharedMemoryStore,
  });
});

// SYNC/SEED INITIAL DATA
app.post("/api/live/sync-all", (req, res) => {
  const { returns, jogjaTransfers } = req.body;
  if (Array.isArray(returns) && (sharedMemoryStore.returns.length === 0 || req.query.force === "true")) {
    sharedMemoryStore.returns = returns;
  }
  if (Array.isArray(jogjaTransfers) && (sharedMemoryStore.jogjaTransfers.length === 0 || req.query.force === "true")) {
    sharedMemoryStore.jogjaTransfers = jogjaTransfers;
  }
  saveSharedServerStore(sharedMemoryStore);
  broadcastToAllDevices("SYNC_ALL", sharedMemoryStore);
  res.json({ success: true, store: sharedMemoryStore });
});

// UPSERT RETURN ITEM
app.post("/api/live/return-item", (req, res) => {
  const item = req.body;
  if (!item || !item.id) {
    return res.status(400).json({ error: "Item retur tidak valid" });
  }

  const idx = sharedMemoryStore.returns.findIndex((r) => r.id === item.id);
  if (idx >= 0) {
    sharedMemoryStore.returns[idx] = item;
  } else {
    sharedMemoryStore.returns = [item, ...sharedMemoryStore.returns];
  }

  saveSharedServerStore(sharedMemoryStore);
  broadcastToAllDevices("RETURN_UPDATED", { item, returns: sharedMemoryStore.returns });
  res.json({ success: true, item, total: sharedMemoryStore.returns.length });
});

// SAVE ALL RETURNS (BATCH)
app.post("/api/live/returns-batch", (req, res) => {
  const { returns } = req.body;
  if (Array.isArray(returns)) {
    sharedMemoryStore.returns = returns;
    saveSharedServerStore(sharedMemoryStore);
    broadcastToAllDevices("RETURNS_REPLACED", sharedMemoryStore.returns);
  }
  res.json({ success: true, total: sharedMemoryStore.returns.length });
});

// UPSERT JOGJA TRANSFER
app.post("/api/live/jogja-transfer", (req, res) => {
  const transfer = req.body;
  if (!transfer || !transfer.id) {
    return res.status(400).json({ error: "Data transfer tidak valid" });
  }

  const idx = sharedMemoryStore.jogjaTransfers.findIndex((t) => t.id === transfer.id);
  if (idx >= 0) {
    sharedMemoryStore.jogjaTransfers[idx] = transfer;
  } else {
    sharedMemoryStore.jogjaTransfers = [transfer, ...sharedMemoryStore.jogjaTransfers];
  }

  saveSharedServerStore(sharedMemoryStore);
  broadcastToAllDevices("TRANSFER_UPDATED", { transfer, transfers: sharedMemoryStore.jogjaTransfers });
  res.json({ success: true, transfer, total: sharedMemoryStore.jogjaTransfers.length });
});

// SAVE ALL JOGJA TRANSFERS (BATCH)
app.post("/api/live/jogja-transfers-batch", (req, res) => {
  const { transfers } = req.body;
  if (Array.isArray(transfers)) {
    sharedMemoryStore.jogjaTransfers = transfers;
    saveSharedServerStore(sharedMemoryStore);
    broadcastToAllDevices("TRANSFERS_REPLACED", sharedMemoryStore.jogjaTransfers);
  }
  res.json({ success: true, total: sharedMemoryStore.jogjaTransfers.length });
});

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Download full project source archive for Codespaces / local developers
app.get("/api/project-archive.tar.gz", (_req, res) => {
  try {
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Disposition", 'attachment; filename="sistem-retur-kosmetik.tar.gz"');
    const tarBuffer = execSync("tar --exclude=node_modules --exclude=.git --exclude=dist -czf - .", {
      cwd: process.cwd(),
      maxBuffer: 50 * 1024 * 1024,
    });
    res.send(tarBuffer);
  } catch (err: any) {
    res.status(500).json({ error: "Gagal membuat arsip proyek", details: err?.message });
  }
});

// AI Parser for Return Slips / Chat Complaints / Invoices
app.post("/api/ai/parse-return", async (req, res) => {
  try {
    const { text, imageBase64, mimeType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback rule-based parsing if no API key
      const fallbackResult = generateRuleBasedReturnParse(text || "");
      return res.json({
        success: true,
        data: fallbackResult,
        source: "rule-based-fallback",
      });
    }

    const systemInstruction = `Anda adalah asisten AI khusus Operator Retur & Quality Control di pabrik/perusahaan kosmetik ternama Indonesia.
Tugas Anda adalah mengekstrak data pengembalian barang secara terstruktur, akurat, dan menganalisis risiko higienitas kosmetik serta kelayakan retur berdasarkan regulasi BPOM & standar industri kosmetik.

Perhatikan kategori produk kosmetik umum:
- Skincare: Serum, Toner, Sunscreen, Moisturizer, Facial Wash, Essence, Ampoule.
- Makeup: Cushion, Foundation, Lip Tint, Lip Cream, Mascara, Eyeshadow, Blush On, Compact Powder.
- Bodycare & Haircare: Body Lotion, Body Wash, Hair Oil, Shampoo.

Alasan Retur yang sering terjadi:
- "Pecah / Tumpah / Bocor (Kerusakan Pengiriman)"
- "Segel Rusak / Terbuka Sebelum Diterima"
- "Salah Kirim Varian / Shade Warna"
- "Alergi / Iritasi Kulit Customer"
- "Kedaluwarsa / Batch Expired"
- "Tekstur Menggumpal / Bau Asam / Berubah Warna (Oksidasi)"
- "Paket Tidak Sampai / Ditolak Saat COD"
- "Indikasi Fraud / Botol Kosong / Barang Palsu Ditukar"

Analisis juga Rekomendasi Disposisi:
- "Restock (Segel Aman & Steril)"
- "Karantina QC (Perlu Uji Lab / Retensi)"
- "Rework / Ganti Dus Luar"
- "Pemusnahan (Limbah B3 Kosmetik Rusak/Tercemar)"
- "Retur ke Pabrik/Vendor (Cacat Produksi Massal)"`;

    let contents: any;

    const schemaDefinition = {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: "Nama lengkap pembeli/customer" },
        customerPhone: { type: Type.STRING, description: "Nomor WhatsApp/telepon customer jika ada" },
        channel: {
          type: Type.STRING,
          description: "Saluran pembelian (Shopee, Tokopedia, TikTok Shop, Toko Offline, Lazada, Website Resmi)",
        },
        orderId: { type: Type.STRING, description: "Nomor pesanan / No. Invoice" },
        trackingNumber: { type: Type.STRING, description: "Nomor Resi pengembalian (J&T, SiCepat, JNE, SPX, Anteraja)" },
        courier: { type: Type.STRING, description: "Ekspedisi logistik yang digunakan" },
        productName: { type: Type.STRING, description: "Nama produk kosmetik lengkap beserta merk/tipe" },
        shadeOrVariant: { type: Type.STRING, description: "Shade warna, varian aroma, atau ukuran ml/gr" },
        sku: { type: Type.STRING, description: "Kode SKU produk jika tertera atau diperkirakan" },
        quantity: { type: Type.INTEGER, description: "Jumlah pcs barang yang diretur" },
        pricePerUnit: { type: Type.NUMBER, description: "Perkiraan harga satuan produk dalam Rupiah" },
        batchNumber: { type: Type.STRING, description: "Nomor batch produksi atau kode lot (contoh: B240801, LOT2024)" },
        expiryDate: { type: Type.STRING, description: "Tanggal kedaluwarsa produk format YYYY-MM-DD jika ada" },
        returnReason: { type: Type.STRING, description: "Alasan utama retur dari customer" },
        customerNotes: { type: Type.STRING, description: "Keluhan atau kronologi detail dari customer" },
        hygieneRisk: {
          type: Type.STRING,
          description: "Tingkat risiko higienitas kosmetik (Rendah / Sedang / Tinggi / Kritis)",
        },
        suggestedDisposition: {
          type: Type.STRING,
          description: "Rekomendasi tindakan barang (Restock / Karantina QC / Rework Dus / Pemusnahan Limbah / Retur Pabrik)",
        },
        recommendedSolution: {
          type: Type.STRING,
          description: "Solusi untuk customer (Refund Penuh, Tukar Shade Baru, Kirim Unit Baru Bebas Ongkir, Tolak Retur)",
        },
        operatorSummary: { type: Type.STRING, description: "Ringkasan ringkas 1-2 kalimat untuk catatan operator retur" },
      },
      required: [
        "customerName",
        "channel",
        "orderId",
        "productName",
        "quantity",
        "returnReason",
        "suggestedDisposition",
        "recommendedSolution",
        "operatorSummary",
      ],
    };

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      contents = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: text
              ? `Ekstrak data retur kosmetik dari foto ini beserta teks tambahan ini: ${text}`
              : "Ekstrak seluruh informasi dokumen/resi/chat/foto retur kosmetik ini menjadi data terstruktur.",
          },
        ],
      };
    } else {
      contents = `Tolong ekstrak data retur kosmetik berikut ke dalam format data terstruktur:\n\n${text}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schemaDefinition,
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedData, source: "gemini-ai" });
  } catch (error: any) {
    console.error("AI parse return error:", error);
    // Fallback on error so the user never gets stuck
    const fallbackResult = generateRuleBasedReturnParse(req.body.text || "");
    res.json({
      success: true,
      data: fallbackResult,
      source: "rule-based-fallback",
      warning: error.message,
    });
  }
});

// AI Batch Defect & Anomaly Analysis Endpoint
app.post("/api/ai/analyze-batch-defects", async (req, res) => {
  try {
    const { returnsData } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        data: {
          summary: "Analisis batch offline: Terdeteksi konsentrasi retur pada produk botol pompa dan shade terpopuler.",
          riskBatches: ["B240801", "B240722"],
          recommendations: [
            "Periksa seal induction pada botol serum 30ml.",
            "Lakukan kalibrasi timbangan isi netto di lini pengisian.",
          ],
        },
      });
    }

    const prompt = `Berikut data retur kosmetik terbaru:\n${JSON.stringify(returnsData, null, 2)}\n\nLakukan analisis QC Kosmetik mendalam:
1. Temukan apakah ada pola batch defect (misal batch tertentu banyak bocor/rusak/berubah aroma).
2. Temukan akar masalah (packaging supplier, seal foil, oksidasi bahan aktif, ekspedisi logistik, atau human error packing gudang).
3. Berikan rekomendasi mitigasi untuk operator gudang dan tim formulasi/R&D.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah Lead Quality Assurance Kosmetik dengan sertifikasi CPKB (Cara Pembuatan Kosmetika yang Baik).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Ringkasan temuan utama batch retur" },
            riskBatches: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar kode batch yang teridentifikasi berisiko tinggi / cacat berulang",
            },
            suspectedRootCause: { type: Type.STRING, description: "Dugaan akar penyebab masalah" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Langkah-langkah perbaikan konkret untuk operator & tim QC",
            },
            severityLevel: {
              type: Type.STRING,
              description: "Tingkat keparahan isu kualitas: Normal / Perhatian / Kritis (Recall)",
            },
          },
          required: ["summary", "riskBatches", "suspectedRootCause", "recommendations", "severityLevel"],
        },
      },
    });

    const analysis = JSON.parse(response.text || "{}");
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("Batch analysis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper for offline / fallback parsing
function generateRuleBasedReturnParse(text: string) {
  const clean = text.trim();
  const phoneMatch = clean.match(/(?:08|\+628)[0-9\s-]{8,13}/);
  const resiMatch = clean.match(/(?:JP|JX|SPX|TKP|NLID|JT|SOC)[0-9A-Z]{8,15}/i) || clean.match(/[0-9]{12,16}/);
  const orderMatch = clean.match(/(?:INV|ORD|24[0-9]{8,12}|SHOPEE-[0-9A-Z]+)/i);
  const batchMatch = clean.match(/(?:BATCH|LOT|KODE|B)[0-9]{5,8}/i);

  let channel = "Shopee";
  if (/tokopedia|tokped/i.test(clean)) channel = "Tokopedia";
  else if (/tiktok/i.test(clean)) channel = "TikTok Shop";
  else if (/lazada/i.test(clean)) channel = "Lazada";
  else if (/offline|store|toko/i.test(clean)) channel = "Toko Offline";

  let productName = "Glow Brightening Niacinamide Serum 30ml";
  let shade = "Original";
  if (/lip|tint|matte/i.test(clean)) {
    productName = "Velvet Velvet Lip Tint 4.5ml";
    shade = "Shade 03 Berry Rose";
  } else if (/cushion|bb cream/i.test(clean)) {
    productName = "Flawless Radiant Cushion SPF 35";
    shade = "Shade 02 Natural Beige";
  } else if (/sunscreen|uv/i.test(clean)) {
    productName = "Ultra Light UV Watery Sunscreen SPF 50+ PA++++";
    shade = "50ml";
  } else if (/moisturizer|ceramide/i.test(clean)) {
    productName = "Barrier Calm Ceramide Moisturizer Gel";
    shade = "50gr";
  }

  let reason = "Pecah / Tumpah dalam Pengiriman";
  let disposition = "Pemusnahan (Limbah B3 Rusak)";
  let solution = "Kirim Unit Pengganti Baru Bebas Ongkir";
  let hygiene = "Tinggi";

  if (/salah shade|salah warna|salah varian|salah kirim/i.test(clean)) {
    reason = "Salah Varian / Shade Warna";
    disposition = "Restock (Jika Segel Belum Dibuka)";
    solution = "Tukar Shade yang Benar";
    hygiene = "Rendah";
  } else if (/alergi|iritasi|merah|gatal/i.test(clean)) {
    reason = "Alergi / Iritasi Kulit Customer";
    disposition = "Karantina QC (Uji Patch & Sampel Retensi)";
    solution = "Refund Penuh 100% & Konsultasi Tim Ahli";
    hygiene = "Sedang";
  } else if (/segel rusak|terbuka/i.test(clean)) {
    reason = "Segel Rusak / Terbuka";
    disposition = "Pemusnahan (Higienitas Tidak Terjamin)";
    solution = "Kirim Unit Baru Tersegel";
    hygiene = "Tinggi";
  } else if (/expired|kedaluwarsa/i.test(clean)) {
    reason = "Kedaluwarsa / Batch Expired";
    disposition = "Retur ke Pabrik/Vendor";
    solution = "Refund Dana Penuh";
    hygiene = "Tinggi";
  }

  return {
    customerName: clean.split("\n")[0]?.replace(/nama[:\s-]*/i, "").slice(0, 30) || "Siti Rahmawati",
    customerPhone: phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : "081298765432",
    channel,
    orderId: orderMatch ? orderMatch[0] : "INV/2026/CSM/89412",
    trackingNumber: resiMatch ? resiMatch[0] : "SPXID04892187391",
    courier: /jne/i.test(clean) ? "JNE Express" : /j&t|jnt/i.test(clean) ? "J&T Express" : /sicepat/i.test(clean) ? "SiCepat" : "Shopee Xpress",
    productName,
    shadeOrVariant: shade,
    sku: "CSM-SKN-089",
    quantity: 1,
    pricePerUnit: 129000,
    batchNumber: batchMatch ? batchMatch[0] : "B240815",
    expiryDate: "2027-11-30",
    returnReason: reason,
    customerNotes: clean.slice(0, 200) || "Customer melaporkan produk diterima dalam kondisi tidak sesuai.",
    hygieneRisk: hygiene,
    suggestedDisposition: disposition,
    recommendedSolution: solution,
    operatorSummary: `Retur diproses otomatis: ${productName} (${reason}). Disposisi disarankan: ${disposition}.`,
  };
}

// Vite middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cosmetics Returns Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
