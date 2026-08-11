import { Router } from 'express';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db/client.js';
import { orders, transactions } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(auth);

type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debt';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyMethods() {
  return { cash: 0, qris: 0, transfer: 0, debt: 0 };
}

function summarize(rows: Array<{ paymentMethod: PaymentMethod; transactionType: 'offline' | 'online'; amount: number }>) {
  const byMethod = emptyMethods();
  const byType = { offline: 0, online: 0 };
  let total = 0;
  for (const r of rows) {
    total += r.amount;
    byMethod[r.paymentMethod] += r.amount;
    byType[r.transactionType] += r.amount;
  }
  const count = rows.length;
  return {
    total,
    transactionCount: count,
    average: count > 0 ? Math.round(total / count) : 0,
    byPaymentMethod: byMethod,
    byType,
  };
}

async function fetchTransactions(from: Date, to: Date) {
  return db
    .select({
      paymentMethod: transactions.paymentMethod,
      transactionType: transactions.transactionType,
      amount: transactions.amount,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(orders, eq(transactions.orderId, orders.id))
    .where(and(gte(transactions.createdAt, from), lte(transactions.createdAt, to)))
    .all();
}

router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const from = startOfDay(new Date());
    const to = endOfDay(new Date());
    const [rows, pendingRows] = await Promise.all([
      fetchTransactions(from, to),
      db.select({ total: orders.totalAmount }).from(orders).where(and(gte(orders.createdAt, from), lte(orders.createdAt, to), eq(orders.syncStatus, 'pending'))).all(),
    ]);
    res.json({
      date: dateStr(new Date()),
      ...summarize(rows),
      pendingSyncCount: pendingRows.length,
      pendingSyncTotal: pendingRows.reduce((sum, r) => sum + r.total, 0),
    });
  }),
);

router.get(
  '/daily',
  asyncHandler(async (req, res) => {
    const raw = String(req.query.date ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      res.status(400).json({ error: 'Parameter date wajib format YYYY-MM-DD.' });
      return;
    }
    const date = new Date(`${raw}T00:00:00`);
    const rows = await fetchTransactions(startOfDay(date), endOfDay(date));
    res.json({ date: raw, ...summarize(rows) });
  }),
);

router.get(
  '/range',
  asyncHandler(async (req, res) => {
    const fromRaw = String(req.query.from ?? '');
    const toRaw = String(req.query.to ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromRaw) || !/^\d{4}-\d{2}-\d{2}$/.test(toRaw)) {
      res.status(400).json({ error: 'Parameter from dan to wajib format YYYY-MM-DD.' });
      return;
    }
    const from = new Date(`${fromRaw}T00:00:00`);
    const to = new Date(`${toRaw}T23:59:59.999`);
    const rows = await fetchTransactions(from, to);

    const days: Array<{ date: string; total: number; transactionCount: number; byPaymentMethod: Record<PaymentMethod, number> }> = [];
    let cursor = startOfDay(from);
    while (cursor <= to) {
      const dayKey = dateStr(cursor);
      const next = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      const dayRows = rows.filter((r) => r.createdAt >= cursor && r.createdAt < next);
      const daySummary = summarize(dayRows);
      days.push({
        date: dayKey,
        total: daySummary.total,
        transactionCount: daySummary.transactionCount,
        byPaymentMethod: daySummary.byPaymentMethod,
      });
      cursor = next;
    }

    res.json({
      from: fromRaw,
      to: toRaw,
      ...summarize(rows),
      days,
    });
  }),
);

router.get(
  '/weekly',
  asyncHandler(async (_req, res) => {
    const today = startOfDay(new Date());
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const rows = await fetchTransactions(from, endOfDay(today));

    const days = [];
    let cursor = new Date(from);
    while (cursor <= today) {
      const dayKey = dateStr(cursor);
      const next = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      const byMethod = emptyMethods();
      let total = 0;
      let count = 0;
      for (const r of rows) {
        if (r.createdAt >= cursor && r.createdAt < next) {
          total += r.amount;
          count += 1;
          byMethod[r.paymentMethod] += r.amount;
        }
      }
      days.push({ date: dayKey, total, transactionCount: count, byPaymentMethod: byMethod });
      cursor = next;
    }

    const totalSummary = summarize(rows);
    res.json({
      from: dateStr(from),
      to: dateStr(today),
      total: totalSummary.total,
      transactionCount: totalSummary.transactionCount,
      byPaymentMethod: totalSummary.byPaymentMethod,
      days,
    });
  }),
);

export default router;
