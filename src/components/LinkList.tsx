import React, { useState } from 'react';
import { LinkItem, ViewMode, LinkType } from '../types';
import { formatDate, getDomain } from '../utils/storage';
import {
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Globe,
  Inbox,
  Video,
  FileText,
  GraduationCap,
  Wrench,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';

interface LinkListProps {
  links: LinkItem[];
  viewMode: ViewMode;
  onEdit: (link: LinkItem) => void;
  onDeleteRequest: (link: LinkItem) => void;
  onTagClick: (tag: string) => void;
  hasFilters: boolean;
  onResetFilters: () => void;
  onOpenAddModal?: () => void;
}

const getTypeMeta = (type?: LinkType) => {
  switch (type) {
    case 'video':
      return { label: 'Video', icon: Video, color: 'text-rose-400 bg-rose-950/40 border-rose-900/60' };
    case 'document':
      return { label: 'Dokumen', icon: FileText, color: 'text-amber-400 bg-amber-950/40 border-amber-900/60' };
    case 'course':
      return { label: 'Kursus', icon: GraduationCap, color: 'text-red-400 bg-red-950/50 border-red-900/60' };
    case 'tool':
      return { label: 'Alat/Sistem', icon: Wrench, color: 'text-blue-400 bg-blue-950/40 border-blue-900/60' };
    case 'article':
      return { label: 'Artikel', icon: Globe, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60' };
    default:
      return { label: 'Tautan', icon: LinkIcon, color: 'text-zinc-400 bg-zinc-900 border-zinc-800' };
  }
};

export const LinkList: React.FC<LinkListProps> = ({
  links,
  viewMode,
  onEdit,
  onDeleteRequest,
  onTagClick,
  hasFilters,
  onResetFilters,
  onOpenAddModal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // State Kosong (Empty State)
  if (links.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-zinc-800/80 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-zinc-500 border border-zinc-700/60">
          <Inbox className="w-7 h-7 text-red-500/80" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-zinc-100 mb-1.5">
          {hasFilters ? 'Tidak ada materi yang sesuai' : 'Repositori Pembelajaran Masih Kosong'}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
          {hasFilters
            ? 'Coba ubah kata kunci pencarian atau reset filter kategori/tag pembelajaran.'
            : 'Belum ada tautan materi tersimpan. Tambahkan modul panduan, video pelatihan, atau SOP pertama Anda.'}
        </p>

        {hasFilters ? (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-900/60 hover:bg-red-900/40 rounded-xl transition-colors"
          >
            <span>Reset Pencarian & Filter</span>
          </button>
        ) : (
          onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md shadow-red-950/50"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Materi Pertama</span>
            </button>
          )
        )}
      </div>
    );
  }

  // Tampilan Tabel (Table View)
  if (viewMode === 'table') {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <th className="py-3 px-4 min-w-[240px]">Materi & Jenis</th>
                <th className="py-3 px-4 min-w-[200px]">URL Tautan</th>
                <th className="py-3 px-4 min-w-[130px]">Kategori</th>
                <th className="py-3 px-4 min-w-[160px]">Tag</th>
                <th className="py-3 px-4 min-w-[130px] font-mono">Tanggal</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-200">
              {links.map((link) => {
                const domain = getDomain(link.url);
                const isCopied = copiedId === link.id;
                const typeMeta = getTypeMeta(link.linkType);
                const TypeIcon = typeMeta.icon;

                return (
                  <tr
                    key={link.id}
                    className="hover:bg-zinc-850/50 transition-colors group"
                  >
                    {/* Judul & Jenis */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border mt-0.5 ${typeMeta.color}`}
                          title={`Jenis: ${typeMeta.label}`}
                        >
                          <TypeIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100 leading-snug">
                            {link.title}
                          </div>
                          {link.notes && (
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {link.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* URL */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5 max-w-xs">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-400 hover:text-red-300 hover:underline truncate font-mono text-[11px] block"
                          title={link.url}
                        >
                          {domain}
                        </a>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-red-400 shrink-0 transition-colors"
                          title="Buka di tab baru"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <span className="text-[10px] text-zinc-500 truncate block max-w-xs mt-0.5">
                        {link.url}
                      </span>
                    </td>

                    {/* Kategori */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="text-zinc-300 font-medium">
                        {link.category}
                      </span>
                    </td>

                    {/* Tag */}
                    <td className="py-3.5 px-4 align-top">
                      {link.tags && link.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {link.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => onTagClick(tag)}
                              className="text-[11px] text-zinc-400 hover:text-red-400 hover:underline transition-colors"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td className="py-3.5 px-4 align-top font-mono text-[11px] text-zinc-400 tabular-nums">
                      {formatDate(link.createdAt)}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleCopy(link.id, link.url, e)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCopied
                              ? 'text-red-400 bg-red-950/60 border border-red-800/80'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                          title={isCopied ? 'Tersalin!' : 'Salin URL'}
                          aria-label="Salin URL"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onEdit(link)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Edit materi"
                          aria-label="Edit materi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteRequest(link)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Hapus materi"
                          aria-label="Hapus materi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Tampilan Kartu (Grid View)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {links.map((link) => {
        const domain = getDomain(link.url);
        const isCopied = copiedId === link.id;
        const typeMeta = getTypeMeta(link.linkType);
        const TypeIcon = typeMeta.icon;

        return (
          <div
            key={link.id}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between group hover:shadow-md hover:shadow-black/40"
          >
            <div>
              {/* Header Kartu: Tipe Badge & Aksi */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${typeMeta.color}`}
                >
                  <TypeIcon className="w-3 h-3" />
                  <span>{typeMeta.label}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(link.id, link.url, e)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isCopied
                        ? 'text-red-400 bg-red-950/60 border border-red-800/80'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                    title={isCopied ? 'Tersalin!' : 'Salin URL'}
                    aria-label="Salin URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(link)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Edit materi"
                    aria-label="Edit materi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRequest(link)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Hapus materi"
                    aria-label="Hapus materi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Judul Materi */}
              <div className="mb-1.5">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm sm:text-base text-zinc-100 hover:text-red-400 transition-colors inline-flex items-start gap-1.5 group/link leading-snug"
                >
                  <span className="line-clamp-2">{link.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover/link:text-red-400 shrink-0 mt-1" />
                </a>
              </div>

              {/* URL Domain */}
              <div className="mb-2.5">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 hover:underline max-w-full truncate font-mono"
                  title={link.url}
                >
                  <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="truncate">{link.url}</span>
                </a>
              </div>

              {/* Catatan jika ada */}
              {link.notes && (
                <p className="text-xs text-zinc-300 mb-3 line-clamp-2 leading-relaxed bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/80">
                  {link.notes}
                </p>
              )}
            </div>

            {/* Bagian Bawah: Metadata Bersih (Zero-Pill Rule) */}
            <div className="pt-2.5 mt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-y-1 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-300 truncate max-w-[130px]">{link.category}</span>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="font-mono tabular-nums text-[11px] text-zinc-500">
                  {formatDate(link.createdAt)}
                </span>
              </div>

              {link.tags && link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {link.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onTagClick(tag)}
                      className="text-[11px] text-zinc-400 hover:text-red-400 font-medium transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                  {link.tags.length > 3 && (
                    <span className="text-[10px] text-zinc-600">+{link.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
