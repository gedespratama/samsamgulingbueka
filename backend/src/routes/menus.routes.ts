import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { addons, categories, menus, modifiers } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth);

const menuSchema = z.object({
  name: z.string().min(1),
  basePrice: z.number().int().min(0),
  costPrice: z.number().int().min(0).optional().default(0),
  categoryId: z.string().min(1),
  stock: z.number().int().min(0).optional().default(0),
  available: z.boolean().optional().default(true),
});

const menuUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  basePrice: z.number().int().min(0).optional(),
  costPrice: z.number().int().min(0).optional(),
  categoryId: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  available: z.boolean().optional(),
});

const modifierSchema = z.object({ name: z.string().min(1), priceExtra: z.number().int().optional().default(0) });
const addonSchema = z.object({ name: z.string().min(1), price: z.number().int().min(0).optional().default(0) });

async function getMenuWithRelations(menuId: string) {
  const menuRows = await db.select().from(menus).where(eq(menus.id, menuId)).all();
  const menu = menuRows[0];
  if (!menu) throw new HttpError(404, 'Menu tidak ditemukan.');
  const [categoryRows, modifierRows, addonRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.id, menu.categoryId)).all(),
    db.select().from(modifiers).where(eq(modifiers.menuId, menuId)).all(),
    db.select().from(addons).where(eq(addons.menuId, menuId)).all(),
  ]);
  return { ...menu, category: categoryRows[0] ?? null, modifiers: modifierRows, addons: addonRows };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    const includeInactive = req.query.includeInactive === 'true';

    const conditions = [];
    if (categoryId) conditions.push(eq(menus.categoryId, categoryId));
    if (!includeInactive) conditions.push(eq(menus.available, true));

    const menuRows = conditions.length
      ? await db.select().from(menus).where(and(...conditions)).orderBy(desc(menus.createdAt)).all()
      : await db.select().from(menus).orderBy(desc(menus.createdAt)).all();

    const [categoryRows, modifierRows, addonRows] = await Promise.all([
      db.select().from(categories).all(),
      db.select().from(modifiers).all(),
      db.select().from(addons).all(),
    ]);

    const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));
    res.json(
      menuRows.map((m) => ({
        ...m,
        category: categoryMap.get(m.categoryId) ?? null,
        modifiers: modifierRows.filter((x) => x.menuId === m.id),
        addons: addonRows.filter((x) => x.menuId === m.id),
      })),
    );
  }),
);

router.post(
  '/',
  validate(menuSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof menuSchema>;
    const categoryRows = await db.select().from(categories).where(eq(categories.id, body.categoryId)).all();
    if (categoryRows.length === 0) throw new HttpError(400, 'Kategori tidak ditemukan.');
    const id = randomUUID();
    await db.insert(menus).values({ id, ...body }).run();
    res.status(201).json(await getMenuWithRelations(id));
  }),
);

router.patch(
  '/modifiers/:id',
  validate(modifierSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof modifierSchema>;
    const rows = await db.select().from(modifiers).where(eq(modifiers.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Modifier tidak ditemukan.');
    await db.update(modifiers).set(body).where(eq(modifiers.id, req.params.id)).run();
    res.json({ ok: true });
  }),
);

router.delete(
  '/modifiers/:id',
  asyncHandler(async (req, res) => {
    const result = await db.delete(modifiers).where(eq(modifiers.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Modifier tidak ditemukan.');
    res.json({ ok: true });
  }),
);

router.patch(
  '/addons/:id',
  validate(addonSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof addonSchema>;
    const rows = await db.select().from(addons).where(eq(addons.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Add-on tidak ditemukan.');
    await db.update(addons).set(body).where(eq(addons.id, req.params.id)).run();
    res.json({ ok: true });
  }),
);

router.delete(
  '/addons/:id',
  asyncHandler(async (req, res) => {
    const result = await db.delete(addons).where(eq(addons.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Add-on tidak ditemukan.');
    res.json({ ok: true });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getMenuWithRelations(req.params.id));
  }),
);

router.patch(
  '/:id/cost-price',
  validate(z.object({ costPrice: z.number().int().min(0) })),
  asyncHandler(async (req, res) => {
    const body = req.body as { costPrice: number };
    const menuRows = await db.select().from(menus).where(eq(menus.id, req.params.id)).all();
    if (menuRows.length === 0) throw new HttpError(404, 'Menu tidak ditemukan.');
    await db
      .update(menus)
      .set({ costPrice: body.costPrice, updatedAt: new Date() })
      .where(eq(menus.id, req.params.id))
      .run();
    res.json(await getMenuWithRelations(req.params.id));
  }),
);

router.patch(
  '/:id',
  validate(menuUpdateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof menuUpdateSchema>;
    const menuRows = await db.select().from(menus).where(eq(menus.id, req.params.id)).all();
    if (menuRows.length === 0) throw new HttpError(404, 'Menu tidak ditemukan.');
    if (body.categoryId) {
      const categoryRows = await db.select().from(categories).where(eq(categories.id, body.categoryId)).all();
      if (categoryRows.length === 0) throw new HttpError(400, 'Kategori tidak ditemukan.');
    }
    const updates = { ...body, updatedAt: new Date() };
    await db.update(menus).set(updates).where(eq(menus.id, req.params.id)).run();
    res.json(await getMenuWithRelations(req.params.id));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await db.delete(menus).where(eq(menus.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Menu tidak ditemukan.');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/modifiers',
  validate(modifierSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof modifierSchema>;
    const menuRows = await db.select().from(menus).where(eq(menus.id, req.params.id)).all();
    if (menuRows.length === 0) throw new HttpError(404, 'Menu tidak ditemukan.');
    const id = randomUUID();
    await db.insert(modifiers).values({ id, menuId: req.params.id, name: body.name, priceExtra: body.priceExtra }).run();
    res.status(201).json({ id, menuId: req.params.id, name: body.name, priceExtra: body.priceExtra });
  }),
);

router.post(
  '/:id/addons',
  validate(addonSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof addonSchema>;
    const menuRows = await db.select().from(menus).where(eq(menus.id, req.params.id)).all();
    if (menuRows.length === 0) throw new HttpError(404, 'Menu tidak ditemukan.');
    const id = randomUUID();
    await db.insert(addons).values({ id, menuId: req.params.id, name: body.name, price: body.price }).run();
    res.status(201).json({ id, menuId: req.params.id, name: body.name, price: body.price });
  }),
);

export default router;
