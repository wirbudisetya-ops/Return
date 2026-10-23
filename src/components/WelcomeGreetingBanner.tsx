import React, { useState, useEffect } from "react";
import { X, Sparkles, Building2 } from "lucide-react";
import { DistributionCenter } from "../types";

interface WelcomeGreetingBannerProps {
  activeDC: DistributionCenter;
  autoHideSeconds?: number;
}

export const WelcomeGreetingBanner: React.FC<WelcomeGreetingBannerProps> = ({
  activeDC,
  autoHideSeconds = 4,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);

  // When activeDC changes or component mounts, show banner and auto-hide
  useEffect(() => {
    setIsVisible(true);
    setIsFading(false);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, Math.max(500, autoHideSeconds * 1000 - 500));

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setIsFading(false);
    }, autoHideSeconds * 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [activeDC, autoHideSeconds]);

  if (!isVisible) return null;

  const isSolo = activeDC === "DC_SOLO";
  const name = isSolo ? "Tim Solo" : "Tim Jogja";
  const dcTitle = isSolo ? "DC Solo (Surakarta)" : "DC Jogja (DIY)";
  const subText = isSolo
    ? "Operasional Hub DC Solo & Tim Inbound Retur"
    : "Operasional Hub DC Jogja (DIY) & Tim Ekspedisi Antar Hub";

  return (
    <div
      id="welcome-greeting-banner"
      className={`mb-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 shadow-xs transition-all duration-400 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isFading
          ? "opacity-0 -translate-y-1 scale-[0.99] pointer-events-none"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Selamat Datang, <span className="text-blue-600 font-extrabold">{name}</span>!
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold font-mono">
              {dcTitle}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {subText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <span className="text-[11px] text-slate-400 hidden md:inline">
          Semangat untuk hari ini
        </span>
        <button
          onClick={() => {
            setIsFading(true);
            setTimeout(() => setIsVisible(false), 200);
          }}
          title="Tutup pesan"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle Auto-dismiss line indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
        <div
          className="h-full bg-blue-500/70 transition-all ease-linear"
          style={{
            width: isFading ? "100%" : "0%",
            transitionDuration: `${autoHideSeconds}s`,
          }}
        />
      </div>
    </div>
  );
};

