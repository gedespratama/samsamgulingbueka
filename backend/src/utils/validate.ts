import type { RequestHandler } from 'express';
import type { z } from 'zod';

export const validate = (schema: z.ZodTypeAny): RequestHandler => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: 'Validasi gagal',
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  req.body = result.data;
  next();
};
