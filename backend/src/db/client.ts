import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from './schema.js';

const url = process.env.DATABASE_URL ?? 'file:data/warung.db';

if (url.startsWith('file:')) {
  const rel = url.replace(/^file:/, '');
  fs.mkdirSync(path.dirname(path.resolve(rel)), { recursive: true });
}

export const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
