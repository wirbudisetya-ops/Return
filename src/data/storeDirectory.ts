import { DistributionCenter, StoreDirectoryItem } from "../types";

export const DEFAULT_STORES: StoreDirectoryItem[] = [
  // DC SOLO Stores
  {
    id: "STR-SLO-01",
    name: "Toko Kosmetik ABC Sejahtera Solo",
    code: "ABC-SJH-SLO",
    dcLocation: "DC_SOLO",
    city: "Surakarta (Solo)",
    address: "Jl. Slamet Riyadi No. 120, Surakarta",
    picName: "Rina Setyowati",
    phone: "0812-2500-1122",
  },
  {
    id: "STR-SLO-02",
    name: "Aura Beauty Mart Solo Baru",
    code: "AUR-SBR-SLO",
    dcLocation: "DC_SOLO",
    city: "Sukoharjo / Solo Baru",
    address: "Ruko Sentra Niaga Solo Baru Blok A-05, Sukoharjo",
    picName: "Dimas Nugroho",
    phone: "0813-2611-3344",
  },
  {
    id: "STR-SLO-03",
    name: "Glow Point Surakarta Grand",
    code: "GLW-GRD-SLO",
    dcLocation: "DC_SOLO",
    city: "Surakarta (Solo)",
    address: "Jl. Brigjend Slamet Riyadi No. 45, Solo",
    picName: "Sari Astuti",
    phone: "0815-4800-9988",
  },
  {
    id: "STR-SLO-04",
    name: "Toko Cantik Bintang Raya Solo",
    code: "BTR-COY-SLO",
    dcLocation: "DC_SOLO",
    city: "Surakarta (Solo)",
    address: "Jl. Dr. Rajiman No. 155, Surakarta",
    picName: "Hendra Wijaya",
    phone: "0811-2900-5566",
  },
  {
    id: "STR-SLO-05",
    name: "Harmoni Kosmetik Kartosuro",
    code: "HRM-KTR-SLO",
    dcLocation: "DC_SOLO",
    city: "Sukoharjo / Kartasura",
    address: "Jl. Raya Ahmad Yani No. 80, Kartosuro",
    picName: "Bambang Tri",
    phone: "0812-3322-1100",
  },
  {
    id: "STR-SLO-06",
    name: "Mitra Sehat & Cantik Palur",
    code: "MTR-PLR-SLO",
    dcLocation: "DC_SOLO",
    city: "Karanganyar / Solo",
    address: "Jl. Raya Palur Km. 5, Karanganyar",
    picName: "Endah Sulastri",
    phone: "0818-0400-6677",
  },
  {
    id: "STR-SLO-07",
    name: "Pesona Beauty Surakarta",
    code: "PSN-SQR-SLO",
    dcLocation: "DC_SOLO",
    city: "Surakarta (Solo)",
    address: "Jl. Adi Sucipto No. 08, Surakarta",
    picName: "Dewi Anggraeni",
    phone: "0812-9988-1234",
  },
  {
    id: "STR-SLO-08",
    name: "Toko Surya Kosmetik Pasar Klewer",
    code: "SRY-KLW-SLO",
    dcLocation: "DC_SOLO",
    city: "Surakarta (Solo)",
    address: "Pasar Klewer Blok B No. 22, Surakarta",
    picName: "Ibu Hartini",
    phone: "0813-9090-8877",
  },

  // DC JOGJA Stores
  {
    id: "STR-JOG-01",
    name: "Toko Kosmetik ABC Malioboro",
    code: "ABC-MLY-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Kota)",
    address: "Jl. Malioboro No. 20, Danurejan, Yogyakarta",
    picName: "Anisa Rahmawati",
    phone: "0812-2700-8899",
  },
  {
    id: "STR-JOG-02",
    name: "Beauty Corner Nusa Indah Sleman",
    code: "BCN-SLM-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Sleman)",
    address: "Jl. Ring Road Utara No. 10, Sleman, DIY",
    picName: "Tri Wahyudi",
    phone: "0813-2890-4455",
  },
  {
    id: "STR-JOG-03",
    name: "Glow Mart Yogyakarta City",
    code: "GLW-YGC-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Sleman)",
    address: "Jl. Magelang Km. 6 No. 28, Sleman, DIY",
    picName: "Lia Kartika",
    phone: "0815-7800-1122",
  },
  {
    id: "STR-JOG-04",
    name: "Toko Pesona Cantik Bantul",
    code: "PSC-BTL-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Bantul)",
    address: "Jl. Bantul Km. 7 No. 9, Sewon, Bantul",
    picName: "Kusnadi",
    phone: "0811-2600-3344",
  },
  {
    id: "STR-JOG-05",
    name: "Mitra Kosmetik Sejati Jogja",
    code: "MKS-AMB-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Sleman)",
    address: "Jl. Laksda Adisucipto No. 15, Sleman",
    picName: "Maya Safitri",
    phone: "0812-3900-5566",
  },
  {
    id: "STR-JOG-06",
    name: "Toko Harmoni Beauty Sleman",
    code: "HRM-SLM-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Sleman)",
    address: "Jl. Kaliurang Km. 8 No. 12, Ngaglik, Sleman",
    picName: "Ibu Ratna",
    phone: "0818-0200-7788",
  },
  {
    id: "STR-JOG-07",
    name: "Swalayan Cantik Sejahtera Jogja",
    code: "SCS-KST-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Kota)",
    address: "Jl. Urip Sumoharjo No. 40, Gondokusuman, Yogyakarta",
    picName: "Budi Pramono",
    phone: "0813-2777-9900",
  },
  {
    id: "STR-JOG-08",
    name: "Glow & Shine Swalayan Jogja",
    code: "GNS-KSM-JOG",
    dcLocation: "DC_JOGJA",
    city: "Yogyakarta (Kota)",
    address: "Jl. Kusumanegara No. 135, Umbulharjo, Yogyakarta",
    picName: "Wulan Puspita",
    phone: "0812-2999-4411",
  },
];

const STORE_STORAGE_KEY = "pt_abc_store_directory_v1";

export function loadStoreDirectory(dcLocation?: DistributionCenter): StoreDirectoryItem[] {
  try {
    localStorage.removeItem("cosmetics_store_directory_v2");
    localStorage.removeItem("cosmetics_store_directory_v1");
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    let stores: StoreDirectoryItem[] = DEFAULT_STORES;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stores = parsed;
      }
    } else {
      localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(DEFAULT_STORES));
    }

    if (dcLocation) {
      return stores.filter((s) => s.dcLocation === dcLocation);
    }
    return stores;
  } catch (e) {
    console.error("Failed to load store directory:", e);
    return DEFAULT_STORES;
  }
}

export function addStoreToDirectory(newStore: StoreDirectoryItem): StoreDirectoryItem[] {
  const current = loadStoreDirectory();
  const exists = current.some(
    (s) => s.name.toLowerCase() === newStore.name.toLowerCase() && s.dcLocation === newStore.dcLocation
  );
  if (exists) return current;

  const updated = [newStore, ...current];
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save store directory:", e);
  }
  return updated;
}

export function bulkAddStoresToDirectory(newStores: StoreDirectoryItem[]): { addedCount: number; updatedList: StoreDirectoryItem[] } {
  const current = loadStoreDirectory();
  let addedCount = 0;
  const listToAdd: StoreDirectoryItem[] = [];

  newStores.forEach((newS) => {
    const trimmedName = newS.name.trim();
    if (!trimmedName) return;

    const alreadyExists = current.some(
      (existing) =>
        existing.name.toLowerCase() === trimmedName.toLowerCase() &&
        existing.dcLocation === newS.dcLocation
    ) || listToAdd.some(
      (pending) =>
        pending.name.toLowerCase() === trimmedName.toLowerCase() &&
        pending.dcLocation === newS.dcLocation
    );

    if (!alreadyExists) {
      listToAdd.push({
        ...newS,
        name: trimmedName,
      });
      addedCount++;
    }
  });

  const updatedList = [...listToAdd, ...current];
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(updatedList));
  } catch (e) {
    console.error("Failed to save bulk stores to localStorage:", e);
  }
  return { addedCount, updatedList };
}

export function deleteStoreFromDirectory(storeId: string): StoreDirectoryItem[] {
  const current = loadStoreDirectory();
  const updated = current.filter((s) => s.id !== storeId);
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete store:", e);
  }
  return updated;
}

export function resetStoreDirectoryToDefault(): StoreDirectoryItem[] {
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(DEFAULT_STORES));
  } catch (e) {
    console.error("Failed to reset store directory:", e);
  }
  return DEFAULT_STORES;
}
