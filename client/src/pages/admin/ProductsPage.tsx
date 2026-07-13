import { useEffect, useState } from 'react';
import { Plus, Droplets } from 'lucide-react';
import { get, post, put, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try { const res = await get<{ data: Product[] }>('/products?all=true'); setProducts(res.data); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try { await post('/products', form); showToast('Product created', 'success'); setIsOpen(false); setForm({ name: '', code: '', description: '' }); await fetchProducts(); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setSubmitting(false); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try { await put(`/products/${id}`, { isActive: active }); showToast(`Product ${active ? 'activated' : 'deactivated'}`, 'success'); await fetchProducts(); } catch (err) { showToast(getErrorMessage(err), 'error'); }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Products</h1>
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4">
          <span className="text-[15px] font-semibold text-admin-text">All Products</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length ? (products.map((product) => (
                <tr key={product.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"><Droplets className="h-4 w-4" /></div>
                      <span className="text-sm font-semibold text-admin-text">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{product.code}</td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{product.description ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', product.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(product.id, !product.isActive)} className={cn('rounded px-3 py-1 text-xs font-semibold transition-colors', product.isActive ? 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10')}>
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))) : (<tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-admin-textSub">No products found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Product" variant="dark">
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4 p-1">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Code" required placeholder="e.g. GASOIL" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end">
            <Button type="submit" isLoading={submitting} className="bg-blue-600">Create Product</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
