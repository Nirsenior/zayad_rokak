import type { UnitId } from "../types/session";

// Mock data layer for the "תמונת מצב אויב" (enemy activity heatmap) feature.
// No live backend exists yet — every field here mirrors database/schema.sql
// (sensor_detections + identification_events) as closely as possible, so
// swapping this file for a real API response later is a straight substitution.
//
// Two real-schema gaps had to be bridged for the mock, both flagged inline:
//   1. sensor_detections.coordinate is a PostGIS GEOMETRY(PointZ,4326) — flattened
//      here to plain lat/lng/alt numbers for simplicity.
//   2. Neither sensor_detections nor identification_events has a unit_id column,
//      and there's no sensors-ownership table to join through. `unit_id` below is
//      a MOCK-ONLY convenience field (confirmed with product owner) so the "AOR"
//      filter has something to filter on client-side. A real implementation needs
//      an actual ownership model (e.g. a sensors table with owner_unit_id).

export type SensorType = "RADAR" | "RF_FINDER" | "OPTICAL" | "EXTERNAL_SYSTEM";

export type IffStatus =
  | "BLUE_CERTAIN"
  | "BLUE_SUSPICIOUS"
  | "BLUE_ANOMALOUS"
  | "UNIDENTIFIED"
  | "RED_SUSPICIOUS"
  | "RED_CERTAIN"
  | "CONFLICTING";

export interface SensorDetection {
  id: string;
  sensor_type: SensorType;
  target_track_id: string;
  lat: number;
  lng: number;
  alt: number;
  timestamp: string; // ISO
  unit_id: UnitId; // mock-only, see file header
}

export interface IdentificationEvent {
  id: string;
  target_track_id: string;
  current_iff_status: IffStatus;
  certainty_level: number;
  created_at: string; // ISO
}

export interface EnrichedDetection extends SensorDetection {
  current_iff_status: IffStatus;
  certainty_level: number;
}

// Deterministic PRNG (mulberry32) so the mock dataset is stable across reloads.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260805);
const SENSOR_TYPES: SensorType[] = ["RADAR", "RF_FINDER", "OPTICAL", "EXTERNAL_SYSTEM"];
const UNIT_IDS: UnitId[] = ["gdud-7020", "hativa-5", "ugda-162"];
const ENEMY_IFF: IffStatus[] = ["RED_SUSPICIOUS", "RED_CERTAIN", "UNIDENTIFIED"];
const OTHER_IFF: IffStatus[] = ["BLUE_CERTAIN", "BLUE_SUSPICIOUS", "CONFLICTING"];

const NOW = Date.now();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomTimestampWithinDays(days: number): number {
  return NOW - rand() * days * 24 * 60 * 60 * 1000;
}

// Dense clusters — these are what should actually "heat up" once binned.
const HOTSPOTS: { lat: number; lng: number; tracks: number; pointsPerTrack: [number, number] }[] = [
  { lat: 33.322, lng: 35.523, tracks: 6, pointsPerTrack: [4, 9] },
  { lat: 33.268, lng: 35.588, tracks: 5, pointsPerTrack: [3, 7] },
  { lat: 33.241, lng: 35.549, tracks: 4, pointsPerTrack: [5, 10] },
  { lat: 33.301, lng: 35.601, tracks: 3, pointsPerTrack: [3, 6] },
];

// Loose scatter of single, unrelated detections — proves a lone point stays cold.
const NOISE_POINT_COUNT = 22;
const AREA_BOUNDS = { latMin: 33.18, latMax: 33.36, lngMin: 35.49, lngMax: 35.64 };

let detectionSeq = 0;
let trackSeq = 0;
const detections: SensorDetection[] = [];
const events: IdentificationEvent[] = [];

function pushDetectionAndEvent(lat: number, lng: number, timestampMs: number, trackId: string) {
  detectionSeq += 1;
  const unit = pick(UNIT_IDS);
  detections.push({
    id: `det-${detectionSeq}`,
    sensor_type: pick(SENSOR_TYPES),
    target_track_id: trackId,
    lat,
    lng,
    alt: 50 + Math.round(rand() * 400),
    timestamp: new Date(timestampMs).toISOString(),
    unit_id: unit,
  });
  // One identification_event per track is enough for mock purposes; later
  // pushes for the same track_id just refresh it (mirrors "latest wins").
  const iff = rand() < 0.82 ? pick(ENEMY_IFF) : pick(OTHER_IFF);
  const existing = events.find((e) => e.target_track_id === trackId);
  if (existing) {
    existing.current_iff_status = iff;
    existing.certainty_level = Math.round((0.4 + rand() * 0.6) * 100) / 100;
    existing.created_at = new Date(timestampMs).toISOString();
  } else {
    events.push({
      id: `ident-${trackId}`,
      target_track_id: trackId,
      current_iff_status: iff,
      certainty_level: Math.round((0.4 + rand() * 0.6) * 100) / 100,
      created_at: new Date(timestampMs).toISOString(),
    });
  }
}

for (const spot of HOTSPOTS) {
  for (let t = 0; t < spot.tracks; t++) {
    trackSeq += 1;
    const trackId = `trk-${trackSeq}`;
    const pointCount = spot.pointsPerTrack[0] + Math.floor(rand() * (spot.pointsPerTrack[1] - spot.pointsPerTrack[0]));
    // A track's points walk slowly through time so timestamp-sorted polylines look like a real path.
    const startMs = randomTimestampWithinDays(30);
    let cursorLat = spot.lat + (rand() - 0.5) * 0.01;
    let cursorLng = spot.lng + (rand() - 0.5) * 0.01;
    for (let p = 0; p < pointCount; p++) {
      cursorLat += (rand() - 0.5) * 0.006;
      cursorLng += (rand() - 0.5) * 0.006;
      const ts = startMs + p * (10 + rand() * 40) * 60 * 1000; // minutes apart
      pushDetectionAndEvent(cursorLat, cursorLng, Math.min(ts, NOW), trackId);
    }
  }
}

for (let i = 0; i < NOISE_POINT_COUNT; i++) {
  trackSeq += 1;
  const trackId = `trk-${trackSeq}`;
  const lat = AREA_BOUNDS.latMin + rand() * (AREA_BOUNDS.latMax - AREA_BOUNDS.latMin);
  const lng = AREA_BOUNDS.lngMin + rand() * (AREA_BOUNDS.lngMax - AREA_BOUNDS.lngMin);
  pushDetectionAndEvent(lat, lng, randomTimestampWithinDays(THIRTY_DAYS_MS / (24 * 60 * 60 * 1000)), trackId);
}

export const MOCK_SENSOR_DETECTIONS: SensorDetection[] = detections;
export const MOCK_IDENTIFICATION_EVENTS: IdentificationEvent[] = events;
export const MOCK_DATA_RANGE_START_MS = NOW - THIRTY_DAYS_MS;
export const MOCK_DATA_RANGE_END_MS = NOW;

export interface EnrichDetectionsFilters {
  unitId: UnitId;
  rangeStartMs: number;
  rangeEndMs: number;
  sensorTypes: Set<SensorType>;
  iffStatuses: Set<IffStatus>;
}

// The client-side stand-in for what a real API would do server-side: join
// detections to their latest identification_event, then filter by unit/range/
// sensor-type/IFF. Swap this function's body for a `fetch()` later — same shape.
export function enrichDetections(
  allDetections: SensorDetection[],
  allEvents: IdentificationEvent[],
  filters: EnrichDetectionsFilters
): EnrichedDetection[] {
  const eventByTrack = new Map(allEvents.map((e) => [e.target_track_id, e]));
  const result: EnrichedDetection[] = [];

  for (const d of allDetections) {
    if (d.unit_id !== filters.unitId) continue;
    const ts = new Date(d.timestamp).getTime();
    if (ts < filters.rangeStartMs || ts > filters.rangeEndMs) continue;
    if (!filters.sensorTypes.has(d.sensor_type)) continue;

    const event = eventByTrack.get(d.target_track_id);
    const iff = event?.current_iff_status ?? "UNIDENTIFIED";
    if (!filters.iffStatuses.has(iff)) continue;

    result.push({
      ...d,
      current_iff_status: iff,
      certainty_level: event?.certainty_level ?? 0.5,
    });
  }

  return result;
}
