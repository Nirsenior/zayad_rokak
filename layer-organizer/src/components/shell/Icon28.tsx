type Props = {
  src: string;
  alt?: string;
};

/** אייקון כותרת 28×28 — בלי מתיחה */
export function Icon28({ src, alt = '' }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      width={28}
      height={28}
      draggable={false}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
