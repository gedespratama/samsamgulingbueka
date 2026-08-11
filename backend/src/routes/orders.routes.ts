import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { orders, transactions } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { createOrder, getOrderDetail, listOrders } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth);

export const orderItemSchema = z.object({
  menuId: z.string().min(1),
  quantity: z.number().int().min(1),
  modifierIds: z.array(z.string()).optional().default([]),
  addonIds: z.array(z.string()).optional().default([]),
  customization: z.string().optional().default(''),
});

export const orderSchema = z.object({
  orderType: z.enum(['dine_in', 'takeaway']),
  tableNumber: z.number().int().min(1).optional().nullable(),
  items: z.array(orderItemSchema).min(1),
  payment: z.object({
    method: z.enum(['cash', 'qris', 'transfer', 'debt']),
    transactionType: z.enum(['offline', 'online']).optional().default('offline'),
    status: z.enum(['paid', 'unpaid']).optional(),
  }),
  syncStatus: z.enum(['pending', 'synced']).optional().default('synced'),
});

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const toEnd = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const rows = await listOrders({ from, to: toEnd, limit, offset });
    res.json(rows);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getOrderDetail(req.params.id));
  }),
);

router.post(
  '/',
  validate(orderSchema),
  asyncHandler(async (req, res) => {
    const result = await createOrder(req.body as z.infer<typeof orderSchema>);
    res.status(201).json(result);
  }),
);

router.patch(
  '/:id/table',
  validate(z.object({ tableNumber: z.number().int().min(1) })),
  asyncHandler(async (req, res) => {
    const body = req.body as { tableNumber: number };
    const rows = await db.select().from(orders).where(eq(orders.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Transaksi tidak ditemukan.');
    await db
      .update(orders)
      .set({ tableNumber: body.tableNumber })
      .where(eq(orders.id, req.params.id))
      .run();
    res.json({ ok: true, tableNumber: body.tableNumber });
  }),
);

router.patch(
  '/:id/payment',
  validate(
    z.object({
      method: z.enum(['cash', 'qris', 'transfer', 'debt']).optional(),
      status: z.enum(['paid', 'unpaid']).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const body = req.body as { method?: 'cash' | 'qris' | 'transfer' | 'debt'; status?: 'paid' | 'unpaid' };
    const txRows = await db.select().from(transactions).where(eq(transactions.orderId, req.params.id)).all();
    if (txRows.length === 0) throw new HttpError(404, 'Transaksi tidak ditemukan.');
    const updates: Partial<typeof txRows[0]> = {};
    if (body.method) updates.paymentMethod = body.method;
    if (body.status) updates.status = body.status;
    await db.update(transactions).set(updates).where(eq(transactions.orderId, req.params.id)).run();
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await db.delete(orders).where(eq(orders.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Transaksi tidak ditemukan.');
    res.json({ ok: true });
  }),
);

export default router;
