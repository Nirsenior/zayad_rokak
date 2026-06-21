import { useMemo } from 'react';

/** שעה + תאריך בטופ-בר — Figma 451:107940 / 451:107941 */
export function HeaderDateTime() {
  const { time, date } = useMemo(() => {
    const h = 7 + Math.floor(Math.random() * 14);
    const m = Math.floor(Math.random() * 60);
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    return { time, date };
  }, []);

  return (
    <>
      <span
        style={{
          position: 'absolute',
          left: 391,
          top: 13.5,
          fontSize: 16,
          fontWeight: 400,
          lineHeight: '19px',
          color: '#e1f6ff',
          fontFamily: "'SF Compact Rounded', 'Assistant', sans-serif",
          whiteSpace: 'nowrap',
        }}
      >
        {time}
      </span>
      <span
        style={{
          position: 'absolute',
          left: 435.5,
          top: 13.5,
          fontSize: 16,
          fontWeight: 400,
          lineHeight: '19px',
          color: '#c0c0c0',
          fontFamily: "'SF Compact Rounded', 'Assistant', sans-serif",
          whiteSpace: 'nowrap',
        }}
      >
        {date}
      </span>
    </>
  );
}
