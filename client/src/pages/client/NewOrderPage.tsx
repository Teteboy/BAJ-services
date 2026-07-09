import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, getErrorMessage } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatCurrency } from '@/lib/utils';
import type { Product, Client, User } from '@/types';

interface OrderItemRow {
  productId: string;
  quantity: number;
  unit: 'LITERS' | 'M3';
  pricePerUnit: number;
}

const UNIT_OPTIONS = [
  { value: 'LITERS', label: 'Liters (L)' },
  { value: 'M3', label: 'Cubic Meters (m³)' },
];

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<OrderItemRow[]>([{ productId: '', quantity: 1, unit: 'LITERS', pricePerUnit: 0 }]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryLocationId, setDeliveryLocationId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prod, me] = await Promise.all([
          get<{ data: Product[] }>('/products'),
          get<{ data: User }>('/auth/me'),
        ]);
        setProducts(prod.data.filter((p) => p.isActive));
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

  const updateItemProduct = (index: number, productId: string) => {
    const price = client?.productPrices.find((p) => p.productId === productId)?.pricePerLiter ?? 0;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], productId, pricePerUnit: price };
    setItems(newItems);
  };

  const updateItemField = (index: number, field: keyof OrderItemRow, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: '', quantity: 1, unit: 'LITERS', pricePerUnit: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const total = items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);

  const locationOptions = [
    { value: '', label: 'Select delivery location...' },
    ...(client?.deliveryLocations.map((loc) => ({ value: loc.id, label: `${loc.name ? loc.name + ' — ' : ''}${loc.address}` })) ?? []),
  ];

  const productOptions = [
    { value: '', label: 'Select product...' },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((i) => !i.productId)) {
      showToast('Please select a product for each item', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        requestedDeliveryDate: new Date(deliveryDate).toISOString(),
        deliveryLocationId: deliveryLocationId || undefined,
        contactPerson: contactPerson || undefined,
        contactPhone: contactPhone || undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
        })),
      };
      await post('/orders', payload);
      showToast('Order placed successfully!', 'success');
      navigate('/orders');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Place New Order" subtitle="Fill in the details below to request fuel delivery" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Delivery Details */}
        <Card>
          <CardHeader><CardTitle>Delivery Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Requested Delivery Date & Time *"
                type="datetime-local"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
              <Select
                label="Delivery Location"
                options={locationOptions}
                value={deliveryLocationId}
                onChange={(e) => setDeliveryLocationId(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Contact Person *"
                required
                placeholder="Name of person at delivery site"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
              <Input
                label="Contact Phone *"
                required
                type="tel"
                placeholder="+237 6XX XXX XXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                rows={2}
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Product</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, index) => {
              const negotiatedPrice = client?.productPrices.find((p) => p.productId === item.productId)?.pricePerLiter;
              return (
                <div key={index} className="rounded-lg border border-gray-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Select
                        label="Product *"
                        required
                        options={productOptions}
                        value={item.productId}
                        onChange={(e) => updateItemProduct(index, e.target.value)}
                      />
                    </div>
                    <Input
                      label="Quantity *"
                      type="number"
                      required
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItemField(index, 'quantity', Number(e.target.value))}
                    />
                    <Select
                      label="Unit"
                      options={UNIT_OPTIONS}
                      value={item.unit}
                      onChange={(e) => updateItemField(index, 'unit', e.target.value)}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {negotiatedPrice !== undefined ? (
                        <span>
                          Your price: <strong className="text-brand-700">{formatCurrency(negotiatedPrice)} / L</strong>
                          {' · '}
                          Subtotal: <strong>{formatCurrency(item.quantity * negotiatedPrice)}</strong>
                        </span>
                      ) : item.productId ? (
                        <span className="text-amber-600">No negotiated price set for this product</span>
                      ) : null}
                    </div>
                    {items.length > 1 && (
                      <Button type="button" size="sm" variant="danger" onClick={() => removeItem(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="border-brand-200 bg-brand-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{items.filter((i) => i.productId).length} product(s)</p>
                <p className="text-2xl font-bold text-gray-900">Estimated Total: {formatCurrency(total)}</p>
                <p className="mt-1 text-xs text-gray-500">* Final amount may vary. An invoice will be generated after delivery.</p>
              </div>
              <Button type="submit" isLoading={submitting} className="px-8">
                Place Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
