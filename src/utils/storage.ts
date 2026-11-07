import { LinkItem } from '../types';

const STORAGE_KEY = 'pengelola_tautan_data_v1';
const HAS_SEEDED_KEY = 'pengelola_tautan_seeded';

// Data kosong secara default (semua akun/data demo telah dihapus)
export const DEFAULT_LINKS: LinkItem[] = [];

/**
 * Normalisasi URL untuk perbandingan duplikasi yang akurat
 */
export function normalizeUrl(url: string): string {
  try {
    const trimmed = url.trim();
    if (!trimmed) return '';
    const parsed = new URL(trimmed);
    // Hapus trailing slash jika path cuma '/'
    let path = parsed.pathname;
    if (path === '/') path = '';
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.port ? ':' + parsed.port : ''}${path}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Validasi apakah URL valid dan menggunakan protokol http/https
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Harus dimulai dengan http:// atau https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Mencari apakah ada URL yang sama di dalam daftar (mencegah duplikat)
 */
export function findDuplicate(links: LinkItem[], url: string, excludeId?: string): LinkItem | undefined {
  const normalizedTarget = normalizeUrl(url);
  if (!normalizedTarget) return undefined;

  return links.find((item) => {
    if (excludeId && item.id === excludeId) return false;
    return normalizeUrl(item.url) === normalizedTarget;
  });
}

/**
 * Membaca data link dari localStorage browser dan membersihkan semua data demo awal
 */
export function loadLinks(): LinkItem[] {
  try {
    localStorage.setItem(HAS_SEEDED_KEY, 'true');

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Hapus semua data bawaan/demo yang menggunakan ID seed-*
        const cleaned = parsed.filter(
          (item: LinkItem) =>
            item &&
            typeof item === 'object' &&
            item.id &&
            !String(item.id).startsWith('seed-')
        );

        if (cleaned.length !== parsed.length) {
          saveLinks(cleaned);
        }
        return cleaned;
      }
    }

    return [];
  } catch (err) {
    console.error('Gagal membaca data dari localStorage:', err);
    return [];
  }
}

/**
 * Menyimpan data link ke localStorage browser
 */
export function saveLinks(links: LinkItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (err) {
    console.error('Gagal menyimpan data ke localStorage:', err);
  }
}

/**
 * Menghapus seluruh data dari localStorage (reset bersih)
 */
export function clearAllLinks(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Gagal menghapus data dari localStorage:', err);
  }
}

/**
 * Format tanggal ke bahasa Indonesia
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Mengambil nama domain dari URL (misal: "github.com")
 */
export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
