import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppSession } from '../../context/AppSessionContext';
import { useTutorial } from '../../context/TutorialContext';
import { TEST_PERSONAS } from '../../data/catalog/users';
import { DEFAULT_HEADER_LABELS, type TestPersonaHeaderLabels } from '../../types/session';
import { figmaAssets } from '../../assets/figmaAssets';
import { UserSettingsPanel } from './UserSettingsPanel';

/** User — Figma 719:27213 (307×38) */
const W = 307;
const CARD_H = 38;
const BTN_H = 38;
const TEXT = { size: 16, line: '17px' as const };
const FONT = 'Assistant, var(--ds-font)';

function resolveHeaderLabels(persona: (typeof TEST_PERSONAS)[0]): TestPersonaHeaderLabels {
  return {
    operationTitle: persona.header?.operationTitle ?? DEFAULT_HEADER_LABELS.operationTitle,
    unitLabel: persona.header?.unitLabel ?? DEFAULT_HEADER_LABELS.unitLabel,
    cellType: persona.header?.cellType ?? DEFAULT_HEADER_LABELS.cellType,
    cellName: persona.header?.cellName ?? persona.description ?? DEFAULT_HEADER_LABELS.cellName,
  };
}

export function HeaderUserButton() {
  const { session } = useAppSession();
  const { registerUserSettingsChrome } = useTutorial();
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const persona = TEST_PERSONAS.find(u => u.id === session.userId) ?? TEST_PERSONAS[0];
  const labels = resolveHeaderLabels(persona);

  const togglePanel = useCallback(() => {
    setOpen(prev => {
      if (prev) return false;
      if (cardRef.current) {
        setAnchorRect(cardRef.current.getBoundingClientRect());
      }
      return true;
    });
  }, []);

  const closePanel = useCallback(() => setOpen(false), []);

  const openPanel = useCallback(() => {
    if (cardRef.current) {
      setAnchorRect(cardRef.current.getBoundingClientRect());
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    registerUserSettingsChrome({ open: openPanel, close: closePanel });
    return () => registerUserSettingsChrome(null);
  }, [registerUserSettingsChrome, openPanel, closePanel]);

  return (
    <div
      ref={cardRef}
      data-tutorial-id="header-user-button"
      style={{ position: 'relative', width: W, height: BTN_H }}
    >
      <img
        src={figmaAssets.userCardBgV2}
        alt=""
        style={{
          position: 'absolute',
          left: 0,
          top: (BTN_H - CARD_H) / 2,
          width: W,
          height: CARD_H,
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      {/* שמאל — chevron בלבד, פותח הגדרות */}
      <button
        ref={triggerRef}
        type="button"
        title="הגדרות משתמש"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={e => {
          e.stopPropagation();
          togglePanel();
        }}
        style={{
          position: 'absolute',
          left: 3.5,
          top: (BTN_H - CARD_H) / 2 + 4,
          width: 21,
          height: 30,
          margin: 0,
          padding: 0,
          border: 'none',
          background: open ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          borderRadius: 4,
          cursor: 'pointer',
          zIndex: 3,
        }}
      >
        <img
          src={figmaAssets.userChevronBadgeV2}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <img
          src={figmaAssets.userChevronV2}
          alt=""
          width={8}
          height={8}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </button>

      {/* מבצע + יחידה (שמאל) — Figma 15233:737076, left 45 w 72 */}
      <div
        style={{
          position: 'absolute',
          left: 45,
          top: (BTN_H - CARD_H) / 2,
          width: 72,
          height: CARD_H,
          pointerEvents: 'none',
          direction: 'rtl',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: 'translateX(-50%)',
            fontFamily: FONT,
            fontSize: TEXT.size,
            fontWeight: 600,
            lineHeight: TEXT.line,
            color: '#e6f5ff',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {labels.operationTitle}
        </span>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: 17,
            transform: 'translateX(-50%)',
            fontFamily: FONT,
            fontSize: TEXT.size,
            fontWeight: 400,
            lineHeight: TEXT.line,
            color: '#a9c3ce',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {labels.unitLabel}
        </span>
      </div>

      {/* סמל — מרכז */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: (BTN_H - CARD_H) / 2 + 1,
          transform: 'translateX(-50%)',
          width: 35,
          height: CARD_H - 2,
          pointerEvents: 'none',
        }}
      >
        <img
          src={figmaAssets.userEmblemBgV2}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, calc(-50% + 1px))',
            width: 22,
            height: 28,
            overflow: 'hidden',
            borderRadius: '1px 1px 0 0',
          }}
        >
          <img
            src={figmaAssets.userEmblemV2}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              minHeight: '100%',
              marginTop: -2,
            }}
          />
        </div>
      </div>

      {/* מציאות + תא (ימין) — Figma 15233:737079, left 188.5 */}
      <div
        style={{
          position: 'absolute',
          left: 188.5,
          top: (BTN_H - CARD_H) / 2 + 1,
          width: 100,
          height: CARD_H - 2,
          pointerEvents: 'none',
          direction: 'rtl',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: 1,
            transform: 'translateX(-50%)',
            width: 100,
            fontFamily: FONT,
            fontSize: TEXT.size,
            fontWeight: 600,
            lineHeight: TEXT.line,
            color: '#e6f5ff',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {labels.cellType}
        </span>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: 17,
            transform: 'translateX(-50%)',
            width: 62,
            fontFamily: FONT,
            fontSize: TEXT.size,
            fontWeight: 400,
            lineHeight: TEXT.line,
            color: '#a9c3ce',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {labels.cellName}
        </span>
      </div>

      {open && anchorRect && (
        <UserSettingsPanel
          anchorRect={anchorRect}
          triggerRef={triggerRef}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
