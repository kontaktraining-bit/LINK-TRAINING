import React, { useState, useEffect } from 'react';
import { LinkItem, LinkType } from '../types';
import { isValidUrl, findDuplicate } from '../utils/storage';
import {
  X,
  Plus,
  Check,
  AlertTriangle,
  Clipboard,
  Video,
  FileText,
  Globe,
  GraduationCap,
  Wrench,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLinks: LinkItem[];
  allCategories: string[];
  editingLink: LinkItem | null;
  onSave: (linkData: Omit<LinkItem, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onShowDuplicateAlert: (duplicateItem: LinkItem, onProceed: () => void) => void;
  popularTags: string[];
}

const LINK_TYPES: {
  type: LinkType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    type: 'video',
    label: 'Video Tutorial',
    description: 'YouTube, Zoom, rekaman materi',
    icon: Video,
  },
  {
    type: 'document',
    label: 'Dokumen & SOP',
    description: 'PDF, Google Drive, panduan',
    icon: FileText,
  },
  {
    type: 'course',
    label: 'Kursus & LMS',
    description: 'Modul pelatihan, sertifikasi',
    icon: GraduationCap,
  },
  {
    type: 'article',
    label: 'Artikel & Web',
    description: 'Dokumentasi, artikel referensi',
    icon: Globe,
  },
  {
    type: 'tool',
    label: 'Alat & Sistem',
    description: 'Aplikasi internal, dashboard',
    icon: Wrench,
  },
  {
    type: 'other',
    label: 'Lainnya',
    description: 'Tautan eksternal umum',
    icon: LinkIcon,
  },
];

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  existingLinks,
  allCategories,
  editingLink,
  onSave,
  onShowDuplicateAlert,
  popularTags,
}) => {
  const [selectedType, setSelectedType] = useState<LinkType>('article');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Validasi & duplikat
  const [urlError, setUrlError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<LinkItem | null>(null);

  // Sync saat membuka modal atau mode edit
  useEffect(() => {
    if (editingLink) {
      setSelectedType(editingLink.linkType || 'article');
      setUrl(editingLink.url);
      setTitle(editingLink.title);
      setCategory(editingLink.category);
      setIsNewCategory(false);
      setNewCategoryName('');
      setTags(editingLink.tags || []);
      setNotes(editingLink.notes || '');
      setUrlError(null);
      setDuplicateMatch(null);
    } else {
      resetForm();
    }
  }, [editingLink, isOpen]);

  // Cek duplikat dan deteksi otomatis jenis link dari URL
  useEffect(() => {
    if (!url.trim()) {
      setDuplicateMatch(null);
      setUrlError(null);
      return;
    }

    if (!isValidUrl(url)) {
      if (url.length > 8 && !url.startsWith('http://') && !url.startsWith('https://')) {
        setUrlError('URL harus diawali dengan http:// atau https://');
      } else {
        setUrlError(null);
      }
    } else {
      setUrlError(null);

      // Deteksi jenis link otomatis saat tambah baru
      if (!editingLink) {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo')) {
          setSelectedType('video');
        } else if (
          lowerUrl.includes('docs.google.com') ||
          lowerUrl.includes('drive.google.com') ||
          lowerUrl.endsWith('.pdf') ||
          lowerUrl.includes('/pdf')
        ) {
          setSelectedType('document');
        } else if (
          lowerUrl.includes('coursera') ||
          lowerUrl.includes('udemy') ||
          lowerUrl.includes('lms') ||
          lowerUrl.includes('learning')
        ) {
          setSelectedType('course');
        } else if (lowerUrl.includes('github.com') || lowerUrl.includes('gitlab.com')) {
          setSelectedType('tool');
        }
      }
    }

    const dup = findDuplicate(existingLinks, url, editingLink?.id);
    setDuplicateMatch(dup || null);
  }, [url, existingLinks, editingLink]);

  const resetForm = () => {
    setSelectedType('article');
    setUrl('');
    setTitle('');
    setCategory(allCategories.length > 0 ? allCategories[0] : 'Umum');
    setIsNewCategory(false);
    setNewCategoryName('');
    setTags([]);
    setTagInput('');
    setNotes('');
    setUrlError(null);
    setDuplicateMatch(null);
  };

  const handleAddTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = text.trim();
        setUrl(clean);
        if (!title.trim()) {
          try {
            const parsed = new URL(clean);
            const domain = parsed.hostname.replace(/^www\./, '');
            setTitle(domain.charAt(0).toUpperCase() + domain.slice(1));
          } catch {
            // Ignore if invalid
          }
        }
      }
    } catch {
      // Clipboard permission denied
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl) {
      setUrlError('URL wajib diisi');
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setUrlError('Format URL tidak valid. Pastikan dimulai dengan http:// atau https://');
      return;
    }

    if (!trimmedTitle) {
      return;
    }

    const finalCategory = isNewCategory ? newCategoryName.trim() || 'Umum' : category || 'Umum';

    const payload = {
      url: trimmedUrl,
      title: trimmedTitle,
      category: finalCategory,
      linkType: selectedType,
      tags: tags,
      notes: notes.trim(),
    };

    if (duplicateMatch) {
      onShowDuplicateAlert(duplicateMatch, () => {
        onSave(payload, editingLink?.id);
        onClose();
        resetForm();
      });
      return;
    }

    onSave(payload, editingLink?.id);
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl transform transition-all my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{editingLink ? 'Edit Materi Pembelajaran' : 'Tambah Tautan Materi Baru'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Pilih format jenis tautan, masukkan alamat URL, dan atur kategorinya.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* BAGIAN 1: PEMILIH JENIS LINK (Simpel & Menarik) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
              <span>Pilih Jenis Format Tautan:</span>
              <span className="text-[11px] text-zinc-500 font-normal">
                Format terpilih: <strong className="text-red-400 capitalize">{selectedType}</strong>
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LINK_TYPES.map((lt) => {
                const IconComponent = lt.icon;
                const isSelected = selectedType === lt.type;
                return (
                  <button
                    key={lt.type}
                    type="button"
                    onClick={() => setSelectedType(lt.type)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-red-950/60 border-red-600 text-zinc-100 shadow-sm shadow-red-950/40 ring-1 ring-red-600'
                        : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-950'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {lt.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                        {lt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BAGIAN 2: URL INPUT */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="modal-url" className="text-xs font-semibold text-zinc-300">
                Alamat URL Tautan <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-[11px] text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 transition-colors"
                title="Tempel URL dari papan klip"
              >
                <Clipboard className="w-3 h-3" />
                <span>Tempel URL</span>
              </button>
            </div>

            <input
              id="modal-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://contoh.com/materi-pembelajaran"
              className={`w-full text-xs sm:text-sm px-3.5 py-2.5 border rounded-xl bg-zinc-950 text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none ${
                urlError
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                  : duplicateMatch
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                  : 'border-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              }`}
              required
            />

            {urlError && (
              <p className="mt-1 text-xs text-red-400 font-medium">{urlError}</p>
            )}

            {duplicateMatch && (
              <div className="mt-2 p-2.5 bg-red-950/40 border border-red-900/80 rounded-xl text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-red-300">Tautan Sudah Terdaftar:</span> Tautan ini sudah ada dengan judul{' '}
                  <span className="font-medium italic text-zinc-200">"{duplicateMatch.title}"</span>.
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN 3: JUDUL */}
          <div>
            <label htmlFor="modal-title" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Judul Materi / Link <span className="text-red-500">*</span>
            </label>
            <input
              id="modal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Modul SOP Keselamatan Kerja Tambang"
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* BAGIAN 4: KATEGORI & TAG DALAM GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Kategori Pembelajaran <span className="text-red-500">*</span>
              </label>

              {!isNewCategory ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsNewCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-100 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
                >
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-zinc-100">
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW__" className="bg-zinc-900 text-red-400 font-semibold">
                    + Buat Kategori Baru...
                  </option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nama kategori..."
                    className="flex-1 text-xs px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 focus:border-red-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryName.trim()) setCategory(newCategoryName.trim());
                      setIsNewCategory(false);
                    }}
                    className="px-2.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewCategory(false)}
                    className="px-2 py-2 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {/* Tag Multi-Chip */}
            <div>
              <label htmlFor="modal-tags" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tag Kata Kunci <span className="text-zinc-500 font-normal">(Tekan Enter)</span>
              </label>

              <div className="p-1.5 border border-zinc-800 rounded-xl bg-zinc-950 min-h-[42px] focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-colors flex flex-wrap gap-1 items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-400 hover:text-red-400 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <input
                  id="modal-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'Ketik tag...' : '+'}
                  className="text-xs py-1 px-1.5 flex-1 min-w-[70px] bg-transparent focus:outline-none text-zinc-100 placeholder-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Saran Tag Populer */}
          {popularTags.length > 0 && tags.length === 0 && (
            <div className="flex flex-wrap gap-1 items-center -mt-2">
              <span className="text-[10px] text-zinc-500">Saran:</span>
              {popularTags.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className="text-[10px] px-1.5 py-0.5 rounded text-zinc-400 hover:text-red-300 bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700"
                >
                  +{t}
                </button>
              ))}
            </div>
          )}

          {/* BAGIAN 5: CATATAN */}
          <div>
            <label htmlFor="modal-notes" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Catatan Singkat / Ringkasan Materi <span className="text-zinc-500 font-normal">(Opsional)</span>
            </label>
            <textarea
              id="modal-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus, nomor edisi, target departemen, atau ringkasan isi tautan..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 border border-zinc-800 rounded-xl bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors resize-y"
            />
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md shadow-red-950/60"
            >
              {editingLink ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Perubahan</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Simpan Tautan Materi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
