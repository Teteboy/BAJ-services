import { useEffect, useState } from 'react';
import { Search, ArrowLeft, ArrowRight, FileText, Download } from 'lucide-react';
import { get, patch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency, formatDate, formatDateTime, exportToCSV, downloadFile } from '@/lib/utils';
import type { Invoice } from '@/types';

const STATUS_OPTIONS = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'] as const;

const statusBadgeClass: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  SENT: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  PAID: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  OVERDUE: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchInvoices = async () => {
    try { const res = await get<{ data: Invoice[]; total: number }>('/invoices'); setInvoices(res.data); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchInvoices(); }, []);
  useEffect(() => {
    let list = [...invoices];
    if (statusFilter !== 'All') list = list.filter((i) => i.status === statusFilter.toUpperCase());
    if (search) list = list.filter((i) => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (i.client?.companyName ?? '').toLowerCase().includes(search.toLowerCase()));
    setFiltered(list); setPage(1);
  }, [invoices, search, statusFilter]);

  const markPaid = async (invoiceId: string) => {
    setMarking(true);
    try { await patch(`/invoices/${invoiceId}/status`, { status: 'PAID' }); showToast('Invoice marked as paid', 'success'); setSelected(null); await fetchInvoices(); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setMarking(false); }
  };

  const exportInvoices = () => {
    const headers = ['Invoice #', 'Client', 'Order Ref', 'Amount', 'Status', 'Issued', 'Due'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.client?.companyName ?? '-',
      inv.order?.orderNumber ?? '-',
      inv.totalAmount.toString(),
      inv.status,
      formatDate(inv.issuedAt),
      formatDate(inv.paymentDeadline),
    ]);
    exportToCSV(headers, rows, 'invoices.csv');
  };

  const downloadInvoicePDF = (inv: Invoice) => {
    if (inv.pdfUrl) downloadFile(inv.pdfUrl, `${inv.invoiceNumber}.pdf`);
    else showToast('PDF not available yet', 'error');
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);
  const totalPending = invoices.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Invoices</h1>
        <Button variant="outline" onClick={exportInvoices} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: FileText, color: 'text-emerald-400' },
          { label: 'Outstanding', value: formatCurrency(totalPending), icon: FileText, color: 'text-amber-400' },
          { label: 'Overdue', value: invoices.filter((i) => i.status === 'OVERDUE').length, icon: FileText, color: 'text-red-400' },
          { label: 'This Month', value: formatCurrency(totalRevenue), icon: FileText, color: 'text-blue-400' },
          { label: 'Total Invoices', value: invoices.length, icon: FileText, color: 'text-slate-400' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-xl border border-admin-border bg-admin-card p-5">
            <div>
              <p className="text-[11px] font-medium text-admin-textSub">{card.label}</p>
              <p className="mt-1 text-[26px] font-bold leading-none text-admin-text">{card.value}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5"><card.icon className={cn('h-5 w-5', card.color)} /></div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-textSub" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice # or client..." className="w-full rounded-lg border border-admin-border bg-admin-card py-2 pl-9 pr-4 text-sm text-admin-text placeholder:text-admin-textSub focus:border-blue-500 focus:outline-none sm:w-80" />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn('rounded-lg border px-3 py-2 text-xs font-semibold transition-all', statusFilter === s ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-admin-border bg-admin-card text-admin-textSub hover:border-slate-600 hover:text-admin-text')}>{s}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4"><span className="text-[15px] font-semibold text-admin-text">All Invoices</span></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Order Ref</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((inv) => (
                <tr key={inv.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm font-semibold text-admin-text">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{inv.client?.companyName ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{inv.order?.orderNumber ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-admin-text font-tabular-nums">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', statusBadgeClass[inv.status] ?? statusBadgeClass.DRAFT)}>{inv.status}</span>
                  </td>
                  <td className={cn('px-4 py-3 text-sm', inv.status === 'OVERDUE' ? 'font-semibold text-red-400' : 'text-admin-textMuted')}>{formatDate(inv.paymentDeadline)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelected(inv)} className="flex items-center gap-1 rounded-lg border border-admin-border px-2.5 py-1.5 text-xs font-semibold text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                        <FileText className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        onClick={() => downloadInvoicePDF(inv)}
                        className="flex items-center gap-1 rounded-lg border border-blue-500/20 px-2.5 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/10"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))) : (<tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-admin-textSub">No invoices found.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-textSub">Showing {filtered.length} invoices</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text"><ArrowLeft className="h-3 w-3" /> Prev</button>
            <button className="rounded-lg border border-admin-border bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">{page}</button>
            <button onClick={() => setPage(Math.min(Math.ceil(filtered.length / PAGE_SIZE), page + 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">Next <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Invoice ${selected.invoiceNumber}`} variant="dark">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-800/50 p-4">
              <div><p className="text-xs font-semibold uppercase text-slate-500">Client</p><p className="mt-0.5 font-semibold text-slate-200">{selected.client?.companyName ?? '-'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Order #</p><p className="mt-0.5 text-slate-200">{selected.order?.orderNumber ?? '-'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Payment Method</p><p className="mt-0.5 text-slate-200">{selected.paymentMethod ?? '-'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Due Date</p><p className={cn('mt-0.5 font-medium', selected.status === 'OVERDUE' ? 'text-red-400' : 'text-slate-200')}>{formatDate(selected.paymentDeadline)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Issued</p><p className="mt-0.5 text-slate-200">{formatDateTime(selected.issuedAt)}</p></div>
              {selected.paidAt && <div><p className="text-xs font-semibold uppercase text-slate-500">Paid On</p><p className="mt-0.5 font-medium text-emerald-400">{formatDateTime(selected.paidAt)}</p></div>}
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
                  {(selected.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium">{item.product?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{item.quantity.toLocaleString()} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-slate-400">Total Amount</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-200">{formatCurrency(selected.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.pdfUrl && (<a href={selected.pdfUrl} target="_blank" rel="noreferrer"><Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button></a>)}
              {selected.status !== 'PAID' && (<Button isLoading={marking} onClick={() => markPaid(selected.id)} className="bg-emerald-600">Mark as Paid</Button>)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
