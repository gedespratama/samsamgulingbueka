import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { addons, categories, ingredients, menus, modifiers, users } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { createOrder } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { orderSchema } from './orders.routes.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth);

const syncOrderSchema = orderSchema.extend({
  clientOrderId: z.string().min(1).optional(),
});

const syncBodySchema = z.object({
  orders: z.array(syncOrderSchema).min(1),
});

router.post(
  '/orders',
  validate(syncBodySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof syncBodySchema>;
    const created = [];
    for (const order of body.orders) {
      const { clientOrderId, ...input } = order;
      const result = await createOrder({ ...input, syncStatus: 'pending' });
      created.push({ clientOrderId, orderId: result.id, totalAmount: result.totalAmount });
    }
    res.status(201).json({ created, count: created.length });
  }),
);

router.get(
  '/pull',
  asyncHandler(async (_req, res) => {
    const [categoryRows, menuRows, modifierRows, addonRows, ingredientRows, userRows] = await Promise.all([
      db.select().from(categories).all(),
      db.select().from(menus).all(),
      db.select().from(modifiers).all(),
      db.select().from(addons).all(),
      db.select().from(ingredients).all(),
      db.select({ id: users.id, name: users.name, role: users.role }).from(users).all(),
    ]);

    const menusWithRelations = menuRows.map((m) => ({
      ...m,
      modifiers: modifierRows.filter((x) => x.menuId === m.id),
      addons: addonRows.filter((x) => x.menuId === m.id),
    }));

    res.json({
      server_time: Date.now(),
      categories: categoryRows,
      menus: menusWithRelations,
      ingredients: ingredientRows,
      users: userRows,
    });
  }),
);

export default router;
