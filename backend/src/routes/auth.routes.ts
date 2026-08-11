import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validate } from '../utils/validate.js';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body as z.infer<typeof loginSchema>;
    const rows = await db.select().from(users).where(eq(users.username, username)).all();
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new HttpError(401, 'Username atau password salah.');
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' },
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    });
  }),
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    const rows = await db.select().from(users).where(eq(users.id, req.user!.id)).all();
    const user = rows[0];
    if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
  }),
);

export default router;
