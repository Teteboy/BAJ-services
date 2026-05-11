import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { subDays, startOfDay } from 'date-fns';

const router = Router();

// GET /api/dashboard/admin
router.get('/admin', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'ADMIN') { res.status(403).json({ message: 'Forbidden' }); return; }

  const [
    pendingOrders,
    upcomingDeliveries,
    completedDeliveries,
    pendingPayments,
    overduePayments,
    revenueAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'VALIDATED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.invoice.aggregate({ where: { status: 'SENT' }, _sum: { totalAmount: true } }),
    prisma.invoice.aggregate({ where: { status: 'OVERDUE' }, _sum: { totalAmount: true } }),
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfDay(subDays(new Date(), 30)) },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
        deliveryLocation: true,
        items: { include: { product: true } },
      },
    }),
  ]);

  // Build 7-day orders trend
  const ordersTrend = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const start = startOfDay(date);
      const end = new Date(start.getTime() + 86_400_000);
      const count = await prisma.order.count({ where: { createdAt: { gte: start, lt: end } } });
      return { date: start.toISOString().slice(0, 10), count };
    })
  );

  res.json({
    data: {
      pendingOrders,
      upcomingDeliveries,
      completedDeliveries,
      pendingPayments: pendingPayments._sum.totalAmount ?? 0,
      overduePayments: overduePayments._sum.totalAmount ?? 0,
      totalRevenueThisMonth: revenueAgg._sum.totalAmount ?? 0,
      recentOrders,
      ordersTrend,
      revenueTrend: [],
    },
  });
});

// GET /api/dashboard/client
router.get('/client', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'CLIENT' || !req.user!.clientId) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }
  const clientId = req.user!.clientId;

  const [pendingOrders, validatedOrders, deliveredOrders, unpaidInvoices, spentAgg, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { clientId, status: 'PENDING' } }),
      prisma.order.count({ where: { clientId, status: 'VALIDATED' } }),
      prisma.order.count({ where: { clientId, status: 'DELIVERED' } }),
      prisma.invoice.count({ where: { clientId, status: { in: ['SENT', 'OVERDUE'] } } }),
      prisma.invoice.aggregate({
        where: {
          clientId,
          status: 'PAID',
          paidAt: { gte: startOfDay(subDays(new Date(), 30)) },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { clientId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { deliveryLocation: true, items: { include: { product: true } } },
      }),
    ]);

  res.json({
    data: {
      pendingOrders,
      validatedOrders,
      deliveredOrders,
      unpaidInvoices,
      totalSpentThisMonth: spentAgg._sum.totalAmount ?? 0,
      recentOrders,
    },
  });
});

export default router;
