import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  type?: 'danger' | 'warning';
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  type = 'danger',
  title,
  message,
  subMessage,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-zinc-900 rounded-xl max-w-md w-full p-5 shadow-2xl border border-zinc-800 transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-950/60 text-red-400 border border-red-900/70'
                : 'bg-red-950/50 text-red-400 border border-red-900/70'
            }`}
          >
            {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-zinc-100 leading-tight mb-1.5">{title}</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{message}</p>
            {subMessage && (
              <p className="mt-2 text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono break-all">
                {subMessage}
              </p>
            )}
          </div>

          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors -mr-1 -mt-1"
            aria-label="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-950/50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
