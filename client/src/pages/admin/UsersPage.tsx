import { useEffect, useState } from 'react';
import { Plus, Shield, UserX, UserCheck } from 'lucide-react';
import { get, post, del, patch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { cn, formatDate } from '@/lib/utils';
import type { User } from '@/types';

export default function UsersPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => { try { const res = await get<{ data: User[] }>('/users'); setUsers(res.data); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try { await post('/users', { ...form, role: 'ADMIN' }); showToast('Admin user created', 'success'); setIsOpen(false); setForm({ name: '', email: '', password: '' }); await fetchUsers(); } catch (err) { showToast(getErrorMessage(err), 'error'); } finally { setSubmitting(false); }
  };
  const toggleActive = async (id: string, isActive: boolean) => { try { await patch(`/users/${id}`, { isActive: !isActive }); showToast(`User ${isActive ? 'deactivated' : 'activated'}`, 'success'); await fetchUsers(); } catch (err) { showToast(getErrorMessage(err), 'error'); } };
  const deleteUser = async (id: string) => { if (!confirm('Permanently delete this admin user?')) return; try { await del(`/users/${id}`); showToast('User deleted', 'success'); await fetchUsers(); } catch (err) { showToast(getErrorMessage(err), 'error'); } };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  const adminUsers = users.filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-admin-text">Admin Users</h1>
        <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
          <Plus className="h-4 w-4" /> Add Admin
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4"><span className="text-[15px] font-semibold text-admin-text">{adminUsers.length} administrators</span></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (users.map((u) => (
                <tr key={u.id} className={cn('border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]', !u.isActive && 'opacity-60')}>
                  <td className="px-4 py-3 text-sm font-semibold text-admin-text">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"><Shield className="h-4 w-4" /></div>
                      {u.name}
                      {u.id === currentUser?.id && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">You</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{u.email}</td>
                  <td className="px-4 py-3"><span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20')}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 text-sm text-admin-textMuted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleActive(u.id, u.isActive)} className={cn('rounded border px-2 py-1 text-xs font-semibold transition-colors', u.isActive ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10')}>
                          {u.isActive ? <><UserX className="mr-1 inline h-3 w-3" /> Deactivate</> : <><UserCheck className="mr-1 inline h-3 w-3" /> Activate</>}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="rounded border border-red-500/30 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))) : (<tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-admin-textSub">No users found.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Admin User" variant="dark">
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4 p-1">
          <Input label="Full Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jean-Pierre Mbarga" />
          <Input label="Email Address *" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@bajservices.com" />
          <Input label="Password *" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
          <p className="text-xs text-admin-textSub">This user will have full admin access to the system.</p>
          <div className="flex justify-end"><Button type="submit" isLoading={submitting} className="bg-blue-600">Create User</Button></div>
        </form>
      </Modal>
    </div>
  );
}
