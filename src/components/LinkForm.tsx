import React, { useState, useEffect } from 'react';
import { LinkItem } from '../types';
import { isValidUrl, findDuplicate } from '../utils/storage';
import { Plus, Check, X, AlertTriangle, Clipboard, BookmarkPlus, Edit3 } from 'lucide-react';

interface LinkFormProps {
  existingLinks: LinkItem[];
  allCategories: string[];
  editingLink: LinkItem | null;
  onSave: (linkData: Omit<LinkItem, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onCancelEdit: () => void;
  onShowDuplicateAlert: (duplicateItem: LinkItem, onProceed: () => void) => void;
  popularTags: string[];
}

export const LinkForm: React.FC<LinkFormProps> = ({
  existingLinks,
  allCategories,
  editingLink,
  onSave,
  onCancelEdit,
  onShowDuplicateAlert,
  popularTags,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Validasi & deteksi duplikat
  const [urlError, setUrlError] = useState<string | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<LinkItem | null>(null);

  // Sync saat mode edit berubah
  useEffect(() => {
    if (editingLink) {
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
  }, [editingLink]);

  // Cek duplikat secara interaktif saat URL berubah
  useEffect(() => {
    if (!url.trim()) {
      setDuplicateMatch(null);
      setUrlError(null);
      return;
    }

    if (!isValidUrl(url)) {
      if (url.length > 8 && !url.startsWith('http://') && !url.startsWith('https://')) {
        setUrlError('Harus diawali dengan http:// atau https://');
      } else {
        setUrlError(null);
      }
    } else {
      setUrlError(null);
    }

    const dup = findDuplicate(existingLinks, url, editingLink?.id);
    setDuplicateMatch(dup || null);
  }, [url, existingLinks, editingLink]);

  const resetForm = () => {
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
        // Jika belum ada judul, coba tebak dari nama domain
        if (!title.trim()) {
          try {
            const parsed = new URL(clean);
            const domain = parsed.hostname.replace(/^www\./, '');
            setTitle(domain.charAt(0).toUpperCase() + domain.slice(1));
          } catch {
            // Abaikan jika bukan URL valid
          }
        }
      }
    } catch {
      // Izin clipboard peramban ditolak atau tidak didukung
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
      tags: tags,
      notes: notes.trim(),
    };

    // Jika ada duplikasi URL terdeteksi
    if (duplicateMatch) {
      onShowDuplicateAlert(duplicateMatch, () => {
        onSave(payload, editingLink?.id);
        if (!editingLink) resetForm();
      });
      return;
    }

    onSave(payload, editingLink?.id);
    if (!editingLink) resetForm();
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {editingLink ? (
            <Edit3 className="w-5 h-5 text-red-400" />
          ) : (
            <BookmarkPlus className="w-5 h-5 text-red-500" />
          )}
          <h2 className="text-base font-bold text-zinc-100">
            {editingLink ? 'Edit Data Link' : 'Tambah Link Baru'}
          </h2>
        </div>

        {editingLink && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs text-zinc-400 hover:text-zinc-200 font-medium px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 transition-colors"
          >
            Batal Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Kolom URL */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="url" className="text-xs font-semibold text-zinc-300">
              URL Tautan <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="text-[11px] text-red-400 hover:text-red-300 font-medium inline-flex items-center gap-1 transition-colors"
              title="Tempel tautan dari papan klip"
            >
              <Clipboard className="w-3 h-3" />
              <span>Tempel URL</span>
            </button>
          </div>

          <div className="relative">
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://contoh.com/artikel"
              className={`w-full text-sm px-3 py-2 border rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none ${
                urlError
                  ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
                  : duplicateMatch
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                  : 'border-zinc-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              }`}
              required
            />
          </div>

          {urlError && (
            <p className="mt-1 text-xs text-red-400 font-medium">{urlError}</p>
          )}

          {duplicateMatch && (
            <div className="mt-2 p-2.5 bg-red-950/40 border border-red-900/80 rounded-lg text-xs text-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-300">Peringatan Duplikat:</span> URL ini sudah pernah tersimpan dengan judul{' '}
                <span className="font-medium italic text-zinc-200">"{duplicateMatch.title}"</span> ({duplicateMatch.category}).
              </div>
            </div>
          )}
        </div>

        {/* Kolom Judul */}
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Judul Link <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Dokumentasi Arsitektur Sistem"
            className="w-full text-sm px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Kolom Kategori */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Kategori <span className="text-red-500">*</span>
          </label>

          {!isNewCategory ? (
            <div className="space-y-2">
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    setIsNewCategory(true);
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full text-sm px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-zinc-100">
                    {cat}
                  </option>
                ))}
                <option value="__NEW__" className="bg-zinc-900 text-red-400 font-semibold">
                  + Ketik Kategori Baru...
                </option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 text-sm px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  if (newCategoryName.trim()) {
                    setCategory(newCategoryName.trim());
                  }
                  setIsNewCategory(false);
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Gunakan
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewCategory(false);
                  setNewCategoryName('');
                }}
                className="px-2.5 py-2 text-zinc-400 hover:text-zinc-200 text-xs rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Kolom Tag (Multi-tag) */}
        <div>
          <label htmlFor="tags" className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Tag <span className="text-zinc-500 font-normal">(Opsional, bisa lebih dari satu)</span>
          </label>

          <div className="p-2 border border-zinc-800 rounded-lg bg-zinc-950 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-colors">
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-400 hover:text-red-400 rounded transition-colors"
                    aria-label={`Hapus tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Ketik tag lalu tekan Enter...' : 'Tambah tag...'}
                className="text-xs py-1 px-1 flex-1 min-w-[120px] bg-transparent focus:outline-none text-zinc-100 placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Rekomendasi tag populer */}
          {popularTags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
              <span className="text-[11px] text-zinc-500">Pilih cepat:</span>
              {popularTags.slice(0, 5).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                    tags.includes(t)
                      ? 'bg-red-950/60 border border-red-800/80 text-red-300 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  +{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kolom Catatan / Deskripsi Singkat */}
        <div>
          <label htmlFor="notes" className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Catatan / Deskripsi Singkat <span className="text-zinc-500 font-normal">(Opsional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan relevan, rangkuman isi link, atau catatan teknis..."
            className="w-full text-sm px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-colors resize-y"
          />
        </div>

        {/* Tombol Simpan & Batal */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-950/50"
          >
            {editingLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Simpan Link</span>
              </>
            )}
          </button>

          {editingLink && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2.5 text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 rounded-lg transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
