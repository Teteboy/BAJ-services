import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const clientInclude = {
  user: { select: { email: true, name: true, isActive: true } },
  deliveryLocations: true,
  productPrices: { include: { product: true } },
};

// GET /api/clients/me — for logged-in client
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user!.clientId) { res.status(400).json({ message: 'Not a client account' }); return; }
  const client = await prisma.client.findUnique({
    where: { id: req.user!.clientId },
    include: clientInclude,
  });
  if (!client) { res.status(404).json({ message: 'Client not found' }); return; }
  res.json({ data: client });
});

// GET /api/clients
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query as Record<string, string>;
  const where: any = {};
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const clients = await prisma.client.findMany({
    where,
    include: clientInclude,
    orderBy: { companyName: 'asc' },
  });
  res.json({ data: clients, total: clients.length });
});

// GET /api/clients/:id
router.get('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: clientInclude,
  });
  if (!client) { res.status(404).json({ message: 'Client not found' }); return; }
  res.json({ data: client });
});

// POST /api/clients — create new client + user
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { companyName, email, password, phone, paymentTerms, deliveryLocations, productPrices } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { res.status(400).json({ message: 'Email already in use' }); return; }
  const hashed = await bcrypt.hash(password ?? 'client123', 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: companyName,
      role: 'CLIENT',
      client: {
        create: {
          companyName,
          phone,
          paymentTerms: paymentTerms ?? 'IMMEDIATE',
          deliveryLocations: deliveryLocations ? { create: deliveryLocations } : undefined,
          productPrices: productPrices ? { create: productPrices } : undefined,
        },
      },
    },
    include: { client: { include: clientInclude } },
  });
  res.status(201).json({ data: user.client });
});

// PUT /api/clients/:id — update client
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { companyName, phone, paymentTerms, isActive } = req.body;
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: { companyName, phone, paymentTerms, isActive },
    include: clientInclude,
  });
  res.json({ data: client });
});

// PATCH /api/clients/:id/password — reset password
router.patch('/:id/password', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password || password.length < 6) { res.status(400).json({ message: 'Password must be at least 6 characters' }); return; }
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) { res.status(404).json({ message: 'Client not found' }); return; }
  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: client.userId }, data: { password: hashed } });
  res.json({ data: { message: 'Password updated' } });
});

// DELETE /api/clients/:id
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) { res.status(404).json({ message: 'Client not found' }); return; }
  // Cascade: delete user (which cascades to client)
  await prisma.user.delete({ where: { id: client.userId } });
  res.json({ data: { message: 'Client deleted' } });
});

// POST /api/clients/:id/prices — upsert product price
router.post('/:id/prices', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId, pricePerLiter } = req.body;
  const price = await prisma.clientProductPrice.upsert({
    where: { clientId_productId: { clientId: req.params.id, productId } },
    update: { pricePerLiter },
    create: { clientId: req.params.id, productId, pricePerLiter },
    include: { product: true },
  });
  res.json({ data: price });
});

// DELETE /api/clients/:id/prices/:priceId
router.delete('/:id/prices/:priceId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.clientProductPrice.delete({ where: { id: req.params.priceId } });
  res.json({ data: { message: 'Price removed' } });
});

// POST /api/clients/:id/locations — add delivery location
router.post('/:id/locations', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, address } = req.body;
  const location = await prisma.deliveryLocation.create({
    data: { clientId: req.params.id, name, address },
  });
  res.status(201).json({ data: location });
});

// DELETE /api/clients/:id/locations/:locationId
router.delete('/:id/locations/:locationId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.deliveryLocation.delete({ where: { id: req.params.locationId } });
  res.json({ data: { message: 'Location deleted' } });
});

export default router;
