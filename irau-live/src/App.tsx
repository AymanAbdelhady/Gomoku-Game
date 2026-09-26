import { lazy, Suspense } from 'react';
import { useRoute } from './utils/router';
import { useActiveEvent } from './state/StoreContext';
import { useBrandColours } from './state/useBrandColours';
import { useDemoRunner } from './state/useDemoRunner';
import { LiveDisplay } from './pages/LiveDisplay';
import { Home } from './pages/Home';

// Operator screens are split out so the public donor page and display stay light.
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Give = lazy(() => import('./pages/Give').then((m) => ({ default: m.Give })));
const AdminGate = lazy(() => import('./components/admin/AdminGate').then((m) => ({ default: m.AdminGate })));

export function App() {
  const route = useRoute();
  const event = useActiveEvent();
  useBrandColours(event.brand);
  // Donor phones never run the demo clock.
  const isPublicDonor = route === '/give';
  return (
    <>
      {!isPublicDonor && <DemoClock />}
      <Suspense fallback={<Splash />}>
        {route === '/live' && <LiveDisplay />}
        {route === '/give' && <Give />}
        {route === '/admin' && (
          <AdminGate>
            <Admin />
          </AdminGate>
        )}
        {route === '/admin/settings' && (
          <AdminGate>
            <Settings />
          </AdminGate>
        )}
        {!['/live', '/give', '/admin', '/admin/settings'].includes(route) && <Home />}
      </Suspense>
    </>
  );
}

function DemoClock() {
  useDemoRunner();
  return null;
}

export function Splash() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-[#081530]" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white/80" />
    </div>
  );
}
