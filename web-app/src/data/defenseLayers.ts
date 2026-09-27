// Mock data for the five defense/intel layers on the tactical map.
// Shape is deliberately flat (lat/lng tuples + enums) so a real API can replace it 1:1.

export type LatLng = [number, number];

// ── גדרות (חותכים) — zen ───────────────────────────────────────────────
export type FenceSegmentStatus = "INTACT" | "CUT" | "REPAIRED";

export interface FenceSegment {
  id: string;
  name: string;
  points: LatLng[];
  status: FenceSegmentStatus;
}

/** נקודת חיתוך/פריצה בגדר (חותכים) */
export interface FenceBreach {
  id: string;
  fenceId: string;
  position: LatLng;
  detectedAt: string; // HH:mm
  status: FenceSegmentStatus;
  note: string;
}

export const FENCE_STATUS_META: Record<FenceSegmentStatus, { label: string; color: string }> = {
  INTACT: { label: "תקין", color: "#4a4f55" },
  CUT: { label: "נחתך", color: "#4a4f55" },
  REPAIRED: { label: "תוקן", color: "#4a4f55" },
};

export const FENCE_SEGMENTS: FenceSegment[] = [
  {
    id: "fence-1",
    name: "גדר גבול — קטע מערבי",
    status: "CUT",
    points: [[33.246, 35.505], [33.250, 35.518], [33.254, 35.531], [33.257, 35.543]],
  },
  {
    id: "fence-2",
    name: "גדר גבול — קטע מרכזי",
    status: "REPAIRED",
    points: [[33.257, 35.543], [33.262, 35.556], [33.265, 35.568], [33.267, 35.580]],
  },
  {
    id: "fence-3",
    name: "גדר גבול — קטע מזרחי",
    status: "INTACT",
    points: [[33.267, 35.580], [33.272, 35.592], [33.278, 35.604]],
  },
];

export const FENCE_BREACHES: FenceBreach[] = [
  { id: "breach-1", fenceId: "fence-1", position: [33.2475, 35.5100], detectedAt: "03:12", status: "CUT", note: "חיתוך בגדר — התראת חיישן רעידות" },
  { id: "breach-2", fenceId: "fence-1", position: [33.2528, 35.5245], detectedAt: "04:30", status: "CUT", note: "חיתוך בגדר" },
  { id: "breach-3", fenceId: "fence-1", position: [33.2560, 35.5380], detectedAt: "22:05", status: "REPAIRED", note: "חיתוך שתוקן ע״י צוות הנדסה" },
  { id: "breach-4", fenceId: "fence-2", position: [33.2600, 35.5510], detectedAt: "01:47", status: "REPAIRED", note: "חיתוך שתוקן ע״י צוות הנדסה" },
  { id: "breach-5", fenceId: "fence-2", position: [33.2655, 35.5630], detectedAt: "02:15", status: "CUT", note: "חיתוך בגדר — התראת חיישן רעידות" },
  { id: "breach-6", fenceId: "fence-3", position: [33.2695, 35.5860], detectedAt: "05:40", status: "CUT", note: "חיתוך בגדר" },
  { id: "breach-7", fenceId: "fence-3", position: [33.2755, 35.5990], detectedAt: "00:22", status: "REPAIRED", note: "חיתוך שתוקן ע״י צוות הנדסה" },
];

// ── נתיבי חדירה ───────────────────────────────────────────────────────
export interface InfiltrationRoute {
  id: string;
  label: string;
  /** סכמטי: מעט נקודות ציון מנוקות, כיוון חדירה ברור */
  schematic: LatLng[];
  /** גולמי: סדרת גילויים בפועל (רועש, צפוף) */
  raw: LatLng[];
  frequency: number; // חדירות ב-30 ימים אחרונים
  threat: "HIGH" | "MEDIUM" | "LOW";
}

export const THREAT_COLORS: Record<InfiltrationRoute["threat"], string> = {
  HIGH: "#8b0000",
  MEDIUM: "#8b0000",
  LOW: "#8b0000",
};

// Deterministic jitter so the "raw" trace is stable across reloads.
function jitterTrace(base: LatLng[], seed: number, perLeg = 9, amp = 0.0011): LatLng[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296 - 0.5;
  };
  const out: LatLng[] = [];
  for (let i = 0; i < base.length - 1; i++) {
    const [a, b] = [base[i], base[i + 1]];
    for (let k = 0; k < perLeg; k++) {
      const t = k / perLeg;
      out.push([a[0] + (b[0] - a[0]) * t + rnd() * amp, a[1] + (b[1] - a[1]) * t + rnd() * amp]);
    }
  }
  out.push(base[base.length - 1]);
  return out;
}

const SCHEMATIC_ROUTES: Omit<InfiltrationRoute, "raw">[] = [
  { id: "route-1", label: "ציר ואדי — מערב", threat: "HIGH", frequency: 14,
    schematic: [[33.300, 35.515], [33.276, 35.520], [33.2515, 35.5235], [33.235, 35.530]] },
  { id: "route-2", label: "ציר רכס — מרכז", threat: "MEDIUM", frequency: 8,
    schematic: [[33.310, 35.560], [33.288, 35.562], [33.2635, 35.5585], [33.245, 35.553]] },
  { id: "route-3", label: "ציר מזרחי", threat: "LOW", frequency: 3,
    schematic: [[33.315, 35.605], [33.295, 35.598], [33.272, 35.592], [33.252, 35.596]] },
];

export const INFILTRATION_ROUTES: InfiltrationRoute[] = SCHEMATIC_ROUTES.map((r, i) => ({
  ...r,
  raw: jitterTrace(r.schematic, 1000 + i * 77),
}));

// ── מערכות הגנה אוגדתיות ──────────────────────────────────────────────
export type DivisionSystemType = "RADAR" | "EW_JAMMER" | "INTERCEPTOR" | "EO_TOWER" | "C2_NODE";

export interface DivisionDefenseSystem {
  id: string;
  name: string;
  type: DivisionSystemType;
  position: LatLng;
  rangeMeters: number;
  status: "ACTIVE" | "STANDBY" | "OFFLINE";
}

export const DIVISION_SYSTEM_META: Record<DivisionSystemType, { label: string; color: string; glyph: string }> = {
  // glyph = inline SVG path(s) on a 24×24 viewBox, stroke-drawn
  RADAR:       { label: 'מכ"ם גילוי',        color: "#3498db", glyph: '<path d="M4 18a10 10 0 0 1 16 0"/><path d="M8 18a6 6 0 0 1 8 0"/><path d="M12 18 17 8"/><circle cx="12" cy="18" r="1.4" fill="#fff"/>' },
  EW_JAMMER:   { label: 'מערך ל"א / חסימה',  color: "#9b59b6", glyph: '<path d="M13 3 6 13h5l-1 8 8-11h-5z"/>' },
  INTERCEPTOR: { label: "מיירט רחפנים",       color: "#e74c3c", glyph: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>' },
  EO_TOWER:    { label: "עמדת תצפית אופטית",  color: "#16a085", glyph: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>' },
  C2_NODE:     { label: "צומת פו״ש / בק״ל",   color: "#f39c12", glyph: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8M12 8v8"/>' },
};

export const DIVISION_SYSTEMS: DivisionDefenseSystem[] = [
  { id: "div-radar-1", name: 'מכ"ם אוגדתי צפון', type: "RADAR", position: [33.290, 35.548], rangeMeters: 6000, status: "ACTIVE" },
  { id: "div-ew-1", name: 'מערך ל"א אוגדתי', type: "EW_JAMMER", position: [33.281, 35.532], rangeMeters: 3500, status: "ACTIVE" },
  { id: "div-int-1", name: "מיירט רחפנים 1", type: "INTERCEPTOR", position: [33.272, 35.560], rangeMeters: 2000, status: "ACTIVE" },
  { id: "div-int-2", name: "מיירט רחפנים 2", type: "INTERCEPTOR", position: [33.268, 35.520], rangeMeters: 2000, status: "STANDBY" },
  { id: "div-eo-1", name: "תצפית אופטית אוגדתית", type: "EO_TOWER", position: [33.283, 35.585], rangeMeters: 3000, status: "ACTIVE" },
  { id: "div-c2-1", name: 'חמ"ל הגנ"א אוגדתי', type: "C2_NODE", position: [33.240, 35.548], rangeMeters: 0, status: "ACTIVE" },
];

// ── מיקומי מערכות דמה ─────────────────────────────────────────────────
export type DecoyType = "RADAR_DECOY" | "RF_EMITTER" | "FAKE_POSITION" | "THERMAL_DECOY";

export interface DecoySystem {
  id: string;
  name: string;
  type: DecoyType;
  position: LatLng;
  simulates: string; // מה המערכת מדמה
  emissionRadiusMeters: number;
  active: boolean;
}

export const DECOY_META: Record<DecoyType, { label: string; glyph: string }> = {
  RADAR_DECOY:   { label: 'מכ"ם דמה',        glyph: '<path d="M4 18a10 10 0 0 1 16 0"/><path d="M8 18a6 6 0 0 1 8 0"/><circle cx="12" cy="18" r="1.4"/>' },
  RF_EMITTER:    { label: "משדר RF מדמה",    glyph: '<path d="M12 20V10M9 7a4 4 0 0 1 6 0M6 4a8 8 0 0 1 12 0"/>' },
  FAKE_POSITION: { label: "עמדה מדומה",      glyph: '<path d="M3 20 12 5l9 15z"/>' },
  THERMAL_DECOY: { label: "מטרת חום",        glyph: '<path d="M12 3c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-8z"/>' },
};

export const DECOY_SYSTEMS: DecoySystem[] = [
  { id: "decoy-1", name: 'מכ"ם דמה א׳', type: "RADAR_DECOY", position: [33.296, 35.540], simulates: 'מכ"ם אוגדתי', emissionRadiusMeters: 1500, active: true },
  { id: "decoy-2", name: "משדר מדמה ב׳", type: "RF_EMITTER", position: [33.262, 35.540], simulates: "מערך תקשורת יחידתי", emissionRadiusMeters: 1200, active: true },
  { id: "decoy-3", name: "עמדה מדומה ג׳", type: "FAKE_POSITION", position: [33.274, 35.575], simulates: "חפ״ק גדודי", emissionRadiusMeters: 0, active: false },
  { id: "decoy-4", name: "מטרת חום ד׳", type: "THERMAL_DECOY", position: [33.255, 35.575], simulates: "כלי רכב משוריין", emissionRadiusMeters: 0, active: true },
];
