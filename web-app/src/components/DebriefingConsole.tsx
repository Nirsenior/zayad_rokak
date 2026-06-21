import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Play,
  Pause,
  RotateCcw,
  UploadCloud,
  Sparkles,
  Compass,
  Send,
  FileText,
  BookOpen,
  Filter
} from "lucide-react";

// Standard Leaflet Icon reset to prevent missing icon images
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DebriefEvent {
  id: string;
  title: string;
  sector: "מטולה" | "הרכס" | "אביבים" | "בופור";
  force: "גדוד 51" | "צוות גדסר" | "כוח אשד" | "חפ''ק מפקד";
  drone: "DJI Matrice 300" | "Mavic 3 Enterprise" | "Skydio X2D";
  mission: "סריקת ציר" | "תצפית בופור" | "מיפוי טקטי" | "פטרול גבול";
  createdAt: string;
  color: string;
  path: [number, number][]; // coordinates for replay
  telemetry: {
    time: string;
    altitude: number;
    battery: number;
    frequency: number;
    status: string;
  }[];
}

interface CargoFile {
  name: string;
  size: string;
  type: string;
  status: "UPLOADED" | "CROSS_REFERENCED";
  associatedEventId?: string;
}

export const DebriefingConsole: React.FC<{
  onTriggerAlert: (msg: string, metadata?: { alertType?: string; threatLocation?: { lat: number; lng: number } }) => void;
}> = ({ onTriggerAlert }) => {
  // Mock events database
  const [events] = useState<DebriefEvent[]>([
    {
      id: "DB-101",
      title: "חדירת רחפן עוין במטולה",
      sector: "מטולה",
      force: "גדוד 51",
      drone: "DJI Matrice 300",
      mission: "סריקת ציר",
      createdAt: "13:14:02",
      color: "var(--red-9)",
      path: [
        [33.280, 35.575],
        [33.282, 35.580],
        [33.285, 35.582],
        [33.288, 35.578],
        [33.291, 35.583]
      ],
      telemetry: [
        { time: "13:14:02", altitude: 40, battery: 85, frequency: 5.8, status: "חפיפת מרחב סריקה" },
        { time: "13:14:22", altitude: 65, battery: 82, frequency: 5.8, status: "שיבוש תדר קל" },
        { time: "13:14:42", altitude: 95, battery: 78, frequency: 5.8, status: "התראת רדאר - עוין" },
        { time: "13:15:02", altitude: 110, battery: 75, frequency: 5.8, status: "נוהל נמר פעיל" },
        { time: "13:15:22", altitude: 120, battery: 72, frequency: 5.8, status: "נטרול מוצלח" }
      ]
    },
    {
      id: "DB-102",
      title: "אובדן תקשורת רחפן בבופור",
      sector: "בופור",
      force: "צוות גדסר",
      drone: "Mavic 3 Enterprise",
      mission: "תצפית בופור",
      createdAt: "12:45:00",
      color: "var(--yellow-9)",
      path: [
        [33.295, 35.530],
        [33.293, 35.535],
        [33.291, 35.532],
        [33.290, 35.538],
        [33.288, 35.534]
      ],
      telemetry: [
        { time: "12:45:00", altitude: 50, battery: 92, frequency: 5.8, status: "טיסה יציבה" },
        { time: "12:45:30", altitude: 75, battery: 89, frequency: 5.8, status: "ירידת איכות וידאו" },
        { time: "12:46:00", altitude: 80, battery: 86, frequency: 5.8, status: "אובדן סיגנל מלא" },
        { time: "12:46:30", altitude: 80, battery: 82, frequency: 5.8, status: "חזרה אוטונומית הביתה" },
        { time: "12:47:00", altitude: 45, battery: 79, frequency: 5.8, status: "נחיתה מוצלחת" }
      ]
    },
    {
      id: "DB-103",
      title: "הפרעות קשר ושיבוש באביבים",
      sector: "אביבים",
      force: "כוח אשד",
      drone: "Skydio X2D",
      mission: "מיפוי טקטי",
      createdAt: "15:20:10",
      color: "var(--orange-9)",
      path: [
        [33.245, 35.560],
        [33.247, 35.563],
        [33.249, 35.561],
        [33.246, 35.558],
        [33.244, 35.562]
      ],
      telemetry: [
        { time: "15:20:10", altitude: 30, battery: 95, frequency: 2.4, status: "החלפת תדר ידנית" },
        { time: "15:20:40", altitude: 42, battery: 91, frequency: 2.4, status: "זיהוי הפרעת רעש רחב" },
        { time: "15:21:10", altitude: 55, battery: 88, frequency: 2.4, status: "מעבר אוטומטי ל-5.8" },
        { time: "15:21:40", altitude: 60, battery: 84, frequency: 5.8, status: "קשר יציב משני" },
        { time: "15:22:10", altitude: 58, battery: 80, frequency: 5.8, status: "השלמת משימה" }
      ]
    }
  ]);

  // States
  const [selectedEvent, setSelectedEvent] = useState<DebriefEvent>(events[0]);
  const [filters, setFilters] = useState({
    sector: "ALL",
    force: "ALL",
    drone: "ALL",
    mission: "ALL"
  });

  // Replay timeline playback state
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 4>(1);
  const playbackTimerRef = useRef<any>(null);

  // Heatmap visibility toggle
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Cargo files uploader state
  const [cargoFiles, setCargoFiles] = useState<CargoFile[]>([
    { name: "metula_flight_telemetry.log", size: "128 KB", type: "log", status: "CROSS_REFERENCED", associatedEventId: "DB-101" },
    { name: "beaufort_drone_video.mp4", size: "14.2 MB", type: "video", status: "UPLOADED" },
    { name: "avivim_sensor_data.kml", size: "45 KB", type: "kml", status: "UPLOADED" }
  ]);
  const [showAssociateDropdown, setShowAssociateDropdown] = useState<number | null>(null);

  // AI Debriefing state
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStep, setAiStep] = useState(0);

  // Interactive AI chat box
  const [chatMessages, setChatMessages] = useState<{ sender: "USER" | "AI"; text: string }[]>([
    { sender: "AI", text: "שלום קצין התחקור. הפק דוח AI מרחבי או שאל אותי שאלות ספציפיות על אירועים בגזרה." }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Replay control loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= selectedEvent.path.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playSpeed, selectedEvent]);

  // Restart replay on switching events
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(false);
    setAiReport(null);
    setChatMessages([
      { sender: "AI", text: `שלום קצין התחקור. ברשותי נתוני האירוע "${selectedEvent.title}". לחץ על כפתור הפקת תחקיר ה-AI כדי להתחיל לנתח לקחים.` }
    ]);
  }, [selectedEvent]);

  // Map fly-to target sync
  const [mapCenter, setMapCenter] = useState<[number, number]>([33.282, 35.580]);
  useEffect(() => {
    if (selectedEvent && selectedEvent.path.length > 0) {
      setMapCenter(selectedEvent.path[0]);
    }
  }, [selectedEvent]);

  // Handle file upload emulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newFile: CargoFile = {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type: file.name.split(".").pop() || "unknown",
        status: "UPLOADED"
      };
      setCargoFiles(prev => [...prev, newFile]);
      showToastNotification(`קובץ ${file.name} הועלה בהצלחה מקארגו`);
    }
  };

  // Associate uploaded file with an event
  const associateFile = (fileIdx: number, eventId: string) => {
    setCargoFiles(prev =>
      prev.map((f, idx) =>
        idx === fileIdx
          ? { ...f, status: "CROSS_REFERENCED", associatedEventId: eventId }
          : f
      )
    );
    setShowAssociateDropdown(null);
    showToastNotification("הקובץ הוצלב בהצלחה עם נתוני הרדאר והטלמטרייה של המערכת!");
  };

  // Trigger local toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToastNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Generate AI debrief report simulation
  const generateAiReport = () => {
    setIsGeneratingAi(true);
    setAiStep(1);
    
    setTimeout(() => setAiStep(2), 700);
    setTimeout(() => setAiStep(3), 1300);
    setTimeout(() => {
      setIsGeneratingAi(false);
      setAiStep(0);
      setAiReport({
        summary: `אירוע ${selectedEvent.id} התרחש בגזרת ${selectedEvent.sector} בשעה ${selectedEvent.createdAt}. רחפן מסוג ${selectedEvent.drone} הופעל על ידי ${selectedEvent.force} במשימת ${selectedEvent.mission}. במהלך הטיסה נרשמו מספר הפרעות משמעותיות בתדר ${selectedEvent.telemetry[0].frequency}GHz עם אובדן איכות קליטה.`,
        trends: `זוהתה מגמה חוזרת בגזרת ${selectedEvent.sector}: זהו האירוע ה-4 בשבועיים האחרונים שבו כוח ${selectedEvent.force} חווה ירידה פתאומית בביצועי הקליטה בגובה של מעל 80 מטרים. ישנו חשד גבוה להפעלת משבש לוחמה אלקטרונית (ל"א) מכיוון הרכס הנגדי.`,
        contradictions: `1. מפעיל הרחפן דיווח על גובה טיסה של 50 מטרים בלבד, אך נתוני הטלמטרייה המוצלבים מראים כי הרחפן טיפס לגובה של ${Math.max(...selectedEvent.telemetry.map(t=>t.altitude))} מטרים.\n2. משימת הרחפן הוגדרה כסריקת צירים בגזרת מגן נמוכה, אך נתיב הטיסה מראה חדירה למרחב פוליגון מורכב הסמוך לאזור החסימה.`,
        lessons: [
          "הנחיית המפעילים בגזרה לעשות שימוש בתדרי גיבוי 2.4GHz בעת זיהוי שיבושים בתדר 5.8GHz.",
          "הגבלת גובה הטיסה המרבי בגזרת הרכס ל-60 מטרים לטובת מניעת קו ראייה למשבשי האויב.",
          "חובת כיול והצבת עמדת המפעיל באזור המוגן גיאוגרפית על מנת לצמצם את זווית החשיפה להפרעות."
        ]
      });
      setChatMessages(prev => [
        ...prev,
        { sender: "AI", text: "השלמתי את ניתוח ה-AI המרחבי עבור אירוע זה. ניתן לראות את סיכום המגמות, הסתירות בנתונים והלקחים המבצעיים מימין. אשמח לענות על כל שאלה נוספת בנושא." }
      ]);
      // Trigger system-wide alert notification
      onTriggerAlert(`דו"ח תחקיר AI הושלם עבור אירוע ${selectedEvent.id} בגזרת ${selectedEvent.sector}`, {
        alertType: "TIGER",
        threatLocation: { lat: selectedEvent.path[0][0], lng: selectedEvent.path[0][1] }
      });
    }, 2200);
  };

  // AI chat question submit
  const submitChat = (text: string) => {
    if (!text.trim()) return;
    setChatMessages(prev => [...prev, { sender: "USER", text }]);
    setChatInput("");

    setTimeout(() => {
      let reply = "על בסיס נתוני האירוע שהועלו מקארגו וטלמטריית המערכת, לא זוהתה חריגה יוצאת דופן במערכת החשמל, אך הפרעות הקשר מעידות בסבירות גבוהה על חסימה אלקטרונית יזומה המכוונת לתדר 5.8GHz.";
      if (text.includes("תדר") || text.includes("קשר")) {
        reply = "תדרי הקשר שנמדדו באירוע היו 5.8GHz. ההמלצה המבצעית היא לעבור לתדר 2.4GHz או להחליף לערוץ מוצפן חסין שיבוש בהקדם.";
      } else if (text.includes("סתיר") || text.includes("מפעיל")) {
        reply = "הסתירה העיקרית היא בין גובה הטיסה המדווח בקשר (50 מטרים) לבין הגובה הטלמטרי המוצלח שנקלט ברשת המכמ''מים והקארגו (120 מטרים). הדבר מצביע על חוסר דיווח מדויק או שגיאה בכיול החיישן.";
      } else if (text.includes("המלצ") || text.includes("לקח")) {
        reply = "הלקח המרכזי הוא מניעת טיסה מעל גובה 60 מטרים באזור Beaufort כדי לא להיחשף למשבשי האויב על קו הרכס, וכן הגדרת אזור חזרה אוטונומי מדויק.";
      }
      setChatMessages(prev => [...prev, { sender: "AI", text: reply }]);
    }, 1000);
  };

  // Map center updating controller helper
  const ChangeMapView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, 14);
    }, [center, map]);
    return null;
  };

  // Filtering events list
  const filteredEvents = events.filter(e => {
    if (filters.sector !== "ALL" && e.sector !== filters.sector) return false;
    if (filters.force !== "ALL" && e.force !== filters.force) return false;
    if (filters.drone !== "ALL" && e.drone !== filters.drone) return false;
    if (filters.mission !== "ALL" && e.mission !== filters.mission) return false;
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={styles.toast}>
          <span>✔️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Right Column: Debriefing Control Panel & Filters */}
      <div style={styles.rightColumn}>
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={18} color="var(--blue-9)" />
            <h2 style={styles.title}>תחקור וניתוח מרחבי</h2>
          </div>
          <span style={styles.subtext}>ניהול תחקירים, הצלבת נתוני קארגו וניתוח AI</span>
        </div>

        {/* Filters Panel */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <Filter size={14} color="var(--neutral-11)" />
            <span style={styles.cardTitle}>מסנני תחקור</span>
          </div>
          <div style={styles.filtersGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>גזרה</label>
              <select
                value={filters.sector}
                onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
                style={styles.select}
              >
                <option value="ALL">כל הגזרות</option>
                <option value="מטולה">מטולה</option>
                <option value="הרכס">הרכס</option>
                <option value="אביבים">אביבים</option>
                <option value="בופור">בופור</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>כוח</label>
              <select
                value={filters.force}
                onChange={(e) => setFilters(prev => ({ ...prev, force: e.target.value }))}
                style={styles.select}
              >
                <option value="ALL">כל הכוחות</option>
                <option value="גדוד 51">גדוד 51</option>
                <option value="צוות גדסר">צוות גדסר</option>
                <option value="כוח אשד">כוח אשד</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>רחפן</label>
              <select
                value={filters.drone}
                onChange={(e) => setFilters(prev => ({ ...prev, drone: e.target.value }))}
                style={styles.select}
              >
                <option value="ALL">כל הדגמים</option>
                <option value="DJI Matrice 300">DJI Matrice 300</option>
                <option value="Mavic 3 Enterprise">Mavic 3 Enterprise</option>
                <option value="Skydio X2D">Skydio X2D</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>משימה</label>
              <select
                value={filters.mission}
                onChange={(e) => setFilters(prev => ({ ...prev, mission: e.target.value }))}
                style={styles.select}
              >
                <option value="ALL">כל המשימות</option>
                <option value="סריקת ציר">סריקת ציר</option>
                <option value="תצפית בופור">תצפית בופור</option>
                <option value="מיפוי טקטי">מיפוי טקטי</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflowY: "auto", paddingLeft: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--neutral-11)", marginTop: "4px" }}>יומן אירועים לתחקור ({filteredEvents.length})</span>
          {filteredEvents.length === 0 ? (
            <div style={styles.emptyCard}>אין אירועים העונים על תנאי הסינון</div>
          ) : (
            filteredEvents.map(ev => {
              const isActive = selectedEvent.id === ev.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  style={{
                    ...styles.eventCard,
                    backgroundColor: isActive ? "rgba(24, 110, 255, 0.08)" : "var(--neutral-4)",
                    borderRight: `3px solid ${isActive ? "var(--blue-9)" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: isActive ? "0 4px 12px rgba(24, 110, 255, 0.15)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>{ev.title}</span>
                    <span style={{ fontSize: "10px", color: "var(--neutral-11)" }}>{ev.createdAt}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                    <span style={styles.miniBadge}>{ev.sector}</span>
                    <span style={styles.miniBadge}>{ev.force}</span>
                    <span style={styles.miniBadge}>{ev.drone}</span>
                    <span style={styles.miniBadge}>{ev.mission}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cargo Uploader Section */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <UploadCloud size={14} color="var(--blue-9)" />
            <span style={styles.cardTitle}>העלאת קבצים מקארגו (Cargo)</span>
          </div>
          
          <div style={styles.dropzone}>
            <input
              type="file"
              id="cargo-file-input"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <label htmlFor="cargo-file-input" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <UploadCloud size={24} color="var(--neutral-11)" />
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#fff" }}>גרור קבצי תחקיר או לחץ לבחירה</span>
              <span style={{ fontSize: "10px", color: "var(--neutral-11)" }}>תומך ביומני KML, לוגים וצילומי וידאו מהשטח</span>
            </label>
          </div>

          <div style={styles.fileList}>
            {cargoFiles.map((file, idx) => (
              <div key={idx} style={styles.fileCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileText size={12} color="var(--neutral-11)" />
                    <span style={{ fontSize: "11px", fontWeight: "bold", color: "#fff" }}>{file.name}</span>
                  </div>
                  <span style={{ fontSize: "9px", color: "var(--neutral-11)" }}>{file.size}</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", width: "100%" }}>
                  {file.status === "CROSS_REFERENCED" ? (
                    <span style={styles.successBadge}>✓ מוצלב בטלמטריית {file.associatedEventId}</span>
                  ) : (
                    <>
                      <span style={styles.pendingBadge}>ממתין להצלבה</span>
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() => setShowAssociateDropdown(showAssociateDropdown === idx ? null : idx)}
                          style={styles.associateBtn}
                        >
                          שייך לאירוע ▾
                        </button>
                        {showAssociateDropdown === idx && (
                          <div style={styles.associateDropdown}>
                            {events.map(ev => (
                              <div
                                key={ev.id}
                                onClick={() => associateFile(idx, ev.id)}
                                style={styles.dropdownItem}
                              >
                                {ev.id}: {ev.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Left Column: Map Replay & AI LLM Debriefing Engine */}
      <div style={styles.leftColumn}>
        {/* Map Replay Box */}
        <div style={styles.mapContainerWrapper}>
          <div style={styles.mapOverlayHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Compass size={14} color="var(--blue-9)" className="radar-sweep" />
              <span style={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}>שחזור נתיב מרחבי ואירועים</span>
            </div>
            
            {/* Map Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "11px", color: "#fff" }}>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                מפת חום
              </label>
              <span style={{ fontSize: "11px", backgroundColor: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px", color: "var(--neutral-12)" }}>
                אירוע פעיל: {selectedEvent.id}
              </span>
            </div>
          </div>

          <div style={{ width: "100%", height: "100%", zIndex: 1 }}>
            <MapContainer
              center={mapCenter}
              zoom={14}
              scrollWheelZoom={true}
              style={{ width: "100%", height: "100%" }}
            >
              <ChangeMapView center={mapCenter} />
              <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />

              {/* Heatmap overlay circles */}
              {showHeatmap && selectedEvent.path.map((pt, idx) => (
                <React.Fragment key={`heat-${idx}`}>
                  {/* Outer glow circle */}
                  <Circle
                    center={pt}
                    radius={160}
                    pathOptions={{
                      color: "transparent",
                      fillColor: "red",
                      fillOpacity: 0.04
                    }}
                  />
                  {/* Mid heat circle */}
                  <Circle
                    center={pt}
                    radius={100}
                    pathOptions={{
                      color: "transparent",
                      fillColor: "orange",
                      fillOpacity: 0.08
                    }}
                  />
                  {/* Core hot circle */}
                  <Circle
                    center={pt}
                    radius={50}
                    pathOptions={{
                      color: "transparent",
                      fillColor: "yellow",
                      fillOpacity: 0.15
                    }}
                  />
                </React.Fragment>
              ))}

              {/* Event path polyline */}
              <Polyline
                positions={selectedEvent.path}
                pathOptions={{
                  color: selectedEvent.color,
                  weight: 3,
                  dashArray: "6, 6"
                }}
              />

              {/* Render path coordinates markers */}
              {selectedEvent.path.map((pt, idx) => (
                <Circle
                  key={`pt-${idx}`}
                  center={pt}
                  radius={12}
                  pathOptions={{
                    color: selectedEvent.color,
                    fillColor: "#fff",
                    fillOpacity: 0.8,
                    weight: 2
                  }}
                >
                  <Tooltip direction="top" opacity={0.9}>
                    <div style={{ direction: "rtl", fontSize: "10px" }}>
                      נקודת דרך {idx + 1}<br/>
                      גובה: {selectedEvent.telemetry[Math.min(idx, selectedEvent.telemetry.length - 1)].altitude} מ'
                    </div>
                  </Tooltip>
                </Circle>
              ))}

              {/* Replay drone marker */}
              {selectedEvent.path.length > 0 && (
                <Marker
                  position={selectedEvent.path[playbackIndex]}
                  icon={L.divIcon({
                    className: "replaying-drone-marker",
                    html: `
                      <div style="
                        background-color: var(--blue-9);
                        border: 2px solid #fff;
                        width: 26px;
                        height: 26px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 0 10px var(--blue-9);
                        animation: friendly-pulse 1s infinite;
                      ">
                        🛸
                      </div>
                    `,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13]
                  })}
                >
                  <Tooltip permanent direction="top" offset={[0, -10]}>
                    <div style={{ direction: "rtl", fontSize: "10px", fontWeight: "bold" }}>
                      {selectedEvent.drone} (שיחזור)<br/>
                      מצב: {selectedEvent.telemetry[Math.min(playbackIndex, selectedEvent.telemetry.length - 1)].status}
                    </div>
                  </Tooltip>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Timeline Playback Control Bar */}
          <div style={styles.playbackBar}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={styles.playBtn}
            >
              {isPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
            </button>
            
            <button
              onClick={() => setPlaybackIndex(0)}
              style={styles.replayResetBtn}
              title="אפס ציר זמן"
            >
              <RotateCcw size={13} color="var(--neutral-11)" />
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "0 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--neutral-11)" }}>
                <span>זמן נוכחי: {selectedEvent.telemetry[Math.min(playbackIndex, selectedEvent.telemetry.length - 1)].time}</span>
                <span>מדד סיגנל: 100%</span>
              </div>
              <input
                type="range"
                min={0}
                max={selectedEvent.path.length - 1}
                value={playbackIndex}
                onChange={(e) => setPlaybackIndex(parseInt(e.target.value))}
                style={styles.slider}
              />
            </div>

            {/* Playback speed buttons */}
            <div style={{ display: "flex", gap: "3px" }}>
              {[1, 2, 4].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaySpeed(speed as any)}
                  style={{
                    ...styles.speedBtn,
                    backgroundColor: playSpeed === speed ? "var(--blue-9)" : "var(--neutral-5)",
                    color: playSpeed === speed ? "#fff" : "var(--neutral-11)"
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Active playback telemetry stats */}
            <div style={styles.telemetryStats}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>גובה</span>
                <span style={styles.statValue}>{selectedEvent.telemetry[Math.min(playbackIndex, selectedEvent.telemetry.length - 1)].altitude} מ'</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>סוללה</span>
                <span style={styles.statValue}>{selectedEvent.telemetry[Math.min(playbackIndex, selectedEvent.telemetry.length - 1)].battery}%</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>תדר קשר</span>
                <span style={styles.statValue}>{selectedEvent.telemetry[Math.min(playbackIndex, selectedEvent.telemetry.length - 1)].frequency} GHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI LLM Debriefing Engine Wrapper */}
        <div style={styles.aiEngineSection}>
          <div style={styles.aiLayoutGrid}>
            
            {/* AI Report Output */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1.2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={16} color="#c084fc" />
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#e9d5ff" }}>מנוע ניתוח תחקיר מרחבי AI</span>
                </div>
                {!aiReport && !isGeneratingAi && (
                  <button
                    onClick={generateAiReport}
                    style={styles.generateAiBtn}
                  >
                    <Sparkles size={12} style={{ marginLeft: "4px" }} />
                    הפק תחקיר AI
                  </button>
                )}
              </div>

              {isGeneratingAi && (
                <div style={styles.aiLoadingContainer}>
                  <div style={styles.spinner} />
                  <span style={{ fontSize: "12px", color: "#e9d5ff", fontWeight: "bold", marginTop: "10px" }}>
                    {aiStep === 1 && "מנתח נתוני טיסה וגובה..."}
                    {aiStep === 2 && "מצליב נתוני תדרי קשר וחסימות ל''א..."}
                    {aiStep === 3 && "מזהה מגמות וסתירות בנתוני מפעיל..."}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--neutral-11)" }}>זה עשוי לקחת מספר שניות</span>
                </div>
              )}

              {!isGeneratingAi && !aiReport && (
                <div style={styles.aiPlaceholder}>
                  <BookOpen size={28} color="var(--neutral-9)" style={{ marginBottom: "8px" }} />
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--neutral-12)" }}>ממתין להפקת תחקיר AI</span>
                  <p style={{ fontSize: "10px", color: "var(--neutral-11)", margin: "4px 0 0 0", textAlign: "center", maxWidth: "260px" }}>
                    לחץ על כפתור ההפקה כדי לבצע הצלבה אוטומטית של נתוני קארגו, נתוני מכ''ם וזיהוי סתירות קשר
                  </p>
                </div>
              )}

              {!isGeneratingAi && aiReport && (
                <div style={styles.aiReportContainer}>
                  
                  {/* Summary */}
                  <div style={styles.reportSection}>
                    <span style={styles.reportSectionTitle}>📝 סיכום האירוע</span>
                    <p style={styles.reportParagraph}>{aiReport.summary}</p>
                  </div>

                  {/* Trends */}
                  <div style={styles.reportSection}>
                    <span style={styles.reportSectionTitle}>📊 מגמות ואירועים חוזרים</span>
                    <p style={styles.reportParagraph}>{aiReport.trends}</p>
                  </div>

                  {/* Contradictions */}
                  <div style={styles.reportSection}>
                    <span style={styles.reportSectionTitle}>🔍 סתירות בנתונים המוצלבים</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {aiReport.contradictions.split("\n").map((line: string, i: number) => (
                        <div key={i} style={styles.contradictionLine}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lessons */}
                  <div style={styles.reportSection}>
                    <span style={styles.reportSectionTitle}>💡 לקחים מבצעיים והמלצות</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {aiReport.lessons.map((lesson: string, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "11px", color: "#fff" }}>
                          <span style={{ color: "#c084fc", fontWeight: "bold" }}>{i + 1}.</span>
                          <span style={{ lineHeight: "1.4" }}>{lesson}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* AI Interactive Chatbot */}
            <div style={styles.aiChatContainer}>
              <div style={styles.chatHeader}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#e9d5ff" }}>שאל את מנתח ה-AI</span>
              </div>

              {/* Message queue */}
              <div style={styles.chatMessageList}>
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.chatMessageBubble,
                      alignSelf: msg.sender === "USER" ? "flex-end" : "flex-start",
                      backgroundColor: msg.sender === "USER" ? "rgba(192, 132, 252, 0.15)" : "var(--neutral-5)",
                      border: msg.sender === "USER" ? "1px solid rgba(192, 132, 252, 0.3)" : "1px solid var(--neutral-6)"
                    }}
                  >
                    <span style={{ fontSize: "11px", lineHeight: "1.4" }}>{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Chat presets */}
              <div style={styles.chatPresets}>
                <button
                  onClick={() => submitChat("מה היו גורמי הסיכון בגזרה?")}
                  style={styles.presetBtn}
                >
                  גורמי סיכון
                </button>
                <button
                  onClick={() => submitChat("האם יש סתירה בנתוני מפעיל?")}
                  style={styles.presetBtn}
                >
                  סתירות נתונים
                </button>
                <button
                  onClick={() => submitChat("אילו המלצות מבצעיות תתקבלנה?")}
                  style={styles.presetBtn}
                >
                  המלצות טיסה
                </button>
              </div>

              {/* Input field */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitChat(chatInput);
                }}
                style={styles.chatInputRow}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="הקלד שאלה מבצעית על האירוע..."
                  style={styles.chatInput}
                />
                <button type="submit" style={styles.chatSendBtn}>
                  <Send size={12} color="#fff" />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
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
    fontFamily: "var(--font-family)"
  },
  rightColumn: {
    width: "380px",
    backgroundColor: "var(--color-bg-card)",
    borderLeft: "1px solid var(--color-border)",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
    boxSizing: "border-box"
  },
  leftColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "16px",
    gap: "12px",
    boxSizing: "border-box",
    overflowY: "auto",
    height: "100%"
  },
  header: {
    borderBottom: "1px solid var(--color-border)",
    paddingBottom: "10px",
    marginBottom: "4px"
  },
  title: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "var(--color-text)",
    margin: 0
  },
  subtext: {
    fontSize: "11px",
    color: "var(--neutral-11)",
    marginTop: "2px",
    display: "block"
  },
  glassCard: {
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "var(--shadow-sm)"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: "6px"
  },
  cardTitle: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "var(--neutral-12)"
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  filterLabel: {
    fontSize: "10px",
    color: "var(--neutral-11)",
    fontWeight: "bold"
  },
  select: {
    backgroundColor: "var(--neutral-4)",
    border: "1px solid var(--neutral-6)",
    borderRadius: "4px",
    padding: "6px 8px",
    color: "#fff",
    fontSize: "11px",
    outline: "none",
    cursor: "pointer"
  },
  eventCard: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid var(--color-border)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  miniBadge: {
    fontSize: "9px",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#ccc",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  emptyCard: {
    padding: "20px",
    textAlign: "center",
    fontSize: "11px",
    color: "var(--neutral-11)",
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px"
  },
  dropzone: {
    border: "2px dashed var(--neutral-7)",
    borderRadius: "6px",
    padding: "16px",
    textAlign: "center",
    backgroundColor: "var(--neutral-4)",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  },
  fileList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "4px"
  },
  fileCard: {
    backgroundColor: "var(--neutral-4)",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  },
  successBadge: {
    fontSize: "10px",
    color: "var(--green-11)",
    backgroundColor: "var(--green-3)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "bold"
  },
  pendingBadge: {
    fontSize: "10px",
    color: "var(--yellow-11)",
    backgroundColor: "var(--yellow-3)",
    padding: "2px 6px",
    borderRadius: "4px"
  },
  associateBtn: {
    backgroundColor: "var(--blue-9)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer"
  },
  associateDropdown: {
    position: "absolute",
    bottom: "20px",
    left: "0",
    backgroundColor: "var(--neutral-4)",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    zIndex: 100,
    width: "180px",
    maxHeight: "120px",
    overflowY: "auto"
  },
  dropdownItem: {
    padding: "6px 10px",
    fontSize: "10px",
    color: "#fff",
    cursor: "pointer",
    textAlign: "right",
    transition: "background-color 0.2s"
  },
  mapContainerWrapper: {
    height: "350px",
    width: "100%",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    overflow: "hidden",
    position: "relative",
    boxShadow: "var(--shadow-md)"
  },
  mapOverlayHeader: {
    position: "absolute",
    top: "10px",
    left: "10px",
    right: "10px",
    zIndex: 10,
    backgroundColor: "rgba(20, 21, 26, 0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "6px 12px",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backdropFilter: "blur(6px)"
  },
  playbackBar: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    right: "10px",
    zIndex: 10,
    backgroundColor: "rgba(20, 21, 26, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "8px 12px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backdropFilter: "blur(8px)"
  },
  playBtn: {
    backgroundColor: "var(--blue-9)",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(24, 110, 255, 0.3)"
  },
  replayResetBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  slider: {
    width: "100%",
    accentColor: "var(--blue-9)",
    cursor: "pointer"
  },
  speedBtn: {
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  telemetryStats: {
    display: "flex",
    gap: "8px",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    paddingRight: "10px",
    marginLeft: "4px"
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.05)"
  },
  statLabel: {
    fontSize: "8px",
    color: "var(--neutral-11)",
    textTransform: "uppercase"
  },
  statValue: {
    fontSize: "10px",
    fontWeight: "bold",
    color: "#fff"
  },
  aiEngineSection: {
    backgroundColor: "var(--neutral-3)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    padding: "16px",
    flex: 1,
    minHeight: "260px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "var(--shadow-md)",
    boxSizing: "border-box"
  },
  aiLayoutGrid: {
    display: "flex",
    gap: "16px",
    flex: 1,
    height: "100%"
  },
  generateAiBtn: {
    backgroundColor: "#a855f7",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(168, 85, 247, 0.3)",
    transition: "background-color 0.2s"
  },
  aiPlaceholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px dashed rgba(255,255,255,0.08)",
    borderRadius: "6px",
    padding: "20px"
  },
  aiLoadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "6px",
    padding: "20px"
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid rgba(168, 85, 247, 0.2)",
    borderTop: "3px solid #c084fc",
    borderRadius: "50%",
    animation: "radar-spin 1s linear infinite"
  },
  aiReportContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    paddingLeft: "4px"
  },
  reportSection: {
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "6px",
    padding: "10px 12px"
  },
  reportSectionTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#e9d5ff",
    display: "block",
    marginBottom: "4px"
  },
  reportParagraph: {
    fontSize: "11px",
    color: "#e0e0e0",
    margin: 0,
    lineHeight: "1.5"
  },
  contradictionLine: {
    fontSize: "11px",
    color: "#fca5a5",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderRight: "2px solid #ef4444",
    padding: "4px 8px",
    borderRadius: "4px",
    lineHeight: "1.4"
  },
  aiChatContainer: {
    flex: 0.8,
    backgroundColor: "rgba(255,255,255,0.01)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden"
  },
  chatHeader: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: "8px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)"
  },
  chatMessageList: {
    flex: 1,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    overflowY: "auto"
  },
  chatMessageBubble: {
    maxWidth: "85%",
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
  },
  chatPresets: {
    display: "flex",
    gap: "4px",
    padding: "4px 8px",
    borderTop: "1px solid rgba(255,255,255,0.04)"
  },
  presetBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ccc",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "9px",
    cursor: "pointer",
    transition: "background-color 0.2s"
  },
  chatInputRow: {
    display: "flex",
    borderTop: "1px solid rgba(255,255,255,0.06)"
  },
  chatInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    padding: "8px 12px",
    fontSize: "11px",
    color: "#fff",
    outline: "none"
  },
  chatSendBtn: {
    backgroundColor: "#a855f7",
    border: "none",
    width: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  toast: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "6px",
    backgroundColor: "rgba(20, 21, 26, 0.96)",
    border: "1px solid var(--green-6)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "bold",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    direction: "rtl"
  }
};
