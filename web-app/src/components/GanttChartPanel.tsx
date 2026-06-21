import React, { useMemo, useRef, useEffect, useState } from 'react';
import { X, Clock, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

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
  conflicts: { type: string; description: string }[];
  notes: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CONFLICT";
}

interface ActiveFlight {
  id: string;
  droneModel: string;
  operatorName: string;
  unit: string;
  minAlt: number;
  maxAlt: number;
  currentAlt: number;
  battery: number;
  lastPingSeconds: number;
  status: "ACTIVE" | "COMMS_LOSS" | "ANOMALOUS" | "COMPLETED" | "LANDED";
}

interface Props {
  requests: FlightRequest[];
  flights: ActiveFlight[];
  onClose: () => void;
  onFocusLocation: (lat: number, lng: number) => void;
}

interface UnifiedGanttItem {
  id: string; // "flight-xxx" or "req-xxx"
  requestId: string; // "req-xxx"
  operatorName: string;
  unit: string;
  droneModel: string;
  timeWindow: string;
  status: "ACTIVE" | "COMMS_LOSS" | "ANOMALOUS" | "COMPLETED" | "LANDED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "CONFLICT";
  minAlt: number;
  maxAlt: number;
  currentAlt?: number;
  battery?: number;
}

export const GanttChartPanel: React.FC<Props> = ({ requests, flights, onClose, onFocusLocation }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [systemTime, setSystemTime] = useState<string>('');

  // 1. Parse unified items list
  const ganttItems = useMemo<UnifiedGanttItem[]>(() => {
    // Collect all requests
    const list: UnifiedGanttItem[] = requests.map(r => {
      // Find matching live flight
      const flightId = r.id.replace('req', 'flight');
      const activeFlight = flights.find(f => f.id === flightId);

      if (activeFlight) {
        return {
          id: activeFlight.id,
          requestId: r.id,
          operatorName: r.operatorName,
          unit: r.unit,
          droneModel: r.droneModel,
          timeWindow: r.timeWindow,
          status: activeFlight.status,
          minAlt: r.minAlt,
          maxAlt: r.maxAlt,
          currentAlt: activeFlight.currentAlt,
          battery: activeFlight.battery,
        };
      }

      return {
        id: r.id,
        requestId: r.id,
        operatorName: r.operatorName,
        unit: r.unit,
        droneModel: r.droneModel,
        timeWindow: r.timeWindow,
        status: r.status, // "PENDING_REVIEW", "APPROVED" (if not flying yet), "REJECTED"
        minAlt: r.minAlt,
        maxAlt: r.maxAlt,
      };
    });

    // Sort: flying/active first, then pending, then others
    const statusOrder: Record<string, number> = {
      ACTIVE: 0,
      ANOMALOUS: 1,
      COMMS_LOSS: 2,
      APPROVED: 3,
      PENDING_REVIEW: 4,
      LANDED: 5,
      COMPLETED: 6,
      REJECTED: 7,
    };

    return [...list].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
  }, [requests, flights]);

  // 2. Parse time string `"HH:MM - HH:MM"`
  const parseTimeWindow = (tw: string) => {
    const parts = tw.split('-').map(p => p.trim());
    if (parts.length !== 2) return null;
    const [startStr, endStr] = parts;
    const parseHM = (s: string) => {
      const hm = s.split(':').map(Number);
      if (hm.length !== 2 || isNaN(hm[0]) || isNaN(hm[1])) return null;
      return hm[0] * 60 + hm[1];
    };
    const startMin = parseHM(startStr);
    const endMin = parseHM(endStr);
    if (startMin === null || endMin === null) return null;
    return { startMin, endMin };
  };

  // 3. System time updates for red vertical timeline tracker
  useEffect(() => {
    // Extract static system hours/minutes from Header clock element if available, fallback to real Date()
    const updateTime = () => {
      const headerClock = document.querySelector('[style*="HeaderDateTime"]')?.textContent || '';
      const match = headerClock.match(/(\d{2}):(\d{2})/);
      if (match) {
        setSystemTime(`${match[1]}:${match[2]}`);
      } else {
        const d = new Date();
        setSystemTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentTimeOffset = useMemo(() => {
    if (!systemTime) return null;
    const parts = systemTime.split(':').map(Number);
    if (parts.length !== 2) return null;
    const minutes = parts[0] * 60 + parts[1];
    return (minutes / 1440) * 100;
  }, [systemTime]);

  // 4. Center timeline scroll to 12:00 on load
  useEffect(() => {
    if (timelineRef.current) {
      // scroll to 10:00 (10 * 50px = 500px) LTR direction
      timelineRef.current.scrollLeft = 450;
    }
  }, []);

  // 5. Stylings for Gantt bars
  const getGanttBarBackground = (status: UnifiedGanttItem['status']) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
      case 'PENDING_REVIEW':
        return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      case 'CONFLICT':
        return 'linear-gradient(90deg, #ea580c 0%, #c2410c 100%)';
      case 'COMMS_LOSS':
        return 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 10px, #b45309 10px, #b45309 20px)';
      case 'ANOMALOUS':
        return 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #b91c1c 10px, #b91c1c 20px)';
      case 'REJECTED':
        return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      case 'LANDED':
      case 'COMPLETED':
      default:
        return 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)';
    }
  };

  const getGanttBarBorder = (status: UnifiedGanttItem['status']) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return '#34d399';
      case 'PENDING_REVIEW':
        return '#fbbf24';
      case 'CONFLICT':
        return '#ff7a00';
      case 'COMMS_LOSS':
        return '#fbbf24';
      case 'ANOMALOUS':
      case 'REJECTED':
        return '#f87171';
      case 'LANDED':
      case 'COMPLETED':
      default:
        return '#9ca3af';
    }
  };

  const getGanttBarShadow = (status: UnifiedGanttItem['status']) => {
    if (status === 'ACTIVE' || status === 'APPROVED') return '0 0 8px rgba(16,185,129,0.4)';
    if (status === 'COMMS_LOSS' || status === 'ANOMALOUS') return '0 0 10px rgba(245,158,11,0.5)';
    return 'none';
  };

  const getStatusLabel = (status: UnifiedGanttItem['status']) => {
    switch (status) {
      case 'ACTIVE': return 'באוויר (פעיל)';
      case 'APPROVED': return 'מאושר';
      case 'PENDING_REVIEW': return 'ממתין לאישור';
      case 'CONFLICT': return 'קונפליקט';
      case 'COMMS_LOSS': return 'אובדן קשר';
      case 'ANOMALOUS': return 'אנומליה בגובה';
      case 'REJECTED': return 'נדחה';
      case 'COMPLETED': return 'הושלם';
      case 'LANDED': return 'נחת';
      default: return status;
    }
  };

  const getStatusIcon = (status: UnifiedGanttItem['status']) => {
    const size = 12;
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return <CheckCircle size={size} color="#10b981" />;
      case 'PENDING_REVIEW':
        return <Clock size={size} color="#f59e0b" />;
      case 'CONFLICT':
        return <AlertTriangle size={size} color="#ea580c" />;
      case 'COMMS_LOSS':
      case 'ANOMALOUS':
        return <AlertTriangle size={size} color="#f59e0b" className="pulse-alert" />;
      case 'REJECTED':
        return <AlertCircle size={size} color="#ef4444" />;
      default:
        return <Clock size={size} color="#9ca3af" />;
    }
  };

  const handleRowClick = (item: UnifiedGanttItem) => {
    // Focus map on this flight corridor center (approx coordinates based on known mock polygons)
    const pts = item.requestId === "req-8812"
      ? [[33.226, 35.560], [33.238, 35.560], [33.238, 35.572], [33.226, 35.572]]
      : item.requestId === "req-8813"
      ? [[33.215, 35.562], [33.238, 35.562], [33.238, 35.568], [33.215, 35.568]]
      : [[33.250, 35.570], [33.270, 35.570], [33.270, 35.585], [33.250, 35.585]]; // req-8814 (מרחב סיוע 4)
    
    // Average center
    const latSum = pts.reduce((sum, p) => sum + p[0], 0);
    const lngSum = pts.reduce((sum, p) => sum + p[1], 0);
    onFocusLocation(latSum / pts.length, lngSum / pts.length);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(20, 21, 26, 0.98)',
        borderTop: '1px solid rgba(87, 95, 112, 0.45)',
        boxShadow: '0 -4px 25px rgba(0,0,0,0.6)',
        boxSizing: 'border-box',
        zIndex: 1010,
        direction: 'rtl',
      }}
    >
      {/* 1. Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(87, 95, 112, 0.35)',
          background: 'rgba(15, 16, 20, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e6f5ff', display: 'flex', alignItems: 'center', gap: 6 }}>
            📅 לוח גאנט הטסות יומי
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a0a5b0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(#10b981, #059669)', border: '1px solid #34d399' }} />
              <span>פעיל / מאושר</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a0a5b0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(#f59e0b, #d97706)', border: '1px solid #fbbf24' }} />
              <span>ממתין לאישור</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a0a5b0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 2px, #b45309 2px, #b45309 4px)' }} />
              <span>חריג / אובדן קשר</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {systemTime && (
            <span style={{ fontSize: 11, color: 'var(--red-9)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--red-9)', display: 'inline-block' }} />
              זמן נוכחי: {systemTime}
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 2,
              borderRadius: 4,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="סגור תצוגה"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/* Right Fixed Column: Flight Details (RTL) */}
        <div
          style={{
            width: 280,
            borderLeft: '1px solid rgba(87, 95, 112, 0.35)',
            flexShrink: 0,
            background: 'rgba(12, 13, 17, 0.45)',
            boxSizing: 'border-box',
          }}
        >
          {/* List Header */}
          <div
            style={{
              height: 32,
              borderBottom: '1px solid rgba(87, 95, 112, 0.25)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(241, 247, 254, 0.45)',
            }}
          >
            פרטי משימה / מפעיל
          </div>
          
          {/* Flight Details Rows */}
          {ganttItems.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              אין הטסות מוגדרות היום
            </div>
          ) : (
            ganttItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                style={{
                  height: 44,
                  borderBottom: '1px solid rgba(87, 95, 112, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '0 12px',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                title="לחץ להתמקדות במפת המרחב"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f7fe' }}>{item.id}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(241, 247, 254, 0.6)' }}>
                    {getStatusIcon(item.status)}
                    <span>{getStatusLabel(item.status)}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  <span>{item.operatorName} · {item.unit}</span>
                  <span>{item.timeWindow}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Left Scrollable Column: Timeline grid (LTR) */}
        <div
          style={{
            flex: 1,
            overflowX: 'auto',
            display: 'flex',
            flexDirection: 'column',
            direction: 'ltr',
          }}
          ref={timelineRef}
        >
          {/* Hour Labels Row */}
          <div
            style={{
              minWidth: 1200,
              height: 32,
              borderBottom: '1px solid rgba(87, 95, 112, 0.25)',
              display: 'flex',
              position: 'relative',
              boxSizing: 'border-box',
              background: 'rgba(12, 13, 17, 0.2)',
            }}
          >
            {hours.map(h => (
              <div
                key={h}
                style={{
                  width: `${100 / 24}%`,
                  borderRight: '1px solid rgba(87, 95, 112, 0.15)',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 4,
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  boxSizing: 'border-box',
                }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid Rows Container */}
          <div
            style={{
              minWidth: 1200,
              flex: 1,
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Hour Vertical Grid Lines */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
              {hours.map(h => (
                <div
                  key={h}
                  style={{
                    width: `${100 / 24}%`,
                    borderRight: '1px solid rgba(87, 95, 112, 0.06)',
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </div>

            {/* Red Current Time Line */}
            {currentTimeOffset !== null && (
              <div
                style={{
                  position: 'absolute',
                  left: `${currentTimeOffset}%`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: 'var(--red-9)',
                  zIndex: 20,
                  pointerEvents: 'none',
                  boxShadow: '0 0 6px rgba(239,68,68,0.7)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -3,
                    left: -4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'var(--red-9)',
                    border: '1px solid #fff',
                    boxShadow: '0 0 4px rgba(0,0,0,0.8)',
                  }}
                />
              </div>
            )}

            {/* Bars rows */}
            {ganttItems.map(item => {
              const time = parseTimeWindow(item.timeWindow);
              if (!time) {
                return (
                  <div
                    key={item.id}
                    style={{
                      height: 44,
                      borderBottom: '1px solid rgba(87, 95, 112, 0.15)',
                      boxSizing: 'border-box',
                    }}
                  />
                );
              }

              const left = (time.startMin / 1440) * 100;
              const width = ((time.endMin - time.startMin) / 1440) * 100;

              return (
                <div
                  key={item.id}
                  style={{
                    height: 44,
                    borderBottom: '1px solid rgba(87, 95, 112, 0.15)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    onClick={() => handleRowClick(item)}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      height: 24,
                      borderRadius: 12,
                      background: getGanttBarBackground(item.status),
                      border: `1px solid ${getGanttBarBorder(item.status)}`,
                      boxShadow: getGanttBarShadow(item.status),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      transition: 'transform 0.15s ease',
                      zIndex: 10,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scaleY(1.08)';
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.filter = 'none';
                    }}
                    title={`שעות: ${item.timeWindow} · ${getStatusLabel(item.status)}`}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'monospace',
                      }}
                    >
                      {item.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        .pulse-alert {
          animation: pulse-alert-glow 1.2s infinite ease-in-out;
        }
        @keyframes pulse-alert-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};
