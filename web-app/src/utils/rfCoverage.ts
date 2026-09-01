// RF antenna coverage — simplified geometric estimate, NOT a terrain-aware viewshed.
// No terrain/foliage/multipath modeling, no RX antenna gain, no cable/connector loss.
// Effective range is the smaller of:
//   1) the two-terminal radio horizon (curvature-limited, from antenna + assumed receiver height)
//   2) the Friis free-space-path-loss-derived range (power/gain/frequency limited, against a
//      constant assumed receiver sensitivity threshold)
// These are standard simplified radio-planning estimates, not calibrated to real hardware.

export interface AntennaPreset {
  id: string;
  name: string;
  freqMHz: number;
  powerDbm: number;
  gainDbi: number;
  beamwidthDeg: number; // 360 = omnidirectional
  defaultHeightM: number; // AGL
}

export interface RFAntenna {
  id: string;
  presetId: string;
  name: string;
  coordinates: [number, number];
  freqMHz: number;
  powerDbm: number;
  gainDbi: number;
  beamwidthDeg: number;
  heightM: number;
  azimuthDeg: number; // 0-360, compass bearing, instance-specific (no preset default)
  createdAt?: string;
}

export const ANTENNA_PRESETS: AntennaPreset[] = [
  { id: "OMNI_WHIP", name: "מוט אנכי כל-כיווני", freqMHz: 400, powerDbm: 33, gainDbi: 3, beamwidthDeg: 360, defaultHeightM: 3 },
  { id: "YAGI_DIRECTIONAL", name: "יאגי כיוונית", freqMHz: 900, powerDbm: 30, gainDbi: 12, beamwidthDeg: 40, defaultHeightM: 5 },
  { id: "SECTOR_PANEL", name: "פאנל סקטור", freqMHz: 2400, powerDbm: 27, gainDbi: 15, beamwidthDeg: 90, defaultHeightM: 8 },
  { id: "PARABOLIC_DISH", name: "צלחת פרבולית (קישור נ.-נ.)", freqMHz: 5800, powerDbm: 20, gainDbi: 30, beamwidthDeg: 6, defaultHeightM: 10 },
];

export function getAntennaPreset(presetId: string): AntennaPreset | undefined {
  return ANTENNA_PRESETS.find((p) => p.id === presetId);
}

const EARTH_RADIUS_KM = 6371;
const ASSUMED_RECEIVER_HEIGHT_M = 2;
const RX_SENSITIVITY_DBM = -90;
const OMNI_BEAMWIDTH_THRESHOLD_DEG = 350;
const MIN_RANGE_M = 50;
const MAX_RANGE_M = 60000;

export function isOmniAntenna(beamwidthDeg: number): boolean {
  return beamwidthDeg >= OMNI_BEAMWIDTH_THRESHOLD_DEG;
}

// Two-terminal radio horizon (curvature-limited line of sight), classic 4/3-earth approximation.
export function computeRadioHorizonKm(heightM: number): number {
  return 3.57 * (Math.sqrt(Math.max(0, heightM)) + Math.sqrt(ASSUMED_RECEIVER_HEIGHT_M));
}

// Friis free-space path loss, solved for max distance given EIRP and an assumed RX sensitivity.
export function computeFsplMaxRangeKm(freqMHz: number, powerDbm: number, gainDbi: number): number {
  const eirpDbm = powerDbm + gainDbi;
  const maxFsplDb = eirpDbm - RX_SENSITIVITY_DBM;
  const exponent = (maxFsplDb - 20 * Math.log10(freqMHz) - 32.44) / 20;
  return Math.pow(10, exponent);
}

export function computeEffectiveRangeMeters(antenna: Pick<RFAntenna, "heightM" | "freqMHz" | "powerDbm" | "gainDbi">): number {
  const horizonKm = computeRadioHorizonKm(antenna.heightM);
  const fsplKm = computeFsplMaxRangeKm(antenna.freqMHz, antenna.powerDbm, antenna.gainDbi);
  const rangeM = Math.min(horizonKm, fsplKm) * 1000;
  return Math.min(MAX_RANGE_M, Math.max(MIN_RANGE_M, rangeM));
}

// Standard spherical "destination point given start, bearing, distance" formula.
export function destinationPoint(origin: [number, number], bearingDeg: number, distanceMeters: number): [number, number] {
  const [lat, lng] = origin;
  const angularDistance = distanceMeters / 1000 / EARTH_RADIUS_KM;
  const bearingRad = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) + Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

// Builds a pie-slice polygon: center + an arc of points spanning the beamwidth at the given range.
// Leaflet's <Polygon> auto-closes back to the first point, so the center only needs to appear once.
export function buildSectorPolygon(
  center: [number, number],
  azimuthDeg: number,
  beamwidthDeg: number,
  rangeMeters: number,
  angularStepDeg = 4
): [number, number][] {
  const halfBeam = beamwidthDeg / 2;
  const startBearing = azimuthDeg - halfBeam;
  const endBearing = azimuthDeg + halfBeam;

  const points: [number, number][] = [center];
  for (let b = startBearing; b < endBearing; b += angularStepDeg) {
    points.push(destinationPoint(center, b, rangeMeters));
  }
  points.push(destinationPoint(center, endBearing, rangeMeters));
  return points;
}

// Derived, not stored/synced: every client computes the same answer from already-synced fields,
// since the preset catalog is static code identical on every client.
export function computeIsEdited(antenna: RFAntenna, preset: AntennaPreset | undefined): boolean {
  if (!preset) return false;
  return (
    antenna.freqMHz !== preset.freqMHz ||
    antenna.powerDbm !== preset.powerDbm ||
    antenna.gainDbi !== preset.gainDbi ||
    antenna.beamwidthDeg !== preset.beamwidthDeg ||
    antenna.heightM !== preset.defaultHeightM
  );
}
