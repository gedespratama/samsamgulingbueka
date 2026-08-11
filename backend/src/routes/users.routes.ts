import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { auth, requireOwner } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();
router.use(auth, requireOwner);

const createSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
  name: z.string().min(1),
  role: z.enum(['owner', 'cashier']).optional().default('cashier'),
});

const updateSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(4).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['owner', 'cashier']).optional(),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ id: users.id, username: users.username, name: users.name, role: users.role, createdAt: users.createdAt })
      .from(users)
      .all();
    res.json(rows);
  }),
);

router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const exists = await db.select().from(users).where(eq(users.username, body.username)).all();
    if (exists.length > 0) throw new HttpError(409, `Username "${body.username}" sudah dipakai.`);
    const id = randomUUID();
    await db
      .insert(users)
      .values({
        id,
        username: body.username,
        name: body.name,
        role: body.role,
        passwordHash: bcrypt.hashSync(body.password, 10),
      })
      .run();
    res.status(201).json({ id, username: body.username, name: body.name, role: body.role });
  }),
);

router.patch(
  '/:id',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateSchema>;
    const rows = await db.select().from(users).where(eq(users.id, req.params.id)).all();
    if (rows.length === 0) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    if (body.username && body.username !== rows[0].username) {
      const dup = await db.select().from(users).where(eq(users.username, body.username)).all();
      if (dup.length > 0) throw new HttpError(409, `Username "${body.username}" sudah dipakai.`);
    }
    const updates: Partial<typeof rows[0]> = {};
    if (body.username !== undefined) updates.username = body.username;
    if (body.name !== undefined) updates.name = body.name;
    if (body.role !== undefined) updates.role = body.role;
    if (body.password !== undefined) updates.passwordHash = bcrypt.hashSync(body.password, 10);
    await db.update(users).set(updates).where(eq(users.id, req.params.id)).run();
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) throw new HttpError(400, 'Tidak bisa menghapus akun sendiri.');
    const result = await db.delete(users).where(eq(users.id, req.params.id)).run();
    if (result.rowsAffected === 0) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    res.json({ ok: true });
  }),
);

export default router;
