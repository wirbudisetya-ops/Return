import React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
}

interface LiveNotificationToastProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onCloseToast?: (id: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  toasts,
  onDismiss,
  onCloseToast,
}) => {
  if (toasts.length === 0) return null;

  const handleClose = (id: string) => {
    if (typeof onDismiss === "function") {
      onDismiss(id);
    } else if (typeof onCloseToast === "function") {
      onCloseToast(id);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 border-2 border-black flex items-start space-x-3 text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            toast.type === "success"
              ? "bg-[#DCFCE7] text-green-950"
              : toast.type === "warning"
              ? "bg-[#FEF3C7] text-amber-950"
              : "bg-[#E0F2FE] text-blue-950"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-800 shrink-0 mt-0.5 stroke-[2.5]" />
          ) : toast.type === "warning" ? (
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5 stroke-[2.5]" />
          ) : (
            <Info className="w-5 h-5 text-blue-800 shrink-0 mt-0.5 stroke-[2.5]" />
          )}

          <div className="flex-1">
            <div className="font-black uppercase tracking-wider">{toast.title}</div>
            <div className="font-bold text-[11px] mt-0.5 opacity-90">{toast.message}</div>
          </div>

          <button
            type="button"
            onClick={() => handleClose(toast.id)}
            className="text-black hover:opacity-60 cursor-pointer p-0.5"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ))}
    </div>
  );
};
