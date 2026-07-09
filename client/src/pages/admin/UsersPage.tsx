import { useEffect, useState } from 'react';
import { get, post, del, patch, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types';

export default function UsersPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await get<{ data: User[] }>('/users');
      setUsers(res.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post('/users', { ...form, role: 'ADMIN' });
      showToast('Admin user created', 'success');
      setIsOpen(false);
      setForm({ name: '', email: '', password: '' });
      await fetchUsers();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await patch(`/users/${id}`, { isActive: !isActive });
      showToast(`User ${isActive ? 'deactivated' : 'activated'}`, 'success');
      await fetchUsers();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Permanently delete this admin user?')) return;
    try {
      await del(`/users/${id}`);
      showToast('User deleted', 'success');
      await fetchUsers();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const adminUsers = users.filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Users"
        subtitle={`${adminUsers.length} administrators`}
        action={<Button onClick={() => setIsOpen(true)}>+ Add Admin</Button>}
      />

      <Card>
        <CardContent className="p-0">
          {users.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Joined</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className={!u.isActive ? 'opacity-60' : ''}>
                    <TableCell className="font-semibold">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 rounded bg-brand-100 px-1.5 py-0.5 text-xs font-medium text-brand-700">You</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'ADMIN' ? 'brand' : 'default'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      {u.id !== currentUser?.id && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => toggleActive(u.id, u.isActive)}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => deleteUser(u.id)}>
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No users found" />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Admin User"
        footer={<Button type="submit" form="user-form" isLoading={submitting}>Create User</Button>}
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jean-Pierre Mbarga" />
          <Input label="Email Address *" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@bajservices.com" />
          <Input label="Password *" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
          <p className="text-xs text-gray-500">This user will have full admin access to the system.</p>
        </form>
      </Modal>
    </div>
  );
}
