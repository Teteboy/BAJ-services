import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
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

const STATUS_STEPS = ['PENDING', 'VALIDATED', 'DELIVERED'];

export default function MyOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search && !o.orderNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const orderTotal = (o: Order) => o.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);

  const stepIndex = (status: string) => {
    if (status === 'DELIVERED') return 2;
    if (status === 'VALIDATED') return 1;
    return 0;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Orders"
        subtitle={`${orders.length} total orders`}
        action={
          <Link to="/app/client/orders/new">
            <Button><Plus className="mr-1 h-4 w-4" /> New Order</Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search order #..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[180px]" />
            {(search || statusFilter) && <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Order #</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Items</TableHeader>
                  <TableHeader>Total</TableHeader>
                  <TableHeader>Requested Delivery</TableHeader>
                  <TableHeader>Placed</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelected(order)}>
                    <TableCell className="font-semibold text-brand-700">{order.orderNumber}</TableCell>
                    <TableCell><Badge variant={statusColor(order.status)}>{order.status}</Badge></TableCell>
                    <TableCell className="text-gray-500">{order.items.length} item(s)</TableCell>
                    <TableCell className="font-medium">{formatCurrency(orderTotal(order))}</TableCell>
                    <TableCell>{formatDate(order.requestedDeliveryDate)}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(order); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No orders found" />
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={
            <span className="flex items-center gap-2">
              Order <span className="font-mono text-brand-700">{selected.orderNumber}</span>
              <Badge variant={statusColor(selected.status)}>{selected.status}</Badge>
            </span>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Status Timeline */}
            {!['REJECTED', 'MODIFIED'].includes(selected.status) && (
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-6 py-4">
                {STATUS_STEPS.map((step, idx) => {
                  const done = stepIndex(selected.status) >= idx;
                  return (
                    <div key={step} className="flex flex-1 flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <p className={`mt-1 text-xs ${done ? 'font-semibold text-brand-700' : 'text-gray-400'}`}>{step}</p>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`absolute mt-4 h-0.5 w-1/4 ${done ? 'bg-brand-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {selected.status === 'REJECTED' && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="font-semibold text-red-700">Order Rejected</p>
                {selected.rejectionReason && <p className="mt-1 text-red-600">{selected.rejectionReason}</p>}
              </div>
            )}
            {selected.status === 'MODIFIED' && (
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="font-semibold text-amber-700">Modification Requested</p>
                {selected.modificationNote && <p className="mt-1 text-amber-600">{selected.modificationNote}</p>}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Requested Delivery</p>
                <p className="mt-0.5 font-medium">{formatDateTime(selected.requestedDeliveryDate)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Delivery Location</p>
                <p className="mt-0.5">
                  {selected.deliveryLocation
                    ? `${selected.deliveryLocation.name ?? ''} — ${selected.deliveryLocation.address}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Contact Person</p>
                <p className="mt-0.5">{selected.contactPerson ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Contact Phone</p>
                <p className="mt-0.5">{selected.contactPhone ?? '-'}</p>
              </div>
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase text-gray-400">Notes</p>
                  <p className="mt-0.5 text-gray-600">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Order Items</p>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Unit</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Price/Unit</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 font-medium">{item.product.name}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{item.unit}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.pricePerUnit * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-700">Total</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(orderTotal(selected))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
