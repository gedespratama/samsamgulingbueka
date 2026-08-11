import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { categories, menus } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth);

const createSchema = z.object({ name: z.string().min(1) });
const updateSchema = z.object({ name: z.string().min(1) });

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(categories).orderBy(desc(categories.createdAt)).all();
    const menuCounts = await db
      .select({ categoryId: menus.categoryId, total: count() })
      .from(menus)
      .groupBy(menus.categoryId)
      .all();
    const countMap = new Map(menuCounts.map((m) => [m.categoryId, m.total]));
    res.json(rows.map((c) => ({ ...c, menuCount: countMap.get(c.id) ?? 0 })));
  }),
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const id = randomUUID();
    await db.insert(categories).values({ id, name: body.name }).run();
    res.status(201).json({ id, name: body.name });
  }),
);

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateSchema>;
    const rows = await db.select().from(categories).where(eq(categories.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Kategori tidak ditemukan.');
    await db.update(categories).set({ name: body.name }).where(eq(categories.id, req.params.id)).run();
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const menuRows = await db
      .select({ total: count() })
      .from(menus)
      .where(eq(menus.categoryId, req.params.id))
      .all();
    if (menuRows[0].total > 0) {
      throw new HttpError(409, `Kategori masih memiliki ${menuRows[0].total} menu. Pindahkan atau hapus menu dulu.`);
    }
    const result = await db.delete(categories).where(eq(categories.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Kategori tidak ditemukan.');
    res.json({ ok: true });
  }),
);

export default router;
