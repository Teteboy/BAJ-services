import { useEffect, useState } from 'react';
import { Search, Plus, ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertTriangle, MessageSquare, Download } from 'lucide-react';
import { get, patch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency, formatDate, formatDateTime, exportToCSV, downloadFile } from '@/lib/utils';
import type { Order } from '@/types';

const STATUS_OPTIONS = ['All', 'Pending', 'Validated', 'Modified', 'Delivered', 'Rejected'] as const;

const statusBadgeClass: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  VALIDATED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  MODIFIED: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [modNote, setModNote] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showMod, setShowMod] = useState(false);

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

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    let list = [...orders];
    if (statusFilter !== 'All') list = list.filter((o) => o.status === statusFilter.toUpperCase());
    if (search) list = list.filter((o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.client.companyName.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
    setPage(1);
  }, [orders, search, statusFilter]);

  const updateStatus = async (orderId: string, status: string, extra: Record<string, string> = {}) => {
    setUpdating(true);
    try {
      await patch(`/orders/${orderId}/status`, { status, ...extra });
      showToast(`Order ${status.toLowerCase()}`, 'success');
      setSelectedOrder(null);
      setShowReject(false);
      setShowMod(false);
      setRejectNote('');
      setModNote('');
      await fetchOrders();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const orderTotal = (order: Order) => order.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
  const orderVolume = (order: Order) => order.items.reduce((s, i) => s + i.quantity, 0);

  const counts = {
    pending: orders.filter((o) => o.status === 'PENDING').length,
    validated: orders.filter((o) => o.status === 'VALIDATED').length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    rejected: orders.filter((o) => o.status === 'REJECTED').length,
  };

  const exportOrders = () => {
    const headers = ['Order #', 'Client', 'Product', 'Volume', 'Amount', 'Status', 'Delivery Date'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.client.companyName,
      o.items[0]?.product?.name ?? 'Gasoil',
      orderVolume(o).toString(),
      orderTotal(o).toString(),
      o.status,
      formatDate(o.requestedDeliveryDate),
    ]);
    exportToCSV(headers, rows, 'orders.csv');
  };

  const downloadOrderInvoice = (o: Order) => {
    if (o.invoice?.pdfUrl) downloadFile(o.invoice.pdfUrl, `${o.invoice.invoiceNumber ?? o.orderNumber}.pdf`);
    else showToast('Invoice PDF not available yet', 'error');
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportOrders} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
            <Plus className="h-4 w-4" /> New Order
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
        {[
          { label: 'Pending Validation', value: counts.pending, icon: CheckCircle, color: 'text-amber-400' },
          { label: 'Validated Today', value: counts.validated, icon: CheckCircle, color: 'text-blue-400' },
          { label: 'Delivered', value: counts.delivered, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-400' },
          { label: 'Total Orders', value: orders.length, icon: CheckCircle, color: 'text-slate-400' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-admin-border bg-admin-card p-5">
            <div>
              <p className="text-[11px] font-medium text-admin-textSub">{card.label}</p>
              <p className="mt-1 text-[26px] font-bold leading-none text-admin-text">{card.value}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5">
              <card.icon className={cn('h-5 w-5', card.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-textSub" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or client..."
            className="w-full rounded-lg border border-admin-border bg-admin-card py-2 pl-9 pr-4 text-sm text-admin-text placeholder:text-admin-textSub focus:border-blue-500 focus:outline-none sm:w-80"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                statusFilter === s
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-admin-border bg-admin-card text-admin-textSub hover:border-slate-600 hover:text-admin-text'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4">
          <span className="text-[15px] font-semibold text-admin-text">All Orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Product</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Volume</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((order) => {
                  const product = order.items[0]?.product?.name ?? 'Gasoil';
                  return (
                    <tr key={order.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-sm font-semibold text-admin-text">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-admin-textMuted">{order.client.companyName}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-sm text-admin-textMuted">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{product}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-admin-textMuted font-tabular-nums">{orderVolume(order).toLocaleString()} L</td>
                      <td className="px-4 py-3 text-sm text-admin-textMuted">{formatDate(order.requestedDeliveryDate)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', statusBadgeClass[order.status] ?? statusBadgeClass.PENDING)}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedOrder(order)} className="flex items-center gap-1 rounded-lg border border-admin-border px-2.5 py-1.5 text-xs font-semibold text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                            Manage
                          </button>
                          {order.status === 'DELIVERED' && (
                            <button onClick={() => downloadOrderInvoice(order)} className="flex items-center gap-1 rounded-lg border border-admin-border px-2.5 py-1.5 text-xs font-semibold text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                              <Download className="h-3.5 w-3.5" /> Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-admin-textSub">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-textSub">Showing {filtered.length} orders</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">
              <ArrowLeft className="h-3 w-3" /> Prev
            </button>
            <button className="rounded-lg border border-admin-border bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">{page}</button>
            <button onClick={() => setPage(Math.min(Math.ceil(filtered.length / PAGE_SIZE), page + 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">
              Next <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder.orderNumber}`} variant="dark">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-800/50 p-4">
              <div><p className="text-xs font-semibold uppercase text-slate-500">Client</p><p className="mt-0.5 font-semibold text-slate-200">{selectedOrder.client.companyName}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Status</p><p className="mt-0.5">{selectedOrder.status}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Requested Delivery</p><p className="mt-0.5">{formatDateTime(selectedOrder.requestedDeliveryDate)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Delivery Location</p><p className="mt-0.5">{selectedOrder.deliveryLocation?.name || selectedOrder.deliveryLocation?.address || '-'}</p></div>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-400">Product</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-400">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-400">Price</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium">{item.product.name}</td>
                      <td className="px-3 py-2 text-right">{item.quantity.toLocaleString()} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.pricePerUnit * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-slate-400">Grand Total</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-200">{formatCurrency(orderTotal(selectedOrder))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedOrder.status === 'PENDING' && (
                <>
                  <Button isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'VALIDATED')} className="bg-blue-600">
                    <CheckCircle className="mr-1 h-4 w-4" /> Validate Order
                  </Button>
                  <Button variant="outline" onClick={() => setShowMod(true)}>
                    <AlertTriangle className="mr-1 h-4 w-4" /> Request Modification
                  </Button>
                  <Button variant="danger" onClick={() => setShowReject(true)}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </>
              )}
              {selectedOrder.status === 'VALIDATED' && (
                <Button isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'DELIVERED')} className="bg-emerald-600">
                  <CheckCircle className="mr-1 h-4 w-4" /> Confirm Delivery
                </Button>
              )}
              {selectedOrder.status === 'MODIFIED' && (
                <Button isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'VALIDATED')} className="bg-blue-600">
                  <CheckCircle className="mr-1 h-4 w-4" /> Validate Modified Order
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showReject && selectedOrder && (
        <Modal isOpen={showReject} onClose={() => setShowReject(false)} title="Reject Order" variant="dark">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Please provide a reason for rejecting order <strong className="text-slate-200">{selectedOrder.orderNumber}</strong>.</p>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Explain why this order is being rejected..."
            />
            <div className="flex justify-end">
              <Button variant="danger" isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'REJECTED', { rejectionReason: rejectNote })}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showMod && selectedOrder && (
        <Modal isOpen={showMod} onClose={() => setShowMod(false)} title="Request Modification" variant="dark">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Describe what needs to be modified in order <strong className="text-slate-200">{selectedOrder.orderNumber}</strong>.</p>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              rows={3}
              value={modNote}
              onChange={(e) => setModNote(e.target.value)}
              placeholder="Describe the required changes..."
            />
            <div className="flex justify-end">
              <Button variant="outline" isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'MODIFIED', { modificationNote: modNote })}>
                <MessageSquare className="mr-1 h-4 w-4" /> Send Modification Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
