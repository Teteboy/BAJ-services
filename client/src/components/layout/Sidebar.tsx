import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  CreditCard,
  BarChart3,
  Truck,
  Settings,
  LogOut,
  Fuel,
  Warehouse,
  UserCog,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: ('ADMIN' | 'CLIENT')[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
  roles?: ('ADMIN' | 'CLIENT')[];
}

export function Sidebar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const navGroups: NavGroup[] = [
    {
      items: [
        { label: 'Dashboard', href: '/app', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Dashboard', href: '/app/client', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['CLIENT'] },
      ],
    },
    {
      label: 'Operations',
      roles: ['ADMIN'],
      items: [
        { label: 'Orders', href: '/app/orders', icon: <ShoppingCart className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Clients', href: '/app/clients', icon: <Users className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Invoices', href: '/app/invoices', icon: <FileText className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Payments', href: '/app/payments', icon: <CreditCard className="h-4 w-4" />, roles: ['ADMIN'] },
      ],
    },
    {
      label: 'Inventory',
      roles: ['ADMIN'],
      items: [
        { label: 'Products', href: '/app/products', icon: <Package className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Stock', href: '/app/stock', icon: <Warehouse className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Reports', href: '/app/reports', icon: <BarChart3 className="h-4 w-4" />, roles: ['ADMIN'] },
      ],
    },
    {
      label: 'System',
      roles: ['ADMIN'],
      items: [
        { label: 'Users', href: '/app/users', icon: <UserCog className="h-4 w-4" />, roles: ['ADMIN'] },
        { label: 'Settings', href: '/app/settings', icon: <Settings className="h-4 w-4" />, roles: ['ADMIN'] },
      ],
    },
    {
      label: 'My Account',
      roles: ['CLIENT'],
      items: [
        { label: 'My Orders', href: '/app/client/orders', icon: <ShoppingCart className="h-4 w-4" />, roles: ['CLIENT'] },
        { label: 'New Order', href: '/app/client/orders/new', icon: <Truck className="h-4 w-4" />, roles: ['CLIENT'] },
        { label: 'My Invoices', href: '/app/client/invoices', icon: <FileText className="h-4 w-4" />, roles: ['CLIENT'] },
        { label: 'Profile', href: '/app/client/profile', icon: <UserCog className="h-4 w-4" />, roles: ['CLIENT'] },
      ],
    },
  ];

  const isActive = (href: string) =>
    href === '/app'
      ? location.pathname === '/app'
      : href === '/app/client'
        ? location.pathname === '/app/client'
        : location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-surface-300 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-surface-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 shadow-glow-sm">
          <Fuel className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-surface-900">On Fire</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-surface-500">Fuel Delivery Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, gi) => {
          const groupVisible = !group.roles || group.roles.some((r) => hasRole(r));
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.some((r) => hasRole(r))
          );
          if (!groupVisible || visibleItems.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-brand-50 text-brand-700 font-semibold'
                          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                      )}
                    >
                      <span className={cn('transition-colors', active ? 'text-brand-600' : 'text-surface-400 group-hover:text-surface-700')}>
                        {item.icon}
                      </span>
                      {item.label}
                      {active && <ChevronRight className="ml-auto h-3 w-3 text-brand-600" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-surface-200 p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-lg bg-surface-100 px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-surface-900">{user?.name}</p>
            <p className="truncate text-[10px] text-surface-500">{user?.role === 'ADMIN' ? 'Administrator' : 'Client'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-surface-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
