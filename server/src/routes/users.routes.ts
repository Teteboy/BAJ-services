import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'baj_secret_key';

// Middleware to check admin
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (decoded.role !== 'ADMIN') {
      res.status(403).json({ message: 'Admin only' });
      return;
    }
    (req as any).userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/users - List all admin users
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        password: false,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: users });
  } catch (err) {
    console.error('[USERS] List error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// POST /api/users - Create admin user
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, password required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    res.json({ data: user });
  } catch (err) {
    console.error('[USERS] Create error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// DELETE /api/users/:id - Delete admin user
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).userId;
    
    if (id === currentUserId) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }

    await prisma.user.delete({ where: { id: id as string } });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[USERS] Delete error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
