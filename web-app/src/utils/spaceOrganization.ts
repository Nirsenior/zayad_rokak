// ארגון המרחב — RokAk officer-drawn map objects. An object may carry a 1-10 score
// (which drives event-queue priority elsewhere) or no score at all, in which case it is
// a pure annotation and takes no part in prioritization. Color is always free-choice.

export const SPACE_AREA_MIN_SCORE = 1;
export const SPACE_AREA_MAX_SCORE = 10;

export type SpaceAreaShape = "POLYGON" | "RECTANGLE" | "FREEHAND" | "CIRCLE" | "LINE" | "MARKER";

export interface SpaceArea {
  id: string;
  name: string;
  /** null = ללא ציון — excluded from queue prioritization */
  score: number | null;
  color: string;
  shape: SpaceAreaShape;
  /** polygon/rectangle/freehand: vertices · line: path · circle: [center] · marker: [point] */
  points: [number, number][];
  radiusMeters?: number;
  /** Stacking order, PowerPoint-style: higher renders in front. */
  zIndex?: number;
  createdAt?: string;
  createdBy?: string;
}

export function formatCreationDetails(area: SpaceArea): string {
  const who = area.createdBy?.trim();
  if (!area.createdAt) return who ? `נוצר ע"י ${who}` : "";
  const when = new Date(area.createdAt).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return who ? `${who} · ${when}` : when;
}

/** Bottom-to-top draw order. */
export function sortByStackOrder(areas: SpaceArea[]): SpaceArea[] {
  return [...areas].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

export function nextStackIndex(areas: SpaceArea[]): number {
  return areas.reduce((max, a) => Math.max(max, a.zIndex ?? 0), 0) + 1;
}

/** Every object whose shape covers this coordinate, front-most first. */
export function areasAtPoint(areas: SpaceArea[], lat: number, lng: number): SpaceArea[] {
  return sortByStackOrder(areas.filter((a) => areaContainsPoint(a, lat, lng))).reverse();
}

export const SPACE_AREA_COLOR_PALETTE: string[] = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export const DEFAULT_SPACE_AREA_COLOR = SPACE_AREA_COLOR_PALETTE[5]; // blue

/** Shapes that enclose ground, and can therefore contain a track. */
export function isEnclosingShape(shape: SpaceAreaShape): boolean {
  return shape === "POLYGON" || shape === "RECTANGLE" || shape === "FREEHAND" || shape === "CIRCLE";
}

/** Shapes whose outline is edited by dragging numbered vertex handles. */
export function isVertexEditableShape(shape: SpaceAreaShape): boolean {
  return shape === "POLYGON" || shape === "RECTANGLE" || shape === "FREEHAND" || shape === "LINE";
}

export const SPACE_AREA_SHAPE_LABELS: Record<SpaceAreaShape, string> = {
  POLYGON: "פוליגון",
  RECTANGLE: "מלבן",
  FREEHAND: "יד חופשית",
  CIRCLE: "עיגול",
  LINE: "קו",
  MARKER: "נקודה",
};

/** Axis-aligned rectangle corners from two opposite corners. */
export function rectangleCorners(a: [number, number], b: [number, number]): [number, number][] {
  return [
    [a[0], a[1]],
    [a[0], b[1]],
    [b[0], b[1]],
    [b[0], a[1]],
  ];
}

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceMeters(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function pathLengthMeters(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceMeters(points[i - 1], points[i]);
  }
  return total;
}

// Equirectangular projection around the first vertex + shoelace. Accurate enough at
// tactical scale (a few km), and avoids pulling in a geodesy dependency.
export function polygonAreaSqMeters(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const lat0 = toRad(points[0][0]);
  const projected = points.map(([lat, lng]) => [
    EARTH_RADIUS_M * toRad(lng) * Math.cos(lat0),
    EARTH_RADIUS_M * toRad(lat),
  ]);
  let sum = 0;
  for (let i = 0; i < projected.length; i++) {
    const [x1, y1] = projected[i];
    const [x2, y2] = projected[(i + 1) % projected.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} ק"מ`
    : `${Math.round(meters)} מ'`;
}

export function formatArea(sqMeters: number): string {
  return sqMeters >= 1_000_000
    ? `${(sqMeters / 1_000_000).toFixed(2)} קמ"ר`
    : `${Math.round(sqMeters).toLocaleString("he-IL")} מ"ר`;
}

/** Does this object enclose the given coordinate? Non-enclosing shapes never do. */
export function areaContainsPoint(area: SpaceArea, lat: number, lng: number): boolean {
  if (area.shape === "CIRCLE") {
    if (area.points.length === 0 || area.radiusMeters === undefined) return false;
    return distanceMeters(area.points[0], [lat, lng]) <= area.radiusMeters;
  }
  if (!isEnclosingShape(area.shape)) return false;
  if (area.points.length < 3) return false;

  // Ray casting
  let inside = false;
  for (let i = 0, j = area.points.length - 1; i < area.points.length; j = i++) {
    const [yi, xi] = area.points[i];
    const [yj, xj] = area.points[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Red (low score) -> yellow -> green (high score) — used only for the small score badge,
// kept independent of the object's own (freely chosen) color.
export function scoreToColor(score: number): string {
  const clamped = Math.min(SPACE_AREA_MAX_SCORE, Math.max(SPACE_AREA_MIN_SCORE, score));
  const ratio = (clamped - SPACE_AREA_MIN_SCORE) / (SPACE_AREA_MAX_SCORE - SPACE_AREA_MIN_SCORE);
  const hue = ratio * 120; // 0 = red, 60 = yellow, 120 = green
  return `hsl(${hue}, 72%, 45%)`;
}

export function getSpaceAreaCenter(points: [number, number][]): [number, number] {
  const lat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  return [lat, lng];
}
