import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendEmail, sendPaymentReminder } from '../services/email.service';
import { addDays, startOfWeek, endOfWeek, isAfter } from 'date-fns';

// ─────────────────────────────────────────────────────────────
// Mark overdue invoices
// ─────────────────────────────────────────────────────────────
async function markOverdueInvoices(): Promise<void> {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      status: 'SENT',
      paymentDeadline: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });
  if (result.count > 0) {
    console.log(`[SCHEDULER] Marked ${result.count} invoice(s) as OVERDUE`);
  }
}

// ─────────────────────────────────────────────────────────────
// Send payment reminders (2–3 days before deadline)
// ─────────────────────────────────────────────────────────────
async function sendPaymentReminders(): Promise<void> {
  const now = new Date();
  const in2Days = addDays(now, 2);
  const in3Days = addDays(now, 3);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'SENT',
      paymentDeadline: {
        gte: in2Days,
        lte: in3Days,
      },
    },
    include: {
      client: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
  });

  for (const invoice of invoices) {
    const clientEmail = invoice.client?.user?.email;
    if (!clientEmail) continue;

    const daysLeft = Math.ceil(
      (invoice.paymentDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    await sendPaymentReminder(
      clientEmail,
      invoice.client.companyName,
      invoice.invoiceNumber,
      invoice.totalAmount,
      daysLeft,
      invoice.paymentDeadline
    );
  }

  if (invoices.length > 0) {
    console.log(`[SCHEDULER] Sent ${invoices.length} payment reminder(s)`);
  }
}

// ─────────────────────────────────────────────────────────────
// Generate weekly report
// ─────────────────────────────────────────────────────────────
export async function generateWeeklyReport(): Promise<void> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Orders & deliveries
  const [totalOrders, totalDeliveries] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.order.count({
      where: { status: 'DELIVERED', updatedAt: { gte: weekStart, lte: weekEnd } },
    }),
  ]);

  // Financial
  const [paidAgg, pendingAgg, overdueAgg] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: 'PAID', paidAt: { gte: weekStart, lte: weekEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'SENT' },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { totalAmount: true },
    }),
  ]);

  // Sales by product
  const deliveredItems = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        issuedAt: { gte: weekStart, lte: weekEnd },
      },
    },
    include: { product: true },
  });

  const salesByProduct: Record<
    string,
    { productId: string; productName: string; totalQuantityLiters: number; totalAmount: number }
  > = {};

  for (const item of deliveredItems) {
    const key = item.productId;
    if (!salesByProduct[key]) {
      salesByProduct[key] = {
        productId: item.productId,
        productName: item.product.name,
        totalQuantityLiters: 0,
        totalAmount: 0,
      };
    }
    salesByProduct[key].totalQuantityLiters += item.unit === 'LITERS' ? item.quantity : item.quantity * 1000;
    salesByProduct[key].totalAmount += item.totalAmount;
  }

  // Stock summary
  const stockEntries = await prisma.stockEntry.findMany({
    where: { weekStartDate: { gte: weekStart }, weekEndDate: { lte: weekEnd } },
    include: { product: true },
  });

  const stockSummary = stockEntries.map((s) => ({
    productId: s.productId,
    productName: s.product.name,
    initialStock: s.initialStock,
    totalDelivered: s.totalDelivered,
    remainingStock: s.remainingStock,
  }));

  const paymentsReceived = paidAgg._sum.totalAmount ?? 0;
  const totalAmountSold = Object.values(salesByProduct).reduce(
    (sum, s) => sum + s.totalAmount,
    0
  );

  const report = await prisma.weeklyReport.create({
    data: {
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      totalOrdersCount: totalOrders,
      totalDeliveriesCount: totalDeliveries,
      totalAmountSold,
      paymentsReceived,
      paymentsPending: pendingAgg._sum.totalAmount ?? 0,
      paymentsOverdue: overdueAgg._sum.totalAmount ?? 0,
      stockSummaryJson: JSON.stringify(stockSummary),
      salesByProductJson: JSON.stringify(Object.values(salesByProduct)),
      generatedAt: now,
    },
  });

  // Send report to management
  await sendEmail({
    to: process.env.ADMIN_EMAIL ?? 'admin@bajservices.com',
    subject: `Weekly Report — BAJ Services (Week of ${weekStart.toLocaleDateString()})`,
    html: `
      <h2>BAJ Services Weekly Report</h2>
      <p><strong>Period:</strong> ${weekStart.toLocaleDateString()} – ${weekEnd.toLocaleDateString()}</p>
      <hr/>
      <h3>Summary</h3>
      <ul>
        <li>Total Orders: <strong>${totalOrders}</strong></li>
        <li>Total Deliveries: <strong>${totalDeliveries}</strong></li>
        <li>Payments Received: <strong>${paymentsReceived.toLocaleString()} XAF</strong></li>
        <li>Payments Pending: <strong>${pendingAgg._sum.totalAmount?.toLocaleString() ?? 0} XAF</strong></li>
        <li>Payments Overdue: <strong>${overdueAgg._sum.totalAmount?.toLocaleString() ?? 0} XAF</strong></li>
      </ul>
    `,
  });

  await prisma.weeklyReport.update({
    where: { id: report.id },
    data: { emailSentAt: new Date() },
  });

  console.log('[SCHEDULER] Weekly report generated and sent.');
}

// ─────────────────────────────────────────────────────────────
// Init all scheduled jobs
// ─────────────────────────────────────────────────────────────
export function initScheduler(): void {
  // Check overdue invoices every day at 9am
  cron.schedule('0 9 * * *', async () => {
    console.log('[SCHEDULER] Running daily overdue check...');
    await markOverdueInvoices();
    await sendPaymentReminders();
  });

  // Generate weekly report every Sunday at 11:55pm
  cron.schedule('55 23 * * 0', async () => {
    console.log('[SCHEDULER] Generating weekly report...');
    await generateWeeklyReport();
  });

  console.log('[SCHEDULER] Jobs initialized');
}
