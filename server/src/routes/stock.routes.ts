import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/stock
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { limit = '50', productId } = req.query as Record<string, string>;
  const where: any = {};
  if (productId) where.productId = productId;

  const entries = await prisma.stockEntry.findMany({
    where,
    include: { product: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
  });
  res.json({ data: entries, total: entries.length });
});

// POST /api/stock
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { weekStartDate, weekEndDate, productId, initialStock, totalDelivered, notes } = req.body;
  const entry = await prisma.stockEntry.create({
    data: {
      weekStartDate: new Date(weekStartDate),
      weekEndDate: new Date(weekEndDate),
      productId,
      initialStock: Number(initialStock),
      totalDelivered: Number(totalDelivered),
      remainingStock: Number(initialStock) - Number(totalDelivered),
      notes,
      createdById: req.user!.id,
    },
    include: { product: true },
  });
  res.status(201).json({ data: entry });
});

// PUT /api/stock/:id
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { initialStock, totalDelivered, notes } = req.body;
  const entry = await prisma.stockEntry.update({
    where: { id: req.params.id },
    data: {
      initialStock: Number(initialStock),
      totalDelivered: Number(totalDelivered),
      remainingStock: Number(initialStock) - Number(totalDelivered),
      notes,
    },
    include: { product: true },
  });
  res.json({ data: entry });
});

// DELETE /api/stock/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.stockEntry.delete({ where: { id: req.params.id } });
  res.json({ data: { message: 'Stock entry deleted' } });
});

export default router;
