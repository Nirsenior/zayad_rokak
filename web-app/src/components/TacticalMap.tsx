import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Circle, Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { AlertOctagon, MapPin, Plane, Radio, X, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Activity, Wifi, Clock, Gauge, Cpu, Flame, Route, Layers, Crosshair } from "lucide-react";
import { GanttChartPanel } from "./GanttChartPanel";
import {
  ANTENNA_PRESETS,
  getAntennaPreset,
  computeEffectiveRangeMeters,
  computeIsEdited,
  isOmniAntenna,
  buildSectorPolygon,
  type RFAntenna,
} from "../utils/rfCoverage";
import {
  MOCK_SENSOR_DETECTIONS,
  MOCK_IDENTIFICATION_EVENTS,
  MOCK_DATA_RANGE_START_MS,
  MOCK_DATA_RANGE_END_MS,
  enrichDetections,
  type SensorType,
  type IffStatus,
  type EnrichedDetection,
} from "../data/mockEnemyDetections";
import { useAppSession } from "../context/AppSessionContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

// datetime-local inputs use "YYYY-MM-DDTHH:mm" in the browser's local timezone.
const msToDatetimeLocalValue = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const datetimeLocalValueToMs = (value: string): number | null => {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};
const enemyTrackColor = (status: IffStatus): string => {
  switch (status) {
    case "RED_CERTAIN": return "#dc2626";
    case "RED_SUSPICIOUS": return "#f97316";
    case "UNIDENTIFIED": return "#eab308";
    case "CONFLICTING": return "#a855f7";
    default: return "#94a3b8";
  }
};

const isPointInPolygon = (point: [number, number], polygon: [number, number][]) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

interface FlightRequest {
  id: string;
  operatorName: string;
  unit: string;
  droneModel: string;
  frequencies: number[];
  timeWindow: string;
  classification: "GREEN" | "ORANGE" | "RED";
  minAlt: number;
  maxAlt: number;
  conflicts: { type: string; description: string }[];
  notes: string;
  status: "PENDING_REVIEW" | "APPROVED" | "ACTIVE" | "REJECTED" | "EXPIRED" | "COMPLETED" | "CONFLICT";
  reviewerNotes?: string;
  isArmed?: boolean;
  operatorLocation?: { lat: number; lng: number };
  polygonType?: "PREDEFINED" | "CUSTOM";
  polygonName?: string;
  operatorNotes?: string;
  customPolygonPoints?: [number, number][];
}

const classificationConfig = {
  GREEN: {
    bg: "var(--green-3)",
    border: "var(--green-6)",
    text: "var(--green-11)",
    badgeBg: "var(--green-9)",
    badgeText: "var(--neutral-1)",
    accent: "var(--green-9)",
    label: "ירוק",
  },
  ORANGE: {
    bg: "var(--yellow-3)",
    border: "var(--yellow-6)",
    text: "var(--yellow-11)",
    badgeBg: "var(--yellow-9)",
    badgeText: "var(--neutral-1)",
    accent: "var(--yellow-9)",
    label: "כתום",
  },
  RED: {
    bg: "var(--red-3)",
    border: "var(--red-6)",
    text: "var(--red-9)",
    badgeBg: "var(--red-8)",
    badgeText: "var(--neutral-white)",
    accent: "var(--red-8)",
    label: "אדום",
  },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_REVIEW: { label: "ממתין לאישור", color: "var(--yellow-9)", bg: "var(--yellow-3)" },
  APPROVED: { label: "מאושר", color: "var(--blue-11)", bg: "var(--blue-3)" },
  ACTIVE: { label: "פעיל", color: "var(--green-11)", bg: "var(--green-3)" },
  REJECTED: { label: "נדחה", color: "var(--red-9)", bg: "var(--red-3)" },
  EXPIRED: { label: "פג תוקף", color: "var(--neutral-9)", bg: "var(--neutral-3)" },
  COMPLETED: { label: "הושלם", color: "var(--neutral-11)", bg: "var(--neutral-4)" },
  CONFLICT: { label: "קונפליקט", color: "var(--orange-9)", bg: "#3c1e10" },
};

const getRequestGeometry = (req: FlightRequest): [number, number][] => {
  if (req.polygonType === "CUSTOM" && req.customPolygonPoints && req.customPolygonPoints.length > 0) {
    return req.customPolygonPoints;
  }
  return req.polygonName === "מסדרון גדס''ר"
    ? [[33.226, 35.560], [33.238, 35.560], [33.238, 35.572], [33.226, 35.572]]
    : req.polygonName === "מרחב סיוע 4"
    ? [[33.250, 35.570], [33.270, 35.570], [33.270, 35.585], [33.250, 35.585]]
    : [[33.215, 35.562], [33.238, 35.562], [33.238, 35.568], [33.215, 35.568]];
};

const getPolygonCenter = (positions: [number, number][]): [number, number] => {
  let latSum = 0;
  let lngSum = 0;
  positions.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  return [latSum / positions.length, lngSum / positions.length];
};


// Interfaces
interface Coordinates {
  lat: number;
  lng: number;
  altMsl: number;
}

export interface DetectingSensor {
  id: string;
  name: string;
  type: "RADAR" | "RF" | "ACOUSTIC" | "OPTICAL";
  signalStrength: number;
  detectionMethod: string;
  lastPing?: string;
}

export interface Track {
  id: string;
  type: string;
  iffStatus: "BLUE_CERTAIN" | "BLUE_SUSPICIOUS" | "BLUE_ANOMALOUS" | "UNIDENTIFIED" | "RED_SUSPICIOUS" | "RED_CERTAIN" | "CONFLICTING";
  coordinates: Coordinates;
  speedKts: number;
  heading: number;
  history?: [number, number][];
  protocol?: string;
  startTime?: string;
  lastUpdateSeconds?: number;
  lastUpdateTimestamp?: string;
  altHistory?: { timestamp: string; alt: number }[];
  detectingSensors?: DetectingSensor[];
}

interface Zone {
  id: string;
  name: string;
  type: "CORRIDOR" | "NFZ" | "RESTRICTED";
  geometry: [number, number][];
  floor: number;
  ceiling: number;
  color: string;
}

interface TacticalSensor {
  id: string;
  name: string;
  type: "RADAR" | "RF" | "ACOUSTIC" | "OPTICAL";
  coordinates: [number, number];
  color: string;
  rangeMeters?: number;
  status: "ACTIVE" | "MAINTENANCE";
}

// Helpers & Altitude Chart Component
const getIFFHebrewDetails = (status: Track["iffStatus"]) => {
  switch (status) {
    case "BLUE_CERTAIN":
      return { text: "כוחותינו (וודאי)", bg: "#186eff", color: "#ffffff" };
    case "BLUE_SUSPICIOUS":
      return { text: "כוחותינו (חשוד)", bg: "#2980b9", color: "#ffffff" };
    case "BLUE_ANOMALOUS":
      return { text: "כוחותינו (אנומליה בגובה)", bg: "#f39c12", color: "#ffffff" };
    case "RED_CERTAIN":
      return { text: "כלי עוין (וודאי)", bg: "#c0392b", color: "#ffffff" };
    case "RED_SUSPICIOUS":
      return { text: "חשד לכלי עוין", bg: "#e74c3c", color: "#ffffff" };
    case "CONFLICTING":
      return { text: "סתירה בנתוני IFF", bg: "#8e44ad", color: "#ffffff" };
    case "UNIDENTIFIED":
    default:
      return { text: "מטרה לא מזוהה", bg: "#d35400", color: "#ffffff" };
  }
};

const getDetectingSensorsForTrack = (track: Track, sensorsList: TacticalSensor[]): DetectingSensor[] => {
  if (track.detectingSensors && track.detectingSensors.length > 0) {
    return track.detectingSensors;
  }
  const nearby = sensorsList.filter(s =>
    Math.abs(s.coordinates[0] - track.coordinates.lat) < 0.12 &&
    Math.abs(s.coordinates[1] - track.coordinates.lng) < 0.12
  );

  if (nearby.length > 0) {
    return nearby.map((s, idx) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      signalStrength: Math.min(99, Math.max(72, 96 - idx * 6)),
      detectionMethod: s.type === "RADAR" ? "גילוי מכ''ם טקטי 3D" : s.type === "RF" ? "פענוח RF ותדר שידור" : "ניטור אופטרוניקה IR",
      lastPing: "לפני 1 שניות"
    }));
  }

  return [
    {
      id: "sensor-radar-main",
      name: "מכ''ם גילוי טקטי (מטולה)",
      type: "RADAR",
      signalStrength: 95,
      detectionMethod: "גילוי פאלסי 3D בתדר X",
      lastPing: "לפני 1 שניות"
    },
    {
      id: "sensor-rf-main",
      name: "מקלט RF מרחבי רכס",
      type: "RF",
      signalStrength: 89,
      detectionMethod: "פענוח פרוטוקול OcuSync / MAVLink",
      lastPing: "לפני 1 שניות"
    }
  ];
};

const AltitudeGraph: React.FC<{
  altHistory?: { timestamp: string; alt: number }[];
  currentAlt: number;
}> = ({ altHistory = [], currentAlt }) => {
  const data = altHistory.length > 0 ? altHistory : [{ timestamp: "עכשיו", alt: currentAlt }];
  const alts = data.map((d) => d.alt);
  const minAlt = Math.min(...alts);
  const maxAlt = Math.max(...alts);
  const padding = 12;
  const width = 296;
  const height = 80;

  const range = Math.max(8, maxAlt - minAlt);
  const altMinBound = Math.max(0, Math.floor(minAlt - range * 0.2));
  const altMaxBound = Math.ceil(maxAlt + range * 0.2);
  const boundsRange = Math.max(1, altMaxBound - altMinBound);

  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((d.alt - altMinBound) / boundsRange) * (height - 2 * padding);
    return { x, y, alt: d.alt, time: d.timestamp };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : "";

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const deltaAlt = lastPoint && firstPoint ? lastPoint.alt - firstPoint.alt : 0;

  return (
    <div style={{
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      borderRadius: "6px",
      padding: "8px 10px",
      border: "1px solid rgba(56, 189, 248, 0.2)",
      margin: "8px 0",
      direction: "rtl",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
          <Activity size={13} color="#38bdf8" /> גרף שינוי גובה (בזמן אמת)
        </span>
        <span style={{
          fontSize: "10px",
          fontWeight: "bold",
          padding: "2px 6px",
          borderRadius: "4px",
          backgroundColor: deltaAlt > 0 ? "rgba(34,197,94,0.18)" : deltaAlt < 0 ? "rgba(239,68,68,0.18)" : "rgba(148,163,184,0.18)",
          color: deltaAlt > 0 ? "#4ade80" : deltaAlt < 0 ? "#f87171" : "#cbd5e1"
        }}>
          {deltaAlt > 0 ? `▲ +${deltaAlt} מ'` : deltaAlt < 0 ? `▼ ${deltaAlt} מ'` : "━ יציב"}
        </span>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.12)" />

        {/* Axis labels */}
        <text x={width - 4} y={padding + 3} fill="#64748b" fontSize="8" textAnchor="end">{altMaxBound}מ'</text>
        <text x={width - 4} y={height - padding - 2} fill="#64748b" fontSize="8" textAnchor="end">{altMinBound}מ'</text>

        {/* Area fill */}
        <path d={areaD} fill="url(#altGrad)" />

        {/* Path line */}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Active point indicator */}
        {lastPoint && (
          <g>
            <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill="#0284c7" fillOpacity="0.5" />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="#38bdf8" />
          </g>
        )}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
        <span>30 שניות אחרונות</span>
        <span style={{ color: "#38bdf8", fontWeight: "bold" }}>נוכחי: {currentAlt} מ' MSL</span>
      </div>
    </div>
  );
};

interface TacticalMapProps {
  onTriggerAlert: (msg: string, metadata?: { alertType?: string; threatLocation?: { lat: number; lng: number } }) => void;
  liveTracks?: Track[];
  approvedCorridors?: any[];
  flights?: any[];
  requests?: FlightRequest[];
  onReviewRequest?: (id: string, action: "APPROVED" | "REJECTED" | "CONFLICT" | "REMOVE", notes: string) => void;
  showRequestsQueue?: boolean;
  onRemoveLiveTrack?: (id: string) => void;
  showGantt?: boolean;
  onGanttToggle?: () => void;
  onCreateRequest?: (newReq: FlightRequest) => void;
  onUpdateRequestCoordinates?: (id: string, points: [number, number][]) => void;
  antennas?: RFAntenna[];
  onUpsertAntenna?: (antenna: RFAntenna) => void;
  onRemoveAntenna?: (id: string) => void;
}

// Custom DivIcon creator for Drones/Tracks
const createTrackIcon = (track: any, color: string) => {
  const heading = track.heading ?? 0;
  const id = track.id ?? "UNKNOWN";
  
  // Decide frame SVG path based on classified color
  let frameSvg = "";
  let frameClass = "";
  if (color === "#b54548") {
    // Red Diamond for enemy/hostile forces
    frameSvg = `<polygon points="16,2 30,16 16,30 2,16" stroke="${color}" stroke-width="2" fill="${color}" fill-opacity="0.15" />`;
    frameClass = "hostile-marker";
  } else if (color === "#186eff") {
    // Blue - no outer frame for friendly forces
    frameSvg = "";
    frameClass = "friendly-marker";
  } else {
    // Yellow Square/Dashed for unidentified targets
    frameSvg = `<rect x="3" y="3" width="26" height="26" rx="4" stroke="${color}" stroke-width="2" fill="${color}" fill-opacity="0.15" stroke-dasharray="3,3" />`;
    frameClass = "";
  }

  // Inside the frame, draw a clean quadcopter drone icon
  const droneSvg = `
    <!-- Quadcopter arms -->
    <path d="M9 9l14 14M9 23l14-14" stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
    <!-- Rotor guards -->
    <circle cx="8" cy="8" r="2.5" stroke="${color}" stroke-width="1" />
    <circle cx="24" cy="8" r="2.5" stroke="${color}" stroke-width="1" />
    <circle cx="8" cy="24" r="2.5" stroke="${color}" stroke-width="1" />
    <circle cx="24" cy="24" r="2.5" stroke="${color}" stroke-width="1" />
    <!-- Center hub -->
    <circle cx="16" cy="16" r="3.5" fill="#1b1b21" stroke="${color}" stroke-width="2" />
  `;

  // Draw heading indicator arrow
  const headingSvg = `
    <line x1="16" y1="16" x2="16" y2="-4" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M12 -1 L16 -5 L20 -1" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  `;

  return L.divIcon({
    className: "tactical-track-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div class="${frameClass}" style="
          width: 32px; 
          height: 32px; 
          position: relative;
        ">
          <!-- Non-rotating frame -->
          <svg width="32" height="32" viewBox="0 0 32 32" style="position: absolute; top:0; left:0;">
            ${frameSvg}
          </svg>
          <!-- Rotating heading indicator & drone -->
          <div style="
            transform: rotate(${heading}deg); 
            transform-origin: center;
            width: 32px; 
            height: 32px; 
            position: absolute; 
            top: 0; 
            left: 0;
          ">
            <svg width="32" height="32" viewBox="0 0 32 32" style="overflow: visible;">
              ${droneSvg}
              ${headingSvg}
            </svg>
          </div>
        </div>
        ${color === "#186eff" ? `
        <span style="
          margin-top: 4px;
          font-size: 8px;
          font-weight: bold;
          color: #fff;
          background-color: rgba(0,0,0,0.85);
          padding: 1px 3.5px;
          border-radius: 2px;
          border: 1px solid ${color};
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.6);
        ">${id.split(" - ")[0]}</span>
        ` : ""}
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 16],
  });
};

// Custom DivIcons for different sensor types
const createSensorIcon = (type: TacticalSensor["type"], color: string, name: string) => {
  let svgContent = "";
  switch (type) {
    case "RADAR":
      svgContent = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5" stroke-opacity="0.3"/>
          <circle cx="12" cy="12" r="6" stroke="white" stroke-width="1.5" stroke-opacity="0.5"/>
          <circle cx="12" cy="12" r="2" fill="white"/>
          <g class="radar-sweep">
            <line x1="12" y1="12" x2="12" y2="2" stroke="white" stroke-width="2"/>
          </g>
        </svg>
      `;
      break;
    case "RF":
      svgContent = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 18v-8M9 6a4 4 0 0 1 6 0" class="rf-wave-1"/>
          <path d="M6 3a8 8 0 0 1 12 0" class="rf-wave-2"/>
          <path d="M8 22l4-12 4 12" stroke="white" stroke-width="2"/>
          <line x1="9.5" y1="17" x2="14.5" y2="17" stroke="white"/>
        </svg>
      `;
      break;
    case "ACOUSTIC":
      svgContent = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="3" width="6" height="10" rx="3" fill="white" fill-opacity="0.2"/>
          <path d="M5 10a7 7 0 0 0 14 0"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          <circle cx="12" cy="8" r="8" stroke="white" stroke-width="1" stroke-dasharray="2,2" class="acoustic-ripple"/>
        </svg>
      `;
      break;
    case "OPTICAL":
      svgContent = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4" fill="white" fill-opacity="0.2"/>
          <circle cx="12" cy="13" r="1.5" fill="white"/>
          <path d="M12 7v2M12 17v2M6 13h2M16 13h2" stroke="white" stroke-width="1.5" class="optical-crosshair"/>
        </svg>
      `;
      break;
  }

  return L.divIcon({
    className: "tactical-sensor-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background-color: ${color}; 
          border: 1.5px solid #fff; 
          width: 24px; 
          height: 24px; 
          border-radius: 6px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        ">
          ${svgContent}
        </div>
        <span style="
          margin-top: 3px;
          font-size: 8px;
          font-weight: bold;
          color: #fff;
          background-color: rgba(0,0,0,0.85);
          padding: 1px 3px;
          border-radius: 2px;
          border: 1px solid ${color};
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.6);
        ">${name.split(" (")[0]}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 12],
  });
};

const ANTENNA_MARKER_COLOR = "#f59e0b";

const createAntennaIcon = (antenna: RFAntenna) => {
  const preset = getAntennaPreset(antenna.presetId);
  const edited = computeIsEdited(antenna, preset);
  return L.divIcon({
    className: "tactical-antenna-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background-color: ${ANTENNA_MARKER_COLOR};
          border: 1.5px solid #fff;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          position: relative;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20V10M9 7a4 4 0 0 1 6 0M6 4a8 8 0 0 1 12 0"/>
            <circle cx="12" cy="20" r="1.5" fill="white"/>
          </svg>
          ${edited ? `<div style="position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%; background-color: #e74c3c; border: 1.5px solid #fff;"></div>` : ""}
        </div>
        <span style="
          margin-top: 3px;
          font-size: 8px;
          font-weight: bold;
          color: #fff;
          background-color: rgba(0,0,0,0.85);
          padding: 1px 3px;
          border-radius: 2px;
          border: 1px solid ${ANTENNA_MARKER_COLOR};
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.6);
        ">${antenna.name}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 12],
  });
};

const PRESETS = {
  TAIBE_BEAUFORT: {
    name: "תרחיש אטייבה + בופור (לבנון)",
    groundForces: [
      { id: "מחלקת חיר 1", coordinates: [33.268, 35.524] as [number, number] },
      { id: "כוח שריון ג", coordinates: [33.272, 35.528] as [number, number] },
      { id: "חפ''ק מפקד", coordinates: [33.264, 35.520] as [number, number] },
    ],
    tracks: [
      { id: "ינשוף 1 - רחפן תצפית", lat: 33.322, lng: 35.532 },
      { id: "זיק 4 - רחפן אספקה", lat: 33.332, lng: 35.545 },
      { id: "צוות סיור 3 - כלי 1", lat: 33.269, lng: 35.522 },
      { id: "צוות סיור 3 - כלי 2", lat: 33.266, lng: 35.528 },
      { id: "ינשוף 3 - רחפן תצפית", lat: 33.326, lng: 35.530 },
      { id: "ינשוף 5 - סורק אופטי", lat: 33.262, lng: 35.520 },
      { id: "שועל 1 - משימת סריקה", lat: 33.328, lng: 35.534 },
      { id: "שועל 2 - משימת סריקה", lat: 33.335, lng: 35.550 },
      { id: "אבטחה 9 - רחפן קישור", lat: 33.338, lng: 35.555 },
      { id: "אספקה 12 - כלי כבד", lat: 33.340, lng: 35.560 },
      { id: "כפר גלעדי - מטרה חשודה", lat: 33.324, lng: 35.536 },
      { id: "חדירת גבול - רחפן עוין", lat: 33.330, lng: 35.540 },
    ],
    mapCenter: [33.295, 35.535] as [number, number],
    mapZoom: 12,
  },
  DEFAULT_METULA: {
    name: "תרחיש כפר גלעדי + מטולה (ברירת מחדל)",
    groundForces: [
      { id: "מחלקת חיר 1", coordinates: [33.230, 35.550] as [number, number] },
      { id: "כוח שריון ג", coordinates: [33.222, 35.580] as [number, number] },
      { id: "חפ''ק מפקד", coordinates: [33.245, 35.545] as [number, number] },
    ],
    tracks: [
      { id: "ינשוף 1 - רחפן תצפית", lat: 33.232, lng: 35.566 },
      { id: "זיק 4 - רחפן אספקה", lat: 33.221, lng: 35.578 },
      { id: "צוות סיור 3 - כלי 1", lat: 33.210, lng: 35.550 },
      { id: "צוות סיור 3 - כלי 2", lat: 33.215, lng: 35.555 },
      { id: "ינשוף 3 - רחפן תצפית", lat: 33.238, lng: 35.590 },
      { id: "ינשוף 5 - סורק אופטי", lat: 33.228, lng: 35.540 },
      { id: "שועל 1 - משימת סריקה", lat: 33.250, lng: 35.560 },
      { id: "שועל 2 - משימת סריקה", lat: 33.252, lng: 35.568 },
      { id: "אבטחה 9 - רחפן קישור", lat: 33.220, lng: 35.535 },
      { id: "אספקה 12 - כלי כבד", lat: 33.205, lng: 35.580 },
      { id: "כפר גלעדי - מטרה חשודה", lat: 33.242, lng: 35.565 },
      { id: "חדירת גבול - רחפן עוין", lat: 33.245, lng: 35.572 },
    ],
    mapCenter: [33.242, 35.568] as [number, number],
    mapZoom: 13,
  }
};

const createGroundForceIcon = (name: string) => {
  const bgCol = "#22d3ee"; // תכלת - טורקיז
  return L.divIcon({
    className: "tactical-ground-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        ">
          <svg width="16" height="16" viewBox="0 0 16 16" style="display: block;">
            <rect width="16" height="16" fill="${bgCol}" rx="1" />
            <line x1="3" y1="3" x2="13" y2="13" stroke="#000000" stroke-width="1.2" stroke-linecap="round" />
            <line x1="13" y1="3" x2="3" y2="13" stroke="#000000" stroke-width="1.2" stroke-linecap="round" />
          </svg>
        </div>
        <span style="
          margin-top: 3px;
          font-size: 8px;
          font-weight: bold;
          color: #fff;
          background-color: rgba(0,0,0,0.85);
          padding: 1px 3px;
          border-radius: 2px;
          border: 1px solid ${bgCol};
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        ">${name}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 8],
  });
};

const createEditHandleIcon = (num: number, color: string) => {
  return L.divIcon({
    className: "tactical-edit-handle",
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid #fff;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        font-weight: bold;
        font-size: 11px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.6);
      ">
        ${num}
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

// Inner component: listens to flyToTarget and calls map.flyTo
interface MapFlyControllerProps {
  target: [number, number, number?] | null;
  onDone: () => void;
}
const MapFlyController: React.FC<MapFlyControllerProps> = ({ target, onDone }) => {
  const map = useMap();
  const prevTarget = useRef<[number, number, number?] | null>(null);

  useEffect(() => {
    if (target && target !== prevTarget.current) {
      prevTarget.current = target;
      map.flyTo([target[0], target[1]], target[2] ?? 15, { animate: true, duration: 1.2 });
      onDone();
    }
  }, [target, map, onDone]);

  return null;
};

const MapResizeController: React.FC<{ showGantt: boolean }> = ({ showGantt }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize({ animate: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [showGantt, map]);
  return null;
};

interface MapClickHandlerProps {
  enabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
}
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ enabled, onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Imperative leaflet.heat layer — react-leaflet has no declarative <HeatLayer>,
// so this follows the same useMap()+useEffect+return-null shape as the other
// map controllers above (MapFlyController/MapResizeController/MapClickHandler).
interface EnemyHeatLayerControllerProps {
  points: L.HeatLatLngTuple[];
}
const EnemyHeatLayerController: React.FC<EnemyHeatLayerControllerProps> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    const layer = L.heatLayer(points, {
      radius: 34,
      blur: 24,
      maxZoom: 15,
      max: 4, // tuned against the mock cluster density — a lone point (intensity 1) stays faint
      minOpacity: 0.25,
      gradient: { 0.15: "#1d4ed8", 0.4: "#f59e0b", 0.7: "#ef4444", 1.0: "#7f1d1d" },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
};

const formatScrubberLabel = (ms: number): string =>
  new Date(ms).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Dual-handle range slider. Dragging updates a local ref-backed handler (no React
// state per pointermove) and calls onChange every frame — the caller is responsible
// for debouncing the expensive part (filtering/heat recompute), this component just
// reports raw drag positions so the handles themselves never lag behind the pointer.
interface EnemyTimelineScrubberProps {
  boundsStart: number;
  boundsEnd: number;
  rangeStart: number;
  rangeEnd: number;
  onChange: (start: number, end: number) => void;
}
const EnemyTimelineScrubber: React.FC<EnemyTimelineScrubberProps> = ({ boundsStart, boundsEnd, rangeStart, rangeEnd, onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef = useRef(rangeEnd);
  const onChangeRef = useRef(onChange);
  rangeStartRef.current = rangeStart;
  rangeEndRef.current = rangeEnd;
  onChangeRef.current = onChange;

  const toMs = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return boundsStart;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return boundsStart + ratio * (boundsEnd - boundsStart);
  };

  const startDrag = (handle: "start" | "end") => (e: React.PointerEvent) => {
    e.preventDefault();
    const MIN_GAP_MS = 60 * 60 * 1000; // handles can't cross within 1h of each other
    const move = (ev: PointerEvent) => {
      const ms = toMs(ev.clientX);
      if (handle === "start") {
        onChangeRef.current(Math.min(ms, rangeEndRef.current - MIN_GAP_MS), rangeEndRef.current);
      } else {
        onChangeRef.current(rangeStartRef.current, Math.max(ms, rangeStartRef.current + MIN_GAP_MS));
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startPct = ((rangeStart - boundsStart) / (boundsEnd - boundsStart)) * 100;
  const endPct = ((rangeEnd - boundsStart) / (boundsEnd - boundsStart)) * 100;

  const handleStyle = (pct: number): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    right: `${100 - pct}%`,
    transform: "translate(50%, -50%)",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "#ff3d3d",
    border: "2px solid #fff",
    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
    cursor: "ew-resize",
    touchAction: "none",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "0 16px", boxSizing: "border-box" }}>
      <span style={{ fontSize: "10px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
        {formatScrubberLabel(rangeStart)}
      </span>
      <div ref={trackRef} style={{ position: "relative", flex: 1, height: "4px", backgroundColor: "var(--neutral-4)", borderRadius: "2px" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: `${100 - endPct}%`,
            left: `${startPct}%`,
            backgroundColor: "#ff3d3d",
            borderRadius: "2px",
          }}
        />
        <div style={handleStyle(startPct)} onPointerDown={startDrag("start")} title={formatScrubberLabel(rangeStart)} />
        <div style={handleStyle(endPct)} onPointerDown={startDrag("end")} title={formatScrubberLabel(rangeEnd)} />
      </div>
      <span style={{ fontSize: "10px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
        {formatScrubberLabel(rangeEnd)}
      </span>
    </div>
  );
};

export const TacticalMap: React.FC<TacticalMapProps> = ({
  onTriggerAlert, 
  liveTracks = [], 
  approvedCorridors = [],
  flights = [],
  requests = [],
  onReviewRequest,
  showRequestsQueue = false,
  onRemoveLiveTrack,
  showGantt = false,
  onGanttToggle,
  onCreateRequest,
  onUpdateRequestCoordinates,
  antennas = [],
  onUpsertAntenna,
  onRemoveAntenna
}) => {
  const handleCloseIncident = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (liveTracks.some((t) => t.id === trackId)) {
      onRemoveLiveTrack?.(trackId);
    }
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
    }
  };

  const handleRemoveDrone = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    if (liveTracks.some((t) => t.id === trackId)) {
      onRemoveLiveTrack?.(trackId);
    }
    if (selectedTrack?.id === trackId) {
      setSelectedTrack(null);
    }
  };
  const [groundForces, setGroundForces] = useState(PRESETS.TAIBE_BEAUFORT.groundForces);
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "ינשוף 1 - רחפן תצפית",
      type: "DJI Matrice 300 RTK",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.322, lng: 35.532, altMsl: 152 },
      speedKts: 15,
      heading: 90,
      protocol: "OcuSync 3.0 Enterprise (מוצפן)",
      startTime: "10:14:22",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 148 },
        { timestamp: "10:47:40", alt: 150 },
        { timestamp: "10:47:50", alt: 151 },
        { timestamp: "10:48:00", alt: 152 },
        { timestamp: "10:48:10", alt: 152 }
      ],
      detectingSensors: [
        { id: "sensor-radar-1", name: "מכ''ם אלפא (מטולה)", type: "RADAR", signalStrength: 96, detectionMethod: "זיהוי פאלסי 3D בתדר X", lastPing: "לפני 1 שניות" },
        { id: "sensor-rf-1", name: "מקלט RF טקטי צפון", type: "RF", signalStrength: 91, detectionMethod: "פענוח תדר 2.4GHz", lastPing: "לפני 1 שניות" }
      ]
    },
    {
      id: "זיק 4 - רחפן אספקה",
      type: "Mavic 3 Enterprise",
      iffStatus: "BLUE_ANOMALOUS",
      coordinates: { lat: 33.332, lng: 35.545, altMsl: 210 },
      speedKts: 22,
      heading: 0,
      protocol: "OcuSync 3.0",
      startTime: "10:20:15",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 185 },
        { timestamp: "10:47:40", alt: 195 },
        { timestamp: "10:47:50", alt: 205 },
        { timestamp: "10:48:00", alt: 210 },
        { timestamp: "10:48:10", alt: 210 }
      ],
      detectingSensors: [
        { id: "sensor-radar-1", name: "מכ''ם אלפא (מטולה)", type: "RADAR", signalStrength: 94, detectionMethod: "חריגת תקרת גובה טיסה", lastPing: "לפני 1 שניות" },
        { id: "sensor-opt-1", name: "סנסור אופטרוניקה רכס", type: "OPTICAL", signalStrength: 88, detectionMethod: "מעקב ויזואלי IR חם", lastPing: "לפני 2 שניות" }
      ]
    },
    {
      id: "צוות סיור 3 - כלי 1",
      type: "Mavic 3 Pro",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.269, lng: 35.522, altMsl: 80 },
      speedKts: 18,
      heading: 45,
      protocol: "MAVLink v2.0 (AES-256)",
      startTime: "10:28:40",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 78 },
        { timestamp: "10:47:40", alt: 79 },
        { timestamp: "10:47:50", alt: 80 },
        { timestamp: "10:48:00", alt: 80 }
      ],
      detectingSensors: [
        { id: "sensor-rf-1", name: "מקלט RF טקטי צפון", type: "RF", signalStrength: 95, detectionMethod: "פענוח אות טלמטרייה מורשית", lastPing: "לפני 1 שניות" }
      ]
    },
    {
      id: "צוות סיור 3 - כלי 2",
      type: "Mavic 3 Pro",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.266, lng: 35.528, altMsl: 95 },
      speedKts: 14,
      heading: 315,
      protocol: "MAVLink v2.0 (AES-256)",
      startTime: "10:30:10",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 92 },
        { timestamp: "10:47:40", alt: 94 },
        { timestamp: "10:47:50", alt: 95 }
      ]
    },
    {
      id: "ינשוף 3 - רחפן תצפית",
      type: "DJI Matrice 300 RTK",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.326, lng: 35.530, altMsl: 160 },
      speedKts: 20,
      heading: 270,
      protocol: "OcuSync 3.0 Enterprise",
      startTime: "10:10:00",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 158 },
        { timestamp: "10:47:40", alt: 160 },
        { timestamp: "10:47:50", alt: 160 }
      ]
    },
    {
      id: "ינשוף 5 - סורק אופטי",
      type: "Skydio X2D",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.262, lng: 35.520, altMsl: 110 },
      speedKts: 16,
      heading: 60,
      protocol: "AES-256 Mesh Digital Link",
      startTime: "10:32:00",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 108 },
        { timestamp: "10:47:40", alt: 110 }
      ]
    },
    {
      id: "שועל 1 - משימת סריקה",
      type: "Skydio X2D",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.328, lng: 35.534, altMsl: 130 },
      speedKts: 22,
      heading: 190,
      protocol: "AES-256 Mesh Digital Link",
      startTime: "10:35:00",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 125 },
        { timestamp: "10:47:40", alt: 128 },
        { timestamp: "10:47:50", alt: 130 }
      ]
    },
    {
      id: "שועל 2 - משימת סריקה",
      type: "Skydio X2D",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.335, lng: 35.550, altMsl: 140 },
      speedKts: 25,
      heading: 200,
      protocol: "AES-256 Mesh Digital Link",
      startTime: "10:36:12",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 138 },
        { timestamp: "10:47:40", alt: 140 }
      ]
    },
    {
      id: "אבטחה 9 - רחפן קישור",
      type: "Mavic 3 Pro",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.338, lng: 35.555, altMsl: 75 },
      speedKts: 12,
      heading: 120,
      protocol: "MAVLink v2.0",
      startTime: "10:40:00",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 74 },
        { timestamp: "10:47:40", alt: 75 }
      ]
    },
    {
      id: "אספקה 12 - כלי כבד",
      type: "Heavy Lifter Cargo UAV",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.340, lng: 35.560, altMsl: 250 },
      speedKts: 28,
      heading: 30,
      protocol: "Satellite / Dual RF Link",
      startTime: "10:18:00",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:30", alt: 245 },
        { timestamp: "10:47:40", alt: 250 }
      ]
    },
    {
      id: "כפר גלעדי - מטרה חשודה",
      type: "רחפן לא מזוהה (Quadcopter)",
      iffStatus: "UNIDENTIFIED",
      coordinates: { lat: 33.324, lng: 35.536, altMsl: 180 },
      speedKts: 12,
      heading: 180,
      protocol: "RF 2.4GHz (תדר חופשי - לא מורשה)",
      startTime: "10:42:10",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:10", alt: 160 },
        { timestamp: "10:47:30", alt: 172 },
        { timestamp: "10:47:50", alt: 180 }
      ],
      detectingSensors: [
        { id: "sensor-radar-1", name: "מכ''ם אלפא (מטולה)", type: "RADAR", signalStrength: 92, detectionMethod: "זיהוי הד מכ''מי לא מורשה", lastPing: "לפני 1 שניות" },
        { id: "sensor-rf-1", name: "מקלט RF טקטי צפון", type: "RF", signalStrength: 87, detectionMethod: "גילוי תדר שידור עוין/לא מוכר", lastPing: "לפני 1 שניות" }
      ]
    },
    {
      id: "חדירת גבול - רחפן עוין",
      type: "רחפן תוקף (FPV/Loitering)",
      iffStatus: "RED_CERTAIN",
      coordinates: { lat: 33.330, lng: 35.540, altMsl: 90 },
      speedKts: 20,
      heading: 135,
      protocol: "Analog Video / FHSS 915MHz",
      startTime: "10:44:00",
      lastUpdateSeconds: 0,
      lastUpdateTimestamp: new Date().toLocaleTimeString("he-IL", { hour12: false }),
      altHistory: [
        { timestamp: "10:47:10", alt: 120 },
        { timestamp: "10:47:30", alt: 105 },
        { timestamp: "10:47:50", alt: 90 }
      ],
      detectingSensors: [
        { id: "sensor-rf-1", name: "מקלט RF טקטי צפון", type: "RF", signalStrength: 98, detectionMethod: "זיהוי אות וידאו אנלוגי מאיים", lastPing: "לפני 1 שניות" },
        { id: "sensor-radar-1", name: "מכ''ם אלפא (מטולה)", type: "RADAR", signalStrength: 95, detectionMethod: "מעקב מכ''מי מהיר בגובה נמוך", lastPing: "לפני 1 שניות" },
        { id: "sensor-opt-1", name: "סנסור אופטרוניקה רכס", type: "OPTICAL", signalStrength: 91, detectionMethod: "נעילה אופטית חמה IR", lastPing: "לפני 1 שניות" }
      ]
    }
  ]);

  // Sensors & Radars
  const [sensors] = useState<TacticalSensor[]>([
    {
      id: "sensor-radar-1",
      name: "מכ''ם אלפא (מטולה)",
      type: "RADAR",
      coordinates: [33.275, 35.575],
      color: "#d35400",
      rangeMeters: 1800,
      status: "ACTIVE",
    },
    {
      id: "sensor-rf-1",
      name: "חיישן RF בטא",
      type: "RF",
      coordinates: [33.245, 35.588],
      color: "#9b59b6",
      rangeMeters: 1500,
      status: "ACTIVE",
    },
    {
      id: "sensor-acoustic-1",
      name: "אקוסטי גמא",
      type: "ACOUSTIC",
      coordinates: [33.218, 35.560],
      color: "#34495e",
      rangeMeters: 800,
      status: "ACTIVE",
    },
    {
      id: "sensor-optical-1",
      name: "מגדל תצפית אופטי אלפא",
      type: "OPTICAL",
      coordinates: [33.235, 35.592],
      color: "#16a085",
      rangeMeters: 1200,
      status: "ACTIVE",
    },
    {
      id: "sensor-radar-2",
      name: "מכ''ם דלתא (הר דב)",
      type: "RADAR",
      coordinates: [33.220, 35.605],
      color: "#d35400",
      rangeMeters: 2500,
      status: "ACTIVE",
    },
    {
      id: "sensor-rf-2",
      name: "חיישן RF אפסילון (משגב עם)",
      type: "RF",
      coordinates: [33.250, 35.530],
      color: "#9b59b6",
      rangeMeters: 1800,
      status: "ACTIVE",
    },
    {
      id: "sensor-acoustic-2",
      name: "אקוסטי זטא (כפר יובל)",
      type: "ACOUSTIC",
      coordinates: [33.230, 35.568],
      color: "#34495e",
      rangeMeters: 900,
      status: "ACTIVE",
    },
    {
      id: "sensor-optical-2",
      name: "מגדל תצפית אופטי בטא",
      type: "OPTICAL",
      coordinates: [33.265, 35.550],
      color: "#16a085",
      rangeMeters: 1500,
      status: "ACTIVE",
    },
  ]);

  // Flight zones
  const [zones] = useState<Zone[]>([
    {
      id: "zone-2",
      name: "אזור הגנה מטולה (NFZ)",
      type: "NFZ",
      color: "#e74c3c",
      floor: 0,
      ceiling: 500,
      geometry: [
        [33.258, 35.572],
        [33.268, 35.572],
        [33.268, 35.590],
        [33.258, 35.590],
      ],
    },
  ]);

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<TacticalSensor | null>(null);
  const [sensorsDrawerOpen, setSensorsDrawerOpen] = useState<boolean>(false);
  const selectedTrackRef = useRef<Track | null>(null);

  useEffect(() => {
    selectedTrackRef.current = selectedTrack;
  }, [selectedTrack]);

  const [tigerTrackId, setTigerTrackId] = useState<string | null>(null);
  const [tigerTimer, setTigerTimer] = useState<number>(0);
  const [tigerPanelOpen, setTigerPanelOpen] = useState<boolean>(true);

  useEffect(() => {
    if (tigerTrackId) {
      setTigerPanelOpen(true);
    }
  }, [tigerTrackId]);

  // Commented out to prevent the Tiger Procedure control panel from closing automatically
  // when a flight updates its status to CONFIRMED. This allows the target room to manually review
  // and select "סווג ככחול" or "הסלם לפטיש אוויר".
  /*
  useEffect(() => {
    flights.forEach((flight) => {
      if (flight.tigerStatus === "CONFIRMED") {
        const reqId = flight.id.replace("flight", "req");
        const corridor = approvedCorridors.find((c) => c.id === `approved-${reqId}`);
        if (corridor && corridor.geometry) {
          const threatInside = tracks.find((t) => {
            const isThreat = t.iffStatus === "UNIDENTIFIED" || t.iffStatus.startsWith("RED");
            if (!isThreat) return false;
            return isPointInPolygon([t.coordinates.lat, t.coordinates.lng], corridor.geometry);
          });

          if (threatInside) {
            setTracks((prev) =>
              prev.map((t) =>
                t.id === threatInside.id ? { ...t, iffStatus: "BLUE_CERTAIN" } : t
              )
            );
            if (selectedTrack?.id === threatInside.id) {
              setSelectedTrack((prev) => prev ? { ...prev, iffStatus: "BLUE_CERTAIN" } : null);
            }
            if (tigerTrackId === threatInside.id) {
              setTigerTrackId(null);
              setTigerTimer(0);
            }
          }
        }
      }
    });
  }, [flights, approvedCorridors, tracks, tigerTrackId]);
  */

  // Fly-to target: [lat, lng, zoom?]
  const [flyToTarget, setFlyToTarget] = useState<[number, number, number?] | null>(null);
  const [mapStyle, setMapStyle] = useState<"MILITARY" | "TOPOGRAPHIC" | "REGULAR">("MILITARY");

  // Requests queue states
  const [selectedRequestItem, setSelectedRequestItem] = useState<FlightRequest | null>(null);
  const [showRequestDetailsCard, setShowRequestDetailsCard] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");

  // Drawing states
  const [isDrawingNewPolygon, setIsDrawingNewPolygon] = useState(false);
  const [newPolygonPoints, setNewPolygonPoints] = useState<[number, number][]>([]);
  const [newRequestForm, setNewRequestForm] = useState({
    operatorName: "",
    unit: "",
    droneModel: "DJI Matrice 300",
    minAlt: 50,
    maxAlt: 150,
    timeWindow: "12:00 - 14:00",
    notes: "",
    isArmed: false,
    classification: "GREEN" as "GREEN" | "ORANGE" | "RED",
    frequencies: [5.8]
  });

  // Editing states
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [currentEditPoints, setCurrentEditPoints] = useState<[number, number][]>([]);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    reqId: string;
    polygonName: string;
    status: FlightRequest["status"];
  } | null>(null);

  // Local Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "SUCCESS" | "INFO" | "WARNING" | "DANGER";
  } | null>(null);

  const showToast = (message: string, type: "SUCCESS" | "INFO" | "WARNING" | "DANGER" = "SUCCESS") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleRequestClick = (req: FlightRequest) => {
    setSelectedRequestItem(req);
    setSelectedTrack(null);
    setSelectedSensor(null);
    setShowRequestDetailsCard(false);
    
    // Highlight and center polygon on map
    const geom = getRequestGeometry(req);
    const center = getPolygonCenter(geom);
    setFlyToTarget([center[0], center[1], 14]);
  };

  // Helper: focus on a track from the side-panel list
  const focusTrack = (t: Track) => {
    setSelectedTrack(t);
    setSelectedSensor(null);
    setFlyToTarget([t.coordinates.lat, t.coordinates.lng, 15]);
  };

  // Helper: focus on a sensor from the side-panel list
  const focusSensor = (s: TacticalSensor) => {
    setSelectedSensor(s);
    setSelectedTrack(null);
    setFlyToTarget([s.coordinates[0], s.coordinates[1], 15]);
  };

  // Layer switches
  const [showDrones, setShowDrones] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showNFZ, setShowNFZ] = useState(true);
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [showGroundForces, setShowGroundForces] = useState(true);
  const [showAntennas, setShowAntennas] = useState(true);
  const [showEnemyHeatmap, setShowEnemyHeatmap] = useState(true);

  // RF antenna placement + editing state
  const [selectedAntenna, setSelectedAntenna] = useState<RFAntenna | null>(null);
  const [antennaEditDraft, setAntennaEditDraft] = useState<RFAntenna | null>(null);
  const [pendingAntennaPresetId, setPendingAntennaPresetId] = useState<string>(ANTENNA_PRESETS[0].id);
  const [antennaPlacementPresetId, setAntennaPlacementPresetId] = useState<string | null>(null);

  // Enemy activity heatmap — filters, time range, and display mode
  const [enemyDateRangeMode, setEnemyDateRangeMode] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [enemyRangeStart, setEnemyRangeStart] = useState<number>(MOCK_DATA_RANGE_END_MS - 24 * 60 * 60 * 1000);
  const [enemyRangeEnd, setEnemyRangeEnd] = useState<number>(MOCK_DATA_RANGE_END_MS);
  const [enemySensorTypeFilter, setEnemySensorTypeFilter] = useState<Set<SensorType>>(
    () => new Set<SensorType>(["RADAR", "RF_FINDER", "OPTICAL", "EXTERNAL_SYSTEM"])
  );
  const [enemyIffFilter, setEnemyIffFilter] = useState<Set<IffStatus>>(
    () => new Set<IffStatus>(["RED_SUSPICIOUS", "RED_CERTAIN", "UNIDENTIFIED"])
  );
  const [enemyDisplayMode, setEnemyDisplayMode] = useState<'heat' | 'tracks' | 'combined'>('heat');
  // Scrubber drags update this immediately (smooth handles); the committed range above
  // only follows after a short debounce, so filtering/heat recompute isn't per-pixel.
  const [enemyPendingRange, setEnemyPendingRange] = useState<{ start: number; end: number } | null>(null);
  const debouncedEnemyPendingRange = useDebouncedValue(enemyPendingRange, 120);

  useEffect(() => {
    if (debouncedEnemyPendingRange) {
      setEnemyRangeStart(debouncedEnemyPendingRange.start);
      setEnemyRangeEnd(debouncedEnemyPendingRange.end);
    }
  }, [debouncedEnemyPendingRange]);

  // Floating menu toggle state
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [antennaWidgetOpen, setAntennaWidgetOpen] = useState(false);
  const [enemyWidgetOpen, setEnemyWidgetOpen] = useState(false);

  // Admin panel state
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [selectedAdminItem, setSelectedAdminItem] = useState<{ type: 'gf' | 'track'; id: string } | null>(null);
  const [adminClickToMove, setAdminClickToMove] = useState(false);

  // Enemy activity heatmap — derived data. AOR restriction: no polygon exists yet,
  // so this filters strictly by the connected user's unit_id (session.unitId).
  const { session } = useAppSession();

  const enemyDetections: EnrichedDetection[] = useMemo(() => {
    return enrichDetections(MOCK_SENSOR_DETECTIONS, MOCK_IDENTIFICATION_EVENTS, {
      unitId: session.unitId,
      rangeStartMs: enemyRangeStart,
      rangeEndMs: enemyRangeEnd,
      sensorTypes: enemySensorTypeFilter,
      iffStatuses: enemyIffFilter,
    });
  }, [session.unitId, enemyRangeStart, enemyRangeEnd, enemySensorTypeFilter, enemyIffFilter]);

  // Intensity must come from point DENSITY, not a single detection — bin into a coordinate
  // grid and use the per-cell count as the heat weight, so an isolated point stays cold.
  const enemyHeatPoints: L.HeatLatLngTuple[] = useMemo(() => {
    const CELL_DEG = 0.003; // ~300m grid cells
    const cells = new Map<string, { latSum: number; lngSum: number; count: number }>();
    for (const d of enemyDetections) {
      const key = `${Math.round(d.lat / CELL_DEG)}:${Math.round(d.lng / CELL_DEG)}`;
      const cell = cells.get(key);
      if (cell) {
        cell.latSum += d.lat;
        cell.lngSum += d.lng;
        cell.count += 1;
      } else {
        cells.set(key, { latSum: d.lat, lngSum: d.lng, count: 1 });
      }
    }
    return Array.from(cells.values()).map((c) => [c.latSum / c.count, c.lngSum / c.count, c.count]);
  }, [enemyDetections]);

  const enemyTrackGroups: { trackId: string; points: [number, number][]; iffStatus: IffStatus }[] = useMemo(() => {
    const byTrack = new Map<string, EnrichedDetection[]>();
    for (const d of enemyDetections) {
      const group = byTrack.get(d.target_track_id);
      if (group) group.push(d);
      else byTrack.set(d.target_track_id, [d]);
    }
    const result: { trackId: string; points: [number, number][]; iffStatus: IffStatus }[] = [];
    byTrack.forEach((group, trackId) => {
      if (group.length < 2) return; // a lone detection can't draw a path
      const sorted = [...group].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      result.push({
        trackId,
        points: sorted.map((d) => [d.lat, d.lng] as [number, number]),
        iffStatus: sorted[sorted.length - 1].current_iff_status,
      });
    });
    return result;
  }, [enemyDetections]);

  const loadScenario = (scenario: 'TAIBE_BEAUFORT' | 'DEFAULT_METULA') => {
    const preset = PRESETS[scenario];
    setGroundForces(preset.groundForces);
    setTracks(prev => {
      return prev.map(t => {
        const matchingPresetTrack = preset.tracks.find(pt => pt.id === t.id);
        if (matchingPresetTrack) {
          return {
            ...t,
            coordinates: {
              ...t.coordinates,
              lat: matchingPresetTrack.lat,
              lng: matchingPresetTrack.lng
            }
          };
        }
        return t;
      });
    });
    setFlyToTarget([preset.mapCenter[0], preset.mapCenter[1], preset.mapZoom]);
  };

  // Sky-picture subcategory collapse states (all expanded by default)
  const [incidentsExpanded, setIncidentsExpanded] = useState(true);
  const [friendlyExpanded, setFriendlyExpanded] = useState(true);
  const [spectrumExpanded, setSpectrumExpanded] = useState(true);

  // Simulate real-time target movement & telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTigerTimer((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        return 0;
      });

      const nowTimeStr = new Date().toLocaleTimeString("he-IL", { hour12: false });

      setTracks((prev) =>
        prev.map((t) => {
          // If speed is 0 (like static RF signals), don't move
          if (t.speedKts === 0) return t;

          // Altitude fluctuation (-2 to +3 meters)
          const altDrift = Math.floor((Math.random() - 0.45) * 3);
          const newAlt = Math.max(20, Math.min(750, t.coordinates.altMsl + altDrift));

          // Add a subtle drift in heading to make tracks curve organically
          const headingDrift = (Math.random() - 0.5) * 8; // -4 to +4 degrees drift
          let newHeading = Math.round((t.heading + headingDrift) % 360);
          if (newHeading < 0) newHeading += 360;

          const headingRad = (newHeading * Math.PI) / 180;
          const speedFactor = 0.0000008 * t.speedKts;
          
          // Latitude increases going north (0 deg), Longitude increases going east (90 deg)
          // So deltaLat is cos(headingRad), deltaLng is sin(headingRad)
          const deltaLat = Math.cos(headingRad) * speedFactor;
          const deltaLng = Math.sin(headingRad) * speedFactor;
          
          let newLat = t.coordinates.lat + deltaLat;
          let newLng = t.coordinates.lng + deltaLng;
          
          // Bounding Box checks for expanded sector (including Et Taibe, Beaufort & Ridge): lat [33.200, 33.360], lng [35.500, 35.610]
          let didBounce = false;
          if (newLat < 33.200 || newLat > 33.360) {
            newHeading = (360 - newHeading) % 360; // bounce lat
            didBounce = true;
          }
          if (newLng < 35.500 || newLng > 35.610) {
            newHeading = (180 - newHeading) % 360; // bounce lng
            if (newHeading < 0) newHeading += 360;
            didBounce = true;
          }

          if (didBounce) {
            const bounceRad = (newHeading * Math.PI) / 180;
            newLat = t.coordinates.lat + Math.cos(bounceRad) * speedFactor;
            newLng = t.coordinates.lng + Math.sin(bounceRad) * speedFactor;
          }

          const currentPos: [number, number] = [newLat, newLng];
          const startPos: [number, number] = [t.coordinates.lat, t.coordinates.lng];
          const newHistory: [number, number][] = t.history ? [...t.history, currentPos] : [startPos, currentPos];
          if (newHistory.length > 50) {
            newHistory.shift();
          }

          const currentAltHist = t.altHistory && t.altHistory.length > 0 ? t.altHistory : [{ timestamp: nowTimeStr, alt: newAlt }];
          const updatedAltHist = [...currentAltHist, { timestamp: nowTimeStr, alt: newAlt }];
          if (updatedAltHist.length > 30) {
            updatedAltHist.shift();
          }

          const updatedTrack: Track = {
            ...t,
            heading: newHeading,
            coordinates: { lat: newLat, lng: newLng, altMsl: newAlt },
            history: newHistory,
            altHistory: updatedAltHist,
            lastUpdateSeconds: 0,
            lastUpdateTimestamp: nowTimeStr,
          };

          if (selectedTrackRef.current?.id === t.id) {
            setSelectedTrack(updatedTrack);
          }

          return updatedTrack;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getIFFColor = (status: Track["iffStatus"]) => {
    if (status.startsWith("BLUE")) {
      if (status === "BLUE_ANOMALOUS") return "#ffc53d"; // Yellow (Unidentified)
      return "#186eff"; // Blue (Forces)
    }
    if (status.startsWith("RED")) {
      return "#b54548"; // Red (Enemy)
    }
    return "#ffc53d"; // Yellow (Unidentified)
  };

  const handleAction = (action: string, track: Track) => {
    if (action === "TIGER") {
      onTriggerAlert(`נוהל נמר פעיל בגזרת גבול הצפון! כלי טיס עוין/חשוד (${track.id}) זוהה.`, {
        alertType: "TIGER",
        threatLocation: { lat: track.coordinates.lat, lng: track.coordinates.lng }
      });
      setTigerTrackId(track.id);
      setTigerTimer(15);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, iffStatus: "RED_CERTAIN" } : t))
      );
      if (selectedTrack?.id === track.id) {
        setSelectedTrack((prev) => prev ? { ...prev, iffStatus: "RED_CERTAIN" } : null);
      }
    } else if (action === "HAMMER") {
      onTriggerAlert(`פטיש אוויר פעיל בגזרה הצפונית! שובש מרחב התדרים. הנחת את הרחפנים מייד.`, {
        alertType: "HAMMER"
      });
      if (tigerTrackId === track.id) {
        setTigerTrackId(null);
        setTigerTimer(0);
      }
    } else if (action === "BLUE") {
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, iffStatus: "BLUE_CERTAIN" } : t))
      );
      if (selectedTrack?.id === track.id) {
        setSelectedTrack((prev) => prev ? { ...prev, iffStatus: "BLUE_CERTAIN" } : null);
      }
      if (tigerTrackId === track.id) {
        setTigerTrackId(null);
        setTigerTimer(0);
      }
    }
  };

  const allActiveTracks = [...tracks, ...liveTracks];
  const friendlyTracks = allActiveTracks.filter(
    (t) => getIFFColor(t.iffStatus) === "#186eff"
  );
  const hostileOrUnidentifiedTracks = allActiveTracks.filter(
    (t) => getIFFColor(t.iffStatus) !== "#186eff"
  );

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rf-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes acoustic-expand {
          0% { transform: scale(0.65); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes optical-blink {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes friendly-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes hostile-warn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .radar-sweep {
          transform-origin: 12px 12px;
          animation: radar-spin 3s linear infinite;
        }
        .rf-wave-1 {
          animation: rf-pulse 1.5s infinite;
        }
        .rf-wave-2 {
          animation: rf-pulse 1.5s infinite 0.75s;
        }
        .acoustic-ripple {
          transform-origin: 12px 8px;
          animation: acoustic-expand 2s infinite linear;
        }
        .optical-crosshair {
          animation: optical-blink 1.2s infinite;
        }
        .friendly-marker {
          animation: friendly-pulse 3s infinite ease-in-out;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        .hostile-marker {
          animation: hostile-warn 1.5s infinite ease-in-out;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
      `}</style>
      {/* Side Panel: Airspace Situation info (תמונת שמיים) OR Requests Queue Panel */}
      {showRequestsQueue ? (
        <div style={styles.requestsPanel}>
          <div style={styles.panelHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={styles.requestsPanelTitle}>תור בקשות</span>
              <span style={styles.panelBadge}>
                {requests.filter(r => r.status === "PENDING_REVIEW" || r.status === "CONFLICT").length}
              </span>
            </div>
            {!isDrawingNewPolygon && !isEditingPoints && (
              <button
                id="create-request-btn"
                onClick={() => {
                  setIsDrawingNewPolygon(true);
                  setNewPolygonPoints([]);
                  setSelectedRequestItem(null);
                  setShowRequestDetailsCard(false);
                }}
                style={{
                  backgroundColor: "var(--blue-9)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                + בקשה חדשה
              </button>
            )}
          </div>
          
          {isDrawingNewPolygon ? (
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--neutral-12)" }}>הגשת בקשת טיסה חדשה</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>שם המפעיל</label>
                <input
                  type="text"
                  value={newRequestForm.operatorName}
                  onChange={(e) => setNewRequestForm(prev => ({ ...prev, operatorName: e.target.value }))}
                  placeholder="סמ''ר ישראל ישראלי"
                  style={{
                    backgroundColor: "var(--neutral-3)",
                    border: "1px solid var(--neutral-6)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    color: "#fff",
                    fontSize: "12px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>יחידה</label>
                <input
                  type="text"
                  value={newRequestForm.unit}
                  onChange={(e) => setNewRequestForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="גדוד 12"
                  style={{
                    backgroundColor: "var(--neutral-3)",
                    border: "1px solid var(--neutral-6)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    color: "#fff",
                    fontSize: "12px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>דגם רחפן</label>
                <select
                  value={newRequestForm.droneModel}
                  onChange={(e) => setNewRequestForm(prev => ({ ...prev, droneModel: e.target.value }))}
                  style={{
                    backgroundColor: "var(--neutral-3)",
                    border: "1px solid var(--neutral-6)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    color: "#fff",
                    fontSize: "12px",
                    outline: "none"
                  }}
                >
                  <option value="EVO 4T">EVO 4T</option>
                  <option value="EVO Alfa">EVO Alfa</option>
                  <option value="EVO Night">EVO Night</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>גובה מינימלי (מ')</label>
                  <input
                    type="number"
                    value={newRequestForm.minAlt}
                    onChange={(e) => setNewRequestForm(prev => ({ ...prev, minAlt: parseInt(e.target.value) || 0 }))}
                    style={{
                      backgroundColor: "var(--neutral-3)",
                      border: "1px solid var(--neutral-6)",
                      borderRadius: "4px",
                      padding: "6px 8px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      width: "100%"
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>גובה מקסימלי (מ')</label>
                  <input
                    type="number"
                    value={newRequestForm.maxAlt}
                    onChange={(e) => setNewRequestForm(prev => ({ ...prev, maxAlt: parseInt(e.target.value) || 0 }))}
                    style={{
                      backgroundColor: "var(--neutral-3)",
                      border: "1px solid var(--neutral-6)",
                      borderRadius: "4px",
                      padding: "6px 8px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      width: "100%"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>חלון זמן</label>
                <input
                  type="text"
                  value={newRequestForm.timeWindow}
                  onChange={(e) => setNewRequestForm(prev => ({ ...prev, timeWindow: e.target.value }))}
                  placeholder="12:00 - 14:00"
                  style={{
                    backgroundColor: "var(--neutral-3)",
                    border: "1px solid var(--neutral-6)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    color: "#fff",
                    fontSize: "12px",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", color: "var(--neutral-11)" }}>הערות / משימה</label>
                <textarea
                  value={newRequestForm.notes}
                  onChange={(e) => setNewRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="לדוגמה: סריקת ציר גישה..."
                  style={{
                    backgroundColor: "var(--neutral-3)",
                    border: "1px solid var(--neutral-6)",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    color: "#fff",
                    fontSize: "12px",
                    height: "60px",
                    resize: "none",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="form-is-armed"
                  checked={newRequestForm.isArmed}
                  onChange={(e) => setNewRequestForm(prev => ({ ...prev, isArmed: e.target.checked }))}
                  style={{ cursor: "pointer" }}
                />
                <label htmlFor="form-is-armed" style={{ fontSize: "11px", color: "var(--neutral-11)", cursor: "pointer" }}>רחפן חמוש (חמ''מ)</label>
              </div>

              <div style={{
                backgroundColor: "var(--blue-3)",
                border: "1px solid var(--blue-6)",
                borderRadius: "4px",
                padding: "8px",
                marginTop: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--blue-11)" }}>✏ שרטוט פוליגון במפה:</span>
                <span style={{ fontSize: "10px", color: "#ccc" }}>לחץ על המפה להוספת נקודות לפוליגון. נדרשות לפחות 3 נקודות.</span>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#fff", marginTop: "2px" }}>
                  נקודות שסומנו: {newPolygonPoints.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                <button
                  id="submit-request-btn"
                  onClick={() => {
                    if (!newRequestForm.operatorName.trim()) {
                      alert("נא להזין שם מפעיל");
                      return;
                    }
                    if (newPolygonPoints.length < 3) {
                      alert("נא לסמן לפחות 3 נקודות על גבי המפה לייצוג פוליגון טיסה");
                      return;
                    }

                    const requestWithMockId = {
                      id: `req-${Math.floor(1000 + Math.random() * 9000)}`,
                      operatorName: newRequestForm.operatorName,
                      unit: newRequestForm.unit,
                      droneModel: newRequestForm.droneModel,
                      frequencies: newRequestForm.frequencies,
                      timeWindow: newRequestForm.timeWindow,
                      classification: newRequestForm.classification,
                      minAlt: newRequestForm.minAlt,
                      maxAlt: newRequestForm.maxAlt,
                      conflicts: [] as any[],
                      notes: newRequestForm.notes,
                      status: "PENDING_REVIEW" as const,
                      isArmed: newRequestForm.isArmed,
                      polygonType: "CUSTOM" as const,
                      polygonName: "פוליגון מותאם אישית",
                      customPolygonPoints: newPolygonPoints,
                    };

                    let classification: "GREEN" | "ORANGE" | "RED" = "GREEN";
                    const conflicts = [];
                    if (newRequestForm.isArmed) {
                      conflicts.push({
                        type: "ARMED_DRONE",
                        description: "כלי חמוש (חמ''מ) - תעופת חימוש מחייבת אישור קמב''ץ / מח''ט!"
                      });
                      classification = "RED";
                    }
                    if (newRequestForm.maxAlt > 100) {
                      conflicts.push({
                        type: "NFZ_VIOLATION",
                        description: "חריגת גובה מירבי (מעל 100 מטר)"
                      });
                      classification = "RED";
                    }
                    requestWithMockId.classification = classification;
                    requestWithMockId.conflicts = conflicts;

                    onCreateRequest?.(requestWithMockId);
                    setIsDrawingNewPolygon(false);
                    setNewPolygonPoints([]);
                    setNewRequestForm({
                      operatorName: "",
                      unit: "",
                      droneModel: "DJI Matrice 300",
                      minAlt: 50,
                      maxAlt: 150,
                      timeWindow: "12:00 - 14:00",
                      notes: "",
                      isArmed: false,
                      classification: "GREEN",
                      frequencies: [5.8]
                    });
                  }}
                  style={{
                    backgroundColor: "var(--green-9)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  צור בקשה
                </button>
                
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setNewPolygonPoints(prev => prev.slice(0, -1))}
                    disabled={newPolygonPoints.length === 0}
                    style={{
                      flex: 1,
                      backgroundColor: "var(--neutral-5)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px",
                      fontSize: "11px",
                      cursor: newPolygonPoints.length === 0 ? "not-allowed" : "pointer",
                      opacity: newPolygonPoints.length === 0 ? 0.5 : 1
                    }}
                  >
                    מחק נקודה אחרונה
                  </button>
                  <button
                    onClick={() => setNewPolygonPoints([])}
                    disabled={newPolygonPoints.length === 0}
                    style={{
                      flex: 1,
                      backgroundColor: "var(--neutral-5)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px",
                      fontSize: "11px",
                      cursor: newPolygonPoints.length === 0 ? "not-allowed" : "pointer",
                      opacity: newPolygonPoints.length === 0 ? 0.5 : 1
                    }}
                  >
                    נקה הכל
                  </button>
                </div>

                <button
                  onClick={() => {
                    setIsDrawingNewPolygon(false);
                    setNewPolygonPoints([]);
                  }}
                  style={{
                    backgroundColor: "var(--red-8)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                    marginTop: "4px"
                  }}
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.requestList}>
              {requests.map((r) => {
                if (r.status === "REJECTED") return null;
              const cfg = classificationConfig[r.classification];
              const isSelected = selectedRequestItem?.id === r.id;
              const isPending = r.status === "PENDING_REVIEW";
              const isConflict = r.status === "CONFLICT";
              const isApproved = r.status === "APPROVED";
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    handleRequestClick(r);
                  }}
                  style={{
                    ...styles.requestCard,
                    borderRight: `3px solid ${
                      isApproved 
                        ? "var(--blue-9)" 
                        : isConflict 
                        ? "var(--orange-9)" 
                        : "var(--yellow-9)"
                    }`,
                    backgroundColor: isSelected ? "var(--neutral-5)" : "var(--neutral-4)",
                    boxShadow: isSelected ? `inset 0 0 0 1px var(--neutral-7)` : "none",
                  }}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.cardIdRow}>
                      <span style={styles.cardId}>{r.id}</span>
                      {r.isArmed && (
                        <span style={styles.armedBadge}><AlertTriangle size={10} style={{ marginLeft: 3 }} /> חמוש</span>
                      )}
                    </div>
                    <span style={{
                      ...styles.classBadge,
                      backgroundColor: cfg.badgeBg,
                      color: cfg.badgeText,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardRow}>
                      <span style={styles.cardLabel}>מפעיל</span>
                      <span style={styles.cardVal}>{r.operatorName}</span>
                    </div>
                    <div style={styles.cardRow}>
                      <span style={styles.cardLabel}>יחידה</span>
                      <span style={styles.cardVal}>{r.unit}</span>
                    </div>
                    {!isEditingPoints && (
                      <>
                        <div style={styles.cardRow}>
                          <span style={styles.cardLabel}>חלון זמן</span>
                          <span style={styles.cardVal}>{r.timeWindow}</span>
                        </div>
                        <div style={{ ...styles.cardRow, flexDirection: "column", alignItems: "flex-start", gap: "2px", marginTop: "4px" }}>
                          <span style={styles.cardLabel}>תיאור בקשה</span>
                          <span style={{ ...styles.cardVal, whiteSpace: "normal", wordBreak: "break-word", fontSize: "11px", backgroundColor: "var(--neutral-5)", padding: "4px", borderRadius: "4px", width: "100%", marginTop: "2px" }}>
                            {r.notes}
                          </span>
                        </div>
                        {r.operatorNotes && (
                          <div style={{ ...styles.cardRow, flexDirection: "column", alignItems: "flex-start", gap: "2px", marginTop: "4px" }}>
                            <span style={styles.cardLabel}>הערות מפעיל</span>
                            <span style={{ ...styles.cardVal, whiteSpace: "normal", wordBreak: "break-word", fontSize: "11px", backgroundColor: "var(--neutral-5)", padding: "4px", borderRadius: "4px", width: "100%", marginTop: "2px" }}>
                              {r.operatorNotes}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {isEditingPoints && editRequestId === r.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "var(--neutral-5)",
                          borderRadius: "4px",
                          border: "1px solid var(--yellow-9)"
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--yellow-9)" }}>עריכת נקודות פוליגון:</span>
                        <span style={{ fontSize: "10px", color: "#ccc" }}>גרור את העיגולים הממוספרים על המפה, או לחץ על המפה להוספת נקודות חדשות.</span>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#fff" }}>נקודות: {currentEditPoints.length}</span>
                        
                        <button
                          onClick={() => {
                            if (currentEditPoints.length < 3) {
                              alert("פוליגון חייב להכיל לפחות 3 נקודות");
                              return;
                            }
                            onUpdateRequestCoordinates?.(r.id, currentEditPoints);
                            setIsEditingPoints(false);
                            setEditRequestId(null);
                          }}
                          style={{
                            backgroundColor: "var(--green-9)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          שמור שינויים
                        </button>

                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => setCurrentEditPoints(prev => prev.slice(0, -1))}
                            disabled={currentEditPoints.length === 0}
                            style={{
                              flex: 1,
                              backgroundColor: "var(--neutral-6)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px",
                              fontSize: "10px",
                              cursor: currentEditPoints.length === 0 ? "not-allowed" : "pointer"
                            }}
                          >
                            מחק נקודה אחרונה
                          </button>
                          <button
                            onClick={() => setCurrentEditPoints([])}
                            disabled={currentEditPoints.length === 0}
                            style={{
                              flex: 1,
                              backgroundColor: "var(--neutral-6)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px",
                              fontSize: "10px",
                              cursor: currentEditPoints.length === 0 ? "not-allowed" : "pointer"
                            }}
                          >
                            נקה הכל
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setIsEditingPoints(false);
                            setEditRequestId(null);
                          }}
                          style={{
                            backgroundColor: "var(--red-8)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px",
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          ביטול
                        </button>
                      </div>
                    ) : (isPending || isConflict) && selectedRequestItem?.id === r.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}
                      >
                        <label style={{ fontSize: "10px", color: "var(--neutral-12)" }}>הנחיות קצין רוק״ק / הערות:</label>
                        <textarea
                          style={{
                            width: "100%",
                            height: "40px",
                            backgroundColor: "var(--neutral-3)",
                            border: "1px solid var(--neutral-6)",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            resize: "none" as any,
                            outline: "none",
                          }}
                          value={reviewerNotes}
                          onChange={(e) => setReviewerNotes(e.target.value)}
                          placeholder="הקלד הנחיות למפעיל..."
                        />
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                          <button
                            id={`approve-btn-${selectedRequestItem.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReviewRequest?.(selectedRequestItem.id, "APPROVED", reviewerNotes);
                              setSelectedRequestItem({ ...selectedRequestItem, status: "APPROVED", reviewerNotes });
                              setReviewerNotes("");
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: "var(--green-9)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            אשר בקשה
                          </button>
                          <button
                            id={`conflict-btn-${selectedRequestItem.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReviewRequest?.(selectedRequestItem.id, "CONFLICT", reviewerNotes);
                              setSelectedRequestItem({ ...selectedRequestItem, status: "CONFLICT", reviewerNotes });
                              setReviewerNotes("");
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: "var(--orange-9)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            סמן כקונפליקט
                          </button>
                          <button
                            id={`remove-btn-${selectedRequestItem.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReviewRequest?.(selectedRequestItem.id, "REMOVE", reviewerNotes);
                              setSelectedRequestItem(null);
                              setReviewerNotes("");
                            }}
                            style={{
                              flex: 1,
                              backgroundColor: "var(--red-8)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            הסר פוליגון
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div style={styles.cardFooter}>
                    <span style={{
                      ...styles.statusPill,
                      backgroundColor: statusConfig[r.status].bg,
                      color: statusConfig[r.status].color,
                    }}>
                      {statusConfig[r.status].label}
                    </span>
                    {isSelected && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRequestDetailsCard(true);
                          }}
                          style={{
                            backgroundColor: "var(--blue-8)",
                            color: "#000",
                            border: "none",
                            borderRadius: "4px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--blue-9)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--blue-8)")}
                        >
                          פרטים נוספים
                        </button>

                        {isApproved && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const geom = getRequestGeometry(r);
                              setCurrentEditPoints(geom);
                              setEditRequestId(r.id);
                              setIsEditingPoints(true);
                            }}
                            style={{
                              backgroundColor: "var(--yellow-9)",
                              color: "#000",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 10px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eab308")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--yellow-9)")}
                          >
                            ערוך פוליגון
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      ) : (
        <div style={styles.sidePanel}>
          <h3 style={styles.panelTitle}>תמונת שמיים חטיבתית</h3>

          {/* Side panel always shows the full list - details appear as a floating map overlay */}
          <div style={styles.listsContainer}>
            {/* 1. אירועים פתוחים - כל הרחפנים הלא מזוהים או רחפני אויב */}
            <div style={styles.listSection}>
              <div
                onClick={() => setIncidentsExpanded(!incidentsExpanded)}
                style={{ ...styles.sectionHeader, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertOctagon size={14} color="var(--red-9)" /> אירועים פתוחים ({hostileOrUnidentifiedTracks.length})
                </span>
                <span style={{ fontSize: "10px", color: "var(--neutral-9)", transition: "transform 0.2s", transform: incidentsExpanded ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>▼</span>
              </div>
              {incidentsExpanded && (
                hostileOrUnidentifiedTracks.length === 0 ? (
                  <div style={{ fontSize: "11px", color: "var(--neutral-10)", padding: "10px", textAlign: "center" }}>אין אירועים פתוחים</div>
                ) : (
                  hostileOrUnidentifiedTracks.map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); focusTrack(t); }}
                      style={{
                        ...styles.itemRowClickable,
                        borderRight: `3px solid ${getIFFColor(t.iffStatus)}`,
                        backgroundColor: selectedTrack?.id === t.id ? "var(--neutral-5)" : "var(--neutral-3)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      title="לחץ לניווט למיקום המטרה במפה"
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ opacity: 0.6, display: "flex", alignItems: "center" }}><MapPin size={10} /></span>
                            {t.id.split(" - ")[0]}
                          </span>
                          <span style={{ color: getIFFColor(t.iffStatus), fontSize: "11px", fontWeight: "bold", marginLeft: "8px" }}>
                            {t.iffStatus.startsWith("RED") ? "אויב" : "לא מזוהה"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--neutral-10)", marginTop: "4px" }}>
                          {t.type} · גובה {t.coordinates.altMsl}מ'
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseIncident(t.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--red-9)",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "8px",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(231,76,60,0.15)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        title="סגור אירוע"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>

            {/* 2. כלים באוויר - כלים שהם כוחותינו */}
            <div style={styles.listSection}>
              <div
                onClick={() => setFriendlyExpanded(!friendlyExpanded)}
                style={{ ...styles.sectionHeader, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Plane size={14} color="var(--blue-11)" /> כלים באוויר ({friendlyTracks.length})
                </span>
                <span style={{ fontSize: "10px", color: "var(--neutral-9)", transition: "transform 0.2s", transform: friendlyExpanded ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>▼</span>
              </div>
              {friendlyExpanded && (
                friendlyTracks.length === 0 ? (
                  <div style={{ fontSize: "11px", color: "var(--neutral-10)", padding: "10px", textAlign: "center" }}>אין כלים של כוחותינו באוויר</div>
                ) : (
                  friendlyTracks.map((t) => (
                    <div
                      key={t.id}
                      onClick={(e) => { e.stopPropagation(); focusTrack(t); }}
                      style={{
                        ...styles.itemRowClickable,
                        borderRight: `3px solid ${getIFFColor(t.iffStatus)}`,
                        backgroundColor: selectedTrack?.id === t.id ? "var(--neutral-5)" : "var(--neutral-3)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      title="לחץ לניווט למיקום המטרה במפה"
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ opacity: 0.6, display: "flex", alignItems: "center" }}><MapPin size={10} /></span>
                            {t.id.split(" - ")[0]}
                          </span>
                          <span style={{ color: getIFFColor(t.iffStatus), fontSize: "11px", fontWeight: "bold", marginLeft: "8px" }}>כוחותינו</span>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--neutral-10)", marginTop: "4px" }}>
                          {t.type} · גובה {t.coordinates.altMsl}מ'
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDrone(t.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--neutral-10)",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "8px",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(231,76,60,0.15)";
                          e.currentTarget.style.color = "var(--red-9)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--neutral-10)";
                        }}
                        title="הסר רחפן"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>

            {/* 3. ספקטרום - כל הסנסורים והמכמים למיניהם */}
            <div style={styles.listSection}>
              <div
                onClick={() => setSpectrumExpanded(!spectrumExpanded)}
                style={{ ...styles.sectionHeader, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Radio size={14} color="var(--blue-11)" /> ספקטרום ({sensors.length})
                </span>
                <span style={{ fontSize: "10px", color: "var(--neutral-9)", transition: "transform 0.2s", transform: spectrumExpanded ? "rotate(0deg)" : "rotate(-90deg)", display: "inline-block" }}>▼</span>
              </div>
              {spectrumExpanded && (
                sensors.length === 0 ? (
                  <div style={{ fontSize: "11px", color: "var(--neutral-10)", padding: "10px", textAlign: "center" }}>אין סנסורים פעילים</div>
                ) : (
                  sensors.map((s) => (
                    <div
                      key={s.id}
                      onClick={(e) => { e.stopPropagation(); focusSensor(s); }}
                      style={{
                        ...styles.itemRowClickable,
                        borderRight: selectedSensor?.id === s.id ? `3px solid ${s.color}` : "3px solid transparent",
                        backgroundColor: selectedSensor?.id === s.id ? "var(--neutral-5)" : "var(--neutral-3)",
                      }}
                      title="לחץ לניווט למיקום הסנסור במפה"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ opacity: 0.6, display: "flex", alignItems: "center" }}><MapPin size={10} /></span>
                          {s.name.split(" (")[0]}
                        </span>
                        <span style={{ color: s.color, fontSize: "11px", fontWeight: "bold" }}>{s.type}</span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div style={{ ...styles.mapCanvas, display: "flex", flexDirection: "column" }}>
        {/* Floating non-intrusive layers selector above the map */}
        <div style={styles.floatingLayers}>
          <button style={styles.floatingLayersToggle} onClick={() => setLayersMenuOpen(!layersMenuOpen)}>
            🥞 שכבות מפה {layersMenuOpen ? "▲" : "▼"}
          </button>
          {layersMenuOpen && (
            <div style={styles.floatingLayersContent}>
              <div style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "8px", marginBottom: "8px", width: "100%" }}>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>סגנון מפה:</span>
                <select 
                  value={mapStyle} 
                  onChange={(e) => setMapStyle(e.target.value as any)}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--neutral-3)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text)",
                    fontSize: "11px",
                    borderRadius: "4px",
                    padding: "4px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="MILITARY">מפה צבאית (לוויין)</option>
                  <option value="TOPOGRAPHIC">מפה טופוגרפית</option>
                  <option value="REGULAR">מפה רגילה</option>
                </select>
              </div>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showDrones} onChange={(e) => setShowDrones(e.target.checked)} />
                רחפנים ומטרות
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showSensors} onChange={(e) => setShowSensors(e.target.checked)} />
                סנסורים ומכ"מים
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showCorridors} onChange={(e) => setShowCorridors(e.target.checked)} />
                פוליגונים (ירוק)
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showNFZ} onChange={(e) => setShowNFZ(e.target.checked)} />
                אזורי NFZ (אדום)
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showSpectrum} onChange={(e) => setShowSpectrum(e.target.checked)} />
                חסימות ל"א (סגול)
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showGroundForces} onChange={(e) => setShowGroundForces(e.target.checked)} />
                כוחותינו (קרקע)
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showAntennas} onChange={(e) => setShowAntennas(e.target.checked)} />
                אנטנות RF
              </label>
              <label style={styles.layerCheckboxRow}>
                <input type="checkbox" checked={showEnemyHeatmap} onChange={(e) => setShowEnemyHeatmap(e.target.checked)} />
                תמונת מצב אויב
              </label>
            </div>
          )}
        </div>

        {/* Floating RF antenna widget above the map */}
        <div style={styles.floatingAntennaWidget}>
          <button style={styles.floatingAntennaToggle} onClick={() => setAntennaWidgetOpen(!antennaWidgetOpen)}>
            📡 אנטנות RF {antennaWidgetOpen ? "▲" : "▼"}
          </button>
          {antennaWidgetOpen && (
            <div style={styles.floatingAntennaContent}>
              {antennaPlacementPresetId ? (
                <div style={{
                  fontSize: "10px",
                  color: "#f59e0b",
                  backgroundColor: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.4)",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                }}>
                  <span>לחץ על המפה למיקום האנטנה</span>
                  <button
                    onClick={() => setAntennaPlacementPresetId(null)}
                    style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", fontWeight: "bold" }}
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)" }}>הוספת אנטנה חדשה</span>
                  <select
                    value={pendingAntennaPresetId}
                    onChange={(e) => setPendingAntennaPresetId(e.target.value)}
                    style={styles.adminSelect}
                  >
                    {ANTENNA_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      setAdminClickToMove(false);
                      setAntennaPlacementPresetId(pendingAntennaPresetId);
                    }}
                    style={{
                      backgroundColor: "rgba(245,158,11,0.15)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.4)",
                      borderRadius: "4px",
                      padding: "6px 8px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    📍 הצב על המפה
                  </button>
                </>
              )}

              {antennas.length > 0 && (
                <div style={{ borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px", marginTop: "2px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)" }}>אנטנות פרוסות ({antennas.length})</span>
                  {antennas.map((ant) => {
                    const preset = getAntennaPreset(ant.presetId);
                    const edited = computeIsEdited(ant, preset);
                    return (
                      <div
                        key={ant.id}
                        onClick={() => {
                          setSelectedAntenna(ant);
                          setAntennaEditDraft({ ...ant });
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "6px",
                          padding: "5px 7px",
                          borderRadius: "4px",
                          backgroundColor: selectedAntenna?.id === ant.id ? "rgba(245,158,11,0.12)" : "var(--neutral-3)",
                          border: `1px solid ${selectedAntenna?.id === ant.id ? "rgba(245,158,11,0.4)" : "var(--color-border-subtle)"}`,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ant.name}
                        </span>
                        {edited && (
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#e74c3c", flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating enemy activity heatmap widget above the map */}
        <div style={styles.floatingEnemyWidget}>
          <button style={styles.floatingEnemyToggle} onClick={() => setEnemyWidgetOpen(!enemyWidgetOpen)}>
            🎯 תמונת מצב אויב {enemyWidgetOpen ? "▲" : "▼"}
          </button>
          {enemyWidgetOpen && (
            <div style={styles.floatingEnemyContent}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)", display: "block", marginBottom: "6px" }}>
                  טווח תאריכים
                </span>
                <div style={styles.enemyQuickRangeRow}>
                  {(["24h", "7d", "30d"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        const durationsMs: Record<"24h" | "7d" | "30d", number> = {
                          "24h": 24 * 60 * 60 * 1000,
                          "7d": 7 * 24 * 60 * 60 * 1000,
                          "30d": 30 * 24 * 60 * 60 * 1000,
                        };
                        setEnemyDateRangeMode(mode);
                        setEnemyPendingRange(null);
                        setEnemyRangeEnd(MOCK_DATA_RANGE_END_MS);
                        setEnemyRangeStart(MOCK_DATA_RANGE_END_MS - durationsMs[mode]);
                      }}
                      style={{
                        ...styles.enemyQuickRangeBtn,
                        backgroundColor: enemyDateRangeMode === mode ? "#ff3d3d" : "var(--neutral-3)",
                        color: enemyDateRangeMode === mode ? "#fff" : "var(--color-text)",
                      }}
                    >
                      {mode === "24h" ? "24 ש'" : mode === "7d" ? "7 ימים" : "30 יום"}
                    </button>
                  ))}
                  <button
                    onClick={() => setEnemyDateRangeMode("custom")}
                    style={{
                      ...styles.enemyQuickRangeBtn,
                      backgroundColor: enemyDateRangeMode === "custom" ? "#ff3d3d" : "var(--neutral-3)",
                      color: enemyDateRangeMode === "custom" ? "#fff" : "var(--color-text)",
                    }}
                  >
                    מותאם
                  </button>
                </div>
                {enemyDateRangeMode === "custom" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                    <input
                      type="datetime-local"
                      value={msToDatetimeLocalValue(enemyRangeStart)}
                      onChange={(e) => {
                        const ms = datetimeLocalValueToMs(e.target.value);
                        if (ms !== null) setEnemyRangeStart(ms);
                      }}
                      style={{ ...styles.adminInput }}
                    />
                    <input
                      type="datetime-local"
                      value={msToDatetimeLocalValue(enemyRangeEnd)}
                      onChange={(e) => {
                        const ms = datetimeLocalValueToMs(e.target.value);
                        if (ms !== null) setEnemyRangeEnd(ms);
                      }}
                      style={{ ...styles.adminInput }}
                    />
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)", display: "block", marginBottom: "6px" }}>
                  סוג זיהוי
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {(
                    [
                      ["RADAR", 'מכ"ם'],
                      ["RF_FINDER", "איתור RF"],
                      ["OPTICAL", "אופטי"],
                      ["EXTERNAL_SYSTEM", "מערכת חיצונית"],
                    ] as [SensorType, string][]
                  ).map(([type, label]) => (
                    <label key={type} style={styles.layerCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={enemySensorTypeFilter.has(type)}
                        onChange={() =>
                          setEnemySensorTypeFilter((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) next.delete(type);
                            else next.add(type);
                            return next;
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)", display: "block", marginBottom: "6px" }}>
                  סטטוס IFF (תמונת אויב)
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {(
                    [
                      ["RED_CERTAIN", "אדום ודאי"],
                      ["RED_SUSPICIOUS", "חשד אדום"],
                      ["UNIDENTIFIED", "לא מזוהה"],
                    ] as [IffStatus, string][]
                  ).map(([status, label]) => (
                    <label key={status} style={styles.layerCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={enemyIffFilter.has(status)}
                        onChange={() =>
                          setEnemyIffFilter((prev) => {
                            const next = new Set(prev);
                            if (next.has(status)) next.delete(status);
                            else next.add(status);
                            return next;
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--color-text-muted)", display: "block", marginBottom: "6px" }}>
                  תצוגה
                </span>
                <div style={styles.enemyModeRow}>
                  {(
                    [
                      ["heat", "שכבת חום", Flame],
                      ["tracks", "נתיבי טיסה", Route],
                      ["combined", "משולב", Layers],
                    ] as [typeof enemyDisplayMode, string, typeof Flame][]
                  ).map(([mode, label, Icon]) => (
                    <button
                      key={mode}
                      onClick={() => setEnemyDisplayMode(mode)}
                      style={{
                        ...styles.enemyModeBtn,
                        backgroundColor: enemyDisplayMode === mode ? "#ff3d3d" : "var(--neutral-3)",
                        color: enemyDisplayMode === mode ? "#fff" : "var(--color-text)",
                      }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "7px" }}>
                {enemyDetections.length} גילויים בטווח שנבחר
              </div>
            </div>
          )}
        </div>

        {/* Floating admin control panel above the map */}
        <div style={styles.floatingAdmin}>
          <button style={styles.floatingAdminToggle} onClick={() => setAdminMenuOpen(!adminMenuOpen)}>
            ⚙️ לוח מנהלים {adminMenuOpen ? "▲" : "▼"}
          </button>
          {adminMenuOpen && (
            <div style={styles.floatingAdminContent}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ecf0f1", borderBottom: "1px solid var(--color-border)", paddingBottom: "6px", marginBottom: "6px", display: "block" }}>
                ניהול תרחישים ומיקומים
              </span>
              
              {/* Presets buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>טעינת תרחיש מהירה:</span>
                <button 
                  onClick={() => loadScenario('TAIBE_BEAUFORT')} 
                  style={styles.scenarioBtn}
                >
                  📍 אטייבה + בופור (לבנון)
                </button>
                <button 
                  onClick={() => loadScenario('DEFAULT_METULA')} 
                  style={styles.scenarioBtn}
                >
                  📍 כפר גלעדי (מטולה)
                </button>
              </div>

              {/* Draggable notice */}
              <div style={{ fontSize: "10px", color: "#22d3ee", backgroundColor: "rgba(34, 211, 238, 0.1)", padding: "6px", borderRadius: "4px", marginBottom: "10px", textAlign: "center" }}>
                💡 ניתן לגרור את הסמלים על גבי המפה!
              </div>

              {/* Selector for individual forces / drones */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>בחירת כוח/רחפן לעריכה:</span>
                <select 
                  value={selectedAdminItem ? `${selectedAdminItem.type}:${selectedAdminItem.id}` : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedAdminItem(null);
                    } else {
                      const [type, id] = val.split(':');
                      setSelectedAdminItem({ type: type as any, id });
                    }
                  }}
                  style={styles.adminSelect}
                >
                  <option value="">-- בחר אלמנט --</option>
                  <optgroup label="כוחות קרקע">
                    {groundForces.map(gf => (
                      <option key={`gf-${gf.id}`} value={`gf:${gf.id}`}>🛡️ {gf.id}</option>
                    ))}
                  </optgroup>
                  <optgroup label="רחפנים ומטרות">
                    {tracks.map(t => (
                      <option key={`t-${t.id}`} value={`track:${t.id}`}>{t.iffStatus.startsWith('BLUE') ? '🛸' : '⚠️'} {t.id}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Coordinates Editor */}
              {selectedAdminItem && (() => {
                const item = selectedAdminItem.type === 'gf' 
                  ? groundForces.find(g => g.id === selectedAdminItem.id)
                  : tracks.find(t => t.id === selectedAdminItem.id);
                
                if (!item) return null;

                const lat = selectedAdminItem.type === 'gf' 
                  ? (item as any).coordinates[0]
                  : (item as any).coordinates.lat;
                
                const lng = selectedAdminItem.type === 'gf' 
                  ? (item as any).coordinates[1]
                  : (item as any).coordinates.lng;

                const updateCoords = (newLat: number, newLng: number) => {
                  if (selectedAdminItem.type === 'gf') {
                    setGroundForces(prev => prev.map(g => g.id === selectedAdminItem.id ? { ...g, coordinates: [newLat, newLng] } : g));
                  } else {
                    setTracks(prev => prev.map(t => t.id === selectedAdminItem.id ? { ...t, coordinates: { ...t.coordinates, lat: newLat, lng: newLng } } : t));
                  }
                };

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginTop: "10px", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ecf0f1" }}>מיקום עבור: {selectedAdminItem.id}</span>
                    
                    <div style={{ display: "flex", gap: "6px" }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>קו רוחב (Lat):</span>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={lat} 
                          onChange={(e) => updateCoords(parseFloat(e.target.value) || lat, lng)}
                          style={styles.adminInput}
                        />
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>קו אורך (Lng):</span>
                        <input 
                          type="number" 
                          step="0.0001"
                          value={lng} 
                          onChange={(e) => updateCoords(lat, parseFloat(e.target.value) || lng)}
                          style={styles.adminInput}
                        />
                      </div>
                    </div>

                    {/* Click-to-move checkbox */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                      <input 
                        type="checkbox" 
                        id="click-to-move-chk"
                        checked={adminClickToMove}
                        onChange={(e) => {
                          setAdminClickToMove(e.target.checked);
                          if (e.target.checked) setAntennaPlacementPresetId(null);
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <label htmlFor="click-to-move-chk" style={{ fontSize: "11px", fontWeight: "bold", color: "#22d3ee", cursor: "pointer", userSelect: "none" }}>
                        🎯 הזזה מהירה בלחיצה על המפה
                      </label>
                    </div>

                    <button 
                      onClick={() => setFlyToTarget([lat, lng, 14])}
                      style={styles.adminFocusBtn}
                    >
                      🔍 מיקוד במפה
                    </button>
                  </div>
                );
              })()}

            </div>
          )}
        </div>

        <div style={{ flex: 1, width: "100%", height: showGantt ? "calc(100% - 280px)" : "100%", position: "relative" }}>
          <MapContainer
            center={[33.295, 35.535]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
          >
            <MapResizeController showGantt={showGantt} />
            {/* Map controller for programmatic fly-to */}
            <MapFlyController target={flyToTarget} onDone={() => setFlyToTarget(null)} />

            <MapClickHandler
              enabled={adminClickToMove && !!selectedAdminItem}
              onMapClick={(lat, lng) => {
                if (!selectedAdminItem) return;
                if (selectedAdminItem.type === 'gf') {
                  setGroundForces(prev => prev.map(g => g.id === selectedAdminItem.id ? { ...g, coordinates: [lat, lng] } : g));
                } else {
                  setTracks(prev => prev.map(t => t.id === selectedAdminItem.id ? { ...t, coordinates: { ...t.coordinates, lat, lng } } : t));
                }
              }}
            />

            <MapClickHandler
              enabled={isDrawingNewPolygon || isEditingPoints}
              onMapClick={(lat, lng) => {
                if (isDrawingNewPolygon) {
                  setNewPolygonPoints(prev => [...prev, [lat, lng]]);
                } else if (isEditingPoints) {
                  setCurrentEditPoints(prev => [...prev, [lat, lng]]);
                }
              }}
            />

            <MapClickHandler
              enabled={!!antennaPlacementPresetId}
              onMapClick={(lat, lng) => {
                const preset = getAntennaPreset(antennaPlacementPresetId!);
                if (!preset) return;
                const draft: RFAntenna = {
                  id: `ant-${Date.now()}`,
                  presetId: preset.id,
                  name: preset.name,
                  coordinates: [lat, lng],
                  freqMHz: preset.freqMHz,
                  powerDbm: preset.powerDbm,
                  gainDbi: preset.gainDbi,
                  beamwidthDeg: preset.beamwidthDeg,
                  heightM: preset.defaultHeightM,
                  azimuthDeg: 0,
                };
                setAntennaEditDraft(draft);
                setSelectedAntenna(draft);
                setSelectedTrack(null);
                setSelectedSensor(null);
                setAntennaPlacementPresetId(null);
              }}
            />

          {mapStyle === "MILITARY" && (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}
          {mapStyle === "TOPOGRAPHIC" && (
            <TileLayer
              attribution='Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          )}
          {mapStyle === "REGULAR" && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {/* Render Approved Corridors */}
          {showCorridors &&
            [...zones.filter((z) => z.type === "CORRIDOR"), ...approvedCorridors]
              .filter((z) => z.id !== `approved-${editRequestId}`)
              .map((z) => {
                const reqId = z.id.replace("approved-", "");
                const flightId = reqId.replace("req", "flight");
                const flight = flights.find((f) => f.id === flightId || f.id === z.id);

                let color = z.color;
                let fillOpacity = 0.12;
                let dashArray = "4, 4";
                let weight = 3;

                if (flight?.status === "LANDED") {
                  color = "#7f8c8d";
                  fillOpacity = 0.03;
                  dashArray = "10, 10";
                } else if (flight?.status === "COMMS_LOSS") {
                  color = "#f1c40f";
                  fillOpacity = 0.18;
                  dashArray = "2, 8";
                  weight = 4;
                } else if (color === "#186eff" || z.id.startsWith("approved-")) {
                  color = "#4589ff";
                  fillOpacity = 0.05;
                }

                const matchingReq = requests.find((r) => r.id === reqId);
                const isSelected = !!matchingReq && selectedRequestItem?.id === matchingReq.id;
                if (isSelected) {
                  fillOpacity = Math.max(fillOpacity, 0.18);
                  weight = 4;
                  dashArray = "6, 4";
                }

                return (
                  <Polygon
                    key={z.id}
                    positions={z.geometry}
                    pathOptions={{ color, fillColor: color, fillOpacity, dashArray, weight }}
                    eventHandlers={{
                      click: () => {
                        if (matchingReq) {
                          handleRequestClick(matchingReq);
                        }
                      },
                      contextmenu: (e: any) => {
                        if (matchingReq) {
                          e.originalEvent.preventDefault();
                          setContextMenu({
                            x: e.originalEvent.clientX,
                            y: e.originalEvent.clientY,
                            reqId: matchingReq.id,
                            polygonName: matchingReq.operatorName || matchingReq.id,
                            status: matchingReq.status
                          });
                        }
                      }
                    }}
                  >
                  <Tooltip direction="top" opacity={0.9}>
                    <div style={{ direction: "rtl", fontSize: "11px", fontWeight: "bold" }}>
                      מרחב מאושר {z.name}<br/>
                      <span style={{ fontWeight: "normal", color: "#ccc" }}>לחץ לצפייה בפרטי הבקשה</span>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

          {/* Render Active Request Polygons (Pending & Conflict) */}
          {requests
            .filter((r) => r.status === "PENDING_REVIEW" || r.status === "CONFLICT")
            .map((r) => {
              const geom = getRequestGeometry(r);
              const isSelected = selectedRequestItem?.id === r.id;
              
              const isConflict = r.status === "CONFLICT";
              const color = isConflict ? "var(--orange-9)" : "var(--yellow-9)";
              const fillOpacity = isSelected ? 0.22 : 0.08;
              const weight = isSelected ? 4 : 2;
              const dashArray = isSelected ? "6, 4" : "4, 4";

              return (
                <Polygon
                  key={`req-map-poly-${r.id}`}
                  positions={geom}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity,
                    weight,
                    dashArray,
                  }}
                  eventHandlers={{
                    click: () => {
                      handleRequestClick(r);
                    },
                    contextmenu: (e: any) => {
                      e.originalEvent.preventDefault();
                      setContextMenu({
                        x: e.originalEvent.clientX,
                        y: e.originalEvent.clientY,
                        reqId: r.id,
                        polygonName: r.operatorName || r.id,
                        status: r.status
                      });
                    }
                  }}
                >
                  <Tooltip direction="top" opacity={0.9}>
                    <div style={{ direction: "rtl", fontSize: "11px", fontWeight: "bold" }}>
                      בקשת טיסה {r.id}: {r.operatorName}<br/>
                      <span style={{ fontWeight: "normal", color: "#ccc" }}>
                        סטטוס: {isConflict ? "קונפליקט" : "ממתין לבחינה"}
                      </span>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

          {/* Render real-time drawing polygon */}
          {isDrawingNewPolygon && newPolygonPoints.length > 0 && (
            <>
              {newPolygonPoints.length >= 3 ? (
                <Polygon
                  positions={newPolygonPoints}
                  pathOptions={{
                    color: "var(--yellow-9)",
                    fillColor: "var(--yellow-9)",
                    fillOpacity: 0.15,
                    weight: 3,
                    dashArray: "5, 5"
                  }}
                />
              ) : (
                <Polyline
                  positions={newPolygonPoints}
                  pathOptions={{
                    color: "var(--yellow-9)",
                    weight: 3,
                    dashArray: "5, 5"
                  }}
                />
              )}
              {newPolygonPoints.map((pt, idx) => (
                <Marker
                  key={`draw-handle-${idx}-${pt[0]}-${pt[1]}`}
                  position={pt}
                  icon={createEditHandleIcon(idx + 1, "var(--yellow-9)")}
                />
              ))}
            </>
          )}

          {/* Render real-time editing vertices handles */}
          {isEditingPoints && currentEditPoints.length > 0 && (
            <>
              {currentEditPoints.length >= 3 ? (
                <Polygon
                  positions={currentEditPoints}
                  pathOptions={{
                    color: "var(--yellow-9)",
                    fillColor: "var(--yellow-9)",
                    fillOpacity: 0.22,
                    weight: 4,
                    dashArray: "6, 4"
                  }}
                />
              ) : (
                <Polyline
                  positions={currentEditPoints}
                  pathOptions={{
                    color: "var(--yellow-9)",
                    weight: 4,
                    dashArray: "6, 4"
                  }}
                />
              )}
              {currentEditPoints.map((pt, idx) => (
                <Marker
                  key={`edit-handle-${idx}-${pt[0]}-${pt[1]}`}
                  position={pt}
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      setCurrentEditPoints((prev) => {
                        const next = [...prev];
                        next[idx] = [position.lat, position.lng];
                        return next;
                      });
                    }
                  }}
                  icon={createEditHandleIcon(idx + 1, "var(--yellow-9)")}
                />
              ))}
            </>
          )}

          {/* Render NFZs */}
          {showNFZ &&
            zones
              .filter((z) => z.type === "NFZ")
              .map((z) => (
                <Polygon
                  key={z.id}
                  positions={z.geometry}
                  pathOptions={{ color: z.color, fillColor: z.color, fillOpacity: 0.18 }}
                />
              ))}

          {/* Render EW Jamming Zone */}
          {showSpectrum && (
            <Circle
              center={[33.245, 35.560]}
              radius={1200}
              pathOptions={{ color: "#9b59b6", fillColor: "#9b59b6", fillOpacity: 0.10, dashArray: "4, 8" }}
            >
              <Tooltip direction="top" opacity={0.9}>
                <div style={{ direction: "rtl", fontSize: "11px", fontWeight: "bold" }}>
                  חסימת ל"א (ספקטרום)<br/>
                  <span style={{ fontWeight: "normal", color: "#555" }}>רדיוס השפעה: 1200 מטר</span>
                </div>
              </Tooltip>
            </Circle>
          )}

          {/* Render Ground Forces Flight Polygons (Removed as requested) */}

          {/* Render Ground Forces */}
          {showGroundForces &&
            groundForces.map((gf, index) => (
              <Marker
                key={gf.id}
                position={gf.coordinates}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    setGroundForces((prev) => {
                      const next = [...prev];
                      next[index] = { ...next[index], coordinates: [position.lat, position.lng] };
                      return next;
                    });
                  }
                }}
                icon={createGroundForceIcon(gf.id)}
              />
            ))}

          {/* Render Sensor Coverage Ranges */}
          {showSensors &&
            sensors.map((s) => {
              const isMarked = selectedSensor?.id === s.id;
              return (
                <Circle
                  key={`range-${s.id}`}
                  center={s.coordinates}
                  radius={s.rangeMeters || 1000}
                  pathOptions={
                    isMarked
                      ? { color: s.color, fillColor: s.color, fillOpacity: 0.22, weight: 3, dashArray: undefined }
                      : { color: s.color, fillColor: s.color, fillOpacity: 0.08, weight: 1.5, dashArray: "3, 6" }
                  }
                >
                  <Tooltip direction="top" opacity={0.9}>
                    <div style={{ direction: "rtl", fontSize: "11px", fontWeight: "bold" }}>
                      {s.name}<br/>
                      <span style={{ fontWeight: "normal", color: "#7f8c8d" }}>רדיוס כיסוי: {s.rangeMeters} מטר</span>
                    </div>
                  </Tooltip>
                </Circle>
              );
            })}

          {/* Render Sensor Towers */}
          {showSensors &&
            sensors.map((s) => (
              <Marker
                key={s.id}
                position={s.coordinates}
                icon={createSensorIcon(s.type, s.color, s.name)}
                eventHandlers={{
                  click: () => {
                    setSelectedSensor(s);
                    setSelectedTrack(null);
                  },
                }}
              />
            ))}

          {/* RF antenna coverage + markers — includes the in-progress placement draft, if any,
              so the placing user sees it before saving (it isn't in `antennas`/synced yet) */}
          {showAntennas &&
            [...antennas, ...(antennaEditDraft && !antennas.some(a => a.id === antennaEditDraft.id) ? [antennaEditDraft] : [])].map((ant) => {
              const rangeMeters = computeEffectiveRangeMeters(ant);
              const omni = isOmniAntenna(ant.beamwidthDeg);
              return (
                <React.Fragment key={ant.id}>
                  {omni ? (
                    <Circle
                      center={ant.coordinates}
                      radius={rangeMeters}
                      pathOptions={{ color: ANTENNA_MARKER_COLOR, fillColor: ANTENNA_MARKER_COLOR, fillOpacity: 0.08, weight: 1.5, dashArray: "3, 6" }}
                    />
                  ) : (
                    <Polygon
                      positions={buildSectorPolygon(ant.coordinates, ant.azimuthDeg, ant.beamwidthDeg, rangeMeters)}
                      pathOptions={{ color: ANTENNA_MARKER_COLOR, fillColor: ANTENNA_MARKER_COLOR, fillOpacity: 0.12, weight: 1.5 }}
                    />
                  )}
                  <Marker
                    position={ant.coordinates}
                    icon={createAntennaIcon(ant)}
                    draggable={true}
                    eventHandlers={{
                      click: () => {
                        setSelectedAntenna(ant);
                        setAntennaEditDraft({ ...ant });
                        setSelectedTrack(null);
                        setSelectedSensor(null);
                      },
                      dragend: (e) => {
                        const pos = e.target.getLatLng();
                        const coordinates: [number, number] = [pos.lat, pos.lng];
                        const moved: RFAntenna = { ...ant, coordinates };
                        if (selectedAntenna?.id === ant.id) {
                          setSelectedAntenna(moved);
                          setAntennaEditDraft((prev) => (prev ? { ...prev, coordinates } : prev));
                        }
                        // Only already-saved antennas sync immediately on drop — an in-progress
                        // placement draft isn't in the store yet, so it stays local until "שמור".
                        if (antennas.some((a) => a.id === ant.id)) {
                          onUpsertAntenna?.(moved);
                        }
                      },
                    }}
                  />
                </React.Fragment>
              );
            })}

          {/* Enemy activity heatmap — density-binned points feed leaflet.heat imperatively;
              track polylines are plain declarative Polylines like the rest of this file. */}
          {showEnemyHeatmap && (enemyDisplayMode === "heat" || enemyDisplayMode === "combined") && (
            <EnemyHeatLayerController points={enemyHeatPoints} />
          )}
          {showEnemyHeatmap && (enemyDisplayMode === "tracks" || enemyDisplayMode === "combined") &&
            enemyTrackGroups.map((track) => (
              <Polyline
                key={track.trackId}
                positions={track.points}
                pathOptions={{ color: enemyTrackColor(track.iffStatus), weight: 2.5, dashArray: "5, 4" }}
              >
                <Tooltip direction="top" opacity={0.9}>
                  <div style={{ direction: "rtl", fontSize: "11px", fontWeight: "bold" }}>
                    מסלול {track.trackId}<br />
                    <span style={{ fontWeight: "normal", color: "#ccc" }}>{track.points.length} גילויים</span>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

          {/* Highlight Selected Request Polygon — only for statuses not already rendered above
              (PENDING_REVIEW/CONFLICT and APPROVED/ACTIVE get their own selection styling in place,
              so drawing a second polygon on top of those would double up into one big frame) */}
          {selectedRequestItem && (
            selectedRequestItem.status === "REJECTED" ||
            selectedRequestItem.status === "EXPIRED" ||
            selectedRequestItem.status === "COMPLETED"
          ) && (
            <Polygon
              positions={getRequestGeometry(selectedRequestItem)}
              pathOptions={{
                color: statusConfig[selectedRequestItem.status].color,
                fillColor: statusConfig[selectedRequestItem.status].color,
                fillOpacity: 0.12,
                weight: 3,
                dashArray: "6, 4",
              }}
            />
          )}

          {/* Israel-Lebanon Border Line (הקו הכחול / הגבול) */}
          <Polyline
            positions={[
              [33.245, 35.520],
              [33.255, 35.545],
              [33.272, 35.560],
              [33.278, 35.580],
              [33.272, 35.598],
              [33.250, 35.605],
              [33.220, 35.620]
            ]}
            pathOptions={{
              color: "#ffffff",
              weight: 6,
              opacity: 0.5,
            }}
          />
          <Polyline
            positions={[
              [33.245, 35.520],
              [33.255, 35.545],
              [33.272, 35.560],
              [33.278, 35.580],
              [33.272, 35.598],
              [33.250, 35.605],
              [33.220, 35.620]
            ]}
            pathOptions={{
              color: "#000000",
              weight: 3.5,
              opacity: 1,
              dashArray: "8, 5",
            }}
          />

          {/* Render Flight Paths / Trails for Friendlies */}
          {tracks
            .filter((t) => t.iffStatus === "BLUE_CERTAIN" && t.history && t.history.length > 1)
            .map((t) => (
              <Polyline
                key={`trail-${t.id}`}
                positions={t.history!}
                pathOptions={{ color: "#186eff", weight: 2, opacity: 0.6 }}
              />
            ))}

          {/* Render Active Drones */}
          {showDrones &&
            [...tracks, ...liveTracks].map((t) => {
              const isMockTrack = tracks.some(mt => mt.id === t.id);
              return (
                <Marker
                  key={t.id}
                  position={[t.coordinates.lat, t.coordinates.lng]}
                  icon={createTrackIcon(t, getIFFColor(t.iffStatus))}
                  draggable={isMockTrack}
                  eventHandlers={{
                    click: () => {
                      setSelectedTrack(t);
                      setSelectedSensor(null);
                    },
                    dragend: (e) => {
                      if (!isMockTrack) return;
                      const marker = e.target;
                      const position = marker.getLatLng();
                      setTracks((prev) =>
                        prev.map((mt) =>
                          mt.id === t.id
                            ? {
                                ...mt,
                                coordinates: {
                                  ...mt.coordinates,
                                  lat: position.lat,
                                  lng: position.lng,
                                },
                              }
                            : mt
                        )
                      );
                    }
                  }}
                />
              );
            })}
          </MapContainer>
        </div>

        {showGantt && (
          <div style={{ height: 280, width: "100%", flexShrink: 0, zIndex: 1010 }}>
            <GanttChartPanel
              requests={requests || []}
              flights={flights || []}
              onClose={onGanttToggle || (() => {})}
              onFocusLocation={(lat, lng) => setFlyToTarget([lat, lng, 15])}
            />
          </div>
        )}

        {showEnemyHeatmap && (
          <div style={{
            display: "flex",
            alignItems: "center",
            height: "40px",
            width: "100%",
            flexShrink: 0,
            zIndex: 1010,
            backgroundColor: "var(--color-bg-card)",
            borderTop: "1px solid var(--color-border)",
          }}>
            <EnemyTimelineScrubber
              boundsStart={MOCK_DATA_RANGE_START_MS}
              boundsEnd={MOCK_DATA_RANGE_END_MS}
              rangeStart={enemyPendingRange?.start ?? enemyRangeStart}
              rangeEnd={enemyPendingRange?.end ?? enemyRangeEnd}
              onChange={(start, end) => {
                setEnemyDateRangeMode("custom");
                setEnemyPendingRange({ start, end });
              }}
            />
          </div>
        )}

        {/* Floating details card — top-left of the map, pointer-events only on card itself */}
        {(selectedTrack || selectedSensor) && (
          <div style={styles.floatingDetailsCard}>
            {selectedTrack ? (
              <>
                {/* Card header with IFF color accent */}
                <div style={{
                  ...styles.floatingCardHeader,
                  borderBottom: `2px solid ${getIFFColor(selectedTrack.iffStatus)}`,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", color: "#7f8c8d", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Radio size={10} color="#38bdf8" /> כרטיס פרטי מטרה / רחפן
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: "#ecf0f1" }}>
                      {selectedTrack.id.split(" - ")[0]}
                    </span>
                    {selectedTrack.id.includes(" - ") && (
                      <span style={{ fontSize: "11px", color: "#95a5a6" }}>
                        {selectedTrack.id.split(" - ")[1]}
                      </span>
                    )}
                  </div>
                  <button
                    style={{ ...styles.floatingCloseBtn, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => { setSelectedTrack(null); setSelectedSensor(null); }}
                    title="סגור כרטיס"
                  ><X size={14} /></button>
                </div>

                <div style={styles.floatingCardBody}>
                  {/* Status Badges & Last Update Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    {(() => {
                      const iff = getIFFHebrewDetails(selectedTrack.iffStatus);
                      return (
                        <span style={{
                          backgroundColor: iff.bg,
                          color: iff.color,
                          fontSize: "10px",
                          fontWeight: "bold",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          letterSpacing: "0.3px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}>
                          {iff.text}
                        </span>
                      );
                    })()}
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2ecc71", boxShadow: "0 0 6px #2ecc71" }}></span>
                      עדכון: <strong style={{ color: "#ecf0f1" }}>{selectedTrack.lastUpdateTimestamp || "עכשיו"}</strong>
                    </span>
                  </div>

                  {/* Real-time Altitude Graph */}
                  <AltitudeGraph altHistory={selectedTrack.altHistory} currentAlt={selectedTrack.coordinates.altMsl} />

                  {/* Telemetry & Identity Grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "rgba(255,255,255,0.02)", padding: "6px 8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}><Plane size={11} style={{ marginLeft: "4px" }} /> סוג רחפן</span>
                      <span style={{ ...styles.floatingDataValue, fontWeight: "bold", color: "#ecf0f1" }}>{selectedTrack.type}</span>
                    </div>

                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}><Gauge size={11} style={{ marginLeft: "4px" }} /> מהירות (קמ"ש)</span>
                      <span style={{ ...styles.floatingDataValue, color: "#2ecc71", fontWeight: "bold" }}>
                        {Math.round((selectedTrack.speedKts || 0) * 1.852)} קמ"ש ({selectedTrack.speedKts} קשר)
                      </span>
                    </div>

                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}><Wifi size={11} style={{ marginLeft: "4px" }} /> פרוטוקול תקשורת</span>
                      <span style={{ ...styles.floatingDataValue, color: "#38bdf8", fontSize: "10px" }}>
                        {selectedTrack.protocol || "OcuSync 3.0 (Encrypted)"}
                      </span>
                    </div>

                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}><Clock size={11} style={{ marginLeft: "4px" }} /> זמן התחלה</span>
                      <span style={styles.floatingDataValue}>{selectedTrack.startTime || "10:15:00"}</span>
                    </div>

                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}><Clock size={11} style={{ marginLeft: "4px" }} /> עדכון אחרון</span>
                      <span style={{ ...styles.floatingDataValue, color: "#f1c40f" }}>
                        {selectedTrack.lastUpdateTimestamp || "עכשיו"} (לפני 0 ש')
                      </span>
                    </div>

                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}>כיוון טיסה</span>
                      <span style={styles.floatingDataValue}>{selectedTrack.heading}°</span>
                    </div>

                    <div style={styles.floatingDataRow}>
                      <span style={styles.floatingDataLabel}>קואורדינטות</span>
                      <span style={{ ...styles.floatingDataValue, fontFamily: "monospace", fontSize: "10px" }}>
                        {selectedTrack.coordinates.lat.toFixed(4)}, {selectedTrack.coordinates.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Detecting Sensors Accordion Drawer */}
                  {(() => {
                    const sensorList = getDetectingSensorsForTrack(selectedTrack, sensors);
                    return (
                      <div style={{ marginTop: "6px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", overflow: "hidden" }}>
                        <button
                          onClick={() => setSensorsDrawerOpen(!sensorsDrawerOpen)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            backgroundColor: "rgba(30, 41, 59, 0.8)",
                            border: "none",
                            color: "#e2e8f0",
                            fontSize: "11px",
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Cpu size={12} color="#f59e0b" /> חיישנים מגלים ({sensorList.length})
                          </span>
                          {sensorsDrawerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {sensorsDrawerOpen && (
                          <div style={{ padding: "8px", backgroundColor: "rgba(15, 23, 42, 0.9)", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {sensorList.map((sens) => {
                              const fullSensor = sensors.find((sv) => sv.id === sens.id);
                              return (
                                <div key={sens.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: "bold" }}>
                                    <span style={{ color: "#f1c40f" }}>{sens.name}</span>
                                    {fullSensor && (
                                      <button
                                        onClick={() => {
                                          setSelectedSensor(fullSensor);
                                          setFlyToTarget([fullSensor.coordinates[0], fullSensor.coordinates[1], 15]);
                                        }}
                                        title="קפוץ למיקום החיישן"
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          padding: "2px",
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        <Crosshair size={12} color="#38bdf8" />
                                      </button>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>
                                    {sens.detectionMethod}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Tiger Procedure Tracking section */}
                {tigerTrackId === selectedTrack.id && (
                  <div style={{
                    margin: "8px 12px",
                    padding: "10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(231, 76, 60, 0.1)",
                    border: "1px dashed #e74c3c",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "bold", color: "#e74c3c", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span className="pulse-dot" style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#e74c3c" }}></span>
                        נוהל נמר פעיל
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: tigerTimer > 0 ? "#e74c3c" : "#fff", backgroundColor: tigerTimer > 0 ? "rgba(231,76,60,0.2)" : "#e74c3c", padding: "2px 6px", borderRadius: "4px" }}>
                        {tigerTimer > 0 ? `${tigerTimer} ש' להנחיה` : "פג תוקף הנחיה!"}
                      </span>
                    </div>

                    {/* Friendly Drones in Corridor Confirmation list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "11px", color: "#a0a0a0", fontWeight: "bold", borderBottom: "1px solid #2e2e38", paddingBottom: "4px", display: "block" }}>
                        סטטוס תגובת כוחותינו:
                      </span>
                      {(() => {
                        const threatCorr = approvedCorridors.find((c) =>
                          isPointInPolygon([selectedTrack.coordinates.lat, selectedTrack.coordinates.lng], c.geometry)
                        );
                        if (!threatCorr) {
                          return <span style={{ fontSize: "10px", color: "#7f8c8d" }}>אין פוליגון חופף למיקום המטרה</span>;
                        }
                        
                        const friendlyDrones = flights.filter((f) => {
                          const reqId = f.id.replace("flight", "req");
                          return threatCorr.id === `approved-${reqId}` && (f.status === "ACTIVE" || f.status === "COMMS_LOSS" || f.status === "ANOMALOUS");
                        });

                        if (friendlyDrones.length === 0) {
                          return <span style={{ fontSize: "10px", color: "#7f8c8d" }}>אין רחפנים פעילים בפוליגון זה</span>;
                        }

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {friendlyDrones.map((fd) => {
                              let statusText = "טרם התקבל";
                              let statusColor = "#e67e22"; // Orange (no response yet)
                              let detailsEl = null;

                              if (fd.tigerStatus === "PENDING") {
                                statusText = "הנחיה התקבלה";
                                statusColor = "#3498db"; // Blue
                              } else if (fd.tigerStatus === "CONFIRMED" || fd.tigerStatus === "EXECUTED") {
                                statusText = `בוצע (+100מ' - ${fd.currentAlt}מ')`;
                                statusColor = "#2ecc71"; // Green
                              } else if (fd.tigerStatus === "CANNOT_EXECUTE") {
                                statusText = "לא ניתן לביצוע";
                                statusColor = "#e74c3c"; // Red
                                detailsEl = (
                                  <div style={{ fontSize: "10px", color: "#f1c40f", backgroundColor: "rgba(241,196,15,0.08)", padding: "4px 8px", borderRadius: "4px", marginTop: "2px", borderRight: "2px solid #f1c40f", textAlign: "right" }}>
                                    <strong>סיבה:</strong> {fd.tigerReason || "לא צוינה סיבה"}
                                  </div>
                                );
                              }

                              return (
                                <div key={fd.id} style={{ borderBottom: "1px solid #2e2e38", paddingBottom: "6px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                                    <span style={{ color: "#ecf0f1", fontWeight: "bold" }}>
                                      {fd.operatorName} ({fd.unit})
                                    </span>
                                    <span style={{ fontWeight: "bold", color: statusColor }}>
                                      {statusText}
                                    </span>
                                  </div>
                                  {detailsEl}
                                </div>
                              );
                            })}

                            {/* Operational Classification and Escalation Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                              <button
                                onClick={() => handleAction("BLUE", selectedTrack)}
                                style={{
                                  width: "100%",
                                  backgroundColor: "#2ecc71",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "6px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 4px rgba(46, 204, 113, 0.2)"
                                }}
                              >
                                סווג ככחול בסבירות גבוהה
                              </button>
                              <button
                                onClick={() => handleAction("HAMMER", selectedTrack)}
                                style={{
                                  width: "100%",
                                  backgroundColor: "#e74c3c",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "6px",
                                  fontSize: "11px",
                                  fontWeight: "bold",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 4px rgba(231, 76, 60, 0.2)"
                                }}
                              >
                                הסלם לפטיש אוויר (יירוט/שיבוש)
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Action buttons — threats & unidentified */}
                {(selectedTrack.iffStatus.startsWith("RED") || selectedTrack.iffStatus === "UNIDENTIFIED") && (
                  <div style={styles.floatingCardActions}>
                    <button
                      onClick={() => handleAction("TIGER", selectedTrack)}
                      style={{ ...styles.floatingActionBtn, backgroundColor: "#e74c3c" }}
                    >נוהל נמר</button>
                    <button
                      onClick={() => handleAction("HAMMER", selectedTrack)}
                      style={{ ...styles.floatingActionBtn, backgroundColor: "#d35400" }}
                    >פטיש אוויר</button>
                    <button
                      onClick={() => handleAction("BLUE", selectedTrack)}
                      style={{ ...styles.floatingActionBtn, backgroundColor: "#2980b9" }}
                    >זהה כחברותי</button>
                    <button
                      onClick={() => handleCloseIncident(selectedTrack.id)}
                      style={{ ...styles.floatingActionBtn, backgroundColor: "#555" }}
                    >סגור אירוע</button>
                  </div>
                )}

                {/* Action buttons — friendly drones */}
                {selectedTrack.iffStatus.startsWith("BLUE") && (
                  <div style={styles.floatingCardActions}>
                    <button
                      onClick={() => {
                        onTriggerAlert(`נוהל נמר הופעל עבור רחפן: ${selectedTrack.id}`, {
                          alertType: "TIGER",
                          threatLocation: { lat: selectedTrack.coordinates.lat, lng: selectedTrack.coordinates.lng }
                        });
                        // Associate the emergency with the first active hostile/unidentified threat, or fallback to the first track
                        const threat = tracks.find(t => t.iffStatus === "UNIDENTIFIED" || t.iffStatus.startsWith("RED"));
                        const targetTrackId = threat ? threat.id : (tracks[0]?.id || selectedTrack.id);
                        setTigerTrackId(targetTrackId);
                        setTigerTimer(15);
                      }}
                      style={{ ...styles.floatingActionBtn, backgroundColor: "#e74c3c" }}
                    >נוהל נמר</button>
                    <button
                      onClick={() => handleRemoveDrone(selectedTrack.id)}
                      style={{ ...styles.floatingActionBtn, backgroundColor: "#c0392b" }}
                    >הסר רחפן</button>
                  </div>
                )}
              </div>
            </>
            ) : selectedSensor ? (
              <>
                <div style={{ ...styles.floatingCardHeader, borderBottom: `2px solid ${selectedSensor.color}` }}>
                   <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "10px", color: "#7f8c8d", textTransform: "uppercase" }}>סנסור {selectedSensor.type}</span>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: "#ecf0f1" }}>{selectedSensor.name.split(" (")[0]}</span>
                  </div>
                  <button
                    style={{ ...styles.floatingCloseBtn, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => setSelectedSensor(null)}
                    title="סגור"
                  ><X size={14} /></button>
                </div>
                <div style={styles.floatingCardBody}>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>סוג</span>
                    <span style={styles.floatingDataValue}>{selectedSensor.type}</span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>טווח גילוי</span>
                    <span style={{ ...styles.floatingDataValue, color: selectedSensor.color, fontWeight: "bold" }}>
                      {selectedSensor.rangeMeters?.toLocaleString()}מ'
                    </span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>סטטוס</span>
                    <span style={{ ...styles.floatingDataValue, color: selectedSensor.status === "ACTIVE" ? "#2ecc71" : "#e74c3c" }}>
                      {selectedSensor.status === "ACTIVE" ? "פעיל" : "תחזוקה"}
                    </span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>קוודינטות</span>
                    <span style={{ ...styles.floatingDataValue, fontFamily: "monospace", fontSize: "10px" }}>
                      {selectedSensor.coordinates[0].toFixed(4)}, {selectedSensor.coordinates[1].toFixed(4)}
                    </span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>מטרות בטווח</span>
                    <span style={{ ...styles.floatingDataValue, color: "#e74c3c", fontWeight: "bold" }}>
                      {[...tracks, ...liveTracks].filter(t =>
                        Math.abs(t.coordinates.lat - selectedSensor.coordinates[0]) < (selectedSensor.rangeMeters! / 111000) &&
                        Math.abs(t.coordinates.lng - selectedSensor.coordinates[1]) < (selectedSensor.rangeMeters! / 111000)
                      ).length}
                    </span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {selectedAntenna && antennaEditDraft && (() => {
          const preset = getAntennaPreset(antennaEditDraft.presetId);
          const edited = computeIsEdited(antennaEditDraft, preset);
          const existsInStore = antennas.some((a) => a.id === antennaEditDraft.id);
          const rangeMeters = computeEffectiveRangeMeters(antennaEditDraft);
          const numField = (label: string, key: keyof RFAntenna, step = 1, min?: number, max?: number) => (
            <div style={styles.floatingDataRow}>
              <span style={styles.floatingDataLabel}>{label}</span>
              <input
                type="number"
                step={step}
                min={min}
                max={max}
                value={antennaEditDraft[key] as number}
                onChange={(e) => setAntennaEditDraft({ ...antennaEditDraft, [key]: parseFloat(e.target.value) || 0 })}
                style={{ ...styles.adminInput, width: "110px" }}
              />
            </div>
          );
          return (
            <div style={{ ...styles.floatingDetailsCard, width: "300px" }}>
              <div style={{ ...styles.floatingCardHeader, borderBottom: `2px solid ${ANTENNA_MARKER_COLOR}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "10px", color: "#7f8c8d", textTransform: "uppercase" }}>אנטנת RF — {preset?.name}</span>
                  <input
                    type="text"
                    value={antennaEditDraft.name}
                    onChange={(e) => setAntennaEditDraft({ ...antennaEditDraft, name: e.target.value })}
                    style={{ ...styles.adminInput, fontSize: "13px", fontWeight: "bold", padding: "3px 6px" }}
                  />
                </div>
                <button
                  style={{ ...styles.floatingCloseBtn, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => { setSelectedAntenna(null); setAntennaEditDraft(null); }}
                  title="סגור כרטיס"
                ><X size={14} /></button>
              </div>

              <div style={styles.floatingCardBody}>
                {edited && (
                  <span style={{
                    backgroundColor: "rgba(231,76,60,0.15)",
                    color: "#e74c3c",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    display: "inline-block",
                    marginBottom: "6px",
                  }}>
                    ⚠ שונה מברירת המחדל של הדגם
                  </span>
                )}

                {numField("תדר (MHz)", "freqMHz", 1, 1)}
                {numField("הספק (dBm)", "powerDbm", 1)}
                {numField("רווח אנטנה (dBi)", "gainDbi", 1)}
                {numField("רוחב אלומה (מעלות)", "beamwidthDeg", 1, 1, 360)}
                {numField("גובה אנטנה (מ')", "heightM", 1, 0)}
                {numField("אזימוט (מעלות)", "azimuthDeg", 1, 0, 360)}

                <div style={{ ...styles.floatingDataRow, marginTop: "6px" }}>
                  <span style={styles.floatingDataLabel}>טווח כיסוי משוער</span>
                  <span style={{ ...styles.floatingDataValue, color: ANTENNA_MARKER_COLOR, fontWeight: "bold" }}>
                    {rangeMeters.toFixed(0)} מ'
                  </span>
                </div>

                <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                  <button
                    onClick={() => {
                      onUpsertAntenna?.(antennaEditDraft);
                      setSelectedAntenna(null);
                      setAntennaEditDraft(null);
                    }}
                    style={styles.floatingActionBtnPrimary}
                  >
                    שמור
                  </button>
                  {existsInStore && (
                    <button
                      onClick={() => {
                        onRemoveAntenna?.(antennaEditDraft.id);
                        setSelectedAntenna(null);
                        setAntennaEditDraft(null);
                      }}
                      style={styles.floatingActionBtnDanger}
                    >
                      מחק
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedAntenna(null); setAntennaEditDraft(null); }}
                    style={styles.floatingActionBtnSecondary}
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {showRequestDetailsCard && selectedRequestItem && (
          <div style={{ ...styles.floatingDetailsCard, width: "320px" }}>
             {/* Header */}
             <div style={{
               ...styles.floatingCardHeader,
               borderBottom: `2px solid ${classificationConfig[selectedRequestItem.classification].accent}`,
             }}>
               <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                 <span style={{ fontSize: "10px", color: "#7f8c8d", textTransform: "uppercase" }}>בקשת אישור טיסה: {selectedRequestItem.id}</span>
                 <span style={{ fontSize: "13px", fontWeight: "bold", color: "#ecf0f1" }}>
                   {selectedRequestItem.operatorName} · {selectedRequestItem.unit}
                 </span>
               </div>
               <button
                 style={{ ...styles.floatingCloseBtn, display: "flex", alignItems: "center", justifyContent: "center" }}
                 onClick={() => { setShowRequestDetailsCard(false); }}
                 title="סגור כרטיס"
               ><X size={14} /></button>
             </div>

             {/* Classification Badge & Arming */}
             <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
               <span style={{
                 backgroundColor: classificationConfig[selectedRequestItem.classification].badgeBg,
                 color: classificationConfig[selectedRequestItem.classification].badgeText,
                 fontSize: "9px",
                 fontWeight: "bold",
                 padding: "2px 7px",
                 borderRadius: "10px",
               }}>{classificationConfig[selectedRequestItem.classification].label}</span>
               {selectedRequestItem.isArmed && (
                 <span style={{
                   backgroundColor: "var(--red-3)",
                   color: "var(--red-9)",
                   fontSize: "9px",
                   fontWeight: "bold",
                   padding: "2px 7px",
                   borderRadius: "10px",
                   border: "1px solid var(--red-6)",
                 }}>כלי חמוש</span>
               )}
             </div>

             {/* Body info */}
             <div style={styles.floatingCardBody}>
               <div style={styles.floatingDataRow}>
                 <span style={styles.floatingDataLabel}>דגם כלי</span>
                 <span style={{ ...styles.floatingDataValue }}>{selectedRequestItem.droneModel}</span>
               </div>
               <div style={styles.floatingDataRow}>
                 <span style={styles.floatingDataLabel}>תדרים</span>
                 <span style={{ ...styles.floatingDataValue }}>{selectedRequestItem.frequencies?.join(", ")} GHz</span>
               </div>
               <div style={styles.floatingDataRow}>
                 <span style={styles.floatingDataLabel}>חלון זמן</span>
                 <span style={{ ...styles.floatingDataValue }}>{selectedRequestItem.timeWindow}</span>
               </div>
               <div style={styles.floatingDataRow}>
                 <span style={styles.floatingDataLabel}>טווח גבהים</span>
                 <span style={{ ...styles.floatingDataValue }}>{selectedRequestItem.minAlt}מ' - {selectedRequestItem.maxAlt}מ'</span>
               </div>
               <div style={{ ...styles.floatingDataRow, borderBottom: "none" }}>
                 <span style={styles.floatingDataLabel}>מרחב</span>
                 <span style={{ ...styles.floatingDataValue }}>{selectedRequestItem.polygonName || "לא מוגדר"}</span>
               </div>

               {/* Status pill */}
               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                 <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>סטטוס בקשה</span>
                 <span style={{
                   ...styles.statusPill,
                   backgroundColor: statusConfig[selectedRequestItem.status].bg,
                   color: statusConfig[selectedRequestItem.status].color,
                 }}>
                   {statusConfig[selectedRequestItem.status].label}
                 </span>
               </div>
               {selectedRequestItem.reviewerNotes && (
                 <div style={{ fontSize: "10px", color: "var(--color-text)", backgroundColor: "var(--neutral-3)", borderRadius: "4px", padding: "6px 8px" }}>
                   <strong>הערות רוק״ק:</strong> {selectedRequestItem.reviewerNotes}
                 </div>
               )}

               {/* Conflicts */}
               <div style={{
                 marginTop: "2px",
                 padding: "8px 10px",
                 borderRadius: "6px",
                 border: `1px solid ${selectedRequestItem.conflicts.length > 0 ? "var(--orange-8)" : "var(--green-8)"}`,
                 backgroundColor: selectedRequestItem.conflicts.length > 0 ? "rgba(249, 115, 22, 0.10)" : "rgba(16, 185, 129, 0.10)",
               }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                   {selectedRequestItem.conflicts.length > 0 ? <AlertTriangle size={12} color="#f97316" /> : <CheckCircle size={12} color="#10b981" />}
                   <span style={{ fontSize: "11px", fontWeight: "bold", color: selectedRequestItem.conflicts.length > 0 ? "#ff8c3a" : "#10b981" }}>
                     {selectedRequestItem.conflicts.length > 0 ? `נמצאו ${selectedRequestItem.conflicts.length} קונפליקטים` : "תקין — ללא קונפליקטים"}
                   </span>
                 </div>
                 {selectedRequestItem.conflicts.map((c, idx) => (
                   <div key={idx} style={{ fontSize: "10px", color: "#ffdcd0", marginTop: "4px", paddingRight: "8px" }}>
                     • {c.description}
                   </div>
                 ))}
               </div>
             </div>

             {/* Footer — actions always pinned at the bottom */}
             <div style={styles.floatingCardFooter} onClick={(e) => e.stopPropagation()}>
               {(selectedRequestItem.status === "PENDING_REVIEW" || selectedRequestItem.status === "CONFLICT") && (
                 <>
                   <textarea
                     style={{
                       width: "100%",
                       height: "36px",
                       backgroundColor: "var(--neutral-3)",
                       border: "1px solid var(--neutral-6)",
                       color: "#fff",
                       padding: "4px 8px",
                       borderRadius: "4px",
                       fontSize: "11px",
                       resize: "none" as any,
                       outline: "none",
                       boxSizing: "border-box",
                     }}
                     value={reviewerNotes}
                     onChange={(e) => setReviewerNotes(e.target.value)}
                     placeholder="הנחיות קצין רוק״ק / הערות..."
                   />
                   <div style={{ display: "flex", gap: "6px" }}>
                     <button
                       id={`float-approve-btn-${selectedRequestItem.id}`}
                       onClick={(e) => {
                         e.stopPropagation();
                         onReviewRequest?.(selectedRequestItem.id, "APPROVED", reviewerNotes);
                         setSelectedRequestItem({ ...selectedRequestItem, status: "APPROVED", reviewerNotes });
                         setReviewerNotes("");
                       }}
                       style={styles.floatingActionBtnPrimary}
                     >
                       אשר בקשה
                     </button>
                     <button
                       id={`float-conflict-btn-${selectedRequestItem.id}`}
                       onClick={(e) => {
                         e.stopPropagation();
                         onReviewRequest?.(selectedRequestItem.id, "CONFLICT", reviewerNotes);
                         setSelectedRequestItem({ ...selectedRequestItem, status: "CONFLICT", reviewerNotes });
                         setReviewerNotes("");
                       }}
                       style={styles.floatingActionBtnWarn}
                     >
                       סמן כקונפליקט
                     </button>
                     <button
                       id={`float-remove-btn-${selectedRequestItem.id}`}
                       onClick={(e) => {
                         e.stopPropagation();
                         onReviewRequest?.(selectedRequestItem.id, "REMOVE", reviewerNotes);
                         setSelectedRequestItem(null);
                         setReviewerNotes("");
                         setShowRequestDetailsCard(false);
                       }}
                       style={styles.floatingActionBtnDanger}
                     >
                       הסר בקשה
                     </button>
                   </div>
                 </>
               )}

               {selectedRequestItem.status === "APPROVED" && (
                 <>
                   <button
                     onClick={() => {
                       const pts = getRequestGeometry(selectedRequestItem);
                       let center = { lat: 33.232, lng: 35.566 };
                       if (pts.length > 0) {
                         const latSum = pts.reduce((sum, p) => sum + p[0], 0);
                         const lngSum = pts.reduce((sum, p) => sum + p[1], 0);
                         center = { lat: latSum / pts.length, lng: lngSum / pts.length };
                       }

                       // Find any unidentified/threat track inside or near this corridor to bind Tiger to
                       const threatTrack = tracks.find((t) => {
                         const isThreat = t.iffStatus === "UNIDENTIFIED" || t.iffStatus.startsWith("RED");
                         if (!isThreat) return false;
                         if (pts.length > 0) {
                           return isPointInPolygon([t.coordinates.lat, t.coordinates.lng], pts);
                         }
                         return false;
                       });

                       const targetTrackId = threatTrack ? threatTrack.id : (tracks.find(t => t.iffStatus === "UNIDENTIFIED" || t.iffStatus.startsWith("RED"))?.id || tracks[0]?.id);

                       onTriggerAlert(`נוהל נמר הופעל במרחב פוליגון: ${selectedRequestItem.polygonName || selectedRequestItem.id}`, {
                         alertType: "TIGER",
                         threatLocation: center
                       });

                       if (targetTrackId) {
                         setTigerTrackId(targetTrackId);
                         setTigerTimer(15);
                       }
                     }}
                     style={styles.floatingActionBtnDanger}
                   >
                     הפעל נוהל נמר בפוליגון
                   </button>

                   <div style={{ display: "flex", gap: "6px" }}>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         const geom = getRequestGeometry(selectedRequestItem);
                         setCurrentEditPoints(geom);
                         setEditRequestId(selectedRequestItem.id);
                         setIsEditingPoints(true);
                       }}
                       style={styles.floatingActionBtnSecondary}
                     >
                       ✏️ ערוך גבולות
                     </button>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         if (confirm(`האם אתה בטוח שברצונך להסיר את המרחב המאושר?`)) {
                           onReviewRequest?.(selectedRequestItem.id, "REMOVE", "");
                           setSelectedRequestItem(null);
                           setShowRequestDetailsCard(false);
                           showToast("המרחב הוסר בהצלחה מהמערכת", "WARNING");
                         }
                       }}
                       style={styles.floatingActionBtnDanger}
                     >
                       🗑️ הסר מרחב
                     </button>
                   </div>
                 </>
               )}

               {(selectedRequestItem.status === "REJECTED" || selectedRequestItem.status === "EXPIRED" || selectedRequestItem.status === "COMPLETED" || selectedRequestItem.status === "ACTIVE") && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     if (confirm(`האם אתה בטוח שברצונך להסיר את הבקשה?`)) {
                       onReviewRequest?.(selectedRequestItem.id, "REMOVE", "");
                       setSelectedRequestItem(null);
                       setShowRequestDetailsCard(false);
                       showToast("הבקשה הוסרה בהצלחה מהמערכת", "WARNING");
                     }
                   }}
                   style={styles.floatingActionBtnDanger}
                 >
                   🗑️ הסר בקשה
                 </button>
               )}
             </div>
          </div>
        )}

            {/* Tiger Procedure Collapsible Control Panel */}
            {tigerTrackId && tigerPanelOpen && (() => {
              const tigerTrack = allActiveTracks.find(t => t.id === tigerTrackId);
              if (!tigerTrack) return null;

              const friendlyDrones = flights.filter((f) => 
                f.status === "ACTIVE" || f.status === "COMMS_LOSS" || f.status === "ANOMALOUS"
              );

              return (
                <div style={{
                  position: "absolute",
                  bottom: showGantt ? "300px" : "20px",
                  left: "20px",
                  zIndex: 1002,
                  width: "360px",
                  backgroundColor: "rgba(20, 21, 26, 0.98)",
                  border: "1px solid rgba(231, 76, 60, 0.45)",
                  borderRadius: "8px",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.55)",
                  backdropFilter: "blur(8px)",
                  overflow: "hidden",
                  direction: "rtl"
                }}>
                  {/* Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    backgroundColor: "rgba(20, 21, 26, 0.6)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="pulse-dot" style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#e74c3c" }}></span>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ecf0f1" }}>
                        ניהול נוהל נמר — מטרה {tigerTrackId}
                      </span>
                    </div>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "#7f8c8d",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                      onClick={() => setTigerPanelOpen(false)}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#a0a0a0", fontWeight: "bold", display: "block", marginBottom: "8px" }}>
                      ריכוז תגובות כוחותינו בגזרה:
                    </span>
                    
                    {friendlyDrones.length === 0 ? (
                      <span style={{ fontSize: "11px", color: "#7f8c8d", display: "block", textAlign: "center", padding: "10px" }}>
                        אין רחפנים של כוחותינו באוויר
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", marginBottom: "12px", paddingLeft: "4px" }}>
                        {friendlyDrones.map((fd) => {
                          let statusText = "לא הגיב";
                          let statusColor = "#95a5a6"; // Gray (no response yet)
                          let detailsEl = null;

                          if (fd.tigerStatus === "PENDING") {
                            statusText = "הנחיה התקבלה";
                            statusColor = "#3498db"; // Blue
                          } else if (fd.tigerStatus === "CONFIRMED" || fd.tigerStatus === "EXECUTED") {
                            statusText = `בוצע (גובה ${fd.currentAlt} מ')`;
                            statusColor = "#2ecc71"; // Green
                          } else if (fd.tigerStatus === "CANNOT_EXECUTE") {
                            statusText = "לא ניתן לביצוע";
                            statusColor = "#e74c3c"; // Red
                            detailsEl = (
                              <div style={{ fontSize: "10px", color: "#f1c40f", backgroundColor: "rgba(241,196,15,0.08)", padding: "4px 8px", borderRadius: "4px", marginTop: "4px", borderRight: "2px solid #f1c40f", textAlign: "right" }}>
                                <strong>סיבה:</strong> {fd.tigerReason || "לא צוינה סיבה"}
                              </div>
                            );
                          }

                          return (
                            <div key={fd.id} style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "6px", padding: "8px 10px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", marginBottom: "4px" }}>
                                <span style={{ color: "#ecf0f1", fontWeight: "bold" }}>
                                  {fd.operatorName} ({fd.unit})
                                </span>
                                <span style={{ fontWeight: "bold", color: statusColor }}>
                                  ● {statusText}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#a0a0a0" }}>
                                <span>{fd.droneModel} · גובה: {fd.currentAlt} מ'</span>
                                <span>סוללה: {fd.battery}%</span>
                              </div>
                              {detailsEl}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px", borderTop: "1px solid rgba(87, 95, 112, 0.15)", paddingTop: "10px" }}>
                      <button
                        onClick={() => handleAction("BLUE", tigerTrack)}
                        style={{
                          flex: 1,
                          backgroundColor: "#2ecc71",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 2px 5px rgba(46, 204, 113, 0.2)"
                        }}
                      >
                        סווג ככחול (מטרה כוח)
                      </button>
                      <button
                        onClick={() => handleAction("HAMMER", tigerTrack)}
                        style={{
                          flex: 1,
                          backgroundColor: "#e74c3c",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          boxShadow: "0 2px 5px rgba(231, 76, 60, 0.2)"
                        }}
                      >
                        הסלם לפטיש אוויר (יירוט)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tiger Panel Sticky Toggle Mini Badge */}
            {tigerTrackId && !tigerPanelOpen && (
              <button
                onClick={() => setTigerPanelOpen(true)}
                style={{
                  position: "absolute",
                  bottom: showGantt ? "300px" : "20px",
                  left: "20px",
                  zIndex: 1002,
                  backgroundColor: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 15px rgba(231, 76, 60, 0.6)",
                  fontSize: "16px",
                  fontWeight: "bold",
                  animation: "pulse-glow 1.5s infinite"
                }}
                title="פתח חלון ניהול נוהל נמר"
              >
                🐯
              </button>
            )}

            {/* Backdrop for closing context menu */}
            {contextMenu && (
              <div
                onClick={() => setContextMenu(null)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu(null);
                }}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  background: "transparent",
                }}
              />
            )}

            {/* Custom Context Menu */}
            {contextMenu && (
              <div
                style={{
                  position: "fixed",
                  top: `${contextMenu.y}px`,
                  left: `${contextMenu.x}px`,
                  zIndex: 9999,
                  width: "200px",
                  backgroundColor: "rgba(20, 21, 26, 0.95)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(12px)",
                  padding: "4px 0",
                  direction: "rtl",
                  textAlign: "right",
                }}
              >
                <div style={{
                  padding: "6px 12px 8px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: contextMenu.status === "APPROVED" ? "var(--blue-11)" : "var(--yellow-11)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px"
                }}>
                  <span>{contextMenu.status === "APPROVED" ? "🔵 מרחב מאושר" : "🟡 בקשת טיסה"}</span>
                  <span style={{ fontSize: "10px", color: "#a0a0a0" }}>{contextMenu.polygonName}</span>
                </div>

                <button
                  onClick={() => {
                    const req = requests.find(r => r.id === contextMenu.reqId);
                    if (req) {
                      const geom = getRequestGeometry(req);
                      setCurrentEditPoints(geom);
                      setEditRequestId(contextMenu.reqId);
                      setIsEditingPoints(true);
                      setSelectedRequestItem(req);
                    }
                    setContextMenu(null);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#ecf0f1";
                  }}
                  style={styles.contextMenuItem}
                >
                  <span style={{ marginLeft: "8px" }}>✏️</span>
                  ערוך גבולות פוליגון
                </button>

                {contextMenu.status !== "APPROVED" && (
                  <>
                    <button
                      onClick={() => {
                        onReviewRequest?.(contextMenu.reqId, "APPROVED", "");
                        const req = requests.find(r => r.id === contextMenu.reqId);
                        if (req) {
                          setSelectedRequestItem({ ...req, status: "APPROVED" });
                        }
                        showToast("בקשת טיסה אושרה בהצלחה", "SUCCESS");
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#ecf0f1";
                      }}
                      style={styles.contextMenuItem}
                    >
                      <span style={{ marginLeft: "8px" }}>✔️</span>
                      אשר בקשת טיסה
                    </button>

                    <button
                      onClick={() => {
                        onReviewRequest?.(contextMenu.reqId, "CONFLICT", "");
                        const req = requests.find(r => r.id === contextMenu.reqId);
                        if (req) {
                          setSelectedRequestItem({ ...req, status: "CONFLICT" });
                        }
                        showToast("בקשה סומנה בקונפליקט", "INFO");
                        setContextMenu(null);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#ecf0f1";
                      }}
                      style={styles.contextMenuItem}
                    >
                      <span style={{ marginLeft: "8px" }}>⚠️</span>
                      סמן כקונפליקט
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    const req = requests.find(r => r.id === contextMenu.reqId);
                    if (req) {
                      setSelectedRequestItem(req);
                      setShowRequestDetailsCard(true);
                    }
                    setContextMenu(null);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#ecf0f1";
                  }}
                  style={styles.contextMenuItem}
                >
                  <span style={{ marginLeft: "8px" }}>💬</span>
                  פרטי הבקשה
                </button>

                <button
                  onClick={() => {
                    if (confirm(`האם אתה בטוח שברצונך להסיר את ${contextMenu.status === "APPROVED" ? "המרחב המאושר" : "בקשת הטיסה"}?`)) {
                      onReviewRequest?.(contextMenu.reqId, "REMOVE", "");
                      if (selectedRequestItem?.id === contextMenu.reqId) {
                        setSelectedRequestItem(null);
                        setShowRequestDetailsCard(false);
                      }
                      showToast("המרחב הוסר בהצלחה מהמערכת", "WARNING");
                    }
                    setContextMenu(null);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(231, 76, 60, 0.15)";
                    e.currentTarget.style.color = "#e74c3c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#e74c3c";
                  }}
                  style={{
                    ...styles.contextMenuItem,
                    color: "#e74c3c"
                  }}
                >
                  <span style={{ marginLeft: "8px" }}>🗑️</span>
                  הסר ומחק פוליגון
                </button>
              </div>
            )}

            {isEditingPoints && (
              <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                zIndex: 1005,
                width: "300px",
                backgroundColor: "rgba(20, 21, 26, 0.95)",
                border: "1px solid var(--yellow-6)",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(12px)",
                direction: "rtl"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--neutral-6)", paddingBottom: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#ecf0f1" }}>עריכת גבולות פוליגון</span>
                  <span style={{ fontSize: "10px", backgroundColor: "var(--yellow-3)", color: "var(--yellow-9)", padding: "2px 6px", borderRadius: "4px" }}>
                    {requests.find(r => r.id === editRequestId)?.operatorName || editRequestId}
                  </span>
                </div>
                
                <p style={{ fontSize: "11px", color: "#ccc", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                  גרור את העיגולים הממוספרים על המפה כדי להתאים את המרחב, או לחץ על המפה להוספת נקודות חדשות.
                </p>
                
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fff", marginBottom: "12px" }}>
                  נקודות שסומנו: {currentEditPoints.length}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => {
                      if (currentEditPoints.length < 3) {
                        alert("פוליגון חייב להכיל לפחות 3 נקודות");
                        return;
                      }
                      if (editRequestId) {
                        onUpdateRequestCoordinates?.(editRequestId, currentEditPoints);
                        showToast("גבולות הפוליגון עודכנו בהצלחה", "SUCCESS");
                      }
                      setIsEditingPoints(false);
                      setEditRequestId(null);
                    }}
                    style={{
                      backgroundColor: "var(--green-9)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    שמור שינויים
                  </button>
                  
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => setCurrentEditPoints(prev => prev.slice(0, -1))}
                      disabled={currentEditPoints.length === 0}
                      style={{
                        flex: 1,
                        backgroundColor: "var(--neutral-5)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px",
                        fontSize: "11px",
                        cursor: currentEditPoints.length === 0 ? "not-allowed" : "pointer",
                        opacity: currentEditPoints.length === 0 ? 0.5 : 1
                      }}
                    >
                      מחק נקודה
                    </button>
                    <button
                      onClick={() => setCurrentEditPoints([])}
                      disabled={currentEditPoints.length === 0}
                      style={{
                        flex: 1,
                        backgroundColor: "var(--neutral-5)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px",
                        fontSize: "11px",
                        cursor: currentEditPoints.length === 0 ? "not-allowed" : "pointer",
                        opacity: currentEditPoints.length === 0 ? 0.5 : 1
                      }}
                    >
                      נקה הכל
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setIsEditingPoints(false);
                      setEditRequestId(null);
                    }}
                    style={{
                      backgroundColor: "var(--red-8)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      marginTop: "4px"
                    }}
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Toast Alert Notification */}
            {toast && (
              <div
                style={{
                  position: "absolute",
                  bottom: showGantt ? "300px" : "20px",
                  right: "20px",
                  zIndex: 1100,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(20, 21, 26, 0.96)",
                  border: `1px solid ${
                    toast.type === "SUCCESS"
                      ? "var(--green-6)"
                      : toast.type === "WARNING" || toast.type === "DANGER"
                      ? "var(--red-6)"
                      : "var(--blue-6)"
                  }`,
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  animation: "friendly-pulse 2s infinite",
                  direction: "rtl"
                }}
              >
                <span style={{
                  color: 
                    toast.type === "SUCCESS"
                      ? "var(--green-11)"
                      : toast.type === "WARNING" || toast.type === "DANGER"
                      ? "var(--red-9)"
                      : "var(--blue-11)"
                }}>
                  {toast.type === "SUCCESS" ? "✔️" : toast.type === "WARNING" ? "⚠️" : "ℹ️"}
                </span>
                <span>{toast.message}</span>
              </div>
            )}
          </div>
        </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  contextMenuItem: {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    color: "#ecf0f1",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    textAlign: "right" as const,
    display: "flex",
    alignItems: "center",
    transition: "background-color 0.2s, color 0.2s",
    outline: "none"
  },
  container: {
    display: "flex",
    width: "100%",
    height: "calc(100vh - 60px)",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    direction: "rtl",
    fontFamily: "var(--font-family)",
  },
  sidePanel: {
    width: "280px",
    backgroundColor: "var(--color-bg-card)",
    borderLeft: "1px solid var(--color-border)",
    padding: "20px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
  },
  panelTitle: {
    fontSize: "var(--text-base)",
    fontWeight: "var(--fw-bold)",
    marginBottom: "20px",
    color: "var(--color-text)",
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "10px",
    margin: 0,
  },
  listsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    overflowY: "auto",
    flex: 1,
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionHeader: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    color: "var(--color-text-muted)",
    textTransform: "uppercase",
  },
  itemRow: {
    backgroundColor: "var(--neutral-3)",
    padding: "10px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-sm)",
    lineHeight: "1.4",
    border: "1px solid var(--color-border-subtle)",
  },
  itemRowClickable: {
    backgroundColor: "var(--neutral-3)",
    padding: "10px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-sm)",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s",
    border: "1px solid var(--color-border-subtle)",
  },
  detailsCard: {
    backgroundColor: "var(--neutral-4)",
    padding: "15px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "8px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "var(--color-accent-text)",
    fontSize: "var(--text-xs)",
    cursor: "pointer",
    fontWeight: "var(--fw-bold)",
  },
  detailRow: {
    fontSize: "var(--text-sm)",
    marginBottom: "8px",
  },
  actionGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  actionBtn: {
    flex: 1,
    color: "var(--neutral-white)",
    border: "none",
    padding: "8px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--text-xs)",
    transition: "opacity 0.2s ease",
  },
  mapCanvas: {
    flex: 1,
    position: "relative",
    backgroundColor: "var(--color-bg)",
    overflow: "hidden",
    zIndex: 1,
  },
  floatingLayers: {
    position: "absolute",
    top: "10px",
    right: "10px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  floatingLayersToggle: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  floatingLayersContent: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "10px",
    marginTop: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "180px",
    boxShadow: "var(--shadow-md)",
    boxSizing: "border-box",
  },
  layerCheckboxRow: {
    fontSize: "var(--text-xs)",
    color: "var(--color-text)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  // Floating details card
  floatingDetailsCard: {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 1001,
    width: "320px",
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    backdropFilter: "blur(8px)",
    overflow: "hidden",
    direction: "rtl",
    pointerEvents: "auto",
    maxHeight: "calc(100vh - 40px)",
    display: "flex",
    flexDirection: "column",
  },
  floatingCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "12px 12px 10px",
    backgroundColor: "var(--neutral-5)",
  },
  floatingCloseBtn: {
    background: "none",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-muted)",
    fontSize: "var(--text-xs)",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "var(--radius-sm)",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "2px",
  },
  floatingCardBody: {
    padding: "8px 12px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    overflowY: "auto",
    maxHeight: "calc(100vh - 120px)",
    flex: 1,
  },
  floatingCardFooter: {
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    borderTop: "1px solid var(--color-border-subtle)",
    backgroundColor: "var(--neutral-5)",
    flexShrink: 0,
  },
  floatingActionBtnPrimary: {
    flex: 1,
    backgroundColor: "var(--green-9)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "7px",
    fontSize: "11px",
    fontWeight: "bold" as any,
    cursor: "pointer",
  },
  floatingActionBtnWarn: {
    flex: 1,
    backgroundColor: "var(--orange-9)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "7px",
    fontSize: "11px",
    fontWeight: "bold" as any,
    cursor: "pointer",
  },
  floatingActionBtnDanger: {
    flex: 1,
    backgroundColor: "var(--red-8)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "7px",
    fontSize: "11px",
    fontWeight: "bold" as any,
    cursor: "pointer",
  },
  floatingActionBtnSecondary: {
    flex: 1,
    backgroundColor: "var(--blue-9)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "7px",
    fontSize: "11px",
    fontWeight: "bold" as any,
    cursor: "pointer",
  },
  floatingDataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "var(--text-xs)",
    padding: "3px 0",
    borderBottom: "1px solid var(--color-border-subtle)",
  },
  floatingDataLabel: {
    color: "var(--color-text-muted)",
    fontSize: "var(--text-xs)",
  },
  floatingDataValue: {
    color: "var(--color-text)",
    fontSize: "var(--text-xs)",
    textAlign: "left" as const,
  },
  floatingCardActions: {
    display: "flex",
    gap: "6px",
    padding: "8px 12px 12px",
    borderTop: "1px solid var(--color-border)",
  },
  floatingActionBtn: {
    flex: 1,
    color: "var(--neutral-white)",
    border: "none",
    padding: "6px 4px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--text-xs)",
    letterSpacing: "0.3px",
    transition: "opacity 0.2s ease",
  },
  requestsPanel: {
    width: "280px",
    backgroundColor: "var(--color-bg-card)",
    borderLeft: "1px solid var(--color-border)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
    zIndex: 100,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px 10px",
    borderBottom: "1px solid var(--color-border)",
  },
  requestsPanelTitle: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-12)",
    textTransform: "uppercase" as any,
    letterSpacing: "0.6px",
  },
  panelBadge: {
    fontSize: "10px",
    fontWeight: "var(--fw-bold)" as any,
    backgroundColor: "var(--blue-3)",
    color: "var(--blue-11)",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--blue-6)",
  },
  requestList: {
    flex: 1,
    overflowY: "auto",
    padding: "var(--space-3)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  requestCard: {
    padding: "var(--space-3)",
    borderRadius: "var(--radius-2)",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "background-color var(--transition-base)",
    border: "1px solid var(--neutral-6)",
    borderRight: "3px solid transparent",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-2)",
  },
  cardIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  },
  cardId: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--blue-11)",
    fontFamily: "var(--font-mono)",
  },
  armedBadge: {
    fontSize: "9px",
    fontWeight: "var(--fw-bold)" as any,
    backgroundColor: "var(--red-3)",
    color: "var(--red-9)",
    padding: "1px 6px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--red-6)",
  },
  classBadge: {
    fontSize: "9px",
    fontWeight: "var(--fw-bold)" as any,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    marginBottom: "var(--space-2)",
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "var(--text-xs)",
  },
  cardLabel: {
    color: "var(--neutral-10)",
  },
  cardVal: {
    color: "var(--neutral-12)",
    fontWeight: "var(--fw-medium)" as any,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "var(--space-2)",
    borderTop: "1px solid var(--neutral-6)",
  },
  statusPill: {
    fontSize: "9px",
    fontWeight: "var(--fw-semibold)" as any,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
  },
  conflictCount: {
    fontSize: "9px",
    color: "var(--yellow-9)",
    fontWeight: "var(--fw-medium)" as any,
  },
  floatingAdmin: {
    position: "absolute",
    top: "10px",
    right: "210px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    direction: "rtl" as const,
  },
  floatingAdminToggle: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  floatingAdminContent: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px",
    marginTop: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "220px",
    boxShadow: "var(--shadow-md)",
    boxSizing: "border-box",
  },
  floatingAntennaWidget: {
    position: "absolute",
    top: "10px",
    right: "410px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    direction: "rtl" as const,
  },
  floatingAntennaToggle: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  floatingAntennaContent: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px",
    marginTop: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "230px",
    boxShadow: "var(--shadow-md)",
    boxSizing: "border-box",
  },
  floatingEnemyWidget: {
    position: "absolute",
    top: "10px",
    right: "610px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    direction: "rtl" as const,
  },
  floatingEnemyToggle: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    padding: "8px 12px",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
  },
  floatingEnemyContent: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    padding: "12px",
    marginTop: "5px",
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    width: "270px",
    boxShadow: "var(--shadow-md)",
    boxSizing: "border-box",
    maxHeight: "70vh",
    overflowY: "auto",
  },
  enemyQuickRangeRow: {
    display: "flex",
    gap: "4px",
  },
  enemyQuickRangeBtn: {
    flex: 1,
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    padding: "5px 4px",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  enemyModeRow: {
    display: "flex",
    gap: "4px",
  },
  enemyModeBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    padding: "6px 4px",
    fontSize: "9px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  scenarioBtn: {
    width: "100%",
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    fontSize: "11px",
    fontWeight: "bold",
    borderRadius: "4px",
    padding: "6px",
    cursor: "pointer",
    textAlign: "right" as const,
    transition: "background-color 0.2s",
  },
  adminSelect: {
    width: "100%",
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    fontSize: "11px",
    borderRadius: "4px",
    padding: "6px",
    outline: "none",
    cursor: "pointer",
  },
  adminInput: {
    width: "100%",
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text)",
    fontSize: "11px",
    borderRadius: "4px",
    padding: "4px 6px",
    outline: "none",
    boxSizing: "border-box",
  },
  adminFocusBtn: {
    width: "100%",
    backgroundColor: "#186eff",
    border: "none",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "bold",
    borderRadius: "4px",
    padding: "6px",
    cursor: "pointer",
    marginTop: "4px",
  },
};
