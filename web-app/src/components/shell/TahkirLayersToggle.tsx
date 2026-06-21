import { figmaAssets } from '../../assets/figmaAssets';
import { MapToolToggle } from './MapToolToggle';

type Props = {
  active: boolean;
  onClick: () => void;
};

/** אותה לוגיקת מראה כמו LayersToggle — רק אייקון שונה */
export function TahkirLayersToggle({ active, onClick }: Props) {
  const title = active ? 'סגור שכבת תחקירים' : 'פתח שכבת תחקירים';

  return (
    <MapToolToggle
      active={active}
      icon={figmaAssets.tahkirLayersIcon}
      ariaLabel="שכבת תחקירים"
      title={title}
      tutorialId="tahkir-layers-toggle"
      onClick={onClick}
    />
  );
}
