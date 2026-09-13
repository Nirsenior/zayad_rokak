import React, { useState, useEffect } from "react";
import { Wifi, MapPin, Battery, Map, ClipboardList, AlertOctagon, Plane } from "lucide-react";


interface AndroidSimulatorProps {
  requests: any[];
  addRequest: (newReq: any) => void;
  activeAlert: string | null;
  clearAlert: () => void;
  onMockPing: (id: string) => void;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  requests,
  addRequest,
  activeAlert,
  clearAlert,
  onMockPing,
}) => {
  const [activeTab, setActiveTab] = useState<"MAP" | "FORM">("MAP");
  const [gpsLocked] = useState(true);
  const [transponderActive, setTransponderActive] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [useAlternativeFreq, setUseAlternativeFreq] = useState(false);

  const missionTemplates = [
    { name: "סיור קו מגע (30מ', רדיוס 300מ')", minAlt: 20, maxAlt: 50, duration: 15 },
    { name: "תצפית הגנה היקפית (50מ', רדיוס 500מ')", minAlt: 30, maxAlt: 80, duration: 30 },
    { name: "סריקת תא שטח (80מ', רדיוס 1ק\"מ)", minAlt: 50, maxAlt: 150, duration: 45 },
  ];

  // Auto-send pings when transponder is active
  useEffect(() => {
    let interval: any;
    if (transponderActive && currentRequest && currentRequest.status === "APPROVED") {
      interval = setInterval(() => {
        onMockPing(currentRequest.id.replace("req", "flight"));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [transponderActive, currentRequest]);

  const handleSubmit = () => {
    const template = missionTemplates[selectedTemplate];
    const newId = `req-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq = {
      id: newId,
      operatorName: "סמל רועי שרון",
      unit: "גדוד 12",
      droneModel: "DJI Mavic 3 Pro",
      frequencies: useAlternativeFreq ? [2.4] : [5.8],
      timeWindow: `עכשיו - עוד ${template.duration} דק'`,
      classification: selectedTemplate === 0 ? "GREEN" : selectedTemplate === 1 ? "ORANGE" : "RED",
      minAlt: template.minAlt,
      maxAlt: template.maxAlt,
      conflicts: selectedTemplate === 0 ? [] : [
        { type: "SPECTRUM_CONFLICT", description: selectedTemplate === 1 ? "חשש לשיבושי ל''א בתדר 5.8GHz בגזרה" : "נתיב הטיסה חוצה מרחב מוגן של גדוד שכן" }
      ],
      notes: template.name,
      status: "PENDING_REVIEW",
    };

    addRequest(newReq);
    setCurrentRequest(newReq);
    setActiveTab("MAP");
    Toast("בקשת הטיסה נשלחה לרוק\"ק");
  };

  const Toast = (msg: string) => {
    alert(msg);
  };

  // Sync state with approved request in parent
  const syncedRequest = requests.find((r) => r.id === currentRequest?.id);

  return (
    <div style={styles.phoneFrame}>
      {/* Speaker and Camera notch */}
      <div style={styles.notch} />

      {/* Android Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusTime}>13:26</div>
        <div style={{ ...styles.statusIcons, display: "flex", alignItems: "center", gap: "6px" }}>
          <Wifi size={10} color="#a0a0a0" />
          <MapPin size={10} color={gpsLocked ? "#2ecc71" : "#e74c3c"} />
          <Battery size={12} color="#a0a0a0" />
          <span style={{ fontSize: "9px", color: "#a0a0a0" }}>88%</span>
        </div>
      </div>

      {/* App Header */}
      <div style={styles.appHeader}>
        <span style={styles.appTitle}>אול״ר רשתי — אלון 4</span>
      </div>

      {/* Mobile Screens Content */}
      <div style={styles.screenContent}>
        {activeTab === "MAP" ? (
          /* Tactical Map Fragment */
          <div style={styles.mapFragment}>
            <div style={styles.mapGrid} />

            {/* Drone Icon */}
            <div style={{ ...styles.droneMarker, transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plane size={18} color="#2ecc71" />
            </div>

            {/* Operator Location (GPS) */}
            <div style={{ ...styles.operatorMarker, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3498db", boxShadow: "0 0 8px #3498db" }} />
            </div>

            {/* Telemetry Display overlay */}
            <div style={styles.telemetryOverlay}>
              <div style={styles.telItem}><strong>גובה AGL:</strong> {transponderActive ? "45מ'" : "--"}</div>
              <div style={styles.telItem}><strong>מהירות:</strong> {transponderActive ? "22 קמ\"ש" : "--"}</div>
              <div style={styles.telItem}><strong>לוויינים:</strong> {gpsLocked ? "18 (נעול)" : "0"}</div>
            </div>

            {/* Status bar bottom */}
            {syncedRequest && (
              <div
                style={{
                  ...styles.statusBanner,
                  backgroundColor: syncedRequest.status === "APPROVED" ? "#2ecc71" : syncedRequest.status === "REJECTED" ? "#e74c3c" : "#e67e22",
                }}
              >
                <strong>תוכנית טיסה:</strong> {syncedRequest.status}
                {syncedRequest.status === "APPROVED" && (
                  <button
                    onClick={() => setTransponderActive(!transponderActive)}
                    style={{
                      ...styles.actionBtn,
                      backgroundColor: transponderActive ? "#c0392b" : "#2980b9",
                      fontSize: "11px",
                      padding: "4px 8px",
                    }}
                  >
                    {transponderActive ? "משדר פעיל" : "הפעל משדר (Transponder)"}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Quick Flight Request Form */
          <div style={styles.formFragment}>
            <h4 style={styles.formTitle}>בקשת תיאום מרחב מהירה</h4>
            
            <label style={styles.label}>בחר תבנית משימה:</label>
            <select
              style={styles.select}
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(Number(e.target.value))}
            >
              {missionTemplates.map((t, idx) => (
                <option key={idx} value={idx}>{t.name}</option>
              ))}
            </select>

            <div style={styles.checkboxContainer}>
              <input
                type="checkbox"
                id="altFreq"
                checked={useAlternativeFreq}
                onChange={(e) => setUseAlternativeFreq(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="altFreq" style={styles.checkboxLabel}>השתמש בתדר גיבוי (2.4GHz)</label>
            </div>

            <button onClick={handleSubmit} style={styles.submitBtn}>
              שלח בקשה לאישור רוק״ק
            </button>
          </div>
        )}
      </div>

      {/* App Navigation Bottom Bar */}
      <div style={styles.navBar}>
        <button
          onClick={() => setActiveTab("MAP")}
          style={{ ...styles.navButton, color: activeTab === "MAP" ? "#3498db" : "#95a5a6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}
        >
          <Map size={14} />
          <span style={{ fontSize: "10px" }}>מפה טקטית</span>
        </button>
        <button
          onClick={() => setActiveTab("FORM")}
          style={{ ...styles.navButton, color: activeTab === "FORM" ? "#3498db" : "#95a5a6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}
        >
          <ClipboardList size={14} />
          <span style={{ fontSize: "10px" }}>בקשה מהירה</span>
        </button>
      </div>

      {/* Critical Alert Overlay Screen */}
      {activeAlert && (
        <div style={styles.alertOverlay}>
          <div style={{ ...styles.alertIcon, display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <AlertOctagon size={40} color="#fff" />
          </div>
          <h2 style={styles.alertTitle}>התרעת חירום חטיבתית!</h2>
          <p style={styles.alertMessage}>{activeAlert}</p>
          <button style={styles.ackBtn} onClick={clearAlert}>
            אישור קבלת התרעה
          </button>
        </div>
      )}

      {/* Home button notch */}
      <div style={styles.homeBar} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  phoneFrame: {
    width: "300px",
    height: "580px",
    backgroundColor: "#000",
    borderRadius: "36px",
    border: "8px solid #2c3e50",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
    fontFamily: "Inter, system-ui, sans-serif",
    direction: "rtl",
    margin: "auto",
  },
  notch: {
    width: "120px",
    height: "18px",
    backgroundColor: "#000",
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px",
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
  },
  statusBar: {
    height: "24px",
    backgroundColor: "#111",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 18px",
    fontSize: "10px",
    color: "#fff",
    paddingTop: "4px",
  },
  statusTime: {
    fontWeight: "bold",
  },
  statusIcons: {
    display: "flex",
    gap: "6px",
  },
  appHeader: {
    height: "40px",
    backgroundColor: "#1a1a24",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #2a2a35",
  },
  appTitle: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#fff",
  },
  screenContent: {
    flex: 1,
    backgroundColor: "#141419",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  mapFragment: {
    flex: 1,
    position: "relative",
    backgroundColor: "#1c212a",
    overflow: "hidden",
  },
  mapGrid: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
    backgroundSize: "20px 20px",
  },
  droneMarker: {
    position: "absolute",
    top: "180px",
    left: "140px",
    fontSize: "20px",
  },
  operatorMarker: {
    position: "absolute",
    top: "240px",
    left: "120px",
    fontSize: "16px",
  },
  telemetryOverlay: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "rgba(26, 26, 36, 0.8)",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "10px",
    color: "#fff",
    border: "1px solid #34495e",
  },
  telItem: {
    marginBottom: "4px",
  },
  statusBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    padding: "8px 12px",
    color: "#fff",
    fontSize: "11px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: {
    color: "#fff",
    border: "none",
    borderRadius: "2px",
    cursor: "pointer",
  },
  formFragment: {
    padding: "16px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  formTitle: {
    fontSize: "14px",
    margin: "0 0 10px 0",
    borderBottom: "1px solid #34495e",
    paddingBottom: "8px",
  },
  label: {
    fontSize: "11px",
    color: "#bdc3c7",
  },
  select: {
    width: "100%",
    backgroundColor: "#1a1a24",
    border: "1px solid #34495e",
    color: "#fff",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "12px",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "5px",
  },
  checkbox: {
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: "11px",
    color: "#bdc3c7",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#3498db",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "10px",
  },
  navBar: {
    height: "48px",
    backgroundColor: "#1a1a24",
    borderTop: "1px solid #2a2a35",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navButton: {
    background: "none",
    border: "none",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#c0392b",
    zIndex: 200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    textAlign: "center",
  },
  alertIcon: {
    fontSize: "40px",
    marginBottom: "15px",
    animation: "blink 1s infinite",
  },
  alertTitle: {
    fontSize: "18px",
    margin: "0 0 10px 0",
    color: "#fff",
  },
  alertMessage: {
    fontSize: "13px",
    color: "#fff",
    marginBottom: "20px",
    lineHeight: "1.4",
  },
  ackBtn: {
    backgroundColor: "#fff",
    color: "#c0392b",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  homeBar: {
    width: "100px",
    height: "4px",
    backgroundColor: "#7f8c8d",
    borderRadius: "2px",
    position: "absolute",
    bottom: "4px",
    left: "50%",
    transform: "translateX(-50%)",
  },
};
