import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { generateWeeklyReport } from '../jobs/scheduler';

const router = Router();

// GET /api/reports
router.get('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  const reports = await prisma.weeklyReport.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 20,
  });

  const mapped = reports.map((r) => ({
    ...r,
    stockSummary: r.stockSummaryJson ? JSON.parse(r.stockSummaryJson) : [],
    salesByProduct: r.salesByProductJson ? JSON.parse(r.salesByProductJson) : [],
  }));

  res.json({ data: mapped });
});

// POST /api/reports/generate (trigger on demand)
router.post('/generate', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  await generateWeeklyReport();
  res.json({ data: { message: 'Weekly report generated and sent.' } });
});

export default router;
