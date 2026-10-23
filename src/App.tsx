import React, { useState, useEffect } from "react";
import { Sidebar, AppTabType } from "./components/Sidebar";
import { TopNavbar } from "./components/TopNavbar";
import { DCSelectionModal } from "./components/DCSelectionModal";
import { WelcomeGreetingBanner } from "./components/WelcomeGreetingBanner";
import { InputStoreReturnView } from "./components/InputStoreReturnView";
import { InputAnonymousReturnView } from "./components/InputAnonymousReturnView";
import { DriverReturnsConfirmView } from "./components/DriverReturnsConfirmView";
import { StoreDirectoryView } from "./components/StoreDirectoryView";
import { JogjaSendSoloView } from "./components/JogjaSendSoloView";
import { SoloReceiveJogjaView } from "./components/SoloReceiveJogjaView";
import { ManualReturnStandaloneView } from "./components/ManualReturnStandaloneView";
import { ProvisionPriceCheckView } from "./components/ProvisionPriceCheckView";
import { OperatorConfirmModal } from "./components/OperatorConfirmModal";
import { PrintReturnSlipModal } from "./components/PrintReturnSlipModal";
import { LiveNotificationToast, ToastMessage } from "./components/LiveNotificationToast";
import { UserAuthManagementModal } from "./components/UserAuthManagementModal";
import { LoginAuthModal } from "./components/LoginAuthModal";
import {
  CosmeticReturnItem,
  DistributionCenter,
  JogjaToSoloTransferItem,
  OperatorProfile,
  AuthorizedUser,
} from "./types";
import {
  loadReturns,
  saveReturns,
  loadOperator,
  getStoredActiveDC,
  saveActiveDC,
  addReturnItem,
  updateReturnItem,
  confirmOperatorHandover,
  loadJogjaTransfers,
  addJogjaTransfer,
  confirmTimAbsoluteTransferReceipt,
  resetDefaultData,
} from "./data/storage";
import {
  auth,
  db,
  PRIMARY_ADMIN_EMAIL,
  getLocalAuthorizedUsers,
  saveLocalAuthorizedUsers,
  findUserAuthorization,
  logoutUser,
} from "./data/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export default function App() {
  // Company & Department Configuration
  const COMPANY_NAME = "PT ABC";
  const COMPANY_ADDRESS = "Hub Logistik & Retur DC Solo";
  const DEPARTMENT_NAME = "DIVISI WAREHOUSE & INBOUND RETUR";

  // Distribution Center State (DC Solo vs DC Jogja)
  const [activeDC, setActiveDC] = useState<DistributionCenter>(() => {
    return getStoredActiveDC() || "DC_SOLO";
  });
  const [isDCModalOpen, setIsDCModalOpen] = useState<boolean>(() => {
    return !getStoredActiveDC();
  });

  // Active Main Tab Navigation
  const [activeTab, setActiveTab] = useState<AppTabType>("store-return");
  const [selectedManualReturnId, setSelectedManualReturnId] = useState<string | null>(null);

  // Data & Operator State (Operator DC Solo for DC Solo, Operator DC Jogja for DC Jogja)
  const [returns, setReturns] = useState<CosmeticReturnItem[]>([]);
  const [jogjaTransfers, setJogjaTransfers] = useState<JogjaToSoloTransferItem[]>([]);
  const [operator, setOperator] = useState<OperatorProfile>(() => loadOperator(activeDC));

  // Firebase Email Auth & Role-Based Access Control State
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>(() =>
    getLocalAuthorizedUsers()
  );
  const [currentUser, setCurrentUser] = useState<AuthorizedUser | null>(() => {
    const list = getLocalAuthorizedUsers();
    const admin = list.find(
      (u) => u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
    );
    return admin || list[0] || null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);

  // Sync operator profile when active DC switches or currentUser switches
  useEffect(() => {
    const baseOp = loadOperator(activeDC);
    if (currentUser) {
      setOperator({
        ...baseOp,
        name: currentUser.displayName,
        role: `${currentUser.role} (${currentUser.email})`,
      });
    } else {
      setOperator(baseOp);
    }
  }, [activeDC, currentUser]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        const found = findUserAuthorization(fbUser.email, authorizedUsers);
        if (found && found.status === "ACTIVE") {
          const activeUser: AuthorizedUser = {
            ...found,
            uid: fbUser.uid,
            displayName: fbUser.displayName || found.displayName,
            photoURL: fbUser.photoURL || undefined,
          };
          setCurrentUser(activeUser);
          addToast(
            "Login Berhasil",
            `Terhubung via Firebase Auth: ${activeUser.displayName} (${activeUser.role})`,
            "success"
          );
        } else if (fbUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
          const adminUser: AuthorizedUser = {
            uid: fbUser.uid,
            email: PRIMARY_ADMIN_EMAIL,
            displayName: fbUser.displayName || "Wira Budi Setya (Super Admin)",
            role: "SUPER_ADMIN",
            allowedDCs: ["DC_SOLO", "DC_JOGJA"],
            status: "ACTIVE",
            canEditReturns: true,
            canConfirmOperator: true,
            canProcessManualReturns: true,
            canManageUsers: true,
            addedAt: new Date().toISOString(),
            addedBy: "System",
            photoURL: fbUser.photoURL || undefined,
          };
          setCurrentUser(adminUser);
          addToast("Login Berhasil", `Selamat datang kembali, Super Admin!`, "success");
        } else {
          addToast(
            "Perlu Otorisasi Staf",
            `Email ${fbUser.email} belum memiliki izin akses retur. Silakan minta akses ke admin (${PRIMARY_ADMIN_EMAIL}).`,
            "warning"
          );
        }
      }
    });

    return () => unsubscribe();
  }, [authorizedUsers]);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeItemForConfirm, setActiveItemForConfirm] = useState<CosmeticReturnItem | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeItemForPrint, setActiveItemForPrint] = useState<CosmeticReturnItem | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    title: string,
    message: string,
    type: "success" | "warning" | "info" = "info"
  ) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial returns and transfers from storage & connect Real-time Cloud Stream
  useEffect(() => {
    // Purge old legacy keys
    try {
      [
        "cosmetics_returns_dc_v3",
        "cosmetics_returns_dc_v2",
        "cosmetics_returns_dc_v1",
        "cosmetics_jogja_solo_transfers_v2",
        "cosmetics_jogja_solo_transfers_v1",
        "cosmetics_operator_profile_v3",
        "cosmetics_active_dc_v3",
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}

    // 1. Initial local load
    const returnData = loadReturns();
    const transferData = loadJogjaTransfers();
    setReturns(returnData);
    setJogjaTransfers(transferData);

    // 2. Fetch latest shared state from Cloud Server
    fetch("/api/live/data")
      .then((res) => res.json())
      .then((json) => {
        if (json && json.success && json.data) {
          const { returns: serverReturns, jogjaTransfers: serverTransfers } = json.data;
          if (Array.isArray(serverReturns) && serverReturns.length > 0) {
            setReturns(serverReturns);
            localStorage.setItem("pt_abc_returns_dc_v1", JSON.stringify(serverReturns));
          } else {
            // Seed server with initial clean data
            fetch("/api/live/sync-all", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                returns: returnData,
                jogjaTransfers: transferData,
              }),
            }).catch(() => {});
          }

          if (Array.isArray(serverTransfers) && serverTransfers.length > 0) {
            setJogjaTransfers(serverTransfers);
            localStorage.setItem("pt_abc_jogja_solo_transfers_v1", JSON.stringify(serverTransfers));
          }
        }
      })
      .catch(() => {});

    // 3. Connect to Server-Sent Events (SSE) for instant real-time live push
    let sse: EventSource | null = null;
    try {
      sse = new EventSource("/api/live/stream");
      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || !payload.type) return;

          if (payload.type === "INIT" || payload.type === "SYNC_ALL") {
            const { returns: sReturns, jogjaTransfers: sTransfers } = payload.data || {};
            if (Array.isArray(sReturns) && sReturns.length > 0) {
              setReturns(sReturns);
              localStorage.setItem("pt_abc_returns_dc_v1", JSON.stringify(sReturns));
            }
            if (Array.isArray(sTransfers) && sTransfers.length > 0) {
              setJogjaTransfers(sTransfers);
              localStorage.setItem("pt_abc_jogja_solo_transfers_v1", JSON.stringify(sTransfers));
            }
          } else if (payload.type === "RETURN_UPDATED" || payload.type === "RETURNS_REPLACED") {
            const latest = payload.data?.returns || payload.data;
            if (Array.isArray(latest)) {
              setReturns(latest);
              localStorage.setItem("pt_abc_returns_dc_v1", JSON.stringify(latest));
            }
          } else if (payload.type === "TRANSFER_UPDATED" || payload.type === "TRANSFERS_REPLACED") {
            const latest = payload.data?.transfers || payload.data;
            if (Array.isArray(latest)) {
              setJogjaTransfers(latest);
              localStorage.setItem("pt_abc_jogja_solo_transfers_v1", JSON.stringify(latest));
            }
          }
        } catch {
          // ignore parse error
        }
      };
    } catch {
      // ignore
    }

    // 4. Polling fallback every 3 seconds to guarantee 100% sync
    const pollInterval = setInterval(() => {
      fetch("/api/live/data")
        .then((res) => res.json())
        .then((json) => {
          if (json?.success && json?.data) {
            const { returns: sReturns, jogjaTransfers: sTransfers } = json.data;
            if (Array.isArray(sReturns) && sReturns.length > 0) {
              setReturns(sReturns);
              localStorage.setItem("pt_abc_returns_dc_v1", JSON.stringify(sReturns));
            }
            if (Array.isArray(sTransfers) && sTransfers.length > 0) {
              setJogjaTransfers(sTransfers);
              localStorage.setItem("pt_abc_jogja_solo_transfers_v1", JSON.stringify(sTransfers));
            }
          }
        })
        .catch(() => {});
    }, 3000);

    return () => {
      if (sse) sse.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Handle Changing DC
  const handleSelectDC = (dc: DistributionCenter) => {
    setActiveDC(dc);
    saveActiveDC(dc);
    setIsDCModalOpen(false);

    // Adjust tab if on DC-specific tab
    if (dc === "DC_SOLO" && activeTab === "jogja-send-solo") {
      setActiveTab("solo-receive-jogja");
    } else if (dc === "DC_JOGJA" && activeTab === "solo-receive-jogja") {
      setActiveTab("jogja-send-solo");
    }

    const greeting =
      dc === "DC_SOLO"
        ? "Selamat Datang Tim Operasional Solo, semangat untuk hari ini!"
        : "Selamat Datang Tim Operasional Jogja, semangat untuk hari ini!";

    addToast(
      `DC ${dc === "DC_SOLO" ? "Solo (Surakarta)" : "Jogja (DIY)"} Aktif`,
      greeting,
      "success"
    );
  };

  // User Management & Otorisasi Handlers
  const handleAddAuthorizedUser = async (newUser: AuthorizedUser) => {
    const updated = [
      newUser,
      ...authorizedUsers.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()),
    ];
    setAuthorizedUsers(updated);
    saveLocalAuthorizedUsers(updated);
    addToast(
      "Otorisasi Pengguna",
      `Email ${newUser.email} telah diberi hak akses ${newUser.role}`,
      "success"
    );

    try {
      await setDoc(doc(db, "users", newUser.email.replace(/[@.]/g, "_")), {
        ...newUser,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not sync user to firestore (offline/rules):", e);
    }
  };

  const handleUpdateAuthorizedUser = async (updatedUser: AuthorizedUser) => {
    const updated = authorizedUsers.map((u) =>
      u.email.toLowerCase() === updatedUser.email.toLowerCase() ? updatedUser : u
    );
    setAuthorizedUsers(updated);
    saveLocalAuthorizedUsers(updated);
    if (currentUser && currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()) {
      setCurrentUser(updatedUser);
    }
    addToast("Status Diperbarui", `Akses untuk ${updatedUser.email} diperbarui.`, "info");

    try {
      await setDoc(doc(db, "users", updatedUser.email.replace(/[@.]/g, "_")), {
        ...updatedUser,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not sync user update to firestore:", e);
    }
  };

  const handleDeleteAuthorizedUser = async (email: string) => {
    const updated = authorizedUsers.filter((u) => u.email.toLowerCase() !== email.toLowerCase());
    setAuthorizedUsers(updated);
    saveLocalAuthorizedUsers(updated);
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      const fallback =
        updated.find((u) => u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) ||
        updated[0];
      setCurrentUser(fallback || null);
    }
    addToast("Otorisasi Dihapus", `Akses untuk ${email} telah dicabut.`, "warning");

    try {
      await deleteDoc(doc(db, "users", email.replace(/[@.]/g, "_")));
    } catch (e) {
      console.warn("Could not delete user in firestore:", e);
    }
  };

  const handleSwitchUser = (user: AuthorizedUser) => {
    setCurrentUser(user);
    if (user.allowedDCs && user.allowedDCs.length > 0 && !user.allowedDCs.includes(activeDC)) {
      setActiveDC(user.allowedDCs[0]);
    }
    addToast(
      "Ganti Pengguna Aktif",
      `Masuk sebagai ${user.displayName} (${user.role})`,
      "info"
    );
  };

  // Handler: Save New Return (Store or Anonymous)
  const handleSaveReturn = (newItem: CosmeticReturnItem) => {
    if (currentUser && !currentUser.canEditReturns) {
      addToast("Akses Terbatas", `Role ${currentUser.role} tidak memiliki izin untuk menginput data retur.`, "warning");
      return;
    }
    if (currentUser && currentUser.allowedDCs && !currentUser.allowedDCs.includes(activeDC)) {
      addToast("Akses DC Dibatasi", `Akun Anda hanya diizinkan untuk mengelola ${currentUser.allowedDCs.join(", ")}.`, "warning");
      return;
    }

    const updated = addReturnItem(newItem);
    setReturns(updated);
    addToast(
      newItem.isAnonymousStore ? "Retur Tanpa Nama Toko Disimpan" : "Retur Toko Berhasil Dicatat",
      `Data ${newItem.id} untuk ${newItem.storeName} (${newItem.colliCount} koli) telah masuk antrean konfirmasi.`,
      "success"
    );
  };

  // Handler: Update Existing Return (e.g. from Manual Return processing)
  const handleUpdateReturn = (updatedItem: CosmeticReturnItem) => {
    if (currentUser && !currentUser.canEditReturns) {
      addToast("Akses Terbatas", `Role ${currentUser.role} tidak memiliki izin untuk mengedit hasil retur.`, "warning");
      return;
    }

    updateReturnItem(updatedItem);
    setReturns(loadReturns());
    addToast(
      "Hasil Retur Manual Disimpan",
      `Data barang retur untuk ${updatedItem.storeName} (${updatedItem.manualItems?.length || 0} jenis item, ${updatedItem.quantity} pcs) berhasil disimpan.`,
      "success"
    );
  };

  // Handler: Save Jogja to Solo Transfer
  const handleSaveJogjaTransfer = (newTransfer: JogjaToSoloTransferItem) => {
    if (currentUser && !currentUser.canEditReturns) {
      addToast("Akses Terbatas", `Role ${currentUser.role} tidak memiliki izin mengirim transfer retur.`, "warning");
      return;
    }

    const updated = addJogjaTransfer(newTransfer);
    setJogjaTransfers(updated);
    addToast(
      "Retur Dikirim ke DC Solo",
      `Kirim ${newTransfer.quantity} ${newTransfer.quantityUnit} dari ${newTransfer.storeName} (Kondisi: ${newTransfer.condition}) oleh ${newTransfer.senderName}. Data kini tersedia di menu "RETUR DARI JOGJA" di DC Solo.`,
      "success"
    );
  };

  // Handler: Tim Absolute Receipt Confirmation at DC Solo
  const handleConfirmTimAbsoluteTransfer = (
    transferId: string,
    timAbsoluteName: string,
    timAbsoluteNotes?: string,
    driverName?: string,
    verifiedQty?: number
  ) => {
    try {
      const result = confirmTimAbsoluteTransferReceipt(
        transferId,
        timAbsoluteName,
        timAbsoluteNotes,
        driverName,
        verifiedQty
      );

      setJogjaTransfers(result.updatedTransfers);
      setReturns(loadReturns()); // reload fresh returns containing the new return item

      addToast(
        "Konfirmasi Tim Absolute Berhasil",
        `Fisik barang transfer dari Jogja telah diterima oleh Tim Absolute (${timAbsoluteName}). Paket otomatis masuk ke antrean menu "DATA RETUR DRIVER & KONFIRMASI" di DC Solo.`,
        "success"
      );
    } catch (e: any) {
      addToast("Gagal Konfirmasi", e.message || "Terjadi kesalahan sistem", "warning");
    }
  };

  // Handler: Operator Handover Confirmation
  const handleConfirmHandover = (
    itemId: string,
    operatorName: string,
    storageBin: string,
    notes?: string
  ) => {
    if (currentUser && !currentUser.canConfirmOperator) {
      addToast("Akses Terbatas", `Role ${currentUser.role} tidak memiliki otorisasi untuk konfirmasi penerimaan operator.`, "warning");
      return;
    }

    const item = returns.find((r) => r.id === itemId);
    const storeLabel = item?.isAnonymousStore ? "Retur Tanpa Nama Toko" : item?.storeName || "Toko";

    const updated = confirmOperatorHandover(itemId, operatorName, storageBin, notes);
    setReturns(updated);

    addToast(
      "Konfirmasi Serah Terima Berhasil",
      `Fisik barang dari ${storeLabel} telah diverifikasi oleh ${operatorName} & disimpan di ${storageBin}.`,
      "success"
    );
  };

  // Handler: Open Confirm Modal
  const handleOpenConfirmModal = (item: CosmeticReturnItem) => {
    setActiveItemForConfirm(item);
    setIsConfirmModalOpen(true);
  };

  // Handler: Open Print Modal
  const handleOpenPrintModal = (item: CosmeticReturnItem) => {
    setActiveItemForPrint(item);
    setIsPrintModalOpen(true);
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
    const dcData = returns.filter((r) => r.dcLocation === activeDC);
    if (dcData.length === 0) {
      addToast("Tidak Ada Data", `Belum ada data retur di ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"}.`, "warning");
      return;
    }

    const headers = [
      "ID Retur",
      "Pusat Distribusi",
      "Waktu Terima Inbound",
      "Nama Toko",
      "No Surat Jalan",
      "Driver Pengantar",
      "Jumlah Koli",
      "Penerima (Tim Absolute)",
      "Status Serah Terima",
      "Operator Retur Penerima",
      "Waktu Konfirmasi Operator",
      "Lokasi Rak Penyimpanan",
      "Catatan Kondisi Fisik",
    ];

    const rows = dcData.map((item) => [
      `"${item.id}"`,
      `"${item.dcLocation === "DC_SOLO" ? "DC Solo" : "DC Jogja (DIY)"}"`,
      `"${item.inboundDayFormatted || item.inboundReceivedAt}"`,
      `"${item.isAnonymousStore ? "TANPA KETERANGAN NAMA TOKO" : item.storeName}"`,
      `"${item.orderId || "-"}"`,
      `"${item.driverName || "-"}"`,
      `"${item.colliCount || 1}"`,
      `"${item.inboundStaffName || "-"}"`,
      `"${item.handoverStatus}"`,
      `"${item.acceptedByOperator || "-"}"`,
      `"${item.acceptedDayFormatted || item.acceptedAt || "-"}"`,
      `"${item.storageBin || "-"}"`,
      `"${item.operatorConfirmationNotes || item.inboundNotes || "-"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Retur_${activeDC === "DC_SOLO" ? "Solo" : "Jogja"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Ekspor Berhasil", `Data retur ${activeDC === "DC_SOLO" ? "DC Solo" : "DC Jogja"} berhasil diunduh dalam format CSV.`, "success");
  };

  // Handler: Reset Default Data
  const handleResetData = () => {
    if (confirm("Reset seluruh data ke kondisi awal bawaan?")) {
      const resetResult = resetDefaultData();
      setReturns(resetResult.returns);
      setJogjaTransfers(resetResult.transfers);
      addToast("Data Direset", "Data retur dan transfer DC Jogja-Solo telah dikembalikan ke contoh bawaan.", "info");
    }
  };

  // Filtered stats for current DC
  const dcReturns = returns.filter((r) => r.dcLocation === activeDC);
  const pendingConfirmCount = dcReturns.filter(
    (r) => r.handoverStatus === "MENUNGGU_KONFIRMASI_OPERATOR"
  ).length;
  const anonymousCount = dcReturns.filter((r) => r.isAnonymousStore).length;

  const soloReceivePendingCount = jogjaTransfers.filter(
    (t) => t.transferStatus === "MENUNGGU_PENERIMAAN_SOLO"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row selection:bg-blue-600 selection:text-white">
      {/* 1. Left Sidebar Navigation Menu (SEMUA MENU DI SEBELAH KIRI) */}
      <Sidebar
        companyName={COMPANY_NAME}
        departmentName={DEPARTMENT_NAME}
        activeDC={activeDC}
        onSelectDC={handleSelectDC}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        operator={operator}
        pendingConfirmCount={pendingConfirmCount}
        totalReturnsCount={dcReturns.length}
        anonymousCount={anonymousCount}
        jogjaSendCount={jogjaTransfers.length}
        soloReceivePendingCount={soloReceivePendingCount}
        onResetData={handleResetData}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNavbar
          activeDC={activeDC}
          operator={operator}
          onSwitchDC={handleSelectDC}
          onOpenDCModal={() => setIsDCModalOpen(true)}
          onOpenProvisionCheck={() => setActiveTab("cek-harga-provisi")}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        />

        {/* Main Content View */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-7">
          {/* Welcome Greeting Motivational Banner (Auto-fades in 3 seconds) */}
          <WelcomeGreetingBanner key={activeDC} activeDC={activeDC} autoHideSeconds={3} />

          {/* TAB 1: Menu Input Retur Toko */}
          {activeTab === "store-return" && (
            <InputStoreReturnView
              activeDC={activeDC}
              onSaveReturn={handleSaveReturn}
              defaultStaffName={operator.name}
              onNavigateToConfirm={() => setActiveTab("driver-confirm")}
              onNavigateToManualReturn={() => setActiveTab("manual-return")}
            />
          )}

          {/* TAB 2: Menu Data Retur Driver & Konfirmasi Operator */}
          {activeTab === "driver-confirm" && (
            <DriverReturnsConfirmView
              returns={returns}
              activeDC={activeDC}
              onOpenConfirmModal={handleOpenConfirmModal}
              onOpenPrintSlip={handleOpenPrintModal}
              onExportCSV={handleExportCSV}
              onNavigateToInput={() => setActiveTab("store-return")}
              onProcessManualReturn={(item) => {
                setSelectedManualReturnId(item.id);
                setActiveTab("manual-return");
              }}
            />
          )}

          {/* TAB 3: Menu Retur Tanpa Keterangan Toko */}
          {activeTab === "anonymous-return" && (
            <InputAnonymousReturnView
              activeDC={activeDC}
              onSaveReturn={handleSaveReturn}
              defaultStaffName={operator.name}
              onNavigateToConfirm={() => setActiveTab("driver-confirm")}
            />
          )}

          {/* TAB 4 (DC JOGJA): Menu RETUR KIRIM SOLO */}
          {activeTab === "jogja-send-solo" && (
            <JogjaSendSoloView
              transfers={jogjaTransfers}
              onSaveTransfer={handleSaveJogjaTransfer}
              defaultSender={operator.name === "Oki Sujatmiko" ? "OKI" : "OKI"}
              onNavigateToConfirm={() => setActiveTab("driver-confirm")}
            />
          )}

          {/* TAB 4 (DC SOLO): Menu RETUR DARI JOGJA */}
          {activeTab === "solo-receive-jogja" && (
            <SoloReceiveJogjaView
              transfers={jogjaTransfers}
              onConfirmTimAbsolute={handleConfirmTimAbsoluteTransfer}
              onNavigateToDriverConfirm={() => setActiveTab("driver-confirm")}
            />
          )}

          {/* TAB 5: Menu RETUR MANUAL */}
          {activeTab === "manual-return" && (
            <ManualReturnStandaloneView
              returns={returns}
              activeDC={activeDC}
              onSaveReturn={handleSaveReturn}
              onUpdateReturn={handleUpdateReturn}
              defaultStaffName={operator.name}
              onNavigateToConfirm={() => setActiveTab("driver-confirm")}
              selectedReturnId={selectedManualReturnId}
              onClearSelectedReturnId={() => setSelectedManualReturnId(null)}
            />
          )}

          {/* TAB: CEK HARGA PROVISI (-70%) */}
          {activeTab === "cek-harga-provisi" && (
            <ProvisionPriceCheckView />
          )}

          {/* TAB 5: Database Master Toko Mitra */}
          {activeTab === "store-database" && (
            <StoreDirectoryView
              activeDC={activeDC}
              returns={returns}
              onSelectStoreForReturn={() => setActiveTab("store-return")}
              onOpenPrintSlip={handleOpenPrintModal}
              onOpenConfirmModal={handleOpenConfirmModal}
            />
          )}
        </main>

        {/* Footer Branding */}
        <footer className="bg-white border-t border-slate-200/90 py-4 px-6 text-center text-xs font-medium text-slate-500 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Sistem Operasional Aktif &bull; Database Cloud Tersinkron</span>
            </div>
            <span>
              🏢 <strong>{COMPANY_NAME}</strong> &bull; {DEPARTMENT_NAME}
            </span>
          </div>
        </footer>
      </div>

      {/* Modal 1: Initial DC Solo / DC Jogja Selection */}
      <DCSelectionModal
        isOpen={isDCModalOpen}
        onSelectDC={handleSelectDC}
        currentDC={activeDC}
        companyName={COMPANY_NAME}
        departmentName={DEPARTMENT_NAME}
      />

      {/* Modal 2: Operator Retur Confirmation Modal */}
      <OperatorConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        item={activeItemForConfirm}
        operator={operator}
        activeDC={activeDC}
        onConfirm={handleConfirmHandover}
      />

      {/* Modal 3: Print Return Slip Modal */}
      <PrintReturnSlipModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        item={activeItemForPrint}
        companyName={COMPANY_NAME}
        departmentName={DEPARTMENT_NAME}
        activeDC={activeDC}
      />

      {/* Modal 4: User Authentication & Login Modal */}
      <LoginAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          addToast("Login Berhasil", `Selamat bertugas, ${user.displayName} (${user.role})!`, "success");
        }}
        onLogout={() => {
          logoutUser();
          setCurrentUser(null);
          addToast("Selesai Sesi", "Anda telah keluar dari sistem.", "info");
        }}
        authorizedUsers={authorizedUsers}
        onRequestAccess={(unauthEmail) => {
          addToast(
            "Permintaan Akses Terkirim",
            `Permintaan izin akses untuk ${unauthEmail} telah disampaikan ke administrator (${PRIMARY_ADMIN_EMAIL}).`,
            "info"
          );
        }}
      />

      {/* Modal 5: Email Authorization & Access Control Management Modal */}
      <UserAuthManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={authorizedUsers}
        onAddUser={handleAddAuthorizedUser}
        onUpdateUser={handleUpdateAuthorizedUser}
        onDeleteUser={handleDeleteAuthorizedUser}
        currentUserEmail={currentUser?.email}
        onSwitchUser={handleSwitchUser}
      />

      {/* Live Toast Notifications */}
      <LiveNotificationToast toasts={toasts} onDismiss={removeToast} onCloseToast={removeToast} />
    </div>
  );
}


