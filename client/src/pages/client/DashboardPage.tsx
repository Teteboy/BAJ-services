import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, CheckCircle, AlertCircle, Clock, Truck,
  Bell, Plus, MapPin, ChevronDown, CreditCard,
} from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Invoice } from '@/types';

interface ClientDashboardStats {
  pendingOrders: number;
  validatedOrders: number;
  deliveredOrders: number;
  unpaidInvoices: number;
  totalSpentThisMonth: number;
  recentOrders: Order[];
  recentInvoices: Invoice[];
  activeOrders: Order[];
}

const statusBadgeClass: Record<string, string> = {
  PENDING: 'badge-client-pending',
  VALIDATED: 'badge-client-validated',
  DELIVERED: 'badge-client-delivered',
  REJECTED: 'badge-client-rejected',
};

export default function ClientDashboardPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState<ClientDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await get<{ data: ClientDashboardStats }>('/dashboard/client');
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

  const recentOrders = stats?.recentOrders?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-navy-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="relative rounded-full p-2 text-slate-400 transition-colors hover:text-slate-600">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-fire-500 ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2 pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-bold text-navy-900">
              {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden text-sm md:block">
              <span className="font-medium text-slate-700">{user?.name || user?.email}</span>
              <ChevronDown className="ml-1 inline h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Orders', value: (stats?.pendingOrders ?? 0) + (stats?.validatedOrders ?? 0), icon: LayoutDashboard, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Deliveries', value: stats?.validatedOrders ?? 0, icon: Truck, color: 'bg-orange-50 text-fire-600' },
          { label: 'Unpaid Invoices', value: stats?.unpaidInvoices ?? 0, icon: AlertCircle, color: 'bg-amber-50 text-amber-600', warning: true },
          { label: 'Spent This Month', value: formatCurrency(stats?.totalSpentThisMonth ?? 0), icon: CreditCard, color: 'bg-emerald-50 text-emerald-600', isCurrency: true },
        ].map((card) => (
          <div key={card.label} className={`flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm ${card.warning ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Active Orders */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-[15px] font-bold text-navy-900">Active Order Status</span>
              <Link to="/app/client/orders" className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-navy-900">
                View All Orders
              </Link>
            </div>
            <div className="p-5">
              {stats?.activeOrders?.length ? (
                stats.activeOrders.map((order) => {
                  const product = order.items[0]?.product?.name ?? 'Gasoil';
                  const step = order.status === 'PENDING' ? 1 : order.status === 'VALIDATED' ? 2 : order.status === 'DELIVERED' ? 4 : 1;
                  return (
                    <div key={order.id} className="mb-4 rounded-lg border border-slate-200 p-4 last:mb-0">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-navy-900">
                            {order.orderNumber} — <span className="text-fire-600">{product}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.deliveryLocation?.name || order.deliveryLocation?.address || '-'}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(order.requestedDeliveryDate)}</span>
                          </div>
                        </div>
                        <span className={cn('badge-client', statusBadgeClass[order.status] ?? 'badge-client-pending')}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <Timeline step={step} />
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-slate-500">No active orders.</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <span className="text-[15px] font-bold text-navy-900">Recent Orders</span>
              <Link to="/app/client/orders" className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-navy-900">
                View All
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Order #</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Product</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Qty</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Date</th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length ? (
                  recentOrders.map((order) => {
                    const product = order.items?.[0]?.product?.name ?? 'Gasoil';
                    const qty = order.items?.[0]?.quantity ?? 0;
                    return (
                      <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-5 py-3 text-xs font-bold text-navy-900">{order.orderNumber}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{product}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-slate-700">{qty.toLocaleString()}L</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{formatDate(order.createdAt)}</td>
                        <td className="px-5 py-3">
                          <span className={cn('badge-client', statusBadgeClass[order.status] ?? 'badge-client-pending')}>{order.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link to={`/app/client/orders/${order.id}`} className="text-xs font-semibold text-fire-600 hover:text-fire-700">
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                      No recent orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          <div className="rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 p-5 text-white shadow-md">
            <p className="text-sm font-bold">Need fuel?</p>
            <p className="mt-1 text-xs text-slate-400">Submit a new delivery request in under 2 minutes.</p>
            <Link to="/app/client/orders/new" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-fire-gradient py-2.5 text-sm font-bold text-white transition-all hover:brightness-110">
              <Plus className="h-4 w-4" /> Place New Order
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <span className="text-[15px] font-bold text-navy-900">Invoices</span>
            </div>
            <div className="p-4">
              {stats?.recentInvoices?.length ? (
                stats.recentInvoices.slice(0, 2).map((inv) => (
                  <div key={inv.id} className={cn('mb-3 rounded-lg border p-3 last:mb-0', inv.status === 'OVERDUE' ? 'border-red-200 bg-red-50' : inv.status === 'PAID' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200')}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={cn('text-xs font-bold', inv.status === 'OVERDUE' ? 'text-red-700' : 'text-navy-900')}>{inv.invoiceNumber}</div>
                        <div className="mt-0.5 text-[10px] text-slate-500">{formatDate(inv.issuedAt)}</div>
                      </div>
                      <span className={cn('badge-client', inv.status === 'PAID' ? 'badge-client-delivered' : inv.status === 'OVERDUE' ? 'badge-client-rejected' : 'badge-client-pending')}>{inv.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-navy-900">{formatCurrency(inv.totalAmount)}</span>
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="rounded-md bg-navy-900 px-3 py-1 text-xs font-semibold text-white">Download PDF</a>
                      )}
                    </div>
                    {inv.paymentDeadline && (
                      <div className={cn('mt-1 text-[10px] font-semibold', inv.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-500')}>Due: {formatDate(inv.paymentDeadline)}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-slate-500">No invoices yet.</p>
              )}
              <Link to="/app/client/invoices" className="mt-3 block text-center text-xs font-semibold text-fire-600 hover:text-fire-700">
                View all invoices →
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <span className="text-[15px] font-bold text-navy-900">Notifications</span>
            </div>
            <div>
              {(() => {
                const notes: { type: string; title: string; time: string }[] = [];
                stats?.activeOrders?.filter((o) => o.status === 'VALIDATED').slice(0, 2).forEach((o) => {
                  notes.push({ type: 'validated', title: `Order ${o.orderNumber} has been validated.`, time: formatDate(o.updatedAt) });
                });
                stats?.recentInvoices?.filter((i) => i.status === 'OVERDUE').slice(0, 2).forEach((i) => {
                  notes.push({ type: 'due', title: `Invoice ${i.invoiceNumber} is overdue.`, time: formatDate(i.paymentDeadline) });
                });
                stats?.activeOrders?.filter((o) => o.status === 'DELIVERED').slice(0, 2).forEach((o) => {
                  notes.push({ type: 'delivery', title: `Delivery confirmed for ${o.orderNumber}.`, time: formatDate(o.updatedAt) });
                });
                if (!notes.length) return <p className="p-4 text-sm text-slate-500">No new notifications.</p>;
                return notes.map((n, i) => (
                  <div key={i} className="flex gap-3 border-b border-slate-100 p-4 last:border-0">
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      n.type === 'validated' ? 'bg-blue-100 text-blue-600' : n.type === 'due' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      {n.type === 'validated' ? <CheckCircle className="h-4 w-4" /> : n.type === 'due' ? <AlertCircle className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{n.title}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{n.time}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Timeline({ step }: { step: number }) {
  const stages = ['Submitted', 'Validated', 'In Transit', 'Delivered'];
  return (
    <div className="flex">
      {stages.map((s, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <div key={s} className="relative flex-1 text-center">
            {i > 0 && <div className={cn('absolute left-0 top-[9px] h-[2px] w-full', done ? 'bg-emerald-200' : 'bg-slate-200')} />}
            <div className={cn(
              'relative z-10 mx-auto flex h-5 w-5 items-center justify-center rounded-full border-2 text-[9px] font-bold',
              done ? 'border-emerald-400 bg-emerald-100 text-emerald-600' : current ? 'border-amber-400 bg-amber-100 text-amber-600' : 'border-slate-200 bg-slate-100 text-slate-400'
            )}>
              {done ? '✓' : i + 1}
            </div>
            <div className={cn('mt-1 text-[10px] font-medium', done ? 'text-emerald-600' : current ? 'text-amber-600' : 'text-slate-400')}>{s}</div>
          </div>
        );
      })}
    </div>
  );
}
