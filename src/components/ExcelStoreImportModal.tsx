import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Building,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { DistributionCenter, StoreDirectoryItem } from "../types";
import { bulkAddStoresToDirectory } from "../data/storeDirectory";

interface ExcelStoreImportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  activeDC: DistributionCenter;
  onImportSuccess: (addedCount: number) => void;
}

interface ParsedStoreRow {
  rowNum: number;
  name: string;
  code?: string;
  dcLocation: DistributionCenter;
  city?: string;
  address?: string;
  picName?: string;
  phone?: string;
  isValid: boolean;
  errorMessage?: string;
}

export const ExcelStoreImportModal: React.FC<ExcelStoreImportModalProps> = ({
  isOpen = true,
  onClose,
  activeDC,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStoreRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [importSummary, setImportSummary] = useState<{ total: number; added: number; skipped: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nama Toko (Wajib)": "Toko Kosmetik ABC Sejahtera Solo",
        "Pilihan DC (SOLO / JOGJA)": "SOLO",
        "Kota / Wilayah": "Surakarta",
        "Kode Toko (Opsional)": "ABC-SJH-SLO",
        "Alamat Lengkap (Opsional)": "Jl. Slamet Riyadi No. 120",
      },
      {
        "Nama Toko (Wajib)": "Aura Beauty Mart Solo Baru",
        "Pilihan DC (SOLO / JOGJA)": "SOLO",
        "Kota / Wilayah": "Sukoharjo",
        "Kode Toko (Opsional)": "AUR-SBR-SLO",
        "Alamat Lengkap (Opsional)": "Ruko Sentra Niaga Blok A-05",
      },
      {
        "Nama Toko (Wajib)": "Toko Kosmetik ABC Malioboro",
        "Pilihan DC (SOLO / JOGJA)": "JOGJA",
        "Kota / Wilayah": "Yogyakarta / DIY",
        "Kode Toko (Opsional)": "ABC-MLY-JOG",
        "Alamat Lengkap (Opsional)": "Jl. Malioboro No. 20, Danurejan",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet["!cols"] = [
      { wch: 35 },
      { wch: 25 },
      { wch: 22 },
      { wch: 20 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Toko");
    XLSX.writeFile(workbook, "Template_Master_Toko.xlsx");
  };

  const parseDCLocation = (rawVal: any, fallbackDC: DistributionCenter): DistributionCenter => {
    if (!rawVal) return fallbackDC;
    const str = String(rawVal).trim().toUpperCase();
    if (str.includes("JOG") || str.includes("DIY") || str.includes("YOG")) {
      return "DC_JOGJA";
    }
    if (str.includes("SOL") || str.includes("SKA") || str.includes("SURAKARTA") || str.includes("SLO")) {
      return "DC_SOLO";
    }
    return fallbackDC;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    processFile(droppedFile);
  };

  const processFile = (inputFile: File) => {
    setFile(inputFile);
    setIsLoading(true);
    setErrorMsg(null);
    setIsSuccess(false);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) throw new Error("File Excel kosong.");

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawJson.length === 0) {
          throw new Error("Tidak ada data ditemukan dalam file Excel.");
        }

        const rows: ParsedStoreRow[] = rawJson.map((row, idx) => {
          const nameVal =
            row["Nama Toko (Wajib)"] ||
            row["Nama Toko"] ||
            row["nama_toko"] ||
            row["NAMA TOKO"] ||
            row["Store Name"] ||
            row["Nama"] ||
            "";

          const dcVal =
            row["Pilihan DC (SOLO / JOGJA)"] ||
            row["Pilihan DC"] ||
            row["DC"] ||
            row["Lokasi DC"] ||
            "";

          const cityVal = row["Kota / Wilayah"] || row["Kota"] || "";
          const codeVal = row["Kode Toko (Opsional)"] || row["Kode Toko"] || row["Kode"] || "";
          const addressVal = row["Alamat Lengkap (Opsional)"] || row["Alamat"] || "";

          const trimmedName = String(nameVal).trim();
          const targetDC = parseDCLocation(dcVal, activeDC);
          const isValid = trimmedName.length > 0;

          return {
            rowNum: idx + 2,
            name: trimmedName,
            code: codeVal ? String(codeVal).trim() : undefined,
            dcLocation: targetDC,
            city: cityVal ? String(cityVal).trim() : undefined,
            address: addressVal ? String(addressVal).trim() : undefined,
            isValid,
            errorMessage: isValid ? undefined : "Nama Toko wajib diisi",
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal membaca file Excel.");
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsBinaryString(inputFile);
  };

  const handleSaveToDatabase = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const itemsToSave: StoreDirectoryItem[] = validRows.map((r, idx) => {
      const cleanPrefix = r.name.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "STR";
      const autoCode = r.code || `${cleanPrefix}-${String(Date.now() + idx).slice(-4)}`;
      const autoId = `STR-${r.dcLocation === "DC_SOLO" ? "SLO" : "JOG"}-${Date.now()}-${idx}`;

      return {
        id: autoId,
        name: r.name,
        code: autoCode,
        dcLocation: r.dcLocation,
        city: r.city || (r.dcLocation === "DC_SOLO" ? "Surakarta" : "DIY"),
        address: r.address,
      };
    });

    const { addedCount } = bulkAddStoresToDirectory(itemsToSave);

    setImportSummary({
      total: validRows.length,
      added: addedCount,
      skipped: validRows.length - addedCount,
    });

    setIsSuccess(true);
    onImportSuccess(addedCount);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-3xl shadow-xl text-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Import Data Toko dari Excel
              </h2>
              <p className="text-xs text-slate-400">
                Tambah daftar toko massal menggunakan file .xlsx / .csv
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Template Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-700">
                Gunakan template standar untuk hasil import maksimal
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pastikan kolom <strong>Nama Toko</strong> terisi dengan benar.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Unduh Template</span>
            </button>
          </div>

          {/* Upload Area */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">
                  Klik untuk pilih file atau tarik (drag & drop) ke sini
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format file yang didukung: <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} baris dibaca
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setErrorMsg(null);
                  setIsSuccess(false);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti File</span>
              </button>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    Berhasil Mengimport {importSummary.added} Toko Baru
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {importSummary.skipped > 0 ? `${importSummary.skipped} toko dilewati karena sudah ada.` : "Semua data berhasil disimpan ke database."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview list */}
          {parsedRows.length > 0 && !isSuccess && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Pratinjau Data ({validCount} toko valid)</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px] border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">No.</th>
                      <th className="py-2 px-3">Nama Toko</th>
                      <th className="py-2 px-3">Hub DC</th>
                      <th className="py-2 px-3">Kota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{r.name}</td>
                        <td className="py-2 px-3">{r.dcLocation === "DC_SOLO" ? "Solo" : "Jogja"}</td>
                        <td className="py-2 px-3 text-slate-500">{r.city || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            {isSuccess ? "Selesai" : "Batal"}
          </button>

          {!isSuccess && parsedRows.length > 0 && (
            <button
              onClick={handleSaveToDatabase}
              disabled={validCount === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Simpan {validCount} Toko ke Database
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
