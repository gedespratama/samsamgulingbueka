import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../src/app.js';
import { initDb } from '../src/db/migrate.js';

let ready: Promise<void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!ready) {
    ready = initDb().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
  app(req as never, res as never);
}
