import { useEffect, useState } from 'react';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, Payment } from '@/types';

const METHOD_OPTIONS = [
  { value: 'VIREMENT', label: 'Virement (Bank Transfer)' },
  { value: 'CHEQUE', label: 'Chèque' },
];

export default function PaymentsPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ invoiceId: '', amount: '', method: 'VIREMENT', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [inv, pay] = await Promise.all([
        get<{ data: Invoice[] }>('/invoices'),
        get<{ data: Payment[] }>('/payments'),
      ]);
      setInvoices(inv.data);
      setPayments(pay.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoiceId || !form.amount) return;
    setSubmitting(true);
    try {
      await post('/payments', { ...form, amount: Number(form.amount) });
      showToast('Payment recorded successfully', 'success');
      setIsOpen(false);
      setForm({ invoiceId: '', amount: '', method: 'VIREMENT', reference: '' });
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID');
  const invoiceOptions = [
    { value: '', label: 'Select invoice...' },
    ...unpaidInvoices.map((i) => ({
      value: i.id,
      label: `${i.invoiceNumber} — ${i.client?.companyName ?? '-'} (${formatCurrency(i.totalAmount)})`,
    })),
  ];

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const filteredPayments = search
    ? payments.filter((p) =>
        p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        p.method?.toLowerCase().includes(search.toLowerCase()) ||
        (p.reference ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const selectedInvoice = invoices.find((i) => i.id === form.invoiceId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        subtitle={`${payments.length} payments recorded`}
        action={
          <Button onClick={() => setIsOpen(true)} disabled={unpaidInvoices.length === 0}>
            + Record Payment
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-emerald-400">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Collected</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-400">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Unpaid Invoices</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{unpaidInvoices.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-400">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Outstanding Amount</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(unpaidInvoices.reduce((s, i) => s + i.totalAmount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Search by invoice #, method, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredPayments.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Invoice #</TableHeader>
                  <TableHeader>Client</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Reference</TableHeader>
                  <TableHeader>Paid On</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-brand-700">
                      {p.invoice?.invoiceNumber ?? '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.invoice?.client?.companyName ?? '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="info">{p.method?.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{p.reference ?? '-'}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(p.paidAt ?? p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No payments found" />
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Record Payment"
        footer={
          <Button type="submit" form="payment-form" isLoading={submitting} disabled={!form.invoiceId || !form.amount}>
            Save Payment
          </Button>
        }
      >
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Invoice *"
            required
            options={invoiceOptions}
            value={form.invoiceId}
            onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
          />
          {selectedInvoice && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-800">{selectedInvoice.client?.companyName}</p>
              <p className="text-blue-600">Total: {formatCurrency(selectedInvoice.totalAmount)} · Due: {formatDate(selectedInvoice.paymentDeadline)}</p>
            </div>
          )}
          <Input
            label="Amount (XAF) *"
            type="number"
            required
            min={1}
            placeholder={selectedInvoice ? String(selectedInvoice.totalAmount) : '0'}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select
            label="Payment Method *"
            required
            options={METHOD_OPTIONS}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          />
          <Input
            label="Reference / Cheque No."
            placeholder="Optional reference number"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
