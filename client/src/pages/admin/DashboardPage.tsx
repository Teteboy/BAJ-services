import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Package, AlertTriangle,
  CheckCircle, Clock, ArrowRight, Truck,
} from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

interface AdminDashboardStats {
  pendingOrders: number;
  upcomingDeliveries: number;
  completedDeliveries: number;
  pendingPayments: number;
  overduePayments: number;
  totalRevenueThisMonth: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    client: { companyName: string };
    status: string;
    createdAt: string;
    items: Array<{ product: { name: string }; pricePerUnit: number; quantity: number }>;
  }>;
  ordersTrend: Array<{ date: string; count: number }>;
  upcomingDeliveryOrders: Array<{
    id: string;
    orderNumber: string;
    client: { companyName: string };
    requestedDeliveryDate: string;
    deliveryLocation: { name: string | null; address: string } | null;
    items: Array<{ product: { name: string }; quantity: number }>;
  }>;
  paymentFollowUp: Array<{
    id: string;
    invoiceNumber: string;
    client: { companyName: string } | null;
    status: string;
    totalAmount: number;
    paymentDeadline: string;
  }>;
  latestStock: {
    id: string;
    initialStock: number;
    remainingStock: number;
    product: { name: string };
  } | null;
  activity: Array<{ type: string; text: string; time: string }>;
}

const statusBadgeClass: Record<string, string> = {
  PENDING: 'badge-admin-pending',
  VALIDATED: 'badge-admin-validated',
  DELIVERED: 'badge-admin-delivered',
  REJECTED: 'badge-admin-rejected',
  PAID: 'badge-admin-paid',
  OVERDUE: 'badge-admin-overdue',
};

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await get<{ data: AdminDashboardStats }>('/dashboard/admin');
        setStats(res.data);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Orders Pending Validation', value: stats?.pendingOrders ?? 0, icon: Clock, iconColor: '#fbbf24' },
    { label: 'Upcoming Deliveries', value: stats?.upcomingDeliveries ?? 0, icon: Truck, iconColor: '#60a5fa' },
    { label: 'Deliveries Completed', sublabel: 'All time', value: stats?.completedDeliveries ?? 0, icon: CheckCircle, iconColor: '#34d399' },
    { label: 'Payments Pending', value: formatCurrency(stats?.pendingPayments ?? 0), icon: FileTextIcon, iconColor: '#94a3b8' },
    { label: 'Overdue Payments', value: formatCurrency(stats?.overduePayments ?? 0), icon: AlertTriangle, iconColor: '#f87171', danger: true },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-admin-borderLight pb-5">
        <h1 className="text-xl font-semibold text-admin-text">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-admin-textSub" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-60 rounded-full border border-admin-borderLight bg-admin-card py-1.5 pl-9 pr-4 text-sm text-admin-text placeholder:text-admin-textSub focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button className="relative rounded-full border border-admin-borderLight bg-admin-card p-2 text-admin-textMuted hover:text-admin-text">
            <BellIcon className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-admin-card" />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`flex items-center justify-between rounded-xl border bg-admin-card p-5 ${card.danger ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]' : 'border-admin-border'}`}
          >
            <div>
              <p className="text-[11px] font-medium text-admin-textSub">{card.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-[26px] font-bold leading-none text-admin-text">{card.value}</p>
                {card.sublabel && <span className="text-[11px] text-admin-textSub">{card.sublabel}</span>}
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5">
              <card.icon className="h-5 w-5" style={{ color: card.iconColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Orders */}
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
            <div className="flex items-center justify-between border-b border-admin-border px-6 py-4">
              <span className="text-[15px] font-semibold text-admin-text">Recent Orders</span>
              <Link to="/app/orders" className="flex items-center gap-1 rounded-md border border-admin-borderLight bg-admin-bg px-3 py-1 text-xs font-medium text-admin-textMuted transition-colors hover:bg-admin-card hover:text-admin-text">
                View All
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-admin-bg/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-admin-textSub">Client</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-admin-textSub">Product</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-admin-textSub">Qty (L)</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-admin-textSub">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-admin-textSub">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-admin-textSub">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.length ? (
                  stats.recentOrders.slice(0, 6).map((order) => {
                    const product = order.items[0]?.product?.name ?? 'Gasoil';
                    const qty = order.items[0]?.quantity ?? 0;
                    return (
                      <tr key={order.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-4 py-3 text-sm font-medium text-admin-text">{order.client.companyName}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-sm text-admin-textMuted">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {product}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-admin-textMuted font-tabular-nums">{qty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-admin-textMuted">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('badge-admin', statusBadgeClass[order.status] ?? 'badge-admin-pending')}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/app/orders" className="text-xs font-semibold text-blue-400 hover:text-blue-300">
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-admin-textSub">
                      <Package className="mx-auto mb-2 h-10 w-10 opacity-30" />
                      No recent orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Deliveries + Payments Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Deliveries */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-admin-border bg-admin-card">
              <div className="flex items-center gap-2 border-b border-admin-border px-5 py-4">
                <Truck className="h-4 w-4 text-blue-400" />
                <span className="text-[15px] font-semibold text-admin-text">Upcoming Deliveries</span>
              </div>
              <div className="flex-1">
                {stats?.upcomingDeliveryOrders?.length ? (
                  stats.upcomingDeliveryOrders.map((order) => {
                    const product = order.items[0]?.product?.name ?? 'Gasoil';
                    const volume = order.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <div key={order.id} className="border-b border-admin-border/60 px-5 py-3.5 last:border-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-admin-text">{order.client.companyName}</p>
                            <p className="mt-0.5 text-xs text-admin-textSub">{order.deliveryLocation?.name || order.deliveryLocation?.address || '-'}</p>
                          </div>
                          <span className="rounded-full border border-admin-borderLight bg-admin-bg px-2 py-0.5 text-[10px] text-admin-textSub">{formatDate(order.requestedDeliveryDate)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded border border-admin-borderLight bg-admin-bg px-1.5 py-0.5 text-[11px] text-admin-textMuted">{product}</span>
                          <span className="text-xs text-admin-textSub">{volume.toLocaleString()} L</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-10 text-center text-sm text-admin-textSub">No upcoming deliveries.</div>
                )}
              </div>
              <div className="border-t border-admin-border p-2.5">
                <Link to="/app/orders" className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                  View Orders <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Payment Follow-up */}
            <div className="flex flex-col overflow-hidden rounded-xl border border-admin-border bg-admin-card">
              <div className="flex items-center gap-2 border-b border-admin-border px-5 py-4">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span className="text-[15px] font-semibold text-admin-text">Payment Follow-up</span>
              </div>
              <table className="w-full flex-1">
                <thead>
                  <tr className="bg-admin-bg/50">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-admin-textSub">Client</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-admin-textSub">Amount</th>
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-admin-textSub">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.paymentFollowUp?.length ? (
                    stats.paymentFollowUp.map((inv) => (
                      <tr key={inv.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                        <td className="px-5 py-3 text-sm font-medium text-admin-text">{inv.client?.companyName ?? '-'}</td>
                        <td className="px-5 py-3 text-right">
                          <p className="text-sm text-admin-textMuted font-tabular-nums">{formatCurrency(inv.totalAmount)}</p>
                          <p className={cn('text-[10px]', inv.status === 'OVERDUE' ? 'text-red-400' : 'text-admin-textSub')}>{formatDate(inv.paymentDeadline)}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn('badge-admin', statusBadgeClass[inv.status] ?? 'badge-admin-pending')}>{inv.status}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-admin-textSub">No pending or overdue invoices.</td></tr>
                  )}
                </tbody>
              </table>
              <div className="border-t border-admin-border p-2.5">
                <Link to="/app/invoices" className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                  All Invoices <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Stock Monitoring */}
          <div className="relative overflow-hidden rounded-xl border border-admin-border bg-gradient-to-br from-admin-card to-admin-bg p-5">
            <div className="relative z-10">
              <div className="mb-5 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-[15px] font-semibold text-admin-text">Stock Monitoring</p>
                  <p className="text-xs text-admin-textSub">{stats?.latestStock ? `${stats.latestStock.product.name} Inventory` : 'Latest Inventory'}</p>
                </div>
              </div>
              {stats?.latestStock ? (
                <>
                  <div className="mb-5">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-admin-textSub">Remaining Stock</span>
                      <span className="font-semibold text-blue-400">{stats.latestStock.remainingStock.toLocaleString()} L</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-admin-bg ring-1 ring-admin-border">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                        style={{ width: `${Math.max(0, Math.min(100, (stats.latestStock.remainingStock / stats.latestStock.initialStock) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="mb-5 grid grid-cols-2 gap-4 border-t border-admin-border pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-textSub">Initial Stock</p>
                      <p className="mt-1 text-lg font-bold text-admin-text">{stats.latestStock.initialStock.toLocaleString()} <span className="text-xs font-normal text-admin-textSub">L</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-admin-textSub">Utilized</p>
                      <p className="mt-1 text-lg font-bold text-admin-text">{(stats.latestStock.initialStock - stats.latestStock.remainingStock).toLocaleString()} <span className="text-xs font-normal text-admin-textSub">L</span></p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mb-5 text-sm text-admin-textSub">No stock data available.</p>
              )}
              <Link to="/app/stock" className="block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-colors hover:bg-blue-500">
                Manage Stock
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-admin-border bg-admin-card">
            <div className="border-b border-admin-border px-5 py-4">
              <span className="text-[15px] font-semibold text-admin-text">Activity Feed</span>
            </div>
            <div className="relative flex flex-col gap-5 p-5">
              {stats?.activity?.length ? (
                stats.activity.map((a, i, arr) => (
                  <div key={i} className="flex gap-3.5">
                    {i < arr.length - 1 && (
                      <div className="absolute left-[27px] top-8 h-[calc(100%-40px)] w-px bg-admin-borderLight" />
                    )}
                    <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-admin-border ${activityIconBg(a.type)} ${activityIconColor(a.type)}`}>
                      {activityIcon(a.type)}
                    </div>
                    <div>
                      <p className="text-xs leading-relaxed text-admin-textMuted">{a.text}</p>
                      <p className="mt-1 text-[11px] font-medium text-admin-textSub">{formatDateTime(a.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-admin-textSub">No recent activity.</p>
              )}
            </div>
            <div className="border-t border-admin-border p-2.5">
              <button className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                View All Activity <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function activityIcon(type: string) {
  switch (type) {
    case 'payment':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case 'delivery':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case 'order':
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case 'invoice':
    default:
      return (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
        </svg>
      );
  }
}

function activityIconBg(type: string) {
  switch (type) {
    case 'payment': return 'bg-emerald-500/10';
    case 'delivery': return 'bg-blue-500/10';
    case 'order': return 'bg-amber-500/10';
    default: return 'bg-purple-500/10';
  }
}

function activityIconColor(type: string) {
  switch (type) {
    case 'payment': return 'text-emerald-400';
    case 'delivery': return 'text-blue-400';
    case 'order': return 'text-amber-400';
    default: return 'text-purple-400';
  }
}
