import { useEffect, useState } from 'react';
import { get, put, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/types';

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ companyName: '', industry: '', phone: '', address: '', website: '' });
  const [contact, setContact] = useState({ name: '', title: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [prefs, setPrefs] = useState({ orders: true, invoices: true, eta: true, monthly: false });

  const fetchProfile = async () => {
    try {
      const res = await get<{ data: Client }>('/clients/me');
      const c = res.data;
      setClient(c);
      setForm({ companyName: c.companyName, industry: 'Mining', phone: c.phone || '', address: '', website: '' });
      setContact({ name: user?.name || '', title: '', email: user?.email || '', phone: c.phone || '' });
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
      await put(`/clients/${client.id}`, { companyName: form.companyName, phone: form.phone });
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
      await post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
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
    <div className="mx-auto max-w-4xl animate-fade-in">
      <h1 className="mb-6 text-xl font-bold text-navy-900">My Profile</h1>

      <div className="space-y-6">
        <Section title="Company Information">
          <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Company Name"><Input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
            <Field label="Industry">
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500">
                <option>Mining</option><option>Energy</option><option>Construction</option><option>Aviation</option>
              </select>
            </Field>
            <Field label="Business Registry #"><Input value="MR-1974-00124" readOnly className="bg-slate-50" /></Field>
            <Field label="Tax ID"><Input value="NIF-20240042" readOnly className="bg-slate-50" /></Field>
            <Field label="Head Office Address" className="sm:col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" /></Field>
            <Field label="Website"><Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></Field>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <Button type="submit" isLoading={submitting} className="bg-navy-900">Save Changes</Button>
            </div>
          </form>
        </Section>

        <Section title="Primary Contact">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Full Name"><Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></Field>
            <Field label="Job Title"><Input value={contact.title} onChange={(e) => setContact({ ...contact, title: e.target.value })} /></Field>
            <Field label="Email Address"><Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></Field>
            <Field label="Phone"><Input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></Field>
          </div>
        </Section>

        <Section title="Delivery Sites">
          <div className="space-y-3 p-5">
            {(client?.deliveryLocations || []).map((loc) => (
              <div key={loc.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-navy-900">{loc.name || 'Main Site'}</div>
                    <div className="text-xs text-slate-500">{loc.address}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit</button>
                    <button className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
                  </div>
                </div>
              </div>
            ))}
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              + Add Delivery Site
            </button>
          </div>
        </Section>

        <Section title="Notification Preferences">
          <div className="p-5">
            {[
              { key: 'orders', label: 'Order status updates', desc: 'Email when order is validated, dispatched, or delivered' },
              { key: 'invoices', label: 'Invoice reminders', desc: 'Reminder 3 days before and on invoice due date' },
              { key: 'eta', label: 'Delivery ETA alerts', desc: 'SMS to on-site contact 1h before delivery' },
              { key: 'monthly', label: 'Monthly consumption report', desc: 'Auto-generated PDF sent on 1st of each month' },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-700">{p.label}</div>
                  <div className="text-xs text-slate-500">{p.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefs((prev) => ({ ...prev, [p.key]: !prev[p.key as keyof typeof prefs] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${prefs[p.key as keyof typeof prefs] ? 'bg-navy-900' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${prefs[p.key as keyof typeof prefs] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Password & Security" action={<button onClick={() => setShowPwd(!showPwd)} className="text-xs font-semibold text-fire-600 hover:text-fire-700">{showPwd ? 'Cancel' : 'Change Password'}</button>}>
          {showPwd && (
            <form onSubmit={handleChangePassword} className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Current Password" className="sm:col-span-2"><Input type="password" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></Field>
              <Field label="New Password"><Input type="password" required value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></Field>
              <Field label="Confirm New Password"><Input type="password" required value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} /></Field>
              <div className="sm:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowPwd(false)}>Discard</Button>
                <Button type="submit" isLoading={changingPw} className="bg-navy-900">Save Password</Button>
              </div>
            </form>
          )}
        </Section>

        <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
          Account since {formatDate(client?.createdAt)} · Status: <span className="font-semibold text-emerald-600">Active</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-navy-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}
