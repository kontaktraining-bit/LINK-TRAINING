import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl bg-zinc-900 transition-all transform translate-y-0 ${
              isError
                ? 'border-red-800/80 text-zinc-100'
                : isSuccess
                ? 'border-zinc-800 text-zinc-100'
                : isWarning
                ? 'border-amber-800/80 text-zinc-100'
                : 'border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-red-500" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-red-400" />}
            </div>

            <div className="flex-1 text-sm">
              {toast.title && <div className="font-semibold text-zinc-100 mb-0.5">{toast.title}</div>}
              <div className="text-zinc-400 leading-snug text-xs sm:text-sm">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
