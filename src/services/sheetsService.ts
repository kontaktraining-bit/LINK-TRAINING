import { LinkItem, LinkType } from '../types';

export const SPREADSHEET_ID = '1YYMjJCRsinVdVB5S1WkNaHRe2CbJoYGWZnoyL4ibCBg';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`;
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json`;

const WEBHOOK_STORAGE_KEY = 'tiberman_sheets_webhook_url';

/**
 * Mengambil URL Google Apps Script Webhook dari penyimpanan lokal
 */
export function getSavedWebhookUrl(): string {
  try {
    return localStorage.getItem(WEBHOOK_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Menyimpan URL Google Apps Script Webhook
 */
export function saveWebhookUrl(url: string): void {
  try {
    if (url.trim()) {
      localStorage.setItem(WEBHOOK_STORAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Gagal menyimpan webhook URL:', err);
  }
}

/**
 * Membaca data langsung dari Google Spreadsheet publik tanpa login / tanpa Firebase
 * Menggunakan Google Visualization API (gviz/tq)
 */
export async function fetchLinksDirectlyFromGoogleSheet(): Promise<LinkItem[]> {
  const res = await fetch(GVIZ_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Gagal menghubungi Google Spreadsheet.`);
  }

  const text = await res.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!match || !match[1]) {
    throw new Error('Format respon Google Spreadsheet tidak valid.');
  }

  const json = JSON.parse(match[1]);
  const rows: { c: ({ v: string | number | null } | null)[] }[] = json.table?.rows || [];

  if (rows.length === 0) {
    return [];
  }

  // Baris pertama di gviz biasanya adalah header jika diisi
  const firstRowValues = (rows[0]?.c || []).map((cell) => String(cell?.v || '').toLowerCase());
  const hasHeaderRow = firstRowValues.some((v) => v.includes('url') || v.includes('judul') || v.includes('id'));

  const dataRows = hasHeaderRow ? rows.slice(1) : rows;
  const links: LinkItem[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const cells = dataRows[i]?.c || [];
    const id = cells[0]?.v ? String(cells[0].v).trim() : `sheet-${Date.now()}-${i}`;
    const title = cells[1]?.v ? String(cells[1].v).trim() : '';
    const url = cells[2]?.v ? String(cells[2].v).trim() : '';
    const category = cells[3]?.v ? String(cells[3].v).trim() : 'Umum';
    const linkType = cells[4]?.v ? String(cells[4].v).trim().toLowerCase() : 'article';
    const rawTags = cells[5]?.v ? String(cells[5].v).trim() : '';
    const notes = cells[6]?.v ? String(cells[6].v).trim() : '';
    const createdAt = cells[7]?.v ? String(cells[7].v).trim() : new Date().toISOString();

    if (!url && !title) continue;

    const tags = rawTags
      ? rawTags
          .split(/[,;]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const validTypes: LinkType[] = ['video', 'document', 'course', 'article', 'tool', 'other'];
    const safeType: LinkType = validTypes.includes(linkType as LinkType) ? (linkType as LinkType) : 'article';

    links.push({
      id: id || `item-${i + 1}`,
      title: title || url,
      url: url,
      category: category || 'Umum',
      linkType: safeType,
      tags,
      notes,
      createdAt,
    });
  }

  return links;
}

/**
 * Mengirim aksi (add, edit, delete, syncAll) ke Google Sheets via Google Apps Script Webhook
 */
export async function sendActionToGoogleSheetsWebhook(
  action: 'add' | 'edit' | 'delete' | 'syncAll',
  payload: { item?: LinkItem; id?: string; links?: LinkItem[] },
  customWebhookUrl?: string
): Promise<{ success: boolean; message?: string }> {
  const webhookUrl = customWebhookUrl || getSavedWebhookUrl();
  if (!webhookUrl) {
    return { success: false, message: 'Webhook URL belum dikonfigurasi.' };
  }

  try {
    const body = JSON.stringify({ action, ...payload });

    // Google Apps Script menangani CORS POST melalui redirect 302
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Penting untuk melewati kebijakan CORS pada Google Apps Script
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body,
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan jaringan';
    console.error('Gagal mengirim ke Webhook:', err);
    return { success: false, message: errorMsg };
  }
}

/**
 * Kode Google Apps Script siap pakai untuk dipasang di spreadsheet pengguna
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * TIBERMAN LEARNING CENTER - GOOGLE SHEETS SYNC SCRIPT
 * 1. Buka spreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script"
 * 3. Hapus kode default, tempel seluruh kode ini, lalu klik icon Simpan (Ctrl+S)
 * 4. Klik tombol "Deploy" (Terapkan) di pojok kanan atas > "New deployment" (Penerapan baru)
 * 5. Pilih jenis "Web app" (Aplikasi Web)
 * 6. Set "Execute as": "Me" (Saya) dan "Who has access": "Anyone" (Siapa saja)
 * 7. Klik "Deploy" lalu salin URL Aplikasi Web (berakhiran /exec) dan tempelkan ke aplikasi.
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      id: String(r[0] || ''),
      title: String(r[1] || ''),
      url: String(r[2] || ''),
      category: String(r[3] || 'Umum'),
      linkType: String(r[4] || 'article'),
      tags: r[5] ? String(r[5]).split(',').map(function(t) { return t.trim(); }) : [],
      notes: String(r[6] || ''),
      createdAt: String(r[7] || new Date().toISOString())
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "ok", data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    if (action === "add") {
      var item = payload.item;
      sheet.appendRow([
        item.id,
        item.title,
        item.url,
        item.category || 'Umum',
        item.linkType || 'article',
        item.tags ? item.tags.join(', ') : '',
        item.notes || '',
        item.createdAt || new Date().toISOString()
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", action: "add" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "edit") {
      var updated = payload.item;
      var rows = sheet.getDataRange().getValues();
      var found = false;
      for (var k = 1; k < rows.length; k++) {
        if (String(rows[k][0]) === String(updated.id)) {
          sheet.getRange(k + 1, 1, 1, 8).setValues([[
            updated.id,
            updated.title,
            updated.url,
            updated.category || 'Umum',
            updated.linkType || 'article',
            updated.tags ? updated.tags.join(', ') : '',
            updated.notes || '',
            updated.createdAt || new Date().toISOString()
          ]]);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([
          updated.id,
          updated.title,
          updated.url,
          updated.category || 'Umum',
          updated.linkType || 'article',
          updated.tags ? updated.tags.join(', ') : '',
          updated.notes || '',
          updated.createdAt || new Date().toISOString()
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", action: "edit" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      var idToDelete = payload.id;
      var data = sheet.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        if (String(data[j][0]) === String(idToDelete)) {
          sheet.deleteRow(j + 1);
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", action: "delete" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "syncAll") {
      var links = payload.links;
      sheet.clearContents();
      var headers = ['ID', 'Judul', 'URL', 'Kategori', 'Jenis Link', 'Tag', 'Catatan', 'Tanggal Ditambahkan'];
      var allRows = [headers];
      for (var m = 0; m < links.length; m++) {
        var it = links[m];
        allRows.push([
          it.id,
          it.title,
          it.url,
          it.category || 'Umum',
          it.linkType || 'article',
          it.tags ? it.tags.join(', ') : '',
          it.notes || '',
          it.createdAt || new Date().toISOString()
        ]);
      }
      sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok", action: "syncAll" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "unknown_action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
