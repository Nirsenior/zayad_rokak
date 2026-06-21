import { AppProviders } from './context/AppProviders';
import { AppShell } from './components/shell/AppShell';

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
