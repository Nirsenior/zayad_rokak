import React, { useState } from "react";

export interface RegisteredDrone {
  id: string;
  tailNumber: string;
  model: string;
  devices: string;
  name: string;
  status: "INACTIVE" | "ACTIVE" | "COMMS_LOSS" | "ANOMALOUS" | "COMPLETED";
}

export interface Operator {
  name: string;
  unit: string;
  drones: RegisteredDrone[];
  status: "ONLINE" | "OFFLINE" | "FLYING";
  lastSeen?: string;
}

interface OperatorsDronesConsoleProps {
  operators: Operator[];
  flights: any[];
  requests: any[];
}

export const OperatorsDronesConsole: React.FC<OperatorsDronesConsoleProps> = ({
  operators,
  flights,
  requests: _requests,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Flatten operators and their drones into a single flat list of drone records
  interface FlatDroneRecord {
    id: string;
    tailNumber: string;
    model: string;
    devices: string;
    name: string;
    status: RegisteredDrone["status"];
    operatorName: string;
    unit: string;
  }

  const flatDrones: FlatDroneRecord[] = [];
  operators.forEach((op) => {
    op.drones.forEach((d) => {
      // Find if there is an active flight matching this operator and model
      const activeFlight = flights.find(
        (f) =>
          f.operatorName === op.name &&
          f.droneModel === d.model &&
          f.status !== "COMPLETED" &&
          f.status !== "LANDED"
      );

      let finalStatus = d.status;
      if (activeFlight) {
        finalStatus = activeFlight.status;
      }

      flatDrones.push({
        id: d.id,
        tailNumber: d.tailNumber,
        model: d.model,
        devices: d.devices,
        name: d.name,
        status: finalStatus,
        operatorName: op.name,
        unit: op.unit,
      });
    });
  });

  // Filtered drones based on search and status tabs
  const filteredDrones = flatDrones.filter((drone) => {
    const matchesSearch =
      drone.tailNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drone.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drone.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drone.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "FLYING" && (drone.status === "ACTIVE" || drone.status === "ANOMALOUS")) ||
      (statusFilter === "INACTIVE" && drone.status === "INACTIVE") ||
      (statusFilter === "COMMS_LOSS" && drone.status === "COMMS_LOSS");

    return matchesSearch && matchesStatus;
  });

  // Statistics
  const totalDrones = flatDrones.length;
  const activeFlightsCount = flatDrones.filter(
    (d) => d.status === "ACTIVE" || d.status === "ANOMALOUS"
  ).length;
  const commsLossCount = flatDrones.filter((d) => d.status === "COMMS_LOSS").length;
  const groundedCount = flatDrones.filter((d) => d.status === "INACTIVE").length;

  const getDroneStatusBadge = (status: FlatDroneRecord["status"]) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span style={{ ...styles.badge, backgroundColor: "rgba(48,164,108,0.15)", color: "var(--green-9)", border: "1px solid rgba(48,164,108,0.3)" }}>
            בטיסה פעילה
          </span>
        );
      case "COMMS_LOSS":
        return (
          <span style={{ ...styles.badge, backgroundColor: "rgba(236,93,94,0.15)", color: "var(--red-9)", border: "1px solid rgba(236,93,94,0.3)", animation: "blink 1.5s infinite" }}>
            נתק קשר
          </span>
        );
      case "ANOMALOUS":
        return (
          <span style={{ ...styles.badge, backgroundColor: "rgba(255,197,61,0.15)", color: "var(--yellow-9)", border: "1px solid rgba(255,197,61,0.3)" }}>
            חריגת גובה
          </span>
        );
      case "INACTIVE":
      default:
        return (
          <span style={{ ...styles.badge, backgroundColor: "rgba(108,118,141,0.15)", color: "var(--neutral-12)", border: "1px solid rgba(108,118,141,0.2)" }}>
            מקורקע
          </span>
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Upper Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>סה"כ כלים רשומים</span>
          <span style={styles.statValue}>{totalDrones}</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statLabel, color: "var(--green-9)" }}>כלים בטיסה פעילה</span>
          <span style={{ ...styles.statValue, color: "var(--green-9)" }}>{activeFlightsCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statLabel, color: "var(--blue-11)" }}>כלים מקורקעים</span>
          <span style={{ ...styles.statValue, color: "var(--blue-11)" }}>{groundedCount}</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statLabel, color: commsLossCount > 0 ? "var(--red-9)" : "var(--neutral-12)" }}>איבודי קשר</span>
          <span style={{ ...styles.statValue, color: commsLossCount > 0 ? "var(--red-9)" : "var(--neutral-12)" }}>{commsLossCount}</span>
        </div>
      </div>

      {/* Control Bar */}
      <div style={styles.controlBar}>
        {/* Search */}
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="חפש לפי מספר זנב, דגם, שם כלי, יחידה או מפעיל..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Filter Buttons */}
        <div style={styles.filterTabs}>
          <button
            onClick={() => setStatusFilter("ALL")}
            style={{
              ...styles.filterBtn,
              backgroundColor: statusFilter === "ALL" ? "var(--neutral-6)" : "var(--neutral-3)",
              borderColor: statusFilter === "ALL" ? "var(--blue-8)" : "var(--neutral-5)",
              color: statusFilter === "ALL" ? "var(--neutral-white)" : "var(--neutral-12)",
            }}
          >
            הכל ({totalDrones})
          </button>
          <button
            onClick={() => setStatusFilter("FLYING")}
            style={{
              ...styles.filterBtn,
              backgroundColor: statusFilter === "FLYING" ? "var(--green-4)" : "var(--neutral-3)",
              borderColor: statusFilter === "FLYING" ? "var(--green-8)" : "var(--neutral-5)",
              color: statusFilter === "FLYING" ? "var(--neutral-white)" : "var(--neutral-12)",
            }}
          >
            בטיסה ({activeFlightsCount})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            style={{
              ...styles.filterBtn,
              backgroundColor: statusFilter === "INACTIVE" ? "var(--blue-3)" : "var(--neutral-3)",
              borderColor: statusFilter === "INACTIVE" ? "var(--blue-7)" : "var(--neutral-5)",
              color: statusFilter === "INACTIVE" ? "var(--neutral-white)" : "var(--neutral-12)",
            }}
          >
            מקורקע ({groundedCount})
          </button>
          <button
            onClick={() => setStatusFilter("COMMS_LOSS")}
            style={{
              ...styles.filterBtn,
              backgroundColor: statusFilter === "COMMS_LOSS" ? "var(--red-3)" : "var(--neutral-3)",
              borderColor: statusFilter === "COMMS_LOSS" ? "var(--red-7)" : "var(--neutral-5)",
              color: statusFilter === "COMMS_LOSS" ? "var(--neutral-white)" : "var(--neutral-12)",
            }}
          >
            נתק קשר ({commsLossCount})
          </button>
        </div>
      </div>

      {/* Main Table View */}
      <div style={styles.tableCard}>
        {filteredDrones.length === 0 ? (
          <div style={styles.emptyState}>לא נמצאו רחפנים תואמים לחיפוש או לסינון שנבחרו.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>מספר זנב</th>
                  <th style={styles.th}>דגם רחפן</th>
                  <th style={styles.th}>שם ייחודי</th>
                  <th style={styles.th}>שיוך ליחידה</th>
                  <th style={styles.th}>מטיס/מפעיל</th>
                  <th style={styles.th}>התקנים נלווים</th>
                  <th style={styles.th}>סטטוס</th>
                  <th style={{ ...styles.th, textAlign: "center" }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrones.map((drone) => (
                  <tr key={drone.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.tailBadge}>{drone.tailNumber}</span>
                    </td>
                    <td style={styles.td}>{drone.model}</td>
                    <td style={{ ...styles.td, color: "var(--neutral-white)", fontWeight: "bold" }}>
                      {drone.name}
                    </td>
                    <td style={{ ...styles.td, color: "var(--blue-11)" }}>{drone.unit}</td>
                    <td style={styles.td}>{drone.operatorName}</td>
                    <td style={{ ...styles.td, fontSize: "11px", color: "var(--neutral-12)" }}>
                      {drone.devices}
                    </td>
                    <td style={styles.td}>{getDroneStatusBadge(drone.status)}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <div style={styles.actionsContainer}>
                        <button style={styles.actionBtn}>חקירת IFF</button>
                        <button style={styles.actionBtnSecondary}>ניהול משימה</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
    padding: "20px",
    backgroundColor: "var(--neutral-1)",
    color: "var(--neutral-white)",
    height: "calc(100vh - 84px)",
    boxSizing: "border-box",
    direction: "rtl",
    overflowY: "auto",
    fontFamily: "var(--ds-font)",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  },
  statCard: {
    backgroundColor: "var(--neutral-2)",
    border: "1px solid var(--neutral-5)",
    borderRadius: "6px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  statLabel: {
    fontSize: "12px",
    color: "var(--neutral-12)",
    fontWeight: 500,
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 700,
    color: "var(--neutral-white)",
  },
  controlBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    gap: "15px",
    flexWrap: "wrap",
  },
  searchWrapper: {
    flex: 1,
    minWidth: "280px",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "var(--neutral-2)",
    border: "1px solid var(--neutral-5)",
    borderRadius: "6px",
    padding: "9px 14px",
    color: "var(--neutral-white)",
    fontSize: "13px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "var(--ds-font)",
  },
  filterTabs: {
    display: "flex",
    gap: "8px",
  },
  filterBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tableCard: {
    backgroundColor: "var(--neutral-2)",
    border: "1px solid var(--neutral-5)",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "var(--shadow-sm)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "right",
  },
  th: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--neutral-12)",
    borderBottom: "1px solid var(--neutral-6)",
    padding: "10px 12px",
    letterSpacing: "0.5px",
  },
  tr: {
    borderBottom: "1px solid var(--neutral-6)",
    transition: "background-color 0.15s ease",
    "&:hover": {
      backgroundColor: "var(--neutral-3)",
    },
  } as any,
  td: {
    padding: "12px",
    fontSize: "13px",
    color: "var(--neutral-white)",
    verticalAlign: "middle",
  },
  tailBadge: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: "bold",
    backgroundColor: "var(--neutral-4)",
    border: "1px solid var(--neutral-6)",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "var(--blue-11)",
  },
  badge: {
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "10px",
    whiteSpace: "nowrap",
  },
  actionsContainer: {
    display: "flex",
    gap: "6px",
    justifyContent: "center",
  },
  actionBtn: {
    backgroundColor: "var(--blue-6)",
    color: "var(--neutral-white)",
    border: "none",
    borderRadius: "4px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  actionBtnSecondary: {
    backgroundColor: "var(--neutral-4)",
    color: "var(--neutral-white)",
    border: "1px solid var(--neutral-6)",
    borderRadius: "4px",
    padding: "5px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "var(--neutral-11)",
    fontSize: "13px",
  },
};
