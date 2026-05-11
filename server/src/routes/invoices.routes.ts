import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { isPast } from 'date-fns';

const router = Router();

const invoiceInclude = {
  client: { include: { user: { select: { email: true } } } },
  order: true,
  items: { include: { product: true } },
  payments: true,
};

// Auto-mark SENT invoices as OVERDUE if deadline has passed
async function autoMarkOverdue() {
  await prisma.invoice.updateMany({
    where: {
      status: 'SENT',
      paymentDeadline: { lt: new Date() },
    },
    data: { status: 'OVERDUE' },
  });
}

// GET /api/invoices
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await autoMarkOverdue();

  const { status, page = '1', limit = '50' } = req.query as Record<string, string>;
  const where: any = {};
  if (req.user!.role === 'CLIENT') where.clientId = req.user!.clientId;
  if (status) where.status = status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: { issuedAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({ data: invoices, total, page: Number(page), limit: Number(limit) });
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: invoiceInclude,
  });
  if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
  if (req.user!.role === 'CLIENT' && invoice.clientId !== req.user!.clientId) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }
  res.json({ data: invoice });
});

// PATCH /api/invoices/:id/status (admin)
router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status, ...(status === 'PAID' ? { paidAt: new Date() } : {}) },
    include: invoiceInclude,
  });
  res.json({ data: invoice });
});

// DELETE /api/invoices/:id (admin — only DRAFT invoices)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!invoice) { res.status(404).json({ message: 'Invoice not found' }); return; }
  if (invoice.status !== 'DRAFT') { res.status(400).json({ message: 'Only DRAFT invoices can be deleted' }); return; }
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.json({ data: { message: 'Invoice deleted' } });
});

export default router;
