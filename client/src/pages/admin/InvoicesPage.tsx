import { useEffect, useState } from 'react';
import { get, patch, getErrorMessage } from '@/lib/api';
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
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate, formatDateTime, invoiceStatusColor } from '@/lib/utils';
import type { Invoice } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await get<{ data: Invoice[]; total: number }>('/invoices');
      setInvoices(res.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  useEffect(() => {
    let list = [...invoices];
    if (statusFilter) list = list.filter((i) => i.status === statusFilter);
    if (search) list = list.filter((i) =>
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (i.client?.companyName ?? '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
    setPage(1);
  }, [invoices, search, statusFilter]);

  const markPaid = async (invoiceId: string) => {
    setMarking(true);
    try {
      await patch(`/invoices/${invoiceId}/status`, { status: 'PAID' });
      showToast('Invoice marked as paid', 'success');
      setSelected(null);
      await fetchInvoices();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Invoices" subtitle={`${invoices.length} invoices`} />

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'border-l-4 border-emerald-400' },
          { label: 'Outstanding', value: formatCurrency(totalPending), color: 'border-l-4 border-amber-400' },
          { label: 'Overdue', value: invoices.filter((i) => i.status === 'OVERDUE').length, color: 'border-l-4 border-red-500' },
        ].map((s) => (
          <Card key={s.label} className={s.color}>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-surface-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search invoice # or client..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
            <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[160px]" />
            {(search || statusFilter) && <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear</Button>}
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
                    <TableHeader>Invoice #</TableHeader>
                    <TableHeader>Client</TableHeader>
                    <TableHeader>Order #</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Issued</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((inv) => (
                    <TableRow key={inv.id} className="cursor-pointer" onClick={() => setSelected(inv)}>
                      <TableCell className="font-semibold text-brand-600">{inv.invoiceNumber}</TableCell>
                      <TableCell className="font-medium text-surface-900">{inv.client?.companyName ?? '-'}</TableCell>
                      <TableCell className="text-surface-500">{inv.order?.orderNumber ?? '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell><Badge variant={invoiceStatusColor(inv.status)}>{inv.status}</Badge></TableCell>
                      <TableCell className={inv.status === 'OVERDUE' ? 'font-medium text-red-600' : ''}>{formatDate(inv.paymentDeadline)}</TableCell>
                      <TableCell className="text-surface-500">{formatDate(inv.issuedAt)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(inv); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} className="px-4 pb-4" />
            </>
          ) : (
            <EmptyState message="No invoices match your filters" />
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
              Invoice <span className="font-mono text-brand-700">{selected.invoiceNumber}</span>
              <Badge variant={invoiceStatusColor(selected.status)}>{selected.status}</Badge>
            </span>
          }
          footer={
            <div className="flex gap-2">
              {selected.pdfUrl && (
                <a href={selected.pdfUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline">Download PDF</Button>
                </a>
              )}
              {selected.status !== 'PAID' && (
                <Button isLoading={marking} onClick={() => markPaid(selected.id)}>
                  Mark as Paid
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-100 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Client</p>
                <p className="mt-0.5 font-semibold text-surface-900">{selected.client?.companyName ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Order #</p>
                <p className="mt-0.5 text-surface-700">{selected.order?.orderNumber ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Payment Method</p>
                <p className="mt-0.5 text-surface-700">{selected.paymentMethod ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Due Date</p>
                <p className={`mt-0.5 font-medium ${selected.status === 'OVERDUE' ? 'text-red-600' : 'text-surface-700'}`}>
                  {formatDate(selected.paymentDeadline)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-surface-500">Issued</p>
                <p className="mt-0.5 text-surface-700">{formatDateTime(selected.issuedAt)}</p>
              </div>
              {selected.paidAt && (
                <div>
                  <p className="text-xs font-semibold uppercase text-surface-500">Paid On</p>
                  <p className="mt-0.5 font-medium text-emerald-600">{formatDateTime(selected.paidAt)}</p>
                </div>
              )}
            </div>

            {/* Invoice Items */}
            {selected.items && selected.items.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-surface-500">Invoice Items</p>
                <div className="overflow-hidden rounded-xl border border-surface-300">
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
                      {selected.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium text-surface-900">{item.product?.name ?? '-'}</td>
                          <td className="px-4 py-2 text-right text-surface-700">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-surface-500">{item.unit}</td>
                          <td className="px-4 py-2 text-right text-surface-700">{formatCurrency(item.pricePerUnit)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-surface-900">{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-100">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right font-bold text-surface-600">Total Amount</td>
                        <td className="px-4 py-2 text-right font-bold text-surface-900">{formatCurrency(selected.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Payment History */}
            {selected.payments && selected.payments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-surface-500">Payment History</p>
                <div className="space-y-2">
                  {selected.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3">
                      <div>
                        <p className="font-semibold text-emerald-700">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-emerald-600">{p.method} {p.reference ? `· Ref: ${p.reference}` : ''}</p>
                      </div>
                      <p className="text-xs text-emerald-600">{formatDate(p.paidAt ?? p.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
