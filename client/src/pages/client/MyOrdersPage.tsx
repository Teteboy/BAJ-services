import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency, formatDate, formatDateTime, exportToCSV, downloadFile } from '@/lib/utils';
import type { Order } from '@/types';

const FILTERS = ['All', 'Pending', 'Validated', 'Delivered', 'Rejected'] as const;

const statusBadgeClass: Record<string, string> = {
  PENDING: 'badge-client-pending',
  VALIDATED: 'badge-client-validated',
  DELIVERED: 'badge-client-delivered',
  REJECTED: 'badge-client-rejected',
  MODIFIED: 'badge-client-pending',
};

export default function MyOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await get<{ data: Order[]; total: number }>('/orders');
        setOrders(res.data);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [showToast]);

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const filtered = filter === 'All' ? orders : orders.filter((o) => o.status === filter.toUpperCase());

  const orderTotal = (o: Order) => o.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
  const orderVolume = (o: Order) => o.items.reduce((s, i) => s + i.quantity, 0);

  const exportOrders = () => {
    const headers = ['Order #', 'Product', 'Qty', 'Location', 'Requested Date', 'Status', 'Total'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.items[0]?.product?.name ?? '-',
      orderVolume(o).toString(),
      o.deliveryLocation?.name || o.deliveryLocation?.address || '-',
      formatDate(o.requestedDeliveryDate),
      o.status,
      orderTotal(o).toString(),
    ]);
    exportToCSV(headers, rows, 'my_orders.csv');
  };

  const downloadOrderInvoice = (o: Order) => {
    if (o.invoice?.pdfUrl) downloadFile(o.invoice.pdfUrl, `${o.invoice.invoiceNumber ?? o.orderNumber}.pdf`);
    else showToast('Invoice PDF not available yet', 'error');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-navy-900">My Orders</h1>
        <Link to="/app/client/orders/new">
          <Button className="bg-fire-gradient"><Plus className="mr-1 h-4 w-4" /> New Order</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg border px-4 py-2 text-xs font-semibold transition-all',
              filter === f
                ? 'border-navy-900 bg-navy-100 text-navy-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="text-[15px] font-bold text-navy-900">All Orders</span>
          <div className="flex items-center gap-2">
            <button onClick={exportOrders} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <FileDown className="h-3.5 w-3.5" /> Export CSV
            </button>
            <span className="text-xs text-slate-500">{filtered.length} records shown</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Requested Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Delivered On</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((order) => {
                  const product = order.items[0]?.product?.name ?? 'Gasoil';
                  const qty = order.items[0]?.quantity ?? 0;
                  return (
                    <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-bold text-navy-900">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{qty.toLocaleString()}L</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{order.deliveryLocation?.name || order.deliveryLocation?.address || 'Nouadhibou Port'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(order.requestedDeliveryDate)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{order.status === 'DELIVERED' ? formatDate(order.updatedAt) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('badge-client', statusBadgeClass[order.status] ?? 'badge-client-pending')}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelected(order)} className="text-xs font-semibold text-fire-600 hover:text-fire-700">
                          Details
                        </button>
                        {order.status === 'DELIVERED' && (
                          <button onClick={() => downloadOrderInvoice(order)} className="ml-3 text-xs font-semibold text-slate-500 hover:text-navy-900">
                            <FileDown className="inline h-3.5 w-3.5" /> Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {orders.length} orders</span>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button className="rounded-lg border border-slate-200 bg-navy-100 px-3 py-1.5 text-xs font-semibold text-navy-900">1</button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">2</button>
            <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Next <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Order ${selected.orderNumber}`}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div><p className="text-xs font-semibold uppercase text-slate-400">Status</p><p className="mt-0.5 font-medium">{selected.status}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Total</p><p className="mt-0.5 font-medium">{formatCurrency(orderTotal(selected))}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Requested Delivery</p><p className="mt-0.5">{formatDateTime(selected.requestedDeliveryDate)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Delivery Location</p><p className="mt-0.5">{selected.deliveryLocation?.name || selected.deliveryLocation?.address || '-'}</p></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Product</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Price</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selected.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium">{item.product.name}</td>
                      <td className="px-3 py-2 text-right">{item.quantity.toLocaleString()} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.pricePerUnit * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
