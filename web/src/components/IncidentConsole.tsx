import React, { useState } from "react";

interface TimelineEvent {
  timestamp: string;
  actionType: string;
  performedBy: string;
  details: string;
}

interface Incident {
  id: string;
  targetTrackId: string;
  iffStatus: string;
  status: "OPENED" | "ACTIVE_TIGER" | "ACTIVE_HAMMER" | "RESOLVED";
  reporter: string;
  createdAt: string;
  timeline: TimelineEvent[];
}

export const IncidentConsole: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "INC-8812",
      targetTrackId: "rad-track-4011",
      iffStatus: "UNIDENTIFIED",
      status: "OPENED",
      reporter: "מערכת מכ''ם חטיבתית",
      createdAt: "13:14:02",
      timeline: [
        {
          timestamp: "13:14:02",
          actionType: "TRACK_DETECTED",
          performedBy: "מערכת מכ''ם",
          details: "מטרה גולמית ללא משיב טלמטרייה נקלטה בנ''צ 1928-8817 בגובה 340 מ'",
        },
      ],
    },
    {
      id: "INC-8810",
      targetTrackId: "rf-track-901",
      iffStatus: "RED_CERTAIN",
      status: "RESOLVED",
      reporter: "תצפית כוח אשד",
      createdAt: "12:45:00",
      timeline: [
        {
          timestamp: "12:45:00",
          actionType: "VISUAL_REPORT",
          performedBy: "כוח אשד",
          details: "דיווח עין על רחפן שחור קטן בגובה נמוך",
        },
        {
          timestamp: "12:46:15",
          actionType: "TIGER_ACTIVATED",
          performedBy: "סרן דני (קצין רוק''ק)",
          details: "נוהל נמר הופעל - התרעה נשלחה לאול''רים בשטח",
        },
        {
          timestamp: "12:50:00",
          actionType: "INCIDENT_RESOLVED",
          performedBy: "סרן דני (קצין רוק''ק)",
          details: "המטרה הופלה בהצלחה באמצעות לוחמה אלקטרונית (ל''א)",
        },
      ],
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0]);
  const [logDetails, setLogDetails] = useState("");

  const handleTriggerAction = (action: "TIGER" | "HAMMER") => {
    if (!selectedIncident) return;

    const timestamp = new Date().toLocaleTimeString("he-IL", { hour12: false });
    const newEvent: TimelineEvent = {
      timestamp,
      actionType: action === "TIGER" ? "TIGER_ACTIVATED" : "HAMMER_ACTIVATED",
      performedBy: "סרן דני (קצין רוק''ק)",
      details: action === "TIGER"
        ? "הכרזת נוהל נמר - שידור התרעת מטרת אויב קריטית לשטח"
        : "הפעלת פטיש אוויר - פקודת פינוי מרחב אווירי ויירוט המטרה",
    };

    const nextStatus = action === "TIGER" ? "ACTIVE_TIGER" : "ACTIVE_HAMMER";

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident.id
          ? {
              ...inc,
              status: nextStatus as Incident["status"],
              timeline: [...inc.timeline, newEvent],
            }
          : inc
      )
    );

    setSelectedIncident((prev) =>
      prev
        ? {
            ...prev,
            status: nextStatus as Incident["status"],
            timeline: [...prev.timeline, newEvent],
          }
        : null
    );
  };

  const handleAddLog = () => {
    if (!selectedIncident || !logDetails.trim()) return;

    const timestamp = new Date().toLocaleTimeString("he-IL", { hour12: false });
    const newEvent: TimelineEvent = {
      timestamp,
      actionType: "MANUAL_LOG",
      performedBy: "סרן דני (קצין רוק''ק)",
      details: logDetails,
    };

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident.id
          ? { ...inc, timeline: [...inc.timeline, newEvent] }
          : inc
      )
    );

    setSelectedIncident((prev) =>
      prev ? { ...prev, timeline: [...prev.timeline, newEvent] } : null
    );

    setLogDetails("");
  };

  const handleCloseIncident = () => {
    if (!selectedIncident) return;

    const timestamp = new Date().toLocaleTimeString("he-IL", { hour12: false });
    const newEvent: TimelineEvent = {
      timestamp,
      actionType: "INCIDENT_RESOLVED",
      performedBy: "סרן דני (קצין רוק''ק)",
      details: "סגירת אירוע זיהוי. המטרה הופלה או יצאה מגזרה.",
    };

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident.id
          ? { ...inc, status: "RESOLVED", timeline: [...inc.timeline, newEvent] }
          : inc
      )
    );

    setSelectedIncident((prev) =>
      prev ? { ...prev, status: "RESOLVED", timeline: [...prev.timeline, newEvent] } : null
    );
  };

  const getStatusColor = (status: Incident["status"]) => {
    switch (status) {
      case "OPENED":
        return "#e67e22";
      case "ACTIVE_TIGER":
        return "#e74c3c";
      case "ACTIVE_HAMMER":
        return "#d35400";
      case "RESOLVED":
        return "#2ecc71";
    }
  };

  return (
    <div style={styles.container}>
      {/* Incidents Queue */}
      <div style={styles.incidentsList}>
        <h3 style={styles.sectionTitle}>יומן אירועים פעילים</h3>
        {incidents.map((inc) => (
          <div
            key={inc.id}
            onClick={() => setSelectedIncident(inc)}
            style={{
              ...styles.incidentCard,
              backgroundColor: selectedIncident?.id === inc.id ? "#2c2c35" : "#1e1e24",
              borderRight: `5px solid ${getStatusColor(inc.status)}`,
            }}
          >
            <div style={styles.cardHeader}>
              <strong>{inc.id}</strong>
              <span style={{ ...styles.badge, backgroundColor: getStatusColor(inc.status) }}>
                {inc.status}
              </span>
            </div>
            <div style={styles.cardBody}>
              <div><strong>מטרה:</strong> {inc.targetTrackId}</div>
              <div><strong>מדווח:</strong> {inc.reporter}</div>
              <div><strong>זמן פתיחה:</strong> {inc.createdAt}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Details & Timeline */}
      {selectedIncident ? (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsHeader}>
            <div>
              <h2>פרטי אירוע: {selectedIncident.id}</h2>
              <span style={{ color: "#7f8c8d", fontSize: "14px" }}>מזהה מטרה: {selectedIncident.targetTrackId}</span>
            </div>
            {selectedIncident.status !== "RESOLVED" && (
              <div style={styles.headerActions}>
                <button
                  onClick={() => handleTriggerAction("TIGER")}
                  style={{ ...styles.actionBtn, backgroundColor: "#e74c3c" }}
                  disabled={selectedIncident.status === "ACTIVE_TIGER" || selectedIncident.status === "ACTIVE_HAMMER"}
                >
                  הפעל נוהל נמר
                </button>
                <button
                  onClick={() => handleTriggerAction("HAMMER")}
                  style={{ ...styles.actionBtn, backgroundColor: "#d35400" }}
                  disabled={selectedIncident.status === "ACTIVE_HAMMER"}
                >
                  הכרז פטיש אוויר
                </button>
                <button
                  onClick={handleCloseIncident}
                  style={{ ...styles.actionBtn, backgroundColor: "#2ecc71" }}
                >
                  סגור אירוע (נוטרל)
                </button>
              </div>
            )}
          </div>

          {/* Timeline View */}
          <div style={styles.timelineSection}>
            <h3 style={styles.sectionTitle}>ציר זמן פעולות (Timeline)</h3>
            <div style={styles.timelineContainer}>
              {selectedIncident.timeline.map((event, idx) => (
                <div key={idx} style={styles.timelineItem}>
                  <div style={styles.timelineBullet} />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineHeader}>
                      <span style={styles.timelineTime}>{event.timestamp}</span>
                      <strong style={styles.timelineAction}>{event.actionType}</strong>
                      <span style={styles.timelineActor}>- {event.performedBy}</span>
                    </div>
                    <div style={styles.timelineText}>{event.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Log Entry */}
          {selectedIncident.status !== "RESOLVED" && (
            <div style={styles.addLogBar}>
              <input
                type="text"
                value={logDetails}
                onChange={(e) => setLogDetails(e.target.value)}
                placeholder="הוסף הערה ידנית ליומן האירוע..."
                style={styles.input}
              />
              <button onClick={handleAddLog} style={styles.submitBtn}>
                הוסף רשומה
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>בחר אירוע לצפייה בפרטים</div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    width: "100%",
    height: "calc(100vh - 60px)",
    backgroundColor: "#141419",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    direction: "rtl",
  },
  incidentsList: {
    width: "350px",
    backgroundColor: "#1e1e24",
    borderLeft: "1px solid #2e2e38",
    padding: "20px",
    overflowY: "auto",
  },
  sectionTitle: {
    fontSize: "16px",
    marginBottom: "15px",
    fontWeight: "bold",
    color: "#ecf0f1",
  },
  incidentCard: {
    padding: "15px",
    borderRadius: "4px",
    marginBottom: "10px",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  badge: {
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "10px",
    color: "#fff",
  },
  cardBody: {
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#bdc3c7",
  },
  detailsPanel: {
    flex: 1,
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflowY: "auto",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #2e2e38",
    paddingBottom: "15px",
    marginBottom: "20px",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  actionBtn: {
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  timelineSection: {
    flex: 1,
    marginBottom: "20px",
  },
  timelineContainer: {
    borderRight: "2px solid #2e2e38",
    paddingRight: "20px",
    marginTop: "20px",
  },
  timelineItem: {
    position: "relative",
    marginBottom: "20px",
  },
  timelineBullet: {
    position: "absolute",
    right: "-26px",
    top: "4px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#3498db",
  },
  timelineContent: {
    backgroundColor: "#1e1e24",
    padding: "12px 16px",
    borderRadius: "4px",
    border: "1px solid #2e2e38",
  },
  timelineHeader: {
    fontSize: "12px",
    color: "#7f8c8d",
    marginBottom: "6px",
    display: "flex",
    gap: "8px",
  },
  timelineTime: {
    fontWeight: "bold",
  },
  timelineAction: {
    color: "#3498db",
  },
  timelineText: {
    fontSize: "14px",
    lineHeight: "1.4",
  },
  addLogBar: {
    display: "flex",
    gap: "15px",
    backgroundColor: "#1e1e24",
    padding: "15px",
    borderRadius: "6px",
    border: "1px solid #2e2e38",
  },
  input: {
    flex: 1,
    backgroundColor: "#141419",
    border: "1px solid #2e2e38",
    borderRadius: "4px",
    color: "#fff",
    padding: "10px",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  submitBtn: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7f8c8d",
    fontSize: "18px",
  },
};
