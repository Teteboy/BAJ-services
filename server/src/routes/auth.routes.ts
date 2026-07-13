import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'baj_secret_key';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role: expectedRole } = req.body;
    console.log('[AUTH] Login attempt for:', email, expectedRole ? `expectedRole: ${expectedRole}` : '');

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { client: true },
    });
    console.log('[AUTH] User found:', !!user, 'active:', user?.isActive, 'role:', user?.role);

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (expectedRole && expectedRole !== user.role) {
      res.status(403).json({ message: `This account is not authorized as ${expectedRole === 'ADMIN' ? 'an administrator' : 'a client'}` });
      return;
    }

    console.log('[AUTH] Comparing password...');
    const valid = await bcrypt.compare(password, user.password);
    console.log('[AUTH] Password valid:', valid);

    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.client?.companyName,
        clientId: user.client?.id,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { client: true },
    });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.client?.companyName,
        clientId: user.client?.id,
      },
    });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current and new password required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) { res.status(400).json({ message: 'Current password incorrect' }); return; }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[AUTH] Change password error:', err);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

export default router;
