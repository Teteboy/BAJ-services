import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, Package, FileText, CreditCard,
  BarChart3, Truck, Settings, LogOut, Warehouse, UserCog,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isAdmin: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const adminGroups: NavGroup[] = [
    {
      label: 'Operations',
      items: [
        { label: 'Dashboard', href: '/app', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Orders', href: '/app/orders', icon: <ShoppingCart className="h-4 w-4" />, badge: '12' },
        { label: 'Deliveries', href: '/app/orders', icon: <Truck className="h-4 w-4" />, badge: '3' },
        { label: 'Invoices', href: '/app/invoices', icon: <FileText className="h-4 w-4" /> },
        { label: 'Payments', href: '/app/payments', icon: <CreditCard className="h-4 w-4" />, badge: '2' },
      ],
    },
    {
      label: 'Inventory',
      items: [
        { label: 'Products', href: '/app/products', icon: <Package className="h-4 w-4" /> },
        { label: 'Stock', href: '/app/stock', icon: <Warehouse className="h-4 w-4" /> },
        { label: 'Reports', href: '/app/reports', icon: <BarChart3 className="h-4 w-4" /> },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Clients', href: '/app/clients', icon: <Users className="h-4 w-4" /> },
        { label: 'Users', href: '/app/users', icon: <UserCog className="h-4 w-4" /> },
        { label: 'Settings', href: '/app/settings', icon: <Settings className="h-4 w-4" /> },
      ],
    },
  ];

  const clientGroups: NavGroup[] = [
    {
      label: 'Menu',
      items: [
        { label: 'Dashboard', href: '/app/client', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Place Order', href: '/app/client/orders/new', icon: <ShoppingCart className="h-4 w-4" /> },
        { label: 'My Orders', href: '/app/client/orders', icon: <Package className="h-4 w-4" /> },
        { label: 'Invoices', href: '/app/client/invoices', icon: <FileText className="h-4 w-4" />, badge: '1' },
        { label: 'Profile', href: '/app/client/profile', icon: <UserCog className="h-4 w-4" /> },
      ],
    },
  ];

  const groups = isAdmin ? adminGroups : clientGroups;

  const isActive = (href: string) =>
    href === '/app'
      ? location.pathname === '/app'
      : href === '/app/client'
        ? location.pathname === '/app/client'
        : location.pathname === href || location.pathname.startsWith(`${href}/`);

  if (isAdmin) {
    return (
      <aside className="flex h-screen w-[240px] min-w-[240px] flex-col border-r border-admin-borderLight bg-admin-sidebar text-admin-text">
        <div className="flex h-16 items-center gap-3 border-b border-admin-borderLight px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fire-gradient/10">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <defs><linearGradient id="sidebarFire" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
              <rect width="32" height="32" rx="8" fill="rgba(249,115,22,0.12)" />
              <path d="M16 5c0 0-2 4-2 7 0 1.7 1.3 3 3 3-.5-1.5.5-3.5 1.5-4.5C18.5 13.5 20 16 20 18.5A4.5 4.5 0 0 1 15.5 23 4.5 4.5 0 0 1 11 18.5c0-4 3-8 5-13.5z" fill="url(#sidebarFire)" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-extrabold leading-none text-admin-text">ON FIRE FUEL</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-admin-textSub">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {groups.map((group, gi) => (
            <div key={gi}>
              <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href + item.label}
                      to={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                        active ? 'bg-fire-500/10 font-semibold text-fire-400' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      )}
                    >
                      <span className={cn(active ? 'text-fire-400' : 'text-slate-500 group-hover:text-slate-300')}>{item.icon}</span>
                      {item.label}
                      {item.badge && (
                        <span className={cn('ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-fire-500/20 text-fire-400' : 'bg-slate-800 text-slate-400')}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-admin-borderLight p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fire-500/30 bg-gradient-to-br from-fire-500/20 to-red-500/20 text-xs font-bold text-fire-400">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-300">{user?.name || 'Admin User'}</p>
              <p className="truncate text-[10px] text-slate-500">Operations Manager</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen w-[230px] min-w-[230px] flex-col border-r border-slate-200 bg-white text-slate-700">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <defs><linearGradient id="clientSidebarFire" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
            <rect width="32" height="32" rx="8" fill="#1E3A5F" />
            <path d="M16 5c0 0-2 4-2 7 0 1.7 1.3 3 3 3-.5-1.5.5-3.5 1.5-4.5C18.5 13.5 20 16 20 18.5A4.5 4.5 0 0 1 15.5 23 4.5 4.5 0 0 1 11 18.5c0-4 3-8 5-13.5z" fill="url(#clientSidebarFire)" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-extrabold leading-none text-navy-900">On Fire Fuel</p>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Client Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href + item.label}
                    to={item.href}
                    className={cn(
                      'group flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                      active ? 'bg-navy-100 font-semibold text-navy-900' : 'text-slate-500 hover:bg-slate-50 hover:text-navy-900'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(active ? 'text-navy-900' : 'text-slate-500 group-hover:text-navy-900')}>{item.icon}</span>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-bold text-navy-900">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'C'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">{user?.name || 'SNIM Mining'}</p>
            <p className="truncate text-[10px] text-slate-500">{user?.email || 'm.ndiaye@snim.mr'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
