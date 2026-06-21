import React, { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, ClipboardList, Check, X } from "lucide-react";


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

interface FlightDashboardProps {
  requests: FlightRequest[];
  onReview: (id: string, action: "APPROVED" | "REJECTED" | "CONFLICT" | "REMOVE", reviewerNotes: string) => void;
}

const classificationConfig = {
  GREEN: {
    bg: "var(--green-3)",
    border: "var(--green-6)",
    text: "var(--green-11)",
    badgeBg: "var(--green-9)",
    badgeText: "var(--neutral-1)",
    accent: "var(--green-9)",
    label: "ירוק",
  },
  ORANGE: {
    bg: "var(--yellow-3)",
    border: "var(--yellow-6)",
    text: "var(--yellow-11)",
    badgeBg: "var(--yellow-9)",
    badgeText: "var(--neutral-1)",
    accent: "var(--yellow-9)",
    label: "כתום",
  },
  RED: {
    bg: "var(--red-3)",
    border: "var(--red-6)",
    text: "var(--red-9)",
    badgeBg: "var(--red-8)",
    badgeText: "var(--neutral-white)",
    accent: "var(--red-8)",
    label: "אדום",
  },
};

const statusConfig = {
  PENDING_REVIEW: { label: "ממתין לאישור", color: "var(--yellow-9)", bg: "var(--yellow-3)" },
  APPROVED: { label: "מאושר", color: "var(--blue-11)", bg: "var(--blue-3)" },
  REJECTED: { label: "נדחה", color: "var(--red-9)", bg: "var(--red-3)" },
  CONFLICT: { label: "קונפליקט", color: "var(--orange-9)", bg: "#3c1e10" },
};

export const FlightDashboard: React.FC<FlightDashboardProps> = ({ requests, onReview }) => {
  const [selectedReq, setSelectedReq] = useState<FlightRequest | null>(requests[0] || null);
  const [reviewerNotes, setReviewerNotes] = useState("");

  const handleReviewClick = (id: string, action: "APPROVED" | "REJECTED" | "CONFLICT" | "REMOVE") => {
    onReview(id, action, reviewerNotes);
    setReviewerNotes("");
    if (action === "REMOVE") {
      setSelectedReq(null);
    } else {
      setSelectedReq((prev) => prev ? { ...prev, status: action as any, reviewerNotes } : null);
    }
  };

  return (
    <div style={styles.container}>
      {/* ── Queue Panel ── */}
      <div style={styles.queuePanel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelTitle}>תור בקשות ממתינות</span>
          <span style={styles.panelBadge}>
            {requests.filter(r => r.status === "PENDING_REVIEW" || r.status === "CONFLICT").length}
          </span>
        </div>

        <div style={styles.requestList}>
          {requests.map((r) => {
            if (r.status === "REJECTED") return null;
            const cfg = classificationConfig[r.classification];
            const isSelected = selectedReq?.id === r.id;
            const isConflict = r.status === "CONFLICT";
            const isApproved = r.status === "APPROVED";
            return (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedReq(r);
                  setReviewerNotes(r.reviewerNotes || "");
                }}
                style={{
                  ...styles.requestCard,
                  borderRight: `3px solid ${
                    isApproved 
                      ? "var(--blue-9)" 
                      : isConflict 
                      ? "var(--orange-9)" 
                      : "var(--yellow-9)"
                  }`,
                  backgroundColor: isSelected ? "var(--neutral-5)" : "var(--neutral-4)",
                  boxShadow: isSelected ? `inset 0 0 0 1px var(--neutral-7)` : "none",
                }}
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardIdRow}>
                    <span style={styles.cardId}>{r.id}</span>
                    {r.isArmed && (
                      <span style={styles.armedBadge}><AlertTriangle size={10} style={{ marginLeft: 3 }} /> חמוש</span>
                    )}
                  </div>
                  <span style={{
                    ...styles.classBadge,
                    backgroundColor: cfg.badgeBg,
                    color: cfg.badgeText,
                  }}>
                    {cfg.label}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>מפעיל</span>
                    <span style={styles.cardVal}>{r.operatorName}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>יחידה</span>
                    <span style={styles.cardVal}>{r.unit}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>חלון זמן</span>
                    <span style={styles.cardVal}>{r.timeWindow}</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span style={{
                    ...styles.statusPill,
                    backgroundColor: statusConfig[r.status].bg,
                    color: statusConfig[r.status].color,
                  }}>
                    {statusConfig[r.status].label}
                  </span>
                  {r.conflicts.length > 0 && (
                    <span style={styles.conflictCount}>
                      {r.conflicts.length} קונפליקטים
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Details Panel ── */}
      {selectedReq ? (
        <div style={styles.detailsPanel}>
          {/* Header */}
          <div style={styles.detailsHeader}>
            <div style={styles.detailsHeaderLeft}>
              <div style={styles.detailsIdRow}>
                <h2 style={styles.detailsTitle}>בקשת טיסה: {selectedReq.id}</h2>
                {selectedReq.isArmed && (
                  <span style={styles.armedAlert}><AlertTriangle size={12} style={{ marginLeft: 4 }} /> כלי חמוש (חמ''מ)</span>
                )}
              </div>
              <span style={styles.detailsSubtitle}>
                {selectedReq.operatorName} · {selectedReq.unit}
              </span>
            </div>
            <div style={styles.detailsHeaderRight}>
              <div style={{
                ...styles.classificationBig,
                backgroundColor: classificationConfig[selectedReq.classification].bg,
                border: `1px solid ${classificationConfig[selectedReq.classification].border}`,
                color: classificationConfig[selectedReq.classification].text,
              }}>
                <span style={styles.classLabel}>סיווג</span>
                <span style={styles.classValue}>{classificationConfig[selectedReq.classification].label}</span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div style={styles.infoGrid}>
            {[
              { label: "דגם כלי", value: selectedReq.droneModel },
              { label: "תדרים", value: `${selectedReq.frequencies?.join(", ")} GHz` },
              { label: "חלון זמנים", value: selectedReq.timeWindow },
              { label: "גובה מינימום", value: `${selectedReq.minAlt} מ'` },
              { label: "גובה מקסימום", value: `${selectedReq.maxAlt} מ'` },
              { label: "מרחב מבוקש", value: selectedReq.polygonName || "לא הוגדר" },
              {
                label: "מיקום מפעיל (GPS)",
                value: selectedReq.operatorLocation
                  ? `${selectedReq.operatorLocation.lat.toFixed(4)}, ${selectedReq.operatorLocation.lng.toFixed(4)}`
                  : "33.2320, 35.5660",
              },
              {
                label: "נשק/חימוש",
                value: selectedReq.isArmed ? "כלי חמוש (חמ''מ)" : "לא חמוש",
                valueColor: selectedReq.isArmed ? "var(--red-9)" : "var(--green-11)",
              },
            ].map(({ label, value, valueColor }) => (
              <div key={label} style={styles.infoCell}>
                <span style={styles.infoCellLabel}>{label}</span>
                <span style={{ ...styles.infoCellValue, color: valueColor || "var(--neutral-white)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Mission Notes */}
          {selectedReq.operatorNotes && (
            <div style={styles.notesBlock}>
              <span style={styles.notesLabel}>הערות מפעיל מהשטח</span>
              <p style={styles.notesText}>{selectedReq.operatorNotes}</p>
            </div>
          )}
          <div style={styles.notesBlock}>
            <span style={styles.notesLabel}>תיאור משימה</span>
            <p style={styles.notesText}>{selectedReq.notes}</p>
          </div>

          {/* Conflict Analysis */}
          <div style={{
            ...styles.conflictWidget,
            borderColor: selectedReq.conflicts.length > 0 ? "rgba(249, 115, 22, 0.4)" : "rgba(16, 185, 129, 0.4)",
            backgroundColor: selectedReq.conflicts.length > 0 ? "rgba(249, 115, 22, 0.08)" : "rgba(16, 185, 129, 0.08)",
          }}>
            <div style={styles.conflictHeader}>
              <span style={{ ...styles.conflictIcon, display: "flex", alignItems: "center" }}>
                {selectedReq.conflicts.length > 0 ? <AlertTriangle size={16} color="#f97316" /> : <CheckCircle size={16} color="#10b981" />}
              </span>
              <span style={{
                ...styles.conflictTitle,
                color: selectedReq.conflicts.length > 0 ? "#ff8c3a" : "#10b981",
                marginRight: "6px",
              }}>
                {selectedReq.conflicts.length > 0
                  ? `נמצאו ${selectedReq.conflicts.length} קונפליקטים`
                  : "ניתוח קונפליקטים — תקין"}
              </span>
            </div>
            {selectedReq.conflicts.length === 0 ? (
              <p style={{ ...styles.conflictText, color: "#d1fae5" }}>
                לא נמצאו קונפליקטים גיאוגרפיים או ספקטרליים במרחב האווירי.
              </p>
            ) : (
              <div style={styles.conflictList}>
                {selectedReq.conflicts.map((c, idx) => (
                  <div key={idx} style={styles.conflictItem}>
                    <div style={{ ...styles.conflictBullet, backgroundColor: "#f97316" }} />
                    <span style={{ ...styles.conflictText, color: "#ffdcd0" }}>{c.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Form */}
          {selectedReq.status === "PENDING_REVIEW" || selectedReq.status === "CONFLICT" ? (
            <div style={styles.actionForm}>
              <label style={styles.formLabel}>הערות קצין רוק"ק / הנחיות לשטח</label>
              <textarea
                style={styles.textarea}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="הקלד הנחיות למפעיל..."
              />
              <div style={styles.actionsBar}>
                <button
                  id={`approve-btn-${selectedReq.id}`}
                  onClick={() => handleReviewClick(selectedReq.id, "APPROVED")}
                  style={{ ...styles.btn, ...styles.btnApprove, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--green-10)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--green-9)")}
                >
                  <Check size={16} /> אשר תוכנית טיסה
                </button>
                <button
                  id={`conflict-btn-${selectedReq.id}`}
                  onClick={() => handleReviewClick(selectedReq.id, "CONFLICT")}
                  style={{ ...styles.btn, backgroundColor: "var(--orange-9)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--orange-10)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--orange-9)")}
                >
                  <AlertTriangle size={16} /> סמן כקונפליקט
                </button>
                <button
                  id={`reject-btn-${selectedReq.id}`}
                  onClick={() => handleReviewClick(selectedReq.id, "REMOVE")}
                  style={{ ...styles.btn, ...styles.btnReject, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--red-9)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--red-8)")}
                >
                  <X size={16} /> הסר תוכנית טיסה
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              ...styles.reviewBanner,
              backgroundColor: selectedReq.status === "APPROVED" ? "var(--blue-3)" : "var(--red-3)",
              borderColor: selectedReq.status === "APPROVED" ? "var(--blue-6)" : "var(--red-6)",
            }}>
              <span style={{
                fontSize: "var(--text-sm)",
                fontWeight: "var(--fw-semibold)" as any,
                color: selectedReq.status === "APPROVED" ? "var(--blue-11)" : "var(--red-9)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                {selectedReq.status === "APPROVED" ? (
                  <CheckCircle size={16} color="var(--blue-11)" />
                ) : (
                  <XCircle size={16} color="var(--red-9)" />
                )}
                {selectedReq.status === "APPROVED" ? "הבקשה אושרה" : "הבקשה נדחתה"}
              </span>
              {selectedReq.reviewerNotes && (
                <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--neutral-12)" }}>
                  <strong>הערות: </strong>{selectedReq.reviewerNotes}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}><ClipboardList size={40} /></span>
          <span>בחר בקשה מהתור לצפייה בפרטים</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    width: "100%",
    height: "100%",
    backgroundColor: "var(--neutral-1)",
    color: "var(--neutral-white)",
    direction: "rtl",
    overflow: "hidden",
  },

  // ── Queue Panel ──
  queuePanel: {
    width: "320px",
    backgroundColor: "var(--neutral-2)",
    borderLeft: "1px solid var(--neutral-5)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    flexShrink: 0,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "var(--space-4) var(--space-4) var(--space-3)",
    borderBottom: "1px solid var(--neutral-5)",
  },
  panelTitle: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-12)",
    textTransform: "uppercase" as any,
    letterSpacing: "0.6px",
  },
  panelBadge: {
    fontSize: "10px",
    fontWeight: "var(--fw-bold)" as any,
    backgroundColor: "var(--blue-3)",
    color: "var(--blue-11)",
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--blue-6)",
  },
  requestList: {
    flex: 1,
    overflowY: "auto",
    padding: "var(--space-3)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },

  requestCard: {
    padding: "var(--space-3)",
    borderRadius: "var(--radius-2)",
    cursor: "pointer",
    boxSizing: "border-box",
    transition: "background-color var(--transition-base)",
    border: "1px solid var(--neutral-6)",
    borderRight: "3px solid transparent",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "var(--space-2)",
  },
  cardIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
  },
  cardId: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--blue-11)",
    fontFamily: "var(--font-mono)",
  },
  armedBadge: {
    fontSize: "9px",
    fontWeight: "var(--fw-bold)" as any,
    backgroundColor: "var(--red-3)",
    color: "var(--red-9)",
    padding: "1px 6px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--red-6)",
  },
  classBadge: {
    fontSize: "9px",
    fontWeight: "var(--fw-bold)" as any,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    marginBottom: "var(--space-2)",
  },
  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "var(--text-xs)",
  },
  cardLabel: {
    color: "var(--neutral-10)",
  },
  cardVal: {
    color: "var(--neutral-12)",
    fontWeight: "var(--fw-medium)" as any,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "var(--space-2)",
    borderTop: "1px solid var(--neutral-6)",
  },
  statusPill: {
    fontSize: "9px",
    fontWeight: "var(--fw-semibold)" as any,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
  },
  conflictCount: {
    fontSize: "9px",
    color: "var(--yellow-9)",
    fontWeight: "var(--fw-medium)" as any,
  },

  // ── Details Panel ──
  detailsPanel: {
    flex: 1,
    padding: "var(--space-5) var(--space-6)",
    overflowY: "auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-5)",
  },

  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: "var(--space-4)",
    borderBottom: "1px solid var(--neutral-5)",
  },
  detailsHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
  },
  detailsIdRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-3)",
  },
  detailsTitle: {
    fontSize: "var(--text-xl)",
    fontWeight: "var(--fw-bold)" as any,
    color: "var(--neutral-white)",
    margin: 0,
    lineHeight: "var(--lh-xl)",
  },
  armedAlert: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-semibold)" as any,
    backgroundColor: "var(--red-3)",
    color: "var(--red-9)",
    padding: "var(--space-1) var(--space-3)",
    borderRadius: "var(--radius-2)",
    border: "1px solid var(--red-6)",
    animation: "pulse-glow 2s infinite",
  },
  detailsSubtitle: {
    fontSize: "var(--text-sm)",
    color: "var(--neutral-11)",
  },
  detailsHeaderRight: {},
  classificationBig: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "var(--space-3) var(--space-5)",
    borderRadius: "var(--radius-3)",
    gap: "2px",
  },
  classLabel: {
    fontSize: "9px",
    fontWeight: "var(--fw-semibold)" as any,
    textTransform: "uppercase" as any,
    letterSpacing: "0.8px",
    opacity: 0.7,
  },
  classValue: {
    fontSize: "var(--text-lg)",
    fontWeight: "var(--fw-bold)" as any,
  },

  // Info Grid
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "var(--space-3)",
  },
  infoCell: {
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--neutral-6)",
    borderRadius: "var(--radius-2)",
    padding: "var(--space-3)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-1)",
  },
  infoCellLabel: {
    fontSize: "10px",
    color: "var(--neutral-10)",
    fontWeight: "var(--fw-medium)" as any,
    textTransform: "uppercase" as any,
    letterSpacing: "0.4px",
  },
  infoCellValue: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-white)",
  },

  // Notes
  notesBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  notesLabel: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-12)",
    textTransform: "uppercase" as any,
    letterSpacing: "0.5px",
  },
  notesText: {
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--neutral-5)",
    padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-2)",
    fontSize: "var(--text-sm)",
    color: "var(--neutral-12)",
    margin: 0,
    lineHeight: "var(--lh-sm)",
  },

  // Conflict Widget
  conflictWidget: {
    padding: "var(--space-4)",
    borderRadius: "var(--radius-3)",
    border: "1px solid",
  },
  conflictHeader: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginBottom: "var(--space-3)",
  },
  conflictIcon: { fontSize: "14px" },
  conflictTitle: {
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-semibold)" as any,
  },
  conflictList: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
  },
  conflictItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "var(--space-2)",
  },
  conflictBullet: {
    width: "6px",
    height: "6px",
    backgroundColor: "var(--yellow-9)",
    borderRadius: "50%",
    marginTop: "5px",
    flexShrink: 0,
  },
  conflictText: {
    fontSize: "var(--text-sm)",
    color: "var(--yellow-11)",
    lineHeight: "var(--lh-sm)",
    margin: 0,
  },

  // Action Form
  actionForm: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
  },
  formLabel: {
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-semibold)" as any,
    color: "var(--neutral-12)",
    textTransform: "uppercase" as any,
    letterSpacing: "0.5px",
  },
  textarea: {
    width: "100%",
    height: "80px",
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--neutral-6)",
    color: "var(--neutral-white)",
    padding: "var(--space-3)",
    borderRadius: "var(--radius-2)",
    fontFamily: "var(--font-family)",
    fontSize: "var(--text-sm)",
    boxSizing: "border-box" as any,
    resize: "none" as any,
    outline: "none",
    lineHeight: "var(--lh-sm)",
  },
  actionsBar: {
    display: "flex",
    gap: "var(--space-3)",
  },
  btn: {
    flex: 1,
    color: "var(--neutral-white)",
    border: "none",
    padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-2)",
    cursor: "pointer",
    fontWeight: "var(--fw-semibold)" as any,
    fontSize: "var(--text-sm)",
    fontFamily: "var(--font-family)",
    transition: "background-color var(--transition-fast)",
  },
  btnApprove: {
    backgroundColor: "var(--green-9)",
  },
  btnReject: {
    backgroundColor: "var(--red-8)",
  },
  reviewBanner: {
    padding: "var(--space-4)",
    borderRadius: "var(--radius-2)",
    border: "1px solid",
  },

  // Empty State
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-3)",
    color: "var(--neutral-10)",
    fontSize: "var(--text-base)",
  },
  emptyIcon: {
    fontSize: "40px",
    opacity: 0.4,
  },
};
