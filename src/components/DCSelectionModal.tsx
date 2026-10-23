import React from "react";
import { Building2, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { DistributionCenter } from "../types";

interface DCSelectionModalProps {
  isOpen: boolean;
  onSelectDC: (dc: DistributionCenter) => void;
  currentDC: DistributionCenter;
  companyName: string;
  departmentName: string;
}

export const DCSelectionModal: React.FC<DCSelectionModalProps> = ({
  isOpen,
  onSelectDC,
  currentDC,
  companyName,
  departmentName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white border-2 border-slate-900 rounded-2xl w-full max-w-xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6 sm:p-7 animate-in fade-in zoom-in duration-150">
        
        {/* Header Branding */}
        <div className="text-center pb-5 border-b border-slate-200">
          <div className="w-12 h-12 bg-rose-500 rounded-xl text-white flex items-center justify-center mx-auto mb-3 shadow-sm border border-rose-400 text-2xl font-black">
            🏢
          </div>
          <span className="text-xs font-black tracking-widest text-rose-600 uppercase">
            {companyName}
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide mt-0.5">
            {departmentName}
          </h2>
          <p className="text-xs font-bold text-slate-600 mt-2">
            Silakan pilih Distribution Center (DC) operasional Anda untuk memulai pencatatan dan konfirmasi serah terima retur:
          </p>
        </div>

        {/* 2 Main DC Choices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Choice 1: DC SOLO */}
          <div
            onClick={() => onSelectDC("DC_SOLO")}
            className="border-2 border-slate-900 rounded-xl p-5 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded">
                  Wilayah Solo Raya
                </span>
                <MapPin className="w-5 h-5 text-rose-600 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-rose-700">
                DC SOLO
              </h3>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Gudang Hub DC Solo & sekitarnya.
              </p>
              <div className="mt-2 text-[11px] font-bold text-rose-700">
                Operator: Operator DC Solo
              </div>
              <div className="mt-2 bg-rose-200/70 border border-rose-300 rounded-md px-2.5 py-1.5 text-[11px] font-bold text-rose-950">
                💬 &ldquo;Selamat Datang Tim Operasional Solo, semangat untuk hari ini!&rdquo;
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-rose-900">
                Pilih DC Solo &rarr;
              </span>
              <span className="text-xs font-mono font-black text-slate-800">Hub Solo</span>
            </div>
          </div>

          {/* Choice 2: DC JOGJA */}
          <div
            onClick={() => onSelectDC("DC_JOGJA")}
            className="border-2 border-slate-900 rounded-xl p-5 bg-blue-50 hover:bg-sky-100 transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded">
                  Wilayah DIY
                </span>
                <MapPin className="w-5 h-5 text-blue-600 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-700">
                DC JOGJA
              </h3>
              <p className="text-xs font-bold text-slate-700 mt-1">
                DIY (D.I. Yogyakarta) & sekitarnya.
              </p>
              <div className="mt-2 text-[11px] font-bold text-blue-700">
                Operator: Oki Sujatmiko
              </div>
              <div className="mt-2 bg-blue-200/70 border border-blue-300 rounded-md px-2.5 py-1.5 text-[11px] font-bold text-blue-950">
                💬 &ldquo;Selamat Datang Oki Sujatmiko, semangat untuk hari ini!&rdquo;
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-blue-900">
                Pilih DC Jogja &rarr;
              </span>
              <span className="text-xs font-mono font-black text-slate-800">Hub DIY</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] font-bold text-slate-500 border-t border-slate-200 pt-3">
          Anda dapat berpindah antara DC Solo dan DC Jogja kapan saja melalui tombol navigasi di bagian atas halaman.
        </div>
      </div>
    </div>
  );
};
