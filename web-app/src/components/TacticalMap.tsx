import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Circle, Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertOctagon, MapPin, Plane, Radio, X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { GanttChartPanel } from "./GanttChartPanel";

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
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CONFLICT";
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

const statusConfig = {
  PENDING_REVIEW: { label: "ממתין לאישור", color: "var(--yellow-9)", bg: "var(--yellow-3)" },
  APPROVED: { label: "מאושר", color: "var(--blue-11)", bg: "var(--blue-3)" },
  REJECTED: { label: "נדחה", color: "var(--red-9)", bg: "var(--red-3)" },
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

interface Track {
  id: string;
  type: string;
  iffStatus: "BLUE_CERTAIN" | "BLUE_SUSPICIOUS" | "BLUE_ANOMALOUS" | "UNIDENTIFIED" | "RED_SUSPICIOUS" | "RED_CERTAIN" | "CONFLICTING";
  coordinates: Coordinates;
  speedKts: number;
  heading: number;
  history?: [number, number][];
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
  onUpdateRequestCoordinates
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
      type: "DJI Matrice 300",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.322, lng: 35.532, altMsl: 152 },
      speedKts: 15,
      heading: 90,
    },
    {
      id: "זיק 4 - רחפן אספקה",
      type: "Mavic 3 Enterprise",
      iffStatus: "BLUE_ANOMALOUS",
      coordinates: { lat: 33.332, lng: 35.545, altMsl: 210 },
      speedKts: 22,
      heading: 0,
    },
    // Friendlies (Blue)
    {
      id: "צוות סיור 3 - כלי 1",
      type: "Mavic 3 Pro",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.269, lng: 35.522, altMsl: 80 },
      speedKts: 18,
      heading: 45,
    },
    {
      id: "צוות סיור 3 - כלי 2",
      type: "Mavic 3 Pro",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.266, lng: 35.528, altMsl: 95 },
      speedKts: 14,
      heading: 315,
    },
    {
      id: "ינשוף 3 - רחפן תצפית",
      type: "DJI Matrice 300",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.326, lng: 35.530, altMsl: 160 },
      speedKts: 20,
      heading: 270,
    },
    {
      id: "ינשוף 5 - סורק אופטי",
      type: "Skydio X2D",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.262, lng: 35.520, altMsl: 110 },
      speedKts: 16,
      heading: 60,
    },
    {
      id: "שועל 1 - משימת סריקה",
      type: "Skydio X2D",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.328, lng: 35.534, altMsl: 130 },
      speedKts: 22,
      heading: 190,
    },
    {
      id: "שועל 2 - משימת סריקה",
      type: "Skydio X2D",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.335, lng: 35.550, altMsl: 140 },
      speedKts: 25,
      heading: 200,
    },
    {
      id: "אבטחה 9 - רחפן קישור",
      type: "Mavic 3",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.338, lng: 35.555, altMsl: 75 },
      speedKts: 12,
      heading: 120,
    },
    {
      id: "אספקה 12 - כלי כבד",
      type: "Heavy Lifter UAV",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 33.340, lng: 35.560, altMsl: 250 },
      speedKts: 28,
      heading: 30,
    },
    {
      id: "כפר גלעדי - מטרה חשודה",
      type: "רחפן לא מזוהה",
      iffStatus: "UNIDENTIFIED",
      coordinates: { lat: 33.324, lng: 35.536, altMsl: 180 },
      speedKts: 12,
      heading: 180,
    },
    {
      id: "חדירת גבול - רחפן עוין",
      type: "רחפן תוקף",
      iffStatus: "RED_CERTAIN",
      coordinates: { lat: 33.330, lng: 35.540, altMsl: 90 },
      speedKts: 20,
      heading: 135,
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
    status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CONFLICT";
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

  // Floating menu toggle state
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  // Admin panel state
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [selectedAdminItem, setSelectedAdminItem] = useState<{ type: 'gf' | 'track'; id: string } | null>(null);
  const [adminClickToMove, setAdminClickToMove] = useState(false);

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

  // Simulate real-time target movement
  useEffect(() => {
    const interval = setInterval(() => {
      setTigerTimer((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        return 0;
      });

      setTracks((prev) =>
        prev.map((t) => {
          // If speed is 0 (like static RF signals), don't move
          if (t.speedKts === 0) return t;

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

          return {
            ...t,
            heading: newHeading,
            coordinates: { ...t.coordinates, lat: newLat, lng: newLng },
            history: newHistory,
          };
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
                  <option value="DJI Matrice 300">DJI Matrice 300</option>
                  <option value="Mavic 3 Enterprise">Mavic 3 Enterprise</option>
                  <option value="Skydio X2D">Skydio X2D</option>
                  <option value="DJI Mavic 3 Pro">DJI Mavic 3 Pro</option>
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
                        onChange={(e) => setAdminClickToMove(e.target.checked)} 
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
            sensors.map((s) => (
              <Circle
                key={`range-${s.id}`}
                center={s.coordinates}
                radius={s.rangeMeters || 1000}
                pathOptions={{ color: s.color, fillColor: s.color, fillOpacity: 0.08, weight: 1.5, dashArray: "3, 6" }}
              >
                <Tooltip direction="top" opacity={0.9}>
                  <div style={{ direction: "rtl", fontSize: "11px", fontWeight: "bold" }}>
                    {s.name}<br/>
                    <span style={{ fontWeight: "normal", color: "#7f8c8d" }}>רדיוס כיסוי: {s.rangeMeters} מטר</span>
                  </div>
                </Tooltip>
              </Circle>
            ))}

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

          {/* Highlight Selected Request Polygon */}
          {selectedRequestItem && (
            <Polygon
              positions={getRequestGeometry(selectedRequestItem)}
              pathOptions={{
                color: selectedRequestItem.status === "APPROVED" 
                  ? "#4589ff" 
                  : selectedRequestItem.status === "CONFLICT"
                  ? "var(--orange-9)"
                  : selectedRequestItem.status === "REJECTED" 
                  ? "var(--red-8)" 
                  : "var(--yellow-9)",
                fillColor: selectedRequestItem.status === "APPROVED" 
                  ? "#4589ff" 
                  : selectedRequestItem.status === "CONFLICT"
                  ? "var(--orange-9)"
                  : selectedRequestItem.status === "REJECTED" 
                  ? "var(--red-8)" 
                  : "var(--yellow-9)",
                fillOpacity: selectedRequestItem.status === "APPROVED" ? 0.05 : 0.22,
                weight: 4,
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
                    <span style={{ fontSize: "10px", color: "#7f8c8d", textTransform: "uppercase" }}>מטרה פעילה</span>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: "#ecf0f1" }}>
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

                {/* IFF Badge */}
                <div style={{ padding: "8px 12px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    backgroundColor: getIFFColor(selectedTrack.iffStatus),
                    color: "#fff",
                    fontSize: "9px",
                    fontWeight: "bold",
                    padding: "2px 7px",
                    borderRadius: "10px",
                    letterSpacing: "0.5px",
                  }}>{selectedTrack.iffStatus.replace("_", " ")}</span>
                  <span style={{ fontSize: "10px", color: "#7f8c8d" }}>סיווג IFF</span>
                </div>

                {/* Data rows */}
                <div style={styles.floatingCardBody}>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>סוג כלי</span>
                    <span style={styles.floatingDataValue}>{selectedTrack.type}</span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>גובה MSL</span>
                    <span style={{ ...styles.floatingDataValue, color: "#3498db", fontWeight: "bold" }}>
                      {selectedTrack.coordinates.altMsl}מ'
                    </span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>מהירות</span>
                    <span style={styles.floatingDataValue}>{selectedTrack.speedKts} קשר</span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>כיוון</span>
                    <span style={styles.floatingDataValue}>{selectedTrack.heading}°</span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>קוודינטות</span>
                    <span style={{ ...styles.floatingDataValue, fontFamily: "monospace", fontSize: "10px" }}>
                      {selectedTrack.coordinates.lat.toFixed(4)}, {selectedTrack.coordinates.lng.toFixed(4)}
                    </span>
                  </div>
                  <div style={styles.floatingDataRow}>
                    <span style={styles.floatingDataLabel}>סנסור מזהה</span>
                    <span style={{ ...styles.floatingDataValue, color: "#d35400" }}>
                      {sensors.find(s =>
                        Math.abs(s.coordinates[0] - selectedTrack.coordinates.lat) < 0.04 &&
                        Math.abs(s.coordinates[1] - selectedTrack.coordinates.lng) < 0.04
                      )?.name.split(" (")[0] ?? "אותומטי"}
                    </span>
                  </div>
                </div>

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
               <div style={styles.floatingDataRow}>
                 <span style={styles.floatingDataLabel}>מרחב</span>
                 <span style={{ ...styles.floatingDataValue }}>{selectedRequestItem.polygonName || "לא מוגדר"}</span>
               </div>
            
            {/* Status indicator */}
            <div style={{

                   backgroundColor: selectedRequestItem.status === "APPROVED"
                     ? "var(--blue-3)"
                     : selectedRequestItem.status === "CONFLICT"
                     ? "#3c1e10"
                     : selectedRequestItem.status === "REJECTED"
                     ? "var(--red-3)"
                     : "var(--yellow-3)",
                   border: `1px solid ${selectedRequestItem.status === "APPROVED"
                     ? "var(--blue-6)"
                     : selectedRequestItem.status === "CONFLICT"
                     ? "var(--orange-9)"
                     : selectedRequestItem.status === "REJECTED"
                     ? "var(--red-6)"
                     : "var(--yellow-6)"}`,
                 }}>
                   <span style={{
                     fontSize: "11px",
                     fontWeight: "bold",
                     color: selectedRequestItem.status === "APPROVED"
                       ? "var(--blue-11)"
                       : selectedRequestItem.status === "CONFLICT"
                       ? "var(--orange-9)"
                       : selectedRequestItem.status === "REJECTED"
                       ? "var(--red-9)"
                       : "var(--yellow-11)",
                     display: "flex",
                     alignItems: "center",
                     gap: "4px",
                   }}>
                     {selectedRequestItem.status === "APPROVED"
                       ? <CheckCircle size={12} color="var(--blue-11)" />
                       : selectedRequestItem.status === "CONFLICT"
                       ? <AlertTriangle size={12} color="var(--orange-9)" />
                       : selectedRequestItem.status === "REJECTED"
                       ? <XCircle size={12} color="var(--red-9)" />
                       : <AlertTriangle size={12} color="var(--yellow-9)" />}
                     {selectedRequestItem.status === "APPROVED"
                       ? "הבקשה אושרה"
                       : selectedRequestItem.status === "CONFLICT"
                       ? "הבקשה סומנה כקונפליקט"
                       : selectedRequestItem.status === "REJECTED"
                       ? "הבקשה נדחתה"
                       : "הבקשה ממתינה לבחינה בתור הבקשות"}
                   </span>
                   {selectedRequestItem.reviewerNotes && (
                     <div style={{ fontSize: "10px", color: "var(--neutral-12)", marginTop: "4px" }}>
                       <strong>הערות:</strong> {selectedRequestItem.reviewerNotes}
                     </div>
                   )}
                 </div>

                 {(selectedRequestItem.status === "PENDING_REVIEW" || selectedRequestItem.status === "CONFLICT") && (
                   <div
                     onClick={(e) => e.stopPropagation()}
                     style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}
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
                     <div style={{ display: "flex", gap: "6px" }}>
                       <button
                         id={`float-approve-btn-${selectedRequestItem.id}`}
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
                         id={`float-conflict-btn-${selectedRequestItem.id}`}
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
                         id={`float-remove-btn-${selectedRequestItem.id}`}
                         onClick={(e) => {
                           e.stopPropagation();
                           onReviewRequest?.(selectedRequestItem.id, "REMOVE", reviewerNotes);
                           setSelectedRequestItem(null);
                           setReviewerNotes("");
                           setShowRequestDetailsCard(false);
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
                 )}

                               {/* Conflicts */}
                <div style={{
                  marginTop: "8px",
                  padding: "8px",
                  borderRadius: "4px",
                  border: `1px solid ${selectedRequestItem.conflicts.length > 0 ? "rgba(249, 115, 22, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                  backgroundColor: selectedRequestItem.conflicts.length > 0 ? "rgba(249, 115, 22, 0.08)" : "rgba(16, 185, 129, 0.08)",
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



                {selectedRequestItem.status === "APPROVED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
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
                      style={{
                        width: "100%",
                        backgroundColor: "#e74c3c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c0392b")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#e74c3c")}
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
                        style={{
                          flex: 1,
                          backgroundColor: "var(--blue-9)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
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
                        🗑️ הסר מרחב
                      </button>
                    </div>
                  </div>
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
    width: "240px",
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border-strong)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    backdropFilter: "blur(8px)",
    overflow: "hidden",
    direction: "rtl",
    pointerEvents: "auto",
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
