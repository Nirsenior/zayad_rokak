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

interface IncidentConsoleProps {
  onTriggerAlert: (msg: string, metadata?: { alertType?: string; threatLocation?: { lat: number; lng: number } }) => void;
}

export const IncidentConsole: React.FC<IncidentConsoleProps> = ({ onTriggerAlert }) => {
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

    if (action === "TIGER") {
      const threatLocation = selectedIncident.targetTrackId === "rad-track-4011"
        ? { lat: 33.262, lng: 35.558 }
        : selectedIncident.targetTrackId === "rf-track-901"
        ? { lat: 33.245, lng: 35.542 }
        : undefined;

      onTriggerAlert(`נוהל נמר פעיל! זוהה כלי עוין/לא מזוהה (${selectedIncident.targetTrackId}) בגזרתך.`, {
        alertType: "TIGER",
        threatLocation
      });
    } else {
      onTriggerAlert(`פטיש אוויר פעיל! נטרול אלקטרוני באזור. הנחת את הרחפן שלך מייד.`, {
        alertType: "HAMMER"
      });
    }

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
        return "var(--color-warning)";
      case "ACTIVE_TIGER":
        return "var(--color-error)";
      case "ACTIVE_HAMMER":
        return "var(--orange-10)";
      case "RESOLVED":
        return "var(--color-success)";
      default:
        return "var(--neutral-8)";
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
              backgroundColor: selectedIncident?.id === inc.id ? "var(--neutral-5)" : "var(--color-bg-card)",
              borderRight: `5px solid ${getStatusColor(inc.status)}`,
            }}
          >
            <div style={styles.cardHeader}>
              <strong style={styles.cardId}>{inc.id}</strong>
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
              <h2 style={styles.detailsTitle}>פרטי אירוע: {selectedIncident.id}</h2>
              <span style={styles.detailsSubtitle}>מזהה מטרה: {selectedIncident.targetTrackId}</span>
            </div>
            {selectedIncident.status !== "RESOLVED" && (
              <div style={styles.headerActions}>
                <button
                  onClick={() => handleTriggerAction("TIGER")}
                  style={{ ...styles.actionBtn, backgroundColor: "var(--color-error)", border: "1px solid var(--color-error-border)" }}
                  disabled={selectedIncident.status === "ACTIVE_TIGER" || selectedIncident.status === "ACTIVE_HAMMER"}
                >
                  הפעל נוהל נמר
                </button>
                <button
                  onClick={() => handleTriggerAction("HAMMER")}
                  style={{ ...styles.actionBtn, backgroundColor: "var(--orange-10)", border: "1px solid var(--orange-9)" }}
                  disabled={selectedIncident.status === "ACTIVE_HAMMER"}
                >
                  הכרז פטיש אוויר
                </button>
                <button
                  onClick={handleCloseIncident}
                  style={{ ...styles.actionBtn, backgroundColor: "var(--color-success)", border: "1px solid var(--color-success-border)" }}
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
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    direction: "rtl",
    fontFamily: "var(--font-family)",
  },
  incidentsList: {
    width: "350px",
    backgroundColor: "var(--color-bg-card)",
    borderLeft: "1px solid var(--color-border)",
    padding: "20px",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  sectionTitle: {
    fontSize: "var(--text-sm)",
    marginBottom: "15px",
    fontWeight: "var(--fw-bold)",
    color: "var(--color-text)",
  },
  incidentCard: {
    padding: "15px",
    borderRadius: "var(--radius-sm)",
    marginBottom: "10px",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    border: "1px solid var(--color-border-subtle)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  cardId: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-bold)",
    color: "var(--color-text)",
  },
  badge: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    padding: "2px 8px",
    borderRadius: "var(--radius-badge)",
    color: "var(--neutral-white)",
  },
  cardBody: {
    fontSize: "var(--text-xs)",
    lineHeight: "1.5",
    color: "var(--color-text-secondary)",
  },
  detailsPanel: {
    flex: 1,
    padding: "30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflowY: "auto",
    boxSizing: "border-box",
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "15px",
    marginBottom: "20px",
  },
  detailsTitle: {
    fontSize: "var(--text-xl)",
    fontWeight: "var(--fw-bold)",
    margin: "0 0 5px 0",
  },
  detailsSubtitle: {
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-sm)",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
  },
  actionBtn: {
    color: "var(--neutral-white)",
    border: "none",
    padding: "10px 16px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-bold)",
    transition: "opacity 0.2s ease",
  },
  timelineSection: {
    flex: 1,
    marginBottom: "20px",
  },
  timelineContainer: {
    borderRight: "2px solid var(--color-border)",
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
    backgroundColor: "var(--color-accent)",
  },
  timelineContent: {
    backgroundColor: "var(--color-bg-card)",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border)",
  },
  timelineHeader: {
    fontSize: "var(--text-xs)",
    color: "var(--color-text-muted)",
    marginBottom: "6px",
    display: "flex",
    gap: "8px",
  },
  timelineTime: {
    fontWeight: "var(--fw-bold)",
  },
  timelineAction: {
    color: "var(--color-accent-text)",
  },
  timelineActor: {
    color: "var(--color-text-muted)",
  },
  timelineText: {
    fontSize: "var(--text-sm)",
    lineHeight: "1.4",
    color: "var(--color-text)",
  },
  addLogBar: {
    display: "flex",
    gap: "15px",
    backgroundColor: "var(--color-bg-card)",
    padding: "15px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
  },
  input: {
    flex: 1,
    backgroundColor: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text)",
    padding: "10px",
    fontFamily: "inherit",
    fontSize: "var(--text-sm)",
    outline: "none",
  },
  submitBtn: {
    backgroundColor: "var(--color-accent)",
    color: "var(--neutral-white)",
    border: "none",
    padding: "10px 20px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontWeight: "var(--fw-bold)",
    fontSize: "var(--text-sm)",
    transition: "opacity 0.2s ease",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-text-secondary)",
    fontSize: "var(--text-lg)",
  },
};

