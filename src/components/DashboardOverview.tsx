import React from 'react';
import {
  BookOpen,
  FolderKanban,
  Tag as TagIcon,
  HardDrive,
  Plus,
  ArrowRight,
  Video,
  FileText,
  GraduationCap,
  Globe,
  Wrench,
} from 'lucide-react';

interface DashboardOverviewProps {
  totalLinks: number;
  totalCategories: number;
  totalTags: number;
  categories: { name: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAddModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  totalLinks,
  totalCategories,
  totalTags,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenAddModal,
}) => {
  return (
    <div className="space-y-5 mb-8">
      {/* Hero Banner Selamat Datang */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-md">
        {/* Dekorasi Aksen Merah Halus */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-red-950/60 border border-red-900/60 text-red-400 text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span>Tiberman Learning Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight text-balance">
              Pusat Repositori Materi & Tautan Pembelajaran
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed text-balance">
              Kelola, kelompokkan, dan temukan materi pelatihan, SOP, video tutorial, modul kerja, dan referensi internal secara cepat dan terstruktur.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-950/60 hover:shadow-red-950/80 active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Materi / Link</span>
            </button>
          </div>
        </div>

        {/* 4 Kartu Metrik / KPI Statistik Utama */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-zinc-800/80">
          {/* Metrik 1 */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Total Materi</span>
              <BookOpen className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono tabular-nums">
              {totalLinks}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Tautan tersimpan</div>
          </div>

          {/* Metrik 2 */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Kategori Belajar</span>
              <FolderKanban className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono tabular-nums">
              {totalCategories}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Bidang & sub-topik</div>
          </div>

          {/* Metrik 3 */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Total Tag Topik</span>
              <TagIcon className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono tabular-nums">
              {totalTags}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Label kata kunci</div>
          </div>

          {/* Metrik 4 */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-zinc-500 mb-1.5">
              <span className="text-[11px] font-medium text-zinc-400">Penyimpanan</span>
              <HardDrive className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-200 mt-1">
              Browser Lokal
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-0.5">Privat & Offline Siap</div>
          </div>
        </div>
      </div>

      {/* Akses Cepat Kategori / Jalur Belajar */}
      {categories.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-red-500" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-200">
                Jalur Kategori Pembelajaran
              </h3>
            </div>
            {selectedCategory !== 'Semua' && (
              <button
                onClick={() => onSelectCategory('Semua')}
                className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                Lihat Semua ({totalLinks})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => onSelectCategory(isActive ? 'Semua' : cat.name)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-red-950/60 border-red-700 text-zinc-100 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-950'
                  }`}
                >
                  <div className="text-xs font-semibold truncate mb-1">
                    {cat.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-mono tabular-nums">
                      {cat.count} tautan
                    </span>
                    <ArrowRight className={`w-3 h-3 ${isActive ? 'text-red-400' : 'text-zinc-600'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
