import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/app') && !pathname.startsWith('/app/client');

  return (
    <div className={`flex min-h-screen ${isAdmin ? 'bg-admin-bg text-admin-text admin-scrollbars' : 'bg-client-bg text-client-text client-scrollbars'}`}>
      <Sidebar isAdmin={isAdmin} />
      <main className={`flex-1 overflow-auto ${isAdmin ? 'bg-admin-bg' : 'bg-client-bg'} animate-fade-in`}>
        <div className={isAdmin ? 'p-6 lg:p-8' : 'p-6 lg:p-8'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
