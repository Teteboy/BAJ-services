import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-surface-200">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
