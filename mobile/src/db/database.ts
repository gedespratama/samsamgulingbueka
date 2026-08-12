import * as SQLite from 'expo-sqlite';
import { seedIfEmpty } from './seed';

const DB_NAME = 'kasir.db';
const DB_VERSION = 6;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = init().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(db);
  await seedIfEmpty(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DB_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menus (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        base_price INTEGER NOT NULL DEFAULT 0,
        cost_price INTEGER NOT NULL DEFAULT 0,
        category_id TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menu_variants (
        id TEXT PRIMARY KEY NOT NULL,
        menu_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price_extra INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS menu_addons (
        id TEXT PRIMARY KEY NOT NULL,
        menu_id TEXT NOT NULL,
        name TEXT NOT NULL,
        price INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        pin TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS customer_debts (
        id TEXT PRIMARY KEY NOT NULL,
        customer_name TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        note TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'unpaid',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS supplier_debts (
        id TEXT PRIMARY KEY NOT NULL,
        supplier_name TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        note TEXT NOT NULL DEFAULT '',
        due_date TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'unpaid',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cash_records (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY NOT NULL,
        order_type TEXT NOT NULL,
        table_number INTEGER,
        total_amount INTEGER NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        menu_name TEXT NOT NULL,
        qty INTEGER NOT NULL DEFAULT 1,
        unit_price INTEGER NOT NULL DEFAULT 0,
        variant TEXT,
        addons TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS pending_sync (
        id TEXT PRIMARY KEY NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 1`);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 2`);
  }

  if (currentVersion < 3) {
    await db.execAsync("ALTER TABLE orders ADD COLUMN voided INTEGER NOT NULL DEFAULT 0");
    await db.execAsync(`PRAGMA user_version = 3`);
  }

  if (currentVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cash_shifts (
        id TEXT PRIMARY KEY NOT NULL,
        opened_at TEXT NOT NULL,
        opening_balance INTEGER NOT NULL DEFAULT 0,
        closed_at TEXT
      );
    `);
    await db.execAsync(`PRAGMA user_version = 4`);
  }

  if (currentVersion < 5) {
    await db.execAsync("ALTER TABLE cash_records ADD COLUMN shift_id TEXT");
    await db.execAsync(`PRAGMA user_version = 5`);
  }

  if (currentVersion < 6) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    await db.execAsync(`PRAGMA user_version = 6`);
  }
}
