import React, { useState } from 'react';
import {
  SPREADSHEET_URL,
  SPREADSHEET_ID,
  getSavedWebhookUrl,
  saveWebhookUrl,
  GOOGLE_APPS_SCRIPT_CODE,
  sendActionToGoogleSheetsWebhook,
} from '../services/sheetsService';
import { LinkItem } from '../types';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Code2,
  CheckCircle2,
  Upload,
  Sparkles,
} from 'lucide-react';

interface SheetsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  onWebhookSaved: () => void;
}

export const SheetsSettingsModal: React.FC<SheetsSettingsModalProps> = ({
  isOpen,
  onClose,
  links,
  onWebhookSaved,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(getSavedWebhookUrl());
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      saveWebhookUrl(webhookUrl);
      if (webhookUrl.trim() && links.length > 0) {
        // Otomatis sinkronkan data saat ini ke spreadsheet
        await sendActionToGoogleSheetsWebhook('syncAll', { links }, webhookUrl.trim());
      }
      setSaveSuccess(true);
      onWebhookSaved();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl my-8 transform transition-all max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Pengaturan Database Google Sheets</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hubungkan spreadsheet secara langsung tanpa batasan domain atau Firebase.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Modal */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Status Spreadsheet ID */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block text-[11px]">ID Spreadsheet Terhubung:</span>
              <span className="font-mono text-zinc-200 font-semibold truncate block max-w-sm">
                {SPREADSHEET_ID}
              </span>
            </div>
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 font-medium rounded-lg transition-colors shrink-0"
            >
              <span>Buka Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Panduan 3 Langkah Mudah */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Cara Mengaktifkan Sinkronisasi Menulis Otomatis (2 Menit):</span>
            </h3>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-xs text-zinc-300 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Buka Google Spreadsheet Anda, lalu klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div className="flex-1">
                  <p className="mb-2">
                    Hapus kode yang ada di Apps Script, lalu klik tombol di bawah untuk menyalin skrip resmi:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg border border-zinc-700 transition-colors shadow-xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Skrip Berhasil Disalin!' : 'Salin Kode Google Apps Script'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Di Apps Script, klik tombol <strong>Deploy (Terapkan)</strong> &gt; <strong>New deployment (Penerapan baru)</strong> &gt; pilih jenis <strong>Web app (Aplikasi web)</strong>. Atur <em>"Who has access"</em> menjadi <strong>Anyone (Siapa saja)</strong>, klik <strong>Deploy</strong>, lalu salin URL Web App (berakhiran <code className="text-red-300">/exec</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Form Input Webhook URL */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label htmlFor="webhook-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tempel URL Aplikasi Web Google Apps Script (Webhook):
              </label>
              <input
                id="webhook-input"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Setelah URL ini disimpan, setiap tambah materi, edit, dan hapus akan langsung tertulis ke Google Sheets secara real-time tanpa perlu login akun lagi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              >
                Tutup
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md shadow-red-950/60 disabled:opacity-60"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Tersimpan & Tersinkron!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSaving ? 'Menyinkronkan...' : 'Simpan & Sinkronkan Sekarang'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
