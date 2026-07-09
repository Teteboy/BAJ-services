import { useEffect, useState } from 'react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { formatCurrency, formatDate, formatDateTime, invoiceStatusColor } from '@/lib/utils';
import type { Invoice } from '@/types';

export default function ClientInvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchInvoices();
  }, [showToast]);

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const totalDue = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-4">
      <PageHeader title="My Invoices" subtitle={`${invoices.length} invoices`} />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-emerald-400">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase text-gray-500">Total Paid</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-400">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase text-gray-500">Outstanding</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalDue)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-400">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase text-gray-500">Overdue</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{invoices.filter((i) => i.status === 'OVERDUE').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {invoices.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Invoice #</TableHeader>
                  <TableHeader>Order #</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Issued</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelected(inv)}>
                    <TableCell className="font-semibold text-brand-700">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-gray-500">{inv.order?.orderNumber ?? '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={invoiceStatusColor(inv.status)}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(inv.issuedAt)}</TableCell>
                    <TableCell className={inv.status === 'OVERDUE' ? 'font-medium text-red-600' : ''}>
                      {formatDate(inv.paymentDeadline)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(inv); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No invoices found" />
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
            selected.pdfUrl ? (
              <a href={selected.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Download PDF</Button>
              </a>
            ) : undefined
          }
        >
          <div className="space-y-4 text-sm">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Order #</p>
                <p className="mt-0.5 font-medium">{selected.order?.orderNumber ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Payment Method</p>
                <p className="mt-0.5">{selected.paymentMethod ?? 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Issued On</p>
                <p className="mt-0.5">{formatDateTime(selected.issuedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">Due Date</p>
                <p className={`mt-0.5 font-medium ${selected.status === 'OVERDUE' ? 'text-red-600' : ''}`}>
                  {formatDate(selected.paymentDeadline)}
                </p>
              </div>
              {selected.paidAt && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase text-gray-400">Paid On</p>
                  <p className="mt-0.5 font-semibold text-emerald-700">{formatDateTime(selected.paidAt)}</p>
                </div>
              )}
            </div>

            {selected.status === 'OVERDUE' && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="font-semibold text-red-700">Payment Overdue</p>
                <p className="mt-1 text-sm text-red-600">
                  This invoice is past its due date. Please contact BAJ Services to arrange payment.
                </p>
              </div>
            )}

            {/* Items */}
            {selected.items && selected.items.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Invoice Items</p>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Qty</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Unit</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Price/L</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selected.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium">{item.product?.name ?? '-'}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-500">{item.unit}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                          <td className="px-4 py-2 text-right font-semibold">{formatCurrency(item.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-700">Total</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(selected.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Payments */}
            {selected.payments && selected.payments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Payment History</p>
                <div className="space-y-2">
                  {selected.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-2">
                      <div>
                        <p className="font-medium text-emerald-800">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-emerald-600">{p.method?.replace('_', ' ')} {p.reference ? `· Ref: ${p.reference}` : ''}</p>
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
