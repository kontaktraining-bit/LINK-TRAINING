import React from 'react';
import { ViewMode, SortField } from '../types';
import { Search, LayoutGrid, Table, ArrowUpDown, X, Tag as TagIcon } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: { name: string; count: number }[];
  activeTag: string | null;
  onClearActiveTag: () => void;
  sortField: SortField;
  onSortChange: (sort: SortField) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categories,
  activeTag,
  onClearActiveTag,
  sortField,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalFiltered,
  totalAll,
}) => {
  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'Semua' || activeTag !== null;

  return (
    <div className="space-y-3 mb-4">
      {/* Baris Utama: Pencarian, Sort, dan Toggle Tampilan */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Input Pencarian */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari judul, URL, tag, atau catatan..."
            className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
              aria-label="Bersihkan pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Urutkan & Tampilan Mode */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as SortField)}
              className="text-xs pl-8 pr-7 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none cursor-pointer shadow-xs"
            >
              <option value="createdAt_desc" className="bg-zinc-900">Terbaru</option>
              <option value="createdAt_asc" className="bg-zinc-900">Terlama</option>
              <option value="title_asc" className="bg-zinc-900">Judul (A - Z)</option>
              <option value="title_desc" className="bg-zinc-900">Judul (Z - A)</option>
            </select>
          </div>

          {/* Segmented Control View Mode */}
          <div className="flex items-center p-1 bg-zinc-900 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Tampilan Kartu"
              aria-label="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Tampilan Tabel"
              aria-label="Tampilan Tabel"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Baris Kategori Tabs & Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCategory('Semua')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'Semua'
                ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-950/50'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            Semua ({totalAll})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-950/50'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Active Tag filter or result counter */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 ml-auto">
          {activeTag && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-950/60 border border-red-800/80 text-red-300 rounded-md font-medium">
              <TagIcon className="w-3 h-3 text-red-400" />
              <span>Tag: #{activeTag}</span>
              <button
                onClick={onClearActiveTag}
                className="ml-1 hover:text-red-100 p-0.5"
                title="Hapus filter tag"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <span className="font-mono tabular-nums text-zinc-400">
            Menampilkan <span className="text-zinc-200 font-semibold">{totalFiltered}</span> dari {totalAll} link
          </span>

          {hasActiveFilters && (
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('Semua');
                onClearActiveTag();
              }}
              className="text-xs text-red-400 hover:text-red-300 font-medium underline underline-offset-2 ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
