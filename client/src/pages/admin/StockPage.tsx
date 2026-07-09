import { useEffect, useState } from 'react';
import { get, post, put, del, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
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

  const fetchData = async () => {
    try {
      const [ent, prod] = await Promise.all([
        get<{ data: StockEntry[] }>('/stock'),
        get<{ data: Product[] }>('/products?all=true'),
      ]);
      setEntries(ent.data);
      setProducts(prod.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditEntry(null); setForm(emptyForm); setIsOpen(true); };
  const openEdit = (e: StockEntry) => {
    setEditEntry(e);
    setForm({
      productId: e.productId,
      initialStock: String(e.initialStock),
      totalDelivered: String(e.totalDelivered),
      weekStartDate: e.weekStartDate.slice(0, 10),
      weekEndDate: e.weekEndDate.slice(0, 10),
      notes: e.notes ?? '',
    });
    setIsOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitting(true);
    const payload = {
      productId: form.productId,
      initialStock: Number(form.initialStock),
      totalDelivered: Number(form.totalDelivered),
      weekStartDate: form.weekStartDate,
      weekEndDate: form.weekEndDate,
      notes: form.notes || undefined,
    };
    try {
      if (editEntry) {
        await put(`/stock/${editEntry.id}`, payload);
        showToast('Stock entry updated', 'success');
      } else {
        await post('/stock', payload);
        showToast('Stock entry added', 'success');
      }
      setIsOpen(false);
      setForm(emptyForm);
      setEditEntry(null);
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this stock entry?')) return;
    try {
      await del(`/stock/${id}`);
      showToast('Entry deleted', 'success');
      await fetchData();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const productOptions = [{ value: '', label: 'All Products' }, ...products.map((p) => ({ value: p.id, label: p.name }))];
  const formProductOptions = [{ value: '', label: 'Select product...' }, ...products.map((p) => ({ value: p.id, label: p.name }))];
  const filtered = productFilter ? entries.filter((e) => e.productId === productFilter) : entries;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Management"
        subtitle="Weekly SCDP stock tracking"
        action={<Button onClick={openCreate}>+ Add Entry</Button>}
      />

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select
            options={productOptions}
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Product</TableHeader>
                  <TableHeader>Week</TableHeader>
                  <TableHeader>Initial (L)</TableHeader>
                  <TableHeader>Delivered (L)</TableHeader>
                  <TableHeader>Remaining (L)</TableHeader>
                  <TableHeader>Utilization</TableHeader>
                  <TableHeader>Notes</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((entry) => {
                  const utilPct = entry.initialStock > 0
                    ? Math.round((entry.totalDelivered / entry.initialStock) * 100)
                    : 0;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-semibold">{entry.product.name}</TableCell>
                      <TableCell className="text-gray-600 text-xs">
                        {new Date(entry.weekStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        {' — '}
                        {new Date(entry.weekEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </TableCell>
                      <TableCell>{entry.initialStock.toLocaleString()}</TableCell>
                      <TableCell>{entry.totalDelivered.toLocaleString()}</TableCell>
                      <TableCell className={entry.remainingStock < 0 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-700'}>
                        {entry.remainingStock.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-2 rounded-full ${utilPct > 90 ? 'bg-red-500' : utilPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(utilPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{utilPct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-gray-500">{entry.notes || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(entry)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => deleteEntry(entry.id)}>Del</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No stock entries found" />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editEntry ? 'Edit Stock Entry' : 'Add Stock Entry'}
        footer={<Button type="submit" form="stock-form" isLoading={submitting}>Save Entry</Button>}
      >
        <form id="stock-form" onSubmit={handleSubmit} className="space-y-4">
          <Select label="Product *" required options={formProductOptions} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Week Start *" type="date" required value={form.weekStartDate} onChange={(e) => setForm({ ...form, weekStartDate: e.target.value })} />
            <Input label="Week End *" type="date" required value={form.weekEndDate} onChange={(e) => setForm({ ...form, weekEndDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial Stock (L) *" type="number" required min={0} value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} />
            <Input label="Total Delivered (L) *" type="number" required min={0} value={form.totalDelivered} onChange={(e) => setForm({ ...form, totalDelivered: e.target.value })} />
          </div>
          {form.initialStock && form.totalDelivered && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="text-blue-700">
                Remaining: <strong>{(Number(form.initialStock) - Number(form.totalDelivered)).toLocaleString()} L</strong>
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this week's stock..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
