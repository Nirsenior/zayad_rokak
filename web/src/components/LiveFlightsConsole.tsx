import React, { useState, useEffect } from "react";

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
  status: "ACTIVE" | "COMMS_LOSS" | "ANOMALOUS" | "COMPLETED";
}

export const LiveFlightsConsole: React.FC = () => {
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
      lastPingSeconds: 12, // triggers Comms Loss
      status: "COMMS_LOSS",
    },
    {
      id: "flight-106",
      droneModel: "Skydio X2D",
      operatorName: "רס''ן יאיר דגן",
      unit: "סיוע חטיבתי",
      minAlt: 50,
      maxAlt: 150,
      currentAlt: 175, // triggers Altitude Anomaly
      battery: 58,
      lastPingSeconds: 2,
      status: "ANOMALOUS",
    },
  ]);

  // Simulate ping time increments
  useEffect(() => {
    const interval = setInterval(() => {
      setFlights((prev) =>
        prev.map((f) => {
          if (f.status === "COMPLETED") return f;
          const nextPings = f.lastPingSeconds + 1;
          let nextStatus = f.status;

          // Determine status based on ping interval thresholds
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
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMockPing = (id: string) => {
    setFlights((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, lastPingSeconds: 0, status: "ACTIVE" } : f
      )
    );
  };

  const handleDeactivatePolygon = (id: string) => {
    setFlights((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "COMPLETED" } : f
      )
    );
  };

  const getStatusBadgeStyle = (status: ActiveFlight["status"]) => {
    switch (status) {
      case "ACTIVE":
        return { backgroundColor: "#27ae60", color: "#fff" };
      case "COMMS_LOSS":
        return { backgroundColor: "#c0392b", color: "#fff", animation: "blink 1s infinite" };
      case "ANOMALOUS":
        return { backgroundColor: "#f39c12", color: "#fff" };
      case "COMPLETED":
        return { backgroundColor: "#7f8c8d", color: "#fff" };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>ניהול הטסות פעילות במרחב</h2>
        <span style={styles.subtitle}>מעקב טלמטרייה, שעוני דופק ושליטה בפוליגונים בזמן אמת</span>
      </div>

      <div style={styles.grid}>
        {flights.map((f) => (
          <div key={f.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <strong style={styles.cardId}>{f.id}</strong>
              <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(f.status) }}>
                {f.status}
              </span>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.row}><strong>מפעיל:</strong> {f.operatorName} ({f.unit})</div>
              <div style={styles.row}><strong>דגם כלי:</strong> {f.droneModel}</div>
              <div style={styles.row}>
                <strong>גובה נוכחי:</strong> 
                <span style={{ color: f.status === "ANOMALOUS" ? "#f39c12" : "#fff", fontWeight: "bold" }}>
                  {" "}{f.currentAlt} מ'
                </span> 
                {" "}(מורשה: {f.minAlt}-{f.maxAlt} מ')
              </div>
              <div style={styles.row}><strong>סוללת רחפן:</strong> {f.battery}%</div>
              <div style={styles.row}>
                <strong>עדכון אחרון:</strong> 
                <span style={{ color: f.lastPingSeconds > 10 ? "#e74c3c" : "#fff" }}>
                  {" "}{f.lastPingSeconds} שניות
                </span>
              </div>
            </div>

            {f.status !== "COMPLETED" && (
              <div style={styles.cardActions}>
                <button
                  onClick={() => handleMockPing(f.id)}
                  style={{ ...styles.btn, backgroundColor: "#2980b9" }}
                >
                  הדמה פינג (אול"ר)
                </button>
                <button
                  onClick={() => handleDeactivatePolygon(f.id)}
                  style={{ ...styles.btn, backgroundColor: "#c0392b" }}
                >
                  כבה פוליגון ידנית
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Global CSS for flashing Comms Loss indicator */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "30px",
    backgroundColor: "#141419",
    color: "#fff",
    height: "calc(100vh - 60px)",
    boxSizing: "border-box",
    fontFamily: "Inter, sans-serif",
    direction: "rtl",
    overflowY: "auto",
  },
  header: {
    borderBottom: "1px solid #2e2e38",
    paddingBottom: "15px",
    marginBottom: "25px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#7f8c8d",
    marginTop: "5px",
    display: "block",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#1e1e24",
    border: "1px solid #2e2e38",
    borderRadius: "6px",
    padding: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #2d2d35",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  cardId: {
    fontSize: "16px",
    color: "#3498db",
  },
  statusBadge: {
    fontSize: "10px",
    fontWeight: "bold",
    padding: "3px 10px",
    borderRadius: "12px",
  },
  cardBody: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#bdc3c7",
    marginBottom: "20px",
  },
  row: {
    marginBottom: "8px",
  },
  cardActions: {
    display: "flex",
    gap: "10px",
  },
  btn: {
    flex: 1,
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  },
};
