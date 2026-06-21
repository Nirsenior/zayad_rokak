import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

/** כפתור אייקון 28×28 בכותרת — לפי DS */
export function HeaderIconButton({ title, children }: Props) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'default',
      }}
    >
      {children}
    </button>
  );
}
