import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/payments
router.get('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  const payments = await prisma.payment.findMany({
    include: {
      invoice: {
        include: {
          client: true,
          order: true,
        },
      },
    },
    orderBy: { paidAt: 'desc' },
  });
  res.json({ data: payments, total: payments.length });
});

// POST /api/payments (record a payment)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoiceId, amount, method, reference } = req.body;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method: method ?? invoice.paymentMethod,
      reference,
      confirmedById: req.user!.id,
    },
    include: { invoice: { include: { client: true } } },
  });

  // Compute total paid
  const agg = await prisma.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true },
  });
  const totalPaid = agg._sum.amount ?? 0;

  if (totalPaid >= invoice.totalAmount) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  res.status(201).json({ data: payment });
});

export default router;
