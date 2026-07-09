import { useEffect, useState } from 'react';
import { get, post, put, patch, del, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState } from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';
import type { Client, Product } from '@/types';

const PAYMENT_TERMS = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'DAYS_10', label: '10 Days' },
  { value: 'DAYS_15', label: '15 Days' },
  { value: 'DAYS_30', label: '30 Days' },
];

export default function ClientsPage() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ companyName: '', email: '', phone: '', paymentTerms: 'IMMEDIATE' });
  const [submitting, setSubmitting] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });
  const [newPrice, setNewPrice] = useState({ productId: '', pricePerLiter: '' });

  const fetchAll = async () => {
    try {
      const [c, p] = await Promise.all([
        get<{ data: Client[] }>('/clients'),
        get<{ data: Product[] }>('/products?all=true'),
      ]);
      setClients(c.data);
      setProducts(p.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = clients.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.user.email.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleUpdate = async (id: string, data: object) => {
    try {
      await put(`/clients/${id}`, data);
      showToast('Client updated', 'success');
      await fetchAll();
      if (detailClient?.id === id) {
        const res = await get<{ data: Client }>(`/clients/${id}`);
        setDetailClient(res.data);
      }
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const resetPassword = async (id: string) => {
    try {
      await patch(`/clients/${id}/password`, { password: 'client123' });
      showToast('Password reset to client123', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Delete this client and all their data?')) return;
    try {
      await del(`/clients/${id}`);
      showToast('Client deleted', 'success');
      setDetailClient(null);
      await fetchAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const addLocation = async (clientId: string) => {
    if (!newLocation.address) return;
    try {
      await post(`/clients/${clientId}/locations`, newLocation);
      showToast('Location added', 'success');
      setNewLocation({ name: '', address: '' });
      const res = await get<{ data: Client }>(`/clients/${clientId}`);
      setDetailClient(res.data);
      await fetchAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const removeLocation = async (clientId: string, locationId: string) => {
    try {
      await del(`/clients/${clientId}/locations/${locationId}`);
      showToast('Location removed', 'success');
      const res = await get<{ data: Client }>(`/clients/${clientId}`);
      setDetailClient(res.data);
      await fetchAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const upsertPrice = async (clientId: string) => {
    if (!newPrice.productId || !newPrice.pricePerLiter) return;
    try {
      await post(`/clients/${clientId}/prices`, { productId: newPrice.productId, pricePerLiter: Number(newPrice.pricePerLiter) });
      showToast('Price saved', 'success');
      setNewPrice({ productId: '', pricePerLiter: '' });
      const res = await get<{ data: Client }>(`/clients/${clientId}`);
      setDetailClient(res.data);
      await fetchAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const removePrice = async (clientId: string, priceId: string) => {
    try {
      await del(`/clients/${clientId}/prices/${priceId}`);
      showToast('Price removed', 'success');
      const res = await get<{ data: Client }>(`/clients/${clientId}`);
      setDetailClient(res.data);
      await fetchAll();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} clients`}
        action={<Button onClick={() => setCreateOpen(true)}>+ Add Client</Button>}
      />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input placeholder="Search by company name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Company</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Payment Terms</TableHeader>
                  <TableHeader>Since</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setDetailClient(c)}>
                    <TableCell className="font-semibold">{c.companyName}</TableCell>
                    <TableCell className="text-gray-600">{c.user.email}</TableCell>
                    <TableCell>{c.phone || '-'}</TableCell>
                    <TableCell>{c.paymentTerms?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'success' : 'danger'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setDetailClient(c); }}>Manage</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState message="No clients found" />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add New Client"
        footer={<Button type="submit" form="client-form" isLoading={submitting}>Create Client</Button>}
      >
        <form id="client-form" onSubmit={handleCreate} className="space-y-4">
          <Input label="Company Name" required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <Input label="Login Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Payment Terms" options={PAYMENT_TERMS} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
          <p className="text-xs text-gray-500">Default password will be <strong>client123</strong></p>
        </form>
      </Modal>

      {/* Detail / Edit Modal */}
      {detailClient && (
        <Modal
          isOpen={!!detailClient}
          onClose={() => setDetailClient(null)}
          title={detailClient.companyName}
          footer={
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => deleteClient(detailClient.id)}>Delete Client</Button>
              <Button variant="outline" onClick={() => resetPassword(detailClient.id)}>Reset Password</Button>
              <Button onClick={() => handleUpdate(detailClient.id, { isActive: !detailClient.isActive })}>
                {detailClient.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-sm">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
              <div><p className="text-xs font-semibold uppercase text-gray-400">Email</p><p className="mt-0.5">{detailClient.user.email}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Phone</p><p className="mt-0.5">{detailClient.phone || '-'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Payment Terms</p><p className="mt-0.5">{detailClient.paymentTerms?.replace('_', ' ')}</p></div>
              <div><p className="text-xs font-semibold uppercase text-gray-400">Status</p>
                <Badge variant={detailClient.isActive ? 'success' : 'danger'} className="mt-0.5">{detailClient.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>

            {/* Delivery Locations */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Delivery Locations</p>
              <div className="space-y-2">
                {detailClient.deliveryLocations?.map((loc) => (
                  <div key={loc.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <div>
                      <p className="font-medium">{loc.name || loc.address}</p>
                      {loc.name && <p className="text-xs text-gray-500">{loc.address}</p>}
                    </div>
                    <Button size="sm" variant="danger" onClick={() => removeLocation(detailClient.id, loc.id)}>Remove</Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Input placeholder="Location name" value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} />
                <Input placeholder="Address *" value={newLocation.address} onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })} />
                <Button variant="outline" onClick={() => addLocation(detailClient.id)}>Add</Button>
              </div>
            </div>

            {/* Product Prices */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Negotiated Prices (XAF/L)</p>
              <div className="space-y-2">
                {detailClient.productPrices?.map((pp) => (
                  <div key={pp.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                    <p className="font-medium">{pp.product?.name ?? pp.productId}</p>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-brand-700">{pp.pricePerLiter} XAF/L</p>
                      <Button size="sm" variant="danger" onClick={() => removePrice(detailClient.id, pp.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <Select
                  options={[{ value: '', label: 'Select product' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
                  value={newPrice.productId}
                  onChange={(e) => setNewPrice({ ...newPrice, productId: e.target.value })}
                />
                <Input placeholder="Price/L" type="number" value={newPrice.pricePerLiter} onChange={(e) => setNewPrice({ ...newPrice, pricePerLiter: e.target.value })} className="w-32" />
                <Button variant="outline" onClick={() => upsertPrice(detailClient.id)}>Set Price</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
