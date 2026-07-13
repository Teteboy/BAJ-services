import { useEffect, useState } from 'react';
import { AlertCircle, FileText, CheckCircle, Download } from 'lucide-react';
import { get, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency, formatDate, formatDateTime, exportToCSV, downloadFile } from '@/lib/utils';
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
  const overdueAmount = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.totalAmount, 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return 'rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700';
      case 'OVERDUE': return 'rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700';
      case 'PENDING': return 'rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700';
      default: return 'rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600';
    }
  };

  const exportInvoices = () => {
    const headers = ['Invoice #', 'Order Ref', 'Amount', 'Status', 'Issued', 'Due'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.order?.orderNumber ?? '-',
      inv.totalAmount.toString(),
      inv.status,
      formatDate(inv.issuedAt),
      formatDate(inv.paymentDeadline),
    ]);
    exportToCSV(headers, rows, 'my_invoices.csv');
  };

  const downloadInvoicePDF = (inv: Invoice) => {
    if (inv.pdfUrl) downloadFile(inv.pdfUrl, `${inv.invoiceNumber}.pdf`);
    else showToast('PDF not available yet', 'error');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-navy-900">My Invoices</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-800">Overdue</p>
            <p className="text-xl font-bold text-red-900">{formatCurrency(overdueAmount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Due</p>
            <p className="text-xl font-bold text-navy-900">{formatCurrency(totalDue)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Paid This Month</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="text-[15px] font-bold text-navy-900">All Invoices</span>
          <button onClick={exportInvoices} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Order Ref</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Product</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Amount (XOF)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Issued</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length ? (
                invoices.map((inv) => {
                  const product = inv.items?.[0]?.product?.name ?? 'Gasoil';
                  const isOverdue = inv.status === 'OVERDUE';
                  return (
                    <tr key={inv.id} className={cn('border-b border-slate-100 last:border-0 hover:bg-slate-50', isOverdue && 'bg-red-50/50')}>
                      <td className={cn('px-4 py-3 text-xs font-bold', isOverdue ? 'text-red-700' : 'text-navy-900')}>
                        <div className="flex items-center gap-2">
                          {isOverdue && <div className="h-full w-1 self-stretch rounded bg-red-500" />}
                          {inv.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{inv.order?.orderNumber ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{product}</td>
                      <td className={cn('px-4 py-3 text-right text-sm font-bold', isOverdue ? 'text-red-700' : 'text-navy-900')}>{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(inv.issuedAt)}</td>
                      <td className={cn('px-4 py-3 text-xs', isOverdue ? 'font-semibold text-red-700' : 'text-slate-500')}>{formatDate(inv.paymentDeadline)}</td>
                      <td className="px-4 py-3"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelected(inv)} className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            View
                          </button>
                          {isOverdue && <button className="rounded-md bg-navy-900 px-3 py-1 text-xs font-semibold text-white">Pay Now</button>}
                          <button onClick={() => downloadInvoicePDF(inv)} className="text-xs font-semibold text-slate-500 hover:text-navy-900">
                            <Download className="inline h-3.5 w-3.5" /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Invoice ${selected.invoiceNumber}`}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div><p className="text-xs font-semibold uppercase text-slate-400">Order #</p><p className="mt-0.5 font-medium">{selected.order?.orderNumber ?? '-'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Status</p><p className="mt-0.5 font-medium">{selected.status}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Issued On</p><p className="mt-0.5">{formatDateTime(selected.issuedAt)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Due Date</p><p className="mt-0.5">{formatDate(selected.paymentDeadline)}</p></div>
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
                  {(selected.items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 font-medium">{item.product?.name ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{item.quantity.toLocaleString()} {item.unit}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.pricePerUnit)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold text-slate-700">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-navy-900">{formatCurrency(selected.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {selected.pdfUrl && (
              <a href={selected.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full gap-2"><Download className="h-4 w-4" /> Download PDF</Button>
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
