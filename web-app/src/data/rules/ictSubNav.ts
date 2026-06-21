import type { IctSubNavItem } from '../../types/sidebarUi';
import type { SidebarNavItemId } from '../../types/sidebarUi';

const P = {
  signal:
    'M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z',
  layers:
    'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z',
  pin: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  building:
    'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z',
  radio:
    'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  doc: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  flags:
    'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
  chart:
    'M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z',
  play: 'M8 5v14l11-7z',
  crosshair:
    'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
  book: 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  people:
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z',
  bug: 'M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z',
  folder:
    'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  folderAlt:
    'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
  grid: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z',
  lightning: 'M7 2v11h3v9l7-12h-4l4-8z',
  calendar:
    'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z',
  shield:
    'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
  star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  warning:
    'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  mute: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
  block:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.68L5.68 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.68l11.22-11.22C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z',
  wave: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  check:
    'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  monitor:
    'M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
  server:
    'M20 2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 6H4V4h16v4zm0 4H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H4v-4h16v4zm-3-9h2v2h-2zm0 6h2v2h-2z',
  link: 'M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z',
  settings:
    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  download:
    'M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z',
  refresh:
    'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  wrench:
    'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
  gas: 'M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6C4.9 3 4 3.9 4 5v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z',
  tree: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z',
  device:
    'M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z',
};

export const ICT_SUB_NAV: Partial<Record<SidebarNavItemId, IctSubNavItem[]>> = {
  'shell.sidebar.nav.item.ict.planning': [
    { id: 'ict.sub.planning.keh',       label: 'תכנון קשר',              iconPath: P.signal },
    { id: 'ict.sub.planning.shuv',      label: 'תכנון שו"ב',             iconPath: P.layers },
    { id: 'ict.sub.planning.hq',        label: 'מיקומי מפקדות',          iconPath: P.building },
    { id: 'ict.sub.planning.platforms', label: 'מיקומי פלטפורמות',        iconPath: P.pin },
    { id: 'ict.sub.planning.radio',     label: 'תכנון פקל רדיו',         iconPath: P.radio },
    { id: 'ict.sub.planning.kapkim',    label: 'קפ"קים ונספח תקשוב',     iconPath: P.doc },
  ],

  'shell.sidebar.nav.item.ict.effortSync': [
    { id: 'ict.sub.sync.shlita',        label: 'שליטה',                  iconPath: P.flags },
    { id: 'ict.sub.sync.reports',       label: 'דוחות ועזרים',           iconPath: P.chart },
    { id: 'ict.sub.sync.scenario',      label: 'תסריט קרב',              iconPath: P.play },
    { id: 'ict.sub.sync.bom',           label: 'בו"מ',                   iconPath: P.crosshair },
    { id: 'ict.sub.sync.journal',       label: 'יומן מבצעים',            iconPath: P.book },
    { id: 'ict.sub.sync.forces',        label: 'כוחות ומשימות',          iconPath: P.people },
    { id: 'ict.sub.sync.faults',        label: 'מעקב תקלות במרחב',       iconPath: P.bug },
  ],

  'shell.sidebar.nav.item.ict.radio': [
    { id: 'ict.sub.radio.package',      label: 'פקל רדיו עדכני',         iconPath: P.radio },
    { id: 'ict.sub.radio.tools',        label: 'מתאר כלים תקשוביים ועמדות', iconPath: P.grid },
    { id: 'ict.sub.radio.cuts',         label: 'תיק חתכים רדיו',         iconPath: P.folder },
    { id: 'ict.sub.radio.shuv-cuts',    label: 'תיק חתכים שו"ב',         iconPath: P.folderAlt },
  ],

  'shell.sidebar.nav.item.ict.spectrum': [
    { id: 'ict.sub.spectrum.pls',       label: 'פקודת פלס',              iconPath: P.lightning },
    { id: 'ict.sub.spectrum.events',    label: 'יומן אירועים ספקטרלי',   iconPath: P.calendar },
    { id: 'ict.sub.spectrum.policy',    label: 'מדיניות הספקטרום',        iconPath: P.shield },
    { id: 'ict.sub.spectrum.meaning',   label: 'עיקרי משמעות ספקטרום',   iconPath: P.star },
    { id: 'ict.sub.spectrum.conflicts', label: 'קונפליקטים קיימים',       iconPath: P.warning },
    { id: 'ict.sub.spectrum.mutes',     label: 'השתקות קיימות',           iconPath: P.mute },
    { id: 'ict.sub.spectrum.blocks',    label: 'חסימות קיימות',           iconPath: P.block },
    { id: 'ict.sub.spectrum.effects',   label: 'השפעות קיימות',           iconPath: P.wave },
  ],

  'shell.sidebar.nav.item.ict.monitor': [
    { id: 'ict.sub.monitor.processes',  label: 'כשירות תהליכים מבצעיים', iconPath: P.check },
    { id: 'ict.sub.monitor.platforms',  label: 'ניטור פלטפורמות ומפקדות', iconPath: P.monitor },
    { id: 'ict.sub.monitor.radio',      label: 'ניטור עמדות רדיו',        iconPath: P.signal },
    { id: 'ict.sub.monitor.infra',      label: 'תשתיות ותמסורות',         iconPath: P.server },
    { id: 'ict.sub.monitor.arteries',   label: 'עורקים וניוחים',          iconPath: P.link },
  ],

  'shell.sidebar.nav.item.ict.lomer': [
    { id: 'ict.sub.lomer.versions',     label: 'בקרת גרסאות',            iconPath: P.doc },
    { id: 'ict.sub.lomer.periods',      label: 'החלפת תקופות חכ"ס',      iconPath: P.refresh },
    { id: 'ict.sub.lomer.systems',      label: 'כשירות מערכות ומאמצים',   iconPath: P.settings },
    { id: 'ict.sub.lomer.updates',      label: 'בקרת עדכוני הק"שים',     iconPath: P.download },
  ],

  'shell.sidebar.nav.item.ict.manhala': [
    { id: 'ict.sub.manhala.personnel',  label: 'בקרת כ"א חוצה גדר',      iconPath: P.people },
    { id: 'ict.sub.manhala.tools',      label: 'מעקב כלים תקשוביים ותחזוקה', iconPath: P.wrench },
    { id: 'ict.sub.manhala.fuel',       label: 'ניהול תדלוקים',           iconPath: P.gas },
  ],

  'shell.sidebar.nav.item.ict.crewSupport': [
    { id: 'ict.sub.crew.tree',          label: 'עץ הציוות התקשובי',       iconPath: P.tree },
    { id: 'ict.sub.crew.edge',          label: 'כשירות אמצעי קצה',        iconPath: P.device },
  ],
};
