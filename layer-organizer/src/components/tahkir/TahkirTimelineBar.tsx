import { figmaAssets } from '../../assets/figmaAssets';

type Props = {
  width: number;
};

const TRACK_BORDER = '1px solid rgba(217, 237, 254, 0.15)';
const TRACK_BG = 'rgba(221, 234, 248, 0.08)';
const RANGE_BG = '#186eff';
const THUMB_SHADOW =
  '0 1px 3px rgba(0,0,0,0.05), 0 2px 1px -1px rgba(0,0,0,0.05), 0 1px 4px rgba(211,237,248,0.11), 0 0 0 0.5px rgba(0,0,0,0.05)';
const TRACK_INSET_SHADOW =
  'inset 0 1.5px 2px rgba(0,0,0,0.1), inset 0 1.5px 2px rgba(216,244,246,0.04)';

function SliderThumb({ withFocusRing }: { withFocusRing?: boolean }) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          right: -9,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 16,
          height: 16,
          borderRadius: 6,
          background: '#fff',
          border: '1px solid #656b7b',
          boxShadow: THUMB_SHADOW,
          zIndex: 2,
        }}
      />
      {withFocusRing && (
        <div
          style={{
            position: 'absolute',
            right: -9,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            borderRadius: 6,
            boxSizing: 'border-box',
            border: '4px solid rgba(25, 96, 217, 0.75)',
            outline: '2px solid #081c3d',
            outlineOffset: -1,
            zIndex: 1,
          }}
        />
      )}
    </>
  );
}

function TimelineSlider({
  width,
  fillPercent,
  focusThumb,
}: {
  width: number | '100%';
  fillPercent: number;
  focusThumb?: boolean;
}) {
  return (
    <div
      style={{
        width,
        height: 12,
        flexShrink: width === '100%' ? 1 : 0,
        minWidth: width === '100%' ? 0 : undefined,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 3,
          border: TRACK_BORDER,
          background: TRACK_BG,
          boxShadow: TRACK_INSET_SHADOW,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -1,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 12,
          width: `calc(${fillPercent}% + 1px)`,
          borderRadius: 3,
          background: RANGE_BG,
          border: TRACK_BORDER,
        }}
      >
        <SliderThumb withFocusRing={focusThumb} />
      </div>
    </div>
  );
}

/** פס ציר זמן — Figma 386:90031 */
export function TahkirTimelineBar({ width }: Props) {
  return (
    <div
      role="region"
      aria-label="ציר זמן"
      style={{
        width,
        height: '100%',
        boxSizing: 'border-box',
        background: 'rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(43, 173, 254, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '16px 24px',
        direction: 'ltr',
        fontFamily: 'var(--ds-font)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 224,
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* שמאל — מפריד + סליידר משני 300px */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <div style={{ width: 1, height: 32, background: 'rgba(214, 235, 253, 0.19)' }} />
          <TimelineSlider width={300} fillPercent={75} />
        </div>

        {/* ימין — בקרת זמן (Figma 386:90035) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 24,
            flex: 1,
            minWidth: 0,
            maxWidth: 1398,
          }}
        >
          <button
            type="button"
            aria-label="נגן"
            style={{
              width: 16,
              height: 16,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'default',
              flexShrink: 0,
            }}
          >
            <img src={figmaAssets.tahkirPlay} alt="" width={16} height={16} />
          </button>
          <button
            type="button"
            aria-label="הרץ קדימה"
            style={{
              width: 16,
              height: 16,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'default',
              flexShrink: 0,
            }}
          >
            <img src={figmaAssets.tahkirFastForward} alt="" width={16} height={16} />
          </button>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              maxWidth: 1077,
              height: 12,
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.39)',
            }}
          >
            <TimelineSlider width="100%" fillPercent={25} focusThumb />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: 150,
                height: 40,
                padding: '0 16px',
                boxSizing: 'border-box',
                borderRadius: 6,
                border: '1px solid rgba(217, 237, 255, 0.25)',
                background: 'rgba(0, 0, 0, 0.25)',
              }}
            >
              <img
                src={figmaAssets.tahkirCalendarIcon}
                alt=""
                width={18}
                height={18}
                style={{ flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 16,
                  lineHeight: '24px',
                  color: '#edeef0',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                26/2/2025
              </span>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                lineHeight: '20px',
                color: '#fff',
                whiteSpace: 'nowrap',
              }}
            >
              תאריך
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
