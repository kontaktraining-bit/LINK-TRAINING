import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { LinkItem, ViewMode, SortField, ToastMessage } from './types';
import { loadLinks, saveLinks, clearAllLinks } from './utils/storage';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  getAccessToken,
} from './services/googleAuth';
import {
  fetchLinksFromGoogleSheet,
  syncAllLinksToGoogleSheet,
  SPREADSHEET_URL,
} from './services/sheetsService';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { GoogleSyncBar } from './components/GoogleSyncBar';
import { FilterBar } from './components/FilterBar';
import { LinkList } from './components/LinkList';
import { LinkModal } from './components/LinkModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ImportExportModal } from './components/ImportExportModal';
import { Toast } from './components/Toast';

export default function App() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Google Sheets Auth & Sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Filter & Tampilan State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal State
  const [deleteModalItem, setDeleteModalItem] = useState<LinkItem | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState<{
    item: LinkItem;
    onProceed: () => void;
  } | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [exportImportTab, setExportImportTab] = useState<'export' | 'import' | 'standalone'>('export');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    title?: string
  ) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Muat data lokal saat pertama kali
  useEffect(() => {
    const loaded = loadLinks();
    setLinks(loaded);
  }, []);

  // Sinkronisasi data dari Google Sheets
  const syncFromSheets = useCallback(async (token: string, currentLocalLinks: LinkItem[]) => {
    setIsSyncingSheets(true);
    setSyncError(null);
    try {
      const { links: sheetLinks, isNewSheet } = await fetchLinksFromGoogleSheet(token);

      if (sheetLinks.length > 0) {
        // Jika di Google Sheets sudah ada data, gunakan data dari Google Sheets
        setLinks(sheetLinks);
        saveLinks(sheetLinks);
        setLastSyncedAt(new Date());
        addToast('success', `Berhasil menyinkronkan ${sheetLinks.length} tautan dari Google Sheets.`, 'Sinkronisasi Berhasil');
      } else if (isNewSheet && currentLocalLinks.length > 0) {
        // Jika sheet kosong tapi lokal ada data, upload data lokal ke sheet
        await syncAllLinksToGoogleSheet(token, currentLocalLinks);
        setLastSyncedAt(new Date());
        addToast('success', `${currentLocalLinks.length} tautan lokal berhasil diunggah ke Google Sheets.`, 'Tersinkron ke Sheets');
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyinkronkan Google Sheets';
      setSyncError(msg);
      addToast('error', msg, 'Gagal Sinkronisasi');
    } finally {
      setIsSyncingSheets(false);
    }
  }, [addToast]);

  // Inisialisasi Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        syncFromSheets(token, loadLinks());
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, [syncFromSheets]);

  // Login dengan Google
  const handleGoogleLogin = async () => {
    setIsSyncingSheets(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        await syncFromSheets(result.accessToken, links);
        addToast('success', `Terhubung dengan Google: ${result.user.displayName || result.user.email}`, 'Koneksi Berhasil');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan akun Google';
      setSyncError(msg);
      addToast('error', msg, 'Login Dibatalkan/Gagal');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Logout Google
  const handleGoogleLogout = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setLastSyncedAt(null);
      addToast('info', 'Koneksi Google Sheets diputuskan. Data lokal tetap tersimpan di peramban.', 'Koneksi Terputus');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal keluar';
      addToast('error', msg, 'Error');
    }
  };

  // Manual Refresh Sync
  const handleManualSync = async () => {
    const token = await getAccessToken();
    if (!token) {
      handleGoogleLogin();
      return;
    }
    syncFromSheets(token, links);
  };

  // Helper untuk push pembaruan ke Google Sheets secara otomatis
  const pushToSheetsIfConnected = async (newLinksList: LinkItem[], actionName: string) => {
    const token = await getAccessToken();
    if (token) {
      setIsSyncingSheets(true);
      try {
        await syncAllLinksToGoogleSheet(token, newLinksList);
        setLastSyncedAt(new Date());
        setSyncError(null);
        addToast('success', `${actionName} otomatis tersinkron ke Google Sheets.`, 'Tersinkron ke Database');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal update Google Sheets';
        setSyncError(msg);
        addToast('warning', `Data tersimpan lokal, namun gagal update ke Google Sheets: ${msg}`, 'Peringatan Sinkronisasi');
      } finally {
        setIsSyncingSheets(false);
      }
    }
  };

  // Simpan / Perbarui Link (Otomatis Sync ke Sheets)
  const handleSaveLink = async (
    linkData: Omit<LinkItem, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      // Mode Edit
      const updatedLinks = links.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...linkData,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      setLinks(updatedLinks);
      saveLinks(updatedLinks);
      setEditingLink(null);
      setIsAddModalOpen(false);
      addToast('success', `Materi "${linkData.title}" berhasil diperbarui.`, 'Berhasil Diperbarui');

      // Sinkronisasi otomatis ke Google Sheets
      await pushToSheetsIfConnected(updatedLinks, 'Perubahan data');
    } else {
      // Mode Tambah Baru
      const newLink: LinkItem = {
        id: 'link-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        ...linkData,
        createdAt: new Date().toISOString(),
      };
      const updatedLinks = [newLink, ...links];
      setLinks(updatedLinks);
      saveLinks(updatedLinks);
      setIsAddModalOpen(false);
      addToast('success', `Tautan "${linkData.title}" berhasil ditambahkan ke repositori.`, 'Materi Tersimpan');

      // Sinkronisasi otomatis ke Google Sheets
      await pushToSheetsIfConnected(updatedLinks, 'Penambahan tautan');
    }
  };

  // Hapus Link dengan konfirmasi (Otomatis Sync ke Sheets)
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    const deletedTitle = deleteModalItem.title;
    const updatedLinks = links.filter((l) => l.id !== deleteModalItem.id);
    setLinks(updatedLinks);
    saveLinks(updatedLinks);

    if (editingLink?.id === deleteModalItem.id) {
      setEditingLink(null);
    }

    setDeleteModalItem(null);
    addToast('info', `Materi "${deletedTitle}" telah dihapus.`, 'Tautan Dihapus');

    // Sinkronisasi otomatis ke Google Sheets
    await pushToSheetsIfConnected(updatedLinks, 'Penghapusan tautan');
  };

  // Kosongkan seluruh data (Otomatis Sync ke Sheets)
  const handleClearAllData = async () => {
    clearAllLinks();
    setLinks([]);
    setEditingLink(null);
    setIsClearAllModalOpen(false);
    addToast('info', 'Semua data tautan telah berhasil dibersihkan.', 'Data Dikosongkan');

    // Sinkronisasi otomatis ke Google Sheets
    await pushToSheetsIfConnected([], 'Pembersihan database');
  };

  // Impor Sukses (Otomatis Sync ke Sheets jika connected)
  const handleImportSuccess = async (imported: LinkItem[], mode: 'merge' | 'replace') => {
    let finalLinks: LinkItem[] = [];
    if (mode === 'replace') {
      finalLinks = imported;
    } else {
      const existingUrls = new Set(links.map((l) => l.url.trim().toLowerCase().replace(/\/+$/, '')));
      const newItemsOnly = imported.filter(
        (item) => !existingUrls.has(item.url.trim().toLowerCase().replace(/\/+$/, ''))
      );
      finalLinks = [...newItemsOnly, ...links];
    }

    setLinks(finalLinks);
    saveLinks(finalLinks);
    addToast('success', `Berhasil memuat ${imported.length} materi pembelajaran.`, 'Impor Berhasil');

    // Sinkronisasi otomatis ke Google Sheets
    await pushToSheetsIfConnected(finalLinks, 'Impor data');
  };

  // Ekstraksi kategori unik beserta jumlah link
  const categoriesWithCount = useMemo(() => {
    const map = new Map<string, number>();
    links.forEach((l) => {
      const cat = l.category || 'Umum';
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [links]);

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    ['Modul Pelatihan', 'SOP & Regulasi', 'Video Tutorial', 'Teknik & Operasional', 'Sertifikasi & K3', 'Umum'].forEach((c) => set.add(c));
    links.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set);
  }, [links]);

  // Ekstraksi tag populer
  const popularTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    links.forEach((l) => {
      l.tags?.forEach((t) => {
        const lower = t.toLowerCase();
        tagCount.set(lower, (tagCount.get(lower) || 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [links]);

  // Filter & Sortir Links
  const filteredAndSortedLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = links.filter((link) => {
      if (query) {
        const titleMatch = link.title.toLowerCase().includes(query);
        const urlMatch = link.url.toLowerCase().includes(query);
        const notesMatch = link.notes ? link.notes.toLowerCase().includes(query) : false;
        const tagMatch = link.tags?.some((t) => t.toLowerCase().includes(query));
        const typeMatch = link.linkType ? link.linkType.toLowerCase().includes(query) : false;

        if (!titleMatch && !urlMatch && !notesMatch && !tagMatch && !typeMatch) {
          return false;
        }
      }

      if (selectedCategory !== 'Semua' && link.category !== selectedCategory) {
        return false;
      }

      if (activeTag) {
        const hasTag = link.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase());
        if (!hasTag) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      if (sortField === 'createdAt_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortField === 'createdAt_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortField === 'title_asc') {
        return a.title.localeCompare(b.title, 'id');
      }
      if (sortField === 'title_desc') {
        return b.title.localeCompare(a.title, 'id');
      }
      return 0;
    });
  }, [links, searchQuery, selectedCategory, activeTag, sortField]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-100 selection:bg-red-950 selection:text-red-200">
      {/* Top Bar Header */}
      <Header
        totalLinks={links.length}
        totalCategories={categoriesWithCount.length}
        onOpenAddModal={() => {
          setEditingLink(null);
          setIsAddModalOpen(true);
        }}
        onOpenExportImport={() => {
          setExportImportTab('export');
          setIsExportImportOpen(true);
        }}
        onOpenStandaloneModal={() => {
          setExportImportTab('standalone');
          setIsExportImportOpen(true);
        }}
      />

      {/* Konten Utama */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 1. Bar Status Sinkronisasi Google Sheets */}
        <GoogleSyncBar
          user={googleUser}
          isSyncing={isSyncingSheets}
          lastSyncedAt={lastSyncedAt}
          syncError={syncError}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          onManualSync={handleManualSync}
        />

        {/* 2. Tampilan Dashboard di Awal */}
        <DashboardOverview
          totalLinks={links.length}
          totalCategories={categoriesWithCount.length}
          totalTags={popularTags.length}
          categories={categoriesWithCount}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenAddModal={() => {
            setEditingLink(null);
            setIsAddModalOpen(true);
          }}
        />

        {/* 3. Repositori Tautan Materi & Kontrol Filter */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Daftar Materi Pembelajaran</span>
            </h3>
          </div>

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={categoriesWithCount}
            activeTag={activeTag}
            onClearActiveTag={() => setActiveTag(null)}
            sortField={sortField}
            onSortChange={setSortField}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalFiltered={filteredAndSortedLinks.length}
            totalAll={links.length}
          />

          <LinkList
            links={filteredAndSortedLinks}
            viewMode={viewMode}
            onEdit={(link) => {
              setEditingLink(link);
              setIsAddModalOpen(true);
            }}
            onDeleteRequest={(link) => setDeleteModalItem(link)}
            onTagClick={(tag) => setActiveTag(tag)}
            hasFilters={searchQuery !== '' || selectedCategory !== 'Semua' || activeTag !== null}
            onResetFilters={() => {
              setSearchQuery('');
              setSelectedCategory('Semua');
              setActiveTag(null);
            }}
            onOpenAddModal={() => {
              setEditingLink(null);
              setIsAddModalOpen(true);
            }}
          />
        </section>
      </main>

      {/* Footer Bersih & Profesional */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-semibold">Tiberman <span className="text-red-500">Learning Center</span></span>
            <span className="text-zinc-700">·</span>
            <span>Database Google Sheets Tersinkron</span>
            <a
              href={SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 font-medium ml-1"
            >
              (Buka Spreadsheet ↗)
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {links.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="text-zinc-500 hover:text-red-400 transition-colors"
                title="Hapus semua tautan yang tersimpan"
              >
                Kosongkan Data ({links.length})
              </button>
            )}
            <button
              onClick={() => {
                setExportImportTab('export');
                setIsExportImportOpen(true);
              }}
              className="hover:text-zinc-300 transition-colors"
            >
              Ekspor CSV/JSON
            </button>
            <button
              onClick={() => {
                setExportImportTab('import');
                setIsExportImportOpen(true);
              }}
              className="hover:text-zinc-300 transition-colors"
            >
              Impor Data
            </button>
            <button
              onClick={() => {
                setExportImportTab('standalone');
                setIsExportImportOpen(true);
              }}
              className="hover:text-red-300 transition-colors text-red-400 font-medium"
            >
              Versi 1 File HTML
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Tambah / Edit Link yang Simpel & Menarik */}
      <LinkModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLink(null);
        }}
        existingLinks={links}
        allCategories={allCategoryNames}
        editingLink={editingLink}
        onSave={handleSaveLink}
        onShowDuplicateAlert={(dup, onProceed) => {
          setDuplicateConfirm({ item: dup, onProceed });
        }}
        popularTags={popularTags}
      />

      {/* Dialog Konfirmasi Hapus Satu Link */}
      <ConfirmModal
        isOpen={!!deleteModalItem}
        type="danger"
        title="Hapus Data Materi?"
        message={`Apakah Anda yakin ingin menghapus tautan materi "${deleteModalItem?.title}"?`}
        subMessage={
          deleteModalItem
            ? `URL: ${deleteModalItem.url}${googleUser ? ' — Data juga akan otomatis dihapus dari Google Sheets.' : ''}`
            : undefined
        }
        confirmLabel="Hapus Materi"
        cancelLabel="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalItem(null)}
      />

      {/* Dialog Konfirmasi Hapus Semua Data */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        type="danger"
        title="Hapus Semua Data Tautan?"
        message={`Aksi ini akan menghapus seluruh (${links.length}) materi tautan yang tersimpan.${googleUser ? ' Baris data di Google Sheets juga akan dikosongkan.' : ''} Pastikan Anda sudah mencadangkan data penting jika diperlukan.`}
        confirmLabel="Ya, Hapus Semua"
        cancelLabel="Batal"
        onConfirm={handleClearAllData}
        onCancel={() => setIsClearAllModalOpen(false)}
      />

      {/* Dialog Peringatan Duplikat Saat Simpan */}
      <ConfirmModal
        isOpen={!!duplicateConfirm}
        type="warning"
        title="URL Sudah Terdaftar"
        message={`Tautan dengan URL yang sama sudah pernah tersimpan dengan judul "${duplicateConfirm?.item.title}" di kategori "${duplicateConfirm?.item.category}".`}
        subMessage="Apakah Anda tetap ingin menyimpan tautan ini sebagai entri terpisah?"
        confirmLabel="Tetap Simpan"
        cancelLabel="Kembali & Ubah"
        onConfirm={() => {
          if (duplicateConfirm) {
            duplicateConfirm.onProceed();
            setDuplicateConfirm(null);
          }
        }}
        onCancel={() => setDuplicateConfirm(null)}
      />

      {/* Modal Ekspor / Impor / Standalone */}
      <ImportExportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        links={links}
        onImportSuccess={handleImportSuccess}
        defaultTab={exportImportTab}
      />

      {/* Notifikasi Toast */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
