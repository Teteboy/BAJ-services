import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Phone, User, Droplets, Fuel, Plane } from 'lucide-react';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import type { Product, Client, User as UserType } from '@/types';

type Unit = 'LITERS' | 'M3';

const PRODUCT_META: Record<string, { icon: React.ReactNode; min: string; color: string }> = {
  Gasoil: { icon: <Droplets className="h-6 w-6" />, min: '10,000', color: 'blue' },
  'Fuel Oil': { icon: <Fuel className="h-6 w-6" />, min: '100,000', color: 'purple' },
  'Jet A1': { icon: <Plane className="h-6 w-6" />, min: '25,000', color: 'amber' },
};

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState('120,000');
  const [unit, setUnit] = useState<Unit>('LITERS');
  const [deliveryDate, setDeliveryDate] = useState('2024-10-28');
  const [deliveryLocationId, setDeliveryLocationId] = useState('');
  const [contactPerson, setContactPerson] = useState('M. Ndiaye');
  const [contactPhone, setContactPhone] = useState('+222 45 12 34 56');
  const [poNumber, setPoNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prod, me] = await Promise.all([
          get<{ data: Product[] }>('/products'),
          get<{ data: UserType }>('/auth/me'),
        ]);
        const active = prod.data.filter((p) => p.isActive);
        setProducts(active);
        setSelectedProduct(active[0]?.id ?? '');
        if (me.data.clientId) {
          const clientRes = await get<{ data: Client }>('/clients/me');
          setClient(clientRes.data);
        }
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const selectedProductName = products.find((p) => p.id === selectedProduct)?.name ?? 'Gasoil';
  const pricePerUnit = client?.productPrices.find((p) => p.productId === selectedProduct)?.pricePerLiter ?? 0;
  const qtyNum = Number(quantity.replace(/,/g, '')) || 0;
  const estimatedTotal = qtyNum * pricePerUnit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast('Please select a product', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await post('/orders', {
        requestedDeliveryDate: new Date(`${deliveryDate}T00:00:00`).toISOString(),
        deliveryLocationId: deliveryLocationId || undefined,
        contactPerson: contactPerson || undefined,
        contactPhone: contactPhone || undefined,
        notes: notes || undefined,
        items: [{ productId: selectedProduct, quantity: qtyNum, unit }],
      });
      setShowSuccess(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  if (showSuccess) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <h2 className="text-xl font-bold text-emerald-900">Order Submitted!</h2>
          <p className="mt-2 text-sm text-slate-600">Your order has been received. Our team will validate it within 2 business hours.</p>
          <div className="mt-5 rounded-lg border border-emerald-200 bg-white p-4 text-left">
            <div className="mb-1 flex justify-between text-sm"><span className="text-slate-500">Order #</span><span className="font-bold text-navy-900">OFF-2024-090</span></div>
            <div className="mb-1 flex justify-between text-sm"><span className="text-slate-500">Product</span><span className="font-medium">{selectedProductName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Status</span><span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Pending Validation</span></div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setShowSuccess(false); setQuantity('120,000'); }} className="flex-1 bg-fire-gradient">
              Place Another Order
            </Button>
            <Button onClick={() => navigate('/app/client/orders')} variant="outline" className="flex-1">
              View My Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy-900">Place New Delivery Order</h1>
        <p className="text-sm text-slate-500">Fill in the details below. Orders require at least 48h lead time.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-navy-900">Select Product</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {products.map((p) => {
                const meta = PRODUCT_META[p.name] || { icon: <Droplets className="h-6 w-6" />, min: '10,000', color: 'blue' };
                const active = selectedProduct === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p.id)}
                    className={`rounded-lg border p-4 text-center transition-all ${
                      active ? 'border-2 border-navy-900 bg-navy-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-navy-100 text-navy-900' : 'bg-slate-100 text-slate-500'}`}>
                      {meta.icon}
                    </div>
                    <div className={`text-sm font-bold ${active ? 'text-navy-900' : 'text-slate-700'}`}>{p.name}</div>
                    <div className="text-[10px] text-slate-500">Min. {meta.min} L</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-navy-900">Delivery Details</h2>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</label>
              <div className="flex">
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 120,000"
                  className="rounded-r-none border-r-0"
                />
                <div className="flex overflow-hidden rounded-r-lg border border-l-0 border-slate-300 bg-slate-50">
                  {(['LITERS', 'M3'] as Unit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`px-3 text-xs font-bold ${unit === u ? 'bg-slate-200 text-navy-900' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {u === 'LITERS' ? 'Liters' : 'm³'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred Delivery Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={deliveryLocationId}
                  onChange={(e) => setDeliveryLocationId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                >
                  <option value="">Select location...</option>
                  {client?.deliveryLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name || loc.address}</option>
                  ))}
                  {!client?.deliveryLocations.length && <option value="">Nouadhibou Port</option>}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">On-Site Contact Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Name" className="pl-9" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">On-Site Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+222 ..." className="pl-9" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase Order # (optional)</label>
              <Input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Your internal PO reference" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Special Instructions (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Access instructions, timing requirements..."
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-800">
            Orders must be placed at least 48 hours before the requested delivery date. Final pricing is based on your negotiated contract.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Estimated total</p>
              <p className="text-2xl font-bold text-navy-900">{formatCurrency(estimatedTotal)}</p>
              <p className="text-xs text-slate-400">Based on {qtyNum.toLocaleString()} {unit === 'LITERS' ? 'L' : 'm³'} at {formatCurrency(pricePerUnit)}/{unit === 'LITERS' ? 'L' : 'm³'}</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/app/client')}>
                Save as Draft
              </Button>
              <Button type="submit" isLoading={submitting} className="bg-fire-gradient px-6">
                Submit Order →
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
