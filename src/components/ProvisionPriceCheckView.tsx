import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ScanLine,
  Barcode,
  Search,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Plus,
  Minus,
  Calculator,
  Upload,
  Layers,
  Check,
  Tag,
  ShoppingBag,
  FileText,
  FileSpreadsheet,
  Database,
  X,
  RefreshCw,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import {
  PROVISION_PRODUCTS_CATALOG,
  ProvisionProductItem,
  parseProductsFromCSV,
  mergeCatalogItems,
  detectBrand,
  detectCategory,
  parsePrice,
} from "../data/provisionProducts";

const LOCAL_STORAGE_CATALOG_KEY = "PT_ABC_PROVISION_FULL_CATALOG_V1";

export const ProvisionPriceCheckView: React.FC = () => {
  // Load catalog from localStorage and merge with master built-in catalog
  const [catalog, setCatalog] = useState<ProvisionProductItem[]>(() => {
    try {
      // Purge old storage keys
      [
        "PARAMA_PROVISION_FULL_CATALOG_V9",
        "PARAMA_PROVISION_FULL_CATALOG_V8",
        "PARAMA_PROVISION_FULL_CATALOG_V7",
        "PARAMA_PROVISION_FULL_CATALOG_V6",
        "PARAMA_PROVISION_FULL_CATALOG_V5",
        "PARAMA_PROVISION_FULL_CATALOG_V4",
        "PARAMA_PROVISION_FULL_CATALOG_V3",
        "PARAMA_PROVISION_FULL_CATALOG_V2",
      ].forEach((k) => localStorage.removeItem(k));

      const saved = localStorage.getItem(LOCAL_STORAGE_CATALOG_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeCatalogItems(PROVISION_PRODUCTS_CATALOG, parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load custom catalog from localStorage", e);
    }
    return PROVISION_PRODUCTS_CATALOG;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProvisionProductItem | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<ProvisionProductItem[]>([]);
  const [unitCount, setUnitCount] = useState<number>(1);
  const [recentScans, setRecentScans] = useState<ProvisionProductItem[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("Semua");
  const [onlyMultiBarcodeFilter, setOnlyMultiBarcodeFilter] = useState<boolean>(false);
  const [multiGroupSearch, setMultiGroupSearch] = useState<string>("");

  // State for Paste / Bulk Import Modal
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedCSVText, setPastedCSVText] = useState("");
  const [pasteSummary, setPasteSummary] = useState<string | null>(null);

  // State for Quick Manual Register if barcode is not found
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  // State for Adding Variant to an existing Barcode
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [variantBarcode, setVariantBarcode] = useState("");
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantMessage, setVariantMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save catalog changes to localStorage
  const saveCatalogToStorage = (updatedList: ProvisionProductItem[]) => {
    setCatalog(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_CATALOG_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.error("Failed to save catalog into localStorage", err);
    }
  };

  // Play beep sound on scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1450, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context not allowed without interaction", e);
    }
  };

  // Clean barcode string for robust searching
  const cleanBarcode = (str: string) => {
    return str.replace(/[^0-9a-zA-Z]/g, "").trim();
  };

  // Get all items sharing a specific barcode
  const getItemsForBarcode = (barcode: string) => {
    const target = cleanBarcode(barcode).toLowerCase();
    if (!target) return [];
    return catalog.filter((p) => cleanBarcode(p.barcode).toLowerCase() === target);
  };

  // Search or Scan handler
  const handlePerformScan = (codeOrName: string) => {
    const rawInput = codeOrName.trim();
    if (!rawInput) return;

    const cleanedCode = cleanBarcode(rawInput).toLowerCase();
    const query = rawInput.toLowerCase();

    // 1. Exact matches on cleaned barcode
    const exactMatches = catalog.filter(
      (p) => cleanBarcode(p.barcode).toLowerCase() === cleanedCode
    );

    if (exactMatches.length > 0) {
      setMatchedProducts(exactMatches);
      setSelectedProduct(exactMatches[0]);
      setIsNotFound(false);
      playBeep();
      if (exactMatches.length > 1) {
        setScanMessage(`Terdeteksi ${exactMatches.length} Item Berbeda dengan Barcode "${exactMatches[0].barcode}"`);
      } else {
        setScanMessage(`Berhasil Terbaca: ${exactMatches[0].name}`);
      }
      setTimeout(() => setScanMessage(null), 5000);

      // Add to recent scans list without duplicate key
      setRecentScans((prev) => {
        const remaining = prev.filter(
          (p) => !exactMatches.some((m) => m.barcode === p.barcode && m.name === p.name && m.normalPrice === p.normalPrice)
        );
        return [...exactMatches, ...remaining].slice(0, 15);
      });
      return;
    }

    // 2. Partial barcode or partial name
    const partialMatches = catalog.filter(
      (p) =>
        cleanBarcode(p.barcode).toLowerCase().includes(cleanedCode) ||
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
    );

    if (partialMatches.length > 0) {
      setMatchedProducts(partialMatches);
      setSelectedProduct(partialMatches[0]);
      setIsNotFound(false);
      playBeep();
      if (partialMatches.length > 1) {
        setScanMessage(`Ditemukan ${partialMatches.length} Produk yang Cocok`);
      } else {
        setScanMessage(`Berhasil Terbaca: ${partialMatches[0].name}`);
      }
      setTimeout(() => setScanMessage(null), 5000);

      setRecentScans((prev) => {
        const remaining = prev.filter(
          (p) => !partialMatches.some((m) => m.barcode === p.barcode && m.name === p.name && m.normalPrice === p.normalPrice)
        );
        return [...partialMatches, ...remaining].slice(0, 15);
      });
    } else {
      setMatchedProducts([]);
      setSelectedProduct(null);
      setIsNotFound(true);
      setManualName("");
      setManualPrice("");
      setScanMessage(`Barcode "${rawInput}" belum ada di database. Silakan isi nama & harga di bawah untuk langsung hitung diskon 70% dan disimpan.`);
    }
  };

  // Real-time detection when typing full barcode (e.g. 10+ digits or exact barcode)
  useEffect(() => {
    const cleaned = cleanBarcode(searchQuery);
    if (cleaned.length >= 8) {
      const exactMatches = catalog.filter(
        (p) => cleanBarcode(p.barcode).toLowerCase() === cleaned.toLowerCase()
      );
      if (exactMatches.length > 0) {
        setMatchedProducts(exactMatches);
        if (!selectedProduct || !exactMatches.some(m => m.name === selectedProduct.name && m.barcode === selectedProduct.barcode)) {
          setSelectedProduct(exactMatches[0]);
        }
        setIsNotFound(false);
      }
    }
  }, [searchQuery, catalog]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePerformScan(searchQuery);
  };

  // Add a newly registered product manually
  const handleSaveManualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeVal = cleanBarcode(searchQuery) || `MANUAL-${Date.now()}`;
    const nameVal = manualName.trim();
    const priceNum = parsePrice(manualPrice);

    if (!nameVal || priceNum <= 0) {
      alert("Harap masukkan nama produk dan harga normal yang valid.");
      return;
    }

    const newItem: ProvisionProductItem = {
      barcode: barcodeVal,
      name: nameVal,
      brand: detectBrand(nameVal),
      category: detectCategory(nameVal),
      normalPrice: priceNum,
      provisionDiscountPct: 70,
      provisionPrice: Math.round(priceNum * 0.3),
    };

    const updated = mergeCatalogItems(catalog, [newItem]);
    saveCatalogToStorage(updated);

    const sameBarcodeItems = updated.filter(
      (p) => cleanBarcode(p.barcode).toLowerCase() === cleanBarcode(newItem.barcode).toLowerCase()
    );
    setMatchedProducts(sameBarcodeItems.length > 0 ? sameBarcodeItems : [newItem]);
    setSelectedProduct(newItem);
    setIsNotFound(false);
    playBeep();
    setRecentScans((prev) => [newItem, ...prev.filter((p) => p.name !== newItem.name || p.barcode !== newItem.barcode)].slice(0, 15));
    setScanMessage(`Produk "${newItem.name}" berhasil disimpan ke database.`);
    setTimeout(() => setScanMessage(null), 4000);
  };

  // Handle bulk text pasting
  const handleProcessBulkPaste = () => {
    if (!pastedCSVText.trim()) {
      alert("Harap tempel teks CSV / data Excel terlebih dahulu.");
      return;
    }

    const parsed = parseProductsFromCSV(pastedCSVText);
    if (parsed.length === 0) {
      alert("Format data tidak terbaca. Pastikan format: Barcode, Nama Produk, Harga");
      return;
    }

    const updated = mergeCatalogItems(catalog, parsed);
    saveCatalogToStorage(updated);

    setPasteSummary(`Sukses membaca ${parsed.length} baris! Total database saat ini: ${updated.length} produk.`);
    setTimeout(() => {
      setIsPasteModalOpen(false);
      setPastedCSVText("");
      setPasteSummary(null);
    }, 2000);
  };

  // Handle adding variant to an existing or custom barcode
  const handleAddVariantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeVal = cleanBarcode(variantBarcode);
    const nameVal = variantName.trim();
    const priceNum = parsePrice(variantPrice);

    if (!barcodeVal || !nameVal || priceNum <= 0) {
      alert("Harap lengkapi nomor barcode, nama variasi produk, dan harga normal yang valid.");
      return;
    }

    const newItem: ProvisionProductItem = {
      barcode: barcodeVal,
      name: nameVal,
      brand: detectBrand(nameVal),
      category: detectCategory(nameVal),
      normalPrice: priceNum,
      provisionDiscountPct: 70,
      provisionPrice: Math.round(priceNum * 0.3),
    };

    const updated = mergeCatalogItems(catalog, [newItem]);
    saveCatalogToStorage(updated);

    const sameBarcodeItems = updated.filter(
      (p) => cleanBarcode(p.barcode).toLowerCase() === barcodeVal.toLowerCase()
    );
    setMatchedProducts(sameBarcodeItems);
    setSelectedProduct(newItem);
    setSearchQuery(barcodeVal);
    playBeep();

    setVariantMessage(`Berhasil menambahkan varian "${nameVal}" pada barcode ${barcodeVal}. Total variasi: ${sameBarcodeItems.length} item.`);
    setTimeout(() => {
      setIsAddVariantModalOpen(false);
      setVariantName("");
      setVariantPrice("");
      setVariantMessage(null);
    }, 1800);
  };

  // Handle CSV file upload to add/update catalog
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const parsed = parseProductsFromCSV(text);
        if (parsed.length > 0) {
          const updated = mergeCatalogItems(catalog, parsed);
          saveCatalogToStorage(updated);
          alert(`Sukses mengimpor ${parsed.length} produk baru! Total database saat ini: ${updated.length} produk.`);
        }
      }
    };
    reader.readAsText(file);
  };

  // Reset database back to default
  const handleResetToDefault = () => {
    if (window.confirm("Kembalikan database ke daftar master bawaan?")) {
      localStorage.removeItem(LOCAL_STORAGE_CATALOG_KEY);
      setCatalog(PROVISION_PRODUCTS_CATALOG);
      setMatchedProducts([]);
      setSelectedProduct(null);
      alert("Database dikembalikan ke katalog master bawaan.");
    }
  };

  // Start Real Camera for live visual scanning
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Izin kamera diperlukan untuk memindai barcode. Gunakan ketik manual atau Barcode Scanner USB/Bluetooth.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Format currency IDR
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Brands list for filter chips
  const brandsList = [
    "Semua",
    "ABC Beauty",
    "GlowLab",
    "Aura Botanica",
    "Velvet Cosmetics",
    "Gentleman Care",
    "DermaSafe",
    "PureGlow",
    "PT ABC",
  ];

  // Filtered catalog for suggestions (prioritize exact barcode matches, then partial matches)
  const matchingSuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];

    const cleanedQ = cleanBarcode(q).toLowerCase();
    const queryLower = q.toLowerCase();

    // 1. Exact barcode items first
    const exactBarcodeMatches = catalog.filter(
      (p) => cleanBarcode(p.barcode).toLowerCase() === cleanedQ
    );

    // 2. Partial matches
    const otherMatches = catalog.filter(
      (p) =>
        cleanBarcode(p.barcode).toLowerCase() !== cleanedQ &&
        (cleanBarcode(p.barcode).toLowerCase().includes(cleanedQ) ||
          p.name.toLowerCase().includes(queryLower) ||
          p.brand.toLowerCase().includes(queryLower))
    );

    return [...exactBarcodeMatches, ...otherMatches].slice(0, 15);
  }, [searchQuery, catalog]);

  // Catalog items filtered by brand filter and multi-barcode filter
  const filteredCatalogList = useMemo(() => {
    // Count occurrences of each barcode
    const barcodeCounts = new Map<string, number>();
    catalog.forEach((item) => {
      const bc = cleanBarcode(item.barcode).toLowerCase();
      barcodeCounts.set(bc, (barcodeCounts.get(bc) || 0) + 1);
    });

    return catalog.filter((item) => {
      if (selectedBrandFilter !== "Semua" && item.brand.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
        return false;
      }
      if (onlyMultiBarcodeFilter) {
        const bc = cleanBarcode(item.barcode).toLowerCase();
        if ((barcodeCounts.get(bc) || 0) <= 1) return false;
      }
      return true;
    });
  }, [catalog, selectedBrandFilter, onlyMultiBarcodeFilter]);

  // All barcodes that have 2 or more distinct products / variations
  const multiBarcodeGroups = useMemo(() => {
    const map = new Map<string, ProvisionProductItem[]>();
    catalog.forEach((item) => {
      const bc = cleanBarcode(item.barcode);
      if (!bc) return;
      if (!map.has(bc)) {
        map.set(bc, []);
      }
      map.get(bc)!.push(item);
    });

    const groups: { barcode: string; brand: string; category: string; items: ProvisionProductItem[] }[] = [];
    map.forEach((items, barcode) => {
      if (items.length > 1) {
        groups.push({
          barcode,
          brand: items[0].brand,
          category: items[0].category,
          items,
        });
      }
    });

    return groups.sort((a, b) => b.items.length - a.items.length);
  }, [catalog]);

  // Filtered multi barcode groups based on multiGroupSearch
  const filteredMultiBarcodeGroups = useMemo(() => {
    const q = multiGroupSearch.trim().toLowerCase();
    if (!q) return multiBarcodeGroups;
    return multiBarcodeGroups.filter((g) => {
      if (g.barcode.toLowerCase().includes(q)) return true;
      if (g.brand.toLowerCase().includes(q)) return true;
      return g.items.some((it) => it.name.toLowerCase().includes(q));
    });
  }, [multiBarcodeGroups, multiGroupSearch]);

  // Active items for the currently inspected barcode (all items sharing this barcode in database)
  const activeBarcodeItems = useMemo(() => {
    const targetBc = selectedProduct?.barcode || (matchedProducts.length > 0 ? matchedProducts[0].barcode : "");
    if (!targetBc) return matchedProducts;
    const allForBc = getItemsForBarcode(targetBc);
    return allForBc.length > 0 ? allForBc : matchedProducts;
  }, [selectedProduct, matchedProducts, catalog]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-emerald-500/20 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Database Aktif: {catalog.length} Produk Master Tersimpan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Cek Harga Provisi (-70%)</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                PT ABC
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Scan barcode produk atau ketik nomor baris data Anda. Sistem otomatis menghitung potongan <strong>70%</strong> dan menampilkan <strong>Harga Bersih Provisi (30% dari normal)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Paste Bulk Data Button */}
            <button
              type="button"
              onClick={() => setIsPasteModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-teal-700/80 hover:bg-teal-600 border border-teal-500/50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Tempel / Paste Ribuan Baris Data Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>+ Tempel Data Excel ({catalog.length})</span>
            </button>

            {/* Import CSV Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Upload File CSV"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Upload File</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Suara Beep Aktif" : "Suara Beep Mati"}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? "Beep Aktif" : "Mute"}</span>
            </button>

            {/* Camera Trigger */}
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>Kamera Barcode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CameraOff className="w-4 h-4 stroke-[2.5]" />
                <span>Tutup Kamera</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Camera Scanner Viewport (When Active) */}
      {isCameraActive && (
        <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-4 text-white shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Kamera Barcode Scanner Aktif
              </span>
            </div>
            <button
              onClick={stopCamera}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Target Laser Overlay */}
            <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 m-6 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse" />
            </div>
            <div className="absolute bottom-2 text-center w-full text-[11px] bg-black/60 py-1 text-slate-300">
              Arahkan garis merah tepat ke kode barcode produk
            </div>
          </div>
        </div>
      )}

      {/* Brand Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">
          Filter Brand:
        </span>
        {brandsList.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setSelectedBrandFilter(brand)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
              selectedBrandFilter === brand
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* Scan Input & Search Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <form onSubmit={handleFormSubmit}>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Ketik Barcode / Nama Barang / Tembak Scanner Gun
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: 8993137576000 atau ketik nama produk..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Cek Harga (-70%)</span>
            </button>
          </div>
        </form>

        {/* Live Search Autocomplete Suggestions */}
        {matchingSuggestions.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 divide-y divide-slate-100">
            <div className="text-[11px] font-bold text-slate-500 px-2 pt-1 uppercase flex items-center justify-between">
              <span>Rekomendasi Produk Ditemukan ({matchingSuggestions.length}):</span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk langsung periksa harga provisi</span>
            </div>
            {matchingSuggestions.map((prod, idx) => {
              const sisterItems = getItemsForBarcode(prod.barcode);
              const isMulti = sisterItems.length > 1;

              return (
                <div
                  key={`${prod.barcode}-${prod.name}-${idx}`}
                  onClick={() => {
                    if (sisterItems.length > 0) {
                      setMatchedProducts(sisterItems);
                    } else {
                      setMatchedProducts([prod]);
                    }
                    setSelectedProduct(prod);
                    setSearchQuery(prod.barcode);
                    playBeep();
                  }}
                  className="p-2.5 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors group"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-950">{prod.name}</span>
                        {isMulti && (
                          <span className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5 text-amber-700" />
                            {sisterItems.length} Item Se-Barcode
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">Barcode: {prod.barcode}</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-slate-600">{prod.brand}</span>
                        <span>&bull;</span>
                        <span>{prod.category}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400 line-through mr-1.5 text-xs">
                      {formatIDR(prod.normalPrice)}
                    </span>
                    <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                      {formatIDR(prod.provisionPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scan Status Banner */}
        {scanMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              isNotFound
                ? "bg-amber-50 text-amber-900 border border-amber-200"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            {isNotFound ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{scanMessage}</span>
          </div>
        )}

        {/* INLINE QUICK ADD / MANUAL CALCULATOR FORM (WHEN BARCODE IS NOT FOUND) */}
        {isNotFound && searchQuery.trim() && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4 sm:p-5 mt-3 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              <span>Input Cepat Produk & Hitung Diskon 70%</span>
            </div>
            <p className="text-xs text-amber-800">
              Barcode <strong>{searchQuery}</strong> belum tersimpan. Masukkan nama barang dan harga normal resmi untuk langsung dihitung dan disimpan otomatis ke database:
            </p>

            <form onSubmit={handleSaveManualProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nama Produk (cth: ABC Beauty Hydra Sunscreen 40ML)"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="Harga Normal (cth: 45000)"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div className="sm:col-span-3 flex items-center justify-between gap-3 pt-1">
                {manualPrice && parsePrice(manualPrice) > 0 ? (
                  <div className="text-xs text-emerald-800 font-bold">
                    Estimasi Provisi (30%):{" "}
                    <span className="text-sm font-black text-emerald-700 ml-1">
                      {formatIDR(Math.round(parsePrice(manualPrice) * 0.3))}
                    </span>
                  </div>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow cursor-pointer ml-auto"
                >
                  Hitung & Simpan ke Database
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MULTIPLE ITEMS DETECTED SECTION (IF BARCODE HAS 2+ MATCHING ITEMS) */}
      {activeBarcodeItems.length > 1 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/40 border-2 border-amber-400 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Terdeteksi {activeBarcodeItems.length} Item dengan Barcode yang Sama
                  </h3>
                  <span className="bg-amber-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                    Barcode: {activeBarcodeItems[0].barcode}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Barcode ini terdaftar untuk {activeBarcodeItems.length} varian / item berbeda di database. Semua item beserta harga normal &amp; harga provisinya (-70%) ditampilkan di bawah:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setVariantBarcode(activeBarcodeItems[0].barcode);
                  setVariantName("");
                  setVariantPrice("");
                  setIsAddVariantModalOpen(true);
                }}
                className="text-xs font-bold text-slate-800 bg-white hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Tambah Variasi Item</span>
              </button>
              <div className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300 shrink-0 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Klik kartu item untuk fokus kalkulator</span>
              </div>
            </div>
          </div>

          {/* All Items Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {activeBarcodeItems.map((prod, idx) => {
              const isSelected =
                selectedProduct?.name === prod.name &&
                selectedProduct?.barcode === prod.barcode &&
                selectedProduct?.normalPrice === prod.normalPrice;

              return (
                <div
                  key={`${prod.barcode}-${prod.name}-${idx}`}
                  onClick={() => {
                    setSelectedProduct(prod);
                    playBeep();
                  }}
                  className={`rounded-2xl p-4 transition-all cursor-pointer relative flex flex-col justify-between border-2 ${
                    isSelected
                      ? "bg-white border-emerald-500 shadow-lg ring-2 ring-emerald-500/20"
                      : "bg-white hover:bg-amber-50/40 border-slate-200 hover:border-amber-400 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                          {prod.brand}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          {prod.category}
                        </span>
                      </div>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Sedang Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                          Item #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug mb-3">
                      {prod.name}
                    </h4>
                  </div>

                  {/* Price Box */}
                  <div className="space-y-3 mt-auto">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Harga Normal (100%):</span>
                        <span className="line-through text-slate-400 font-mono font-bold">
                          {formatIDR(prod.normalPrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                        <span className="text-emerald-800 font-bold flex items-center gap-1">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-black">
                            -70%
                          </span>
                          Harga Provisi:
                        </span>
                        <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                          {formatIDR(prod.provisionPrice)}
                        </span>
                      </div>

                      <div className="text-[10px] text-emerald-700 font-medium text-right flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Potongan: {formatIDR(prod.normalPrice * 0.7)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(prod);
                        playBeep();
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Terpilih di Kalkulator ({unitCount} pcs)</span>
                        </>
                      ) : (
                        <>
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Pilih untuk Kalkulator</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Result Card (When Product is Scanned/Selected) */}
      {selectedProduct && (
        <div className="bg-white border-2 border-emerald-500 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Card Top Strip */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Hasil Pemindaian Barcode Retur Provisi
              </span>
            </div>
            <span className="text-xs font-mono font-bold bg-white/20 px-3 py-1 rounded-full">
              Barcode: {selectedProduct.barcode}
            </span>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {/* Product Meta */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-xs uppercase">
                    Brand: {selectedProduct.brand}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                    Kategori: {selectedProduct.category}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {selectedProduct.name}
                </h3>
              </div>
            </div>

            {/* Price Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Box 1: Harga Normal */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Harga Normal Resmi (100%)
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-400 line-through">
                  {formatIDR(selectedProduct.normalPrice)}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Harga retail master resmi sebelum potongan diskon retur 70%.
                </p>
              </div>

              {/* Box 2: Harga Setelah Potongan 70% (Harga Provisi) */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-xl p-5 relative shadow-sm">
                <div className="absolute top-3.5 right-3.5 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>POTONGAN 70%</span>
                </div>
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Harga Bersih Provisi (30%)
                </div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-700">
                  {formatIDR(selectedProduct.provisionPrice)}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Potongan Provisi (70%): {formatIDR(selectedProduct.normalPrice * 0.7)}</span>
                </div>
              </div>
            </div>

            {/* Quantity Multiplier Calculator */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Kalkulator Total Retur ({unitCount} Unit / Pcs)
                  </span>
                </div>

                {/* Unit Counter Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitCount(Math.max(1, unitCount - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-white cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={unitCount}
                    onChange={(e) => setUnitCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center py-1 bg-slate-800 border border-slate-700 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setUnitCount(unitCount + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Preset Quick Badges */}
                  <div className="hidden sm:flex items-center gap-1 ml-2">
                    {[5, 10, 20, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setUnitCount(num)}
                        className={`text-xs px-2 py-1 rounded-md border font-bold transition-all cursor-pointer ${
                          unitCount === num
                            ? "bg-emerald-500 text-slate-950 border-emerald-400"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Summary Breakdown */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="text-xs text-slate-400">
                  Total Nilai Normal ({unitCount} pcs):{" "}
                  <span className="line-through text-slate-500 font-mono font-bold">
                    {formatIDR(selectedProduct.normalPrice * unitCount)}
                  </span>
                </div>
                <div className="text-right sm:text-right text-xs text-emerald-400 font-bold">
                  Total Bersih Provisi ({unitCount} pcs):{" "}
                  <span className="text-base sm:text-lg text-emerald-300 font-mono font-black ml-1">
                    {formatIDR(selectedProduct.provisionPrice * unitCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Scanned History */}
      {recentScans.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Riwayat Pemindaian Terakhir ({recentScans.length} Produk)
              </h4>
            </div>
            <button
              onClick={() => setRecentScans([])}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Riwayat</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentScans.map((item, idx) => (
              <div
                key={`${item.barcode}-${item.name}-${idx}`}
                onClick={() => {
                  const sameBarcodeItems = catalog.filter(
                    (p) => cleanBarcode(p.barcode).toLowerCase() === cleanBarcode(item.barcode).toLowerCase()
                  );
                  if (sameBarcodeItems.length > 0) {
                    setMatchedProducts(sameBarcodeItems);
                  } else {
                    setMatchedProducts([item]);
                  }
                  setSelectedProduct(item);
                  setSearchQuery(item.barcode);
                  playBeep();
                }}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-all"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono">{item.barcode}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-blue-600">{item.brand}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 line-through mr-2">
                    {formatIDR(item.normalPrice)}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    {formatIDR(item.provisionPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEDICATED MULTI-BARCODE & VARIANT HUB */}
      {multiBarcodeGroups.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/5 via-amber-50/40 to-orange-50/20 border-2 border-amber-300/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
                <Layers className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black text-slate-900">
                    Pusat Barcode Ganda &amp; Multi-Variasi ({multiBarcodeGroups.length} Grup Barcode Terdeteksi)
                  </h4>
                  <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    Total {multiBarcodeGroups.reduce((acc, g) => acc + g.items.length, 0)} Varian Item
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Daftar seluruh barcode yang memiliki 2 atau lebih produk / perbedaan variasi / kemasan / batch harga di sistem:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setVariantBarcode("");
                  setVariantName("");
                  setVariantPrice("");
                  setIsAddVariantModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>+ Daftarkan Varian Baru</span>
              </button>
            </div>
          </div>

          {/* Search bar inside multi-barcode hub */}
          <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-amber-600 shrink-0" />
            <input
              type="text"
              value={multiGroupSearch}
              onChange={(e) => setMultiGroupSearch(e.target.value)}
              placeholder="Cari dalam grup barcode ganda (cth: 8991001001018, ABC Beauty, Serum, Sunscreen...)"
              className="w-full text-xs font-medium text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
            />
            {multiGroupSearch && (
              <button
                type="button"
                onClick={() => setMultiGroupSearch("")}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grid of Multi-Barcode Cards */}
          {filteredMultiBarcodeGroups.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-amber-200 text-xs text-slate-500">
              Tidak ada grup barcode ganda yang cocok dengan pencarian "{multiGroupSearch}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMultiBarcodeGroups.map((group) => {
                const isActiveGroup = selectedProduct && cleanBarcode(selectedProduct.barcode) === cleanBarcode(group.barcode);

                return (
                  <div
                    key={group.barcode}
                    className={`bg-white rounded-2xl p-4 border-2 transition-all flex flex-col justify-between space-y-3 ${
                      isActiveGroup
                        ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                        : "border-amber-200/80 hover:border-amber-400 shadow-xs"
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Header Barcode & Variant Count */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            {group.barcode}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {group.brand}
                          </span>
                        </div>
                        <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-700" />
                          {group.items.length} Varian Item
                        </span>
                      </div>

                      {/* Variant Items List */}
                      <div className="space-y-1.5 divide-y divide-slate-100 pt-1">
                        {group.items.map((it, idx) => (
                          <div
                            key={`${it.barcode}-${it.name}-${idx}`}
                            onClick={() => {
                              setMatchedProducts(group.items);
                              setSelectedProduct(it);
                              setSearchQuery(group.barcode);
                              playBeep();
                            }}
                            className="pt-1.5 first:pt-0 flex items-start justify-between gap-2 text-xs hover:bg-emerald-50/60 p-1.5 rounded-lg cursor-pointer transition-colors group"
                          >
                            <div className="min-w-0">
                              <span className="text-slate-400 font-mono text-[10px] mr-1.5">#{idx + 1}</span>
                              <span className="font-bold text-slate-800 group-hover:text-emerald-950 leading-snug">
                                {it.name}
                              </span>
                            </div>
                            <div className="text-right shrink-0 whitespace-nowrap pl-2">
                              <div className="text-[10px] text-slate-400 line-through">
                                {formatIDR(it.normalPrice)}
                              </div>
                              <div className="font-black text-emerald-700 text-xs bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {formatIDR(it.provisionPrice)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVariantBarcode(group.barcode);
                          setVariantName("");
                          setVariantPrice("");
                          setIsAddVariantModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ Tambah Varian</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMatchedProducts(group.items);
                          setSelectedProduct(group.items[0]);
                          setSearchQuery(group.barcode);
                          playBeep();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Hitung Semua ({group.items.length})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MASTER DATA DIRECTORY & MULTI-BARCODE EXPLORER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Direktori Master Data Produk &amp; Barcode ({filteredCatalogList.length} Item)
              </h4>
              <p className="text-xs text-slate-500">
                Klik produk mana pun untuk memuat semua item se-barcode ke kalkulator provisi.
              </p>
            </div>
          </div>

          {/* Quick Toggle Filter for Multi-Barcode Items */}
          <button
            type="button"
            onClick={() => setOnlyMultiBarcodeFilter(!onlyMultiBarcodeFilter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              onlyMultiBarcodeFilter
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{onlyMultiBarcodeFilter ? "Hanya Barcode Ganda (Aktif)" : "Filter Barcode Ganda Saja"}</span>
          </button>
        </div>

        {/* Brand Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0 mr-1">
            Brand:
          </span>
          {brandsList.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrandFilter(brand)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                selectedBrandFilter === brand
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Scrollable Products Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 sticky top-0 text-slate-600 font-bold border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-3">Barcode</th>
                <th className="py-2.5 px-3">Nama Produk &amp; Varian</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Brand &amp; Kategori</th>
                <th className="py-2.5 px-3 text-right">Harga Normal</th>
                <th className="py-2.5 px-3 text-right">Harga Provisi (-70%)</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCatalogList.slice(0, 50).map((item, idx) => {
                const sisterItems = getItemsForBarcode(item.barcode);
                const isMulti = sisterItems.length > 1;

                return (
                  <tr
                    key={`${item.barcode}-${item.name}-${idx}`}
                    className="hover:bg-emerald-50/50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setMatchedProducts(sisterItems.length > 0 ? sisterItems : [item]);
                      setSelectedProduct(item);
                      setSearchQuery(item.barcode);
                      playBeep();
                    }}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.barcode}</span>
                        {isMulti && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-black border border-amber-300">
                            {sisterItems.length} Varian
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-emerald-950">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-700 mr-1.5">
                        {item.brand}
                      </span>
                      <span className="text-[11px]">{item.category}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 line-through whitespace-nowrap">
                      {formatIDR(item.normalPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                      {formatIDR(item.provisionPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMatchedProducts(sisterItems.length > 0 ? sisterItems : [item]);
                          setSelectedProduct(item);
                          setSearchQuery(item.barcode);
                          playBeep();
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        {isMulti ? `Cek ${sisterItems.length} Item` : "Cek Provisi"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCatalogList.length > 50 && (
          <p className="text-[11px] text-slate-400 text-center italic">
            Menampilkan 50 dari {filteredCatalogList.length} produk. Gunakan kotak pencarian di atas untuk menyaring spesifik.
          </p>
        )}
      </div>

      {/* BULK PASTE / CSV MODAL (Handles thousands of rows easily) */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  Tempel / Import Data Master Excel (Ribuan Baris)
                </h3>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda dapat meng-copy ribuan baris langsung dari file <strong>Excel / Spreadsheet / CSV</strong> dan menempelkannya di bawah. Format kolom: <code>Barcode, Nama Produk, Harga</code>.
              </p>

              <textarea
                value={pastedCSVText}
                onChange={(e) => setPastedCSVText(e.target.value)}
                placeholder={`Contoh tempel data dari Excel:\n8991001001018,ABC BEAUTY SERUM NIACINAMIDE 30ML,125.000\n8991001001025,ABC BEAUTY HYDRA SUNSCREEN SPF 50 40ML,59.000\n...`}
                rows={10}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-none"
              />

              {pasteSummary && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{pasteSummary}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Database Bawaan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessBulkPaste}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Simpan & Update Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ADD VARIANT MODAL */}
      {isAddVariantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  Tambah Variasi / Item Baru pada Barcode
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVariantModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddVariantSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tambahkan variasi baru untuk barcode ini. Item baru akan langsung tersimpan dan dapat dihitung potongan provisi 70%-nya secara otomatis.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Barcode:
                </label>
                <input
                  type="text"
                  value={variantBarcode}
                  onChange={(e) => setVariantBarcode(e.target.value)}
                  placeholder="Contoh: 8993137708319"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk &amp; Variasi:
                </label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Contoh: ABC BEAUTY VELVET MATTE LIP CREAM 01 NUDE SUNSET"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Normal (sebelum diskon 70%):
                </label>
                <input
                  type="text"
                  value={variantPrice}
                  onChange={(e) => setVariantPrice(e.target.value)}
                  placeholder="Contoh: 79000 atau 79.000"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
                {parsePrice(variantPrice) > 0 && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">
                    Estimasi Harga Provisi (-70%): {formatIDR(Math.round(parsePrice(variantPrice) * 0.3))}
                  </p>
                )}
              </div>

              {variantMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{variantMessage}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVariantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Simpan Variasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
