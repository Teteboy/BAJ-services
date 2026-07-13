import { useEffect, useState } from 'react';
import { Plus, ArrowLeft, ArrowRight, Download, Edit3, Trash2 } from 'lucide-react';
import { get, post, put, del, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatDate, exportToCSV } from '@/lib/utils';
import type { StockEntry, Product } from '@/types';

const emptyForm = { productId: '', initialStock: '', totalDelivered: '', weekStartDate: '', weekEndDate: '', notes: '' };

export default function StockPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilter, setProductFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<StockEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchData = async () => {
    try { const [ent, prod] = await Promise.all([get<{ data: StockEntry[] }>('/stock'), get<{ data: Product[] }>('/products?all=true')]); setEntries(ent.data); setProducts(prod.data); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditEntry(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (e: StockEntry) => { setEditEntry(e); setForm({ productId: e.productId, initialStock: String(e.initialStock), totalDelivered: String(e.totalDelivered), weekStartDate: e.weekStartDate.slice(0, 10), weekEndDate: e.weekEndDate.slice(0, 10), notes: e.notes ?? '' }); setIsOpen(true); };
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSubmitting(true);
    const payload = { productId: form.productId, initialStock: Number(form.initialStock), totalDelivered: Number(form.totalDelivered), weekStartDate: form.weekStartDate, weekEndDate: form.weekEndDate, notes: form.notes || undefined };
    try { if (editEntry) { await put(`/stock/${editEntry.id}`, payload); showToast('Stock entry updated', 'success'); } else { await post('/stock', payload); showToast('Stock entry added', 'success'); } setIsOpen(false); setForm(emptyForm); setEditEntry(null); await fetchData(); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setSubmitting(false); }
  };
  const deleteEntry = async (id: string) => { if (!confirm('Delete this stock entry?')) return; try { await del(`/stock/${id}`); showToast('Entry deleted', 'success'); await fetchData(); } catch (err) { showToast(getErrorMessage(err), 'error'); } };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const filtered = productFilter ? entries.filter((e) => e.productId === productFilter) : entries;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportStock = () => {
    const headers = ['Product', 'Week Start', 'Week End', 'Initial (L)', 'Delivered (L)', 'Remaining (L)'];
    const rows = entries.map((e) => [
      e.product.name,
      formatDate(e.weekStartDate),
      formatDate(e.weekEndDate),
      e.initialStock.toString(),
      e.totalDelivered.toString(),
      e.remainingStock.toString(),
    ]);
    exportToCSV(headers, rows, 'stock.csv');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Stock Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportStock} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-admin-textSub">Filter by Product</label>
        <select value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setPage(1); }} className="h-10 rounded-lg border border-admin-border bg-admin-card px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none sm:w-64">
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4"><span className="text-[15px] font-semibold text-admin-text">SCDP Stock Entries</span></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Week</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Initial (L)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Delivered (L)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Remaining (L)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Utilization</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length ? (paginated.map((entry) => {
                const utilPct = entry.initialStock > 0 ? Math.round((entry.totalDelivered / entry.initialStock) * 100) : 0;
                return (
                  <tr key={entry.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-sm font-semibold text-admin-text">{entry.product.name}</td>
                    <td className="px-4 py-3 text-xs text-admin-textMuted">
                      {new Date(entry.weekStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — {new Date(entry.weekEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-admin-textMuted font-tabular-nums">{entry.initialStock.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-sm text-admin-textMuted font-tabular-nums">{entry.totalDelivered.toLocaleString()}</td>
                    <td className={cn('px-4 py-3 text-right text-sm font-semibold font-tabular-nums', entry.remainingStock < 0 ? 'text-red-400' : 'text-emerald-400')}>{entry.remainingStock.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700">
                          <div className={cn('h-2 rounded-full', utilPct > 90 ? 'bg-red-500' : utilPct > 70 ? 'bg-amber-400' : 'bg-emerald-500')} style={{ width: `${Math.min(utilPct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-admin-textSub">{utilPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(entry)} className="flex items-center gap-1 rounded-lg border border-admin-border px-2.5 py-1.5 text-xs font-semibold text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text">
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => deleteEntry(entry.id)} className="flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })) : (<tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-admin-textSub">No stock entries found.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-textSub">Showing {filtered.length} entries</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text"><ArrowLeft className="h-3 w-3" /> Prev</button>
            <button className="rounded-lg border border-admin-border bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">{page}</button>
            <button onClick={() => setPage(Math.min(Math.ceil(filtered.length / PAGE_SIZE), page + 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">Next <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editEntry ? 'Edit Stock Entry' : 'Add Stock Entry'} variant="dark">
        <form id="stock-form" onSubmit={handleSubmit} className="space-y-4 p-1">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-admin-textSub">Product *</label>
            <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="h-10 w-full rounded-lg border border-admin-border bg-admin-card px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none">
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Week Start *" type="date" required value={form.weekStartDate} onChange={(e) => setForm({ ...form, weekStartDate: e.target.value })} />
            <Input label="Week End *" type="date" required value={form.weekEndDate} onChange={(e) => setForm({ ...form, weekEndDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial Stock (L) *" type="number" required min={0} value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} />
            <Input label="Total Delivered (L) *" type="number" required min={0} value={form.totalDelivered} onChange={(e) => setForm({ ...form, totalDelivered: e.target.value })} />
          </div>
          {form.initialStock && form.totalDelivered && (
            <div className="rounded-lg bg-blue-500/10 p-3 text-sm border border-blue-500/20">
              <p className="text-blue-200">Remaining: <strong className="text-blue-100">{(Number(form.initialStock) - Number(form.totalDelivered)).toLocaleString()} L</strong></p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-admin-textSub">Notes (optional)</label>
            <textarea className="w-full rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-sm text-admin-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this week's stock..." />
          </div>
          <div className="flex justify-end">
            <Button type="submit" isLoading={submitting} className="bg-blue-600">Save Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
