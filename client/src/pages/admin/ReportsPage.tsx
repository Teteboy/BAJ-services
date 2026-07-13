import { useEffect, useState } from 'react';
import { BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { WeeklyReport } from '@/types';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchReports = async () => { try { const res = await get<{ data: WeeklyReport[] }>('/reports'); setReports(res.data); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setLoading(false); } };
  useEffect(() => { fetchReports(); }, []);
  const generateReport = async () => { setGenerating(true); try { await post('/reports/generate', {}); showToast('Weekly report generated', 'success'); await fetchReports(); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setGenerating(false); } };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const latestReport = reports[0];
  const paginated = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Weekly Reports</h1>
        <Button onClick={generateReport} isLoading={generating} className="bg-blue-600 gap-2"><BarChart3 className="h-4 w-4" /> Generate Now</Button>
      </div>

      {latestReport && (
        <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
          <p className="col-span-full text-xs font-semibold uppercase text-admin-textSub">Latest Week: {formatDate(latestReport.weekStartDate)} — {formatDate(latestReport.weekEndDate)}</p>
          {[
            { label: 'Total Revenue', value: formatCurrency(latestReport.totalAmountSold), color: 'text-emerald-400' },
            { label: 'Payments Received', value: formatCurrency(latestReport.paymentsReceived), color: 'text-blue-400' },
            { label: 'Orders', value: latestReport.totalOrdersCount, color: 'text-amber-400' },
            { label: 'Deliveries', value: latestReport.totalDeliveriesCount, color: 'text-purple-400' },
            { label: 'Pending', value: formatCurrency(latestReport.paymentsPending), color: 'text-slate-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-admin-border bg-admin-card p-5">
              <p className="text-[11px] font-medium text-admin-textSub">{s.label}</p>
              <p className={cn('mt-1 text-[26px] font-bold leading-none', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4"><span className="text-[15px] font-semibold text-admin-text">All Reports</span></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Week</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Payments In</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Pending</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Overdue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Deliveries</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length ? (paginated.map((r) => (
                <tr key={r.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm font-semibold text-admin-text">{formatDate(r.weekStartDate)} <span className="text-admin-textMuted">–</span> {formatDate(r.weekEndDate)}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400">{formatCurrency(r.totalAmountSold)}</td>
                  <td className="px-4 py-3 text-right text-sm text-admin-textMuted">{formatCurrency(r.paymentsReceived)}</td>
                  <td className="px-4 py-3 text-right text-sm text-admin-textMuted">{formatCurrency(r.paymentsPending)}</td>
                  <td className={cn('px-4 py-3 text-right text-sm font-semibold', r.paymentsOverdue > 0 ? 'text-red-400' : 'text-admin-textMuted')}>{formatCurrency(r.paymentsOverdue)}</td>
                  <td className="px-4 py-3 text-right text-sm text-admin-textMuted">{r.totalOrdersCount}</td>
                  <td className="px-4 py-3 text-right text-sm text-admin-textMuted">{r.totalDeliveriesCount}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setSelected(r)} className="text-xs font-semibold text-blue-400 hover:text-blue-300">Detail</button></td>
                </tr>
              ))) : (<tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-admin-textSub">No reports available. Click 'Generate Now' to create one.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-textSub">Showing {reports.length} reports</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text"><ArrowLeft className="h-3 w-3" /> Prev</button>
            <button className="rounded-lg border border-admin-border bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">{page}</button>
            <button onClick={() => setPage(Math.min(Math.ceil(reports.length / PAGE_SIZE), page + 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">Next <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Report: ${formatDate(selected.weekStartDate)} — ${formatDate(selected.weekEndDate)}`} variant="dark">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-800/50 p-4">
              <div><p className="text-xs font-semibold uppercase text-slate-500">Total Revenue</p><p className="mt-0.5 text-lg font-bold text-emerald-400">{formatCurrency(selected.totalAmountSold)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Payments Received</p><p className="mt-0.5 text-lg font-bold text-blue-400">{formatCurrency(selected.paymentsReceived)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Payments Pending</p><p className="mt-0.5 font-semibold text-amber-400">{formatCurrency(selected.paymentsPending)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Payments Overdue</p><p className="mt-0.5 font-semibold text-red-400">{formatCurrency(selected.paymentsOverdue)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Total Orders</p><p className="mt-0.5 font-semibold text-slate-200">{selected.totalOrdersCount}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-500">Deliveries</p><p className="mt-0.5 font-semibold text-slate-200">{selected.totalDeliveriesCount}</p></div>
              <div className="col-span-2"><p className="text-xs font-semibold uppercase text-slate-500">Generated At</p><p className="mt-0.5 text-slate-400">{formatDateTime(selected.generatedAt)}</p></div>
              {selected.emailSentAt && <div className="col-span-2"><p className="text-xs font-semibold uppercase text-slate-500">Email Sent</p><p className="mt-0.5 text-slate-400">{formatDateTime(selected.emailSentAt)}</p></div>}
            </div>

            {selected.salesByProduct && selected.salesByProduct.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Sales by Product</p>
                <div className="overflow-hidden rounded-lg border border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr><th className="px-3 py-2 text-left font-semibold text-slate-400">Product</th><th className="px-3 py-2 text-right font-semibold text-slate-400">Qty (L)</th><th className="px-3 py-2 text-right font-semibold text-slate-400">Revenue</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {selected.salesByProduct.map((s: any, i: number) => (
                        <tr key={i}><td className="px-3 py-2 font-medium">{s.productName ?? s.product ?? '-'}</td><td className="px-3 py-2 text-right">{(s.quantity ?? s.qty ?? 0).toLocaleString()}</td><td className="px-3 py-2 text-right">{formatCurrency(s.revenue ?? s.amount ?? 0)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
