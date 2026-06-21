import { useState, type CSSProperties, type ReactNode } from 'react';
import { figmaAssets } from '../../assets/figmaAssets';
import {
  TAHKIR_DIARY_ENTRIES,
  TAHKIR_RADIO_SNIPPET,
  TAHKIR_RECORDING_TOOLS,
} from '../../data/tahkir/tahkirCreatePanelData';
import { useTahkirUi } from '../../context/TahkirUiContext';

const PANEL_BG = 'rgba(0, 0, 0, 0.9)';
const PANEL_BORDER = 'rgba(37, 37, 0, 0.03)';
const CARD_BG = 'rgba(0, 45, 30, 0.07)';
const CARD_BORDER = 'rgba(0, 9, 50, 0.12)';
const FIELD_BG = 'rgba(0, 0, 0, 0.2)';
const FIELD_BORDER = 'rgba(0, 5, 29, 0.45)';
const FIELD_TEXT = '#1c2024';
const ACCENT_BTN = '#2a688b';
const INFO_BTN = '#197cae';
const TIME_SUBTITLE = '#b4b4b4';
const HEADER_DIVIDER = 'rgba(214, 235, 253, 0.19)';

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 16,
  fontWeight: 700,
  lineHeight: '24px',
  color: '#fff',
  textAlign: 'right',
};

function TextField({
  value,
  placeholder,
  chevron,
}: {
  value?: string;
  placeholder: string;
  chevron?: boolean;
}) {
  const isPlaceholder = value == null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 32,
        padding: '0 4px',
        borderRadius: 4,
        border: `1px solid ${FIELD_BORDER}`,
        background: FIELD_BG,
        boxSizing: 'border-box',
        direction: 'rtl',
      }}
    >
      <span
        style={{
          flex: 1,
          padding: '0 4px',
          fontSize: 14,
          lineHeight: '20px',
          color: isPlaceholder ? 'rgba(255,255,255,0.45)' : FIELD_TEXT,
          textAlign: 'right',
        }}
      >
        {value ?? placeholder}
      </span>
      {chevron && (
        <img
          src={figmaAssets.missionPlanChevron}
          alt=""
          width={16}
          height={16}
          style={{ flexShrink: 0, opacity: 0.85 }}
        />
      )}
    </div>
  );
}

function SectionCard({
  title,
  headerExtra,
  children,
  defaultOpen = true,
}: {
  title: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      style={{
        borderRadius: 8,
        border: `1px solid ${CARD_BORDER}`,
        background: CARD_BG,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 12px 8px',
          direction: 'rtl',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            flex: 1,
            minWidth: 0,
            direction: 'rtl',
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              lineHeight: '24px',
              color: '#fff',
              textAlign: 'right',
              flex: 1,
            }}
          >
            {title}
          </span>
          <img
            src={figmaAssets.missionPlanChevron}
            alt=""
            width={16}
            height={16}
            style={{
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
          />
        </button>
        {headerExtra}
      </div>
      {open && <div style={{ padding: '0 12px 12px' }}>{children}</div>}
    </section>
  );
}

function DiaryEntryRow({
  time,
  title,
  body,
  isLast,
}: {
  time?: string;
  title: string;
  body?: string;
  isLast: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          paddingBottom: isLast ? 8 : 24,
          textAlign: 'right',
        }}
      >
        {time && (
          <span
            style={{
              display: 'block',
              fontSize: 12,
              lineHeight: '16px',
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.04px',
              marginBottom: 2,
            }}
          >
            {time}
          </span>
        )}
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            lineHeight: '20px',
            color: '#fff',
          }}
        >
          {title}
        </span>
        {body && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 14,
              lineHeight: '20px',
              fontWeight: 400,
              color: '#fff',
            }}
          >
            {body}
          </p>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 12,
          flexShrink: 0,
          paddingTop: 2,
          gap: 2,
          alignSelf: 'stretch',
        }}
      >
        <img src={figmaAssets.tahkirDiaryDot} alt="" width={12} height={12} />
        {!isLast && (
          <div style={{ flex: 1, width: 1, minHeight: 8, position: 'relative' }}>
            <img
              src={figmaAssets.tahkirDiaryLine}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '100%',
                width: 1,
                objectFit: 'fill',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const REC_ICON: Record<string, string> = {
  play: figmaAssets.tahkirPlay,
  video: figmaAssets.tahkirRecVideo,
  upload: figmaAssets.tahkirRecUpload,
  phone: figmaAssets.tahkirRecPhone,
};

function RecordingToolButton({ label, iconKey }: { label: string; iconKey: string }) {
  const icon = REC_ICON[iconKey] ?? figmaAssets.tahkirPlay;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52 }}>
      <button
        type="button"
        title={label.replace('\n', ' ')}
        style={{
          width: 40,
          height: 40,
          padding: 0,
          border: 'none',
          borderRadius: 6,
          background: INFO_BTN,
          cursor: 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={icon} alt="" width={16} height={16} />
      </button>
      <span
        style={{
          marginTop: 4,
          fontSize: 11,
          lineHeight: '13px',
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          maxWidth: 52,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** חלונית יצירת תחקור — Figma 393:30622 */
export function TahkirCreatePanel() {
  const { closeCreate } = useTahkirUi();

  return (
    <aside
      aria-label="יצירת תחקור"
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: PANEL_BG,
        borderLeft: `1px solid ${PANEL_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        fontFamily: 'Assistant, var(--ds-font)',
        color: '#fff',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px 8px',
          flexShrink: 0,
          direction: 'rtl',
        }}
      >
        <button
          type="button"
          onClick={closeCreate}
          aria-label="קפל"
          title="קפל"
          style={{
            width: 32,
            height: 28,
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <img
            src={figmaAssets.missionPlanChevron}
            alt=""
            width={20}
            height={20}
            style={{ transform: 'rotate(180deg)', display: 'block' }}
          />
        </button>

        <h1
          style={{
            margin: 0,
            flex: 1,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: '28px',
            letterSpacing: '-0.08px',
            color: 'var(--ds-text-heading)',
            textAlign: 'right',
          }}
        >
          יצירת תחקור
        </h1>

        <button
          type="button"
          style={{
            height: 32,
            minWidth: 60,
            padding: '0 12px',
            borderRadius: 4,
            border: `1px solid ${PANEL_BORDER}`,
            background: ACCENT_BTN,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            cursor: 'default',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}
        >
          שמירה
        </button>
      </header>

      <div
        style={{
          height: 1,
          margin: '0 16px',
          background: HEADER_DIVIDER,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          margin: '10px 16px 12px',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: '24px',
            color: TIME_SUBTITLE,
            textAlign: 'right',
          }}
        >
          זמן: 18.4.23 16:30 - 17:30
        </p>
      </div>

      <div
        className="tahkir-create-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <SectionCard title="פרטים כללים">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={labelStyle}>שם</span>
              <TextField placeholder="שם תחקיר" />
            </div>
            <div>
              <span style={labelStyle}>תוצאות</span>
              <TextField placeholder="תוצאות תחקיר" />
            </div>
            <div>
              <span style={labelStyle}>סוג אירוע</span>
              <TextField value="מתוכנן" placeholder="סוג אירוע" chevron />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="רצף אירועים"
          headerExtra={
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                height: 24,
                padding: '0 8px',
                border: 'none',
                borderRadius: 3,
                background: 'rgba(49, 180, 255, 0.12)',
                color: 'rgba(137, 209, 255, 0.93)',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: '16px',
                cursor: 'default',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
              הוספה ידנית
            </button>
          }
        >
          <div
            className="tahkir-diary-scroll"
            style={{
              position: 'relative',
              maxHeight: 343,
              overflowY: 'auto',
              paddingLeft: 4,
            }}
          >
            {TAHKIR_DIARY_ENTRIES.map((entry, i) => (
              <DiaryEntryRow
                key={entry.id}
                time={entry.time}
                title={entry.title}
                body={entry.body}
                isLast={i === TAHKIR_DIARY_ENTRIES.length - 1}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="אמצעים">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 4,
              marginBottom: 12,
              direction: 'rtl',
            }}
          >
            {TAHKIR_RECORDING_TOOLS.map(tool => (
              <RecordingToolButton key={tool.id} label={tool.label} iconKey={tool.iconKey} />
            ))}
          </div>

          <p
            style={{
              margin: '0 0 10px',
              fontSize: 14,
              lineHeight: '20px',
              color: '#fff',
              textAlign: 'right',
            }}
          >
            הקלטות קשר
          </p>

          <div
            style={{
              borderRadius: 6,
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '12px',
              border: `1px solid ${CARD_BORDER}`,
              minHeight: 97,
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 12,
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 6,
                textAlign: 'right',
              }}
            >
              {TAHKIR_RADIO_SNIPPET.time}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: '20px',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'right',
              }}
            >
              {TAHKIR_RADIO_SNIPPET.body}
            </p>
          </div>
        </SectionCard>
      </div>
    </aside>
  );
}
