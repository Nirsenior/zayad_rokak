import React, { useState } from "react";

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
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
}

export const FlightDashboard: React.FC = () => {
  const [requests, setRequests] = useState<FlightRequest[]>([
    {
      id: "req-8812",
      operatorName: "סמ''ר אלון כהן",
      unit: "גדוד 51",
      droneModel: "DJI Matrice 300",
      frequencies: [2.4, 5.8],
      timeWindow: "14:00 - 14:30",
      classification: "ORANGE",
      minAlt: 20,
      maxAlt: 80,
      notes: "תצפית אבטחת נתיב כוחותינו",
      status: "PENDING_REVIEW",
      conflicts: [
        { type: "SPECTRUM_WARN", description: "הנתיב המבוקש עובר באזור חסימת ל''א פעיל בתדר 5.8GHz" }
      ],
    },
    {
      id: "req-8813",
      operatorName: "סג''ן דנה לוי",
      unit: "צוות גדסר",
      droneModel: "Mavic 3 Enterprise",
      frequencies: [2.4],
      timeWindow: "14:15 - 14:45",
      classification: "GREEN",
      minAlt: 10,
      maxAlt: 50,
      notes: "מיפוי גזרת הסריקה",
      status: "PENDING_REVIEW",
      conflicts: [],
    },
    {
      id: "req-8814",
      operatorName: "רס''ן יאיר דגן",
      unit: "סיוע חטיבתי",
      droneModel: "Skydio X2D",
      frequencies: [1.8],
      timeWindow: "15:00 - 16:00",
      classification: "RED",
      minAlt: 50,
      maxAlt: 150,
      notes: "סיוע הכוונת אש",
      status: "PENDING_REVIEW",
      conflicts: [
        { type: "NFZ_VIOLATION", description: "נתיב הטיסה עובר דרך שטח הגנה מוגדר אסור לטיסה (NFZ #3)" }
      ],
    },
  ]);

  const [selectedReq, setSelectedReq] = useState<FlightRequest | null>(requests[0]);
  const [reviewerNotes, setReviewerNotes] = useState("");

  const handleReview = (id: string, action: "APPROVED" | "REJECTED") => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: action, reviewerNotes } : r
      )
    );
    if (selectedReq?.id === id) {
      setSelectedReq((prev) => (prev ? { ...prev, status: action, reviewerNotes } : null));
    }
    setReviewerNotes("");
  };

  const getBadgeStyle = (classification: FlightRequest["classification"]) => {
    switch (classification) {
      case "GREEN":
        return { backgroundColor: "#2ecc71", color: "#fff" };
      case "ORANGE":
        return { backgroundColor: "#e67e22", color: "#fff" };
      case "RED":
        return { backgroundColor: "#e74c3c", color: "#fff" };
    }
  };

  return (
    <div style={styles.container}>
      {/* Pending Requests List */}
      <div style={styles.queuePanel}>
        <h3 style={styles.sectionTitle}>תור בקשות ממתינות ({requests.filter(r => r.status === "PENDING_REVIEW").length})</h3>
        {requests.map((r) => (
          <div
            key={r.id}
            onClick={() => {
              setSelectedReq(r);
              setReviewerNotes(r.reviewerNotes || "");
            }}
            style={{
              ...styles.requestCard,
              borderRight: `5px solid ${r.status === "PENDING_REVIEW" ? (r.classification === "GREEN" ? "#2ecc71" : r.classification === "ORANGE" ? "#e67e22" : "#e74c3c") : "#7f8c8d"}`,
              backgroundColor: selectedReq?.id === r.id ? "#2c2c35" : "#1e1e24",
            }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.cardId}>{r.id}</span>
              <span style={{ ...styles.badge, ...getBadgeStyle(r.classification) }}>
                {r.classification}
              </span>
            </div>
            <div style={styles.cardBody}>
              <div><strong>מפעיל:</strong> {r.operatorName} ({r.unit})</div>
              <div><strong>חלון זמן:</strong> {r.timeWindow}</div>
              <div><strong>סטטוס:</strong> {r.status}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Request Details Panel */}
      {selectedReq ? (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsHeader}>
            <h2>פרטי בקשת טיסה: {selectedReq.id}</h2>
            <span style={{ ...styles.badge, ...getBadgeStyle(selectedReq.classification), padding: "8px 16px", fontSize: "14px" }}>
              סיווג: {selectedReq.classification}
            </span>
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.gridItem}><strong>מפעיל מגיש:</strong> {selectedReq.operatorName}</div>
            <div style={styles.gridItem}><strong>יחידה:</strong> {selectedReq.unit}</div>
            <div style={styles.gridItem}><strong>דגם כלי:</strong> {selectedReq.droneModel}</div>
            <div style={styles.gridItem}><strong>תדרים:</strong> {selectedReq.frequencies.join(", ")} GHz</div>
            <div style={styles.gridItem}><strong>חלון זמנים:</strong> {selectedReq.timeWindow}</div>
            <div style={styles.gridItem}><strong>גובה מאושר:</strong> {selectedReq.minAlt} - {selectedReq.maxAlt} מטרים AGL</div>
          </div>

          <div style={styles.notesSection}>
            <strong>תיאור משימה:</strong>
            <p style={styles.notesText}>{selectedReq.notes}</p>
          </div>

          {/* Conflict Analysis Widget */}
          <div style={styles.conflictWidget}>
            <h3 style={{ ...styles.sectionTitle, color: selectedReq.conflicts.length > 0 ? "#e67e22" : "#2ecc71" }}>
              דוח בדיקת קונפליקטים אוטומטי
            </h3>
            {selectedReq.conflicts.length === 0 ? (
              <p style={{ color: "#2ecc71" }}>לא נמצאו קונפליקטים גיאוגרפיים או ספקטרליים במרחב האווירי.</p>
            ) : (
              selectedReq.conflicts.map((c, idx) => (
                <div key={idx} style={styles.conflictItem}>
                  <strong>[קונפליקט]</strong> {c.description}
                </div>
              ))
            )}
          </div>

          {/* Approval Actions */}
          {selectedReq.status === "PENDING_REVIEW" ? (
            <div style={styles.actionForm}>
              <label style={styles.label}>הערות קצין רוק"ק / הנחיות לשטח:</label>
              <textarea
                style={styles.textarea}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="הקלד הנחיות למפעיל..."
              />
              <div style={styles.actionsBar}>
                <button
                  onClick={() => handleReview(selectedReq.id, "APPROVED")}
                  style={{ ...styles.btn, backgroundColor: "#2ecc71" }}
                >
                  אשר תוכנית טיסה
                </button>
                <button
                  onClick={() => handleReview(selectedReq.id, "REJECTED")}
                  style={{ ...styles.btn, backgroundColor: "#e74c3c" }}
                >
                  דחה תוכנית טיסה
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.reviewCompletedBanner}>
              <strong>הבקשה טופלה:</strong> סטטוס {selectedReq.status === "APPROVED" ? "מאושר" : "נדחה"}
              {selectedReq.reviewerNotes && (
                <div style={{ marginTop: "5px" }}><strong>הערות:</strong> {selectedReq.reviewerNotes}</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>בחר בקשה מהתור לצפייה בפרטים</div>
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
  queuePanel: {
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
  requestCard: {
    padding: "15px",
    borderRadius: "4px",
    marginBottom: "10px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  cardId: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#95a5a6",
  },
  badge: {
    fontSize: "10px",
    fontWeight: "bold",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  cardBody: {
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#bdc3c7",
  },
  detailsPanel: {
    flex: 1,
    padding: "30px",
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
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginBottom: "25px",
  },
  gridItem: {
    fontSize: "14px",
    backgroundColor: "#1e1e24",
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #2e2e38",
  },
  notesSection: {
    marginBottom: "25px",
  },
  notesText: {
    backgroundColor: "#1e1e24",
    padding: "15px",
    borderRadius: "4px",
    fontSize: "14px",
    color: "#bdc3c7",
    margin: "8px 0 0 0",
  },
  conflictWidget: {
    backgroundColor: "#1c120c",
    border: "1px solid #d35400",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "25px",
  },
  conflictItem: {
    fontSize: "13px",
    color: "#e67e22",
    marginBottom: "8px",
    lineHeight: "1.4",
  },
  actionForm: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
  },
  textarea: {
    width: "100%",
    height: "80px",
    backgroundColor: "#1e1e24",
    border: "1px solid #2e2e38",
    color: "#fff",
    padding: "10px",
    borderRadius: "4px",
    fontFamily: "inherit",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  actionsBar: {
    display: "flex",
    gap: "15px",
    marginTop: "10px",
  },
  btn: {
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  reviewCompletedBanner: {
    backgroundColor: "#27ae60",
    padding: "15px",
    borderRadius: "4px",
    fontSize: "14px",
    color: "#fff",
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
