// Tables are the source of truth for the defense map layers:
//   external source system → TableDef (flat rows) → DefenseLayers adapters → map.
// The rows below are generated from mock data in ./defenseLayers; replacing `TABLES`
// with an API response of the same shape is all a real feed needs.
import {
  FENCE_SEGMENTS, FENCE_BREACHES, FENCE_STATUS_META, INFILTRATION_ROUTES,
  DIVISION_SYSTEMS, DIVISION_SYSTEM_META, DECOY_SYSTEMS, DECOY_META,
} from "./defenseLayers";

export type Cell = string | number;
export type Row = Record<string, Cell>;

export type MapLayerKey = "fences" | "rawRoutes" | "schematicRoutes" | "divisionSystems" | "decoys";
export type TableKind = "GEO" | "EQUIPMENT" | "OPS";

/** Feeding system for every table and defense layer right now. */
export const DATA_SOURCE = "zen";

export interface TableSource {
  system: string;   // feeding system
  syncedAt: string; // HH:mm of last sync
}

export interface TableDef {
  id: string;
  number: number;
  title: string;
  kind: TableKind;
  tags: string[];
  description?: string;
  owner: string;
  comments: number;
  source: TableSource;
  /** the map layer this table feeds */
  layer: MapLayerKey;
  columns: { key: string; label: string }[];
  rows: Row[];
}

export const LAYER_LABELS: Record<MapLayerKey, string> = {
  fences: "גדרות (חותכים)",
  rawRoutes: "נתיבי חדירה — גולמי",
  schematicRoutes: "נתיבי חדירה — סכמטי",
  divisionSystems: "מערכות הגנה אוגדתיות",
  decoys: "מערכות דמה",
};

const r5 = (n: number) => Number(n.toFixed(5));
const THREAT_LABEL = { HIGH: "גבוהה", MEDIUM: "בינונית", LOW: "נמוכה" } as const;
const STATUS_LABEL = { ACTIVE: "פעיל", STANDBY: "המתנה", OFFLINE: "מושבת" } as const;

export const REVERSE = {
  fenceStatus: Object.fromEntries(Object.entries(FENCE_STATUS_META).map(([k, v]) => [v.label, k])),
  threat: Object.fromEntries(Object.entries(THREAT_LABEL).map(([k, v]) => [v, k])),
  status: Object.fromEntries(Object.entries(STATUS_LABEL).map(([k, v]) => [v, k])),
  divisionType: Object.fromEntries(Object.entries(DIVISION_SYSTEM_META).map(([k, v]) => [v.label, k])),
  decoyType: Object.fromEntries(Object.entries(DECOY_META).map(([k, v]) => [v.label, k])),
};

export const TABLES: TableDef[] = [
  {
    id: "t-3406", number: 3406, title: "נתיבי חדירה גולמי מבא", kind: "GEO", layer: "rawRoutes",
    tags: ["אחר"], description: "נקודות גילוי גולמיות לפי ציר חדירה", owner: "תמר בן ארוש", comments: 118,
    source: { system: DATA_SOURCE, syncedAt: "08:41" },
    columns: [
      { key: "route", label: "ציר" }, { key: "seq", label: "#" },
      { key: "lat", label: "קו רוחב" }, { key: "lng", label: "קו אורך" },
      { key: "threat", label: "רמת איום" },
    ],
    rows: INFILTRATION_ROUTES.flatMap((r) =>
      r.raw.map((p, i) => ({ route: r.label, seq: i + 1, lat: r5(p[0]), lng: r5(p[1]), threat: THREAT_LABEL[r.threat] })),
    ),
  },
  {
    id: "t-3330", number: 3330, title: "גדרות חותכות סיב-מיקומים", kind: "GEO", layer: "fences",
    tags: ["אחר"], description: "קטעי גדר הגבול ונקודות חיתוך", owner: "זיו ששון", comments: 63,
    source: { system: DATA_SOURCE, syncedAt: "08:39" },
    columns: [
      { key: "segment", label: "קטע גדר" }, { key: "seq", label: "#" },
      { key: "lat", label: "קו רוחב" }, { key: "lng", label: "קו אורך" },
      { key: "segmentStatus", label: "סטטוס קטע" }, { key: "breach", label: "נקודת חיתוך" },
      { key: "detectedAt", label: "שעת גילוי" }, { key: "note", label: "הערה" },
    ],
    rows: [
      ...FENCE_SEGMENTS.flatMap((f) =>
        f.points.map((p, i) => ({
          segment: f.name, seq: i + 1, lat: p[0], lng: p[1],
          segmentStatus: FENCE_STATUS_META[f.status].label, breach: "לא", detectedAt: "", note: "",
        })),
      ),
      ...FENCE_BREACHES.map((b) => {
        const f = FENCE_SEGMENTS.find((x) => x.id === b.fenceId)!;
        return {
          segment: f.name, seq: 0, lat: b.position[0], lng: b.position[1],
          segmentStatus: FENCE_STATUS_META[b.status].label, breach: "כן", detectedAt: b.detectedAt, note: b.note,
        };
      }),
    ],
  },
  {
    id: "t-3329", number: 3329, title: "נתיבי חדירה-סכמטיים", kind: "OPS", layer: "schematicRoutes",
    tags: ["אחר"], owner: "זיו ששון", comments: 11,
    source: { system: DATA_SOURCE, syncedAt: "08:41" },
    columns: [
      { key: "route", label: "ציר" }, { key: "seq", label: "#" },
      { key: "lat", label: "קו רוחב" }, { key: "lng", label: "קו אורך" },
      { key: "freq", label: "חדירות (30 יום)" }, { key: "threat", label: "רמת איום" },
    ],
    rows: INFILTRATION_ROUTES.flatMap((r) =>
      r.schematic.map((p, i) => ({
        route: r.label, seq: i + 1, lat: p[0], lng: p[1], freq: r.frequency, threat: THREAT_LABEL[r.threat],
      })),
    ),
  },
  {
    id: "t-3323", number: 3323, title: "מערכות רוקק - אוגדה 91", kind: "EQUIPMENT", layer: "divisionSystems",
    tags: ['אג"ם', "לבנון"], description: "מערכות ההגנה מרוקק הפרוסות בשטח האוגדה", owner: "סלה סלומון", comments: 16,
    source: { system: DATA_SOURCE, syncedAt: "08:30" },
    columns: [
      { key: "name", label: "שם" }, { key: "type", label: "סוג" }, { key: "status", label: "סטטוס" },
      { key: "range", label: "טווח (מ׳)" }, { key: "lat", label: "קו רוחב" }, { key: "lng", label: "קו אורך" },
    ],
    rows: DIVISION_SYSTEMS.map((s) => ({
      name: s.name, type: DIVISION_SYSTEM_META[s.type].label, status: STATUS_LABEL[s.status],
      range: s.rangeMeters, lat: s.position[0], lng: s.position[1],
    })),
  },
  {
    id: "t-3268", number: 3268, title: "מיקומי דמה", kind: "EQUIPMENT", layer: "decoys",
    tags: ['אג"ם', "לבנון"], description: "ביטחון מידע הנאה", owner: "זיו ששון", comments: 129,
    source: { system: DATA_SOURCE, syncedAt: "07:55" },
    columns: [
      { key: "name", label: "שם" }, { key: "type", label: "סוג" }, { key: "sim", label: "מדמה" },
      { key: "active", label: "פעיל" }, { key: "radius", label: "רדיוס פליטה (מ׳)" },
      { key: "lat", label: "קו רוחב" }, { key: "lng", label: "קו אורך" },
    ],
    rows: DECOY_SYSTEMS.map((d) => ({
      name: d.name, type: DECOY_META[d.type].label, sim: d.simulates,
      active: d.active ? "כן" : "לא", radius: d.emissionRadiusMeters, lat: d.position[0], lng: d.position[1],
    })),
  },
];

export const tableForLayer = (layer: MapLayerKey, tables: TableDef[] = TABLES) =>
  tables.find((t) => t.layer === layer);
