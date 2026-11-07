/**
 * Definisi tipe data untuk Tiberman Learning Center
 */

export type LinkType = 'video' | 'document' | 'article' | 'course' | 'tool' | 'other';

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  category: string;
  linkType?: LinkType;
  tags: string[];
  notes?: string;
  createdAt: string; // ISO string
  updatedAt?: string;
}

export type ViewMode = 'grid' | 'table';

export type SortField = 'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'title_desc';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
