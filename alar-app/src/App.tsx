import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polygon, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Map as MapIcon, ClipboardList, Wifi, MapPin, Battery, AlertTriangle, AlertOctagon, Bell, User, CheckCircle, Clock } from "lucide-react";


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
  @keyframes tiger-border-glow {
    0%, 100% { border-color: #f1c40f; box-shadow: 0 0 20px rgba(241, 196, 15, 0.4), inset 0 0 15px rgba(241, 196, 15, 0.2); }
    50% { border-color: #e74c3c; box-shadow: 0 0 40px rgba(230, 76, 60, 0.8), inset 0 0 25px rgba(230, 76, 60, 0.4); }
  }
  .tiger-alert-box {
    animation: tiger-border-glow 2s infinite ease-in-out;
  }
  @keyframes text-glow-pulse {
    0%, 100% { text-shadow: 0 0 5px rgba(241, 196, 15, 0.5); }
    50% { text-shadow: 0 0 15px rgba(241, 196, 15, 0.9); }
  }
  .tiger-instruction-text {
    animation: text-glow-pulse 1.5s infinite ease-in-out;
  }
  @keyframes button-pulse {
    0% { transform: scale(1); box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4); }
    50% { transform: scale(1.03); box-shadow: 0 6px 25px rgba(46, 204, 113, 0.7); }
    100% { transform: scale(1); box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4); }
  }
  .tiger-btn-confirm {
    animation: button-pulse 1.8s infinite ease-in-out;
  }
`;

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
  conflicts: any[];
  notes: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewerNotes?: string;
  isArmed?: boolean;
  operatorLocation?: { lat: number; lng: number };
  polygonType?: "PREDEFINED" | "CUSTOM";
  polygonName?: string;
  operatorNotes?: string;
  customPolygonPoints?: [number, number][];
  tailNumber?: string;
  devices?: string;
  droneUniqueName?: string;
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

const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
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
  { model: "DJI Mavic 3 Pro", freq: [5.8] },
  { model: "DJI Matrice 300 RTK", freq: [5.8, 2.4] },
  { model: "Skydio X2D", freq: [1.8] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"MAP" | "FORM" | "ALERTS" | "PROFILE">("MAP");
  const [wsConnected, setWsConnected] = useState(false);
  const [gpsLocked] = useState(true);
  const [allRequests, setAllRequests] = useState<FlightRequest[]>([]);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  // Custom polygon drawing
  const [showPolygonDrawer, setShowPolygonDrawer] = useState(false);
  const [customPolygonPoints, setCustomPolygonPoints] = useState<[number, number][]>([]);
  const [useAlternativeFreq, setUseAlternativeFreq] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [activeTigerRequestIds, setActiveTigerRequestIds] = useState<string[]>([]);
  const [tigerRefusalReason, setTigerRefusalReason] = useState("");
  const [systemAlerts, setSystemAlerts] = useState<any[]>([
    {
      id: "alt-1",
      time: "16:45",
      message: "נוהל נמר פעיל! זוהה כלי עוין/לא מזוהה (rad-track-4011) בגזרת גבול הצפון.",
      type: "TIGER",
      status: "ACTIVE"
    },
    {
      id: "alt-2",
      time: "15:30",
      message: "נוהל נמר במרחב גזרת מטולה הסתיים. חזרה לשגרה אווירית מאושרת.",
      type: "TIGER",
      status: "RESOLVED"
    }
  ]);
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

  const flightState = primaryDrone?.status || "APPROVED";
  const transponderActive = primaryDrone?.transponderActive || false;
  const battery = primaryDrone?.battery ?? 100;
  const altitude = primaryDrone?.altitude ?? 0;


  // Form Fields
  const [operatorName, setOperatorName] = useState("סמל רועי שרון");
  const [operatorUnit, setOperatorUnit] = useState("גדוד 12");

  const operatorNameRef = useRef(operatorName);
  const operatorUnitRef = useRef(operatorUnit);
  const flightStatesRef = useRef(flightStates);

  useEffect(() => {
    operatorNameRef.current = operatorName;
  }, [operatorName]);

  useEffect(() => {
    operatorUnitRef.current = operatorUnit;
  }, [operatorUnit]);

  useEffect(() => {
    flightStatesRef.current = flightStates;
  }, [flightStates]);
  const [operatorNotes, setOperatorNotes] = useState("");
  
  // Registered drones for this operator
  const [myDrones, setMyDrones] = useState<any[]>([
    {
      id: "drone-rs12",
      tailNumber: "T-RS12",
      model: "DJI Mavic 3 Pro",
      devices: "מצלמה תרמית, זום אופטי",
      name: "צילום גזרתי",
      status: "INACTIVE"
    }
  ]);

  // Fields for adding a drone
  const [newDroneName, setNewDroneName] = useState("");
  const [newDroneModelIdx, setNewDroneModelIdx] = useState(0);
  const [newDroneTail, setNewDroneTail] = useState("");
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

  const [selectedDroneIdx, setSelectedDroneIdx] = useState(0);
  const activeRegisteredDrone = myDrones[selectedDroneIdx] || myDrones[0] || null;
  const activeSelectedPreset = dronePresets.find(p => p.model === activeRegisteredDrone?.model) || dronePresets[0];
  const [isArmed, setIsArmed] = useState(false);
  const [minAlt, setMinAlt] = useState(20);
  const [maxAlt, setMaxAlt] = useState(80);
  const [timeWindow, setTimeWindow] = useState("14:15 - 14:45");
  const [polygonSelectionType, setPolygonSelectionType] = useState<"PREDEFINED" | "CUSTOM">("PREDEFINED");
  const [selectedPredefinedPolygon, setSelectedPredefinedPolygon] = useState("מסדרון גדס''ר");

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
            droneModel: req?.droneModel || "DJI Mavic 3 Pro",
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
            setAllRequests(message.requests);
          } else if (message.type === "REVIEW_FLIGHT_REQUEST") {
            setAllRequests((prev) =>
              prev.map((req) =>
                req.id === message.requestId
                  ? { ...req, status: message.status, reviewerNotes: message.reviewerNotes }
                  : req
              )
            );

            const latestSelectedId = selectedRequestForMapIdRef.current;
            if (latestSelectedId === message.requestId) {
              if (message.status === "APPROVED") {
                updateTelemetry(message.requestId, { status: "APPROVED" });
              }
            }
          } else if (message.type === "CRITICAL_ALERT") {
            if (message.alertType === "TIGER" && message.threatLocation) {
              const affectedReqIds: string[] = [];
              allRequestsRef.current.forEach((req) => {
                if (req.status === "APPROVED") {
                  const activePolygon = getRequestGeometry(req);
                  if (activePolygon && activePolygon.length > 0) {
                    const isInside = isPointInPolygon(
                      [message.threatLocation.lat, message.threatLocation.lng],
                      activePolygon
                    );
                    if (isInside) {
                      affectedReqIds.push(req.id);
                    }
                  }
                }
              });

              if (affectedReqIds.length > 0) {
                setActiveTigerRequestIds(affectedReqIds);
                setActiveAlert(message.message || "נוהל נמר הופעל באזור שלך");
                const now = new Date();
                const time = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
                setSystemAlerts((prev) => [
                  {
                    id: `alt-${Math.floor(1000 + Math.random() * 9000)}`,
                    time,
                    message: message.message || "נוהל נמר הופעל באזור שלך",
                    type: "TIGER",
                    status: "ACTIVE"
                  },
                  ...prev
                ]);

                // Notify HQ immediately that we received the instruction (pending execution)
                affectedReqIds.forEach((reqId) => {
                  const req = allRequestsRef.current.find(r => r.id === reqId);
                  const current = flightStatesRef.current[reqId];
                  const drones = current?.drones || [
                    {
                      id: reqId.replace("req", "flight"),
                      droneModel: req?.droneModel || "DJI Mavic 3 Pro"
                    }
                  ];
                  drones.forEach((drone: any) => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        type: "TIGER_RESPONSE",
                        status: "PENDING",
                        operatorName: operatorNameRef.current,
                        unit: operatorUnitRef.current,
                        requestId: reqId,
                        flightId: drone.id,
                        reason: "",
                        timestamp: now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      }));
                    }
                  });
                });
              } else {
                console.log("Ignored Tiger alert - threat is outside active polygon");
              }
            } else {
              setActiveAlert(message.message);
            }
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
      if (req.status === "APPROVED" && !flightStates[req.id]) {
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
        if (req.status === "APPROVED" && tel && tel.drones && wsConnected) {
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
        if (req.status === "APPROVED" && tel && tel.drones && tel.drones.length > 0) {
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

  const handleSubmit = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 1000);

    const registeredDrone = myDrones[selectedDroneIdx] || null;
    const dronePreset = dronePresets.find(p => p.model === registeredDrone?.model) || dronePresets[0];
    const droneModel = registeredDrone ? registeredDrone.model : dronePreset.model;
    const tailNumber = registeredDrone ? registeredDrone.tailNumber : "T-UNKNOWN";
    const devices = registeredDrone ? registeredDrone.devices : "ללא";
    const droneUniqueName = registeredDrone ? registeredDrone.name : "רחפן לא רשום";

    const newId = `req-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: FlightRequest = {
      id: newId,
      operatorName: operatorName,
      unit: operatorUnit,
      droneModel: droneModel,
      frequencies: useAlternativeFreq ? [2.4] : dronePreset.freq,
      timeWindow: timeWindow,
      classification: "GREEN", // Server / HQ will perform conflict checks and reclassify
      minAlt: Number(minAlt),
      maxAlt: Number(maxAlt),
      conflicts: [],
      notes: operatorNotes || `טיסת ${droneUniqueName} (${droneModel}) - תיאום מרחבי`,
      status: "PENDING_REVIEW",
      isArmed: isArmed,
      operatorLocation: { lat: 33.232, lng: 35.566 },
      polygonType: polygonSelectionType,
      polygonName: polygonSelectionType === "PREDEFINED" ? selectedPredefinedPolygon : "פוליגון מותאם אישית (משורטט)",
      operatorNotes: operatorNotes,
      customPolygonPoints: polygonSelectionType === "CUSTOM" ? customPolygonPoints : undefined,
      tailNumber: tailNumber,
      devices: devices,
      droneUniqueName: droneUniqueName,
    };

    setAllRequests(prev => [newReq, ...prev]);
    setSelectedRequestForMapId(newId);
    updateTelemetry(newId, { status: "APPROVED", timeLeft: 60 });

    // Send via WebSocket to HQ Web Console
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "NEW_FLIGHT_REQUEST",
        request: newReq
      }));
      console.log("Sent request to HQ Console:", newReq);
    }

    setShowNewRequestForm(false);
    setActiveTab("FORM");
  };

  const handleTakeoff = (droneId: string) => {
    if (!selectedRequestForMapId) return;
    updateDroneTelemetry(selectedRequestForMapId, droneId, { status: "FLYING", transponderActive: true });
  };

  const handleLand = (droneId: string) => {
    if (!selectedRequestForMapId) return;
    updateDroneTelemetry(selectedRequestForMapId, droneId, { status: "LANDED", transponderActive: false });
    
    // Notify HQ that flight has landed
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "FLIGHT_LANDED",
        flightId: droneId
      }));
    }
  };

  const handleHotSwap = (droneId: string, presetIdx: number) => {
    if (!selectedRequestForMapId) return;
    const newPreset = dronePresets[presetIdx];
    
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

  const handleTigerResponse = (status: "EXECUTED" | "CANNOT_EXECUTE") => {
    if (activeTigerRequestIds.length === 0) {
      setActiveAlert(null);
      setTigerRefusalReason("");
      return;
    }

    const timestamp = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    if (status === "EXECUTED") {
      setFlightStates((prev) => {
        const next = { ...prev };
        activeTigerRequestIds.forEach((reqId) => {
          const req = allRequests.find((r) => r.id === reqId);
          const current = next[reqId];
          if (req && current && current.drones) {
            const updatedDrones = current.drones.map((drone: DroneState, idx: number) => {
              const nextOffset = (drone.altitudeOffset || 0) + 100;
              const angleWithOffset = (drone.angle || 0) + (idx * (2 * Math.PI / 3));
              const baseAlt = req.minAlt + 12 + Math.floor(Math.sin(angleWithOffset) * 5) + (idx * 15);
              const newAlt = baseAlt + nextOffset;

              // Send TIGER_CONFIRMED message via WebSocket to update altitude in the HQ console
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(
                  JSON.stringify({
                    type: "TIGER_CONFIRMED",
                    requestId: reqId,
                    flightId: drone.id,
                    altitude: newAlt,
                  })
                );

                // Send TIGER_RESPONSE with EXECUTED status
                socketRef.current.send(
                  JSON.stringify({
                    type: "TIGER_RESPONSE",
                    status: "EXECUTED",
                    operatorName: operatorName,
                    unit: operatorUnit,
                    requestId: reqId,
                    flightId: drone.id,
                    reason: "",
                    timestamp
                  })
                );
              }

              return {
                ...drone,
                altitudeOffset: nextOffset,
                altitude: newAlt,
              };
            });

            next[reqId] = {
              ...current,
              drones: updatedDrones,
            };
          }
        });
        return next;
      });
    } else {
      // status === "CANNOT_EXECUTE"
      activeTigerRequestIds.forEach((reqId) => {
        const current = flightStates[reqId];
        const req = allRequests.find((r) => r.id === reqId);
        const drones = current?.drones || [
          {
            id: reqId.replace("req", "flight"),
            droneModel: req?.droneModel || "DJI Mavic 3 Pro"
          }
        ];
        drones.forEach((drone: DroneState) => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(
              JSON.stringify({
                type: "TIGER_RESPONSE",
                status: "CANNOT_EXECUTE",
                operatorName: operatorName,
                unit: operatorUnit,
                requestId: reqId,
                flightId: drone.id,
                reason: tigerRefusalReason || "לא ניתן לביצוע",
                timestamp
              })
            );
          }
        });
      });
    }

    setActiveTigerRequestIds([]);
    setActiveAlert(null);
    setTigerRefusalReason("");
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
          {activeTab === "ALERTS" ? (
            /* Alerts Screen */
            <div style={styles.formContainer}>
              <div style={{ padding: "0 2px" }}>
                <h3 style={{ ...styles.formTitle, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Bell size={16} color="#e74c3c" /> התראות נוהל נמר
                </h3>

                {systemAlerts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#7f8c8d" }}>
                    <Bell size={32} color="#2a2a35" style={{ marginBottom: "10px" }} />
                    <p style={{ fontSize: "12px", margin: 0 }}>אין התראות נוהל נמר קיימות בגזרה.</p>
                  </div>
                ) : (
                  systemAlerts.map((alt) => {
                    const isTigerActive = alt.status === "ACTIVE";
                    const statusColor = isTigerActive ? "#e74c3c" : "#2ecc71";
                    const statusLabel = isTigerActive ? "נוהל נמר פעיל" : "אירוע הסתיים";
                    return (
                      <div
                        key={alt.id}
                        style={{
                          backgroundColor: isTigerActive ? "rgba(231,76,60,0.12)" : "rgba(46,204,113,0.1)",
                          border: `1px solid ${isTigerActive ? "rgba(231,76,60,0.4)" : "rgba(46,204,113,0.3)"}`,
                          borderRadius: "8px",
                          padding: "10px 12px",
                          marginBottom: "10px",
                          borderRight: `3px solid ${statusColor}`
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "bold", color: statusColor, display: "flex", alignItems: "center", gap: "4px" }}>
                            {isTigerActive ? <AlertOctagon size={10} /> : <CheckCircle size={10} />} {statusLabel}
                          </span>
                          <span style={{ fontSize: "9px", color: "#7f8c8d" }}>{alt.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#ecf0f1", lineHeight: "1.4" }}>
                          {alt.message}
                        </p>
                      </div>
                    );
                  })
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
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>יחידה/צוות:</label>
                    <input type="text" value={operatorUnit} onChange={(e) => setOperatorUnit(e.target.value)} style={styles.formInput} />
                  </div>
                </div>
              </div>

              {/* Drones Registry */}
              <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "8px", fontWeight: "bold" }}>מאגר הרחפנים שלי ({myDrones.length})</span>
                {myDrones.length === 0 ? (
                  <p style={{ fontSize: "11px", color: "#7f8c8d", margin: "5px 0" }}>אין רחפנים רשומים במאגר.</p>
                ) : (
                  myDrones.map((drone, idx) => (
                    <div key={drone.id || idx} style={{ backgroundColor: "#1c222e", border: "1px solid #2a354a", borderRadius: "6px", padding: "8px", marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: "11px", color: "#ecf0f1", display: "block" }}>{drone.name}</strong>
                          <span style={{ fontSize: "10px", color: "#3498db", display: "block" }}>{drone.model} | זנב: {drone.tailNumber}</span>
                          <span style={{ fontSize: "9px", color: "#7f8c8d", display: "block", marginTop: "2px" }}>התקנים: {drone.devices}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMyDrones(prev => prev.filter((_, i) => i !== idx));
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e74c3c",
                            cursor: "pointer",
                            fontSize: "10px",
                            padding: "2px 5px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(231,76,60,0.12)"
                          }}
                        >
                          מחק
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Drone Form */}
              <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "8px", fontWeight: "bold" }}>הוספת רחפן חדש לרישום</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>שם ייחודי (למטיס):</label>
                    <input type="text" value={newDroneName} onChange={(e) => setNewDroneName(e.target.value)} placeholder="לדוגמה: עין הנשר 1" style={styles.formInput} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>סוג/דגם:</label>
                    <select value={newDroneModelIdx} onChange={(e) => setNewDroneModelIdx(Number(e.target.value))} style={styles.formSelect}>
                      {dronePresets.map((d, i) => <option key={i} value={i}>{d.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>מספר זנב:</label>
                    <input type="text" value={newDroneTail} onChange={(e) => setNewDroneTail(e.target.value)} placeholder="לדוגמה: T-RS88" style={styles.formInput} />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#bdc3c7", display: "block", marginBottom: "4px" }}>התקנים מיוחדים:</label>
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
                        model: dronePresets[newDroneModelIdx].model,
                        devices: newDroneDevices || "ללא",
                        name: newDroneName,
                        status: "INACTIVE"
                      };
                      setMyDrones(prev => [...prev, newDrone]);
                      setNewDroneName("");
                      setNewDroneTail("");
                      setNewDroneDevices("");
                    }}
                    style={{
                      backgroundColor: "#2e7d32",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px 10px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginTop: "4px"
                    }}
                  >
                    + הוסף למאגר הרשום
                  </button>
                </div>
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
                  שמור וסנכרן עם הרוק"ק / חמ"ק
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

              {/* Drone info */}
              <div style={{ backgroundColor: "#1b1b21", border: "1px solid #2a2a35", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#7f8c8d", display: "block", marginBottom: "8px", fontWeight: "bold" }}>רחפן פעיל</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#bdc3c7" }}>דגם</span>
                  <span style={{ fontSize: "11px", color: "#ecf0f1" }}>{currentRequest?.droneModel || "לא הוגדר"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#bdc3c7" }}>מזהה בקשה</span>
                  <span style={{ fontSize: "11px", color: "#ecf0f1" }}>{currentRequest?.id || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#bdc3c7" }}>מצב טיסה</span>
                  <span style={{ fontSize: "11px", color: flightState === "FLYING" ? "#2ecc71" : "#f1c40f" }}>
                    {flightState === "FLYING" ? "באוויר" : flightState === "LANDED" ? "מקורקע" : "מאושר"}
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

              {/* Float Overlay Telemetry Card */}
              <div style={styles.telemetryOverlayCard}>
                <h4 style={styles.telemetryTitle}>טלמטריית כלי</h4>
                <div style={styles.telemetryRow}><strong>מצב טיסה:</strong> {flightState === "FLYING" ? "באוויר" : flightState === "LANDED" ? "מקורקע" : "מאושר"}</div>
                <div style={styles.telemetryRow}><strong>גובה (AGL):</strong> {transponderActive && flightState === "FLYING" ? `${altitude} מ'` : "--"}</div>
                <div style={styles.telemetryRow}><strong>כלי פעיל:</strong> <span style={{ fontSize: "9px" }}>{currentRequest?.droneModel.split(" ")[1] || "--"}</span></div>
              </div>

              {/* Bottom Status Controller Panel */}
              <div style={styles.controlPanel}>
                {/* Request Selector Dropdown */}
                {allRequests.length > 0 && (
                  <div style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                    <span style={{ fontSize: "10px", color: "#888", whiteSpace: "nowrap" }}>מרחב פעיל:</span>
                    <select 
                      value={selectedRequestForMapId || ""} 
                      onChange={(e) => setSelectedRequestForMapId(e.target.value || null)}
                      style={{
                        flex: 1,
                        backgroundColor: "#16161d",
                        border: "1px solid #2e2e38",
                        color: "#fff",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        outline: "none"
                      }}
                    >
                      <option value="">-- בחר בקשת טיסה --</option>
                      {allRequests.map((req) => (
                        <option key={req.id} value={req.id}>
                          {req.id} ({req.polygonName}) [{req.status === "APPROVED" ? "מאושרת" : req.status === "REJECTED" ? "מבוטלת" : "ממתין"}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!currentRequest ? (
                  <div style={styles.noRequestBanner}>
                    <span style={{ fontSize: "11px", flex: 1 }}>אין תיאום טיסה מאושר לגזרה זו.</span>
                    <button style={styles.panelActionBtn} onClick={() => setActiveTab("FORM")}>תאם מרחב</button>
                  </div>
                ) : (
                  <div style={styles.requestStatusCard}>
                    <div style={styles.reqStatusHeader}>
                      <strong style={{ fontSize: "12px" }}>מזהה: {currentRequest.id}</strong>
                      <span style={{ 
                        ...styles.statusBadge, 
                        backgroundColor: currentRequest.status === "APPROVED" ? "#2ecc71" : currentRequest.status === "REJECTED" ? "#e74c3c" : "#e67e22" 
                      }}>
                        {currentRequest.status === "APPROVED" ? "מאושרת" : currentRequest.status === "REJECTED" ? "מבוטלת" : "ממתין לאישור"}
                      </span>
                    </div>
                    
                    {currentRequest.reviewerNotes && (
                      <div style={styles.reviewerNotes}>
                        <strong>הערות רוק"ק:</strong> {currentRequest.reviewerNotes}
                      </div>
                    )}

                    {/* Flight Controls based on flightState */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                      {currentRequest.status === "APPROVED" && (
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
                    <h3 style={{ ...styles.formTitle, margin: 0, borderBottom: "none", paddingBottom: 0 }}>בקשת תיאום מרחב</h3>
                    <button
                      onClick={() => setShowNewRequestForm(false)}
                      style={{ background: "none", border: "none", color: "#7f8c8d", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}
                    >✕</button>
                  </div>

                  {/* 1. Operator Details */}
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionHeader}>פרטי מפעיל (מערכת אול"ר)</h4>
                    <div style={styles.formRow}>
                      <div style={styles.formCol}>
                        <label style={styles.fieldLabel}>שם מפעיל:</label>
                        <input type="text" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} style={styles.formInput} />
                      </div>
                      <div style={styles.formCol}>
                        <label style={styles.fieldLabel}>יחידה/צוות:</label>
                        <input type="text" value={operatorUnit} onChange={(e) => setOperatorUnit(e.target.value)} style={styles.formInput} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Drone details */}
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionHeader}>רישום ופרטי הרחפן</h4>
                    <div style={styles.formField}>
                      <label style={styles.fieldLabel}>בחר רחפן מהרישום:</label>
                      <select value={selectedDroneIdx} onChange={(e) => setSelectedDroneIdx(Number(e.target.value))} style={styles.formSelect}>
                        {myDrones.length > 0 ? (
                          myDrones.map((d, idx) => (
                            <option key={idx} value={idx}>
                              {d.name} ({d.model}) — {d.tailNumber}
                            </option>
                          ))
                        ) : (
                          <option value={0}>אין רחפנים רשומים (אנא הוסף בלשונית פרופיל)</option>
                        )}
                      </select>
                    </div>
                    <div style={styles.formRow}>
                      <div style={styles.formCol}>
                        <label style={styles.fieldLabel}>תדר פעיל:</label>
                        <select value={useAlternativeFreq ? "2.4" : "5.8"} onChange={(e) => setUseAlternativeFreq(e.target.value === "2.4")} style={styles.formSelect}>
                          <option value="5.8">5.8 GHz (ראשי)</option>
                          {activeSelectedPreset && activeSelectedPreset.freq.includes(2.4) && <option value="2.4">2.4 GHz (גיבוי/ל"א)</option>}
                          {activeSelectedPreset && activeSelectedPreset.freq.includes(1.8) && <option value="1.8">1.8 GHz (ייעודי)</option>}
                        </select>
                      </div>
                      <div style={styles.formCol}>
                        <label style={styles.fieldLabel}>סטטוס כלי:</label>
                        <label style={styles.checkboxContainerStyle}>
                          <input type="checkbox" checked={isArmed} onChange={(e) => setIsArmed(e.target.checked)} style={styles.checkboxInput} />
                          <span style={{ color: isArmed ? "#e74c3c" : "#bdc3c7", fontWeight: "bold", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            {isArmed && <AlertTriangle size={12} color="#e74c3c" />}
                            {isArmed ? "כלי חמוש (חמ''מ)" : "כלי לא חמוש"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 3. Space and Time */}
                  <div style={styles.formSection}>
                    <h4 style={styles.formSectionHeader}>גבהים, נתיבים וזמנים</h4>
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
                      <label style={styles.fieldLabel}>זמני פעילות מבוקשים:</label>
                      <input type="text" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} style={styles.formInput} />
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
                  </div>

                  {/* 4. Notes */}
                  <div style={styles.formSection}>
                    <label style={styles.fieldLabel}>הערות מפעיל למשימה:</label>
                    <textarea value={operatorNotes} onChange={(e) => setOperatorNotes(e.target.value)} placeholder="תיאור משימה / בקשות מיוחדות מהמפקדה..." style={styles.formTextarea} />
                  </div>

                  <div style={styles.formActions}>
                    <button style={styles.submitBtn} onClick={handleSubmit}>שדר בקשה</button>
                    <button style={styles.cancelBtn} onClick={() => setShowNewRequestForm(false)}>ביטול</button>
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
                    onClick={() => { setOperatorNotes(""); setShowNewRequestForm(true); }}
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
            onClick={() => setActiveTab("ALERTS")} 
            style={{
              ...styles.navItem,
              color: activeTab === "ALERTS" ? "#e74c3c" : "#7f8c8d",
              borderTop: activeTab === "ALERTS" ? "2px solid #e74c3c" : "2px solid transparent"
            }}
          >
            <span style={styles.navIcon}>
              <span style={{ position: "relative", display: "inline-block" }}>
                <Bell size={18} />
                <span style={{ position: "absolute", top: "-4px", left: "-4px", backgroundColor: "#e74c3c", borderRadius: "50%", width: "8px", height: "8px", border: "1.5px solid #16161d" }} />
              </span>
            </span>
            <span style={styles.navText}>התראות</span>
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
            className={(activeAlert.includes("נמר") || activeTigerRequestIds.length > 0) ? "tiger-alert-box" : ""}
            style={{
              ...styles.alertOverlay,
              backgroundColor: "rgba(10, 10, 14, 0.99)",
              border: (activeAlert.includes("נמר") || activeTigerRequestIds.length > 0) ? "4px solid #f1c40f" : "3px solid #e74c3c",
              boxShadow: (activeAlert.includes("נמר") || activeTigerRequestIds.length > 0) ? "0 0 35px rgba(241, 196, 15, 0.6)" : "0 0 30px rgba(230, 76, 60, 0.6)",
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
              
              {(activeAlert.includes("נמר") || activeTigerRequestIds.length > 0) ? (
                <>
                  <h2 style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "#e74c3c",
                    margin: "0 0 15px 0",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                    fontFamily: "var(--font-family)"
                  }}>נוהל נמר הופעל באזור שלך!</h2>
                  
                  {/* Neon Operational Instruction Badge */}
                  <div style={{
                    backgroundColor: "rgba(241, 196, 15, 0.15)",
                    border: "2px solid #f1c40f",
                    borderRadius: "10px",
                    padding: "15px",
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: "20px",
                    boxShadow: "0 0 15px rgba(241, 196, 15, 0.25)"
                  }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "#f1c40f",
                      display: "block",
                      marginBottom: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "1px"
                    }}>הנחיה מבצעית חיונית</span>
                    <span 
                      className="tiger-instruction-text"
                      style={{
                        fontSize: "18px",
                        fontWeight: 900,
                        color: "#fff",
                        lineHeight: "1.4",
                        display: "block",
                      }}
                    >העלה את הרחפן ב-100 מטר</span>
                  </div>

                  <p style={{
                    fontSize: "12px",
                    color: "#bdc3c7",
                    lineHeight: "1.5",
                    margin: "0 0 20px 0",
                    padding: "0 10px"
                  }}>{activeAlert}</p>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            
            <div style={{ width: "100%" }}>
              {(activeAlert.includes("נמר") || activeTigerRequestIds.length > 0) ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <button
                    className="tiger-btn-confirm"
                    style={{
                      width: "100%",
                      backgroundColor: "#2ecc71",
                      color: "#fff",
                      border: "none",
                      padding: "14px 20px",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(46, 204, 113, 0.4)",
                      transition: "all 0.2s"
                    }}
                    onClick={() => handleTigerResponse("EXECUTED")}
                  >
                    בוצע
                  </button>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginTop: "5px" }}>
                    <label style={{ fontSize: "11px", color: "#a0a0a0", textAlign: "right" }}>סיבת אי-ביצוע:</label>
                    <input 
                      type="text" 
                      placeholder="לדוגמה: בנתק תקשורת מהרחפן" 
                      value={tigerRefusalReason}
                      onChange={(e) => setTigerRefusalReason(e.target.value)}
                      style={{
                        backgroundColor: "#16161a",
                        border: "1px solid #3d424f",
                        borderRadius: "8px",
                        color: "#fff",
                        padding: "8px 12px",
                        fontSize: "12px",
                        outline: "none",
                        textAlign: "right",
                        direction: "rtl"
                      }}
                    />
                  </div>

                  <button
                    style={{
                      width: "100%",
                      backgroundColor: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      padding: "12px 20px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(231, 76, 60, 0.3)",
                      transition: "all 0.2s",
                      marginTop: "5px"
                    }}
                    onClick={() => handleTigerResponse("CANNOT_EXECUTE")}
                  >
                    לא ניתן לביצוע
                  </button>
                </div>
              ) : (
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
              )}
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
  telemetryOverlayCard: {
    position: "absolute",
    top: "10px",
    right: "10px",
    zIndex: 1000,
    backgroundColor: "rgba(22, 22, 29, 0.9)",
    border: "1px solid #2e2e38",
    padding: "8px 12px",
    borderRadius: "6px",
    width: "140px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
  },
  telemetryTitle: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    borderBottom: "1px solid #2e2e38",
    paddingBottom: "4px",
    color: "#3498db",
  },
  telemetryRow: {
    fontSize: "10px",
    marginBottom: "4px",
  },
  controlPanel: {
    position: "absolute",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    width: "92%",
  },
  noRequestBanner: {
    backgroundColor: "#16161d",
    border: "1px solid #2e2e38",
    borderRadius: "6px",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  panelActionBtn: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "11px",
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
