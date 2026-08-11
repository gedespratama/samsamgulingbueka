import type { SQLiteDatabase } from 'expo-sqlite';
import {
  cashRecordsSeed,
  customerDebtsSeed,
  customersSeed,
  employeeSeed,
  menuCategories,
  menuSeed,
  supplierDebtsSeed,
  transactionsSeed,
} from '../data/mock';

export async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM menus');
  if ((row?.count ?? 0) > 0) return;

  const now = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const cat of menuCategories) {
      await txn.runAsync('INSERT INTO categories (id, name) VALUES (?, ?)', cat.id, cat.name);
    }

    for (const menu of menuSeed) {
      await txn.runAsync(
        'INSERT INTO menus (id, name, base_price, cost_price, category_id, stock, available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        menu.id,
        menu.name,
        menu.basePrice,
        menu.costPrice,
        menu.categoryId,
        menu.stock,
        menu.available ? 1 : 0,
        now
      );
      for (const v of menu.variants) {
        await txn.runAsync(
          'INSERT INTO menu_variants (id, menu_id, name, price_extra) VALUES (?, ?, ?, ?)',
          v.id,
          menu.id,
          v.name,
          v.priceExtra
        );
      }
      for (const a of menu.addons) {
        await txn.runAsync(
          'INSERT INTO menu_addons (id, menu_id, name, price) VALUES (?, ?, ?, ?)',
          a.id,
          menu.id,
          a.name,
          a.price
        );
      }
    }

    for (const emp of employeeSeed) {
      await txn.runAsync(
        'INSERT INTO employees (id, name, role, pin, active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        emp.id,
        emp.name,
        emp.role,
        emp.pin,
        emp.active ? 1 : 0,
        now
      );
    }

    for (const c of customersSeed) {
      await txn.runAsync(
        'INSERT INTO customers (id, name, phone, created_at) VALUES (?, ?, ?, ?)',
        c.id,
        c.name,
        c.phone,
        now
      );
    }

    for (const d of customerDebtsSeed) {
      await txn.runAsync(
        'INSERT INTO customer_debts (id, customer_name, amount, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        d.id,
        d.customerName,
        d.amount,
        d.note,
        d.status,
        d.createdAt
      );
    }

    for (const d of supplierDebtsSeed) {
      await txn.runAsync(
        'INSERT INTO supplier_debts (id, supplier_name, amount, note, due_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        d.id,
        d.supplierName,
        d.amount,
        d.note,
        d.dueDate,
        d.status,
        d.createdAt
      );
    }

    for (const r of cashRecordsSeed) {
      await txn.runAsync(
        'INSERT INTO cash_records (id, type, title, amount, created_at) VALUES (?, ?, ?, ?, ?)',
        r.id,
        r.type,
        r.title,
        r.amount,
        r.createdAt
      );
    }

    for (const t of transactionsSeed) {
      await txn.runAsync(
        'INSERT INTO orders (id, order_type, table_number, total_amount, payment_method, transaction_type, sync_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        t.id,
        t.orderType,
        t.tableNumber,
        t.totalAmount,
        t.paymentMethod,
        t.transactionType,
        t.syncStatus,
        t.createdAt
      );
      for (const item of t.items) {
        await txn.runAsync(
          'INSERT INTO order_items (order_id, menu_name, qty, unit_price, variant, addons, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
          t.id,
          item.name,
          item.qty,
          item.unitPrice,
          item.variant,
          item.addons.join('|'),
          ''
        );
      }
      if (t.syncStatus === 'pending') {
        await txn.runAsync(
          'INSERT INTO pending_sync (id, entity_type, entity_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
          `sync-${t.id}`,
          'order',
          t.id,
          'create',
          t.createdAt
        );
      }
    }
  });
}
