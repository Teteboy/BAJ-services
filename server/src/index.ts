import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/orders.routes';
import productRoutes from './routes/products.routes';
import clientRoutes from './routes/clients.routes';
import invoiceRoutes from './routes/invoices.routes';
import paymentRoutes from './routes/payments.routes';
import stockRoutes from './routes/stock.routes';
import reportRoutes from './routes/reports.routes';
import dashboardRoutes from './routes/dashboard.routes';
import usersRoutes from './routes/users.routes';
import { errorHandler } from './middleware/errorHandler';
import { initScheduler } from './jobs/scheduler';

const app = express();
const PORT = process.env.PORT ?? 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve PDF files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 BAJ Services API running on port ${PORT}`);
  initScheduler();
});

export default app;
