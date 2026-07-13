import { useEffect, useState } from 'react';
import { Search, Plus, CreditCard, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, formatDate, exportToCSV } from '@/lib/utils';
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchData = async () => {
    try { const [inv, pay] = await Promise.all([get<{ data: Invoice[] }>('/invoices'), get<{ data: Payment[] }>('/payments')]); setInvoices(inv.data); setPayments(pay.data); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.invoiceId || !form.amount) return; setSubmitting(true);
    try { await post('/payments', { ...form, amount: Number(form.amount) }); showToast('Payment recorded successfully', 'success'); setIsOpen(false); setForm({ invoiceId: '', amount: '', method: 'VIREMENT', reference: '' }); await fetchData(); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID');
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const filteredPayments = search ? payments.filter((p) => p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || p.method?.toLowerCase().includes(search.toLowerCase()) || (p.reference ?? '').toLowerCase().includes(search.toLowerCase())) : payments;
  const paginated = filteredPayments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedInvoice = invoices.find((i) => i.id === form.invoiceId);

  const exportPayments = () => {
    const headers = ['Invoice #', 'Client', 'Amount', 'Method', 'Reference', 'Paid On'];
    const rows = payments.map((p) => [
      p.invoice?.invoiceNumber ?? '-',
      p.invoice?.client?.companyName ?? '-',
      p.amount.toString(),
      p.method?.replace('_', ' ') ?? '-',
      p.reference ?? '-',
      formatDate(p.paidAt),
    ]);
    exportToCSV(headers, rows, 'payments.csv');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Payments</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportPayments} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <button onClick={() => setIsOpen(true)} disabled={unpaidInvoices.length === 0} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
        {[
          { label: 'Total Collected', value: formatCurrency(totalCollected), icon: CreditCard, color: 'text-emerald-400' },
          { label: 'Unpaid Invoices', value: unpaidInvoices.length, icon: CreditCard, color: 'text-amber-400' },
          { label: 'Outstanding', value: formatCurrency(unpaidInvoices.reduce((s, i) => s + i.totalAmount, 0)), icon: CreditCard, color: 'text-red-400' },
          { label: 'This Month', value: formatCurrency(totalCollected), icon: CreditCard, color: 'text-blue-400' },
          { label: 'Total Payments', value: payments.length, icon: CreditCard, color: 'text-slate-400' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-admin-border bg-admin-card p-5">
            <div><p className="text-[11px] font-medium text-admin-textSub">{card.label}</p><p className="mt-1 text-[26px] font-bold leading-none text-admin-text">{card.value}</p></div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5"><card.icon className={cn('h-5 w-5', card.color)} /></div>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-textSub" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search payments..." className="w-full rounded-lg border border-admin-border bg-admin-card py-2 pl-9 pr-4 text-sm text-admin-text placeholder:text-admin-textSub focus:border-blue-500 focus:outline-none" />
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4"><span className="text-[15px] font-semibold text-admin-text">All Payments</span></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Client</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Paid On</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length ? (paginated.map((p) => (
                <tr key={p.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm font-semibold text-admin-text">{p.invoice?.invoiceNumber ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{p.invoice?.client?.companyName ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400 font-tabular-nums">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3"><span className="rounded bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400 border border-blue-500/20">{p.method?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{p.reference ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{formatDate(p.paidAt)}</td>
                </tr>
              ))) : (<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-admin-textSub">No payments found.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-textSub">Showing {filteredPayments.length} payments</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text"><ArrowLeft className="h-3 w-3" /> Prev</button>
            <button className="rounded-lg border border-admin-border bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">{page}</button>
            <button onClick={() => setPage(Math.min(Math.ceil(filteredPayments.length / PAGE_SIZE), page + 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">Next <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record Payment" variant="dark">
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4 p-1">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-admin-textSub">Invoice *</label>
            <select required value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })} className="h-10 w-full rounded-lg border border-admin-border bg-admin-card px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none">
              {[{ value: '', label: 'Select invoice...' }, ...unpaidInvoices.map((i) => ({ value: i.id, label: `${i.invoiceNumber} — ${i.client?.companyName ?? '-'} (${formatCurrency(i.totalAmount)})` }))].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {selectedInvoice && (<div className="rounded-lg bg-blue-500/10 p-3 text-sm border border-blue-500/20"><p className="font-medium text-blue-200">{selectedInvoice.client?.companyName}</p><p className="text-blue-400">Total: {formatCurrency(selectedInvoice.totalAmount)} · Due: {formatDate(selectedInvoice.paymentDeadline)}</p></div>)}
          <Input label="Amount (XAF) *" type="number" required min={1} placeholder={selectedInvoice ? String(selectedInvoice.totalAmount) : '0'} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-admin-textSub">Payment Method *</label>
            <select required value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="h-10 w-full rounded-lg border border-admin-border bg-admin-card px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none">
              {METHOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Input label="Reference / Cheque No." placeholder="Optional reference number" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={submitting} disabled={!form.invoiceId || !form.amount} className="bg-emerald-600">Save Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
