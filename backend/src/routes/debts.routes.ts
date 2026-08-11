import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { debts } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth);

const createSchema = z.object({
  direction: z.enum(['customer', 'supplier']),
  contactName: z.string().min(1),
  description: z.string().optional().default(''),
  amount: z.number().int().min(0),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  direction: z.enum(['customer', 'supplier']).optional(),
  contactName: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().int().min(0).optional(),
  paidAmount: z.number().int().min(0).optional(),
  status: z.enum(['open', 'partial', 'settled']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

function toTimestamp(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function statusFromPaid(amount: number, paidAmount: number): 'open' | 'partial' | 'settled' {
  if (paidAmount >= amount && amount > 0) return 'settled';
  if (paidAmount > 0) return 'partial';
  return 'open';
}

function withRemaining(d: (typeof debts.$inferSelect)[]) {
  return d.map((row) => ({ ...row, remaining: row.amount - row.paidAmount }));
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const direction = req.query.direction;
    const status = req.query.status;
    const conditions = [];
    if (direction === 'customer' || direction === 'supplier') conditions.push(eq(debts.direction, direction));
    if (status === 'open' || status === 'partial' || status === 'settled') conditions.push(eq(debts.status, status));
    const rows = conditions.length
      ? await db.select().from(debts).where(and(...conditions)).orderBy(desc(debts.createdAt)).all()
      : await db.select().from(debts).orderBy(desc(debts.createdAt)).all();
    res.json(withRemaining(rows));
  }),
);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(debts).all();
    const summarize = (list: typeof rows) => ({
      count: list.length,
      total: list.reduce((sum, d) => sum + d.amount, 0),
      remaining: list.reduce((sum, d) => sum + (d.amount - d.paidAmount), 0),
    });
    res.json({
      customer: summarize(rows.filter((d) => d.direction === 'customer')),
      supplier: summarize(rows.filter((d) => d.direction === 'supplier')),
    });
  }),
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const id = randomUUID();
    await db
      .insert(debts)
      .values({
        id,
        direction: body.direction,
        contactName: body.contactName,
        description: body.description,
        amount: body.amount,
        paidAmount: 0,
        status: 'open',
        dueDate: toTimestamp(body.dueDate),
      })
      .run();
    res.status(201).json({ id });
  }),
);

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateSchema>;
    const rows = await db.select().from(debts).where(eq(debts.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Catatan hutang tidak ditemukan.');
    const current = rows[0];
    const updates: Partial<typeof current> = { updatedAt: new Date() };
    if (body.direction !== undefined) updates.direction = body.direction;
    if (body.contactName !== undefined) updates.contactName = body.contactName;
    if (body.description !== undefined) updates.description = body.description;
    if (body.amount !== undefined) updates.amount = body.amount;
    if (body.dueDate !== undefined) updates.dueDate = toTimestamp(body.dueDate) ?? null;
    if (body.paidAmount !== undefined) updates.paidAmount = body.paidAmount;
    if (body.status !== undefined) {
      updates.status = body.status;
    } else if (body.paidAmount !== undefined || body.amount !== undefined) {
      updates.status = statusFromPaid(updates.amount ?? current.amount, updates.paidAmount ?? current.paidAmount);
    }
    await db.update(debts).set(updates).where(eq(debts.id, req.params.id)).run();
    const after = await db.select().from(debts).where(eq(debts.id, req.params.id)).all();
    res.json({ ...after[0], remaining: after[0].amount - after[0].paidAmount });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await db.delete(debts).where(eq(debts.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Catatan hutang tidak ditemukan.');
    res.json({ ok: true });
  }),
);

export default router;
