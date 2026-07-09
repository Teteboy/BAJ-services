import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, CreditCard, CheckCircle, AlertCircle, Clock, ArrowRight, FileText, Plus } from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, statusColor } from '@/lib/utils';
import type { Order } from '@/types';

interface ClientDashboardStats {
  pendingOrders: number;
  validatedOrders: number;
  deliveredOrders: number;
  unpaidInvoices: number;
  totalSpentThisMonth: number;
  recentOrders: Order[];
}

export default function ClientDashboardPage() {
  const { showToast } = useToast();
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

  const kpiCards = [
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders ?? 0,
      icon: Clock,
      color: 'bg-amber-500/15 text-amber-400',
      border: 'border-l-4 border-amber-500',
      link: '/app/client/orders',
    },
    {
      label: 'Validated Orders',
      value: stats?.validatedOrders ?? 0,
      icon: CheckCircle,
      color: 'bg-brand-600/15 text-brand-400',
      border: 'border-l-4 border-brand-500',
      link: '/app/client/orders',
    },
    {
      label: 'Spent This Month',
      value: formatCurrency(stats?.totalSpentThisMonth ?? 0),
      icon: CreditCard,
      color: 'bg-emerald-500/15 text-emerald-400',
      border: 'border-l-4 border-emerald-500',
      link: '/app/client/invoices',
    },
    {
      label: 'Unpaid Invoices',
      value: stats?.unpaidInvoices ?? 0,
      icon: AlertCircle,
      color: 'bg-red-500/15 text-red-400',
      border: 'border-l-4 border-red-500',
      link: '/app/client/invoices',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        subtitle={`Overview for ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
        action={
          <Link
            to="/app/client/orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow-sm hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New Order
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Link key={card.label} to={card.link} className="group block">
            <Card className={`transition-all duration-300 group-hover:shadow-card-hover group-hover:border-brand-600/40 ${card.border}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-surface-900">{card.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/app/client/orders" className="flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.recentOrders?.length ? (
            <div className="divide-y divide-surface-200">
              {stats.recentOrders.map((order) => {
                const total = order.items?.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0) ?? 0;
                return (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-100">
                    <div className="min-w-0">
                      <p className="font-semibold text-surface-900">{order.orderNumber}</p>
                      <p className="text-xs text-surface-500">{formatDate(order.createdAt)} · {order.items?.length ?? 0} item(s)</p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <p className="whitespace-nowrap font-medium text-surface-700">{formatCurrency(total)}</p>
                      <Badge variant={statusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-surface-400">
              <ShoppingCart className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No orders yet. Place your first order!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Place New Order', to: '/app/client/orders/new', icon: Plus },
              { label: 'My Orders', to: '/app/client/orders', icon: ShoppingCart },
              { label: 'My Invoices', to: '/app/client/invoices', icon: FileText },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center gap-3 rounded-xl border border-surface-300 bg-white p-4 transition-all duration-200 hover:border-brand-400 hover:bg-brand-50"
              >
                <a.icon className="h-5 w-5 text-brand-600" />
                <span className="text-sm font-medium text-surface-700">{a.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-surface-400" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
