import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, ClipboardList, Wifi, MapPin, Battery, AlertTriangle, AlertOctagon, User, Clock, Cpu } from "lucide-react";


// CSS Custom Styles to embed directly for clean operation
const inlineStyles = `
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
  @keyframes pulse-red {
    0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(231, 76, 60, 0); }
    100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
  }
  .pulse-marker {
    animation: pulse-red 2s infinite;
  }
  @keyframes friendly-pulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(52, 152, 219, 0.4)); }
    50% { transform: scale(1.04); filter: drop-shadow(0 0 6px rgba(52, 152, 219, 0.8)); }
  }
  @keyframes my-drone-pulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(46, 204, 113, 0.4)); }
    50% { transform: scale(1.04); filter: drop-shadow(0 0 6px rgba(46, 204, 113, 0.8)); }
  }
  .friendly-operator-marker {
    animation: friendly-pulse 3s infinite ease-in-out;
  }
  .my-drone-marker {
    animation: my-drone-pulse 3s infinite ease-in-out;
  }
  @keyframes pulse-glow {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(231, 76, 60, 0.5)); }
    50% { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(231, 76, 60, 0.9)); }
  }
`;

interface FlightRequest {
  id: string;
  operatorName: string;
  unit: string;
  division?: string;
  brigade?: string;
  battalion?: string;
  team?: string;
  radioCallSign?: string;
  phone?: string;
  phoneSecondary?: string;
  droneModel: string;
  frequencies: number[];
  timeWindow: string;
  classification: "GREEN" | "ORANGE" | "RED";
  minAlt: number;
  maxAlt: number;
  conflicts: any[];
  notes: string;
  status: "PENDING_REVIEW" | "APPROVED" | "ACTIVE" | "REJECTED" | "EXPIRED" | "COMPLETED";
  reviewerNotes?: string;
  isArmed?: boolean;
  operatorLocation?: { lat: number; lng: number };
  polygonType?: "PREDEFINED" | "CUSTOM";
  polygonName?: string;
  operatorNotes?: string;
  customPolygonPoints?: [number, number][];
  crossesBorder?: boolean;
  takeoffPoint?: string;
  specialFeatures?: string;
  missionType?: string;
  comms?: string;
  tailNumber?: string;
  serialNumber?: string;
  nightCapable?: boolean;
  devices?: string;
  droneUniqueName?: string;
  droneLogs?: { droneModel: string; action: string; timestamp: string }[];
  additionalDrones?: { droneModel: string; tailNumber: string; serialNumber: string; nightCapable: boolean; devices: string; name: string }[];
}

// Custom Leaflet Icons using DivIcon for perfect loading without asset dependency
const createOperatorIcon = () => {
  return L.divIcon({
    className: "operator-marker-wrapper",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div class="friendly-operator-marker" style="
          width: 32px; 
          height: 32px; 
          position: relative;
        ">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="13" stroke="#3498db" stroke-width="2" fill="#3498db" fill-opacity="0.15" />
            <path d="M16 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#3498db" stroke-width="2" stroke-linecap="round" fill="none" />
          </svg>
        </div>
        <span style="
          margin-top: 4px;
          font-size: 8px;
          font-weight: bold;
          color: #fff;
          background-color: rgba(0,0,0,0.85);
          padding: 1px 3.5px;
          border-radius: 2px;
          border: 1px solid #3498db;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.6);
        ">מפעיל (כוח אשד)</span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 16],
  });
};

const createDroneIcon = (active: boolean, heading: number = 0) => {
  const color = active ? "#186eff" : "#e74c3c";
  
  // Outer frame: friendly circle (removed outer frame)
  const frameSvg = "";

  // Drone path: quadcopter arms & rotors
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
    className: "drone-marker-wrapper",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div class="my-drone-marker" style="
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
        ">רחפן שלי</span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 16],
  });
};

// ─── Polygon Drawer component (captures map clicks) ───────────────────────────
interface PolygonDrawerProps {
  onAddPoint: (latlng: [number, number]) => void;
}
function PolygonDrawer({ onAddPoint }: PolygonDrawerProps) {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

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

interface DroneState {
  id: string;
  droneModel: string;
  status: "APPROVED" | "FLYING" | "LANDED";
  transponderActive: boolean;
  battery: number;
  altitude: number;
  droneCoords: { lat: number; lng: number };
  droneHeading: number;
  angle: number;
  altitudeOffset?: number;
}

// Drone Preset Registry
const dronePresets = [
  { model: "EVO 4T", freq: [5.8, 2.4] },
  { model: "EVO Alfa", freq: [5.8, 2.4] },
  { model: "EVO Night", freq: [2.4] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"MAP" | "FORM" | "DRONES" | "PROFILE">("MAP");
  const [wsConnected, setWsConnected] = useState(false);
  const [gpsLocked] = useState(true);
  const [allRequests, setAllRequests] = useState<FlightRequest[]>([]);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  // Custom polygon drawing
  const [showPolygonDrawer, setShowPolygonDrawer] = useState(false);
  const [customPolygonPoints, setCustomPolygonPoints] = useState<[number, number][]>([]);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState("13:54");

  // Multi-request flight state registry
  const [flightStates, setFlightStates] = useState<Record<string, any>>({});
  const [selectedRequestForMapId, setSelectedRequestForMapId] = useState<string | null>(null);

  const allRequestsRef = useRef<FlightRequest[]>([]);
  const selectedRequestForMapIdRef = useRef<string | null>(null);

  useEffect(() => {
    allRequestsRef.current = allRequests;
  }, [allRequests]);

  useEffect(() => {
    selectedRequestForMapIdRef.current = selectedRequestForMapId;
  }, [selectedRequestForMapId]);

  // Computed current request / flight telemetry variables
  const currentRequest = allRequests.find(r => r.id === selectedRequestForMapId) || null;
  const currentTelemetry = selectedRequestForMapId ? flightStates[selectedRequestForMapId] : null;
  const currentDrones: DroneState[] = currentTelemetry?.drones || [];
  const primaryDrone = currentDrones[0] || null;

  const battery = primaryDrone?.battery ?? 100;


  // Form Fields
  const [operatorName, setOperatorName] = useState("סמל רועי שרון");
  const [operatorUnit, setOperatorUnit] = useState("גדוד 12");

  // Force details (פרטי הכח)
  const [operatorDivision, setOperatorDivision] = useState("99");
  const [operatorBrigade, setOperatorBrigade] = useState("88");
  const [operatorBattalion, setOperatorBattalion] = useState("גדוד 12");
  const [operatorTeam, setOperatorTeam] = useState("");
  const [operatorRadioCallSign, setOperatorRadioCallSign] = useState("אפה");
  const [operatorPhone, setOperatorPhone] = useState("0509998881");
  const [operatorPhoneSecondary, setOperatorPhoneSecondary] = useState("050666891");

  const operatorNameRef = useRef(operatorName);
  const operatorUnitRef = useRef(operatorUnit);
  const flightStatesRef = useRef(flightStates);

  useEffect(() => {
    operatorNameRef.current = operatorName;
  }, [operatorName]);

  useEffect(() => {
    operatorUnitRef.current = operatorUnit;
  }, [operatorUnit]);

  // Keep the unit label in sync with the detailed force hierarchy
  useEffect(() => {
    const parts = [operatorDivision, operatorBrigade, operatorBattalion, operatorTeam].filter(Boolean);
    if (parts.length > 0) setOperatorUnit(parts.join(" / "));
  }, [operatorDivision, operatorBrigade, operatorBattalion, operatorTeam]);

  useEffect(() => {
    flightStatesRef.current = flightStates;
  }, [flightStates]);
  const [operatorNotes, setOperatorNotes] = useState("");
  
  // Registered drones for this operator
  const [myDrones, setMyDrones] = useState<any[]>([]);

  // Fields for adding a drone
  const [newDroneName, setNewDroneName] = useState("");
  const [newDroneModelIdx, setNewDroneModelIdx] = useState(0);
  const [newDroneTail, setNewDroneTail] = useState("");
  const [newDroneSerial, setNewDroneSerial] = useState("");
  const [newDroneNightCapable, setNewDroneNightCapable] = useState(false);
  const [newDroneDevices, setNewDroneDevices] = useState("");

  const handleSaveAndSync = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "REGISTER_OPERATOR",
        operator: {
          name: operatorName,
          unit: operatorUnit,
          drones: myDrones
        }
      }));
      alert("פרטי המפעיל והרחפנים סונכרנו בהצלחה עם החמ\"ק!");
    } else {
      alert("אין חיבור שרת פעיל. השינויים נשמרו מקומית.");
    }
  };

  const [selectedDroneIndices, setSelectedDroneIndices] = useState<number[]>([0]);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [isArmed, setIsArmed] = useState(false);
  const [minAlt, setMinAlt] = useState(20);
  const [maxAlt, setMaxAlt] = useState(80);
  const [timeWindow, setTimeWindow] = useState(() => {
    const fmt = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const now = new Date();
    const start = new Date(now.getTime() + 15 * 60000);
    const end = new Date(now.getTime() + 45 * 60000);
    return `${fmt(start)} - ${fmt(end)}`;
  });
  const [polygonSelectionType, setPolygonSelectionType] = useState<"PREDEFINED" | "CUSTOM">("CUSTOM");
  const [selectedPredefinedPolygon, setSelectedPredefinedPolygon] = useState("מסדרון גדס''ר");

  // Request-specific details
  const [crossesBorder, setCrossesBorder] = useState(false);
  const [takeoffPoint, setTakeoffPoint] = useState("");
  const [specialFeatures, setSpecialFeatures] = useState("");
  const [missionType, setMissionType] = useState("");
  const [missionTypeOther, setMissionTypeOther] = useState("");
  const [comms, setComms] = useState("");
  const [commsFreqValue, setCommsFreqValue] = useState("");
  const [commsOther, setCommsOther] = useState("");

  const missionTypeOptions = ["איסוף", "אבטחת כח", "סריקת גבול", "תרגיל", "חילוץ", "מדידה", "תצפית", "התאבדות", "אחר"];
  const commsOptions = ["תדר", "וועידה", "ללא", "אחר"];

  const isProfileComplete = !!(
    operatorName.trim() &&
    operatorBrigade.trim() &&
    operatorBattalion.trim() &&
    operatorRadioCallSign.trim() &&
    operatorPhone.trim()
  );

  const updateTelemetry = (reqId: string, updates: any) => {
    setFlightStates((prev) => {
      const current = prev[reqId] || {
        drones: []
      };
      
      const droneKeys = ["status", "battery", "altitude", "droneCoords", "droneHeading", "transponderActive", "angle"];
      const hasDroneUpdates = Object.keys(updates).some(k => droneKeys.includes(k));
      
      let updatedDrones = [...(current.drones || [])];
      if (updatedDrones.length === 0) {
        const req = allRequests.find(r => r.id === reqId);
        updatedDrones = [
          {
            id: reqId.replace("req", "flight"),
            droneModel: req?.droneModel || "EVO 4T",
            status: "APPROVED",
            transponderActive: false,
            battery: 100,
            altitude: req?.minAlt || 20,
            droneCoords: { lat: 33.232, lng: 35.566 },
            droneHeading: 0,
            angle: 0
          }
        ];
      }
      
      if (hasDroneUpdates && updatedDrones.length > 0) {
        const droneUpdates: any = {};
        droneKeys.forEach(k => {
          if (updates[k] !== undefined) droneUpdates[k] = updates[k];
        });
        updatedDrones[0] = { ...updatedDrones[0], ...droneUpdates };
      }
      
      const requestUpdates: any = {};
      Object.keys(updates).forEach(k => {
        if (!droneKeys.includes(k)) requestUpdates[k] = updates[k];
      });

      return {
        ...prev,
        [reqId]: {
          ...current,
          ...requestUpdates,
          drones: updatedDrones
        }
      };
    });
  };

  const updateDroneTelemetry = (reqId: string, droneId: string, updates: any) => {
    setFlightStates((prev) => {
      const requestState = prev[reqId];
      if (!requestState) return prev;
      const updatedDrones = requestState.drones.map((d: DroneState) =>
        d.id === droneId ? { ...d, ...updates } : d
      );
      return {
        ...prev,
        [reqId]: {
          ...requestState,
          drones: updatedDrones
        }
      };
    });
  };

  const socketRef = useRef<WebSocket | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const alertedRequestsRef = useRef<Set<string>>(new Set());

  const parseTimeWindow = (windowStr: string) => {
    const parts = windowStr.split("-").map(p => p.trim());
    if (parts.length !== 2) return { startMinutes: 0, endMinutes: 1440 };
    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    return { startMinutes: parseTime(parts[0]), endMinutes: parseTime(parts[1]) };
  };

  // Check if active or approved request time window is ending (within 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();

      allRequests.forEach((req) => {
        if (req.status === "ACTIVE" || req.status === "APPROVED") {
          const time = parseTimeWindow(req.timeWindow);
          const diff = time.endMinutes - currentMin;
          if (diff > 0 && diff <= 5) {
            const alertKey = `${req.id}-${time.endMinutes}`;
            if (!alertedRequestsRef.current.has(alertKey)) {
              alertedRequestsRef.current.add(alertKey);
              setActiveAlert(`התרעה: חלון הזמן של הפעילות עומד להסתיים בעוד ${diff} דקות! מומלץ להגיש בקשת הארכה.`);
            }
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [allRequests]);

  // Update device clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Set up WebSocket connection
  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      if (!active) return;
      console.log("Connecting to WebSocket relay...");
      ws = new WebSocket("ws://localhost:8080");

      ws.onopen = () => {
        if (!active) {
          ws?.close();
          return;
        }
        console.log("Connected to WebSocket relay");
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const message = JSON.parse(event.data);
          console.log("Received WebSocket event:", message);

          if (message.type === "INITIAL_REQUESTS_LOAD") {
            setAllRequests(message.requests.filter((r: any) => r.status !== "REMOVE"));
          } else if (message.type === "REVIEW_FLIGHT_REQUEST") {
            if (message.status === "REMOVE") {
              setAllRequests((prev) => prev.filter((req) => req.id !== message.requestId));
            } else {
              setAllRequests((prev) =>
                prev.map((req) =>
                  req.id === message.requestId
                    ? { ...req, status: message.status, reviewerNotes: message.reviewerNotes }
                    : req
                )
              );
            }

            const latestSelectedId = selectedRequestForMapIdRef.current;
            if (latestSelectedId === message.requestId) {
              if (message.status === "APPROVED" || message.status === "ACTIVE") {
                updateTelemetry(message.requestId, { status: message.status });
              }
            }
          } else if (message.type === "CRITICAL_ALERT") {
            setActiveAlert(message.message);
          }
        } catch (err) {
          console.error("Error parsing message", err);
        }
      };

      ws.onclose = () => {
        if (!active) return;
        console.log("WebSocket connection closed. Reconnecting in 3s...");
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      };

      socketRef.current = ws;
    };

    connectWs();

    return () => {
      active = false;
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Auto-sync operator details on WebSocket connection or profile/drones updates
  useEffect(() => {
    if (wsConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "REGISTER_OPERATOR",
        operator: {
          name: operatorName,
          unit: operatorUnit,
          drones: myDrones
        }
      }));
    }
  }, [wsConnected, operatorName, operatorUnit, myDrones]);

  // Initialize flightStates for newly approved requests
  useEffect(() => {
    allRequests.forEach((req) => {
      if ((req.status === "APPROVED" || req.status === "ACTIVE") && !flightStates[req.id]) {
        setFlightStates((prev) => ({
          ...prev,
          [req.id]: {
            status: "APPROVED",
            battery: 100,
            altitude: req.minAlt || 20,
            droneCoords: { lat: 33.232, lng: 35.566 },
            droneHeading: 0,
            transponderActive: false,
            angle: 0
          }
        }));
        setSelectedRequestForMapId(req.id);
      }
    });
  }, [allRequests, flightStates]);

  // Operator heartbeat loop (sent every 3 seconds to keep HQ updated on availability)
  useEffect(() => {
    const interval = setInterval(() => {
      allRequests.forEach((req) => {
        const tel = flightStates[req.id];
        if ((req.status === "APPROVED" || req.status === "ACTIVE") && tel && tel.drones && wsConnected) {
          tel.drones.forEach((drone: DroneState, idx: number) => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: "OPERATOR_HEARTBEAT",
                flightId: drone.id,
                operatorName: `${req.operatorName} (#${idx + 1})`,
                status: drone.status,
              }));
            }
          });
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [allRequests, flightStates, wsConnected]);

  // Pre-expiry countdown timer removed

  // Simulated drone movement and battery discharge for all flying requests
  useEffect(() => {
    const interval = setInterval(() => {
      allRequests.forEach((req) => {
        const tel = flightStates[req.id];
        if ((req.status === "APPROVED" || req.status === "ACTIVE") && tel && tel.drones && tel.drones.length > 0) {
          // Circular trajectory center based on request polygon center
          let centerLat = 33.232;
          let centerLng = 35.566;
          
          let polyPoints: [number, number][] = [];
          if (req.polygonType === "CUSTOM" && req.customPolygonPoints && req.customPolygonPoints.length > 0) {
            polyPoints = req.customPolygonPoints;
          } else {
            polyPoints = req.polygonName === "מסדרון גדס''ר"
              ? [[33.226, 35.560], [33.238, 35.560], [33.238, 35.572], [33.226, 35.572]]
              : req.polygonName === "מרחב סיוע 4"
              ? [[33.250, 35.570], [33.270, 35.570], [33.270, 35.585], [33.250, 35.585]]
              : [[33.215, 35.562], [33.238, 35.562], [33.238, 35.568], [33.215, 35.568]];
          }
          
          if (polyPoints.length > 0) {
            let latSum = 0;
            let lngSum = 0;
            polyPoints.forEach(([la, ln]) => {
              latSum += la;
              lngSum += ln;
            });
            centerLat = latSum / polyPoints.length;
            centerLng = lngSum / polyPoints.length;
          }

          let anyUpdated = false;
          const updatedDrones = tel.drones.map((drone: DroneState, idx: number) => {
            if (drone.status === "FLYING" && drone.transponderActive) {
              anyUpdated = true;
              const nextAngle = drone.angle + 0.05;
              const radius = 0.002 + (idx * 0.001);
              const startOffset = idx * (2 * Math.PI / 3);
              const angleWithOffset = nextAngle + startOffset;

              const newLat = centerLat + Math.sin(angleWithOffset) * radius;
              const newLng = centerLng + Math.cos(angleWithOffset) * radius;

              // Calculate heading in degrees
              let headingDeg = Math.round(Math.atan2(-Math.sin(angleWithOffset), Math.cos(angleWithOffset)) * 180 / Math.PI);
              if (headingDeg < 0) headingDeg += 360;

              const baseAlt = req.minAlt + 12 + Math.floor(Math.sin(angleWithOffset) * 5) + (idx * 15);
              const updatedAlt = baseAlt + (drone.altitudeOffset || 0);
              const updatedBat = Math.max(drone.battery - 1, 12);

              // Send telemetry ping via WebSocket
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                const payload = {
                  type: "TELEMETRY_PING",
                  flightId: drone.id,
                  droneModel: drone.droneModel,
                  operatorName: `${req.operatorName} (#${idx + 1})`,
                  unit: req.unit,
                  lat: newLat,
                  lng: newLng,
                  alt: updatedAlt,
                  battery: updatedBat,
                  speed: 25,
                  heading: headingDeg,
                };
                socketRef.current.send(JSON.stringify(payload));
              }

              return {
                ...drone,
                droneCoords: { lat: newLat, lng: newLng },
                droneHeading: headingDeg,
                angle: nextAngle,
                altitude: updatedAlt,
                battery: updatedBat
              };
            }
            return drone;
          });

          if (anyUpdated) {
            setFlightStates((prev) => ({
              ...prev,
              [req.id]: {
                ...prev[req.id],
                drones: updatedDrones
              }
            }));
          }
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [allRequests, flightStates]);

  // Open form in edit mode, pre-filling all fields from an existing request
  // Restore the request-detail fields (incl. free-text "other" fallbacks) when loading an existing request
  const applyRequestDetailFields = (req: FlightRequest) => {
    setCrossesBorder(req.crossesBorder || false);
    setTakeoffPoint(req.takeoffPoint || "");
    setSpecialFeatures(req.specialFeatures || "");

    if (req.missionType && missionTypeOptions.includes(req.missionType)) {
      setMissionType(req.missionType);
      setMissionTypeOther("");
    } else if (req.missionType) {
      setMissionType("אחר");
      setMissionTypeOther(req.missionType);
    } else {
      setMissionType("");
      setMissionTypeOther("");
    }

    if (req.comms?.startsWith("תדר")) {
      setComms("תדר");
      setCommsFreqValue(req.comms.replace(/^תדר\s*-?\s*/, ""));
      setCommsOther("");
    } else if (req.comms && commsOptions.includes(req.comms)) {
      setComms(req.comms);
      setCommsFreqValue("");
      setCommsOther("");
    } else if (req.comms) {
      setComms("אחר");
      setCommsOther(req.comms);
      setCommsFreqValue("");
    } else {
      setComms("");
      setCommsFreqValue("");
      setCommsOther("");
    }
  };

  const openEditForm = (req: FlightRequest) => {
    setEditingRequestId(req.id);
    setOperatorNotes(req.operatorNotes || req.notes || "");
    setMinAlt(req.minAlt);
    setMaxAlt(req.maxAlt);
    setTimeWindow(req.timeWindow);
    setIsArmed(req.isArmed || false);
    applyRequestDetailFields(req);
    setPolygonSelectionType(req.polygonType || "PREDEFINED");
    if (req.polygonType === "CUSTOM" && req.customPolygonPoints) {
      setCustomPolygonPoints(req.customPolygonPoints);
    } else {
      setCustomPolygonPoints([]);
      setSelectedPredefinedPolygon(req.polygonName || "מסדרון גדס''ר");
    }
    // Match registered drones to those in the request
    const indices: number[] = [];
    if (req.additionalDrones && req.additionalDrones.length > 0) {
      req.additionalDrones.forEach((ad) => {
        const idx = myDrones.findIndex(d => d.tailNumber === ad.tailNumber);
        if (idx !== -1) indices.push(idx);
      });
    }
    if (indices.length === 0) {
      const idx = myDrones.findIndex(d => d.tailNumber === req.tailNumber);
      indices.push(idx !== -1 ? idx : 0);
    }
    setSelectedDroneIndices(indices);
    setShowNewRequestForm(true);
    setActiveTab("FORM");
  };

  const handleSubmit = () => {
    if (!isProfileComplete) {
      alert("יש להשלים תחילה את פרטי המפעיל והכח בלשונית «פרופיל»");
      return;
    }
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setTimeout(() => { isSubmittingRef.current = false; }, 1000);

    const finalMissionType = missionType === "אחר" ? (missionTypeOther.trim() || "אחר") : missionType;
    const finalComms = comms === "תדר"
      ? `תדר${commsFreqValue.trim() ? ` - ${commsFreqValue.trim()}` : ""}`
      : comms === "אחר" ? (commsOther.trim() || "אחר") : comms;

    // Build drones list from selectedDroneIndices
    const chosenDrones = selectedDroneIndices
      .map(i => myDrones[i])
      .filter(Boolean);
    const primaryDroneReg = chosenDrones[0] || myDrones[0] || null;
    const dronePreset = dronePresets.find(p => p.model === primaryDroneReg?.model) || dronePresets[0];
    const droneModel = primaryDroneReg ? primaryDroneReg.model : dronePreset.model;
    const tailNumber = primaryDroneReg ? primaryDroneReg.tailNumber : "T-UNKNOWN";
    const serialNumber = primaryDroneReg ? primaryDroneReg.serialNumber : "לא הוגדר";
    const nightCapable = primaryDroneReg ? !!primaryDroneReg.nightCapable : false;
    const devices = primaryDroneReg ? primaryDroneReg.devices : "ללא";
    const droneUniqueName = primaryDroneReg ? primaryDroneReg.name : "רחפן לא רשום";
    const additionalDrones = chosenDrones.map(d => ({
      droneModel: d.model,
      tailNumber: d.tailNumber,
      serialNumber: d.serialNumber,
      nightCapable: !!d.nightCapable,
      devices: d.devices,
      name: d.name,
    }));

    if (editingRequestId) {
      // ── EDIT MODE ──────────────────────────────────────────────
      const updatedReq: FlightRequest = {
        ...allRequests.find(r => r.id === editingRequestId)!,
        operatorName,
        unit: operatorUnit,
        division: operatorDivision,
        brigade: operatorBrigade,
        battalion: operatorBattalion,
        team: operatorTeam,
        radioCallSign: operatorRadioCallSign,
        phone: operatorPhone,
        phoneSecondary: operatorPhoneSecondary,
        droneModel,
        frequencies: dronePreset.freq,
        timeWindow,
        minAlt: Number(minAlt),
        maxAlt: Number(maxAlt),
        isArmed,
        operatorLocation: { lat: 33.232, lng: 35.566 },
        polygonType: polygonSelectionType,
        polygonName: polygonSelectionType === "PREDEFINED" ? selectedPredefinedPolygon : "פוליגון מותאם אישית (משורטט)",
        operatorNotes,
        notes: operatorNotes || `טיסת ${droneUniqueName} (${droneModel}) - תיאום מרחבי`,
        customPolygonPoints: polygonSelectionType === "CUSTOM" ? customPolygonPoints : undefined,
        crossesBorder,
        takeoffPoint,
        specialFeatures,
        missionType: finalMissionType,
        comms: finalComms,
        tailNumber,
        serialNumber,
        nightCapable,
        devices,
        droneUniqueName,
        additionalDrones,
        status: "PENDING_REVIEW", // always back to pending after operator edit
        conflicts: [],
        classification: "GREEN",
        reviewerNotes: "",
      };

      setAllRequests(prev => prev.map(r => r.id === editingRequestId ? updatedReq : r));

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "UPDATE_FLIGHT_REQUEST",
          request: updatedReq,
        }));
      }

      setEditingRequestId(null);
      setShowNewRequestForm(false);
      setActiveTab("FORM");
      return;
    }

    // ── NEW REQUEST MODE ────────────────────────────────────────
    const newId = `req-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: FlightRequest = {
      id: newId,
      operatorName,
      unit: operatorUnit,
      division: operatorDivision,
      brigade: operatorBrigade,
      battalion: operatorBattalion,
      team: operatorTeam,
      radioCallSign: operatorRadioCallSign,
      phone: operatorPhone,
      phoneSecondary: operatorPhoneSecondary,
      droneModel,
      frequencies: dronePreset.freq,
      timeWindow,
      classification: "GREEN",
      minAlt: Number(minAlt),
      maxAlt: Number(maxAlt),
      conflicts: [],
      notes: operatorNotes || `טיסת ${droneUniqueName} (${droneModel}) - תיאום מרחבי`,
      status: "PENDING_REVIEW",
      isArmed,
      operatorLocation: { lat: 33.232, lng: 35.566 },
      polygonType: polygonSelectionType,
      polygonName: polygonSelectionType === "PREDEFINED" ? selectedPredefinedPolygon : "פוליגון מותאם אישית (משורטט)",
      operatorNotes,
      customPolygonPoints: polygonSelectionType === "CUSTOM" ? customPolygonPoints : undefined,
      crossesBorder,
      takeoffPoint,
      specialFeatures,
      missionType: finalMissionType,
      comms: finalComms,
      tailNumber,
      serialNumber,
      nightCapable,
      devices,
      droneUniqueName,
      additionalDrones,
    };

    setAllRequests(prev => [newReq, ...prev]);
    setSelectedRequestForMapId(newId);
    updateTelemetry(newId, { status: "APPROVED", timeLeft: 60 });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "NEW_FLIGHT_REQUEST",
        request: newReq,
      }));
    }

    setShowNewRequestForm(false);
    setActiveTab("FORM");
  };

  const handleTakeoff = (droneId: string) => {
    if (!selectedRequestForMapId) return;
    updateDroneTelemetry(selectedRequestForMapId, droneId, { status: "FLYING", transponderActive: true });

    setAllRequests((prev) =>
      prev.map((r) => {
        if (r.id === selectedRequestForMapId) {
          const timestamp = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const newLog = { droneModel: r.droneModel, action: "המראה", timestamp };
          const updatedLogs = [...(r.droneLogs || []), newLog];
          const updatedReq = { ...r, status: "ACTIVE" as const, droneLogs: updatedLogs };
          
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "REVIEW_FLIGHT_REQUEST",
              requestId: selectedRequestForMapId,
              status: "ACTIVE",
              droneLogs: updatedLogs
            }));
          }
          return updatedReq;
        }
        return r;
      })
    );
  };

  const handleLand = (droneId: string) => {
    if (!selectedRequestForMapId) return;
    updateDroneTelemetry(selectedRequestForMapId, droneId, { status: "LANDED", transponderActive: false });
    
    setAllRequests((prev) =>
      prev.map((r) => {
        if (r.id === selectedRequestForMapId) {
          const timestamp = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const newLog = { droneModel: r.droneModel, action: "נחיתה", timestamp };
          const updatedLogs = [...(r.droneLogs || []), newLog];
          const updatedReq = { ...r, status: "COMPLETED" as const, droneLogs: updatedLogs };
          
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "REVIEW_FLIGHT_REQUEST",
              requestId: selectedRequestForMapId,
              status: "COMPLETED",
              droneLogs: updatedLogs
            }));
            socketRef.current.send(JSON.stringify({
              type: "FLIGHT_LANDED",
              flightId: droneId
            }));
          }
          return updatedReq;
        }
        return r;
      })
    );
  };

  const handleHotSwap = (droneId: string, presetIdx: number) => {
    if (!selectedRequestForMapId) return;
    const newPreset = dronePresets[presetIdx];
    
    let prevModel = "רחפן";
    const currentFlightState = flightStates[selectedRequestForMapId];
    if (currentFlightState && currentFlightState.drones) {
      const d = currentFlightState.drones.find((d: any) => d.id === droneId);
      if (d) prevModel = d.droneModel;
    }

    setFlightStates((prev) => {
      const requestState = prev[selectedRequestForMapId];
      if (!requestState) return prev;
      const updatedDrones = requestState.drones.map((d: DroneState) =>
        d.id === droneId
          ? {
              ...d,
              droneModel: newPreset.model,
              battery: 100,
            }
          : d
      );
      return {
        ...prev,
        [selectedRequestForMapId]: {
          ...requestState,
          drones: updatedDrones
        }
      };
    });

    setAllRequests((prev) =>
      prev.map((r) => {
        if (r.id === selectedRequestForMapId) {
          const timestamp = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const newLog = { 
            droneModel: newPreset.model, 
            action: `החלפה מ-${prevModel} ל-${newPreset.model}`, 
            timestamp 
          };
          const updatedLogs = [...(r.droneLogs || []), newLog];
          const updatedReq = { ...r, droneLogs: updatedLogs };
          
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "REVIEW_FLIGHT_REQUEST",
              requestId: selectedRequestForMapId,
              status: r.status,
              droneLogs: updatedLogs
            }));
          }
          return updatedReq;
        }
        return r;
      })
    );

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "HOT_SWAP_DRONE",
        flightId: droneId,
        droneModel: newPreset.model,
      }));
    }
  };

  const handleAddDrone = (presetIdx: number) => {
    if (!selectedRequestForMapId) return;
    const req = allRequests.find(r => r.id === selectedRequestForMapId);
    if (!req) return;
    const current = flightStates[selectedRequestForMapId] || { drones: [], timeLeft: 60 };
    const drones = current.drones || [];
    const preset = dronePresets[presetIdx];
    
    // Calculate new index suffix based on existing drone IDs
    let maxIndex = 1;
    drones.forEach((d: DroneState) => {
      const parts = d.id.split("-");
      if (parts.length > 2) {
        const idx = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(idx) && idx > maxIndex) {
          maxIndex = idx;
        }
      }
    });
    
    const newDroneId = drones.length === 0 
      ? selectedRequestForMapId.replace("req", "flight") 
      : `${selectedRequestForMapId.replace("req", "flight")}-${maxIndex + 1}`;
    
    const newDrone: DroneState = {
      id: newDroneId,
      droneModel: preset.model,
      status: "APPROVED",
      transponderActive: false,
      battery: 100,
      altitude: req.minAlt || 20,
      droneCoords: { lat: 33.232, lng: 35.566 },
      droneHeading: 0,
      angle: 0
    };

    setFlightStates(prev => ({
      ...prev,
      [selectedRequestForMapId]: {
        ...prev[selectedRequestForMapId],
        drones: [...drones, newDrone]
      }
    }));
  };

  const handleRemoveDrone = (droneId: string) => {
    if (!selectedRequestForMapId) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "DEACTIVATE_FLIGHT",
        flightId: droneId
      }));
    }
    setFlightStates(prev => {
      const current = prev[selectedRequestForMapId];
      if (!current) return prev;
      return {
        ...prev,
        [selectedRequestForMapId]: {
          ...current,
          drones: current.drones.filter((d: DroneState) => d.id !== droneId)
        }
      };
    });
  };

  // handleRenewal removed

  const handleDeactivate = () => {
    if (!selectedRequestForMapId) return;
    const current = flightStates[selectedRequestForMapId];
    if (current && current.drones) {
      current.drones.forEach((d: DroneState) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "DEACTIVATE_FLIGHT",
            flightId: d.id
          }));
        }
      });
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "DEACTIVATE_FLIGHT",
        flightId: selectedRequestForMapId.replace("req", "flight")
      }));
    }

    setFlightStates(prev => {
      const next = { ...prev };
      delete next[selectedRequestForMapId];
      return next;
    });

    setAllRequests((prev) =>
      prev.map((r) => r.id === selectedRequestForMapId ? { ...r, status: "REJECTED" } : r)
    );
    setSelectedRequestForMapId(null);
  };

  const handleExtendRequest = (req: FlightRequest) => {
    setOperatorNotes(req.operatorNotes || req.notes);
    setMinAlt(req.minAlt);
    setMaxAlt(req.maxAlt);
    applyRequestDetailFields(req);

    const time = parseTimeWindow(req.timeWindow);
    const extendStartMin = time.endMinutes;
    const extendEndMin = extendStartMin + 30;
    
    const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60) % 24;
      const m = minutes % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };
    
    setTimeWindow(`${formatTime(extendStartMin)} - ${formatTime(extendEndMin)}`);
    setPolygonSelectionType(req.polygonType || "PREDEFINED");
    if (req.polygonType === "CUSTOM" && req.customPolygonPoints) {
      setCustomPolygonPoints(req.customPolygonPoints);
    } else if (req.polygonName) {
      setSelectedPredefinedPolygon(req.polygonName);
    }
    
    setShowNewRequestForm(true);
    setActiveTab("FORM");
  };

  return (
    <div style={styles.deviceContainer}>
      <style>{inlineStyles}</style>

      {/* Styled smartphone mock frame */}
      <div style={styles.phoneFrame}>
        {/* Top Speaker/Notch (Dynamic Island style) */}
        <div style={styles.phoneNotch}>
          <div style={styles.phoneCamera} />
          <div style={styles.phoneSpeaker} />
        </div>

        {/* Smartphone Status Bar */}
        <div style={styles.phoneStatusBar}>
          <div style={styles.statusBarLeft}>
            <span style={{ 
              ...styles.statusDot, 
              backgroundColor: wsConnected ? "#2ecc71" : "#e74c3c" 
            }} />
            <span style={styles.connectionTextMini}>{wsConnected ? "רוק״ק" : "מנותק"}</span>
          </div>
          
          <div style={styles.statusBarCenter}>{timeStr}</div>
          
          <div style={{ ...styles.statusBarRight, display: "flex", alignItems: "center", gap: "5px" }}>
            <MapPin size={10} color={gpsLocked ? "#2ecc71" : "#e74c3c"} style={{ marginLeft: "3px" }} />
            <Wifi size={10} color="#a0a0a0" />
            <Battery size={12} color="#a0a0a0" />
            <span style={{ fontSize: "10px", color: "#a0a0a0" }}>{battery}%</span>
          </div>
        </div>

        {/* Mobile App Header (Inside app frame) */}
        <header style={styles.appHeader}>
          <span style={styles.appTitle}>אול״ר טקטי — אלון 4</span>
        </header>

        {/* Main App Content Area */}
        <div style={styles.appContentArea}>
          {activeTab === "DRONES" ? (
            /* Drone Registry Screen */
            <div style={styles.formContainer}>
              <div style={{ padding: "0 2px" }}>
                <h3 style={{ ...styles.formTitle, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu size={16} color="#3498db" /> מאגר הרחפנים שלי
                </h3>

                {/* Drone list */}
                {myDrones.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 16px", color: "#7f8c8d", backgroundColor: "#1b1b21", borderRadius: "8px", border: "1px solid #2a2a35", marginBottom: "12px" }}>
                    <Cpu size={28} color="#2a2a35" style={{ marginBottom: "8px" }} />
                    <p style={{ fontSize: "11px", margin: 0 }}>אין רחפנים רשומים במאגר.</p>
                  </div>
                ) : (
                  <div style={{ marginBottom: "12px" }}>
                    {myDrones.map((drone, idx) => (
                      <div key={drone.id || idx} style={{
                        backgroundColor: "#1b1b21",
                        border: "1px solid #2a2a35",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        marginBottom: "8px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                              <Cpu size={12} color="#7f8c8d" />
                              <strong style={{ fontSize: "12px", color: "#bdc3c7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{drone.name}</strong>
                            </div>
                            <span style={{ fontSize: "10px", color: "#3498db", display: "block" }}>{drone.model}</span>
                            <span style={{ fontSize: "9px", color: "#7f8c8d", display: "block", marginTop: "1px" }}>זנב: {drone.tailNumber} | סיריאלי: {drone.serialNumber || "לא הוגדר"}</span>
                            <span style={{ fontSize: "9px", color: "#7f8c8d", display: "block", marginTop: "1px" }}>
                              {drone.nightCapable && <span style={{ color: "#3498db" }}>לילה: כן</span>}
                              {drone.nightCapable && " | "}
                              התקנים: {drone.devices}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMyDrones(prev => prev.filter((_, i) => i !== idx));
                              setSelectedDroneIndices(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
                            }}
                            style={{
                              background: "none",
                              border: "1px solid rgba(231,76,60,0.3)",
                              color: "#e74c3c",
                              cursor: "pointer",
                              fontSize: "9px",
                              padding: "3px 7px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(231,76,60,0.08)",
                              flexShrink: 0,
                              marginRight: "4px"
                            }}
                          >
                            מחק
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div style={{ borderTop: "1px solid #2a2a35", marginBottom: "14px" }} />

                {/* Registration form */}
                <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "10px", color: "#3498db", display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px", fontWeight: "bold" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3498db", display: "inline-block" }} />
                    רישום רחפן חדש
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                    <div>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>שם ייחודי (למטיס):</label>
                      <input type="text" value={newDroneName} onChange={(e) => setNewDroneName(e.target.value)} placeholder="לדוגמה: עין הנשר 1" style={styles.formInput} />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>סוג רחפן:</label>
                      <select value={newDroneModelIdx} onChange={(e) => setNewDroneModelIdx(Number(e.target.value))} style={styles.formSelect}>
                        {dronePresets.map((d, i) => <option key={i} value={i}>{d.model}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>מס״ד רחפן (מספר זנב):</label>
                      <input type="text" value={newDroneTail} onChange={(e) => setNewDroneTail(e.target.value)} placeholder="לדוגמה: T-RS88" style={styles.formInput} />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>מספר סיריאלי:</label>
                      <input type="text" value={newDroneSerial} onChange={(e) => setNewDroneSerial(e.target.value)} placeholder="לדוגמה: SN-2245891" style={styles.formInput} />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>לילה:</label>
                      <label style={styles.checkboxContainerStyle}>
                        <input type="checkbox" checked={newDroneNightCapable} onChange={(e) => setNewDroneNightCapable(e.target.checked)} style={styles.checkboxInput} />
                        <span style={{ fontSize: "11px", color: newDroneNightCapable ? "#3498db" : "#bdc3c7" }}>
                          {newDroneNightCapable ? "כן" : "לא"}
                        </span>
                      </label>
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>התקנים:</label>
                      <input type="text" value={newDroneDevices} onChange={(e) => setNewDroneDevices(e.target.value)} placeholder="לדוגמה: רמקול כריזה, זרקור" style={styles.formInput} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newDroneName.trim() || !newDroneTail.trim()) {
                          alert("נא למלא שם רחפן ומספר זנב");
                          return;
                        }
                        const newDrone = {
                          id: `drone-${Math.floor(1000 + Math.random() * 9000)}`,
                          tailNumber: newDroneTail,
                          serialNumber: newDroneSerial || "לא הוגדר",
                          nightCapable: newDroneNightCapable,
                          model: dronePresets[newDroneModelIdx].model,
                          devices: newDroneDevices || "ללא",
                          name: newDroneName,
                          status: "INACTIVE"
                        };
                        setMyDrones(prev => [...prev, newDrone]);
                        setNewDroneName("");
                        setNewDroneTail("");
                        setNewDroneSerial("");
                        setNewDroneNightCapable(false);
                        setNewDroneDevices("");
                        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                          socketRef.current.send(JSON.stringify({
                            type: "REGISTER_OPERATOR",
                            operator: { name: operatorName, unit: operatorUnit, drones: [...myDrones, newDrone] }
                          }));
                        }
                      }}
                      style={{
                        backgroundColor: "#1e3a5f",
                        color: "#3498db",
                        border: "1px solid rgba(52,152,219,0.5)",
                        padding: "9px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "12px",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Cpu size={13} /> רשום רחפן ✓
                    </button>
                  </div>
                </div>

                {/* Sync to HQ button */}
                {myDrones.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                        socketRef.current.send(JSON.stringify({
                          type: "REGISTER_OPERATOR",
                          operator: { name: operatorName, unit: operatorUnit, drones: myDrones }
                        }));
                        alert(`סונכרנו ${myDrones.length} רחפנים עם המפקדה בהצלחה!`);
                      } else {
                        alert("אין חיבור פעיל לשרת.");
                      }
                    }}
                    style={{
                      backgroundColor: "rgba(46,204,113,0.1)",
                      color: "#2ecc71",
                      border: "1px solid rgba(46,204,113,0.4)",
                      padding: "9px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "11px",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    ⬆ סנכרן עם המפקדה ({myDrones.length} רחפנים)
                  </button>
                )}
              </div>
            </div>
          ) : activeTab === "PROFILE" ? (
            /* Profile Screen */
            <div style={styles.formContainer}>
              {/* Avatar + name */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12px", paddingBottom: "16px", borderBottom: "1px solid #2a2a35", marginBottom: "12px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#1e3a5f", border: "2px solid #3498db", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                  <User size={28} color="#3498db" />
                </div>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#ecf0f1" }}>{operatorName}</span>
                <span style={{ fontSize: "11px", color: "#7f8c8d", marginTop: "2px" }}>{operatorUnit}</span>
                <span style={{ marginTop: "6px", fontSize: "9px", backgroundColor: "rgba(52,152,219,0.15)", color: "#3498db", border: "1px solid rgba(52,152,219,0.3)", borderRadius: "12px", padding: "2px 10px" }}>
                  מטיס מוסמך — רמה 2
                </span>
              </div>

              {/* Edit Profile */}
              <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "8px", fontWeight: "bold" }}>עריכת פרטי מפעיל</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>שם מפעיל:</label>
                    <input type="text" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} style={styles.formInput} />
                  </div>
                </div>
              </div>

              {/* Force Details */}
              <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "8px", fontWeight: "bold" }}>פרטי הכח</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={styles.formRow}>
                    <div style={styles.formCol}>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>אוגדה:</label>
                      <input type="text" value={operatorDivision} onChange={(e) => setOperatorDivision(e.target.value)} style={styles.formInput} />
                    </div>
                    <div style={styles.formCol}>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>חטיבה:</label>
                      <input type="text" value={operatorBrigade} onChange={(e) => setOperatorBrigade(e.target.value)} style={styles.formInput} />
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formCol}>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>גדוד:</label>
                      <input type="text" value={operatorBattalion} onChange={(e) => setOperatorBattalion(e.target.value)} style={styles.formInput} />
                    </div>
                    <div style={styles.formCol}>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>מחלקה/צוות:</label>
                      <input type="text" value={operatorTeam} onChange={(e) => setOperatorTeam(e.target.value)} style={styles.formInput} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>אוק בקשר:</label>
                    <input type="text" value={operatorRadioCallSign} onChange={(e) => setOperatorRadioCallSign(e.target.value)} style={styles.formInput} />
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formCol}>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>מספר טלפון:</label>
                      <input type="tel" value={operatorPhone} onChange={(e) => setOperatorPhone(e.target.value)} style={styles.formInput} />
                    </div>
                    <div style={styles.formCol}>
                      <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>מספר טלפון משני:</label>
                      <input type="tel" value={operatorPhoneSecondary} onChange={(e) => setOperatorPhoneSecondary(e.target.value)} style={styles.formInput} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drones Registry - moved to dedicated DRONES tab */}
              <div style={{ backgroundColor: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.25)", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "6px" }}>מאגר הרחפנים מנוהל בטאב הייעודי.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("DRONES")}
                  style={{
                    backgroundColor: "rgba(52,152,219,0.15)",
                    color: "#3498db",
                    border: "1px solid rgba(52,152,219,0.4)",
                    padding: "8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "11px",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Cpu size={13} /> עבור למאגר הרחפנים ({myDrones.length})
                </button>
              </div>

              {/* Save & Sync */}
              <div style={{ marginBottom: "15px" }}>
                <button
                  type="button"
                  onClick={handleSaveAndSync}
                  style={{
                    backgroundColor: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "100%",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  שמור וסנכרן עם החטיבה
                </button>
              </div>

              {/* Connection status */}
              <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "8px", fontWeight: "bold" }}>סטטוס חיבור</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#bdc3c7" }}>רוק"ק WebSocket</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: wsConnected ? "#2ecc71" : "#e74c3c" }}>
                    {wsConnected ? "● מחובר" : "● מנותק"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#bdc3c7" }}>GPS</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: gpsLocked ? "#2ecc71" : "#e74c3c" }}>
                    {gpsLocked ? "● נעול" : "● לא נעול"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#bdc3c7" }}>סוללת מכשיר</span>
                  <span style={{ fontSize: "10px", fontWeight: "bold", color: battery > 30 ? "#2ecc71" : "#e74c3c" }}>
                    {battery}%
                  </span>
                </div>
              </div>

              {/* App version */}
              <div style={{ textAlign: "center", paddingTop: "4px" }}>
                <span style={{ fontSize: "9px", color: "#555" }}>אול"ר טקטי v2.4.1 — ROKAK IFF System © 2025</span>
              </div>
            </div>
          ) : activeTab === "MAP" ? (
            /* GIS Leaflet Map */
            <div style={styles.mapContainerWrapper}>
              <MapContainer
                center={[33.232, 35.566]}
                zoom={14}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Render All Approved Corridors */}
                {allRequests.filter(req => req.status === "APPROVED").map((req) => {
                  const isSelected = req.id === selectedRequestForMapId;
                  const reqTelemetry = flightStates[req.id];
                  const isFlying = reqTelemetry?.drones?.some((d: DroneState) => d.status === "FLYING") || false;
                  
                  return (
                    <Polygon
                      key={req.id}
                      positions={getRequestGeometry(req)}
                      pathOptions={{ 
                        color: isFlying ? "#2ecc71" : "#7f8c8d", 
                        fillColor: isFlying ? "#2ecc71" : "#7f8c8d", 
                        fillOpacity: isFlying ? (isSelected ? 0.20 : 0.08) : 0.03, 
                        dashArray: isSelected ? undefined : "4, 4",
                        weight: isSelected ? 3 : 1.5
                      }}
                      eventHandlers={{
                        click: () => {
                          setSelectedRequestForMapId(req.id);
                        }
                      }}
                    />
                  );
                })}

                {/* Operator Marker */}
                <Marker position={[33.232, 35.566]} icon={createOperatorIcon()} />

                {/* Render All Flying Drones */}
                {allRequests.filter(req => req.status === "APPROVED").map((req) => {
                  const reqTelemetry = flightStates[req.id];
                  if (!reqTelemetry || !reqTelemetry.drones) return null;
                  
                  return reqTelemetry.drones.map((drone: DroneState) => {
                    if (drone.status === "FLYING" && drone.transponderActive) {
                      const isSelectedReq = req.id === selectedRequestForMapId;
                      return (
                        <Marker 
                          key={drone.id} 
                          position={[drone.droneCoords.lat, drone.droneCoords.lng]} 
                          icon={createDroneIcon(isSelectedReq, drone.droneHeading)} 
                          eventHandlers={{
                            click: () => {
                              setSelectedRequestForMapId(req.id);
                            }
                          }}
                        />
                      );
                    }
                    return null;
                  });
                })}
              </MapContainer>

              {/* Bottom Status Controller Panel */}
              <div style={styles.controlPanel}>
                {currentRequest && (
                  <div style={styles.requestStatusCard}>
                    <div style={styles.reqStatusHeader}>
                      <strong style={{ fontSize: "12px" }}>מזהה: {currentRequest.id}</strong>
                      <span style={{ 
                        ...styles.statusBadge, 
                        backgroundColor: currentRequest.status === "APPROVED" ? "#2ecc71" 
                          : currentRequest.status === "ACTIVE" ? "#1abc9c" 
                          : currentRequest.status === "COMPLETED" ? "#34495e" 
                          : currentRequest.status === "EXPIRED" ? "#95a5a6" 
                          : currentRequest.status === "REJECTED" ? "#e74c3c" 
                          : "#e67e22" 
                      }}>
                        {currentRequest.status === "APPROVED" ? "מאושרת" 
                          : currentRequest.status === "ACTIVE" ? "פעילה" 
                          : currentRequest.status === "COMPLETED" ? "הסתיימה" 
                          : currentRequest.status === "EXPIRED" ? "פג תוקף" 
                          : currentRequest.status === "REJECTED" ? "מבוטלת" 
                          : "ממתין לאישור"}
                      </span>
                    </div>
                    
                    {currentRequest.reviewerNotes && (
                      <div style={styles.reviewerNotes}>
                        <strong>הערות רוק"ק:</strong> {currentRequest.reviewerNotes}
                      </div>
                    )}

                    {/* Flight Controls based on flightState */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                      {(currentRequest.status === "APPROVED" || currentRequest.status === "ACTIVE") && (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "8px" }}>
                          {/* Drones list inside this request */}
                          {currentDrones.length === 0 ? (
                            <span style={{ fontSize: "10px", color: "#888" }}>אין רחפנים רשומים במרחב זה.</span>
                          ) : (
                            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid #2e2e38", paddingBottom: "6px" }}>
                              {currentDrones.map((drone, idx) => (
                                <div key={drone.id} style={{ display: "flex", flexDirection: "column", backgroundColor: "#111", border: "1px solid #252530", borderRadius: "4px", padding: "6px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#ecf0f1" }}>
                                      #{idx + 1}: {drone.droneModel.split(" ").slice(1).join(" ")} ({drone.id.replace("flight-", "")})
                                    </span>
                                    <span style={{ fontSize: "9px", color: drone.status === "FLYING" ? "#2ecc71" : "#f1c40f", fontWeight: "bold" }}>
                                      {drone.status === "FLYING" ? "באוויר" : drone.status === "LANDED" ? "מקורקע" : "מאושר"}
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "9px", color: "#888", flex: 1 }}>סוללה: {drone.battery}% | גובה: {drone.status === "FLYING" ? `${drone.altitude} מ'` : "--"}</span>
                                    
                                    {drone.status !== "FLYING" ? (
                                      <button 
                                        onClick={() => handleTakeoff(drone.id)} 
                                        style={{ padding: "3px 6px", fontSize: "9px", backgroundColor: "#27ae60", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: "bold" }}
                                      >
                                        הטס
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => handleLand(drone.id)} 
                                        style={{ padding: "3px 6px", fontSize: "9px", backgroundColor: "#d35400", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: "bold" }}
                                      >
                                        הנחת
                                      </button>
                                    )}
                                    
                                    <button 
                                      onClick={() => handleRemoveDrone(drone.id)} 
                                      style={{ padding: "3px 6px", fontSize: "9px", backgroundColor: "#7f8c8d", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: "bold" }}
                                    >
                                      הסר
                                    </button>
                                  </div>
                                  
                                  {/* Hot swap options */}
                                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                    <span style={{ fontSize: "8px", color: "#888" }}>חילוף חם:</span>
                                    {dronePresets.map((preset, pIdx) => (
                                      <button
                                        key={pIdx}
                                        onClick={() => handleHotSwap(drone.id, pIdx)}
                                        disabled={drone.droneModel === preset.model}
                                        style={{
                                          border: "none",
                                          borderRadius: "2px",
                                          padding: "1px 4px",
                                          fontSize: "8px",
                                          cursor: "pointer",
                                          backgroundColor: drone.droneModel === preset.model ? "#1a1a24" : "#2980b9",
                                          color: drone.droneModel === preset.model ? "#555" : "#fff",
                                        }}
                                      >
                                        {preset.model.split(" ")[1]}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick controls row: Add Drone / Close Corridor */}
                          <div style={{ display: "flex", gap: "8px", width: "100%", marginTop: "2px" }}>
                            <button
                              onClick={() => handleAddDrone(0)}
                              style={{ 
                                flex: 1, 
                                backgroundColor: "#3498db", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: "4px", 
                                padding: "6px 8px", 
                                fontSize: "10px", 
                                fontWeight: "bold", 
                                cursor: "pointer" 
                              }}
                            >
                              + הוסף רחפן למרחב
                            </button>
                            
                            <button 
                              onClick={handleDeactivate} 
                              style={{ 
                                backgroundColor: "#7f8c8d", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: "4px", 
                                padding: "6px 8px", 
                                fontSize: "10px", 
                                fontWeight: "bold", 
                                cursor: "pointer" 
                              }}
                            >
                              סגור מרחב (סיום)
                            </button>

                            <button 
                              onClick={() => handleExtendRequest(currentRequest)}
                              style={{ 
                                backgroundColor: "#9b59b6", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: "4px", 
                                padding: "6px 8px", 
                                fontSize: "10px", 
                                fontWeight: "bold", 
                                cursor: "pointer" 
                              }}
                            >
                              הארך פעילות
                            </button>
                          </div>
                        </div>
                      )}

                      {currentRequest.status === "REJECTED" && (
                        <button onClick={() => setSelectedRequestForMapId(null)} style={styles.clearBtn}>
                          נקה בקשה
                        </button>
                      )}

                      {currentRequest.status === "PENDING_REVIEW" && (
                        <span style={styles.pendingSpinner}>שידור הבקשה למפקדה פעיל...</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "FORM" ? (
            /* Flight Requests Tab: list + new form */
            showNewRequestForm ? (
              /* New request form */
              <div style={styles.formContainer}>
                <div style={styles.formCard}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #2e2e38", paddingBottom: "8px" }}>
                    <h3 style={{ ...styles.formTitle, margin: 0, borderBottom: "none", paddingBottom: 0 }}>
                      {editingRequestId ? "עריכת בקשת טיסה" : "בקשת תיאום מרחב"}
                    </h3>
                    <button
                      onClick={() => { setShowNewRequestForm(false); setEditingRequestId(null); }}
                      style={{ background: "none", border: "none", color: "#7f8c8d", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}
                    >✕</button>
                  </div>
                  {editingRequestId && (
                    <div style={{ fontSize: "10px", color: "#e67e22", backgroundColor: "rgba(230,126,34,0.08)", border: "1px solid rgba(230,126,34,0.3)", borderRadius: "6px", padding: "6px 10px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                      ✏ עריכת בקשה — לאחר השמירה תחזור לסטטוס «ממתין לאישור»
                    </div>
                  )}

                  {/* 1. Operator Details — auto-filled from profile */}
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionHeader}>פרטי מפעיל (מהפרופיל)</h4>
                    {!isProfileComplete ? (
                      <div style={{ fontSize: "11px", color: "#e67e22", backgroundColor: "rgba(230,126,34,0.08)", border: "1px solid rgba(230,126,34,0.3)", borderRadius: "6px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><AlertTriangle size={12} color="#e67e22" /> יש להשלים את פרטי המפעיל והכח (שם, חטיבה, גדוד, אוק בקשר, טלפון) בלשונית «פרופיל» לפני הגשת בקשה.</span>
                        <button
                          type="button"
                          onClick={() => { setShowNewRequestForm(false); setEditingRequestId(null); setActiveTab("PROFILE"); }}
                          style={{ backgroundColor: "rgba(230,126,34,0.15)", color: "#e67e22", border: "1px solid rgba(230,126,34,0.4)", borderRadius: "6px", padding: "7px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                        >
                          עבור לפרופיל
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "10px", color: "#7f8c8d" }}>שם מפעיל</span><strong style={{ fontSize: "11px", color: "#ecf0f1" }}>{operatorName}</strong></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "10px", color: "#7f8c8d" }}>יחידה</span><strong style={{ fontSize: "11px", color: "#ecf0f1" }}>{operatorUnit}</strong></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "10px", color: "#7f8c8d" }}>אוק בקשר</span><strong style={{ fontSize: "11px", color: "#ecf0f1" }}>{operatorRadioCallSign}</strong></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "10px", color: "#7f8c8d" }}>טלפון</span><strong style={{ fontSize: "11px", color: "#ecf0f1" }}>{operatorPhone}</strong></div>
                      </div>
                    )}
                  </div>

                  {/* 2. Drone selection — frequency & armed status derive automatically, not shown */}
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionHeader}>רישום ופרטי הרחפן</h4>
                    <div style={styles.formField}>
                      <label style={styles.fieldLabel}>בחר רחפנים לבקשה זו ({selectedDroneIndices.length} נבחרו):</label>
                      {myDrones.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {myDrones.map((d, idx) => {
                            const checked = selectedDroneIndices.includes(idx);
                            return (
                              <label key={idx} style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                backgroundColor: checked ? "rgba(52,152,219,0.1)" : "#141419",
                                border: `1px solid ${checked ? "rgba(52,152,219,0.5)" : "#2a2a35"}`,
                                borderRadius: "6px", padding: "7px 10px", cursor: "pointer"
                              }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setSelectedDroneIndices(prev =>
                                      checked
                                        ? prev.filter(i => i !== idx)
                                        : [...prev, idx]
                                    );
                                  }}
                                  style={{ cursor: "pointer", accentColor: "#3498db" }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <strong style={{ fontSize: "11px", color: checked ? "#ecf0f1" : "#bdc3c7", display: "block" }}>{d.name}</strong>
                                  <span style={{ fontSize: "9px", color: "#7f8c8d" }}>{d.model} | {d.tailNumber}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: "11px", color: "#e67e22", backgroundColor: "rgba(230,126,34,0.08)", border: "1px solid rgba(230,126,34,0.3)", borderRadius: "6px", padding: "8px" }}>
                          אין רחפנים רשומים — עבור ללשונית «רחפנים» להוספה.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Request Details */}
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionHeader}>פרטי הבקשה</h4>
                    <div style={styles.formRow}>
                      <div style={styles.formCol}>
                        <label style={styles.fieldLabel}>גובה מינימלי (AGL):</label>
                        <input type="number" value={minAlt} onChange={(e) => setMinAlt(Number(e.target.value))} style={styles.formInput} />
                      </div>
                      <div style={styles.formCol}>
                        <label style={styles.fieldLabel}>גובה מקסימלי (AGL):</label>
                        <input type="number" value={maxAlt} onChange={(e) => setMaxAlt(Number(e.target.value))} style={styles.formInput} />
                      </div>
                    </div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>האם חוצה גב״ל:</label>
                      <label style={styles.checkboxContainerStyle}>
                        <input type="checkbox" checked={crossesBorder} onChange={(e) => setCrossesBorder(e.target.checked)} style={styles.checkboxInput} />
                        <span style={{ fontSize: "11px", color: crossesBorder ? "#e74c3c" : "#bdc3c7", fontWeight: "bold" }}>
                          {crossesBorder ? "כן" : "לא"}
                        </span>
                      </label>
                    </div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>זמני פעילות מבוקשים:</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                          <Clock size={12} color="#7f8c8d" style={{ position: "absolute", right: "8px", pointerEvents: "none" }} />
                          <input
                            type="time"
                            value={timeWindow.split("-")[0]?.trim() || ""}
                            onChange={(e) => {
                              const end = timeWindow.split("-")[1]?.trim() || "";
                              setTimeWindow(`${e.target.value}${end ? ` - ${end}` : ""}`);
                            }}
                            style={{ ...styles.formInput, width: "100%", paddingRight: "26px", boxSizing: "border-box", colorScheme: "dark" as any }}
                          />
                        </div>
                        <span style={{ color: "#7f8c8d", fontSize: "11px" }}>עד</span>
                        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                          <Clock size={12} color="#7f8c8d" style={{ position: "absolute", right: "8px", pointerEvents: "none" }} />
                          <input
                            type="time"
                            value={timeWindow.split("-")[1]?.trim() || ""}
                            onChange={(e) => {
                              const start = timeWindow.split("-")[0]?.trim() || "";
                              setTimeWindow(`${start} - ${e.target.value}`);
                            }}
                            style={{ ...styles.formInput, width: "100%", paddingRight: "26px", boxSizing: "border-box", colorScheme: "dark" as any }}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>נקודת עלייה:</label>
                      <input type="text" value={takeoffPoint} onChange={(e) => setTakeoffPoint(e.target.value)} placeholder="לדוגמה: עמדת תצפית צפונית" style={styles.formInput} />
                    </div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>מרחב / פוליגון מבוקש:</label>
                      <select value={polygonSelectionType} onChange={(e) => { setPolygonSelectionType(e.target.value as any); if (e.target.value === "CUSTOM") setCustomPolygonPoints([]); }} style={styles.formSelect}>
                        <option value="PREDEFINED">בחר פוליגון מוגדר מראש</option>
                        <option value="CUSTOM">פוליגון מותאם אישית (משורטט)</option>
                      </select>
                    </div>
                    {polygonSelectionType === "PREDEFINED" && (
                      <div style={{ ...styles.formField, marginTop: "8px" }}>
                        <label style={styles.fieldLabel}>שם פוליגון מוגדר מראש:</label>
                        <select value={selectedPredefinedPolygon} onChange={(e) => setSelectedPredefinedPolygon(e.target.value)} style={styles.formSelect}>
                          <option value="מסדרון גדס''ר">מסדרון גדס''ר (גזרת הר דב)</option>
                          <option value="פרוזדור ינשוף 2">פרוזדור ינשוף 2 (אצבע הגליל)</option>
                          <option value="מרחב סיוע 4">מרחב סיוע 4 (גזרת מטולה)</option>
                        </select>
                      </div>
                    )}
                    {polygonSelectionType === "CUSTOM" && (
                       <div style={{ ...styles.formField, marginTop: "8px" }}>
                         <button
                           type="button"
                           onClick={() => setShowPolygonDrawer(true)}
                           style={{ width: "100%", backgroundColor: customPolygonPoints.length >= 3 ? "#27ae60" : "#2980b9", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                         >
                           {customPolygonPoints.length >= 3
                             ? `✓ פוליגון קיים (${customPolygonPoints.length} נקודות) — לחץ לעדכון`
                             : `✏ שרטט פוליגון על גבי מפה ${customPolygonPoints.length > 0 ? `(${customPolygonPoints.length} נקודות)` : ""}`}
                         </button>
                         {customPolygonPoints.length > 0 && customPolygonPoints.length < 3 && (
                           <span style={{ fontSize: "10px", color: "#e67e22", display: "block", marginTop: "4px", textAlign: "center" }}>דרושות לפחות 3 נקודות לסגירת הפוליגון</span>
                         )}
                       </div>
                     )}
                    <div style={styles.gpsRow}><strong>מיקום מטיס (נ"צ GPS):</strong> 33.2320, 35.5660 (אוטומטי)</div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>תכונות מיוחדות או רכיבים:</label>
                      <input type="text" value={specialFeatures} onChange={(e) => setSpecialFeatures(e.target.value)} placeholder="לדוגמה: מצלמת תרמית, רמקול כריזה, זרקור" style={styles.formInput} />
                    </div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>משימה:</label>
                      <select value={missionType} onChange={(e) => setMissionType(e.target.value)} style={styles.formSelect}>
                        <option value="">בחר סוג משימה</option>
                        {missionTypeOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      {missionType === "אחר" && (
                        <input type="text" value={missionTypeOther} onChange={(e) => setMissionTypeOther(e.target.value)} placeholder="פרט את סוג המשימה..." style={{ ...styles.formInput, marginTop: "6px" }} />
                      )}
                    </div>
                    <div style={{ ...styles.formField, marginTop: "8px" }}>
                      <label style={styles.fieldLabel}>תקשורת מב״א:</label>
                      <select value={comms} onChange={(e) => setComms(e.target.value)} style={styles.formSelect}>
                        <option value="">בחר סוג תקשורת</option>
                        {commsOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      {comms === "תדר" && (
                        <input type="text" value={commsFreqValue} onChange={(e) => setCommsFreqValue(e.target.value)} placeholder="ערך התדר..." style={{ ...styles.formInput, marginTop: "6px" }} />
                      )}
                      {comms === "אחר" && (
                        <input type="text" value={commsOther} onChange={(e) => setCommsOther(e.target.value)} placeholder="פרט..." style={{ ...styles.formInput, marginTop: "6px" }} />
                      )}
                    </div>
                  </div>

                  {/* 4. Notes */}
                  <div style={styles.formSection}>
                    <label style={styles.fieldLabel}>הערות:</label>
                    <textarea value={operatorNotes} onChange={(e) => setOperatorNotes(e.target.value)} placeholder="תיאור משימה / בקשות מיוחדות מהמפקדה..." style={styles.formTextarea} />
                  </div>

                  <div style={styles.formActions}>
                    <button
                      style={{ ...styles.submitBtn, opacity: isProfileComplete ? 1 : 0.5, cursor: isProfileComplete ? "pointer" : "not-allowed" }}
                      onClick={handleSubmit}
                      disabled={!isProfileComplete}
                    >
                      {editingRequestId ? "עדכן בקשה" : "שדר בקשה"}
                    </button>
                    <button style={styles.cancelBtn} onClick={() => { setShowNewRequestForm(false); setEditingRequestId(null); }}>ביטול</button>
                  </div>
                </div>
              </div>
            ) : (
              /* Requests list view */
              <div style={styles.formContainer}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ ...styles.formTitle, margin: 0, borderBottom: "none", paddingBottom: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <ClipboardList size={15} color="#3498db" /> בקשות טיסה
                  </h3>
                  <button
                    onClick={() => {
                      setEditingRequestId(null);
                      setOperatorNotes("");
                      setSelectedDroneIndices([0]);
                      setCrossesBorder(false);
                      setTakeoffPoint("");
                      setSpecialFeatures("");
                      setMissionType("");
                      setMissionTypeOther("");
                      setComms("");
                      setCommsFreqValue("");
                      setCommsOther("");
                      setShowNewRequestForm(true);
                    }}
                    style={{ backgroundColor: "#3498db", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    + בקשה חדשה
                  </button>
                </div>

                {allRequests.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#7f8c8d" }}>
                    <ClipboardList size={32} color="#2a2a35" style={{ marginBottom: "10px" }} />
                    <p style={{ fontSize: "12px", margin: 0 }}>אין בקשות טיסה קיימות.</p>
                    <p style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>לחץ «+ בקשה חדשה» להגשה.</p>
                  </div>
                ) : (
                  allRequests.map((req) => {
                    const isCurrent = currentRequest?.id === req.id;
                    const statusColor = req.status === "APPROVED" ? "#2ecc71" : req.status === "REJECTED" ? "#e74c3c" : "#e67e22";
                    const statusLabel = req.status === "APPROVED" ? "מאושרת" : req.status === "REJECTED" ? "מבוטלת" : "ממתין לאישור";
                    return (
                      <div
                        key={req.id}
                        style={{
                          backgroundColor: isCurrent ? "#1e2a3a" : "#1b1b21",
                          border: `1px solid ${isCurrent ? "#3498db" : "#2a2a35"}`,
                          borderRight: `3px solid ${statusColor}`,
                          borderRadius: "8px",
                          padding: "10px 12px",
                          marginBottom: "8px",
                          cursor: isCurrent ? "default" : "pointer",
                        }}
                        onClick={() => { if (isCurrent) setActiveTab("MAP"); }}
                      >
                        {/* Row 1: id + status badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ecf0f1", fontFamily: "monospace" }}>{req.id}</span>
                          <span style={{ fontSize: "9px", fontWeight: "bold", backgroundColor: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55`, borderRadius: "10px", padding: "2px 8px" }}>
                            {statusLabel}
                          </span>
                        </div>
                        {/* Row 2: drone + polygon */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                          <span style={{ fontSize: "10px", color: "#bdc3c7" }}>{req.droneModel.split(" ").slice(1).join(" ")}</span>
                          <span style={{ fontSize: "10px", color: "#7f8c8d" }}>{req.polygonName || "—"}</span>
                        </div>
                        {/* Row 3: time + armed badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", color: "#7f8c8d", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Clock size={9} /> {req.timeWindow}
                          </span>
                          {req.isArmed && (
                            <span style={{ fontSize: "9px", color: "#e74c3c", display: "flex", alignItems: "center", gap: "2px" }}>
                              <AlertTriangle size={9} /> חמוש
                            </span>
                          )}
                        </div>
                        {/* Row 4: reviewer notes if any */}
                        {req.reviewerNotes && (
                          <div style={{ marginTop: "6px", fontSize: "10px", color: "#f1c40f", backgroundColor: "rgba(241,196,15,0.08)", borderRadius: "4px", padding: "4px 8px", borderRight: "2px solid #f1c40f" }}>
                            {req.reviewerNotes}
                          </div>
                        )}
                        {/* Edit button — only for non-terminal statuses */}
                        {(req.status === "PENDING_REVIEW" || req.status === "APPROVED" || req.status === "ACTIVE") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditForm(req); }}
                            style={{
                              background: "none",
                              border: "1px solid rgba(52,152,219,0.35)",
                              color: "#3498db",
                              cursor: "pointer",
                              fontSize: "9px",
                              padding: "3px 7px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(52,152,219,0.08)",
                              flexShrink: 0,
                            }}
                          >
                            ✏ ערוך
                          </button>
                        )}
                        {isCurrent && (
                          <div style={{ marginTop: "6px", fontSize: "9px", color: "#3498db", textAlign: "center" }}>← הבקשה הפעילה · לחץ לעבור למפה</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : null}
        </div>

        {/* App Navigation Bottom Menu (Inside app frame) */}
        <nav style={styles.bottomNav}>
          <button 
            onClick={() => setActiveTab("MAP")} 
            style={{
              ...styles.navItem,
              color: activeTab === "MAP" ? "#3498db" : "#7f8c8d",
              borderTop: activeTab === "MAP" ? "2px solid #3498db" : "2px solid transparent"
            }}
          >
            <span style={styles.navIcon}><MapIcon size={18} /></span>
            <span style={styles.navText}>מפה</span>
          </button>

          <button 
            onClick={() => setActiveTab("FORM")} 
            style={{
              ...styles.navItem,
              color: activeTab === "FORM" ? "#3498db" : "#7f8c8d",
              borderTop: activeTab === "FORM" ? "2px solid #3498db" : "2px solid transparent"
            }}
          >
            <span style={styles.navIcon}><ClipboardList size={18} /></span>
            <span style={styles.navText}>בקשות טיסה</span>
          </button>

          <button
            onClick={() => setActiveTab("DRONES")}
            style={{
              ...styles.navItem,
              color: activeTab === "DRONES" ? "#3498db" : "#7f8c8d",
              borderTop: activeTab === "DRONES" ? "2px solid #3498db" : "2px solid transparent"
            }}
          >
            <span style={styles.navIcon}><Cpu size={18} /></span>
            <span style={styles.navText}>רחפנים</span>
          </button>

          <button 
            onClick={() => setActiveTab("PROFILE")} 
            style={{
              ...styles.navItem,
              color: activeTab === "PROFILE" ? "#3498db" : "#7f8c8d",
              borderTop: activeTab === "PROFILE" ? "2px solid #3498db" : "2px solid transparent"
            }}
          >
            <span style={styles.navIcon}><User size={18} /></span>
            <span style={styles.navText}>פרופיל</span>
          </button>
        </nav>

        {/* Dynamic Alert Fullscreen Overlay (Positioned absolutely inside the phoneFrame) */}
        {activeAlert && (
          <div
            style={{
              ...styles.alertOverlay,
              backgroundColor: "rgba(10, 10, 14, 0.99)",
              border: "3px solid #e74c3c",
              boxShadow: "0 0 30px rgba(230, 76, 60, 0.6)",
              borderRadius: "28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "30px 20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div style={{
                animation: "pulse-glow 1.5s infinite",
                backgroundColor: "rgba(231, 76, 60, 0.2)",
                borderRadius: "50%",
                padding: "15px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <AlertOctagon size={50} color="#e74c3c" />
              </div>

              <h2 style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#e67e22",
                margin: "0 0 15px 0"
              }}>התרעת חירום!</h2>
              <p style={{
                fontSize: "14px",
                color: "#ecf0f1",
                lineHeight: "1.5",
                margin: "0 0 25px 0"
              }}>{activeAlert}</p>
            </div>

            <div style={{ width: "100%" }}>
              <button
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  color: "#111",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                }}
                onClick={() => setActiveAlert(null)}
              >
                אישור קבלת התרעה
              </button>
            </div>
          </div>
        )}

        {/* Bottom home indicator gesture bar */}
        <div style={styles.homeBar} />

        {/* ─── Polygon Drawing Overlay ───────────────────────────────────────── */}
        {showPolygonDrawer && (
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            zIndex: 5000, display: "flex", flexDirection: "column", borderRadius: "28px", overflow: "hidden",
          }}>
            {/* Header bar */}
            <div style={{ backgroundColor: "#1b1b21", borderBottom: "1px solid #2a2a35", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#ecf0f1" }}>✏ שרטוט פוליגון</span>
              <button onClick={() => setShowPolygonDrawer(false)} style={{ background: "none", border: "none", color: "#7f8c8d", fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>

            {/* Instruction banner */}
            <div style={{ backgroundColor: "rgba(52,152,219,0.15)", borderBottom: "1px solid rgba(52,152,219,0.3)", padding: "6px 14px", flexShrink: 0 }}>
              <span style={{ fontSize: "10px", color: "#3498db" }}>
                {customPolygonPoints.length === 0 && "לחץ על המפה להוספת נקודה ראשונה"}
                {customPolygonPoints.length === 1 && "הוסף עוד נקודות (דרוש מינימום 3)"}
                {customPolygonPoints.length === 2 && "נקודה אחת נוספת לפחות"}
                {customPolygonPoints.length >= 3 && `${customPolygonPoints.length} נקודות — ניתן לאשר או להמשיך`}
              </span>
            </div>

            {/* Map */}
            <div style={{ flex: 1, position: "relative" }}>
              <MapContainer
                center={[33.232, 35.566]}
                zoom={14}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ width: "100%", height: "100%", cursor: "crosshair" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <PolygonDrawer onAddPoint={(pt) => setCustomPolygonPoints(prev => [...prev, pt])} />

                {/* Draw markers for each vertex */}
                {customPolygonPoints.map((pt, idx) => (
                  <Marker
                    key={idx}
                    position={pt}
                    icon={L.divIcon({
                      className: "",
                      html: `<div style="width:10px;height:10px;background:#3498db;border:2px solid #fff;border-radius:50%;box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
                      iconSize: [10, 10],
                      iconAnchor: [5, 5],
                    })}
                  />
                ))}

                {/* Draw lines between points */}
                {customPolygonPoints.length >= 2 && (
                  <Polyline
                    positions={customPolygonPoints}
                    pathOptions={{ color: "#3498db", weight: 2, dashArray: "5, 5" }}
                  />
                )}

                {/* Draw filled polygon when ≥ 3 points */}
                {customPolygonPoints.length >= 3 && (
                  <Polygon
                    positions={customPolygonPoints}
                    pathOptions={{ color: "#3498db", fillColor: "#3498db", fillOpacity: 0.15, weight: 2 }}
                  />
                )}
              </MapContainer>
            </div>

            {/* Controls footer */}
            <div style={{ backgroundColor: "#1b1b21", borderTop: "1px solid #2a2a35", padding: "10px 14px", display: "flex", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={() => setCustomPolygonPoints(prev => prev.slice(0, -1))}
                disabled={customPolygonPoints.length === 0}
                style={{ flex: 1, backgroundColor: customPolygonPoints.length === 0 ? "#252530" : "#34495e", color: customPolygonPoints.length === 0 ? "#555" : "#ecf0f1", border: "none", borderRadius: "6px", padding: "8px", fontSize: "11px", fontWeight: "bold", cursor: customPolygonPoints.length === 0 ? "default" : "pointer" }}
              >
                ↩ בטל נקודה
              </button>
              <button
                onClick={() => setCustomPolygonPoints([])}
                disabled={customPolygonPoints.length === 0}
                style={{ flex: 1, backgroundColor: customPolygonPoints.length === 0 ? "#252530" : "#7f1b1b", color: customPolygonPoints.length === 0 ? "#555" : "#ecf0f1", border: "none", borderRadius: "6px", padding: "8px", fontSize: "11px", fontWeight: "bold", cursor: customPolygonPoints.length === 0 ? "default" : "pointer" }}
              >
                🗑 נקה
              </button>
              <button
                onClick={() => { if (customPolygonPoints.length >= 3) setShowPolygonDrawer(false); }}
                disabled={customPolygonPoints.length < 3}
                style={{ flex: 2, backgroundColor: customPolygonPoints.length >= 3 ? "#27ae60" : "#1e3a2a", color: customPolygonPoints.length >= 3 ? "#fff" : "#555", border: "none", borderRadius: "6px", padding: "8px", fontSize: "11px", fontWeight: "bold", cursor: customPolygonPoints.length >= 3 ? "pointer" : "default" }}
              >
                ✓ אשר פוליגון
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  deviceContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#0d0e12",
    backgroundImage: "radial-gradient(circle at center, #1b1e29 0%, #0d0e12 100%)",
    overflow: "hidden",
  },
  phoneFrame: {
    width: "360px",
    height: "740px",
    backgroundColor: "#16161d",
    borderRadius: "40px",
    border: "12px solid #2c3e50", // Matte titanium bezel
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.85), 0 0 30px rgba(52, 152, 219, 0.15)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    direction: "rtl",
    boxSizing: "border-box",
  },
  phoneNotch: {
    width: "110px",
    height: "20px",
    backgroundColor: "#000",
    borderRadius: "15px",
    position: "absolute",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  phoneCamera: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#1a1a2e",
    border: "1px solid #333",
  },
  phoneSpeaker: {
    width: "35px",
    height: "3px",
    borderRadius: "1.5px",
    backgroundColor: "#222",
  },
  phoneStatusBar: {
    height: "35px",
    backgroundColor: "#16161d",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 18px 0 18px",
    fontSize: "11px",
    color: "#a0a0a0",
    zIndex: 999,
    boxSizing: "border-box",
  },
  statusBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
  },
  connectionTextMini: {
    fontSize: "10px",
    fontWeight: "bold",
  },
  statusBarCenter: {
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  statusBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  appHeader: {
    height: "40px",
    backgroundColor: "#1a1a24",
    borderBottom: "1px solid #2a2a35",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  },
  appTitle: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: "0.5px",
  },
  appContentArea: {
    flex: 1,
    height: "calc(100% - 135px)", // status bar (35) + header (40) + bottom nav (50) + padding
    position: "relative",
  },
  mapContainerWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  // expiryWarningBanner and renewalMiniBtn styles removed
  controlPanel: {
    position: "absolute",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    width: "92%",
  },
  requestStatusCard: {
    backgroundColor: "#16161d",
    border: "1px solid #2e2e38",
    borderRadius: "6px",
    padding: "10px 12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  reqStatusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "bold",
  },
  reviewerNotes: {
    fontSize: "10px",
    backgroundColor: "#252530",
    padding: "6px 10px",
    borderRadius: "4px",
    borderRight: "3px solid #f1c40f",
    color: "#ecf0f1",
  },
  reqStatusActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  transponderBtn: {
    flex: 1,
    color: "#fff",
    border: "none",
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "11px",
  },
  landBtn: {
    backgroundColor: "#7f8c8d",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "11px",
  },
  clearBtn: {
    backgroundColor: "#34495e",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "11px",
  },
  pendingSpinner: {
    fontSize: "11px",
    color: "#f1c40f",
    animation: "blink 1.5s infinite",
  },
  hotSwapContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    borderTop: "1px solid #252530",
    paddingTop: "6px",
    marginTop: "2px",
  },
  hotSwapLabel: {
    fontSize: "9px",
    color: "#888",
  },
  hotSwapButtonRow: {
    display: "flex",
    gap: "6px",
  },
  hotSwapBtn: {
    flex: 1,
    border: "none",
    borderRadius: "3px",
    padding: "4px",
    fontSize: "9px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  formContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#141419",
    padding: "12px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  formCard: {
    width: "100%",
    backgroundColor: "#1b1b21",
    border: "1px solid #2a2a35",
    borderRadius: "8px",
    padding: "12px 14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
    boxSizing: "border-box",
  },
  formTitle: {
    margin: "0 0 10px 0",
    borderBottom: "1px solid #2e2e38",
    paddingBottom: "6px",
    fontSize: "13px",
    fontWeight: "bold",
    color: "#ecf0f1",
  },
  formSection: {
    borderBottom: "1px solid #252530",
    paddingBottom: "10px",
    marginBottom: "10px",
  },
  formSectionHeader: {
    margin: "0 0 8px 0",
    fontSize: "11px",
    color: "#3498db",
    fontWeight: "bold",
  },
  formRow: {
    display: "flex",
    gap: "10px",
  },
  formCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  formInput: {
    backgroundColor: "#141419",
    border: "1px solid #2a2a35",
    borderRadius: "4px",
    color: "#fff",
    padding: "6px 8px",
    fontSize: "11px",
    outline: "none",
  },
  formSelect: {
    backgroundColor: "#141419",
    border: "1px solid #2a2a35",
    borderRadius: "4px",
    color: "#fff",
    padding: "6px 8px",
    fontSize: "11px",
    outline: "none",
    width: "100%",
  },
  formTextarea: {
    backgroundColor: "#141419",
    border: "1px solid #2a2a35",
    borderRadius: "4px",
    color: "#fff",
    padding: "6px 8px",
    fontSize: "11px",
    outline: "none",
    width: "100%",
    height: "50px",
    resize: "none",
    boxSizing: "border-box",
  },
  checkboxContainerStyle: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    height: "100%",
    cursor: "pointer",
    paddingTop: "6px",
  },
  checkboxInput: {
    cursor: "pointer",
  },
  gpsRow: {
    fontSize: "10px",
    color: "#7f8c8d",
    marginTop: "8px",
  },
  formField: {
    marginBottom: "8px",
  },
  fieldLabel: {
    fontSize: "10px",
    color: "#bdc3c7",
    marginBottom: "4px",
  },
  formActions: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  submitBtn: {
    flex: 2,
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "transparent",
    color: "#7f8c8d",
    border: "1px solid #2a2a35",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  },
  bottomNav: {
    height: "50px",
    backgroundColor: "#16161d",
    borderTop: "1px solid #2a2a35",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    boxSizing: "border-box",
    paddingBottom: "8px", // space for bottom gesture bar
  },
  navItem: {
    flex: 1,
    height: "100%",
    backgroundColor: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "bold",
    gap: "2px",
    transition: "all 0.2s",
  },
  navIcon: {
    fontSize: "16px",
  },
  navText: {
    fontSize: "9px",
  },
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    textAlign: "center",
    color: "#fff",
    borderRadius: "28px", // rounded corner matches screen bezel
  },
  alertIconWrapper: {
    fontSize: "48px",
    marginBottom: "10px",
    animation: "blink 1s infinite",
  },
  alertMainTitle: {
    fontSize: "22px",
    margin: "0 0 10px 0",
    fontWeight: "bold",
  },
  alertMessageText: {
    fontSize: "14px",
    lineHeight: "1.4",
    marginBottom: "25px",
  },
  ackAlertBtn: {
    backgroundColor: "#fff",
    color: "#111",
    border: "none",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  },
  homeBar: {
    width: "110px",
    height: "4px",
    backgroundColor: "#7f8c8d",
    borderRadius: "2px",
    position: "absolute",
    bottom: "6px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
  },
};
