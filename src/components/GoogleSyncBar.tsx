import React from 'react';
import { User } from 'firebase/auth';
import { SPREADSHEET_URL } from '../services/sheetsService';
import { RefreshCw, ExternalLink, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleSyncBarProps {
  user: User | null;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncError: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onManualSync: () => void;
}

export const GoogleSyncBar: React.FC<GoogleSyncBarProps> = ({
  user,
  isSyncing,
  lastSyncedAt,
  syncError,
  onLogin,
  onLogout,
  onManualSync,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sisi Kiri: Status Koneksi Spreadsheet */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              user
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
          >
            {user ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
                <path d="M9 21V9" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>Database Google Sheets</span>
                {user ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Tersinkron Otomatis
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                    Lokal (Belum Login)
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
                <span>Buka Spreadsheet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              {user ? (
                <>
                  Terhubung sebagai <span className="text-zinc-200 font-medium">{user.displayName || user.email}</span>. Setiap tambah, edit, dan hapus tautan otomatis disinkronkan ke Google Sheets.
                  {lastSyncedAt && (
                    <span className="block text-[11px] text-zinc-500 mt-0.5 font-mono tabular-nums">
                      Terakhir sinkron: {lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </>
              ) : (
                'Masuk dengan Google untuk mengaktifkan sinkronisasi 2 arah otomatis (tambah, edit, dan hapus data) ke spreadsheet yang Anda tentukan.'
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

        {/* Sisi Kanan: Tombol Aksi Login / Sinkron */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          {user ? (
            <>
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors disabled:opacity-60"
                title="Sinkronkan data sekarang"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-400' : 'text-zinc-400'}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
                title="Putuskan koneksi Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </>
          ) : (
            /* Tombol Resmi "Sign in with Google" */
            <button
              type="button"
              onClick={onLogin}
              disabled={isSyncing}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-100 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all shadow-sm active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Hubungkan Google Sheets</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
