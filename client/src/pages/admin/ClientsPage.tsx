import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Building2, Mail, Phone, Download, Eye, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { get, post, del, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { cn, formatDate, exportToCSV } from '@/lib/utils';
import type { Client } from '@/types';

const PAYMENT_TERMS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'DAYS_10', label: '10 Days' },
  { value: 'DAYS_15', label: '15 Days' },
  { value: 'DAYS_30', label: '30 Days' },
];

export default function ClientsPage() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ companyName: '', email: '', phone: '', paymentTerms: 'IMMEDIATE' });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchAll = async () => {
    try {
      const c = await get<{ data: Client[] }>('/clients');
      setClients(c.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = clients.filter((c) => c.companyName.toLowerCase().includes(search.toLowerCase()) || c.user.email.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post('/clients', form);
      showToast('Client created', 'success');
      setCreateOpen(false);
      setForm({ companyName: '', email: '', phone: '', paymentTerms: 'IMMEDIATE' });
      await fetchAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client and all their data?')) return;
    try { await del(`/clients/${id}`); showToast('Client deleted', 'success'); await fetchAll(); } catch (err) { showToast(getErrorMessage(err), 'error'); }
  };

  const exportClients = () => {
    const headers = ['Company', 'Email', 'Phone', 'Payment Terms', 'Status', 'Created'];
    const rows = clients.map((c) => [
      c.companyName,
      c.user.email,
      c.phone || '-',
      c.paymentTerms?.replace('_', ' ') || '-',
      c.isActive ? 'Active' : 'Inactive',
      formatDate(c.createdAt),
    ]);
    exportToCSV(headers, rows, 'clients.csv');
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Clients</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportClients} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-textSub" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by company or email..." className="w-full rounded-lg border border-admin-border bg-admin-card py-2 pl-9 pr-4 text-sm text-admin-text placeholder:text-admin-textSub focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4">
          <span className="text-[15px] font-semibold text-admin-text">All Clients</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Payment Terms</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Since</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length ? (paginated.map((c) => (
                <tr key={c.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"><Building2 className="h-4 w-4" /></div>
                      <div className="text-sm font-semibold text-admin-text">{c.companyName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-admin-textMuted"><Mail className="mr-1 inline h-3 w-3" />{c.user.email}</div>
                    <div className="mt-0.5 text-xs text-admin-textMuted"><Phone className="mr-1 inline h-3 w-3" />{c.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{c.paymentTerms?.replace('_', ' ') || '-'}</td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', c.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>{c.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/app/clients/${c.id}`}
                        className="flex items-center gap-1 rounded-lg border border-admin-border px-2.5 py-1.5 text-xs font-semibold text-admin-textSub transition-colors hover:bg-white/5 hover:text-admin-text"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      <button
                        onClick={() => deleteClient(c.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))) : (<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-admin-textSub">No clients found.</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-textSub">Showing {filtered.length} clients</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text"><ArrowLeft className="h-3 w-3" /> Prev</button>
            <button className="rounded-lg border border-admin-border bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">{page}</button>
            <button onClick={() => setPage(Math.min(Math.ceil(filtered.length / PAGE_SIZE), page + 1))} className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-1.5 text-xs font-semibold text-admin-textSub hover:bg-white/5 hover:text-admin-text">Next <ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Client" variant="dark">
        <form id="client-form" onSubmit={handleCreate} className="space-y-4 p-1">
          <Input label="Company Name" required variant="dark" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <Input label="Login Email" type="email" required variant="dark" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" variant="dark" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-admin-textSub">Payment Terms</label>
            <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="h-10 w-full rounded-lg border border-admin-border bg-admin-bg px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none">
              {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-admin-textSub">Default password will be <strong className="text-admin-text">client123</strong></p>
          <div className="flex justify-end">
            <Button type="submit" isLoading={submitting} className="bg-blue-600">Create Client</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
