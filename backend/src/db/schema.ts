import { randomUUID } from 'node:crypto';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['owner', 'cashier'] }).notNull().default('cashier'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const menus = sqliteTable('menus', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  basePrice: integer('base_price').notNull(),
  costPrice: integer('cost_price').notNull().default(0),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  stock: integer('stock').notNull().default(0),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const modifiers = sqliteTable('modifiers', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  menuId: text('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  priceExtra: integer('price_extra').notNull().default(0),
});

export const addons = sqliteTable('addons', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  menuId: text('menu_id')
    .notNull()
    .references(() => menus.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: integer('price').notNull().default(0),
});

export const ingredients = sqliteTable('ingredients', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  stock: integer('stock').notNull().default(0),
  unit: text('unit').notNull().default('pcs'),
  isPerishable: integer('is_perishable', { mode: 'boolean' }).notNull().default(false),
  expiryDate: integer('expiry_date', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  orderType: text('order_type', { enum: ['dine_in', 'takeaway'] }).notNull(),
  tableNumber: integer('table_number'),
  totalAmount: integer('total_amount').notNull(),
  syncStatus: text('sync_status', { enum: ['pending', 'synced'] }).notNull().default('synced'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  menuId: text('menu_id')
    .notNull()
    .references(() => menus.id),
  quantity: integer('quantity').notNull(),
  modifierIds: text('modifier_ids').notNull().default('[]'),
  addonIds: text('addon_ids').notNull().default('[]'),
  customization: text('customization').notNull().default(''),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  paymentMethod: text('payment_method', { enum: ['cash', 'qris', 'transfer', 'debt'] }).notNull(),
  transactionType: text('transaction_type', { enum: ['offline', 'online'] }).notNull().default('offline'),
  status: text('status', { enum: ['paid', 'unpaid'] }).notNull().default('paid'),
  amount: integer('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  direction: text('direction', { enum: ['customer', 'supplier'] }).notNull(),
  contactName: text('contact_name').notNull(),
  description: text('description').notNull().default(''),
  amount: integer('amount').notNull(),
  paidAmount: integer('paid_amount').notNull().default(0),
  status: text('status', { enum: ['open', 'partial', 'settled'] }).notNull().default('open'),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});
