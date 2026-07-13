import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Edit3, Trash2, Lock,
  CheckCircle, XCircle, Plus, Download, FileText,
} from 'lucide-react';
import { get, post, put, patch, del, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, formatDate, exportToCSV, downloadFile } from '@/lib/utils';
import type { Client, Product, Order, Invoice } from '@/types';

const PAYMENT_TERMS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'DAYS_10', label: '10 Days' },
  { value: 'DAYS_15', label: '15 Days' },
  { value: 'DAYS_30', label: '30 Days' },
];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ companyName: '', email: '', phone: '', paymentTerms: 'IMMEDIATE', isActive: true });
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [newPrice, setNewPrice] = useState({ productId: '', pricePerLiter: '' });

  const fetchClient = async () => {
    if (!id) return;
    try {
      const res = await get<{ data: Client }>(`/clients/${id}`);
      setClient(res.data);
      setForm({
        companyName: res.data.companyName,
        email: res.data.user.email,
        phone: res.data.phone ?? '',
        paymentTerms: res.data.paymentTerms ?? 'IMMEDIATE',
        isActive: res.data.isActive,
      });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, p, o, i] = await Promise.all([
        get<{ data: Client }>(`/clients/${id}`),
        get<{ data: Product[] }>('/products?all=true'),
        get<{ data: Order[]; total: number }>(`/orders?clientId=${id}&limit=100`),
        get<{ data: Invoice[]; total: number }>(`/invoices?clientId=${id}&limit=100`),
      ]);
      setClient(c.data);
      setForm({
        companyName: c.data.companyName,
        email: c.data.user.email,
        phone: c.data.phone ?? '',
        paymentTerms: c.data.paymentTerms ?? 'IMMEDIATE',
        isActive: c.data.isActive,
      });
      setProducts(p.data);
      setOrders(o.data);
      setInvoices(i.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleUpdate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      await put(`/clients/${id}`, form);
      showToast('Client updated', 'success');
      await fetchClient();
      setEditing(false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async () => {
    if (!id) return;
    try {
      await put(`/clients/${id}`, { isActive: !client?.isActive });
      showToast(`Client ${client?.isActive ? 'deactivated' : 'activated'}`, 'success');
      await fetchClient();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const resetPassword = async () => {
    if (!id) return;
    try {
      await patch(`/clients/${id}/password`, { password: 'client123' });
      showToast('Password reset to client123', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const deleteClient = async () => {
    if (!id || !confirm('Delete this client and all their data?')) return;
    try {
      await del(`/clients/${id}`);
      showToast('Client deleted', 'success');
      navigate('/app/clients');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const addLocation = async () => {
    if (!id || !newLocation.address) return;
    try {
      await post(`/clients/${id}/locations`, newLocation);
      showToast('Location added', 'success');
      setNewLocation({ name: '', address: '' });
      await fetchClient();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const removeLocation = async (locationId: string) => {
    if (!id) return;
    try {
      await del(`/clients/${id}/locations/${locationId}`);
      showToast('Location removed', 'success');
      await fetchClient();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const upsertPrice = async () => {
    if (!id || !newPrice.productId || !newPrice.pricePerLiter) return;
    try {
      await post(`/clients/${id}/prices`, { productId: newPrice.productId, pricePerLiter: Number(newPrice.pricePerLiter) });
      showToast('Price saved', 'success');
      setNewPrice({ productId: '', pricePerLiter: '' });
      await fetchClient();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const removePrice = async (priceId: string) => {
    if (!id) return;
    try {
      await del(`/clients/${id}/prices/${priceId}`);
      showToast('Price removed', 'success');
      await fetchClient();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const exportInvoices = () => {
    const headers = ['Invoice #', 'Order #', 'Amount', 'Status', 'Due Date', 'Paid Date'];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.order?.orderNumber ?? '-',
      inv.totalAmount,
      inv.status,
      formatDate(inv.paymentDeadline),
      inv.paidAt ? formatDate(inv.paidAt) : '-',
    ]);
    exportToCSV(headers, rows, `invoices-${client?.companyName ?? 'client'}.csv`);
  };

  const exportOrders = () => {
    const headers = ['Order #', 'Product', 'Qty', 'Status', 'Delivery Date', 'Total'];
    const rows = orders.map((order) => {
      const item = order.items[0];
      return [
        order.orderNumber,
        item?.product?.name ?? '-',
        item?.quantity ?? 0,
        order.status,
        formatDate(order.requestedDeliveryDate),
        order.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0),
      ];
    });
    exportToCSV(headers, rows, `orders-${client?.companyName ?? 'client'}.csv`);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-admin-textSub">
        <p>Client not found.</p>
        <Link to="/app/clients" className="text-sm font-semibold text-blue-400 hover:text-blue-300">Back to Clients</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/clients" className="flex h-8 w-8 items-center justify-center rounded-lg border border-admin-border text-admin-textSub hover:bg-white/5 hover:text-admin-text">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-admin-text">{client.companyName}</h1>
            <p className="text-xs text-admin-textSub">Client detail & account management</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing((v) => !v)}>{editing ? 'Cancel Edit' : <><Edit3 className="mr-1 h-4 w-4" /> Edit</>}</Button>
          <Button variant="outline" onClick={resetPassword}><Lock className="mr-1 h-4 w-4" /> Reset Password</Button>
          <Button onClick={toggleActive} className={client.isActive ? 'bg-red-600' : 'bg-emerald-600'}>
            {client.isActive ? <><XCircle className="mr-1 h-4 w-4" /> Deactivate</> : <><CheckCircle className="mr-1 h-4 w-4" /> Activate</>}
          </Button>
          <Button variant="danger" onClick={deleteClient}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      {/* Account Info */}
      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="border-b border-admin-border px-5 py-4">
          <span className="text-[15px] font-semibold text-admin-text">Account Information</span>
        </div>
        <div className="p-5">
          {editing ? (
            <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
              <Input label="Company Name" required variant="dark" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              <Input label="Login Email" type="email" required variant="dark" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" variant="dark" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-admin-textMuted">Payment Terms</label>
                <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="h-10 w-full rounded-lg border border-admin-border bg-admin-bg px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none">
                  {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input id="active" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-admin-border bg-admin-bg text-blue-600" />
                <label htmlFor="active" className="text-sm text-admin-text">Account active</label>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" isLoading={submitting} className="bg-blue-600">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"><Building2 className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase text-admin-textSub">Company</p>
                  <p className="text-sm font-semibold text-admin-text">{client.companyName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"><Mail className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase text-admin-textSub">Email</p>
                  <p className="text-sm font-semibold text-admin-text">{client.user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"><Phone className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase text-admin-textSub">Phone</p>
                  <p className="text-sm font-semibold text-admin-text">{client.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"><FileText className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase text-admin-textSub">Payment Terms</p>
                  <p className="text-sm font-semibold text-admin-text">{client.paymentTerms?.replace('_', ' ') || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delivery Locations */}
        <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
          <div className="border-b border-admin-border px-5 py-4">
            <span className="text-[15px] font-semibold text-admin-text">Delivery Locations</span>
          </div>
          <div className="p-5">
            <div className="mb-4 space-y-2">
              {client.deliveryLocations?.length ? client.deliveryLocations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between rounded-lg border border-admin-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-admin-textSub" />
                    <div>
                      <p className="text-sm font-medium text-admin-text">{loc.name || loc.address}</p>
                      {loc.name && <p className="text-xs text-admin-textSub">{loc.address}</p>}
                    </div>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => removeLocation(loc.id)}>Remove</Button>
                </div>
              )) : (
                <p className="text-sm text-admin-textSub">No delivery locations yet.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input variant="dark" placeholder="Name" value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} />
              <Input variant="dark" placeholder="Address *" value={newLocation.address} onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })} />
              <Button variant="outline" onClick={addLocation}><Plus className="h-4 w-4" /> Add</Button>
            </div>
          </div>
        </div>

        {/* Negotiated Prices */}
        <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
          <div className="border-b border-admin-border px-5 py-4">
            <span className="text-[15px] font-semibold text-admin-text">Negotiated Prices</span>
          </div>
          <div className="p-5">
            <div className="mb-4 space-y-2">
              {client.productPrices?.length ? client.productPrices.map((pp) => (
                <div key={pp.id} className="flex items-center justify-between rounded-lg border border-admin-border px-3 py-2">
                  <p className="text-sm font-medium text-admin-text">{pp.product?.name ?? pp.productId}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(pp.pricePerLiter)} / L</p>
                    <Button size="sm" variant="danger" onClick={() => removePrice(pp.id)}>Remove</Button>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-admin-textSub">No negotiated prices yet.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={newPrice.productId} onChange={(e) => setNewPrice({ ...newPrice, productId: e.target.value })} className="h-10 rounded-lg border border-admin-border bg-admin-bg px-3 text-sm text-admin-text focus:border-blue-500 focus:outline-none">
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input variant="dark" type="number" placeholder="Price/L" value={newPrice.pricePerLiter} onChange={(e) => setNewPrice({ ...newPrice, pricePerLiter: e.target.value })} className="w-32" />
              <Button variant="outline" onClick={upsertPrice}><Plus className="h-4 w-4" /> Set Price</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <span className="text-[15px] font-semibold text-admin-text">Recent Orders</span>
          <Button variant="outline" size="sm" onClick={exportOrders}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Product</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Delivery Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length ? orders.slice(0, 10).map((order) => {
                const item = order.items[0];
                const total = order.items.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
                return (
                  <tr key={order.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-sm font-semibold text-admin-text">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-admin-textMuted">{item?.product?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-sm text-admin-textMuted">{item?.quantity.toLocaleString() ?? 0} {item?.unit ?? 'L'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : order.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-admin-textMuted">{formatDate(order.requestedDeliveryDate)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-admin-text">{formatCurrency(total)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-admin-textSub">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-card">
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <span className="text-[15px] font-semibold text-admin-text">Invoices</span>
          <Button variant="outline" size="sm" onClick={exportInvoices}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-admin-bg/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Invoice #</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-admin-textSub">Due Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-admin-textSub">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length ? invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-admin-border/60 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm font-semibold text-admin-text">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-admin-text">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded px-2 py-1 text-[10px] font-bold uppercase', inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : inv.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')}>{inv.status}</span>
                  </td>
                  <td className={cn('px-4 py-3 text-sm', inv.status === 'OVERDUE' ? 'font-semibold text-red-400' : 'text-admin-textMuted')}>{formatDate(inv.paymentDeadline)}</td>
                  <td className="px-4 py-3 text-right">
                    {inv.pdfUrl && <Button size="sm" variant="outline" onClick={() => downloadFile(inv.pdfUrl!, `${inv.invoiceNumber}.pdf`)}><Download className="mr-1 h-4 w-4" /> PDF</Button>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-admin-textSub">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
