import { useEffect, useState } from 'react';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { WeeklyReport } from '@/types';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<WeeklyReport | null>(null);

  const fetchReports = async () => {
    try {
      const res = await get<{ data: WeeklyReport[] }>('/reports');
      setReports(res.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      await post('/reports/generate', {});
      showToast('Weekly report generated', 'success');
      await fetchReports();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const latestReport = reports[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Weekly Reports"
        subtitle="Performance summaries generated automatically each week"
        action={
          <Button onClick={generateReport} isLoading={generating}>
            Generate Now
          </Button>
        }
      />

      {/* Latest Summary Cards */}
      {latestReport && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Latest Week: {formatDate(latestReport.weekStartDate)} — {formatDate(latestReport.weekEndDate)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Revenue', value: formatCurrency(latestReport.totalAmountSold), color: 'border-l-4 border-emerald-400' },
              { label: 'Payments Received', value: formatCurrency(latestReport.paymentsReceived), color: 'border-l-4 border-blue-400' },
              { label: 'Orders', value: latestReport.totalOrdersCount, color: 'border-l-4 border-amber-400' },
              { label: 'Deliveries', value: latestReport.totalDeliveriesCount, color: 'border-l-4 border-purple-400' },
            ].map((s) => (
              <Card key={s.label} className={s.color}>
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {reports.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Week</TableHeader>
                  <TableHeader>Revenue</TableHeader>
                  <TableHeader>Payments In</TableHeader>
                  <TableHeader>Pending</TableHeader>
                  <TableHeader>Overdue</TableHeader>
                  <TableHeader>Orders</TableHeader>
                  <TableHeader>Deliveries</TableHeader>
                  <TableHeader>Generated</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelected(r)}>
                    <TableCell className="font-semibold">
                      {formatDate(r.weekStartDate)}
                      <span className="text-gray-400"> – </span>
                      {formatDate(r.weekEndDate)}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-700">{formatCurrency(r.totalAmountSold)}</TableCell>
                    <TableCell>{formatCurrency(r.paymentsReceived)}</TableCell>
                    <TableCell>{formatCurrency(r.paymentsPending)}</TableCell>
                    <TableCell className={r.paymentsOverdue > 0 ? 'font-medium text-red-600' : ''}>
                      {formatCurrency(r.paymentsOverdue)}
                    </TableCell>
                    <TableCell>{r.totalOrdersCount}</TableCell>
                    <TableCell>{r.totalDeliveriesCount}</TableCell>
                    <TableCell className="text-gray-500">{formatDateTime(r.generatedAt)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(r); }}>
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No reports available. Click 'Generate Now' to create one." />
          )}
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Report: ${formatDate(selected.weekStartDate)} — ${formatDate(selected.weekEndDate)}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div><p className="text-xs font-semibold uppercase text-gray-400">Total Revenue</p><p className="mt-0.5 text-lg font-bold text-emerald-700">{formatCurrency(selected.totalAmountSold)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Payments Received</p><p className="mt-0.5 text-lg font-bold text-blue-700">{formatCurrency(selected.paymentsReceived)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Payments Pending</p><p className="mt-0.5 font-semibold text-amber-700">{formatCurrency(selected.paymentsPending)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Payments Overdue</p><p className="mt-0.5 font-semibold text-red-700">{formatCurrency(selected.paymentsOverdue)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Total Orders</p><p className="mt-0.5 font-semibold">{selected.totalOrdersCount}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Deliveries</p><p className="mt-0.5 font-semibold">{selected.totalDeliveriesCount}</p></div>
              <div className="col-span-2"><p className="text-xs font-semibold uppercase text-gray-400">Generated At</p><p className="mt-0.5 text-gray-600">{formatDateTime(selected.generatedAt)}</p></div>
              {selected.emailSentAt && (
                <div className="col-span-2"><p className="text-xs font-semibold uppercase text-gray-400">Email Sent</p><p className="mt-0.5 text-gray-600">{formatDateTime(selected.emailSentAt)}</p></div>
              )}
            </div>

            {selected.salesByProduct && selected.salesByProduct.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Sales by Product</p>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Qty (L)</th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selected.salesByProduct.map((s: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-medium">{s.productName ?? s.product ?? '-'}</td>
                          <td className="px-4 py-2 text-right">{(s.quantity ?? s.qty ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(s.revenue ?? s.amount ?? 0)}</td>
                        </tr>
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
