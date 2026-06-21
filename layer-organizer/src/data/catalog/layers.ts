import type { MainFolder } from '../../types/layers';

// ============================================================
//  קובץ הגדרת הסדרן - כאן מגדירים את כל המבנה
//  isPermanent: true  = תמיד בסדרן, לא ניתן להסיר
//  isInOrganizer: true = מופיע כרגע בסדרן (ניתן לשנות דרך החלונית)
// ============================================================

const P = false; // isPermanent default
const IO = true; // isInOrganizer default

/** מרשמי תכנון — אותה רשימה בכל תוכנית */
const PLANNING_LAYER_DEFS = [
  { suffix: 'tium', name: 'תכנון תיאום ושליטה', color: '#333333' },
  { suffix: 'mivtzaim', name: 'תכנון מבצעים ראשי', color: '#0a2463' },
  { suffix: 'oyev', name: 'תכנון אויב', color: '#7f0000' },
  { suffix: 'def-a', name: 'דפ"א א', color: '#6d28d9' },
  { suffix: 'def-b', name: 'דפ"א ב', color: '#7c3aed' },
  { suffix: 'shtakh', name: 'תכנון שטח', color: '#8B4513' },
  { suffix: 'esh', name: 'תכנון אש', color: '#7209b7' },
  { suffix: 'isuf', name: 'תכנון איסוף', color: '#2d9c4f' },
  { suffix: 'manhala', name: 'תכנון מנהלה', color: '#00acc1' },
  { suffix: 'tikshuv', name: 'תכנון תקשוב', color: '#e65100' },
] as const;

function buildPlanningPlanLayers(planPrefix: string) {
  return PLANNING_LAYER_DEFS.map(def => ({
    id: `tk-${planPrefix}-${def.suffix}`,
    name: def.name,
    color: def.color,
    isEditable: true,
    visibility: 'tactical-hq' as const,
    sharing: 'unit' as const,
    isVisible: true,
    isPermanent: P,
    isInOrganizer: IO,
  }));
}

export const initialMainFolders: MainFolder[] = [
  // ─────────────────────────────────────────
  // 1. ניהו"ק — לחימה ראשונה, אח"כ שאר התת-תיקיות
  // ─────────────────────────────────────────
  {
    id: 'nihuk',
    name: 'ניהו"ק',
    isExpanded: true,
    layers: [],
    subFolders: [
      // ── לחימה (ראשונה) ──
      {
        id: 'lakhima',
        name: 'לחימה',
        isExpanded: true,
        layers: [
          { id: 'l-kokhoteinu',   name: 'כוחותינו',         color: '#1e90ff', isEditable: true,  visibility: 'techno-tactical', sharing: 'pool', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'l-iyumim',       name: 'איתורים ואירועים', color: '#e63946', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'l-tium',         name: 'תיאום ושליטה',     color: '#333333', isEditable: true,  visibility: 'techno-tactical', sharing: 'pool', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'l-ezer-lakhima', name: 'מבצעים ראשי',      color: '#4a90d9', isEditable: true,  visibility: 'techno-tactical', sharing: 'unit', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'l-ezer-oyev',    name: 'תמ"א ראשי',         color: '#ff4d4d', isEditable: false, visibility: 'techno-tactical', sharing: 'unit', isVisible: false, isPermanent: true, isInOrganizer: IO },
          { id: 'mv-safa',        name: 'שפה משותפת',       color: '#90e0ef', isEditable: false, visibility: 'techno-tactical', sharing: 'unit', isVisible: true,  isPermanent: true, isInOrganizer: IO },
        ],
      },
      {
        id: 'mivtzaim',
        name: 'מבצעים',
        isExpanded: true,
        layers: [
          { id: 'mv-rashi',           name: 'מבצעים טיוטה',          color: '#0a2463', isEditable: true,  visibility: 'tactical-hq',     sharing: 'unit',    isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'mv-shkhunot-mamone', name: 'מבצעים ממונה',   color: '#1d4ed8', isEditable: true,  visibility: 'tactical-hq',     sharing: 'brigade', isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'mv-shkhunot-kfufim', name: 'מבצעים כפופות', color: '#2563eb', isEditable: true, visibility: 'tactical-hq', sharing: 'brigade', isVisible: true, isPermanent: P, isInOrganizer: IO,
            subFilters: [
              { id: 'kf-1', label: 'יחידה 1', isActive: true  },
              { id: 'kf-2', label: 'יחידה 2', isActive: true  },
              { id: 'kf-3', label: 'יחידה 3', isActive: false },
              { id: 'kf-4', label: 'יחידה 4', isActive: false },
            ],
          },
          { id: 'mv-shkhunot', name: 'מבצעים שכנות', color: '#3b82f6', isEditable: true, visibility: 'tactical-hq', sharing: 'brigade', isVisible: true, isPermanent: P, isInOrganizer: IO,
            subFilters: [
              { id: 'sh-1', label: 'יחידה 1', isActive: true  },
              { id: 'sh-2', label: 'יחידה 2', isActive: false },
              { id: 'sh-3', label: 'יחידה 3', isActive: false },
              { id: 'sh-4', label: 'יחידה 4', isActive: false },
            ],
          },
          { id: 'mv-khruqq',          name: 'רוק"ק',                 color: '#60a5fa', isEditable: true,  visibility: 'tactical-hq',     sharing: 'pool',    isVisible: false, isPermanent: P, isInOrganizer: IO },
          { id: 'mv-hagana',          name: 'הנדסה',                 color: '#93c5fd', isEditable: true,  visibility: 'tactical-hq',     sharing: 'unit',    isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'mv-oref',            name: 'עורף',                  color: '#bfdbfe', isEditable: false, visibility: 'hq-only',         sharing: 'unit',    isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'mv-bkama',           name: 'בקדמ"ה',                color: '#dbeafe', isEditable: true,  visibility: 'hq-only',         sharing: 'unit',    isVisible: false, isPermanent: P, isInOrganizer: IO },
          { id: 'mv-tamakh',          name: 'תמ"כ מסגרות',           color: '#48cae4', isEditable: false, visibility: 'hq-only',         sharing: 'pool',    isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'mv-ydiot',           name: 'ידיעות ודיווחים',       color: '#00b4d8', isEditable: false, visibility: 'hq-only',         sharing: 'pool',    isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'mv-izurey-inyan',    name: 'איזורי עניין יחידתיים', color: '#4ade80', isEditable: true,  visibility: 'hq-only',         sharing: 'unit',    isVisible: false, isPermanent: P,    isInOrganizer: IO },
        ],
      },
      {
        id: 'oyev',
        name: 'אויב',
        isExpanded: true,
        layers: [
          { id: 'oy-tama-rashi',  name: 'תמ"א טיוטה',      color: '#7f0000', isEditable: false, visibility: 'tactical-hq', sharing: 'unit',    isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'oy-tama-kfufim', name: 'תמ"א כפופים', color: '#c1121f', isEditable: false, visibility: 'tactical-hq', sharing: 'brigade', isVisible: true, isPermanent: P, isInOrganizer: IO,
            subFilters: [
              { id: 'tk-1', label: 'יחידה 1', isActive: true  },
              { id: 'tk-2', label: 'יחידה 2', isActive: true  },
              { id: 'tk-3', label: 'יחידה 3', isActive: false },
              { id: 'tk-4', label: 'יחידה 4', isActive: false },
            ],
          },
          { id: 'oy-tama-mamone', name: 'תמ"א ממונה',      color: '#d62828', isEditable: false, visibility: 'tactical-hq', sharing: 'brigade', isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'oy-historyia',   name: 'היסטוריה גיזרתית', color: '#ef233c', isEditable: false, visibility: 'tactical-hq', sharing: 'unit',    isVisible: false, isPermanent: P, isInOrganizer: IO },
        ],
      },
      {
        id: 'isuf',
        name: 'איסוף',
        isExpanded: false,
        layers: [
          { id: 'is-tsyakhim', name: 'ציחים', color: '#2d9c4f', isEditable: true, visibility: 'tactical-hq', sharing: 'brigade', isVisible: true, isPermanent: P, isInOrganizer: IO },
        ],
      },
      {
        id: 'esh',
        name: 'אש',
        isExpanded: true,
        layers: [
          { id: 'es-matrot', name: 'מטרות',       color: '#7209b7', isEditable: true,  visibility: 'tactical-hq',     sharing: 'brigade', isVisible: true, isPermanent: true, isInOrganizer: IO },
          { id: 'es-maagar', name: 'מאגר המטרות', color: '#9d4edd', isEditable: false, visibility: 'hq-only',         sharing: 'pool',    isVisible: true, isPermanent: P, isInOrganizer: IO },
        ],
      },
      {
        id: 'shtatakh',
        name: 'שטח',
        isExpanded: true,
        layers: [
          { id: 'sh-idkunim',  name: 'עדכוני שטח',           color: '#8B4513', isEditable: true, visibility: 'tactical-hq',     sharing: 'unit', isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'sh-mistanin',  name: 'מטענים ומיקוש יחידתי', color: '#a0522d', isEditable: true, visibility: 'techno-tactical', sharing: 'unit', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'mg-mistanin2', name: 'מטענים כוחותינו',      color: '#455a64', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'sh-tashtyot',  name: 'תשתיות אויב יחידתי',   color: '#c68642', isEditable: true, visibility: 'techno-tactical', sharing: 'unit', isVisible: false, isPermanent: true, isInOrganizer: IO },
          { id: 'sh-takarkaa', name: 'תת קרקע יחידתי',        color: '#d4a76a', isEditable: true, visibility: 'techno-tactical', sharing: 'unit', isVisible: true,  isPermanent: true, isInOrganizer: IO },
        ],
      },
      {
        id: 'tikshuv',
        name: 'תקשוב',
        isExpanded: false,
        layers: [
          { id: 'mg-spektrum',  name: 'ספקטרום',           color: '#78909c', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: false, isPermanent: true, isInOrganizer: IO },
          { id: 'tk-neyakh',   name: 'כינון המרחב נייח',  color: '#e65100', isEditable: true,  visibility: 'hq-only', sharing: 'pool', isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'tk-nayad',    name: 'כינון המרחב נייד',  color: '#f57c00', isEditable: false, visibility: 'hq-only', sharing: 'pool', isVisible: true,  isPermanent: P, isInOrganizer: IO },
          { id: 'tk-kesher',   name: 'תכנון קשר',         color: '#fb8c00', isEditable: false, visibility: 'hq-only', sharing: 'pool', isVisible: false, isPermanent: P, isInOrganizer: IO },
          { id: 'tk-tashtyot', name: 'תשתיות ותמסורות',   color: '#ffa726', isEditable: false, visibility: 'hq-only', sharing: 'pool', isVisible: false, isPermanent: P, isInOrganizer: IO },
          { id: 'tk-mfakadot', name: 'מפקדות וחפ"קים',   color: '#ffcc02', isEditable: false, visibility: 'hq-only', sharing: 'pool', isVisible: false, isPermanent: P, isInOrganizer: IO },
        ],
      },
      {
        id: 'malka',
        name: 'מנהלה',
        isExpanded: false,
        layers: [
          { id: 'mg-minkhatim', name: 'מנחתים זמ"א', color: '#90a4ae', isEditable: false, visibility: 'tactical-hq', sharing: 'pool', isVisible: false, isPermanent: true, isInOrganizer: IO },
          {
            id: 'ml-network', name: 'רשת לוגיסטית', color: '#00acc1',
            isEditable: false, visibility: 'hq-only', sharing: 'pool',
            isVisible: true, isPermanent: P, isInOrganizer: IO,
            subFilters: [
              { id: 'net-unit',     label: 'רשת יחידתית', isActive: true  },
              { id: 'net-kfufim',   label: 'רשת כפופים',  isActive: false },
              { id: 'net-mamone',   label: 'רשת ממונה',   isActive: false },
              { id: 'net-tsahali',  label: 'רשת צה"לית',  isActive: false },
            ],
          },
          { id: 'ml-tashtyot-log', name: 'תשתיות לוגיסטיות', color: '#0097a7', isEditable: false, visibility: 'hq-only', sharing: 'pool', isVisible: false, isPermanent: P, isInOrganizer: IO },
        ],
      },
      {
        id: 'maagrim',
        name: 'מאגרים',
        isExpanded: false,
        layers: [
          { id: 'mg-ragishim',  name: 'רגישים',          color: '#263238', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: false, isPermanent: true, isInOrganizer: IO },
          { id: 'mg-mistanin',  name: 'מטענים ומיקוש',   color: '#37474f', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'mg-tashtyot',  name: 'תשתיות אויב',     color: '#546e7a', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: true,  isPermanent: true, isInOrganizer: IO },
          { id: 'mg-takarkaa',  name: 'תת קרקע',          color: '#607d8b', isEditable: false, visibility: 'techno-tactical', sharing: 'pool', isVisible: false, isPermanent: true, isInOrganizer: IO },
          { id: 'mg-ukhlusiya', name: 'אחוז אוכלוסיה', color: '#b0bec5', isEditable: false, visibility: 'hq-only', sharing: 'pool', isVisible: false, isPermanent: P, isInOrganizer: IO },
        ],
      },
      {
        id: 'siyuta',
        name: 'שכבות טיוטה יחידתית',
        isExpanded: true,
        layers: [
          { id: 'sy-mivtza-tsafon', name: 'מבצע צפון ישן שבוטל', color: '#4a5568', isEditable: true, visibility: 'hq-only', sharing: 'unit', isVisible: false, isPermanent: P, isInOrganizer: IO },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────
  // 3. תכנון
  // ─────────────────────────────────────────
  {
    id: 'tikhnun',
    name: 'תכנון',
    isExpanded: true,
    layers: [],
    subFolders: [
      {
        id: 'tokhnit-shemesh-7020',
        name: 'תוכנית שמש אדומה / 7020',
        isExpanded: true,
        layers: buildPlanningPlanLayers('sa7020'),
      },
      {
        id: 'tokhnit-kayitz-7020',
        name: 'תוכנית קיץ חם / 7020',
        isExpanded: false,
        layers: buildPlanningPlanLayers('kk7020'),
      },
    ],
  },

  // ─────────────────────────────────────────
  // 4. מרשמי פלוגות
  // ─────────────────────────────────────────
  {
    id: 'marshme-plugot',
    name: 'מרשמי פלוגות',
    isExpanded: false,
    layers: [],
    subFolders: [
      { id: 'plugah-aleph', name: "פלוגה א'", isExpanded: false, layers: [] },
      { id: 'plugah-bet',   name: "פלוגה ב'", isExpanded: false, layers: [] },
      { id: 'plugah-gimel', name: "פלוגה ג'", isExpanded: false, layers: [] },
    ],
  },
];
