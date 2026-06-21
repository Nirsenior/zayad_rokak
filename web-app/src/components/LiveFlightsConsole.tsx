import React from "react";

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
}

interface LiveFlightsConsoleProps {
  flights: ActiveFlight[];
  onMockPing: (id: string) => void;
  onDeactivatePolygon: (id: string) => void;
  onManualOverride: (id: string) => void;
}

export const LiveFlightsConsole: React.FC<LiveFlightsConsoleProps> = ({
  flights,
  onMockPing,
  onDeactivatePolygon,
  onManualOverride,
}) => {
  const getStatusBadgeStyle = (status: ActiveFlight["status"]): React.CSSProperties => {
    switch (status) {
      case "ACTIVE":
        return {
          backgroundColor: "var(--color-success-bg)",
          color: "var(--color-success-text)",
          border: "1px solid var(--color-success-border)",
        };
      case "COMMS_LOSS":
        return {
          backgroundColor: "var(--color-error-bg)",
          color: "var(--color-error-text)",
          border: "1px solid var(--color-error-border)",
          animation: "blink 1s infinite",
        };
      case "ANOMALOUS":
        return {
          backgroundColor: "var(--color-warning-bg)",
          color: "var(--color-warning-text)",
          border: "1px solid var(--color-warning-border)",
        };
      case "COMPLETED":
        return {
          backgroundColor: "var(--neutral-3)",
          color: "var(--neutral-11)",
          border: "1px solid var(--neutral-6)",
        };
      case "LANDED":
      default:
        return {
          backgroundColor: "var(--neutral-2)",
          color: "var(--neutral-10)",
          border: "1px solid var(--neutral-5)",
        };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>ניהול הטסות פעילות במרחב</h2>
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
                <span style={{ color: f.status === "ANOMALOUS" ? "var(--color-warning-text)" : "var(--color-text)", fontWeight: "bold" }}>
                  {" "}{f.currentAlt} מ'
                </span> 
                {" "}(מורשה: {f.minAlt}-{f.maxAlt} מ')
              </div>
              <div style={styles.row}><strong>סוללת רחפן:</strong> {f.battery}%</div>
              <div style={styles.row}>
                <strong>עדכון אחרון:</strong> 
                <span style={{ color: f.lastPingSeconds > 10 ? "var(--color-error-text)" : "var(--color-text)" }}>
                  {" "}{f.lastPingSeconds} שניות
                </span>
              </div>
            </div>

            {f.status !== "COMPLETED" && (
              <div style={styles.cardActions}>
                {f.status === "COMMS_LOSS" ? (
                  <>
                    <button
                      onClick={() => onManualOverride(f.id)}
                      style={{ ...styles.btn, backgroundColor: "var(--color-success)", border: "1px solid var(--color-success-border)" }}
                    >
                      אשר ידנית (קו קשר)
                    </button>
                    <button
                      onClick={() => onDeactivatePolygon(f.id)}
                      style={{ ...styles.btn, backgroundColor: "var(--color-error)", border: "1px solid var(--color-error-border)" }}
                    >
                      כבה פוליגון ידנית
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onMockPing(f.id)}
                      style={{ ...styles.btn, backgroundColor: "var(--color-accent)", border: "1px solid var(--color-accent-border)" }}
                      disabled={f.status === "LANDED"}
                    >
                      הדמה פינג (אול"ר)
                    </button>
                    <button
                      onClick={() => onDeactivatePolygon(f.id)}
                      style={{ ...styles.btn, backgroundColor: "var(--color-error)", border: "1px solid var(--color-error-border)" }}
                    >
                      כבה פוליגון ידנית
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

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
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    height: "calc(100vh - 60px)",
    boxSizing: "border-box",
    direction: "rtl",
    overflowY: "auto",
    fontFamily: "var(--font-family)",
  },
  header: {
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "15px",
    marginBottom: "25px",
  },
  title: {
    fontSize: "var(--text-xl)",
    fontWeight: "var(--fw-bold)",
    margin: "0 0 5px 0",
  },
  subtitle: {
    fontSize: "var(--text-xs)",
    color: "var(--color-text-muted)",
    display: "block",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "20px",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--color-border-subtle)",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  cardId: {
    fontSize: "var(--text-sm)",
    color: "var(--color-accent-text)",
  },
  statusBadge: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    padding: "3px 10px",
    borderRadius: "var(--radius-badge)",
  },
  cardBody: {
    fontSize: "var(--text-sm)",
    lineHeight: "1.6",
    color: "var(--color-text-secondary)",
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
    color: "var(--neutral-white)",
    border: "none",
    padding: "10px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    transition: "opacity 0.2s ease",
  },
};

