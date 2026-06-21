import type { SharingMode } from '../types';

/** צבעי רוחב — זהים לאופציה 1 (SharingBadge) */
export const SHARING_MODE_COLORS: Record<SharingMode, string> = {
  unit: '#3b82f6',
  brigade: '#a855f7',
  pool: '#f59e0b',
};

export const SHARING_MODE_LABELS: Record<SharingMode, string> = {
  unit: 'יחידתי',
  brigade: 'עוצבתי',
  pool: 'מאגר',
};

export const SHARING_MODE_SHORT_LABELS: Record<SharingMode, string> = {
  unit: "יח'",
  brigade: "עוצ'",
  pool: 'מאגר',
};
