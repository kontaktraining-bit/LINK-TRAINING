import React, { useState, useRef } from 'react';
import { LinkItem } from '../types';
import {
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  sanitizeImportedLinks,
  generateSingleFileHtml,
} from '../utils/exportImport';
import { normalizeUrl } from '../utils/storage';
import {
  X,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode2,
  Check,
  AlertCircle,
  Copy,
  Info,
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  onImportSuccess: (importedLinks: LinkItem[], mode: 'merge' | 'replace') => void;
  defaultTab?: 'export' | 'import' | 'standalone';
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  links,
  onImportSuccess,
  defaultTab = 'export',
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'standalone'>(defaultTab);

  // State Import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    valid: LinkItem[];
    invalidCount: number;
    duplicateCount: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Standalone Copy
  const [copiedStandalone, setCopiedStandalone] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImportFile(file);
  };

  const processImportFile = (file: File) => {
    setImportFile(file);
    setImportError(null);
    setImportPreview(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let rawItems: Partial<LinkItem>[] = [];

        if (file.name.endsWith('.json')) {
          rawItems = parseJSON(text);
        } else if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
          rawItems = parseCSV(text);
        } else {
          // Coba tebak apakah JSON
          try {
            rawItems = parseJSON(text);
          } catch {
            rawItems = parseCSV(text);
          }
        }

        const { valid, invalidCount } = sanitizeImportedLinks(rawItems);

        if (valid.length === 0) {
          setImportError('Tidak ditemukan tautan dengan format valid di dalam file.');
          setIsProcessing(false);
          return;
        }

        // Hitung berapa yang duplikat dengan data saat ini
        const currentNormalizedUrls = new Set(links.map((l) => normalizeUrl(l.url)));
        let duplicateCount = 0;
        valid.forEach((item) => {
          if (currentNormalizedUrls.has(normalizeUrl(item.url))) {
            duplicateCount++;
          }
        });

        setImportPreview({
          valid,
          invalidCount,
          duplicateCount,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Gagal memproses file';
        setImportError(`Kesalahan membaca berkas: ${errorMsg}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setImportError('Gagal membaca berkas dari sistem.');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!importPreview || importPreview.valid.length === 0) return;
    onImportSuccess(importPreview.valid, importMode);
    handleClose();
  };

  const handleDownloadStandalone = () => {
    const htmlContent = generateSingleFileHtml(links);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiberman-learning-center-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyStandaloneCode = () => {
    const htmlContent = generateSingleFileHtml(links);
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopiedStandalone(true);
      setTimeout(() => setCopiedStandalone(false), 2500);
    });
  };

  const handleClose = () => {
    setImportFile(null);
    setImportPreview(null);
    setImportError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-xl max-w-xl w-full p-6 shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100">
              Pengelolaan Data & Berkas
            </h2>
            <p className="text-xs text-zinc-400">
              Ekspor, impor cadangan data, atau dapatkan kode 1 file HTML mandiri.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-zinc-800 mt-3">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'export'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Data</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'import'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Impor Data</span>
          </button>

          <button
            onClick={() => setActiveTab('standalone')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === 'standalone'
                ? 'border-red-600 text-red-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Versi 1 File HTML</span>
          </button>
        </div>

        {/* Konten Tab */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* TAB EKSPOR */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Unduh seluruh data tautan yang tersimpan di browser Anda ke dalam berkas CSV atau JSON untuk keperluan pencadangan (backup) atau analisis di aplikasi lain (seperti Microsoft Excel, Google Sheets, atau aplikasi kustom).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Opsi JSON */}
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/60 hover:border-zinc-700 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-900/60 text-red-400 flex items-center justify-center mb-2.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 mb-1">Format JSON</h3>
                    <p className="text-xs text-zinc-400 mb-3">
                      Format objek terstruktur lengkap dengan metadata, tag array, dan tanggal ISO.
                    </p>
                  </div>
                  <button
                    onClick={() => exportToJSON(links)}
                    disabled={links.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm shadow-red-950/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File .JSON</span>
                  </button>
                </div>

                {/* Opsi CSV */}
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/60 hover:border-zinc-700 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center mb-2.5">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 mb-1">Format CSV</h3>
                    <p className="text-xs text-zinc-400 mb-3">
                      Kompatibel langsung dengan Excel, Google Sheets, dan Numbers untuk analisis spreadsheet.
                    </p>
                  </div>
                  <button
                    onClick={() => exportToCSV(links)}
                    disabled={links.length === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File .CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                <span>Total data yang akan diekspor:</span>
                <span className="font-semibold text-zinc-200 font-mono tabular-nums">
                  {links.length} tautan
                </span>
              </div>
            </div>
          )}

          {/* TAB IMPOR */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Pilih file backup dalam format <strong>.json</strong> atau <strong>.csv</strong> untuk memulihkan atau menambahkan data link ke aplikasi.
              </p>

              {/* Area Unggah File */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-red-500 rounded-xl p-6 text-center cursor-pointer bg-zinc-950/60 hover:bg-red-950/10 transition-all"
              >
                <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <div className="text-xs sm:text-sm font-semibold text-zinc-200">
                  {importFile ? importFile.name : 'Klik untuk memilih file CSV atau JSON'}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Format yang didukung: .json, .csv (Maksimal 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,text/csv,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Pesan Kesalahan */}
              {importError && (
                <div className="p-3 bg-red-950/50 border border-red-900/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Hasil Pratinjau Impor */}
              {importPreview && (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Hasil Analisis Berkas
                  </h4>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                      <div className="font-bold text-red-400 font-mono text-base tabular-nums">
                        {importPreview.valid.length}
                      </div>
                      <div className="text-zinc-500 text-[11px]">Link Valid</div>
                    </div>

                    <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                      <div className="font-bold text-amber-400 font-mono text-base tabular-nums">
                        {importPreview.duplicateCount}
                      </div>
                      <div className="text-zinc-500 text-[11px]">URL Duplikat</div>
                    </div>

                    <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                      <div className="font-bold text-zinc-500 font-mono text-base tabular-nums">
                        {importPreview.invalidCount}
                      </div>
                      <div className="text-zinc-500 text-[11px]">Baris Diabaikan</div>
                    </div>
                  </div>

                  {/* Mode Impor */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Metode Penggabungan Data:
                    </label>
                    <div className="space-y-1.5 text-xs text-zinc-300">
                      <label className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="font-medium text-zinc-200">Gabungkan dengan data yang ada</span>
                          <span className="text-zinc-500 block text-[11px]">
                            Data lama tetap tersimpan, tautan baru ditambahkan ke daftar.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <div>
                          <span className="font-medium text-red-400">Ganti seluruh data saat ini</span>
                          <span className="text-zinc-500 block text-[11px]">
                            Hapus semua data tautan lama dan gantikan dengan isi file ini.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={isProcessing}
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-950/50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lanjutkan & Terapkan Impor</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB STANDALONE (1 FILE HTML MURNI) */}
          {activeTab === 'standalone' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg text-xs text-red-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-red-300">Versi 1 File HTML Murni (Single-File Profesional):</span>
                  <p className="mt-0.5 text-zinc-300">
                    Sesuai kebutuhan Anda, Anda dapat mengunduh atau menyalin versi 1 file utuh (berisi HTML, CSS modern bertema hitam & merah, serta JavaScript vanilla dengan localStorage) yang dapat langsung dibuka dengan klik ganda di browser tanpa Node.js atau server apa pun!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadStandalone}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-950/50"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File .html Mandiri</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyStandaloneCode}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
                >
                  {copiedStandalone ? <Check className="w-4 h-4 text-red-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedStandalone ? 'Kode Tersalin!' : 'Salin Kode HTML'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-black text-zinc-300 rounded-lg text-xs font-mono overflow-hidden border border-zinc-800">
                <div className="text-zinc-500 text-[11px] mb-1.5 flex items-center justify-between">
                  <span>Pratinjau struktur berkas mandiri (Tema Hitam-Merah):</span>
                  <span className="text-red-400 font-semibold">Siap Dijalankan</span>
                </div>
                <pre className="text-[11px] leading-relaxed text-zinc-400 overflow-x-auto whitespace-pre">
{`<!DOCTYPE html>
<html lang="id">
<head>
  <style>/* Tema Profesional Hitam & Merah */</style>
</head>
<body>
  <!-- Form Input, Filter, & Daftar Link -->
  <script>/* Logika JS Murni & LocalStorage */</script>
</body>
</html>`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
