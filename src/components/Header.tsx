import React, { useState } from 'react';
import { Download, Plus, FileCode2 } from 'lucide-react';

interface HeaderProps {
  totalLinks: number;
  totalCategories: number;
  onOpenAddModal: () => void;
  onOpenExportImport: () => void;
  onOpenStandaloneModal: () => void;
}

const LOGO_URL = 'https://karir.tiberman.com/wp-content/uploads/2021/11/logo-Tiberman-Favicon-1.png';

export const Header: React.FC<HeaderProps> = ({
  totalLinks,
  totalCategories,
  onOpenAddModal,
  onOpenExportImport,
  onOpenStandaloneModal,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zona 1: Brand Wordmark dengan Logo Tiberman */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {!imgError ? (
              <img
                src={LOGO_URL}
                alt="Logo Tiberman"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="font-bold text-red-500 text-sm">T</span>
            )}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-100 leading-none">
              Tiberman <span className="text-red-500">Learning Center</span>
            </h1>
            <p className="text-[11px] text-zinc-400 hidden sm:block mt-0.5">
              Pusat Pembelajaran & Repositori Tautan
            </p>
          </div>
        </div>

        {/* Zona 2: Ringkasan Status Tabular */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Total Materi:</span>
            <span className="font-semibold text-zinc-200 font-mono tabular-nums bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
              {totalLinks} Tautan
            </span>
          </div>
          <span className="text-zinc-700">·</span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Kategori:</span>
            <span className="font-semibold text-zinc-200 font-mono tabular-nums bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
              {totalCategories} Kategori
            </span>
          </div>
        </div>

        {/* Zona 3: Aksi Utama */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-950/40"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tambah Tautan</span>
          </button>

          <button
            onClick={onOpenExportImport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
            title="Ekspor atau Impor Data"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Data</span>
          </button>

          <button
            onClick={onOpenStandaloneModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
            title="Dapatkan versi 1 file HTML standalone"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">1 File</span>
          </button>
        </div>
      </div>
    </header>
  );
};
