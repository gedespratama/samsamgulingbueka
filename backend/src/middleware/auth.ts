import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'cashier';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function auth(req: Request, _res: Response, next: NextFunction): void {
  if (config.authDisabled) {
    req.user = { id: 'dev', username: 'dev', name: 'Development', role: 'owner' };
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Token tidak ditemukan. Login dulu untuk mendapatkan token.'));
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser;
    req.user = { id: payload.id, username: payload.username, name: payload.name, role: payload.role };
    next();
  } catch {
    next(new HttpError(401, 'Token tidak valid atau sudah kedaluwarsa.'));
  }
}

export function requireOwner(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'owner') {
    next(new HttpError(403, 'Hanya pemilik warung (owner) yang dapat melakukan aksi ini.'));
    return;
  }
  next();
}
