import { figmaAssets } from '../../assets/figmaAssets';
import { MapToolToggle } from './MapToolToggle';

type Props = {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function LayersToggle({ active, disabled = false, onClick }: Props) {
  const title = disabled
    ? 'סדרן המרשמים אינו זמין במצב תחקור מרחב'
    : active
      ? 'סגור סדרן המרשמים'
      : 'פתח סדרן המרשמים';

  return (
    <MapToolToggle
      active={active}
      disabled={disabled}
      icon={figmaAssets.layersIcon}
      ariaLabel="סדרן המרשמים"
      title={title}
      tutorialId="layers-toggle"
      onClick={onClick}
    />
  );
}
