import { RAW_PRODUCTS_CSV } from "./rawProductCatalog";

export interface ProvisionProductItem {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  normalPrice: number;
  provisionDiscountPct: number; // 70%
  provisionPrice: number; // 30% of normal price
}

// Function to detect Brand from Product Name
export function detectBrand(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("ABC BEAUTY")) return "ABC Beauty";
  if (upper.includes("GLOWLAB")) return "GlowLab";
  if (upper.includes("AURA BOTANICA")) return "Aura Botanica";
  if (upper.includes("VELVET COSMETICS")) return "Velvet Cosmetics";
  if (upper.includes("GENTLEMAN CARE")) return "Gentleman Care";
  if (upper.includes("DERMASAFE")) return "DermaSafe";
  if (upper.includes("PUREGLOW")) return "PureGlow";
  return "PT ABC";
}

// Function to detect Category from Product Name
export function detectCategory(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("LIP") || upper.includes("LIPSTICK") || upper.includes("LIP CREAM") || upper.includes("TINT") || upper.includes("BALM")) return "Lips";
  if (upper.includes("CUSHION") || upper.includes("FOUNDATION") || upper.includes("POWDER") || upper.includes("TWC") || upper.includes("CONCEALER") || upper.includes("BLUSH")) return "Complexion & Makeup";
  if (upper.includes("EYE") || upper.includes("MASCARA") || upper.includes("BROW") || upper.includes("LINER")) return "Eyes & Brows";
  if (upper.includes("SUNSCREEN") || upper.includes("SUN SHIELD") || upper.includes("SPF")) return "Sunscreen";
  if (upper.includes("SERUM") || upper.includes("AMPOULE") || upper.includes("ESSENCE")) return "Serum & Essence";
  if (upper.includes("CLEANSER") || upper.includes("FACE WASH") || upper.includes("FACIAL WASH") || upper.includes("FOAM") || upper.includes("MICELLAR") || upper.includes("SCRUB")) return "Cleanser & Wash";
  if (upper.includes("CREAM") || upper.includes("MOISTURIZER") || upper.includes("GEL") || upper.includes("LOTION") || upper.includes("TONER")) return "Skincare & Moisturizer";
  if (upper.includes("SHAMPOO") || upper.includes("CONDITIONER") || upper.includes("TONIC") || upper.includes("CREAMBATH") || upper.includes("POMADE")) return "Hair Care";
  if (upper.includes("BODY WASH") || upper.includes("BODY MIST") || upper.includes("DEODORANT") || upper.includes("HAND WASH") || upper.includes("PERFUME") || upper.includes("PARFUM") || upper.includes("TOILETTE")) return "Body & Fragrance";
  if (upper.includes("PACKAGE") || upper.includes("BUNDLING") || upper.includes("HAMPERS") || upper.includes("KIT")) return "Package / Bundle";
  if (upper.includes("SHIRT") || upper.includes("JERSEY") || upper.includes("JACKET") || upper.includes("PANTS") || upper.includes("BAG") || upper.includes("VEST")) return "Apparel & Merch";
  return "Kosmetik";
}

// Clean and parse currency string like "23.000", "23,000", "Rp 23.000", or "23000" into pure number
export function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  const str = priceStr.toString().trim();
  const cleaned = str.replace(/[^0-9]/g, "");
  const val = parseInt(cleaned, 10);
  return isNaN(val) ? 0 : val;
}

// Robust line parser that supports Comma (,), Tab (\t), Semicolon (;), and Space-separated formats
export function parseProductLine(line: string): { barcode: string; name: string; price: number } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.toLowerCase().startsWith("barcode") || trimmed.toLowerCase().startsWith("kode")) {
    return null;
  }

  // 1. Check for Tab (\t)
  if (trimmed.includes("\t")) {
    const tokens = trimmed.split("\t").map(t => t.trim()).filter(Boolean);
    if (tokens.length >= 2) {
      const barcode = tokens[0].replace(/[^0-9A-Za-z_-]/g, "");
      const name = tokens[1];
      const price = tokens.length >= 3 ? parsePrice(tokens[2]) : 0;
      if (barcode && name) return { barcode, name, price };
    }
  }

  // 2. Check for Semicolon (;)
  if (trimmed.includes(";")) {
    const tokens = trimmed.split(";").map(t => t.trim()).filter(Boolean);
    if (tokens.length >= 2) {
      const barcode = tokens[0].replace(/[^0-9A-Za-z_-]/g, "");
      const name = tokens[1];
      const price = tokens.length >= 3 ? parsePrice(tokens[2]) : 0;
      if (barcode && name) return { barcode, name, price };
    }
  }

  // 3. Check for Comma (,) with quoted CSV support
  if (trimmed.includes(",")) {
    const parts: string[] = [];
    let cur = "";
    let insideQuotes = false;
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        parts.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    parts.push(cur.trim());
    if (parts.length >= 2) {
      const barcode = parts[0].replace(/[^0-9A-Za-z_-]/g, "");
      const name = parts[1].replace(/^"|"$/g, "").trim();
      const price = parts.length >= 3 ? parsePrice(parts[2]) : 0;
      if (barcode && name) return { barcode, name, price };
    }
  }

  // 4. Space separated fallback (e.g., "8991001001018 ABC BEAUTY SERUM NIACINAMIDE 125.000")
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const barcode = words[0].replace(/[^0-9A-Za-z_-]/g, "");
    // Check if the last word is a price
    const lastWord = words[words.length - 1];
    const isLastWordPrice = /^[0-9.,]+$/.test(lastWord) && lastWord.replace(/[^0-9]/g, "").length >= 3;

    if (isLastWordPrice && words.length >= 3) {
      const price = parsePrice(lastWord);
      const name = words.slice(1, -1).join(" ");
      if (barcode && name) return { barcode, name, price };
    } else {
      const name = words.slice(1).join(" ");
      if (barcode && name) return { barcode, name, price: 0 };
    }
  }

  return null;
}

// Helper to merge catalog items while preserving multiple items with same barcode if names differ
export function mergeCatalogItems(
  baseItems: ProvisionProductItem[],
  newItems: ProvisionProductItem[]
): ProvisionProductItem[] {
  const map = new Map<string, ProvisionProductItem>();
  
  // Key by barcode + normalized name + normalPrice to preserve all product variants & packaging batches
  const makeKey = (item: ProvisionProductItem) =>
    `${item.barcode.toLowerCase().trim()}:::${item.name.toLowerCase().trim()}:::${item.normalPrice || 0}`;

  baseItems.forEach((p) => {
    if (p && p.barcode) {
      map.set(makeKey(p), p);
    }
  });

  newItems.forEach((p) => {
    if (p && p.barcode) {
      map.set(makeKey(p), p);
    }
  });

  return Array.from(map.values());
}

// Parse CSV text into array of ProvisionProductItem (retaining all items with same barcode)
export function parseProductsFromCSV(csvText: string): ProvisionProductItem[] {
  const lines = csvText.trim().split("\n");
  const seen = new Set<string>();
  const items: ProvisionProductItem[] = [];

  for (const line of lines) {
    const parsed = parseProductLine(line);
    if (!parsed) continue;

    const { barcode, name, price: normalPrice } = parsed;
    const uniqueKey = `${barcode.toLowerCase().trim()}:::${name.toLowerCase().trim()}:::${normalPrice}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    const provisionPrice = Math.round(normalPrice * 0.3); // 30% of normal price (diskon 70%)
    const brand = detectBrand(name);
    const category = detectCategory(name);

    items.push({
      barcode,
      name,
      brand,
      category,
      normalPrice,
      provisionDiscountPct: 70,
      provisionPrice,
    });
  }

  return items;
}

// Build initial catalog from the master raw CSV data
export const PROVISION_PRODUCTS_CATALOG: ProvisionProductItem[] = parseProductsFromCSV(RAW_PRODUCTS_CSV);

// Helper to sanitize barcode input (alphanumeric only)
export function cleanBarcode(str: string): string {
  if (!str) return "";
  return str.replace(/[^0-9a-zA-Z]/g, "").trim();
}

// Helper to load provision catalog including any additions from localStorage
export function loadProvisionCatalog(): ProvisionProductItem[] {
  try {
    const saved = localStorage.getItem("PT_ABC_PROVISION_FULL_CATALOG_V1");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeCatalogItems(PROVISION_PRODUCTS_CATALOG, parsed);
      }
    }
  } catch (e) {
    console.warn("Failed to load catalog from localStorage", e);
  }
  return PROVISION_PRODUCTS_CATALOG;
}

// Find a product by exact or partial barcode or SKU
export function findProductByBarcode(
  code: string,
  catalog?: ProvisionProductItem[]
): ProvisionProductItem | null {
  const cat = catalog || loadProvisionCatalog();
  const cleaned = cleanBarcode(code).toLowerCase();
  if (!cleaned) return null;

  // 1. Exact barcode match
  const exact = cat.find((p) => cleanBarcode(p.barcode).toLowerCase() === cleaned);
  if (exact) return exact;

  // 2. Partial barcode match (min 6 digits)
  if (cleaned.length >= 6) {
    const partial = cat.find((p) =>
      cleanBarcode(p.barcode).toLowerCase().includes(cleaned)
    );
    if (partial) return partial;
  }

  return null;
}

