import React, { useState, useEffect } from "react";

// Interfaces based on database models
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
}

interface Zone {
  id: string;
  name: string;
  type: "CORRIDOR" | "NFZ" | "RESTRICTED";
  floor: number;
  ceiling: number;
  color: string;
}

export const TacticalMap: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "track-104",
      type: "DJI Matrice 300",
      iffStatus: "BLUE_CERTAIN",
      coordinates: { lat: 31.8923, lng: 34.8012, altMsl: 152 },
      speedKts: 18,
      heading: 45,
    },
    {
      id: "sensor-rad-8812",
      type: "Unidentified Copter",
      iffStatus: "UNIDENTIFIED",
      coordinates: { lat: 31.899, lng: 34.811, altMsl: 340 },
      speedKts: 45,
      heading: 180,
    },
  ]);

  const [zones] = useState<Zone[]>([
    {
      id: "zone-1",
      name: "פרוזדור ינשוף 2",
      type: "CORRIDOR",
      floor: 20,
      ceiling: 80,
      color: "rgba(46, 204, 113, 0.2)",
    },
    {
      id: "zone-2",
      name: "אזור אסור חרמון",
      type: "NFZ",
      floor: 0,
      ceiling: 500,
      color: "rgba(231, 76, 60, 0.2)",
    },
    {
      id: "zone-3",
      name: "חסימת אלישע - 2.4G",
      type: "RESTRICTED",
      floor: 0,
      ceiling: 200,
      color: "rgba(155, 89, 182, 0.2)",
    },
  ]);

  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [activeIncident, setActiveIncident] = useState<string | null>(null);

  // Simulate real-time movement updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTracks((prev) =>
        prev.map((t) => {
          const headingRad = (t.heading * Math.PI) / 180;
          const deltaLat = (Math.cos(headingRad) * 0.0001 * t.speedKts) / 30;
          const deltaLng = (Math.sin(headingRad) * 0.0001 * t.speedKts) / 30;
          return {
            ...t,
            coordinates: {
              ...t.coordinates,
              lat: t.coordinates.lat + deltaLat,
              lng: t.coordinates.lng + deltaLng,
            },
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getIFFColor = (status: Track["iffStatus"]) => {
    switch (status) {
      case "BLUE_CERTAIN":
        return "#2ecc71"; // Green
      case "BLUE_SUSPICIOUS":
        return "#3498db"; // Blue/cyan
      case "BLUE_ANOMALOUS":
        return "#f1c40f"; // Yellow
      case "UNIDENTIFIED":
        return "#e67e22"; // Orange
      case "RED_SUSPICIOUS":
      case "RED_CERTAIN":
        return "#e74c3c"; // Red
      case "CONFLICTING":
        return "#9b59b6"; // Purple
      default:
        return "#7f8c8d";
    }
  };

  const handleAction = (action: string, track: Track) => {
    if (action === "TIGER") {
      setActiveIncident(`נמר פעיל על מטרת שמיים: ${track.id}`);
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, iffStatus: "RED_CERTAIN" } : t))
      );
    } else if (action === "HAMMER") {
      setActiveIncident(`פטיש אוויר הופעל בגזרת המטרה: ${track.id}`);
    } else if (action === "BLUE") {
      setTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, iffStatus: "BLUE_CERTAIN" } : t))
      );
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Controls */}
      <div style={styles.layerPanel}>
        <h3 style={styles.panelTitle}>שכבות תמנ"צ</h3>
        <div style={styles.layerItem}>
          <input type="checkbox" defaultChecked /> שכבת מטרות סנסורים
        </div>
        <div style={styles.layerItem}>
          <input type="checkbox" defaultChecked /> פוליגונים מאושרים (ירוק)
        </div>
        <div style={styles.layerItem}>
          <input type="checkbox" defaultChecked /> אזורים אסורי טיסה (אדום)
        </div>
        <div style={styles.layerItem}>
          <input type="checkbox" defaultChecked /> חסימות ספקטרום / ל"א (סגול)
        </div>

        {activeIncident && (
          <div style={styles.alertBanner}>
            <strong>אירוע פעיל:</strong> {activeIncident}
            <button style={styles.closeAlertBtn} onClick={() => setActiveIncident(null)}>סגור אירוע</button>
          </div>
        )}
      </div>

      {/* Map Canvas Visual Mock */}
      <div style={styles.mapCanvas}>
        <div style={styles.mapGridLines} />
        
        {/* Draw Polygons/Zones */}
        {zones.map((z) => (
          <div
            key={z.id}
            style={{
              ...styles.mapZone,
              backgroundColor: z.color,
              border: `2px dashed ${z.type === "NFZ" ? "#e74c3c" : z.type === "CORRIDOR" ? "#2ecc71" : "#9b59b6"}`,
              top: z.id === "zone-1" ? "150px" : z.id === "zone-2" ? "300px" : "180px",
              left: z.id === "zone-1" ? "200px" : z.id === "zone-2" ? "500px" : "450px",
            }}
          >
            <span style={styles.zoneLabel}>{z.name} ({z.floor}-{z.ceiling}מ')</span>
          </div>
        ))}

        {/* Draw Tracks/Drones */}
        {tracks.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTrack(t)}
            style={{
              ...styles.trackMarker,
              backgroundColor: getIFFColor(t.iffStatus),
              boxShadow: `0 0 12px ${getIFFColor(t.iffStatus)}`,
              top: t.id === "track-104" ? "200px" : "330px",
              left: t.id === "track-104" ? "250px" : "400px",
            }}
          >
            <span style={styles.trackLabel}>{t.id}</span>
          </div>
        ))}
      </div>

      {/* Right Floating Details Panel */}
      {selectedTrack && (
        <div style={styles.detailsPanel}>
          <h3 style={styles.panelTitle}>פרטי מטרה: {selectedTrack.id}</h3>
          <div style={styles.detailRow}>
            <strong>סיווג IFF:</strong>
            <span style={{ color: getIFFColor(selectedTrack.iffStatus), fontWeight: "bold" }}>
              {" "}{selectedTrack.iffStatus}
            </span>
          </div>
          <div style={styles.detailRow}>
            <strong>דגם כלי:</strong> {selectedTrack.type}
          </div>
          <div style={styles.detailRow}>
            <strong>נ"צ גיאוגרפי:</strong> {selectedTrack.coordinates.lat.toFixed(5)}, {selectedTrack.coordinates.lng.toFixed(5)}
          </div>
          <div style={styles.detailRow}>
            <strong>גובה MSL:</strong> {selectedTrack.coordinates.altMsl} מטרים
          </div>
          <div style={styles.detailRow}>
            <strong>מהירות:</strong> {selectedTrack.speedKts} קשר
          </div>

          <div style={styles.actionGroup}>
            <button
              onClick={() => handleAction("TIGER", selectedTrack)}
              style={{ ...styles.actionBtn, backgroundColor: "#e74c3c" }}
            >
              הפעל נוהל נמר
            </button>
            <button
              onClick={() => handleAction("HAMMER", selectedTrack)}
              style={{ ...styles.actionBtn, backgroundColor: "#d35400" }}
            >
              הכרז פטיש אוויר
            </button>
            <button
              onClick={() => handleAction("BLUE", selectedTrack)}
              style={{ ...styles.actionBtn, backgroundColor: "#2ecc71" }}
            >
              סווג ככחול ודאי
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    position: "relative",
    width: "100%",
    height: "calc(100vh - 60px)",
    backgroundColor: "#111",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    direction: "rtl",
  },
  layerPanel: {
    width: "250px",
    backgroundColor: "#1e1e24",
    padding: "20px",
    borderLeft: "1px solid #2e2e38",
    zIndex: 10,
  },
  panelTitle: {
    fontSize: "18px",
    marginBottom: "15px",
    color: "#ecf0f1",
    borderBottom: "1px solid #34495e",
    paddingBottom: "10px",
  },
  layerItem: {
    marginBottom: "12px",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  alertBanner: {
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#c0392b",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  closeAlertBtn: {
    display: "block",
    marginTop: "8px",
    background: "#fff",
    color: "#c0392b",
    border: "none",
    padding: "4px 8px",
    borderRadius: "2px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  mapCanvas: {
    flex: 1,
    position: "relative",
    backgroundColor: "#141419",
    overflow: "hidden",
  },
  mapGridLines: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
    backgroundSize: "40px 40px",
  },
  mapZone: {
    position: "absolute",
    width: "200px",
    height: "120px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  zoneLabel: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: "2px 6px",
    borderRadius: "2px",
  },
  trackMarker: {
    position: "absolute",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform: "translate(-50%, -50%)",
    transition: "top 1s linear, left 1s linear",
  },
  trackLabel: {
    fontSize: "9px",
    color: "#fff",
    fontWeight: "bold",
    marginTop: "35px",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: "1px 4px",
    borderRadius: "2px",
    whiteSpace: "nowrap",
  },
  detailsPanel: {
    position: "absolute",
    top: "20px",
    left: "20px",
    width: "300px",
    backgroundColor: "#1e1e24",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #2e2e38",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  detailRow: {
    fontSize: "14px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
  },
  actionGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
  },
  actionBtn: {
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
};
