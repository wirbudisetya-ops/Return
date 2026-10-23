import React, { useState, useEffect } from "react";
import { DistributionCenter } from "../types";
import { Sparkles, ArrowRight } from "lucide-react";

interface FloralWelcomeScreenProps {
  activeDC: DistributionCenter;
  onFinish: () => void;
  durationSeconds?: number;
}

export const FloralWelcomeScreen: React.FC<FloralWelcomeScreenProps> = ({
  activeDC,
  onFinish,
  durationSeconds = 3,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const isSolo = activeDC === "DC_SOLO";

  const mainTitle = isSolo
    ? "Selamat Datang Tim Operasional Solo, semangat untuk hari ini!"
    : "Selamat Datang Tim Operasional Jogja, semangat untuk hari ini!";

  const dcTitle = isSolo
    ? "DISTRIBUTION CENTER SOLO (SURAKARTA)"
    : "DISTRIBUTION CENTER JOGJA (DIY)";

  const dcSubtitle = isSolo
    ? "Hub Operasional Logistik DC Solo • Tim Absolute & Gudang"
    : "Hub Operasional DIY • Tim Ekspedisi & Logistik Jogja-Solo";

  // Countdown 3 seconds timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFadingOut(true);
          setTimeout(() => {
            onFinish();
          }, 450); // wait fade out transition
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 250);
  };

  return (
    <div
      id="floral-welcome-screen-overlay"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 select-none transition-all duration-500 overflow-hidden ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      } ${
        isSolo
          ? "bg-gradient-to-br from-rose-900 via-rose-800 to-pink-950 text-white"
          : "bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white"
      }`}
    >
      {/* Decorative Floral Background Elements */}
      {/* Top Left Big Floral Bloom */}
      <div className="absolute -top-10 -left-10 sm:-top-6 sm:-left-6 text-8xl sm:text-9xl opacity-30 animate-pulse pointer-events-none filter drop-shadow-2xl">
        🌸
      </div>
      <div className="absolute top-8 left-28 sm:left-40 text-4xl sm:text-5xl opacity-40 animate-bounce pointer-events-none">
        🌺
      </div>
      <div className="absolute top-32 left-8 sm:left-16 text-3xl sm:text-4xl opacity-35 pointer-events-none">
        🌷
      </div>

      {/* Top Right Floral Bloom */}
      <div className="absolute -top-10 -right-10 sm:-top-6 sm:-right-6 text-8xl sm:text-9xl opacity-30 animate-pulse pointer-events-none filter drop-shadow-2xl">
        🌺
      </div>
      <div className="absolute top-10 right-28 sm:right-36 text-4xl sm:text-5xl opacity-40 pointer-events-none">
        🌸
      </div>
      <div className="absolute top-32 right-12 text-3xl sm:text-4xl opacity-30 pointer-events-none">
        🌼
      </div>

      {/* Bottom Left Floating Flowers */}
      <div className="absolute -bottom-10 -left-10 text-8xl sm:text-9xl opacity-30 pointer-events-none filter drop-shadow-2xl">
        💐
      </div>
      <div className="absolute bottom-20 left-24 text-4xl opacity-35 pointer-events-none">
        🌹
      </div>

      {/* Bottom Right Floating Flowers */}
      <div className="absolute -bottom-10 -right-10 text-8xl sm:text-9xl opacity-30 pointer-events-none filter drop-shadow-2xl">
        🌻
      </div>
      <div className="absolute bottom-16 right-24 text-4xl opacity-35 pointer-events-none">
        🌸
      </div>

      {/* Floating Animated Floral Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-1/4 left-1/5 text-2xl opacity-40 animate-ping">✨</span>
        <span className="absolute top-1/3 right-1/4 text-2xl opacity-50 animate-ping">✨</span>
        <span className="absolute bottom-1/4 left-1/3 text-xl opacity-40 animate-pulse">🌸</span>
        <span className="absolute bottom-1/3 right-1/5 text-2xl opacity-40 animate-pulse">🌺</span>
        <span className="absolute top-1/2 left-1/10 text-3xl opacity-30 animate-bounce">🌷</span>
        <span className="absolute top-2/3 right-1/10 text-3xl opacity-30 animate-bounce">🌻</span>
      </div>

      {/* Main Glassmorphic Floral Card */}
      <div className="relative z-10 max-w-2xl w-full mx-auto bg-white/15 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-white/30 shadow-[0px_20px_50px_rgba(0,0,0,0.5)] text-center transform transition-transform duration-500">
        {/* Flower Icon Center Badge */}
        <div className="mx-auto mb-5 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-white/20 to-white/40 border-2 border-white/60 flex items-center justify-center shadow-2xl backdrop-blur-lg animate-bounce">
          <span className="text-4xl sm:text-5xl drop-shadow-md">
            {isSolo ? "🌺" : "🌸"}
          </span>
        </div>

        {/* DC Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/40 text-xs sm:text-sm font-black uppercase tracking-widest text-white/95 shadow-inner mb-4">
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>{dcTitle}</span>
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
        </div>

        {/* Main Big Greeting Text */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] my-3">
          {mainTitle}
        </h1>

        {/* Subtitle Message */}
        <p className="text-sm sm:text-base md:text-lg font-medium text-white/90 max-w-lg mx-auto mt-3 leading-relaxed drop-shadow-sm">
          {dcSubtitle}
        </p>

        {/* Floral Divider */}
        <div className="flex items-center justify-center gap-3 my-6 text-white/70">
          <span className="h-0.5 w-12 bg-white/40 rounded-full"></span>
          <span className="text-lg">🌸 🌿 🌺</span>
          <span className="h-0.5 w-12 bg-white/40 rounded-full"></span>
        </div>

        {/* Bottom Status & Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white/80 px-2">
            <span>Membuka Halaman Utama...</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-md font-mono">
              {timeLeft > 0 ? `${timeLeft}s` : "Masuk"}
            </span>
          </div>

          {/* Animated 3-Second Progress Bar */}
          <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/20 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-rose-300 to-white rounded-full transition-all ease-linear"
              style={{
                width: `${((durationSeconds - timeLeft) / durationSeconds) * 100}%`,
                transitionDuration: "1000ms",
              }}
            />
          </div>

          {/* Skip / Enter Now Button */}
          <div className="pt-3">
            <button
              onClick={handleSkip}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3)] cursor-pointer"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="relative z-10 mt-6 text-xs text-white/60 font-semibold tracking-wide flex items-center gap-2">
        <span>PT ABC</span>
        <span>•</span>
        <span>Sistem Retur Kosmetik Real-Time</span>
      </div>
    </div>
  );
};
