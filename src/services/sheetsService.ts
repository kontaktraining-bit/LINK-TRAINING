import { LinkItem, LinkType } from '../types';

export const SPREADSHEET_ID = '1YYMjJCRsinVdVB5S1WkNaHRe2CbJoYGWZnoyL4ibCBg';
export const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

const HEADERS = ['ID', 'Judul', 'URL', 'Kategori', 'Jenis Link', 'Tag', 'Catatan', 'Tanggal Ditambahkan'];

/**
 * Mendapatkan nama sheet/tab pertama secara dinamis dari Google Spreadsheet
 */
export async function getFirstSheetName(accessToken: string): Promise<string> {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${res.status}: Gagal membaca metadata spreadsheet`);
    }

    const data = await res.json();
    if (data.sheets && data.sheets.length > 0 && data.sheets[0].properties?.title) {
      return data.sheets[0].properties.title;
    }
    return 'Sheet1';
  } catch (err) {
    console.warn('Gagal membaca nama tab spreadsheet, default ke Sheet1:', err);
    return 'Sheet1';
  }
}

/**
 * Membaca seluruh data tautan dari Google Spreadsheet
 */
export async function fetchLinksFromGoogleSheet(accessToken: string): Promise<{
  links: LinkItem[];
  sheetName: string;
  isNewSheet: boolean;
}> {
  const sheetName = await getFirstSheetName(accessToken);
  const encodedSheet = encodeURIComponent(sheetName);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${encodedSheet}'!A1:H`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Gagal mengambil data dari Google Sheets (HTTP ${res.status})`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  if (rows.length === 0) {
    // Spreadsheet benar-benar kosong, inisialisasi header
    await initializeSheetHeaders(accessToken, sheetName);
    return { links: [], sheetName, isNewSheet: true };
  }

  // Jika baris pertama adalah header
  const firstRow = rows[0].map((c) => String(c).toLowerCase());
  const hasHeader = firstRow.some((c) => c.includes('url') || c.includes('judul') || c.includes('title') || c.includes('id'));

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const links: LinkItem[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const id = row[0] ? String(row[0]).trim() : `sheet-${Date.now()}-${i}`;
    const title = row[1] ? String(row[1]).trim() : '';
    const url = row[2] ? String(row[2]).trim() : '';
    const category = row[3] ? String(row[3]).trim() : 'Umum';
    const linkType = (row[4] ? String(row[4]).trim().toLowerCase() : 'article') as LinkType;
    const rawTags = row[5] ? String(row[5]) : '';
    const notes = row[6] ? String(row[6]).trim() : '';
    const createdAt = row[7] ? String(row[7]).trim() : new Date().toISOString();

    if (!url && !title) continue;

    const tags = rawTags
      ? rawTags
          .split(/[,;]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    links.push({
      id: id || `item-${i + 1}`,
      title: title || url,
      url: url,
      category: category || 'Umum',
      linkType: ['video', 'document', 'course', 'article', 'tool', 'other'].includes(linkType) ? linkType : 'article',
      tags,
      notes,
      createdAt,
    });
  }

  return { links, sheetName, isNewSheet: false };
}

/**
 * Menulis header awal jika sheet masih kosong
 */
export async function initializeSheetHeaders(accessToken: string, sheetName: string): Promise<void> {
  const encodedSheet = encodeURIComponent(sheetName);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${encodedSheet}'!A1:H1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetName}'!A1:H1`,
        majorDimension: 'ROWS',
        values: [HEADERS],
      }),
    }
  );
}

/**
 * Sinkronisasi penuh seluruh data tautan ke Google Spreadsheet
 * (Digunakan saat ada penambahan, pengeditan, atau penghapusan data)
 */
export async function syncAllLinksToGoogleSheet(
  accessToken: string,
  links: LinkItem[],
  customSheetName?: string
): Promise<void> {
  const sheetName = customSheetName || (await getFirstSheetName(accessToken));
  const encodedSheet = encodeURIComponent(sheetName);

  // 1. Bersihkan isi spreadsheet yang ada terlebih dahulu agar data yang dihapus tidak tertinggal
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${encodedSheet}'!A1:H:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // 2. Siapkan baris data baru (Header + seluruh links)
  const rows = [
    HEADERS,
    ...links.map((item) => [
      item.id,
      item.title,
      item.url,
      item.category || 'Umum',
      item.linkType || 'article',
      item.tags ? item.tags.join(', ') : '',
      item.notes || '',
      item.createdAt,
    ]),
  ];

  // 3. Tulis seluruh baris kembali ke Google Sheets
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/'${encodedSheet}'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetName}'!A1`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Gagal menyinkronkan data ke Google Sheets (HTTP ${res.status})`);
  }
}
