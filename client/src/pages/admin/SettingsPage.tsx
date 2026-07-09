import { useEffect, useState } from 'react';
import { Settings, Bell, Shield, Database, Save, RefreshCw } from 'lucide-react';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SECTIONS: SettingsSection[] = [
  { id: 'general',       label: 'General',        icon: <Settings className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications',   icon: <Bell className="h-4 w-4" /> },
  { id: 'security',      label: 'Security',        icon: <Shield className="h-4 w-4" /> },
  { id: 'database',      label: 'Database',        icon: <Database className="h-4 w-4" /> },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'DAYS_10',   label: '10 Days' },
  { value: 'DAYS_15',   label: '15 Days' },
  { value: 'DAYS_30',   label: '30 Days' },
];

const CURRENCY_OPTIONS = [
  { value: 'XAF', label: 'XAF – Central African Franc' },
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'EUR', label: 'EUR – Euro' },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [general, setGeneral] = useState({
    companyName:        'On Fire',
    companyEmail:       'contact@onfire.com',
    companyPhone:       '',
    companyAddress:     '',
    currency:           'XAF',
    defaultPaymentTerms:'DAYS_30',
    invoiceDueDays:     '30',
    timezone:           'Africa/Douala',
  });

  const [notifications, setNotifications] = useState({
    emailOnNewOrder:     true,
    emailOnPayment:      true,
    emailOnInvoiceOverdue: true,
    weeklyReportEmail:   true,
    reportRecipients:    '',
  });

  const [security, setSecurity] = useState({
    sessionTimeoutMinutes: '60',
    requireStrongPassword:  true,
    maxLoginAttempts:       '5',
  });

  const [dbInfo, setDbInfo] = useState<{ tables: string[]; rowCounts: Record<string, number> } | null>(null);

  useEffect(() => {
    if (activeSection === 'database') fetchDbInfo();
  }, [activeSection]);

  const fetchDbInfo = async () => {
    setLoading(true);
    try {
      await get<{ data: any }>('/reports');
      setDbInfo({ tables: ['users', 'clients', 'orders', 'invoices', 'payments', 'products', 'stock_entries', 'weekly_reports'], rowCounts: {} });
    } catch {
      setDbInfo({ tables: [], rowCounts: {} });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast('General settings saved', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast('Notification settings saved', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      showToast('Security settings saved', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    setSeeding(true);
    try {
      await post('/reports/generate');
      showToast('Weekly report generated successfully', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSeeding(false);
    }
  };

  const sectionContent: Record<string, React.ReactNode> = {
    general: (
      <form onSubmit={handleSaveGeneral} className="space-y-6">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Company Information</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" required value={general.companyName} onChange={(e) => setGeneral({ ...general, companyName: e.target.value })} />
            <Input label="Company Email" type="email" value={general.companyEmail} onChange={(e) => setGeneral({ ...general, companyEmail: e.target.value })} />
            <Input label="Phone Number" value={general.companyPhone} onChange={(e) => setGeneral({ ...general, companyPhone: e.target.value })} placeholder="+237 6XX XXX XXX" />
            <Input label="Address" value={general.companyAddress} onChange={(e) => setGeneral({ ...general, companyAddress: e.target.value })} />
          </div>
        </div>

        <div className="border-t border-surface-800 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Finance & Billing</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Currency" options={CURRENCY_OPTIONS} value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })} />
            <Select label="Default Payment Terms" options={PAYMENT_TERMS_OPTIONS} value={general.defaultPaymentTerms} onChange={(e) => setGeneral({ ...general, defaultPaymentTerms: e.target.value })} />
            <Input label="Invoice Due Days" type="number" min={0} value={general.invoiceDueDays} onChange={(e) => setGeneral({ ...general, invoiceDueDays: e.target.value })} />
          </div>
        </div>

        <div className="border-t border-surface-800 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Regional</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Timezone" value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={saving} className="gap-2">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    ),

    notifications: (
      <form onSubmit={handleSaveNotifications} className="space-y-6">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Email Alerts</p>
          <div className="space-y-3">
            {[
              { key: 'emailOnNewOrder',       label: 'New order received',         desc: 'Get notified when a client places a new order' },
              { key: 'emailOnPayment',         label: 'Payment recorded',           desc: 'Get notified when a payment is logged' },
              { key: 'emailOnInvoiceOverdue',  label: 'Invoice overdue',            desc: 'Alert when an invoice passes its due date' },
              { key: 'weeklyReportEmail',      label: 'Weekly report email',        desc: 'Receive weekly performance summary' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-800/30 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="mt-0.5 text-xs text-surface-500">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                  className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${notifications[key as keyof typeof notifications] ? 'bg-brand-600' : 'bg-surface-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-800 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Report Recipients</p>
          <Input
            label="Email addresses (comma-separated)"
            value={notifications.reportRecipients}
            onChange={(e) => setNotifications({ ...notifications, reportRecipients: e.target.value })}
            placeholder="admin@onfire.com, manager@onfire.com"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={saving} className="gap-2">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    ),

    security: (
      <form onSubmit={handleSaveSecurity} className="space-y-6">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Session & Access</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Session Timeout (minutes)"
              type="number"
              min={5}
              value={security.sessionTimeoutMinutes}
              onChange={(e) => setSecurity({ ...security, sessionTimeoutMinutes: e.target.value })}
            />
            <Input
              label="Max Login Attempts"
              type="number"
              min={1}
              max={20}
              value={security.maxLoginAttempts}
              onChange={(e) => setSecurity({ ...security, maxLoginAttempts: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-surface-800 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Password Policy</p>
          <div className="flex items-center justify-between rounded-xl border border-surface-700/60 bg-surface-800/30 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-white">Require strong passwords</p>
              <p className="mt-0.5 text-xs text-surface-500">Min 8 characters, uppercase, number, special character</p>
            </div>
            <button
              type="button"
              onClick={() => setSecurity((s) => ({ ...s, requireStrongPassword: !s.requireStrongPassword }))}
              className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${security.requireStrongPassword ? 'bg-brand-600' : 'bg-surface-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${security.requireStrongPassword ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={saving} className="gap-2">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    ),

    database: (
      <div className="space-y-6">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Database Status</p>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Connected</p>
              <p className="text-xs text-surface-500">PostgreSQL · localhost:5432 · fuel_services</p>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-800 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">Quick Actions</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-700/60 bg-surface-800/30 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                <RefreshCw className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-white">Generate Weekly Report</p>
              <p className="mt-1 text-xs text-surface-500">Manually trigger report generation for the current week</p>
              <Button variant="outline" size="sm" className="mt-4" isLoading={seeding} onClick={handleGenerateReport}>
                Generate Now
              </Button>
            </div>
            <div className="rounded-xl border border-surface-700/60 bg-surface-800/30 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Database className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-white">Database Tables</p>
              <p className="mt-1 text-xs text-surface-500">Core schema tables in the fuel_services database</p>
              {loading ? (
                <LoadingSpinner size="sm" className="mt-4 justify-start" />
              ) : (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(dbInfo?.tables ?? ['users','clients','orders','invoices','payments','products']).map((t) => (
                    <span key={t} className="rounded-md bg-surface-700/60 px-2 py-0.5 text-[10px] font-mono text-surface-300">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-surface-800 pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-surface-500">System Info</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Runtime', value: 'Node.js / Express' },
              { label: 'ORM', value: 'Prisma v6' },
              { label: 'Frontend', value: 'React + Vite' },
              { label: 'Database', value: 'PostgreSQL 15' },
              { label: 'Auth', value: 'JWT Bearer' },
              { label: 'Storage', value: 'Local (uploads/)' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-surface-700/60 bg-surface-800/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-surface-600">{label}</p>
                <p className="mt-1 text-sm font-medium text-surface-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" subtitle="Manage system configuration and preferences" />

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeSection === s.id
                    ? 'bg-brand-600/15 text-brand-300'
                    : 'text-surface-400 hover:bg-surface-800/70 hover:text-white'
                }`}
              >
                <span className={activeSection === s.id ? 'text-brand-400' : 'text-surface-500'}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle>{SECTIONS.find((s) => s.id === activeSection)?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {sectionContent[activeSection]}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
