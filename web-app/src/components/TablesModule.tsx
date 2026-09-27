import React, { useMemo, useRef, useState } from "react";
import { LayoutGrid, MessageSquare, MapPinned, RefreshCw, Columns2, Rows2, X, Search, ArrowUpDown, Shield, Map as MapIcon, Table2, PanelRight } from "lucide-react";
import { TABLES, LAYER_LABELS, type MapLayerKey, type TableDef, type TableKind } from "../data/tableFeeds";

// ── Model ───────────────────────────────────────────────────────────────────
// A "table" is a schema (columns) + rows. `kind` drives the tag chips on the card,
// so different table types (geo / equipment / ops) are visually distinguishable.

const KIND_META: Record<TableKind, { label: string; Icon: typeof Shield }> = {
  GEO: { label: "גיאוגרפית", Icon: MapIcon },
  EQUIPMENT: { label: "אמצעים", Icon: Shield },
  OPS: { label: "מבצעית", Icon: Table2 },
};

// ── Gallery ─────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100%", direction: "rtl", background: "var(--color-bg)", color: "var(--color-text)" },
  bar: { display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", flexShrink: 0 },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", fontSize: 12, borderRadius: 6, border: "1px solid var(--color-border-strong)", background: "var(--neutral-4)", color: "var(--color-text)", cursor: "pointer" },
  btnActive: { background: "var(--blue-7)", borderColor: "var(--blue-9)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, padding: 20, overflow: "auto", alignContent: "start" },
  card: { position: "relative", display: "flex", flexDirection: "column", gap: 8, padding: 16, borderRadius: 12, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", cursor: "pointer", textAlign: "right", color: "inherit", font: "inherit" },
  chip: { display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, borderRadius: 4, background: "var(--neutral-6)", color: "var(--neutral-white)" },
  muted: { fontSize: 11, color: "var(--neutral-11)" },
};

const Card: React.FC<{
  t: TableDef; openIndex: number; canSplit: boolean;
  onOpen: () => void; onOpenSide: () => void;
}> = ({ t, openIndex, canSplit, onOpen, onOpenSide }) => {
  const { Icon } = KIND_META[t.kind];
  return (
    <div
      role="button" tabIndex={0} style={{ ...S.card, borderColor: openIndex >= 0 ? "var(--blue-9)" : "var(--color-border)" }}
      onClick={(e) => (e.shiftKey && canSplit ? onOpenSide() : onOpen())}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LayoutGrid size={22} color="var(--neutral-12)" />
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{t.title}</span>
        <span style={S.muted}>{t.number}</span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {t.tags.map((tag) => <span key={tag} style={S.chip}>{tag}</span>)}
        <span style={{ ...S.chip, background: "var(--neutral-5)" }}><Icon size={11} />{KIND_META[t.kind].label}</span>
      </div>
      {t.description && <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t.description}</div>}
      <div style={{ ...S.muted, borderTop: "1px solid var(--color-border-subtle)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        <span>נוצר על ידי {t.owner}</span>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          <RefreshCw size={10} />מוזן מ: {t.source.system} · סנכרון {t.source.syncedAt}
        </span>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          <MapPinned size={10} />מוצג במפה: {LAYER_LABELS[t.layer]}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ ...S.muted, display: "inline-flex", gap: 4, alignItems: "center" }}>
          <MessageSquare size={12} />{t.comments}
        </span>
        <span style={{ flex: 1 }} />
        {canSplit && (
          <button
            type="button" style={S.btn} title="פתח במקביל לטבלה הפתוחה (Shift+לחיצה)"
            onClick={(e) => { e.stopPropagation(); onOpenSide(); }}
          >
            <PanelRight size={13} />פתח במקביל
          </button>
        )}
      </div>
      {openIndex >= 0 && <span style={{ ...S.chip, position: "absolute", top: -8, left: 12, background: "var(--blue-8)" }}>פתוחה</span>}
    </div>
  );
};

// ── Table viewer ────────────────────────────────────────────────────────────

const TableView: React.FC<{ t: TableDef; onClose: () => void; onShowOnMap?: (layer: MapLayerKey) => void }> = ({ t, onClose, onShowOnMap }) => {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle
      ? t.rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(needle)))
      : t.rows;
    if (sort) {
      out = [...out].sort((a, b) => {
        const [x, y] = [a[sort.key], b[sort.key]];
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "he", { numeric: true })) * sort.dir;
      });
    }
    return out;
  }, [t, q, sort]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0, minHeight: 0, background: "var(--color-bg-card)" }}>
      <div style={{ ...S.bar, padding: "6px 12px" }}>
        <LayoutGrid size={16} />
        <strong style={{ fontSize: 13 }}>{t.title}</strong>
        <span style={S.muted}>{t.number} · {rows.length}/{t.rows.length} שורות</span>
        <span style={{ flex: 1 }} />
        <div style={{ ...S.btn, cursor: "text" }}>
          <Search size={12} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש…"
            style={{ background: "transparent", border: "none", outline: "none", color: "inherit", width: 100, fontSize: 12 }}
          />
        </div>
        {onShowOnMap && (
          <button type="button" style={S.btn} onClick={() => onShowOnMap(t.layer)} title={`הצג את הטבלה כשכבה: ${LAYER_LABELS[t.layer]}`}>
            <MapPinned size={13} />הצג על המפה
          </button>
        )}
        <button type="button" style={S.btn} onClick={onClose} title="סגור טבלה"><X size={13} /></button>
      </div>
      <div style={{ overflow: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {t.columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}
                  style={{ position: "sticky", top: 0, background: "var(--neutral-5)", padding: "8px 10px", textAlign: "right", cursor: "pointer", whiteSpace: "nowrap", borderBottom: "1px solid var(--color-border)" }}
                >
                  {c.label}{" "}
                  <ArrowUpDown size={10} style={{ opacity: sort?.key === c.key ? 1 : 0.3 }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 ? "var(--neutral-3)" : "transparent" }}>
                {t.columns.map((c) => (
                  <td key={c.key} style={{ padding: "6px 10px", borderBottom: "1px solid var(--color-border-subtle)", whiteSpace: "nowrap" }}>{r[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Module ──────────────────────────────────────────────────────────────────

const MAX_OPEN = 2;

export const TablesModule: React.FC<{ onShowOnMap?: (layer: MapLayerKey) => void }> = ({ onShowOnMap }) => {
  const [view, setView] = useState<"GALLERY" | "WORKSPACE">("GALLERY");
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [orientation, setOrientation] = useState<"ROW" | "COLUMN">("ROW");
  const [ratio, setRatio] = useState(0.5);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const open = (id: string) => { setOpenIds([id]); setView("WORKSPACE"); };
  const openSide = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev.slice(0, MAX_OPEN - 1), id]));
    setView("WORKSPACE");
  };
  const close = (id: string) => {
    setOpenIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (next.length === 0) setView("GALLERY");
      return next;
    });
  };

  const startDrag = (e: React.PointerEvent) => {
    const el = workspaceRef.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // Layout is RTL: first pane sits on the right, so measure from the right edge.
      const frac = orientation === "ROW" ? (r.right - ev.clientX) / r.width : (ev.clientY - r.top) / r.height;
      setRatio(Math.min(0.8, Math.max(0.2, frac)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const openTables = openIds.map((id) => TABLES.find((t) => t.id === id)!).filter(Boolean);

  return (
    <div style={S.root}>
      <div style={S.bar}>
        <strong style={{ fontSize: 14 }}>טבלאות</strong>
        <button type="button" style={{ ...S.btn, ...(view === "GALLERY" ? S.btnActive : {}) }} onClick={() => setView("GALLERY")}>
          <LayoutGrid size={13} />גלריה
        </button>
        <button
          type="button" disabled={openTables.length === 0}
          style={{ ...S.btn, ...(view === "WORKSPACE" ? S.btnActive : {}), opacity: openTables.length ? 1 : 0.4 }}
          onClick={() => setView("WORKSPACE")}
        >
          <Table2 size={13} />טבלאות פתוחות ({openTables.length})
        </button>
        <span style={{ flex: 1 }} />
        {view === "WORKSPACE" && openTables.length === MAX_OPEN && (
          <button type="button" style={S.btn} onClick={() => setOrientation((o) => (o === "ROW" ? "COLUMN" : "ROW"))}>
            {orientation === "ROW" ? <Rows2 size={13} /> : <Columns2 size={13} />}
            {orientation === "ROW" ? "פריסה אנכית" : "פריסה אופקית"}
          </button>
        )}
        {view === "GALLERY" && <span style={S.muted}>לחיצה פותחת טבלה · Shift+לחיצה או "פתח במקביל" פותחת שתיים זו לצד זו</span>}
      </div>

      {view === "GALLERY" ? (
        <div style={S.grid}>
          {TABLES.map((t) => (
            <Card
              key={t.id} t={t} openIndex={openIds.indexOf(t.id)} canSplit={openIds.length > 0 && !openIds.includes(t.id)}
              onOpen={() => open(t.id)} onOpenSide={() => openSide(t.id)}
            />
          ))}
        </div>
      ) : (
        <div
          ref={workspaceRef}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: orientation === "ROW" ? "row" : "column", padding: 8, gap: 0 }}
        >
          {openTables.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && (
                <div
                  onPointerDown={startDrag}
                  style={{
                    flex: "0 0 8px", background: "var(--neutral-6)", borderRadius: 4, margin: orientation === "ROW" ? "0 2px" : "2px 0",
                    cursor: orientation === "ROW" ? "col-resize" : "row-resize", touchAction: "none",
                  }}
                />
              )}
              <div style={{ flex: openTables.length === 1 ? 1 : i === 0 ? `${ratio} 1 0` : `${1 - ratio} 1 0`, minWidth: 0, minHeight: 0, border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
                <TableView t={t} onClose={() => close(t.id)} onShowOnMap={onShowOnMap} />
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
