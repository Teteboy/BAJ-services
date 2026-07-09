import { useEffect, useState } from 'react';
import { get, put, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/types';

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ companyName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await get<{ data: Client }>('/clients/me');
      setClient(res.data);
      setForm({ companyName: res.data.companyName, phone: res.data.phone || '' });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSubmitting(true);
    try {
      await put(`/clients/${client.id}`, form);
      showToast('Profile updated', 'success');
      await fetchProfile();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setChangingPw(true);
    try {
      await post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('Password changed successfully', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account and company details" />

      {/* Account Info */}
      <Card>
        <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Name</p>
              <p className="mt-0.5 font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Email</p>
              <p className="mt-0.5">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Payment Terms</p>
              <p className="mt-0.5">{client?.paymentTerms?.replace('_', ' ') ?? 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Account Since</p>
              <p className="mt-0.5">{formatDate(client?.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Status</p>
              <Badge variant={client?.isActive ? 'success' : 'danger'} className="mt-0.5">
                {client?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company Name *"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+237 6XX XXX XXX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Button type="submit" isLoading={submitting}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Delivery Locations */}
      {client?.deliveryLocations && client.deliveryLocations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Delivery Locations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {client.deliveryLocations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div>
                  {loc.name && <p className="font-medium">{loc.name}</p>}
                  <p className="text-sm text-gray-600">{loc.address}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-400">To add or remove locations, contact BAJ Services.</p>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password *"
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
            <Input
              label="New Password *"
              type="password"
              required
              minLength={6}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
            <Input
              label="Confirm New Password *"
              type="password"
              required
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            />
            <Button type="submit" variant="outline" isLoading={changingPw}>Change Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
