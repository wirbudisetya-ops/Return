import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  Package,
  CheckCircle2,
  Search,
  Barcode,
  ScanLine,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Trash2,
  Tag,
  Camera,
  CameraOff,
  ShoppingBag,
  ArrowRight,
  Clock,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  CosmeticReturnItem,
  DistributionCenter,
  StoreDirectoryItem,
  ManualItemCondition,
  ScannedManualItem,
} from "../types";
import { getIndonesianLiveDateTime, formatIndonesianCurrency } from "../data/dateUtils";
import { loadStoreDirectory, addStoreToDirectory } from "../data/storeDirectory";
import {
  loadProvisionCatalog,
  cleanBarcode,
  findProductByBarcode,
  ProvisionProductItem,
  detectBrand,
  detectCategory,
  parsePrice,
} from "../data/provisionProducts";

interface ReturManualFormProps {
  activeDC: DistributionCenter;
  targetReturn?: CosmeticReturnItem | null;
  onSaveManualItems: (
    returnId: string,
    items: ScannedManualItem[],
    isFinal: boolean,
    notes?: string
  ) => void;
  onSaveNewReturn?: (item: CosmeticReturnItem) => void;
  defaultStaffName: string;
  onSuccess: (savedId: string, storeName: string, totalItems: number, totalPcs: number, totalVal: number) => void;
  onClearTargetReturn?: () => void;
}

export const ReturManualForm: React.FC<ReturManualFormProps> = ({
  activeDC,
  targetReturn,
  onSaveManualItems,
  onSaveNewReturn,
  defaultStaffName,
  onSuccess,
  onClearTargetReturn,
}) => {
  // Store directory state (only needed if no target return is selected)
  const [storeList, setStoreList] = useState<StoreDirectoryItem[]>([]);
  useEffect(() => {
    setStoreList(loadStoreDirectory(activeDC));
  }, [activeDC]);

  const [storeQuery, setStoreQuery] = useState(targetReturn?.storeName || "");
  const [selectedStore, setSelectedStore] = useState<StoreDirectoryItem | null>(null);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Sync store query when targetReturn changes
  useEffect(() => {
    if (targetReturn) {
      setStoreQuery(targetReturn.storeName);
      setSelectedStore(null);
    }
  }, [targetReturn]);

  // Product Catalog
  const [catalog] = useState<ProvisionProductItem[]>(() => loadProvisionCatalog());

  // Barcode & Product Scan State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProvisionProductItem | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState("");

  // Manual fallback input if barcode not in catalog
  const [manualProductName, setManualProductName] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  // Quantity & Condition for current item being scanned
  const [quantity, setQuantity] = useState<number>(1);
  const [itemCondition, setItemCondition] = useState<ManualItemCondition>("STOCK");

  // Sound Feedback
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera Scanner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // DAFTAR BARANG-BARANG YANG SUDAH DIINPUT
  const [inputtedItems, setInputtedItems] = useState<ScannedManualItem[]>(() => {
    if (targetReturn?.manualItems && targetReturn.manualItems.length > 0) {
      return targetReturn.manualItems;
    }
    return [];
  });

  // Notes
  const [operatorNotes, setOperatorNotes] = useState(
    targetReturn?.operatorConfirmationNotes || ""
  );

  // Sync inputted items if targetReturn changes
  useEffect(() => {
    if (targetReturn?.manualItems && targetReturn.manualItems.length > 0) {
      setInputtedItems(targetReturn.manualItems);
    } else {
      setInputtedItems([]);
    }
    setOperatorNotes(targetReturn?.operatorConfirmationNotes || "");
  }, [targetReturn]);

  // Scan input ref for instant focus
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const filteredStores = storeList.filter((s) =>
    s.name.toLowerCase().includes(storeQuery.toLowerCase())
  );

  // Click outside store dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Beep sound
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1450, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext might require user interaction first
    }
  };

  // Perform Barcode Lookup
  const handlePerformBarcodeScan = (codeToSearch: string) => {
    const raw = codeToSearch.trim();
    if (!raw) return;

    const matched = findProductByBarcode(raw, catalog);

    if (matched) {
      setSelectedProduct(matched);
      setIsNotFound(false);
      setNotFoundBarcode("");
      playBeep();
      setBarcodeInput(matched.barcode);
    } else {
      setSelectedProduct(null);
      setIsNotFound(true);
      setNotFoundBarcode(raw);
      setManualProductName("");
      setManualPrice("");
    }
  };

  // Auto detect full barcode typing (8+ digits)
  useEffect(() => {
    const cleaned = cleanBarcode(barcodeInput);
    if (cleaned.length >= 8) {
      const matched = findProductByBarcode(cleaned, catalog);
      if (matched && matched.barcode !== selectedProduct?.barcode) {
        setSelectedProduct(matched);
        setIsNotFound(false);
        playBeep();
      }
    }
  }, [barcodeInput, catalog, selectedProduct]);

  // Camera Barcode Scanning Support
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
      console.warn("Camera access error:", err);
      alert(
        "Kamera tidak dapat diakses atau diblokir peramban. Silakan gunakan scanner barcode USB atau ketik barcode secara manual."
      );
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

  const handleSelectStore = (store: StoreDirectoryItem) => {
    setSelectedStore(store);
    setStoreQuery(store.name);
    setIsStoreDropdownOpen(false);
  };

  const handleAddNewStore = () => {
    if (!storeQuery.trim()) return;
    const newStore: StoreDirectoryItem = {
      id: `STR-CUSTOM-${Date.now()}`,
      name: storeQuery.trim(),
      code: `CUST-${String(Date.now()).slice(-4)}`,
      dcLocation: activeDC,
      city: activeDC === "DC_SOLO" ? "Surakarta & Sekitarnya" : "DIY",
      address: activeDC === "DC_SOLO" ? "Gudang Hub DC Solo" : "DIY",
    };
    const updated = addStoreToDirectory(newStore);
    setStoreList(updated.filter((s) => s.dcLocation === activeDC));
    setSelectedStore(newStore);
    setIsStoreDropdownOpen(false);
  };

  // Effective current item data being scanned
  const currentProductName = selectedProduct
    ? selectedProduct.name
    : manualProductName.trim();
  const currentUnitPrice = selectedProduct
    ? selectedProduct.normalPrice
    : parsePrice(manualPrice);
  const currentProvisionPrice = selectedProduct
    ? selectedProduct.provisionPrice
    : Math.round(currentUnitPrice * 0.3);
  const currentBarcode = selectedProduct
    ? selectedProduct.barcode
    : cleanBarcode(notFoundBarcode || barcodeInput);
  const currentBrand = selectedProduct
    ? selectedProduct.brand
    : detectBrand(currentProductName);
  const currentCategory = selectedProduct
    ? selectedProduct.category
    : detectCategory(currentProductName);

  const subtotalPrice = quantity * currentUnitPrice;

  // 4 Conditions specified by user
  const conditionOptions: {
    value: ManualItemCondition;
    label: string;
    sublabel: string;
    badgeStyle: string;
    activeBorder: string;
    activeBg: string;
  }[] = [
    {
      value: "STOCK",
      label: "STOCK",
      sublabel: "Stok baik / overstock / layak display",
      badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300",
      activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20",
      activeBg: "bg-emerald-50/70",
    },
    {
      value: "BAD",
      label: "BAD",
      sublabel: "Rusak fisik / cacat kemasan / bocor / segel terbuka",
      badgeStyle: "bg-rose-100 text-rose-800 border-rose-300",
      activeBorder: "border-rose-500 ring-2 ring-rose-500/20",
      activeBg: "bg-rose-50/70",
    },
    {
      value: "NED",
      label: "NED",
      sublabel: "Near Expired Date (Mendekati kadaluarsa)",
      badgeStyle: "bg-amber-100 text-amber-900 border-amber-300",
      activeBorder: "border-amber-500 ring-2 ring-amber-500/20",
      activeBg: "bg-amber-50/70",
    },
    {
      value: "DEMOLISH",
      label: "DEMOLISH",
      sublabel: "Pemusnahan / Cacat parah / Limbah B3",
      badgeStyle: "bg-purple-100 text-purple-800 border-purple-300",
      activeBorder: "border-purple-600 ring-2 ring-purple-600/20",
      activeBg: "bg-purple-50/70",
    },
  ];

  // Add Current Scanned Item to the List
  const handleAddItemToList = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const targetStoreName = targetReturn?.storeName || storeQuery.trim();
    if (!targetStoreName) {
      alert("Silakan tentukan atau pilih Nama Toko terlebih dahulu.");
      return;
    }
    if (!currentProductName) {
      alert("Silakan scan barcode atau masukkan nama item barang.");
      barcodeInputRef.current?.focus();
      return;
    }
    if (quantity < 1) {
      alert("Jumlah item minimal 1 pcs.");
      return;
    }

    const { fullString } = getIndonesianLiveDateTime();

    const newItem: ScannedManualItem = {
      id: `ITEM-MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      barcode: currentBarcode || `BC-${Date.now().toString().slice(-6)}`,
      productName: currentProductName,
      brand: currentBrand,
      category: currentCategory,
      unitPrice: currentUnitPrice,
      provisionPrice: currentProvisionPrice,
      quantity: quantity,
      condition: itemCondition,
      scannedAt: fullString,
    };

    setInputtedItems((prev) => [newItem, ...prev]);
    playBeep();

    // Reset scanner inputs for next item
    setBarcodeInput("");
    setSelectedProduct(null);
    setIsNotFound(false);
    setManualProductName("");
    setManualPrice("");
    setQuantity(1);
    setItemCondition("STOCK");

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // Adjust Quantity of an item in the list
  const handleAdjustItemQty = (id: string, delta: number) => {
    setInputtedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Remove Item from List
  const handleRemoveItem = (id: string) => {
    setInputtedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Save All Inputted Items to Return Record
  const handleSaveAll = (isFinal: boolean) => {
    const targetStoreName = targetReturn?.storeName || storeQuery.trim();
    if (!targetStoreName) {
      alert("Silakan pilih atau masukkan Nama Toko terlebih dahulu.");
      return;
    }

    if (inputtedItems.length === 0) {
      alert("Belum ada barang yang diinput. Silakan scan atau tambahkan minimal 1 item barang.");
      return;
    }

    const totalQty = inputtedItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const totalVal = inputtedItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);

    if (targetReturn) {
      // Save directly into the confirmed return
      onSaveManualItems(targetReturn.id, inputtedItems, isFinal, operatorNotes);
      onSuccess(targetReturn.id, targetReturn.storeName, inputtedItems.length, totalQty, totalVal);
    } else {
      // Create new return item
      const liveNow = getIndonesianLiveDateTime();
      const newId = `RET-MAN-${activeDC === "DC_SOLO" ? "SLO" : "JOG"}-${Date.now().toString().slice(-4)}`;

      const newReturn: CosmeticReturnItem = {
        id: newId,
        dcLocation: activeDC,
        returnMethod: "MANUAL",
        orderId: `MAN-RET-${Date.now().toString().slice(-5)}`,
        trackingNumber: `TRK-MAN-${newId}`,
        courier: "Armada Inbound DC",
        channel: "Toko Offline",
        storeName: targetStoreName,
        driverName: "Driver Mitra / Toko",
        driverVehicle: "-",
        inboundStaffName: defaultStaffName,
        inboundReceivedAt: liveNow.isoString,
        inboundDayFormatted: liveNow.fullString,
        inboundNotes: `Retur Manual: ${inputtedItems.length} jenis item (${totalQty} pcs).`,
        colliCount: Math.ceil(totalQty / 20) || 1,
        handoverStatus: "SUDAH_DITERIMA_OPERATOR",
        acceptedByOperator: defaultStaffName,
        acceptedAt: liveNow.isoString,
        acceptedDayFormatted: liveNow.fullString,
        storageBin: `Rak Retur ${activeDC === "DC_SOLO" ? "Solo" : "Jogja"} QC-01`,
        operatorConfirmationNotes: operatorNotes || "Pemeriksaan dan input barang retur manual selesai.",
        customerName: `Pic Store (${targetStoreName})`,
        customerPhone: "-",
        customerCity: activeDC === "DC_SOLO" ? "Surakarta" : "DIY",
        productName: inputtedItems[0]?.productName || "Produk Retur Manual",
        category: "SKINCARE",
        shadeOrVariant: `${inputtedItems.length} Jenis Produk`,
        sku: inputtedItems[0]?.barcode || "-",
        quantity: totalQty,
        unitPrice: inputtedItems[0]?.unitPrice || 0,
        totalValue: totalVal,
        batchNumber: `MAN-BATCH-${Date.now().toString().slice(-4)}`,
        expiryDate: "2027-12-31",
        returnReason: `Retur Manual Toko (${inputtedItems.length} jenis produk)`,
        customerNotes: operatorNotes || "Input barang retur manual",
        evidencePhotos: [
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
        ],
        status: isFinal ? "INSPECTING" : "RECEIVED",
        priority: "MEDIUM",
        disposition: "RESTOCK",
        hygieneScore: 90,
        hygieneChecklist: {
          sealIntact: true,
          noSwatchOrFingerprints: true,
          pumpDropperSterile: true,
          batchAndExpMatch: true,
          noLeakageOrCracks: true,
          smellAndTextureNormal: true,
        },
        manualItems: inputtedItems,
        manualProcessingStatus: isFinal ? "SELESAI" : "SEDANG_DIPROSES",
        manualProcessedAt: liveNow.isoString,
        manualProcessedBy: defaultStaffName,
        createdAt: liveNow.isoString,
        updatedAt: liveNow.isoString,
        timeline: [
          {
            id: `tl-man-${Date.now()}`,
            timestamp: liveNow.isoString,
            status: "INSPECTING",
            title: isFinal
              ? "Hasil Retur Manual Selesai Diproses"
              : "Draf Retur Manual Disimpan",
            description: `Operator ${defaultStaffName} menginput & memverifikasi ${inputtedItems.length} jenis item (${totalQty} pcs total, nilai: ${formatIndonesianCurrency(totalVal)}).`,
            operatorName: defaultStaffName,
            location: `Meja QC Retur ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}`,
          },
        ],
      };

      if (onSaveNewReturn) {
        onSaveNewReturn(newReturn);
      }
      onSuccess(newId, targetStoreName, inputtedItems.length, totalQty, totalVal);
    }
  };

  // Aggregated Stats for Inputted Items
  const totalInputtedPcs = inputtedItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalInputtedHET = inputtedItems.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0),
    0
  );
  const totalInputtedProvision = inputtedItems.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.provisionPrice || Math.round(it.unitPrice * 0.3)),
    0
  );

  const conditionCounts: Record<ManualItemCondition, number> = {
    STOCK: 0,
    BAD: 0,
    NED: 0,
    DEMOLISH: 0,
  };
  inputtedItems.forEach((it) => {
    if (conditionCounts[it.condition] !== undefined) {
      conditionCounts[it.condition] += it.quantity;
    }
  });

  // Sample quick barcodes for fast testing without physical scanner
  const sampleBarcodes = [
    { code: "8991001001018", name: "ABC Serum Niacinamide" },
    { code: "8991001001025", name: "ABC Hydra Sunscreen" },
    { code: "8991001001032", name: "ABC Barrier Gel" },
    { code: "8991001001056", name: "ABC Matte Lip Cream" },
  ];

  return (
    <div className="space-y-6">
      {/* Target Return Context Banner (if processing a confirmed return) */}
      {targetReturn ? (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-400 text-slate-950 font-mono">
                  Sedang Memproses Retur Terkonfirmasi
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  ID: <strong className="text-white">{targetReturn.id}</strong>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-300" />
                <span>{targetReturn.storeName}</span>
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-0.5">
                <span>
                  Fisik Koli Diterima:{" "}
                  <strong className="text-white">{targetReturn.colliCount || 1} Koli</strong>
                </span>
                <span>•</span>
                <span>
                  Inbound:{" "}
                  <strong className="text-slate-200">{targetReturn.inboundStaffName}</strong>
                </span>
                <span>•</span>
                <span>
                  Dikonfirmasi Operator:{" "}
                  <strong className="text-emerald-300">
                    {targetReturn.acceptedByOperator || defaultStaffName}
                  </strong>{" "}
                  ({targetReturn.storageBin || "Rak Retur"})
                </span>
              </div>
            </div>

            {onClearTargetReturn && (
              <button
                type="button"
                onClick={onClearTargetReturn}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pilih Retur Lain</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Store Picker if not linked to a specific confirmed return */
        <div className="space-y-2 relative" ref={storeDropdownRef}>
          <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nama Toko Asal Retur</span>
              <span className="text-rose-500 font-bold">*</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Pilih dari daftar toko mitra atau ketik nama toko
            </span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={storeQuery}
              onChange={(e) => {
                setStoreQuery(e.target.value);
                setSelectedStore(null);
                setIsStoreDropdownOpen(true);
              }}
              onFocus={() => setIsStoreDropdownOpen(true)}
              placeholder="Contoh: Toko Kosmetik ABC Sejahtera, Aura Beauty Mart..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-3 focus:ring-emerald-100 transition-all"
              required
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Dropdown Results */}
          {isStoreDropdownOpen && (
            <div className="absolute left-0 right-0 z-40 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto mt-1 divide-y divide-slate-100">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <div
                    key={store.id}
                    onClick={() => handleSelectStore(store)}
                    className="px-4 py-2.5 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800">{store.name}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-mono font-medium text-slate-500">
                      {store.code}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-2">
                    Toko "{storeQuery}" belum terdaftar di database.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddNewStore}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                  >
                    + Tambahkan "{storeQuery}"
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Store Chips */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Toko Populer:</span>
            {storeList.slice(0, 4).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStore(s)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200/80 rounded-lg text-[11px] font-medium text-slate-600 cursor-pointer transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WORKSTATION: SCAN BARCODE PRODUK & CEK HARGA */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Scan Barcode Produk & Cek Harga
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Suara bip aktif" : "Suara dibisukan"}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Input Barcode Scanner */}
        <div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!selectedProduct && barcodeInput.trim()) {
                      handlePerformBarcodeScan(barcodeInput);
                    } else if (currentProductName) {
                      handleAddItemToList();
                    }
                  }
                }}
                placeholder="Scan barcode produk di sini (contoh: 8991001001018)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-xl text-xs font-bold font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-3 focus:ring-emerald-100 transition-all"
                autoFocus
              />
              <ScanLine className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={() => handlePerformBarcodeScan(barcodeInput)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari</span>
            </button>

            <button
              type="button"
              onClick={() => (isCameraActive ? stopCamera() : startCamera())}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                isCameraActive
                  ? "bg-rose-600 border-rose-600 text-white"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
              title={isCameraActive ? "Tutup Kamera" : "Pindai Barcode via Kamera"}
            >
              {isCameraActive ? (
                <CameraOff className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

          {/* Camera View if active */}
          {isCameraActive && (
            <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-emerald-400/70 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-20 border border-dashed border-white/80 rounded-md flex items-center justify-center">
                    <span className="text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded">
                      Arahkan barcode ke kotak ini
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Kamera aktif. Arahkan barcode produk ke kotak panduan.
              </p>
            </div>
          )}

          {/* Quick Test Barcodes */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Contoh Barcode:</span>
            {sampleBarcodes.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => {
                  setBarcodeInput(b.code);
                  handlePerformBarcodeScan(b.code);
                }}
                className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-md text-[10px] font-mono font-medium text-slate-700 transition-colors cursor-pointer"
              >
                {b.code} ({b.name})
              </button>
            ))}
          </div>
        </div>

        {/* Product Matched Result Card */}
        {selectedProduct && (
          <div className="bg-white border-2 border-emerald-500/50 rounded-xl p-3.5 sm:p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold font-mono text-[10px] tracking-wide">
                    {selectedProduct.brand}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedProduct.category}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-[11px] font-mono text-slate-600">
                    Barcode: <strong>{selectedProduct.barcode}</strong>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedProduct.name}
                </h4>
              </div>

              {/* Price Badges: HET & Provisi */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Harga HET:
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {formatIndonesianCurrency(selectedProduct.normalPrice)}
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-rose-600">
                      Provisi (-70%):
                    </span>
                    <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                      -70%
                    </span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-emerald-700">
                    {formatIndonesianCurrency(selectedProduct.provisionPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Manual Input if not in catalog */}
        {isNotFound && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                Barcode "{notFoundBarcode}" tidak ada di katalog. Masukkan nama & harga manual:
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Produk / Varian
                </label>
                <input
                  type="text"
                  value={manualProductName}
                  onChange={(e) => setManualProductName(e.target.value)}
                  placeholder="Contoh: Wardah UV Shield Tone Up Sunscreen 30ml"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Harga Satuan (HET)
                </label>
                <input
                  type="text"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="Contoh: 75.000 atau 75000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quantity, Condition, and ADD TO LIST BUTTON */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-200">
          {/* Quantity Controls */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Jumlah Diretur (Pcs)</span>
              </span>
              <span className="text-[11px] text-slate-400">Satuan Unit</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer transition-colors shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-10 text-center bg-white border border-slate-300 rounded-xl text-base font-extrabold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Quantity Chips */}
            <div className="flex items-center gap-1.5">
              {[1, 5, 10, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    quantity === n
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white hover:bg-slate-200 border border-slate-200 text-slate-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Condition Selector: STOCK, BAD, NED, DEMOLISH */}
          <div className="lg:col-span-8 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Kondisi Fisik Barang</span>
              </span>
              <span className="text-[11px] text-slate-500">Pilih salah satu dari 4 kondisi</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {conditionOptions.map((opt) => {
                const isSelected = itemCondition === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setItemCondition(opt.value)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${opt.activeBorder} ${opt.activeBg} shadow-xs`
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono tracking-wider ${opt.badgeStyle}`}
                        >
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                        {opt.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action: Add Item To List Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
          <div className="text-xs text-slate-600">
            {currentUnitPrice > 0 && currentProductName ? (
              <span>
                Subtotal Item: {quantity} pcs × {formatIndonesianCurrency(currentUnitPrice)} ={" "}
                <strong className="text-emerald-700 font-mono font-bold">
                  {formatIndonesianCurrency(subtotalPrice)}
                </strong>{" "}
                <span className="text-slate-400">
                  (Provisi: {formatIndonesianCurrency(quantity * currentProvisionPrice)})
                </span>
              </span>
            ) : (
              <span className="text-slate-400">
                Scan barcode atau pilih barang untuk menambahkan ke daftar retur.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleAddItemToList()}
            disabled={!currentProductName}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Masukkan ke Daftar Barang Retur</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BAGIAN PENERIMA DIHAPUS -> DIGANTI DENGAN: DAFTAR BARANG YANG SUDAH DIINPUT */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Barang-Barang Retur Yang Sudah Diinput
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full font-mono">
                  {inputtedItems.length} Jenis Produk
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Toko: <strong className="text-slate-800">{targetReturn?.storeName || storeQuery || "-"}</strong> • Operator QC: <strong className="text-slate-800">{defaultStaffName}</strong>
              </p>
            </div>
          </div>

          {inputtedItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin mengosongkan seluruh daftar barang retur ini?")) {
                  setInputtedItems([]);
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer self-start sm:self-auto flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Daftar</span>
            </button>
          )}
        </div>

        {/* Table of Inputted Items */}
        {inputtedItems.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No.</th>
                    <th className="py-3 px-3 w-32">Barcode</th>
                    <th className="py-3 px-3">Nama Item Produk</th>
                    <th className="py-3 px-3 text-center w-28">Kondisi</th>
                    <th className="py-3 px-3 text-center w-28">Jumlah (Qty)</th>
                    <th className="py-3 px-3 text-right w-32">Harga Satuan HET</th>
                    <th className="py-3 px-3 text-right w-32">Nilai Provisi (-70%)</th>
                    <th className="py-3 px-3 text-right w-32">Subtotal</th>
                    <th className="py-3 px-3 text-center w-14">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inputtedItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* No. */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {item.barcode}
                      </td>

                      {/* Nama Produk */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.brand ? `${item.brand} • ` : ""}
                          {item.category || "Kosmetik"}
                        </div>
                      </td>

                      {/* Kondisi */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-extrabold font-mono tracking-wider ${
                            item.condition === "STOCK"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : item.condition === "BAD"
                              ? "bg-rose-100 text-rose-900 border border-rose-300"
                              : item.condition === "NED"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-purple-100 text-purple-900 border border-purple-300"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </td>

                      {/* Quantity with +/- */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleAdjustItemQty(item.id, -1)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 rounded flex items-center justify-center font-bold text-slate-700 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-xs px-1 min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustItemQty(item.id, 1)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 rounded flex items-center justify-center font-bold text-slate-700 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Harga Satuan HET */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatIndonesianCurrency(item.unitPrice)}
                      </td>

                      {/* Nilai Provisi (-70%) */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatIndonesianCurrency(
                          item.provisionPrice || Math.round(item.unitPrice * 0.3)
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                        {formatIndonesianCurrency(item.quantity * item.unitPrice)}
                      </td>

                      {/* Hapus */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer transition-colors"
                          title="Hapus barang ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Fisik Barang:
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900">
                  {totalInputtedPcs} <span className="text-xs font-sans font-medium text-slate-500">Pcs</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Nilai HET:
                </span>
                <span className="text-base font-extrabold font-mono text-slate-900">
                  {formatIndonesianCurrency(totalInputtedHET)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                  Total Nilai Provisi:
                </span>
                <span className="text-base font-extrabold font-mono text-emerald-700">
                  {formatIndonesianCurrency(totalInputtedProvision)}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Rekap Kondisi:
                </span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {conditionCounts.STOCK > 0 && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded text-[10px] font-mono font-bold">
                      STOCK: {conditionCounts.STOCK}
                    </span>
                  )}
                  {conditionCounts.BAD > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-100 text-rose-900 rounded text-[10px] font-mono font-bold">
                      BAD: {conditionCounts.BAD}
                    </span>
                  )}
                  {conditionCounts.NED > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[10px] font-mono font-bold">
                      NED: {conditionCounts.NED}
                    </span>
                  )}
                  {conditionCounts.DEMOLISH > 0 && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded text-[10px] font-mono font-bold">
                      DEMOLISH: {conditionCounts.DEMOLISH}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Operator Notes Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Hasil Retur / Kondisi Fisik Operator (Opsional):
              </label>
              <input
                type="text"
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Contoh: Seluruh isi 2 koli dus telah selesai disortir dan diperiksa oleh Operator Retur."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
              <Barcode className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              Belum ada barang yang dimasukkan ke dalam daftar
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
              Gunakan pemindai barcode di atas untuk scan produk, pilih kondisi (<strong>STOCK</strong>, <strong>BAD</strong>, <strong>NED</strong>, <strong>DEMOLISH</strong>), dan klik "+ Masukkan ke Daftar Barang Retur".
            </p>
          </div>
        )}

        {/* ACTION BUTTONS: SIMPAN HASIL RETUR */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Hasil retur akan tersimpan permanen pada database retur & sinkron dengan sistem DC {activeDC === "DC_SOLO" ? "Solo" : "Jogja"}.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSaveAll(false)}
              disabled={inputtedItems.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
            >
              Simpan Draf
            </button>

            <button
              type="button"
              onClick={() => handleSaveAll(true)}
              disabled={inputtedItems.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Selesaikan Hasil Retur ({totalInputtedPcs} Pcs)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
