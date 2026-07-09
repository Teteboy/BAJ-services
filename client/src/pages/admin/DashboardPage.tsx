import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Package, ShoppingCart, AlertTriangle,
  TrendingUp, CheckCircle, Clock, ArrowRight, Truck,
} from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, statusColor } from '@/lib/utils';

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
    items: Array<{ pricePerUnit: number; quantity: number }>;
  }>;
  ordersTrend: Array<{ date: string; count: number }>;
}

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
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders ?? 0,
      icon: ShoppingCart,
      color: 'bg-amber-500/15 text-amber-400',
      border: 'border-l-4 border-amber-500',
      link: '/app/orders',
    },
    {
      label: 'Upcoming Deliveries',
      value: stats?.upcomingDeliveries ?? 0,
      icon: Truck,
      color: 'bg-brand-600/15 text-brand-400',
      border: 'border-l-4 border-brand-500',
      link: '/app/orders',
    },
    {
      label: 'Revenue This Month',
      value: formatCurrency(stats?.totalRevenueThisMonth ?? 0),
      icon: DollarSign,
      color: 'bg-emerald-500/15 text-emerald-400',
      border: 'border-l-4 border-emerald-500',
      link: '/app/invoices',
    },
    {
      label: 'Overdue Payments',
      value: formatCurrency(stats?.overduePayments ?? 0),
      icon: AlertTriangle,
      color: 'bg-red-500/15 text-red-400',
      border: 'border-l-4 border-red-500',
      link: '/app/invoices',
    },
  ];

  const statusSummary = [
    { label: 'Completed Deliveries', value: stats?.completedDeliveries ?? 0, icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Pending Payments', value: formatCurrency(stats?.pendingPayments ?? 0), icon: Clock, color: 'text-amber-400' },
    { label: 'Revenue Trend', value: '30-day window', icon: TrendingUp, color: 'text-brand-400' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
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

      {/* Secondary stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        {statusSummary.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-surface-500">{s.label}</p>
                <p className="text-lg font-bold text-surface-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/app/orders" className="flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.recentOrders?.length ? (
            <div className="divide-y divide-surface-200">
              {stats.recentOrders.map((order) => {
                const total = order.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
                return (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-100">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-surface-900">{order.client.companyName}</p>
                      <p className="text-xs text-surface-500">{order.orderNumber} · {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-3 text-right">
                      <p className="whitespace-nowrap font-medium text-surface-700">{formatCurrency(total)}</p>
                      <Badge variant={statusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-surface-400">
              <Package className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No recent orders yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Manage Orders', to: '/app/orders', icon: ShoppingCart },
              { label: 'View Invoices', to: '/app/invoices', icon: DollarSign },
              { label: 'Manage Clients', to: '/app/clients', icon: Package },
              { label: 'Stock Overview', to: '/app/stock', icon: Truck },
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
