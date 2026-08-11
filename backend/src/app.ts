import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import menusRoutes from './routes/menus.routes.js';
import ingredientsRoutes from './routes/ingredients.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import syncRoutes from './routes/sync.routes.js';
import debtsRoutes from './routes/debts.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { client } from './db/client.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({
    name: 'Samsam Guling Bu Eka - API',
    version: '1.0.0',
    docs: 'Lihat README.md untuk daftar endpoint.',
  });
});

app.get('/api/health', async (_req, res) => {
  try {
    await client.execute('SELECT 1');
    res.json({ status: 'ok', db: 'ok', time: Date.now() });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable', time: Date.now() });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/reports', reportsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.use(errorHandler);
