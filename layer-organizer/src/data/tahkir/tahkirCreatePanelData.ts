export interface TahkirDiaryEntry {
  id: string;
  time?: string;
  title: string;
  body?: string;
}

/** רצף אירועים — Figma 393:30632–30637 */
export const TAHKIR_DIARY_ENTRIES: TahkirDiaryEntry[] = [
  {
    id: '1',
    title: 'תיאור כללי',
    body: 'תיאור של מלל חופשי על משהו, על כל מיני דברים שקורים תוך כדי ומה אפשר לראות וללמוד מהם וכו וכו וכו',
  },
  {
    id: '2',
    title: 'אישורים',
    body: 'תיאור של מלל חופשי על האישורים החשובים שקיבלנו',
  },
  {
    id: '3',
    time: '12:31:09',
    title: 'עובדת במדיניות האש',
  },
  {
    id: '4',
    time: '12:31:09',
    title: 'מעבר למצב תקיפה',
  },
  {
    id: '5',
    time: '12:31:09',
    title: 'סיום שלב ראשון',
  },
];

export const TAHKIR_RECORDING_TOOLS = [
  { id: 'play', label: 'תחילת\nהקלטה', iconKey: 'play' as const },
  { id: 'ztune', label: 'חוזי\nztune', iconKey: 'video' as const },
  { id: 'upload', label: 'העלאת\nקבצים', iconKey: 'upload' as const },
  { id: 'phone', label: 'הקלטת\nקשר', iconKey: 'phone' as const },
] as const;

export const TAHKIR_RADIO_SNIPPET = {
  time: '12:31:09',
  body:
    'וסטיבולום אט דולור, קראס אגת לקטוס וואל אאוגו וסטיבולום סוליסי טידום בעליק. לורם איפסום דולור סיט אמט, קונסקטורר אדיפיסינג אלית. סת אלמנקום ניסי נון ניבאה',
};
