import React, { useState } from "react";

// ── Data Types ──────────────────────────────────────────────────────────────

export type PilotLicense =
  | "רב-מטיס"         // Multi-rotor advanced
  | "מטיס מוסמך"      // Certified pilot
  | "מטיס מתלמד"      // Trainee
  | "מטיס FPV"        // FPV specialist
  | "מטיס לילה"       // Night-flight licensed
  | "מדריך";          // Instructor

export interface Pilot {
  id: string;
  name: string;
  rank: string;
  unit: string;
  license: PilotLicense;
  licenseExpiry: string;        // ISO date string
  certifiedModels: string[];    // drone models pilot is certified on
  totalFlightHours: number;
  isActive: boolean;            // currently on duty / flying
  currentDrone?: string;        // tailNumber of drone if flying
  phone?: string;
  lastFlight?: string;          // ISO date string
  notes?: string;
}

// ── Seed Data ───────────────────────────────────────────────────────────────

const INITIAL_PILOTS: Pilot[] = [
  {
    id: "p-001",
    name: "אלון כהן",
    rank: "סמ\"ר",
    unit: "גדוד 51",
    license: "רב-מטיס",
    licenseExpiry: "2026-12-31",
    certifiedModels: ["DJI Matrice 300", "DJI Mavic 3"],
    totalFlightHours: 312,
    isActive: true,
    currentDrone: "T-AL51",
    phone: "050-1111111",
    lastFlight: "2026-06-13",
  },
  {
    id: "p-002",
    name: "מיכל לוי",
    rank: "רב-סמל",
    unit: "גדוד 51",
    license: "מדריך",
    licenseExpiry: "2027-03-15",
    certifiedModels: ["DJI Matrice 300", "DJI Mavic 3", "Parrot Anafi"],
    totalFlightHours: 780,
    isActive: false,
    phone: "050-2222222",
    lastFlight: "2026-06-10",
  },
  {
    id: "p-003",
    name: "דניאל ברגמן",
    rank: "טוראי",
    unit: "גדוד 52",
    license: "מטיס מתלמד",
    licenseExpiry: "2026-09-01",
    certifiedModels: ["DJI Mavic 3"],
    totalFlightHours: 45,
    isActive: true,
    currentDrone: "T-DB52",
    phone: "050-3333333",
    lastFlight: "2026-06-13",
  },
  {
    id: "p-004",
    name: "אורית שמש",
    rank: "סגן",
    unit: "מטה חטיבה",
    license: "מטיס לילה",
    licenseExpiry: "2026-11-20",
    certifiedModels: ["DJI Matrice 300", "Autel EVO II"],
    totalFlightHours: 210,
    isActive: false,
    phone: "050-4444444",
    lastFlight: "2026-06-08",
  },
  {
    id: "p-005",
    name: "יונתן פרץ",
    rank: "רב-סמל",
    unit: "גדוד 53",
    license: "מטיס FPV",
    licenseExpiry: "2026-08-30",
    certifiedModels: ["FPV Racing Drone", "DJI FPV"],
    totalFlightHours: 130,
    isActive: true,
    currentDrone: "T-YP53",
    phone: "050-5555555",
    lastFlight: "2026-06-13",
  },
  {
    id: "p-006",
    name: "שירה גולן",
    rank: "סמל",
    unit: "גדוד 52",
    license: "מטיס מוסמך",
    licenseExpiry: "2027-01-10",
    certifiedModels: ["DJI Mavic 3", "Parrot Anafi"],
    totalFlightHours: 88,
    isActive: false,
    phone: "050-6666666",
    lastFlight: "2026-06-11",
    notes: "בחופשה עד 20.06",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const LICENSE_COLORS: Record<PilotLicense, { bg: string; color: string; border: string }> = {
  "מדריך":        { bg: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "rgba(139,92,246,0.35)" },
  "רב-מטיס":      { bg: "rgba(48,164,108,0.15)", color: "#4ade80", border: "rgba(48,164,108,0.35)" },
  "מטיס מוסמך":   { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.35)" },
  "מטיס לילה":    { bg: "rgba(30,58,138,0.2)",   color: "#93c5fd", border: "rgba(30,58,138,0.4)"  },
  "מטיס FPV":     { bg: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "rgba(245,158,11,0.35)" },
  "מטיס מתלמד":   { bg: "rgba(108,118,141,0.15)",color: "#94a3b8", border: "rgba(108,118,141,0.3)" },
};

const isExpiringSoon = (dateStr: string) => {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < 60;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ── Modal ────────────────────────────────────────────────────────────────────

interface PilotModalProps {
  pilot: Pilot | null;
  mode: "view" | "edit" | "add";
  onClose: () => void;
  onSave: (p: Pilot) => void;
}

const ALL_LICENSES: PilotLicense[] = [
  "מדריך", "רב-מטיס", "מטיס מוסמך", "מטיס לילה", "מטיס FPV", "מטיס מתלמד",
];

const BLANK_PILOT: Pilot = {
  id: "",
  name: "",
  rank: "",
  unit: "",
  license: "מטיס מוסמך",
  licenseExpiry: "",
  certifiedModels: [],
  totalFlightHours: 0,
  isActive: false,
};

const PilotModal: React.FC<PilotModalProps> = ({ pilot, mode, onClose, onSave }) => {
  const [form, setForm] = useState<Pilot>(pilot ?? { ...BLANK_PILOT, id: `p-${Date.now()}` });
  const [modelsInput, setModelsInput] = useState(form.certifiedModels.join(", "));
  const editable = mode === "edit" || mode === "add";

  const handleSave = () => {
    const updated: Pilot = {
      ...form,
      certifiedModels: modelsInput.split(",").map((s) => s.trim()).filter(Boolean),
    };
    onSave(updated);
  };

  const f = (field: keyof Pilot, val: any) => setForm((prev) => ({ ...prev, [field]: val }));

  return (
    <div style={mStyles.overlay} onClick={onClose}>
      <div style={mStyles.card} onClick={(e) => e.stopPropagation()}>
        <div style={mStyles.header}>
          <span style={mStyles.title}>
            {mode === "add" ? "הוספת מטיס חדש" : mode === "edit" ? "עריכת פרטי מטיס" : "פרטי מטיס"}
          </span>
          <button style={mStyles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={mStyles.body}>
          {/* Row 1 */}
          <div style={mStyles.row}>
            <div style={mStyles.field}>
              <label style={mStyles.label}>שם מלא</label>
              {editable
                ? <input style={mStyles.input} value={form.name} onChange={(e) => f("name", e.target.value)} />
                : <span style={mStyles.value}>{form.name}</span>}
            </div>
            <div style={mStyles.field}>
              <label style={mStyles.label}>דרגה</label>
              {editable
                ? <input style={mStyles.input} value={form.rank} onChange={(e) => f("rank", e.target.value)} />
                : <span style={mStyles.value}>{form.rank}</span>}
            </div>
            <div style={mStyles.field}>
              <label style={mStyles.label}>יחידה</label>
              {editable
                ? <input style={mStyles.input} value={form.unit} onChange={(e) => f("unit", e.target.value)} />
                : <span style={mStyles.value}>{form.unit}</span>}
            </div>
          </div>

          {/* Row 2 */}
          <div style={mStyles.row}>
            <div style={mStyles.field}>
              <label style={mStyles.label}>רישיון</label>
              {editable
                ? (
                  <select style={mStyles.input} value={form.license} onChange={(e) => f("license", e.target.value as PilotLicense)}>
                    {ALL_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                )
                : <span style={mStyles.value}>{form.license}</span>}
            </div>
            <div style={mStyles.field}>
              <label style={mStyles.label}>תוקף רישיון</label>
              {editable
                ? <input style={mStyles.input} type="date" value={form.licenseExpiry} onChange={(e) => f("licenseExpiry", e.target.value)} />
                : <span style={{ ...mStyles.value, color: isExpiringSoon(form.licenseExpiry) ? "#fbbf24" : "inherit" }}>
                    {formatDate(form.licenseExpiry)}
                  </span>}
            </div>
            <div style={mStyles.field}>
              <label style={mStyles.label}>שעות טיסה</label>
              {editable
                ? <input style={mStyles.input} type="number" value={form.totalFlightHours} onChange={(e) => f("totalFlightHours", Number(e.target.value))} />
                : <span style={mStyles.value}>{form.totalFlightHours} ש'</span>}
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ ...mStyles.row, gridTemplateColumns: "1fr 1fr" }}>
            <div style={mStyles.field}>
              <label style={mStyles.label}>טלפון</label>
              {editable
                ? <input style={mStyles.input} value={form.phone ?? ""} onChange={(e) => f("phone", e.target.value)} />
                : <span style={mStyles.value}>{form.phone ?? "—"}</span>}
            </div>
            <div style={mStyles.field}>
              <label style={mStyles.label}>טיסה אחרונה</label>
              {editable
                ? <input style={mStyles.input} type="date" value={form.lastFlight ?? ""} onChange={(e) => f("lastFlight", e.target.value)} />
                : <span style={mStyles.value}>{formatDate(form.lastFlight)}</span>}
            </div>
          </div>

          {/* Certified models */}
          <div style={{ ...mStyles.row, gridTemplateColumns: "1fr" }}>
            <div style={mStyles.field}>
              <label style={mStyles.label}>כלים מורשים (מופרדים בפסיק)</label>
              {editable
                ? <input style={mStyles.input} value={modelsInput} onChange={(e) => setModelsInput(e.target.value)} placeholder="DJI Matrice 300, DJI Mavic 3" />
                : <span style={mStyles.value}>{form.certifiedModels.join(" · ") || "—"}</span>}
            </div>
          </div>

          {/* Notes */}
          <div style={{ ...mStyles.row, gridTemplateColumns: "1fr" }}>
            <div style={mStyles.field}>
              <label style={mStyles.label}>הערות</label>
              {editable
                ? <textarea style={{ ...mStyles.input, height: 60, resize: "vertical" }} value={form.notes ?? ""} onChange={(e) => f("notes", e.target.value)} />
                : <span style={mStyles.value}>{form.notes ?? "—"}</span>}
            </div>
          </div>

          {/* Active toggle */}
          {editable && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...mStyles.label, marginBottom: 0 }}>סטטוס פעיל</label>
              <button
                style={{
                  padding: "5px 16px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: 12,
                  backgroundColor: form.isActive ? "rgba(48,164,108,0.2)" : "rgba(108,118,141,0.2)",
                  color: form.isActive ? "#4ade80" : "#94a3b8",
                }}
                onClick={() => f("isActive", !form.isActive)}
              >
                {form.isActive ? "פעיל ✓" : "לא פעיל"}
              </button>
            </div>
          )}
        </div>

        {editable && (
          <div style={mStyles.footer}>
            <button style={mStyles.cancelBtn} onClick={onClose}>ביטול</button>
            <button style={mStyles.saveBtn} onClick={handleSave}>שמור</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface PilotsConsoleProps {
  flights?: any[];
}

export const PilotsConsole: React.FC<PilotsConsoleProps> = ({ flights = [] }) => {
  const [pilots, setPilots] = useState<Pilot[]>(INITIAL_PILOTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [licenseFilter, setLicenseFilter] = useState<PilotLicense | "ALL">("ALL");
  const [modal, setModal] = useState<{ pilot: Pilot | null; mode: "view" | "edit" | "add" } | null>(null);
  const [sortField, setSortField] = useState<keyof Pilot>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Sync active status from live flights
  const enrichedPilots = pilots.map((p) => {
    const flying = flights.find(
      (f) => f.operatorName?.includes(p.name) && f.status !== "COMPLETED" && f.status !== "LANDED"
    );
    return flying ? { ...p, isActive: true, currentDrone: flying.droneModel } : p;
  });

  const filtered = enrichedPilots
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.rank.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q) ||
        p.license.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "INACTIVE" && !p.isActive);
      const matchLicense = licenseFilter === "ALL" || p.license === licenseFilter;
      return matchSearch && matchStatus && matchLicense;
    })
    .sort((a, b) => {
      let av: any = a[sortField];
      let bv: any = b[sortField];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const stats = {
    total: enrichedPilots.length,
    active: enrichedPilots.filter((p) => p.isActive).length,
    expiringSoon: enrichedPilots.filter((p) => isExpiringSoon(p.licenseExpiry)).length,
    instructors: enrichedPilots.filter((p) => p.license === "מדריך").length,
  };

  const handleSort = (field: keyof Pilot) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleSave = (updated: Pilot) => {
    setPilots((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("האם למחוק את המטיס מהמאגר?"))
      setPilots((prev) => prev.filter((p) => p.id !== id));
  };

  const SortArrow = ({ field }: { field: keyof Pilot }) =>
    sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div style={styles.container}>
      {/* ── Stats Row ── */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>סה"כ מטיסים</span>
          <span style={styles.statValue}>{stats.total}</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statLabel, color: "#4ade80" }}>פעילים כעת</span>
          <span style={{ ...styles.statValue, color: "#4ade80" }}>{stats.active}</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statLabel, color: "#fbbf24" }}>רישיון פג עד 60 יום</span>
          <span style={{ ...styles.statValue, color: stats.expiringSoon > 0 ? "#fbbf24" : "var(--neutral-white)" }}>{stats.expiringSoon}</span>
        </div>
        <div style={styles.statCard}>
          <span style={{ ...styles.statLabel, color: "#a78bfa" }}>מדריכים</span>
          <span style={{ ...styles.statValue, color: "#a78bfa" }}>{stats.instructors}</span>
        </div>
      </div>

      {/* ── Control Bar ── */}
      <div style={styles.controlBar}>
        <input
          type="text"
          placeholder="חפש לפי שם, דרגה, יחידה או רישיון..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.filterGroup}>
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                ...styles.filterBtn,
                background: statusFilter === s ? "rgba(59,130,246,0.2)" : "var(--neutral-3)",
                borderColor: statusFilter === s ? "#3b82f6" : "var(--neutral-5)",
                color: statusFilter === s ? "#60a5fa" : "var(--neutral-12)",
              }}
            >
              {s === "ALL" ? "הכל" : s === "ACTIVE" ? "פעילים" : "לא פעילים"}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <select
            value={licenseFilter}
            onChange={(e) => setLicenseFilter(e.target.value as PilotLicense | "ALL")}
            style={styles.selectInput}
          >
            <option value="ALL">כל הרישיונות</option>
            {ALL_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <button style={styles.addBtn} onClick={() => setModal({ pilot: null, mode: "add" })}>
          + הוסף מטיס
        </button>
      </div>

      {/* ── Table ── */}
      <div style={styles.tableCard}>
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>לא נמצאו מטיסים תואמים לחיפוש / סינון שנבחרו.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    { label: "שם", field: "name" as keyof Pilot },
                    { label: "דרגה", field: "rank" as keyof Pilot },
                    { label: "יחידה", field: "unit" as keyof Pilot },
                    { label: "רישיון", field: "license" as keyof Pilot },
                    { label: "תוקף רישיון", field: "licenseExpiry" as keyof Pilot },
                    { label: "ש' טיסה", field: "totalFlightHours" as keyof Pilot },
                    { label: "כלים מורשים", field: null },
                    { label: "סטטוס", field: "isActive" as keyof Pilot },
                    { label: "פעולות", field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      style={{ ...styles.th, cursor: field ? "pointer" : "default" }}
                      onClick={() => field && handleSort(field)}
                    >
                      {label}{field && <SortArrow field={field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((pilot) => {
                  const lc = LICENSE_COLORS[pilot.license];
                  const expiring = isExpiringSoon(pilot.licenseExpiry);
                  return (
                    <tr key={pilot.id} style={styles.tr}>
                      {/* Name */}
                      <td style={{ ...styles.td, fontWeight: "bold", color: "var(--neutral-white)" }}>
                        {pilot.name}
                      </td>
                      {/* Rank */}
                      <td style={{ ...styles.td, color: "var(--neutral-12)", fontSize: 12 }}>
                        {pilot.rank}
                      </td>
                      {/* Unit */}
                      <td style={{ ...styles.td, color: "#60a5fa" }}>{pilot.unit}</td>
                      {/* License badge */}
                      <td style={styles.td}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: "bold",
                          padding: "3px 10px",
                          borderRadius: 10,
                          background: lc.bg,
                          color: lc.color,
                          border: `1px solid ${lc.border}`,
                          whiteSpace: "nowrap",
                        }}>
                          {pilot.license}
                        </span>
                      </td>
                      {/* Expiry */}
                      <td style={{ ...styles.td, color: expiring ? "#fbbf24" : "var(--neutral-12)", fontSize: 12 }}>
                        {formatDate(pilot.licenseExpiry)}
                        {expiring && <span style={{ marginRight: 4 }}>⚠</span>}
                      </td>
                      {/* Hours */}
                      <td style={{ ...styles.td, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {pilot.totalFlightHours}
                      </td>
                      {/* Models */}
                      <td style={{ ...styles.td, fontSize: 11, color: "var(--neutral-12)" }}>
                        {pilot.certifiedModels.join(" · ") || "—"}
                      </td>
                      {/* Status */}
                      <td style={styles.td}>
                        {pilot.isActive ? (
                          <span style={styles.activeBadge}>
                            <span style={styles.activeDot} /> פעיל {pilot.currentDrone ? `· ${pilot.currentDrone}` : ""}
                          </span>
                        ) : (
                          <span style={styles.inactiveBadge}>לא פעיל</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                          <button style={styles.actionBtn} onClick={() => setModal({ pilot, mode: "view" })}>
                            צפה
                          </button>
                          <button style={styles.editBtn} onClick={() => setModal({ pilot, mode: "edit" })}>
                            עריכה
                          </button>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(pilot.id)}>
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <PilotModal
          pilot={modal.pilot}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

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
    marginBottom: "18px",
  },
  statCard: {
    backgroundColor: "var(--neutral-2)",
    border: "1px solid var(--neutral-5)",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statLabel: { fontSize: "12px", color: "var(--neutral-12)", fontWeight: 500 },
  statValue: { fontSize: "26px", fontWeight: 700, color: "var(--neutral-white)" },
  controlBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "200px",
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
  filterGroup: { display: "flex", gap: "6px" },
  filterBtn: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  selectInput: {
    backgroundColor: "var(--neutral-2)",
    border: "1px solid var(--neutral-5)",
    borderRadius: "6px",
    padding: "8px 12px",
    color: "var(--neutral-white)",
    fontSize: "12px",
    cursor: "pointer",
    outline: "none",
    fontFamily: "var(--ds-font)",
  },
  addBtn: {
    backgroundColor: "rgba(59,130,246,0.2)",
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.4)",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  tableCard: {
    backgroundColor: "var(--neutral-2)",
    border: "1px solid var(--neutral-5)",
    borderRadius: "8px",
    padding: "15px",
  },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "right" },
  th: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--neutral-12)",
    borderBottom: "1px solid var(--neutral-6)",
    padding: "10px 12px",
    userSelect: "none",
  },
  tr: {
    borderBottom: "1px solid var(--neutral-6)",
    transition: "background-color 0.15s ease",
  } as any,
  td: { padding: "11px 12px", fontSize: "13px", color: "var(--neutral-white)", verticalAlign: "middle" },
  activeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: "bold",
    color: "#4ade80",
    backgroundColor: "rgba(48,164,108,0.12)",
    border: "1px solid rgba(48,164,108,0.3)",
    padding: "2px 8px",
    borderRadius: 10,
    whiteSpace: "nowrap",
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#4ade80",
    display: "inline-block",
    boxShadow: "0 0 5px #4ade80",
  },
  inactiveBadge: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94a3b8",
    backgroundColor: "rgba(108,118,141,0.12)",
    border: "1px solid rgba(108,118,141,0.25)",
    padding: "2px 8px",
    borderRadius: 10,
  },
  actionBtn: {
    backgroundColor: "rgba(59,130,246,0.15)",
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  editBtn: {
    backgroundColor: "rgba(139,92,246,0.15)",
    color: "#a78bfa",
    border: "1px solid rgba(139,92,246,0.3)",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "rgba(236,72,85,0.12)",
    color: "#f87171",
    border: "1px solid rgba(236,72,85,0.25)",
    borderRadius: "4px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  emptyState: { textAlign: "center", padding: "40px", color: "var(--neutral-11)", fontSize: "13px" },
};

const mStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#12151c",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    width: "min(680px, 95vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    direction: "rtl",
    fontFamily: "var(--ds-font)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: { fontSize: "16px", fontWeight: "bold", color: "var(--neutral-white)" },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--neutral-12)",
    cursor: "pointer",
    fontSize: "16px",
  },
  body: { padding: "22px", display: "flex", flexDirection: "column", gap: "16px" },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "11px", fontWeight: "bold", color: "var(--neutral-12)", marginBottom: "2px" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "6px",
    padding: "8px 12px",
    color: "var(--neutral-white)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "var(--ds-font)",
    width: "100%",
    boxSizing: "border-box",
  },
  value: { fontSize: "13px", color: "var(--neutral-white)", padding: "8px 0" },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "16px 22px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  cancelBtn: {
    padding: "8px 20px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "none",
    color: "var(--neutral-12)",
    cursor: "pointer",
    fontSize: "13px",
  },
  saveBtn: {
    padding: "8px 24px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(59,130,246,0.25)",
    color: "#60a5fa",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
};
