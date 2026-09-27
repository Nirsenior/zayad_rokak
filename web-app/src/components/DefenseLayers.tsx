import React from "react";
import { Marker, Polyline, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import {
  FENCE_STATUS_META, THREAT_COLORS, DIVISION_SYSTEM_META, DECOY_META,
  type LatLng, type FenceSegment, type FenceBreach, type InfiltrationRoute,
  type DivisionDefenseSystem, type DecoySystem,
} from "../data/defenseLayers";
import { TABLES, REVERSE, DATA_SOURCE, tableForLayer, type Row, type TableDef } from "../data/tableFeeds";

const tipStyle: React.CSSProperties = { direction: "rtl", fontSize: "11px", fontWeight: "bold" };
const srcLine = <><br /><span style={{ fontWeight: "normal", color: "#888", fontSize: 10 }}>מקור: {DATA_SOURCE}</span></>;
const subStyle: React.CSSProperties = { fontWeight: "normal", color: "#555" };

const svg = (glyph: string, color = "#fff", size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>`;

const badge = (inner: string, bg: string, opts: { dashed?: boolean; hollow?: boolean; shape?: "circle" | "square"; size?: number } = {}) => {
  const sz = opts.size ?? 24;
  return L.divIcon({
    className: "defense-layer-marker",
    html: `<div style="width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;
      border-radius:${opts.shape === "square" ? "4px" : "50%"};
      background:${opts.hollow ? "rgba(0,0,0,0.55)" : bg};
      border:1.5px ${opts.dashed ? "dashed" : "solid"} ${opts.hollow ? bg : "#fff"};
      box-shadow:0 1px 3px rgba(0,0,0,.5)">${inner}</div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
};

const scissorsGlyph =
  '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>';

/** Arrowhead at the end of a schematic route, rotated to the last leg's bearing. */
const arrowIcon = (from: LatLng, to: LatLng, color: string) => {
  const angle = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI; // 0° = north on screen after -90 shift below
  const rot = 90 - angle;
  return L.divIcon({
    className: "defense-layer-marker",
    html: `<div style="transform:rotate(${rot}deg);width:20px;height:20px">
      <svg viewBox="0 0 20 20" width="20" height="20"><path d="M10 1 18 18 10 14 2 18z" fill="${color}" stroke="#fff" stroke-width="1.2"/></svg></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const routeNumberIcon = (n: number, color: string) =>
  L.divIcon({
    className: "defense-layer-marker",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};color:#fff;border:1.5px solid #fff;
      font-size:10px;font-weight:bold;display:flex;align-items:center;justify-content:center">${n}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

// ── Table rows → layer shapes ───────────────────────────────────────────────
const num = (v: unknown) => Number(v);
const pos = (r: Row): LatLng => [num(r.lat), num(r.lng)];
const groupBy = (rows: Row[], key: string) => {
  const m = new Map<string, Row[]>();
  rows.forEach((r) => m.set(String(r[key]), [...(m.get(String(r[key])) ?? []), r]));
  m.forEach((g) => g.sort((a, b) => num(a.seq) - num(b.seq)));
  return m;
};

const fencesFrom = (rows: Row[]): { segments: FenceSegment[]; breaches: FenceBreach[] } => {
  const segments = [...groupBy(rows.filter((r) => r.breach !== "כן"), "segment")].map(([name, g]) => ({
    id: name, name, points: g.map(pos),
    status: REVERSE.fenceStatus[String(g[0].segmentStatus)] as FenceSegment["status"],
  }));
  const breaches = rows.filter((r) => r.breach === "כן").map((r, i) => ({
    id: `breach-${i}`, fenceId: String(r.segment), position: pos(r), detectedAt: String(r.detectedAt),
    status: REVERSE.fenceStatus[String(r.segmentStatus)] as FenceBreach["status"], note: String(r.note),
  }));
  return { segments, breaches };
};

const routesFrom = (rows: Row[]) =>
  [...groupBy(rows, "route")].map(([label, g]) => ({
    id: label, label, points: g.map(pos),
    threat: REVERSE.threat[String(g[0].threat)] as InfiltrationRoute["threat"],
    frequency: num(g[0].freq ?? g.length),
  }));

const divisionFrom = (rows: Row[]): DivisionDefenseSystem[] =>
  rows.map((r) => ({
    id: String(r.name), name: String(r.name), position: pos(r), rangeMeters: num(r.range),
    type: REVERSE.divisionType[String(r.type)] as DivisionDefenseSystem["type"],
    status: REVERSE.status[String(r.status)] as DivisionDefenseSystem["status"],
  }));

const decoysFrom = (rows: Row[]): DecoySystem[] =>
  rows.map((r) => ({
    id: String(r.name), name: String(r.name), position: pos(r), simulates: String(r.sim),
    type: REVERSE.decoyType[String(r.type)] as DecoySystem["type"],
    emissionRadiusMeters: num(r.radius), active: r.active === "כן",
  }));

interface Props {
  /** feed tables; defaults to the bundled mock feed */
  tables?: TableDef[];
  showFences: boolean;
  showRawRoutes: boolean;
  showSchematicRoutes: boolean;
  showDivisionSystems: boolean;
  showDecoys: boolean;
}

export const DefenseLayers: React.FC<Props> = ({
  tables = TABLES, showFences, showRawRoutes, showSchematicRoutes, showDivisionSystems, showDecoys,
}) => {
  const rowsOf = (l: Parameters<typeof tableForLayer>[0]) => tableForLayer(l, tables)?.rows ?? [];
  const { segments: FENCE_SEGMENTS, breaches: FENCE_BREACHES } = fencesFrom(rowsOf("fences"));
  const RAW_ROUTES = routesFrom(rowsOf("rawRoutes"));
  const SCHEMATIC_ROUTES = routesFrom(rowsOf("schematicRoutes"));
  const DIVISION_SYSTEMS = divisionFrom(rowsOf("divisionSystems"));
  const DECOY_SYSTEMS = decoysFrom(rowsOf("decoys"));
  return (
  <>
    {showFences && (
      <>
        {FENCE_SEGMENTS.map((f) => (
          <Polyline
            key={f.id}
            positions={f.points}
            pathOptions={{
              color: FENCE_STATUS_META[f.status].color,
              weight: 1.5,
              dashArray: f.status === "INTACT" ? undefined : "10, 6",
            }}
          >
            <Tooltip sticky direction="top">
              <div style={tipStyle}>{f.name}<br /><span style={subStyle}>{FENCE_STATUS_META[f.status].label}</span>{srcLine}</div>
            </Tooltip>
          </Polyline>
        ))}
        {FENCE_BREACHES.map((b) => (
          <Marker
            key={b.id}
            position={b.position}
            icon={badge(svg(scissorsGlyph, "#fff", 9), FENCE_STATUS_META[b.status].color, { size: 14 })}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div style={tipStyle}>
                חותכים — {FENCE_STATUS_META[b.status].label}<br />
                <span style={subStyle}>{b.note} · {b.detectedAt}</span>{srcLine}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </>
    )}

    {showRawRoutes &&
      RAW_ROUTES.map((r) => (
        <Polyline
          key={`raw-${r.id}`}
          positions={r.points}
          pathOptions={{ color: THREAT_COLORS[r.threat], weight: 1.2, opacity: 0.75 }}
        >
          <Tooltip sticky direction="top">
            <div style={tipStyle}>נתיב גולמי — {r.label}<br /><span style={subStyle}>{r.points.length} נקודות גילוי</span>{srcLine}</div>
          </Tooltip>
        </Polyline>
      ))}

    {showSchematicRoutes &&
      SCHEMATIC_ROUTES.map((r, i) => {
        const color = THREAT_COLORS[r.threat];
        const last = r.points[r.points.length - 1];
        const prev = r.points[r.points.length - 2];
        return (
          <React.Fragment key={`sch-${r.id}`}>
            <Polyline positions={r.points} pathOptions={{ color: "#000", weight: 7, opacity: 0.35 }} />
            <Polyline positions={r.points} pathOptions={{ color, weight: 4, opacity: 0.95 }}>
              <Tooltip sticky direction="top">
                <div style={tipStyle}>
                  {r.label}<br />
                  <span style={subStyle}>{r.frequency} חדירות ב-30 יום · רמת איום {r.threat === "HIGH" ? "גבוהה" : r.threat === "MEDIUM" ? "בינונית" : "נמוכה"}</span>{srcLine}
                </div>
              </Tooltip>
            </Polyline>
            <Marker position={r.points[0]} icon={routeNumberIcon(i + 1, color)} />
            <Marker position={last} icon={arrowIcon(prev, last, color)} interactive={false} />
          </React.Fragment>
        );
      })}

    {showDivisionSystems &&
      DIVISION_SYSTEMS.map((s) => {
        const meta = DIVISION_SYSTEM_META[s.type];
        return (
          <React.Fragment key={s.id}>
            {s.rangeMeters > 0 && (
              <Circle
                center={s.position}
                radius={s.rangeMeters}
                pathOptions={{ color: meta.color, fillColor: meta.color, fillOpacity: s.status === "ACTIVE" ? 0.07 : 0.03, weight: 1.2, dashArray: s.status === "ACTIVE" ? undefined : "4, 6" }}
              />
            )}
            <Marker position={s.position} icon={badge(svg(meta.glyph), meta.color, { shape: "square", dashed: s.status === "OFFLINE" })}>
              <Tooltip direction="top" offset={[0, -10]}>
                <div style={tipStyle}>
                  {s.name}<br />
                  <span style={subStyle}>
                    {meta.label} · {s.status === "ACTIVE" ? "פעיל" : s.status === "STANDBY" ? "המתנה" : "מושבת"}
                    {s.rangeMeters > 0 ? ` · טווח ${s.rangeMeters} מ׳` : ""}
                  </span>{srcLine}
                </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        );
      })}

    {showDecoys &&
      DECOY_SYSTEMS.map((d) => {
        const meta = DECOY_META[d.type];
        return (
          <React.Fragment key={d.id}>
            {d.emissionRadiusMeters > 0 && (
              <Circle
                center={d.position}
                radius={d.emissionRadiusMeters}
                pathOptions={{ color: "#bdc3c7", fillOpacity: 0.04, weight: 1, dashArray: "2, 6" }}
              />
            )}
            {/* Hollow + dashed = decoy; operators must tell it apart from a real system at a glance */}
            <Marker position={d.position} icon={badge(svg(meta.glyph, "#ecf0f1"), "#bdc3c7", { hollow: true, dashed: true })}>
              <Tooltip direction="top" offset={[0, -10]}>
                <div style={tipStyle}>
                  {d.name} (דמה)<br />
                  <span style={subStyle}>{meta.label} · מדמה: {d.simulates} · {d.active ? "פעיל" : "לא פעיל"}</span>{srcLine}
                </div>
              </Tooltip>
            </Marker>
          </React.Fragment>
        );
      })}
  </>
  );
};
