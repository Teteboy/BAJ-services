import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products — active for clients; all for admin with ?all=true
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { all } = req.query;
  const isAdmin = req.user!.role === 'ADMIN';
  const where = isAdmin && all === 'true' ? {} : { isActive: true };

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  res.json({ data: products });
});

// GET /api/products/:id
router.get('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
  res.json({ data: product });
});

// POST /api/products — admin only
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, code, description } = req.body;
  if (!name || !code) { res.status(400).json({ message: 'Name and code are required' }); return; }

  const existing = await prisma.product.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) { res.status(400).json({ message: 'Product code already exists' }); return; }

  const product = await prisma.product.create({
    data: { name, code: code.toUpperCase(), description },
  });
  res.status(201).json({ data: product });
});

// PUT /api/products/:id — admin only
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, isActive } = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { name, description, ...(isActive !== undefined && { isActive }) },
  });
  res.json({ data: product });
});

// DELETE /api/products/:id — soft delete (deactivate)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  res.json({ data: { message: 'Product deactivated' } });
});

export default router;
