import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendEmail } from '../services/email.service';
import { generateInvoicePDF } from '../services/invoice.service';
import { addDays, isAfter } from 'date-fns';

const router = Router();

const orderInclude = {
  client: {
    include: {
      deliveryLocations: true,
      productPrices: { include: { product: true } },
      user: { select: { email: true, name: true } },
    },
  },
  deliveryLocation: true,
  items: { include: { product: true } },
};

function generateOrderNumber(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${ts}-${rand}`;
}

// GET /api/orders
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, status, page = '1', limit = '50' } = req.query as Record<string, string>;

  const where: any = {};

  // Clients only see their own orders
  if (req.user!.role === 'CLIENT') {
    where.clientId = req.user!.clientId;
  }

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { client: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data: orders, total, page: Number(page), limit: Number(limit) });
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: orderInclude,
  });

  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

  // Client can only see own order
  if (req.user!.role === 'CLIENT' && order.clientId !== req.user!.clientId) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }

  res.json({ data: order });
});

// POST /api/orders (client)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const clientId = req.user!.clientId;
  if (!clientId) { res.status(400).json({ message: 'Not a client account' }); return; }

  const { deliveryLocationId, requestedDeliveryDate, contactPerson, contactPhone, items } = req.body;

  // Enforce 48h lead time
  const delivDate = new Date(requestedDeliveryDate);
  if (!isAfter(delivDate, addDays(new Date(), 1))) {
    res.status(400).json({ message: 'Delivery date must be at least 48 hours from now' });
    return;
  }

  // Get client prices
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { productPrices: true, user: { select: { email: true } } },
  });

  const orderItems = items.map((item: any) => {
    const priceRec = client?.productPrices.find((p) => p.productId === item.productId);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: priceRec?.pricePerLiter ?? 0,
    };
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      clientId,
      deliveryLocationId,
      requestedDeliveryDate: delivDate,
      contactPerson,
      contactPhone,
      items: { create: orderItems },
    },
    include: orderInclude,
  });

  // Notify BAJ
  await sendEmail({
    to: process.env.ADMIN_EMAIL ?? 'admin@bajservices.com',
    subject: `New Order #${order.orderNumber} from ${order.client.companyName}`,
    html: `<p>A new order has been placed by <strong>${order.client.companyName}</strong>.</p>
           <p>Order: <strong>#${order.orderNumber}</strong></p>
           <p>Delivery date: <strong>${requestedDeliveryDate}</strong></p>`,
  });

  res.status(201).json({ data: order });
});

// PATCH /api/orders/:id/status (admin)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, note, newDeliveryDate } = req.body;

  const existing = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { client: { include: { user: { select: { email: true } } } } },
  });

  if (!existing) { res.status(404).json({ message: 'Order not found' }); return; }

  const updateData: any = { status };
  if (status === 'REJECTED') updateData.rejectionReason = note;
  if (status === 'MODIFIED') {
    updateData.modificationNote = note;
    if (newDeliveryDate) updateData.requestedDeliveryDate = new Date(newDeliveryDate);
  }

  const order = await prisma.order.update({
    where: { id: String(req.params.id) },
    data: updateData,
    include: orderInclude,
  });

  // Email client
  const clientEmail = existing.client?.user?.email;
  if (clientEmail) {
    const subjectMap: Record<string, string> = {
      VALIDATED: `Order #${existing.orderNumber} Validated`,
      MODIFIED: `Order #${existing.orderNumber} Modified`,
      REJECTED: `Order #${existing.orderNumber} Rejected`,
    };
    await sendEmail({
      to: clientEmail,
      subject: subjectMap[status] ?? `Order #${existing.orderNumber} Update`,
      html: `<p>Your order <strong>#${existing.orderNumber}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
             ${note ? `<p>Note: ${note}</p>` : ''}`,
    });
  }

  res.json({ data: order });
});

// POST /api/orders/:id/confirm-delivery (admin)
router.post('/:id/confirm-delivery', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: {
      client: {
        include: {
          user: { select: { email: true } },
          productPrices: { include: { product: true } },
        },
      },
      items: { include: { product: true } },
    },
  });

  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  if (order.status !== 'VALIDATED') {
    res.status(400).json({ message: 'Order must be validated before delivery confirmation' }); return;
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'DELIVERED' },
  });

  // Create delivery record
  await prisma.delivery.create({
    data: { orderId: order.id, confirmedAt: new Date() },
  });

  // Calculate payment deadline based on client payment terms
  const termDays: Record<string, number> = {
    IMMEDIATE: 0,
    DAYS_10: 10,
    DAYS_15: 15,
    DAYS_30: 30,
  };
  const days = termDays[order.client.paymentTerms] ?? 0;
  const paymentDeadline = addDays(new Date(), days);

  // Generate invoice items
  const totalAmount = order.items.reduce(
    (sum, item) => sum + item.quantity * item.pricePerUnit,
    0
  );

  const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      clientId: order.clientId,
      totalAmount,
      paymentDeadline,
      items: {
        create: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          totalAmount: item.quantity * item.pricePerUnit,
        })),
      },
    },
    include: {
      client: { include: { user: { select: { email: true } } } },
      items: { include: { product: true } },
      order: true,
    },
  });

  // Generate PDF
  const pdfPath = await generateInvoicePDF(invoice);
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl: `/uploads/invoices/${invoiceNumber}.pdf` },
  });

  // Send invoice to client
  const clientEmail = order.client?.user?.email;
  if (clientEmail) {
    await sendEmail({
      to: clientEmail,
      subject: `Invoice #${invoiceNumber} — Order #${order.orderNumber}`,
      html: `<p>Dear ${order.client.companyName},</p>
             <p>Your order <strong>#${order.orderNumber}</strong> has been delivered.</p>
             <p>Invoice total: <strong>${totalAmount.toLocaleString()} XAF</strong></p>
             <p>Payment deadline: <strong>${paymentDeadline.toLocaleDateString()}</strong></p>`,
      attachments: pdfPath ? [{ filename: `${invoiceNumber}.pdf`, path: pdfPath }] : [],
    });
  }

  res.json({ data: { message: 'Delivery confirmed, invoice generated and sent.' } });
});

export default router;
