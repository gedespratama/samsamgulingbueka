import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { desc, eq, lte, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { ingredients } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth);

const LOW_STOCK_THRESHOLD = 5;
const EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;

const createSchema = z.object({
  name: z.string().min(1),
  stock: z.number().int().min(0).optional().default(0),
  unit: z.string().optional().default('pcs'),
  isPerishable: z.boolean().optional().default(false),
  expiryDate: z.string().datetime().optional().nullable(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  isPerishable: z.boolean().optional(),
  expiryDate: z.string().datetime().optional().nullable(),
});

function toTimestamp(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function withStatus(rows: Array<typeof ingredients.$inferSelect>) {
  const now = Date.now();
  return rows.map((i) => ({
    ...i,
    isLowStock: i.stock <= LOW_STOCK_THRESHOLD,
    isExpired: i.expiryDate ? i.expiryDate.getTime() < now : false,
    isExpiringSoon: i.expiryDate ? i.expiryDate.getTime() - now <= EXPIRING_SOON_MS : false,
  }));
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(ingredients).orderBy(desc(ingredients.createdAt)).all();
    res.json(withStatus(rows));
  }),
);

router.get(
  '/low-stock',
  asyncHandler(async (_req, res) => {
    const now = Date.now();
    const rows = await db
      .select()
      .from(ingredients)
      .where(or(lte(ingredients.stock, LOW_STOCK_THRESHOLD), lte(ingredients.expiryDate, new Date(now + EXPIRING_SOON_MS))))
      .orderBy(ingredients.stock)
      .all();
    res.json(withStatus(rows));
  }),
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const id = randomUUID();
    await db
      .insert(ingredients)
      .values({
        id,
        name: body.name,
        stock: body.stock,
        unit: body.unit,
        isPerishable: body.isPerishable,
        expiryDate: toTimestamp(body.expiryDate),
      })
      .run();
    const rows = await db.select().from(ingredients).where(eq(ingredients.id, id)).all();
    res.status(201).json(withStatus(rows)[0]);
  }),
);

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateSchema>;
    const rows = await db.select().from(ingredients).where(eq(ingredients.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Bahan baku tidak ditemukan.');
    const updates: Partial<typeof rows[0]> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.stock !== undefined) updates.stock = body.stock;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.isPerishable !== undefined) updates.isPerishable = body.isPerishable;
    if (body.expiryDate !== undefined) updates.expiryDate = toTimestamp(body.expiryDate) ?? null;
    await db.update(ingredients).set(updates).where(eq(ingredients.id, req.params.id)).run();
    const after = await db.select().from(ingredients).where(eq(ingredients.id, req.params.id)).all();
    res.json(withStatus(after)[0]);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await db.delete(ingredients).where(eq(ingredients.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Bahan baku tidak ditemukan.');
    res.json({ ok: true });
  }),
);

export default router;
