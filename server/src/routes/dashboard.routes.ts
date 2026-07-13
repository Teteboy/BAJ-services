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
    upcomingDeliveryOrders,
    paymentFollowUp,
    latestStock,
    recentPayments,
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
    prisma.order.findMany({
      where: { status: 'VALIDATED' },
      take: 5,
      orderBy: { requestedDeliveryDate: 'asc' },
      include: {
        client: { select: { companyName: true } },
        deliveryLocation: true,
        items: { include: { product: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ['SENT', 'OVERDUE'] } },
      take: 5,
      orderBy: { paymentDeadline: 'asc' },
      include: {
        client: { select: { companyName: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.stockEntry.findFirst({
      orderBy: { weekStartDate: 'desc' },
      include: { product: true },
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { paidAt: 'desc' },
      include: { invoice: { include: { client: { select: { companyName: true } } } } },
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

  const activity = [
    ...recentOrders.slice(0, 4).map((o) => ({
      type: 'order' as const,
      text: `Order ${o.orderNumber} received from ${o.client.companyName}.`,
      time: o.createdAt,
    })),
    ...recentPayments.map((p) => ({
      type: 'payment' as const,
      text: `Payment of ${p.amount.toLocaleString()} XOF received from ${p.invoice.client?.companyName || 'client'}.`,
      time: p.paidAt,
    })),
    ...recentOrders.filter((o) => o.status === 'DELIVERED').slice(0, 2).map((o) => ({
      type: 'delivery' as const,
      text: `Delivery ${o.orderNumber} confirmed at ${o.deliveryLocation?.name || o.deliveryLocation?.address || 'site'}.`,
      time: o.updatedAt,
    })),
    ...paymentFollowUp.filter((i) => i.status === 'SENT').slice(0, 2).map((i) => ({
      type: 'invoice' as const,
      text: `Invoice ${i.invoiceNumber} sent to ${i.client?.companyName || 'client'}.`,
      time: i.issuedAt ?? i.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 6);

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
      upcomingDeliveryOrders,
      paymentFollowUp,
      latestStock,
      activity,
    },
  });
});

// GET /api/dashboard/client
router.get('/client', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'CLIENT' || !req.user!.clientId) {
    res.status(403).json({ message: 'Forbidden' }); return;
  }
  const clientId = req.user!.clientId;

  const [pendingOrders, validatedOrders, deliveredOrders, unpaidInvoices, spentAgg, recentOrders, recentInvoices, activeOrders] =
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
      prisma.invoice.findMany({
        where: { clientId },
        take: 5,
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.order.findMany({
        where: { clientId, status: { in: ['PENDING', 'VALIDATED'] } },
        take: 3,
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
      recentInvoices,
      activeOrders,
    },
  });
});

export default router;
