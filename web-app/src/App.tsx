import React, { useState, useEffect, useRef } from "react";
import { SystemHeader } from "./components/shell/SystemHeader";
import { MainSideMenu } from "./components/shell/MainSideMenu";
import { figmaAssets } from "./assets/figmaAssets";
import { TacticalMap } from "./components/TacticalMap";
import { PilotsConsole } from "./components/PilotsConsole";
import { DebriefingConsole } from "./components/DebriefingConsole";
import { OperatorsDronesConsole } from "./components/OperatorsDronesConsole";
import type { Operator, RegisteredDrone } from "./components/OperatorsDronesConsole";
import {
  X,
  AlertTriangle
} from "lucide-react";


type ScreenType = "MAP" | "REQUESTS" | "INCIDENTS" | "OPERATORS" | "PILOTS";

interface Conflict {
  type: string;
  description: string;
}

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
  conflicts: Conflict[];
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

interface ActiveFlight {
  id: string;
  droneModel: string;
  operatorName: string;
  unit: string;
  minAlt: number;
  maxAlt: number;
  currentAlt: number;
  battery: number;
  lastPingSeconds: number;
  status: "ACTIVE" | "COMMS_LOSS" | "ANOMALOUS" | "COMPLETED" | "LANDED";
  tigerStatus?: string;
  tigerReason?: string;
  tigerResponseTime?: string;
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>("MAP");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ganttOpen, setGanttOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [liveTracks, setLiveTracks] = useState<Record<string, any>>({});
  const [approvedCorridors, setApprovedCorridors] = useState<any[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const lastHeartbeatsRef = useRef<Record<string, number>>({});

  const [operators, setOperators] = useState<Operator[]>([
    {
      name: "סמ''ר אלון כהן",
      unit: "גדוד 51",
      status: "FLYING",
      drones: [
        {
          id: "drone-ac51",
          tailNumber: "T-AL51",
          model: "DJI Matrice 300",
          devices: "מצלמה תרמית, פנס",
          name: "עין הנשר 1",
          status: "ACTIVE",
        },
      ],
      lastSeen: "לפני דקה",
    },
    {
      name: "סג''ן דנה לוי",
      unit: "צוות גדסר",
      status: "ONLINE",
      drones: [
        {
          id: "drone-dl88",
          tailNumber: "T-DL88",
          model: "Mavic 3 Enterprise",
          devices: "רמקול כריזה",
          name: "מיפוי-טקטי",
          status: "COMMS_LOSS",
        },
      ],
      lastSeen: "לפני 12 שניות",
    },
    {
      name: "רס''ן יאיר דגן",
      unit: "סיוע חטיבתי",
      status: "OFFLINE",
      drones: [
        {
          id: "drone-yd99",
          tailNumber: "T-YD99",
          model: "Skydio X2D",
          devices: "מערכת עקיבה אוטונומית",
          name: "סקיי-כוח",
          status: "INACTIVE",
        },
      ],
      lastSeen: "לפני שעה",
    },
    {
      name: "סמל רועי שרון",
      unit: "גדוד 12",
      status: "ONLINE",
      drones: [
        {
          id: "drone-rs12",
          tailNumber: "T-RS12",
          model: "DJI Mavic 3 Pro",
          devices: "מצלמה תרמית, זום אופטי",
          name: "צילום גזרתי",
          status: "INACTIVE",
        },
      ],
      lastSeen: "לפני 5 דקות",
    },
  ]);



  // Auto-deconfliction & classification checks
  const runDeconflictionChecks = (req: any) => {
    const conflicts: Conflict[] = [];
    let classification: "GREEN" | "ORANGE" | "RED" = "GREEN";

    if (req.isArmed) {
      conflicts.push({
        type: "ARMED_DRONE",
        description: "כלי חמוש (חמ''מ) - תעופת חימוש מחייבת אישור קמב''ץ / מח''ט!"
      });
      classification = "RED";
    }

    if (req.frequencies?.includes(5.8)) {
      conflicts.push({
        type: "SPECTRUM_WARN",
        description: "פוטנציאל לשיבוש - פוליגון מבוקש חופף לחסימת ל''א (מגן עליון) בתדר 5.8GHz"
      });
      if (classification !== "RED") {
        classification = "ORANGE";
      }
    }

    if (req.polygonName === "מרחב סיוע 4" || req.maxAlt > 100) {
      conflicts.push({
        type: "NFZ_VIOLATION",
        description: "חפיפה לאזור אסור לטיסה (NFZ #2 מטולה) או חריגת גובה מירבי"
      });
      classification = "RED";
    } else if (req.polygonName === "מסדרון גדס''ר" && req.isArmed) {
      conflicts.push({
        type: "SECTOR_CONSTRAINT",
        description: "אילוץ מבצעי - פעילות כוחות קרקעיים בנתיב מסדרון גדס''ר"
      });
      classification = "RED";
    }

    return { conflicts, classification };
  };

  // WebSocket Connection
  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      if (!active) return;
      console.log("HQ Connecting to WebSocket relay...");
      ws = new WebSocket("ws://localhost:8080");

      ws.onopen = () => {
        if (!active) {
          ws?.close();
          return;
        }
        console.log("HQ Connected to WebSocket relay");
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const message = JSON.parse(event.data);
          console.log("HQ Received message:", message);

          if (message.type === "INITIAL_REQUESTS_LOAD") {
            const enriched = message.requests.map((r: any) => {
              const analyzed = runDeconflictionChecks(r);
              return {
                ...r,
                classification: analyzed.classification,
                conflicts: analyzed.conflicts,
              };
            });
            setRequests(enriched);
            
            // Also populate approved corridors for already approved requests
            enriched.forEach((req: any) => {
              if (req.status === "APPROVED") {
                const corridorGeom = (req.polygonType === "CUSTOM" && req.customPolygonPoints && req.customPolygonPoints.length > 0)
                  ? req.customPolygonPoints
                  : req.polygonName === "מסדרון גדס''ר"
                  ? [[33.226, 35.560], [33.238, 35.560], [33.238, 35.572], [33.226, 35.572]]
                  : req.polygonName === "מרחב סיוע 4"
                  ? [[33.250, 35.570], [33.270, 35.570], [33.270, 35.585], [33.250, 35.585]]
                  : [[33.215, 35.562], [33.238, 35.562], [33.238, 35.568], [33.215, 35.568]];

                const corridorId = `approved-${req.id}`;
                const newCorridor = {
                  id: corridorId,
                  name: req.polygonName || "מרחב אווירי מאושר",
                  type: "CORRIDOR",
                  floor: req.minAlt,
                  ceiling: req.maxAlt,
                  color: "#186eff",
                  geometry: corridorGeom,
                };
                setApprovedCorridors((prev) => {
                  if (prev.some((c) => c.id === corridorId)) return prev;
                  return [...prev, newCorridor];
                });
              }
            });
          } else if (message.type === "NEW_FLIGHT_REQUEST") {
            const analyzed = runDeconflictionChecks(message.request);
            const requestWithDeconfliction = {
              ...message.request,
              classification: analyzed.classification,
              conflicts: analyzed.conflicts,
            };
            setRequests((prev) => {
              if (prev.some((r) => r.id === requestWithDeconfliction.id)) return prev;
              
              // Also check for duplicate contents to prevent double-submits
              const isDuplicateContent = prev.some((r) => 
                r.status === "PENDING_REVIEW" &&
                r.operatorName === requestWithDeconfliction.operatorName &&
                r.unit === requestWithDeconfliction.unit &&
                r.droneModel === requestWithDeconfliction.droneModel &&
                r.timeWindow === requestWithDeconfliction.timeWindow &&
                r.polygonName === requestWithDeconfliction.polygonName
              );
              if (isDuplicateContent) return prev;

              return [requestWithDeconfliction, ...prev];
            });
          } else if (message.type === "REGISTER_OPERATOR") {
            setOperators((prev) => {
              const now = new Date();
              const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
              const incoming = message.operator;

              const exists = prev.some((op) => op.name === incoming.name);
              if (exists) {
                return prev.map((op) =>
                  op.name === incoming.name
                    ? {
                        ...op,
                        unit: incoming.unit,
                        drones: incoming.drones.map((d: any) => ({
                          id: d.id || `drone-${Math.floor(1000 + Math.random() * 9000)}`,
                          tailNumber: d.tailNumber,
                          model: d.model,
                          devices: d.devices,
                          name: d.name,
                          status: d.status || "INACTIVE"
                        })),
                        status: "ONLINE" as const,
                        lastSeen: `עודכן ב-${timeStr}`,
                      }
                    : op
                );
              } else {
                return [
                  ...prev,
                  {
                    name: incoming.name,
                    unit: incoming.unit,
                    drones: incoming.drones.map((d: any) => ({
                      id: d.id || `drone-${Math.floor(1000 + Math.random() * 9000)}`,
                      tailNumber: d.tailNumber,
                      model: d.model,
                      devices: d.devices,
                      name: d.name,
                      status: d.status || "INACTIVE"
                    })),
                    status: "ONLINE" as const,
                    lastSeen: `רשום מ-${timeStr}`,
                  },
                ];
              }
            });
          } else if (message.type === "TELEMETRY_PING") {
            setFlights((prev) => {
              const exists = prev.some((f) => f.id === message.flightId);
              if (!exists) {
                const newF: ActiveFlight = {
                  id: message.flightId,
                  droneModel: message.droneModel,
                  operatorName: message.operatorName,
                  unit: message.unit,
                  minAlt: 20,
                  maxAlt: 150,
                  currentAlt: message.alt,
                  battery: message.battery,
                  lastPingSeconds: 0,
                  status: "ACTIVE",
                };
                return [...prev, newF];
              }
              return prev.map((f) => {
                if (f.id === message.flightId) {
                  return {
                    ...f,
                    currentAlt: message.alt,
                    battery: message.battery,
                    lastPingSeconds: 0,
                    status: f.status === "COMMS_LOSS" ? "ACTIVE" : f.status,
                  };
                }
                return f;
              });
            });

            lastHeartbeatsRef.current[message.flightId] = Date.now();

            setLiveTracks((prev) => ({
              ...prev,
              [message.flightId]: {
                id: `אול''ר - ${message.operatorName}`,
                type: message.droneModel,
                iffStatus: "BLUE_CERTAIN",
                coordinates: { lat: message.lat, lng: message.lng, altMsl: message.alt },
                speedKts: 13,
                heading: message.heading ?? 45,
              },
            }));
          } else if (message.type === "OPERATOR_HEARTBEAT") {
            lastHeartbeatsRef.current[message.flightId] = Date.now();
            setFlights((prev) =>
              prev.map((f) => {
                if (f.id === message.flightId) {
                  let nextStatus = f.status;
                  if (message.status === "LANDED") {
                    nextStatus = "LANDED";
                  } else if (message.status === "FLYING" && (f.status === "COMMS_LOSS" || f.status === "LANDED")) {
                    nextStatus = "ACTIVE";
                  } else if (message.status === "APPROVED" && f.status === "COMMS_LOSS") {
                    nextStatus = "ACTIVE";
                  }
                  return { ...f, status: nextStatus };
                }
                return f;
              })
            );
          } else if (message.type === "FLIGHT_LANDED") {
            setFlights((prev) =>
              prev.map((f) => (f.id === message.flightId ? { ...f, status: "LANDED" } : f))
            );
            setLiveTracks((prev) => {
              const copy = { ...prev };
              delete copy[message.flightId];
              return copy;
            });
          } else if (message.type === "HOT_SWAP_DRONE") {
            setFlights((prev) =>
              prev.map((f) => (f.id === message.flightId ? { ...f, droneModel: message.droneModel } : f))
            );
          } else if (message.type === "DEACTIVATE_FLIGHT") {
            const isBaseId = !message.flightId.includes("-", 7);
            const prefix = message.flightId.split("-").slice(0, 2).join("-");
            
            setFlights((prev) =>
              prev.map((f) => {
                if (f.id === message.flightId || (isBaseId && f.id.startsWith(prefix))) {
                  return { ...f, status: "COMPLETED" };
                }
                return f;
              })
            );
            
            if (isBaseId) {
              const baseReqId = message.flightId.replace("flight", "req");
              setApprovedCorridors((prev) => prev.filter((c) => c.id !== `approved-${baseReqId}`));
            }
            
            setLiveTracks((prev) => {
              const copy = { ...prev };
              if (isBaseId) {
                Object.keys(copy).forEach(k => {
                  if (k === message.flightId || k.startsWith(prefix + "-")) {
                    delete copy[k];
                  }
                });
              } else {
                delete copy[message.flightId];
              }
              return copy;
            });
          } else if (message.type === "TIGER_CONFIRMED") {
            setFlights((prev) =>
              prev.map((f) =>
                f.id === message.flightId
                  ? { ...f, currentAlt: message.altitude, tigerStatus: "CONFIRMED" }
                  : f
              )
            );
            setLiveTracks((prev) => {
              if (prev[message.flightId]) {
                return {
                  ...prev,
                  [message.flightId]: {
                    ...prev[message.flightId],
                    coordinates: {
                      ...prev[message.flightId].coordinates,
                      altMsl: message.altitude,
                    },
                    tigerStatus: "CONFIRMED",
                  },
                };
              }
              return prev;
            });
          } else if (message.type === "TIGER_RESPONSE") {
            setFlights((prev) =>
              prev.map((f) =>
                f.id === message.flightId
                  ? {
                      ...f,
                      tigerStatus: message.status === "EXECUTED" ? "CONFIRMED" : message.status,
                      tigerReason: message.reason || "",
                      tigerResponseTime: message.timestamp || "",
                    }
                  : f
              )
            );
            setLiveTracks((prev) => {
              if (prev[message.flightId]) {
                return {
                  ...prev,
                  [message.flightId]: {
                    ...prev[message.flightId],
                    tigerStatus: message.status === "EXECUTED" ? "CONFIRMED" : message.status,
                    tigerReason: message.reason || "",
                    tigerResponseTime: message.timestamp || "",
                  },
                };
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("HQ WS parse error:", err);
        }
      };

      ws.onclose = () => {
        if (!active) return;
        console.log("HQ WS disconnected. Reconnecting in 3s...");
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

  // Shared Requests State
  const [requests, setRequests] = useState<FlightRequest[]>([]);

  // Shared Active Flights State
  const [flights, setFlights] = useState<ActiveFlight[]>([
    {
      id: "flight-104",
      droneModel: "DJI Matrice 300",
      operatorName: "סמ''ר אלון כהן",
      unit: "גדוד 51",
      minAlt: 20,
      maxAlt: 80,
      currentAlt: 45,
      battery: 82,
      lastPingSeconds: 1,
      status: "ACTIVE",
    },
    {
      id: "flight-105",
      droneModel: "Mavic 3 Enterprise",
      operatorName: "סג''ן דנה לוי",
      unit: "צוות גדסר",
      minAlt: 10,
      maxAlt: 50,
      currentAlt: 48,
      battery: 74,
      lastPingSeconds: 12,
      status: "COMMS_LOSS",
    },
  ]);

  // Sync drone status in operators list with flights state
  useEffect(() => {
    setOperators((prevOps) => {
      let changed = false;
      const nextOps = prevOps.map((op) => {
        const nextDrones = op.drones.map((drone) => {
          const activeFlight = flights.find(
            (f) =>
              f.operatorName === op.name &&
              f.droneModel === drone.model &&
              f.status !== "COMPLETED" &&
              f.status !== "LANDED"
          );

          let targetStatus: RegisteredDrone["status"] = "INACTIVE";
          if (activeFlight) {
            targetStatus =
              activeFlight.status === "ACTIVE"
                ? "ACTIVE"
                : activeFlight.status === "COMMS_LOSS"
                ? "COMMS_LOSS"
                : activeFlight.status === "ANOMALOUS"
                ? "ANOMALOUS"
                : "INACTIVE";
          }

          if (drone.status !== targetStatus) {
            changed = true;
            return { ...drone, status: targetStatus };
          }
          return drone;
        });

        let overallStatus: Operator["status"] = "ONLINE";
        const hasFlying = nextDrones.some(
          (d) =>
            d.status === "ACTIVE" ||
            d.status === "COMMS_LOSS" ||
            d.status === "ANOMALOUS"
        );
        if (hasFlying) {
          overallStatus = "FLYING";
        } else {
          overallStatus = op.name === "רס''ן יאיר דגן" ? "OFFLINE" : "ONLINE";
        }

        if (op.status !== overallStatus || nextDrones !== op.drones) {
          changed = true;
          return { ...op, drones: nextDrones, status: overallStatus };
        }
        return op;
      });

      return changed ? nextOps : prevOps;
    });
  }, [flights]);

  // Update active flight pings
  useEffect(() => {
    const flightInterval = setInterval(() => {
      setFlights((prev) =>
        prev.map((f) => {
          if (f.status === "COMPLETED" || f.status === "LANDED") return f;

          const lastHb = lastHeartbeatsRef.current[f.id];
          let nextStatus = f.status;

          if (lastHb && Date.now() - lastHb > 8000) {
            nextStatus = "COMMS_LOSS";
          } else {
            const nextPings = f.lastPingSeconds + 1;
            if (nextPings > 10) {
              nextStatus = "COMMS_LOSS";
            } else if (f.currentAlt > f.maxAlt || f.currentAlt < f.minAlt) {
              nextStatus = "ANOMALOUS";
            } else {
              nextStatus = "ACTIVE";
            }

            return {
              ...f,
              lastPingSeconds: nextPings,
              status: nextStatus,
            };
          }

          return {
            ...f,
            status: nextStatus,
          };
        })
      );
    }, 1000);

    return () => {
      clearInterval(flightInterval);
    };
  }, []);

  // Sync approved requests to active flights
  const handleReviewRequest = (id: string, action: "APPROVED" | "REJECTED" | "CONFLICT" | "REMOVE", notes: string) => {
    if (action === "REMOVE") {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      const flightId = id.replace("req", "flight");
      setFlights((prev) => prev.map((f) => f.id === flightId ? { ...f, status: "COMPLETED" } : f));
      setApprovedCorridors((prev) => prev.filter((c) => c.id !== `approved-${id}`));
      setLiveTracks((prev) => {
        const copy = { ...prev };
        delete copy[flightId];
        return copy;
      });
    } else {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action, reviewerNotes: notes } : r))
      );
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "REVIEW_FLIGHT_REQUEST",
          requestId: id,
          status: action,
          reviewerNotes: notes,
        })
      );
    }

    if (action === "APPROVED") {
      const req = requests.find((r) => r.id === id);
      if (req) {
        const corridorGeom = (req.polygonType === "CUSTOM" && req.customPolygonPoints && req.customPolygonPoints.length > 0)
          ? req.customPolygonPoints
          : req.polygonName === "מסדרון גדס''ר"
          ? [[33.226, 35.560], [33.238, 35.560], [33.238, 35.572], [33.226, 35.572]]
          : req.polygonName === "מרחב סיוע 4"
          ? [[33.250, 35.570], [33.270, 35.570], [33.270, 35.585], [33.250, 35.585]]
          : [[33.215, 35.562], [33.238, 35.562], [33.238, 35.568], [33.215, 35.568]];

        const corridorId = `approved-${id}`;
        const newCorridor = {
          id: corridorId,
          name: req.polygonName || "מרחב אווירי מאושר",
          type: "CORRIDOR",
          floor: req.minAlt,
          ceiling: req.maxAlt,
          color: "#186eff",
          geometry: corridorGeom,
        };
        setApprovedCorridors((prev) => {
          if (prev.some((c) => c.id === corridorId)) return prev;
          return [...prev, newCorridor];
        });

        const flightId = id.replace("req", "flight");
        const newFlight: ActiveFlight = {
          id: flightId,
          droneModel: req.droneModel,
          operatorName: req.operatorName,
          unit: req.unit,
          minAlt: req.minAlt,
          maxAlt: req.maxAlt,
          currentAlt: req.minAlt + 10,
          battery: 95,
          lastPingSeconds: 0,
          status: "ACTIVE",
        };
        setFlights((prev) => {
          if (prev.some((f) => f.id === flightId)) return prev;
          return [...prev, newFlight];
        });
      }
    } else if (action === "CONFLICT") {
      const corridorId = `approved-${id}`;
      setApprovedCorridors((prev) => prev.filter((c) => c.id !== corridorId));
      const flightId = id.replace("req", "flight");
      setFlights((prev) => prev.map((f) => f.id === flightId ? { ...f, status: "COMPLETED" } : f));
      setLiveTracks((prev) => {
        const copy = { ...prev };
        delete copy[flightId];
        return copy;
      });
    }
  };



  const handleTriggerAlert = (alertMsg: string, metadata?: { alertType?: string; threatLocation?: { lat: number; lng: number } }) => {
    setActiveAlert(alertMsg);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "CRITICAL_ALERT",
          message: alertMsg,
          ...metadata,
        })
      );
    }
  };

  const handleRemoveLiveTrack = (trackId: string) => {
    const prefix = trackId.split("-").slice(0, 2).join("-");
    const isBaseId = !trackId.includes("-", 7);
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "DEACTIVATE_FLIGHT",
        flightId: trackId
      }));
    }
    
    setFlights((prev) =>
      prev.map((f) => {
        if (f.id === trackId || (isBaseId && f.id.startsWith(prefix))) {
          return { ...f, status: "COMPLETED" };
        }
        return f;
      })
    );
    if (isBaseId) {
      const baseReqId = trackId.replace("flight", "req");
      setApprovedCorridors((prev) => prev.filter((c) => c.id !== `approved-${baseReqId}`));
    }
    setLiveTracks((prev) => {
      const copy = { ...prev };
      if (isBaseId) {
        Object.keys(copy).forEach(k => {
          if (k === trackId || k.startsWith(prefix + "-")) {
            delete copy[k];
          }
        });
      } else {
        delete copy[trackId];
      }
      return copy;
    });
  };

  const handleCreateRequest = (newReq: FlightRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  const handleUpdateRequestCoordinates = (id: string, points: [number, number][]) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, customPolygonPoints: points, polygonType: "CUSTOM" } : r))
    );
    setApprovedCorridors((prev) =>
      prev.map((c) => (c.id === `approved-${id}` ? { ...c, geometry: points } : c))
    );
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "MAP":
        return (
          <TacticalMap
            onTriggerAlert={handleTriggerAlert}
            liveTracks={Object.values(liveTracks)}
            approvedCorridors={approvedCorridors}
            flights={flights}
            requests={requests}
            onReviewRequest={handleReviewRequest}
            showRequestsQueue={false}
            onRemoveLiveTrack={handleRemoveLiveTrack}
            showGantt={ganttOpen}
            onGanttToggle={() => setGanttOpen(!ganttOpen)}
            onCreateRequest={handleCreateRequest}
            onUpdateRequestCoordinates={handleUpdateRequestCoordinates}
          />
        );
      case "REQUESTS":
        return (
          <TacticalMap
            onTriggerAlert={handleTriggerAlert}
            liveTracks={Object.values(liveTracks)}
            approvedCorridors={approvedCorridors}
            flights={flights}
            requests={requests}
            onReviewRequest={handleReviewRequest}
            showRequestsQueue={true}
            onRemoveLiveTrack={handleRemoveLiveTrack}
            showGantt={ganttOpen}
            onGanttToggle={() => setGanttOpen(!ganttOpen)}
            onCreateRequest={handleCreateRequest}
            onUpdateRequestCoordinates={handleUpdateRequestCoordinates}
          />
        );

      case "PILOTS":
        return <PilotsConsole flights={flights} />;
      case "INCIDENTS":
        return <DebriefingConsole onTriggerAlert={handleTriggerAlert} />;
      case "OPERATORS":
        return (
          <OperatorsDronesConsole
            operators={operators}
            flights={flights}
            requests={requests}
          />
        );
    }
  };

  const getScreenTitle = (screen: ScreenType) => {
    switch (screen) {
      case "MAP":
        return 'תמנ"צ שמיים חטיבתית';
      case "REQUESTS":
        return "מרכז אישורי טיסה";

      case "PILOTS":
        return "מאגר מטיסים";
      case "INCIDENTS":
        return "תחקור וניתוח מרחבי";
      case "OPERATORS":
        return "מאגר רחפנים";
    }
  };

  const navItems: { screen: ScreenType; icon: string; label: string; badge?: number }[] = [
    { screen: "MAP", icon: figmaAssets.sideMenuAreaIcon, label: "מפה" },
    {
      screen: "REQUESTS",
      icon: figmaAssets.sideMenuMissionIcon,
      label: "בקשות",
      badge: requests.filter((r) => r.status === "PENDING_REVIEW").length,
    },
    { screen: "PILOTS", icon: figmaAssets.sideMenuCrewTreeIcon, label: "מטיסים" },
    { screen: "OPERATORS", icon: figmaAssets.sideMenuCrewTreeIcon, label: "מאגר רחפנים" },
    { screen: "INCIDENTS", icon: figmaAssets.sideMenuJournalIcon, label: "תחקור", badge: 3 },
  ];

  return (
    <div style={styles.appShell}>
      {/* ── Critical Alert Banner ── */}
      {activeAlert && (
        <div style={styles.alertBanner} onClick={() => setActiveAlert(null)}>
          <span style={styles.alertIcon}><AlertTriangle size={14} color="var(--red-9)" style={{ marginLeft: 6 }} /></span>
          <span style={styles.alertText}>{activeAlert}</span>
          <span style={styles.alertDismiss}><X size={14} color="var(--red-9)" /></span>
        </div>
      )}

      <SystemHeader
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(o => !o)}
        ganttOpen={ganttOpen}
        onGanttToggle={() => setGanttOpen(o => !o)}
      />

      {/* ── Main Body ── */}
      <div style={styles.mainBody}>
        {sidebarOpen && <MainSideMenu />}
        {/* Sidebar Navigation */}
        <nav style={styles.sidebar}>
          <ul style={styles.navQueue}>
            {navItems.map(({ screen, icon, label, badge }) => {
              const isActive = activeScreen === screen;
              return (
                <li
                  key={screen}
                  onClick={() => setActiveScreen(screen)}
                  title={label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    flexShrink: 0,
                    cursor: 'pointer',
                    padding: '8px 0',
                  }}
                >
                  <button
                    type="button"
                    style={{
                      position: 'relative',
                      width: 43,
                      height: 44,
                      padding: 0,
                      border: isActive ? '1px solid #989ca6' : '1px solid #474747',
                      borderRadius: 8,
                      background: isActive
                        ? 'linear-gradient(222.29deg, #676b72 2.16%, #4f5259 97.84%)'
                        : '#3a3b40',
                      boxShadow: isActive ? '0 0 1px rgba(0,0,0,0.8)' : '0 0 2px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={icon}
                      alt=""
                      width={20}
                      height={20}
                      style={{
                        display: 'block',
                        objectFit: 'contain',
                        opacity: isActive ? 1 : 0.7,
                      }}
                    />
                    {badge !== undefined && badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: screen === "INCIDENTS" ? "var(--red-8)" : "var(--yellow-9)",
                        color: screen === "INCIDENTS" ? "var(--neutral-white)" : "var(--neutral-1)",
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        boxSizing: 'border-box',
                        boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                      }}>
                        {badge}
                      </span>
                    )}
                  </button>
                  <span style={{
                    margin: '4px 0 0',
                    fontFamily: 'var(--ds-font)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '11px',
                    lineHeight: 'normal',
                    color: isActive ? '#e6f5ff' : '#b5bac6',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Sidebar bottom status */}
          <div style={styles.sidebarStatus}>
            <div style={styles.wsIndicator}>
              <div style={styles.wsStatusDot} />
              <span style={styles.wsStatusText}>LIVE</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={styles.contentArea}>
          <div style={styles.contentHeader}>
            <div style={styles.contentTitleRow}>
              <div style={styles.contentTitleAccent} />
              <span style={styles.contentTitle}>{getScreenTitle(activeScreen)}</span>
            </div>
            <div style={styles.contentMeta}>
              <span style={styles.contentMetaText}>מצב: פעיל</span>
              <div style={styles.contentMetaDot} />
            </div>
          </div>
          {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appShell: {
    display: "flex",
    flexDirection: "column",
    width: "100vw",
    height: "100vh",
    backgroundColor: "var(--neutral-1)",
    overflow: "hidden",
    fontFamily: "var(--font-family)",
    direction: "rtl",
  },

  // ── Alert Banner ──
  alertBanner: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
    backgroundColor: "var(--red-3)",
    borderBottom: "1px solid var(--red-8)",
    padding: "var(--space-2) var(--space-5)",
    cursor: "pointer",
    animation: "slide-in 0.2s ease",
    zIndex: 200,
  },
  alertIcon: { fontSize: "14px" },
  alertText: {
    flex: 1,
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--red-10)",
    lineHeight: "var(--lh-sm)",
  },
  alertDismiss: {
    fontSize: "12px",
    color: "var(--red-9)",
    opacity: 0.7,
    cursor: "pointer",
  },

  // ── Header ──
  topHeader: {
    height: "46px",
    backgroundColor: "#1B1C1D",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    zIndex: 1000,
    boxSizing: "border-box" as any,
    flexShrink: 0,
    position: "relative",
    direction: "rtl",
  },
  figmaRightSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  figmaPillButton: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#3B3C3E",
    border: "1px solid #56585D",
    borderRadius: "4px",
    padding: "4px 10px",
    cursor: "pointer",
    userSelect: "none" as any,
    height: "28px",
    boxSizing: "border-box" as any,
  },
  figmaLayoutIcon: {
    cursor: "pointer",
    fontSize: "15px",
    color: "#8F91A0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    transition: "color 0.2s",
  },
  figmaCrestBadge: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#3B3C3E",
    boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.8)",
    border: "1px solid #56585D",
    borderRadius: "4px",
    padding: "4px 12px",
    cursor: "pointer",
    userSelect: "none" as any,
    height: "36px",
  },
  figmaCrestTitle: {
    fontFamily: "Assistant, sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    color: "#E6F5FF",
    lineHeight: "1.2",
    textAlign: "right",
  },
  figmaCrestSubtitle: {
    fontFamily: "Assistant, sans-serif",
    fontSize: "10px",
    color: "#A9C3CE",
    lineHeight: "1.1",
    textAlign: "right",
  },
  figmaCrestLogo: {
    margin: "0 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  figmaCrestArrow: {
    fontSize: "9px",
    color: "#8F91A0",
    marginRight: "10px",
  },
  figmaCrestBlueBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#186EFF",
    borderRadius: "4px",
    width: "20px",
    height: "20px",
    marginRight: "10px",
    cursor: "pointer",
  },
  figmaSearchBox: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  figmaSearchInput: {
    backgroundColor: "#3B3C3E",
    border: "none",
    borderRadius: "23px",
    height: "28px",
    padding: "0 12px 0 32px",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
    width: "180px",
    direction: "rtl",
  },
  figmaSearchIcon: {
    position: "absolute",
    left: "10px",
    fontSize: "12px",
    color: "#B6B6B6",
  },
  figmaLeftContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  figmaIconWrapper: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
  },
  figmaIcon: {
    fontSize: "14px",
    color: "#E6F5FF",
  },
  figmaNotificationDot: {
    position: "absolute",
    top: "3px",
    right: "3px",
    width: "5px",
    height: "5px",
    backgroundColor: "#FF4848",
    borderRadius: "50%",
  },
  figmaDivider: {
    width: "1px",
    height: "16px",
    backgroundColor: "#3B3C3F",
  },
  figmaDateTime: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "monospace",
  },
  figmaTacticalButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B3C3E",
    border: "1px solid #56585D",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    height: "28px",
    boxSizing: "border-box" as any,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  figmaUserCard: {
    position: "relative",
    width: "740px",
    backgroundColor: "#16171A",
    borderRadius: "8px",
    border: "1px solid #2A2E37",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
    direction: "rtl",
  },
  modalHeaderBar: {
    height: "40px",
    backgroundColor: "#111113",
    borderBottom: "1px solid #25272E",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
  },
  modalHeaderTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#E6F5FF",
    fontFamily: "Assistant, sans-serif",
  },
  modalBody: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    backgroundColor: "rgba(22, 23, 26, 0.95)",
    backdropFilter: "blur(8px)",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    direction: "rtl",
  },
  gridColumn: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  figmaCardEmblemBox: {
    width: "56px",
    height: "56px",
    backgroundColor: "#22252A",
    border: "1px solid #3D424F",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  modalFieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    width: "100%",
  },
  modalFieldLabel: {
    fontSize: "13px",
    color: "#A9C3CE",
    fontFamily: "Assistant, sans-serif",
    fontWeight: 500,
    textAlign: "center" as any,
    width: "100%",
  },
  modalInput: {
    width: "100%",
    backgroundColor: "#22252A",
    border: "1px solid #3D424F",
    borderRadius: "4px",
    color: "#fff",
    height: "32px",
    padding: "0 10px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as any,
    direction: "rtl",
    textAlign: "center" as any,
  },
  modalSelectWrapper: {
    position: "relative",
    width: "100%",
  },
  modalSelect: {
    width: "100%",
    backgroundColor: "#22252A",
    border: "1px solid #3D424F",
    borderRadius: "4px",
    color: "#fff",
    height: "32px",
    padding: "0 28px 0 10px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as any,
    appearance: "none" as any,
    direction: "rtl",
    textAlign: "center" as any,
  },
  modalSelectArrow: {
    position: "absolute",
    left: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none" as any,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "20px",
    borderTop: "1px solid #2A2E37",
    paddingTop: "16px",
  },
  modalDisconnectBtn: {
    backgroundColor: "#FF0000",
    color: "#000000",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    padding: "6px 24px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  artilleryDropdown: {
    position: "absolute",
    top: "32px",
    right: 0,
    width: "200px",
    backgroundColor: "#16171A",
    border: "1px solid #2A2E37",
    borderRadius: "8px",
    padding: "12px",
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
    zIndex: 10000,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    direction: "rtl",
  },
  artilleryDropdownCategory: {
    fontSize: "11px",
    color: "#8F91A0",
    fontWeight: "bold",
    textAlign: "right" as any,
    marginTop: "8px",
    marginBottom: "4px",
    paddingRight: "2px",
  },
  artilleryDropdownText: {
    fontSize: "13px",
    color: "#E6F5FF",
    fontWeight: 500,
    flexGrow: 1,
    textAlign: "right" as any,
  },
  artilleryDropdownIconBox: {
    width: "26px",
    height: "26px",
    backgroundColor: "#2C3038",
    border: "1px solid #3D424F",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  },
  logoPulse: {
    position: "relative",
    width: "14px",
    height: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "var(--blue-8)",
    borderRadius: "50%",
    boxShadow: "var(--shadow-glow-blue)",
    position: "relative",
    zIndex: 1,
  },
  logoDotRing: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "1px solid var(--blue-8)",
    opacity: 0.4,
    animation: "pulse-glow 2s infinite",
  },
  brandText: {
    display: "flex",
    flexDirection: "column" as any,
    gap: "0px",
  },
  logoText: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-bold)" as any,
    color: "var(--neutral-white)",
    margin: 0,
    lineHeight: "1.2",
    letterSpacing: "0.3px",
  },
  logoSub: {
    fontSize: "10px",
    color: "var(--neutral-10)",
    lineHeight: "1",
  },

  liveStats: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
    backgroundColor: "var(--neutral-3)",
    padding: "var(--space-2) var(--space-4)",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--neutral-5)",
  },
  statItem: {
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "center",
    gap: "1px",
  },
  statLabel: {
    fontSize: "10px",
    color: "var(--neutral-10)",
    lineHeight: "1",
    whiteSpace: "nowrap" as any,
  },
  statValue: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-bold)" as any,
    lineHeight: "1.2",
  },
  statDivider: {
    width: "1px",
    height: "24px",
    backgroundColor: "var(--neutral-6)",
  },

  metaInfo: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  },
  clock: {
    fontSize: "var(--text-xs)",
    color: "var(--neutral-11)",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.5px",
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    backgroundColor: "var(--neutral-3)",
    padding: "var(--space-1) var(--space-3)",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--neutral-6)",
  },
  userAvatar: {
    width: "24px",
    height: "24px",
    backgroundColor: "var(--blue-5)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "var(--fw-bold)" as any,
    color: "var(--blue-11)",
  },
  userProfile: {
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "flex-end",
  },
  userRole: {
    fontSize: "9px",
    color: "var(--neutral-10)",
    lineHeight: "1",
  },
  userName: {
    fontSize: "11px",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-white)",
    lineHeight: "1.2",
  },

  // ── Main Body ──
  mainBody: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 38px)",
    width: "100%",
    overflow: "hidden",
  },

  // ── Sidebar ──
  sidebar: {
    width: "64px",
    backgroundColor: "rgba(20, 21, 26, 0.8)",
    backdropFilter: "blur(4px)",
    borderLeft: "1px solid rgba(87, 95, 112, 0.3)",
    display: "flex",
    flexDirection: "column" as any,
    justifyContent: "space-between",
    boxSizing: "border-box" as any,
    flexShrink: 0,
  },
  navQueue: {
    listStyle: "none",
    padding: "var(--space-2) 0",
    margin: 0,
    display: "flex",
    flexDirection: "column" as any,
    gap: "var(--space-1)",
  },
  navItem: {
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-3) 0",
    cursor: "pointer",
    transition: "background-color var(--transition-base), color var(--transition-base)",
    position: "relative" as any,
    gap: "var(--space-1)",
    userSelect: "none" as any,
  },
  navIcon: {
    fontSize: "16px",
    lineHeight: "1",
  },
  navSubtext: {
    fontSize: "9px",
    fontWeight: "var(--fw-semibold)" as any,
    letterSpacing: "0.3px",
    lineHeight: "1",
  },
  badgeCountMini: {
    position: "absolute" as any,
    top: "6px",
    right: "10px",
    fontSize: "8px",
    fontWeight: "var(--fw-bold)" as any,
    padding: "1px 4px",
    borderRadius: "var(--radius-full)",
    lineHeight: "1.2",
    minWidth: "14px",
    textAlign: "center" as any,
  },

  sidebarStatus: {
    padding: "var(--space-3) 0",
    display: "flex",
    justifyContent: "center",
    borderTop: "1px solid var(--neutral-5)",
  },
  wsIndicator: {
    display: "flex",
    flexDirection: "column" as any,
    alignItems: "center",
    gap: "3px",
  },
  wsStatusDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "var(--green-9)",
    borderRadius: "50%",
    boxShadow: "var(--shadow-glow-green)",
    animation: "blink 2s infinite",
  },
  wsStatusText: {
    fontSize: "8px",
    color: "var(--green-11)",
    fontWeight: "var(--fw-bold)" as any,
    letterSpacing: "0.5px",
  },

  // ── Content Area ──
  contentArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as any,
    backgroundColor: "var(--neutral-1)",
    overflow: "hidden",
  },
  contentHeader: {
    height: "38px",
    backgroundColor: "var(--neutral-2)",
    borderBottom: "1px solid var(--neutral-5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 var(--space-5)",
    flexShrink: 0,
  },
  contentTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  },
  contentTitleAccent: {
    width: "2px",
    height: "14px",
    backgroundColor: "var(--blue-8)",
    borderRadius: "var(--radius-full)",
  },
  contentTitle: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-12)",
    textTransform: "uppercase" as any,
    letterSpacing: "0.8px",
  },
  contentMeta: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  },
  contentMetaText: {
    fontSize: "10px",
    color: "var(--neutral-10)",
  },
  contentMetaDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "var(--green-9)",
    borderRadius: "50%",
    boxShadow: "var(--shadow-glow-green)",
  },
};
