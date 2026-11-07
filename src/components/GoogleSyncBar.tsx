import React from 'react';
import { SPREADSHEET_URL, SPREADSHEET_ID, getSavedWebhookUrl } from '../services/sheetsService';
import { RefreshCw, ExternalLink, Settings, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface GoogleSyncBarProps {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  onRefreshData: () => void;
  onOpenSettings: () => void;
  totalSyncedCount: number;
}

export const GoogleSyncBar: React.FC<GoogleSyncBarProps> = ({
  isSyncing,
  lastSyncedAt,
  syncError,
  onRefreshData,
  onOpenSettings,
  totalSyncedCount,
}) => {
  const hasWebhook = Boolean(getSavedWebhookUrl());

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sisi Kiri: Status Koneksi Langsung ke Google Spreadsheet */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-950/40 border-emerald-800/80 text-emerald-400">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Database: Google Spreadsheet</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Langsung Terhubung
                </span>
                {hasWebhook ? (
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    Auto-Sync Menulis Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                    Auto-Tulis: Butuh Webhook
                  </span>
                )}
              </h3>

              <a
                href={SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 transition-colors"
                title="Buka Spreadsheet di tab baru"
              >
                <span>Buka Sheet ({SPREADSHEET_ID.slice(0, 8)}...)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Terkoneksi langsung ke spreadsheet Anda tanpa login Firebase. Data dibaca otomatis secara real-time.
              {lastSyncedAt && (
                <span className="block text-[11px] text-zinc-500 mt-0.5 font-mono tabular-nums">
                  Terakhir diperbarui dari Google Sheets:{' '}
                  {lastSyncedAt.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}{' '}
                  ({totalSyncedCount} data materi)
                </span>
              )}
            </p>

            {syncError && (
              <div className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-900/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Tombol Tarik Data & Pengaturan Webhook */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors disabled:opacity-60 active:scale-[0.98]"
            title="Tarik data terbaru dari Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-400' : 'text-zinc-400'}`} />
            <span>{isSyncing ? 'Mengambil Data...' : 'Tarik Data Sheet'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              hasWebhook
                ? 'text-zinc-300 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border-zinc-800'
                : 'text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 border-amber-800/80 animate-pulse'
            }`}
            title="Atur sinkronisasi menulis otomatis ke Google Sheets"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{hasWebhook ? 'Pengaturan Sync' : 'Atur Auto-Tulis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
