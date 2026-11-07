import { LinkItem } from '../types';
import { isValidUrl } from './storage';

/**
 * Mengonversi array link ke format CSV dengan penanganan escaping tanda kutip dan koma
 */
export function exportToCSV(links: LinkItem[]): void {
  const headers = ['ID', 'Judul', 'URL', 'Kategori', 'Tag', 'Catatan', 'Tanggal Ditambahkan'];
  
  const escapeCsv = (val: string | undefined): string => {
    if (val === undefined || val === null) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = links.map((item) => [
    escapeCsv(item.id),
    escapeCsv(item.title),
    escapeCsv(item.url),
    escapeCsv(item.category),
    escapeCsv(item.tags.join(', ')),
    escapeCsv(item.notes || ''),
    escapeCsv(item.createdAt),
  ]);

  const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `tautan-link-${getDateStamp()}.csv`);
}

/**
 * Mengunduh array link dalam format JSON terstruktur
 */
export function exportToJSON(links: LinkItem[]): void {
  const exportPayload = {
    aplikasi: 'Tiberman Learning Center',
    versi: '2.0',
    tanggalEkspor: new Date().toISOString(),
    totalData: links.length,
    data: links,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `tautan-link-backup-${getDateStamp()}.json`);
}

/**
 * Helper untuk memicu unduhan file di browser
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getDateStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Parser file CSV sederhana yang menangani kutipan bersarang
 */
export function parseCSV(csvText: string): Partial<LinkItem>[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      if (insideQuotes && csvText[i + 1] === '"') {
        currentLine += '"';
        i++; // lewati escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return [];

  // Parse header
  const parseRow = (rowStr: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"') {
        if (inQuotes && rowStr[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(field.trim());
        field = '';
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerRow = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
  
  // Deteksi indeks kolom
  const urlIdx = headerRow.findIndex((h) => h.includes('url') || h.includes('link'));
  const titleIdx = headerRow.findIndex((h) => h.includes('judul') || h.includes('title') || h.includes('nama'));
  const categoryIdx = headerRow.findIndex((h) => h.includes('kategori') || h.includes('category'));
  const tagsIdx = headerRow.findIndex((h) => h.includes('tag'));
  const notesIdx = headerRow.findIndex((h) => h.includes('catatan') || h.includes('note') || h.includes('deskripsi'));

  const parsedItems: Partial<LinkItem>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    const rawUrl = urlIdx >= 0 && cols[urlIdx] ? cols[urlIdx] : (cols[2] || '');
    const rawTitle = titleIdx >= 0 && cols[titleIdx] ? cols[titleIdx] : (cols[1] || '');

    if (!rawUrl && !rawTitle) continue;

    const rawCategory = categoryIdx >= 0 && cols[categoryIdx] ? cols[categoryIdx] : (cols[3] || 'Lainnya');
    const rawTags = tagsIdx >= 0 && cols[tagsIdx] ? cols[tagsIdx] : (cols[4] || '');
    const rawNotes = notesIdx >= 0 && cols[notesIdx] ? cols[notesIdx] : (cols[5] || '');

    const tagsArray = rawTags
      ? rawTags
          .split(/[,;]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    parsedItems.push({
      url: rawUrl,
      title: rawTitle || rawUrl,
      category: rawCategory || 'Umum',
      tags: tagsArray,
      notes: rawNotes,
      createdAt: new Date().toISOString(),
    });
  }

  return parsedItems;
}

/**
 * Parser file JSON (mendukung format ekspor aplikasi maupun array biasa)
 */
export function parseJSON(jsonText: string): Partial<LinkItem>[] {
  const parsed = JSON.parse(jsonText);
  let rawList: unknown[] = [];

  if (Array.isArray(parsed)) {
    rawList = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data: unknown[] }).data)) {
    rawList = (parsed as { data: unknown[] }).data;
  } else {
    throw new Error('Format JSON tidak sesuai. Harus berupa array data atau memiliki properti "data".');
  }

  return rawList.map((item) => {
    const obj = item as Record<string, unknown>;
    const tags = Array.isArray(obj.tags)
      ? obj.tags.map(String)
      : typeof obj.tags === 'string'
      ? obj.tags.split(',').map((t) => t.trim())
      : [];

    return {
      id: typeof obj.id === 'string' ? obj.id : undefined,
      url: String(obj.url || ''),
      title: String(obj.title || obj.judul || ''),
      category: String(obj.category || obj.kategori || 'Umum'),
      tags: tags.filter(Boolean),
      notes: typeof obj.notes === 'string' ? obj.notes : typeof obj.catatan === 'string' ? obj.catatan : '',
      createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    };
  });
}

/**
 * Validasi dan konversi item hasil impor menjadi LinkItem yang valid
 */
export function sanitizeImportedLinks(rawItems: Partial<LinkItem>[]): {
  valid: LinkItem[];
  invalidCount: number;
} {
  const valid: LinkItem[] = [];
  let invalidCount = 0;

  for (const item of rawItems) {
    if (!item.url || !isValidUrl(item.url) || !item.title || !item.title.trim()) {
      invalidCount++;
      continue;
    }

    valid.push({
      id: item.id || 'imp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      url: item.url.trim(),
      title: item.title.trim(),
      category: (item.category || 'Umum').trim(),
      linkType: item.linkType || 'article',
      tags: Array.isArray(item.tags) ? item.tags.map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
      notes: (item.notes || '').trim(),
      createdAt: item.createdAt || new Date().toISOString(),
    });
  }

  return { valid, invalidCount };
}

/**
 * Menghasilkan file index.html murni satu berkas (HTML + CSS + JS murni tanpa backend/tanpa build tool)
 * untuk pengguna yang ingin mengunduh atau menyalin versi 1-file mandiri langsung!
 */
export function generateSingleFileHtml(currentLinks: LinkItem[]): string {
  const initialDataJson = JSON.stringify(currentLinks, null, 2);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengelola Link & URL (Standalone)</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #dc2626;
      --primary-hover: #b91c1c;
      --bg: #09090b;
      --card-bg: #18181b;
      --card-inner: #09090b;
      --text: #fafafa;
      --text-muted: #a1a1aa;
      --border: #27272a;
      --border-light: #3f3f46;
      --danger: #ef4444;
      --success: #22c55e;
      --warning: #f59e0b;
      --radius: 10px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px 16px;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: var(--text); }
    h1 span { color: var(--primary); }
    .subtitle { font-size: 0.875rem; color: var(--text-muted); }
    .grid-layout { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
    @media (max-width: 860px) { .grid-layout { grid-template-columns: 1fr; } }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 0.8125rem; font-weight: 600; margin-bottom: 6px; color: #e4e4e7; }
    label span.req { color: var(--primary); }
    input[type="text"], input[type="url"], select, textarea {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.875rem;
      background: var(--card-inner);
      color: var(--text);
      transition: all 0.15s ease;
    }
    input:focus, select:focus, textarea:focus {
      outline: 2px solid rgba(220, 38, 38, 0.4);
      border-color: var(--primary);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-primary { background: var(--primary); color: white; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4); }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline { background: #27272a; border-color: #3f3f46; color: #f4f4f5; }
    .btn-outline:hover { background: #3f3f46; }
    .btn-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.3); }
    .btn-sm { padding: 4px 10px; font-size: 0.75rem; border-radius: 6px; }
    .badge-sep { color: #52525b; margin: 0 6px; }
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .link-item {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 12px;
      background: var(--card-inner);
      transition: border-color 0.15s ease;
    }
    .link-item:hover { border-color: #52525b; }
    .link-title { font-weight: 600; font-size: 1rem; margin-bottom: 4px; display: block; color: var(--text); text-decoration: none; }
    .link-title:hover { color: #f87171; }
    .link-url {
      font-size: 0.8125rem;
      color: #f87171;
      text-decoration: none;
      word-break: break-all;
      font-family: monospace;
    }
    .link-url:hover { text-decoration: underline; }
    .meta-line { font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; }
    .tag-chip {
      background: #27272a;
      color: #d4d4d8;
      border: 1px solid #3f3f46;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      margin-right: 4px;
    }
    .alert-banner {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.8125rem;
      margin-bottom: 14px;
      display: none;
    }
    .alert-warning { background: rgba(220, 38, 38, 0.2); color: #fca5a5; border: 1px solid rgba(220, 38, 38, 0.4); }
    .alert-success { background: rgba(34, 197, 94, 0.15); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    th, td { padding: 12px 14px; border-bottom: 1px solid var(--border); text-align: left; }
    th { font-weight: 600; background: #09090b; color: var(--text-muted); }
    tr:hover td { background: rgba(255,255,255,0.02); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="https://karir.tiberman.com/wp-content/uploads/2021/11/logo-Tiberman-Favicon-1.png" alt="Logo Tiberman" style="width: 36px; height: 36px; object-fit: contain; border-radius: 6px; background: #18181b; padding: 3px; border: 1px solid #27272a;" referrerpolicy="no-referrer">
        <div>
          <h1>Tiberman <span>Tautan</span></h1>
          <p class="subtitle">Aplikasi web mandiri murni HTML, CSS, dan JavaScript tanpa backend.</p>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm" onclick="exportDataJSON()">Ekspor JSON</button>
        <button class="btn btn-outline btn-sm" onclick="exportDataCSV()">Ekspor CSV</button>
        <label class="btn btn-outline btn-sm" style="cursor: pointer;">
          Impor File <input type="file" id="importFileInput" accept=".json,.csv" style="display: none;" onchange="importData(event)">
        </label>
      </div>
    </header>

    <div id="statusAlert" class="alert-banner"></div>

    <div class="grid-layout">
      <!-- FORM INPUT -->
      <aside>
        <div class="card">
          <h2 id="formTitle" style="font-size: 1.125rem; margin-bottom: 14px;">Tambah Link Baru</h2>
          <form id="linkForm" onsubmit="handleFormSubmit(event)">
            <input type="hidden" id="editId">
            <div class="form-group">
              <label for="urlInput">URL (Tautan) *</label>
              <input type="url" id="urlInput" placeholder="https://example.com" required oninput="checkDuplicateUrl()">
              <div id="duplicateWarning" style="color: var(--warning); font-size: 0.75rem; margin-top: 4px; display: none;"></div>
            </div>
            <div class="form-group">
              <label for="titleInput">Judul *</label>
              <input type="text" id="titleInput" placeholder="Contoh: Dokumentasi Web" required>
            </div>
            <div class="form-group">
              <label for="categorySelect">Kategori *</label>
              <select id="categorySelect" onchange="handleCategoryChange()">
                <option value="Teknologi">Teknologi</option>
                <option value="Pendidikan">Pendidikan</option>
                <option value="Desain">Desain</option>
                <option value="Hiburan">Hiburan</option>
                <option value="Bisnis">Bisnis</option>
                <option value="__NEW__">+ Ketik Kategori Baru...</option>
              </select>
              <input type="text" id="customCategoryInput" placeholder="Nama kategori baru..." style="display: none; margin-top: 6px;">
            </div>
            <div class="form-group">
              <label for="tagsInput">Tag (pisahkan dengan koma)</label>
              <input type="text" id="tagsInput" placeholder="web, referensi, tutorial">
            </div>
            <div class="form-group">
              <label for="notesInput">Catatan Singkat</label>
              <textarea id="notesInput" rows="3" placeholder="Deskripsi atau catatan tentang link ini..."></textarea>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="submit" class="btn btn-primary" style="flex: 1;" id="saveBtn">Simpan Link</button>
              <button type="button" class="btn btn-outline" id="cancelBtn" style="display: none;" onclick="resetForm()">Batal</button>
            </div>
          </form>
        </div>
      </aside>

      <!-- DAFTAR LINK -->
      <main>
        <div class="card">
          <div class="filter-bar">
            <input type="text" id="searchInput" placeholder="Cari judul, URL, tag..." style="max-width: 260px;" oninput="renderLinks()">
            <div style="display: flex; gap: 8px; align-items: center;">
              <select id="filterCategory" onchange="renderLinks()" style="width: auto;">
                <option value="">Semua Kategori</option>
              </select>
              <button class="btn btn-outline btn-sm" onclick="toggleViewMode()" id="viewModeBtn">Bentuk Tabel</button>
            </div>
          </div>

          <div id="linksContainer"></div>
        </div>
      </main>
    </div>
  </div>

  <script>
    // State aplikasi
    const STORAGE_KEY = 'pengelola_link_standalone_data';
    let links = [];
    let currentView = 'cards'; // 'cards' atau 'table'

    // Inisialisasi awal
    function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { links = JSON.parse(stored); } catch (e) { links = []; }
      } else {
        links = ${initialDataJson};
        saveData();
      }
      populateCategories();
      renderLinks();
    }

    function saveData() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      populateCategories();
    }

    function showAlert(msg, isSuccess = true) {
      const el = document.getElementById('statusAlert');
      el.className = 'alert-banner ' + (isSuccess ? 'alert-success' : 'alert-warning');
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; }, 3500);
    }

    function populateCategories() {
      const cats = Array.from(new Set(links.map(l => l.category).filter(Boolean)));
      if (!cats.includes('Teknologi')) cats.unshift('Teknologi');
      
      const select = document.getElementById('categorySelect');
      const filterSelect = document.getElementById('filterCategory');
      
      const currentSelected = select.value;
      const currentFilter = filterSelect.value;

      select.innerHTML = '';
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        select.appendChild(opt);
      });
      const optNew = document.createElement('option');
      optNew.value = '__NEW__'; optNew.textContent = '+ Ketik Kategori Baru...';
      select.appendChild(optNew);
      if (currentSelected && cats.includes(currentSelected)) select.value = currentSelected;

      filterSelect.innerHTML = '<option value="">Semua Kategori</option>';
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        filterSelect.appendChild(opt);
      });
      if (currentFilter) filterSelect.value = currentFilter;
    }

    function handleCategoryChange() {
      const sel = document.getElementById('categorySelect');
      const customInput = document.getElementById('customCategoryInput');
      customInput.style.display = sel.value === '__NEW__' ? 'block' : 'none';
      if (sel.value === '__NEW__') customInput.focus();
    }

    function checkDuplicateUrl() {
      const rawUrl = document.getElementById('urlInput').value.trim().toLowerCase().replace(/\\/+$/, '');
      const editId = document.getElementById('editId').value;
      const warningEl = document.getElementById('duplicateWarning');

      if (!rawUrl) {
        warningEl.style.display = 'none';
        return;
      }

      const dup = links.find(l => l.id !== editId && l.url.trim().toLowerCase().replace(/\\/+$/, '') === rawUrl);
      if (dup) {
        warningEl.textContent = 'Peringatan: URL ini sudah ada ("' + dup.title + '")';
        warningEl.style.display = 'block';
      } else {
        warningEl.style.display = 'none';
      }
    }

    function handleFormSubmit(e) {
      e.preventDefault();
      const editId = document.getElementById('editId').value;
      const url = document.getElementById('urlInput').value.trim();
      const title = document.getElementById('titleInput').value.trim();
      
      // Validasi protokol
      if (!/^https?:\\/\\//i.test(url)) {
        alert('URL harus diawali dengan http:// atau https://');
        return;
      }

      let category = document.getElementById('categorySelect').value;
      if (category === '__NEW__') {
        const customCat = document.getElementById('customCategoryInput').value.trim();
        if (!customCat) { alert('Silakan ketik nama kategori baru.'); return; }
        category = customCat;
      }

      const tagsRaw = document.getElementById('tagsInput').value;
      const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const notes = document.getElementById('notesInput').value.trim();

      // Cek duplikat konfirmasi
      const normUrl = url.toLowerCase().replace(/\\/+$/, '');
      const existing = links.find(l => l.id !== editId && l.url.toLowerCase().replace(/\\/+$/, '') === normUrl);
      if (existing) {
        if (!confirm('URL ini sudah ada dengan judul "' + existing.title + '". Tetap simpan?')) {
          return;
        }
      }

      if (editId) {
        // Edit mode
        const idx = links.findIndex(l => l.id === editId);
        if (idx !== -1) {
          links[idx] = { ...links[idx], url, title, category, tags, notes, updatedAt: new Date().toISOString() };
          showAlert('Link berhasil diperbarui!');
        }
      } else {
        // Tambah baru
        const newItem = {
          id: 'link-' + Date.now(),
          url,
          title,
          category,
          tags,
          notes,
          createdAt: new Date().toISOString()
        };
        links.unshift(newItem);
        showAlert('Link berhasil ditambahkan!');
      }

      saveData();
      resetForm();
      renderLinks();
    }

    function resetForm() {
      document.getElementById('editId').value = '';
      document.getElementById('urlInput').value = '';
      document.getElementById('titleInput').value = '';
      document.getElementById('tagsInput').value = '';
      document.getElementById('notesInput').value = '';
      document.getElementById('customCategoryInput').value = '';
      document.getElementById('customCategoryInput').style.display = 'none';
      document.getElementById('categorySelect').selectedIndex = 0;
      document.getElementById('duplicateWarning').style.display = 'none';
      document.getElementById('formTitle').textContent = 'Tambah Link Baru';
      document.getElementById('saveBtn').textContent = 'Simpan Link';
      document.getElementById('cancelBtn').style.display = 'none';
    }

    function editLink(id) {
      const item = links.find(l => l.id === id);
      if (!item) return;

      document.getElementById('editId').value = item.id;
      document.getElementById('urlInput').value = item.url;
      document.getElementById('titleInput').value = item.title;
      document.getElementById('tagsInput').value = item.tags.join(', ');
      document.getElementById('notesInput').value = item.notes || '';
      
      const sel = document.getElementById('categorySelect');
      let found = false;
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === item.category) {
          sel.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        sel.value = '__NEW__';
        document.getElementById('customCategoryInput').style.display = 'block';
        document.getElementById('customCategoryInput').value = item.category;
      } else {
        document.getElementById('customCategoryInput').style.display = 'none';
      }

      document.getElementById('formTitle').textContent = 'Edit Link';
      document.getElementById('saveBtn').textContent = 'Simpan Perubahan';
      document.getElementById('cancelBtn').style.display = 'inline-block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteLink(id) {
      const item = links.find(l => l.id === id);
      if (!item) return;

      if (confirm('Yakin ingin menghapus link "' + item.title + '"?')) {
        links = links.filter(l => l.id !== id);
        saveData();
        renderLinks();
        showAlert('Link berhasil dihapus.');
      }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showAlert('Tautan disalin ke papan klip!');
      }).catch(() => {
        alert('Gagal menyalin tautan.');
      });
    }

    function toggleViewMode() {
      currentView = currentView === 'cards' ? 'table' : 'cards';
      document.getElementById('viewModeBtn').textContent = currentView === 'cards' ? 'Bentuk Tabel' : 'Bentuk Kartu';
      renderLinks();
    }

    function renderLinks() {
      const container = document.getElementById('linksContainer');
      const search = document.getElementById('searchInput').value.trim().toLowerCase();
      const catFilter = document.getElementById('filterCategory').value;

      const filtered = links.filter(l => {
        const matchSearch = !search || 
          l.title.toLowerCase().includes(search) || 
          l.url.toLowerCase().includes(search) || 
          (l.notes && l.notes.toLowerCase().includes(search)) ||
          l.tags.some(t => t.toLowerCase().includes(search));
        const matchCat = !catFilter || l.category === catFilter;
        return matchSearch && matchCat;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.875rem;">Tidak ada link yang sesuai.</div>';
        return;
      }

      if (currentView === 'table') {
        let html = '<div class="table-container"><table><thead><tr><th>Judul & Catatan</th><th>URL</th><th>Kategori & Tag</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>';
        filtered.forEach(item => {
          const dateStr = new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const tagsHtml = item.tags.map(t => '<span class="tag-chip">' + escapeHtml(t) + '</span>').join('');
          html += '<tr>' +
            '<td><strong>' + escapeHtml(item.title) + '</strong>' + (item.notes ? '<br><small style="color:var(--text-muted);">' + escapeHtml(item.notes) + '</small>' : '') + '</td>' +
            '<td><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" class="link-url">' + escapeHtml(item.url) + '</a></td>' +
            '<td><span>' + escapeHtml(item.category) + '</span><br>' + tagsHtml + '</td>' +
            '<td>' + dateStr + '</td>' +
            '<td>' +
              '<button class="btn btn-outline btn-sm" onclick="editLink(\\'' + item.id + '\\')">Edit</button> ' +
              '<button class="btn btn-danger btn-sm" onclick="deleteLink(\\'' + item.id + '\\')">Hapus</button>' +
            '</td>' +
          '</tr>';
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
      } else {
        let html = '';
        filtered.forEach(item => {
          const dateStr = new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const tagsHtml = item.tags.map(t => '<span class="tag-chip">' + escapeHtml(t) + '</span>').join('');
          html += '<div class="link-item">' +
            '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">' +
              '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" class="link-title">' + escapeHtml(item.title) + ' ↗</a>' +
              '<div style="display: flex; gap: 4px;">' +
                '<button class="btn btn-outline btn-sm" onclick="copyToClipboard(\\'' + escapeHtml(item.url) + '\\')" title="Salin">Salin</button>' +
                '<button class="btn btn-outline btn-sm" onclick="editLink(\\'' + item.id + '\\')">Edit</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteLink(\\'' + item.id + '\\')">Hapus</button>' +
              '</div>' +
            '</div>' +
            '<a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer" class="link-url">' + escapeHtml(item.url) + '</a>' +
            (item.notes ? '<p style="font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px;">' + escapeHtml(item.notes) + '</p>' : '') +
            '<div class="meta-line">' +
              '<span>' + escapeHtml(item.category) + '</span>' +
              '<span class="badge-sep">·</span>' +
              '<span>' + dateStr + '</span>' +
              (tagsHtml ? '<span class="badge-sep">·</span> ' + tagsHtml : '') +
            '</div>' +
          '</div>';
        });
        container.innerHTML = html;
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function exportDataJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(links, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = "tautan-link-" + Date.now() + ".json";
      a.click();
    }

    function exportDataCSV() {
      const headers = ['ID', 'Judul', 'URL', 'Kategori', 'Tag', 'Catatan', 'Tanggal Ditambahkan'];
      const rows = links.map(l => [
        '"' + l.id + '"',
        '"' + (l.title || '').replace(/"/g, '""') + '"',
        '"' + (l.url || '').replace(/"/g, '""') + '"',
        '"' + (l.category || '').replace(/"/g, '""') + '"',
        '"' + (l.tags ? l.tags.join(', ') : '') + '"',
        '"' + (l.notes || '').replace(/"/g, '""') + '"',
        '"' + (l.createdAt || '') + '"'
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows.map(r => r.join(','))].join('\\r\\n'));
      const a = document.createElement('a');
      a.href = csvContent;
      a.download = "tautan-link-" + Date.now() + ".csv";
      a.click();
    }

    function importData(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const content = evt.target.result;
          let newLinks = [];
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            newLinks = Array.isArray(parsed) ? parsed : (parsed.data || []);
          } else {
            // CSV parsing sederhana
            const lines = content.split(/\\r?\\n/).filter(Boolean);
            if (lines.length > 1) {
              for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
                if (parts[2] && parts[1]) {
                  newLinks.push({
                    id: 'link-' + Date.now() + '-' + i,
                    title: parts[1],
                    url: parts[2],
                    category: parts[3] || 'Umum',
                    tags: parts[4] ? parts[4].split(';').map(t => t.trim()) : [],
                    notes: parts[5] || '',
                    createdAt: parts[6] || new Date().toISOString()
                  });
                }
              }
            }
          }
          if (newLinks.length > 0) {
            links = [...newLinks, ...links];
            saveData();
            renderLinks();
            showAlert('Berhasil mengimpor ' + newLinks.length + ' link!');
          } else {
            alert('Tidak ditemukan data valid dalam berkas.');
          }
        } catch (err) {
          alert('Gagal membaca berkas: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }

    // Jalankan aplikasi
    init();
  </script>
</body>
</html>`;
}
