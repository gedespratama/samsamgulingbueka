import { client } from './client.js';
import { runSeed } from './seed.js';

const DDL = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS menus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_price INTEGER NOT NULL,
    cost_price INTEGER NOT NULL DEFAULT 0,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    stock INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS modifiers (
    id TEXT PRIMARY KEY,
    menu_id TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_extra INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS addons (
    id TEXT PRIMARY KEY,
    menu_id TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'pcs',
    is_perishable INTEGER NOT NULL DEFAULT 0,
    expiry_date INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_type TEXT NOT NULL,
    table_number INTEGER,
    total_amount INTEGER NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_id TEXT NOT NULL REFERENCES menus(id),
    quantity INTEGER NOT NULL,
    modifier_ids TEXT NOT NULL DEFAULT '[]',
    addon_ids TEXT NOT NULL DEFAULT '[]',
    customization TEXT NOT NULL DEFAULT '',
    unit_price INTEGER NOT NULL,
    subtotal INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    transaction_type TEXT NOT NULL DEFAULT 'offline',
    status TEXT NOT NULL DEFAULT 'paid',
    amount INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    direction TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    amount INTEGER NOT NULL,
    paid_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    due_date INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
];

let initialized: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      await client.execute('PRAGMA foreign_keys = ON');
      await client.executeMultiple(DDL.join(';'));
      await runSeed(false);
    })();
  }
  return initialized;
}
