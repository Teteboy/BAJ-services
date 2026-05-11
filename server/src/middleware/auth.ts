import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    clientId?: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? 'secret'
    ) as jwt.JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { client: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.client?.id,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}

export function requireClient(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'CLIENT') {
    res.status(403).json({ message: 'Client access required' });
    return;
  }
  next();
}
