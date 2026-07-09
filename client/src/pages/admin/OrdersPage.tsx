import { useEffect, useState } from 'react';
import { get, patch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate, formatDateTime, statusColor } from '@/lib/utils';
import type { Order } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VALIDATED', label: 'Validated' },
  { value: 'MODIFIED', label: 'Modified' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DELIVERED', label: 'Delivered' },
];

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtered, setFiltered] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
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

  const orderTotal = (order: Order) =>
    order.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total orders`}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search by order # or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:max-w-[180px]"
            />
            {(search || statusFilter) && (
              <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter(''); }}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length ? (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Order #</TableHeader>
                    <TableHeader>Client</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Delivery Date</TableHeader>
                    <TableHeader>Total</TableHeader>
                    <TableHeader>Placed</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-semibold text-brand-600">{order.orderNumber}</TableCell>
                      <TableCell className="font-medium text-surface-900">{order.client.companyName}</TableCell>
                      <TableCell><Badge variant={statusColor(order.status)}>{order.status}</Badge></TableCell>
                      <TableCell>{formatDate(order.requestedDeliveryDate)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(orderTotal(order))}</TableCell>
                      <TableCell className="text-surface-500">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
                onPageChange={setPage}
                className="px-4 pb-4"
              />
            </>
          ) : (
            <EmptyState message="No orders match your filters" />
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={
            <span className="flex items-center gap-2">
              Order <span className="font-mono text-brand-700">{selectedOrder.orderNumber}</span>
              <Badge variant={statusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
            </span>
          }
          footer={
            <div className="flex flex-wrap gap-2">
              {selectedOrder.status === 'PENDING' && (
                <>
                  <Button isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'VALIDATED')}>
                    Validate Order
                  </Button>
                  <Button variant="outline" onClick={() => setShowMod(true)}>
                    Request Modification
                  </Button>
                  <Button variant="danger" onClick={() => setShowReject(true)}>
                    Reject
                  </Button>
                </>
              )}
              {selectedOrder.status === 'VALIDATED' && (
                <Button isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'DELIVERED')}>
                  Confirm Delivery
                </Button>
              )}
              {selectedOrder.status === 'MODIFIED' && (
                <Button isLoading={updating} onClick={() => updateStatus(selectedOrder.id, 'VALIDATED')}>
                  Validate Modified Order
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Client + Contact */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-surface-100 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Client</p>
                <p className="mt-0.5 font-semibold text-surface-900">{selectedOrder.client.companyName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Contact Person</p>
                <p className="mt-0.5 text-surface-700">{selectedOrder.contactPerson ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Contact Phone</p>
                <p className="mt-0.5 text-surface-700">{selectedOrder.contactPhone ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Requested Delivery</p>
                <p className="mt-0.5 text-surface-700">{formatDateTime(selectedOrder.requestedDeliveryDate)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase text-surface-500">Delivery Location</p>
                <p className="mt-0.5 text-surface-700">
                  {selectedOrder.deliveryLocation
                    ? `${selectedOrder.deliveryLocation.name ?? ''} — ${selectedOrder.deliveryLocation.address}`
                    : '-'}
                </p>
              </div>
              {selectedOrder.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase text-surface-500">Notes</p>
                  <p className="mt-0.5 text-surface-700">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-surface-500">Order Items</p>
              <div className="overflow-hidden rounded-lg border border-surface-300">
                <table className="w-full text-sm">
                  <thead className="bg-surface-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-surface-500">Product</th>
                      <th className="px-4 py-2 text-right font-semibold text-surface-500">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold text-surface-500">Unit</th>
                      <th className="px-4 py-2 text-right font-semibold text-surface-500">Price/Unit</th>
                      <th className="px-4 py-2 text-right font-semibold text-surface-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 font-medium text-surface-900">{item.product.name}</td>
                        <td className="px-4 py-2 text-right text-surface-700">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-surface-500">{item.unit}</td>
                        <td className="px-4 py-2 text-right text-surface-700">{formatCurrency(item.pricePerUnit)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-surface-900">{formatCurrency(item.pricePerUnit * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-100">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right font-bold text-surface-600">Grand Total</td>
                      <td className="px-4 py-2 text-right font-bold text-surface-900">{formatCurrency(orderTotal(selectedOrder))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedOrder.rejectionReason && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs font-semibold uppercase text-red-600">Rejection Reason</p>
                <p className="mt-1 text-red-800">{selectedOrder.rejectionReason}</p>
              </div>
            )}
            {selectedOrder.modificationNote && (
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase text-amber-600">Modification Note</p>
                <p className="mt-1 text-amber-800">{selectedOrder.modificationNote}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Dialog */}
      {showReject && selectedOrder && (
        <Modal
          isOpen={showReject}
          onClose={() => setShowReject(false)}
          title="Reject Order"
          footer={
            <Button
              variant="danger"
              isLoading={updating}
              onClick={() => updateStatus(selectedOrder.id, 'REJECTED', { rejectionReason: rejectNote })}
            >
              Confirm Rejection
            </Button>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-surface-600">Please provide a reason for rejecting order <strong>{selectedOrder.orderNumber}</strong>.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">Rejection Reason *</label>
              <textarea
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Explain why this order is being rejected..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modification Dialog */}
      {showMod && selectedOrder && (
        <Modal
          isOpen={showMod}
          onClose={() => setShowMod(false)}
          title="Request Modification"
          footer={
            <Button
              variant="outline"
              isLoading={updating}
              onClick={() => updateStatus(selectedOrder.id, 'MODIFIED', { modificationNote: modNote })}
            >
              Send Modification Request
            </Button>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-surface-600">Describe what needs to be modified in order <strong>{selectedOrder.orderNumber}</strong>.</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-surface-700">Modification Note *</label>
              <textarea
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                rows={3}
                value={modNote}
                onChange={(e) => setModNote(e.target.value)}
                placeholder="Describe the required changes..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
