import type {
  CashRecord,
  Customer,
  CustomerDebt,
  Employee,
  Menu,
  OrderType,
  PaymentMethod,
  PaymentMethodKey,
  SupplierDebt,
  Transaction,
} from '../data/mock';
import { paymentMethodMeta } from '../data/mock';
import { getDb } from './database';

const bool = (value: number): boolean => value === 1;

const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

interface MenuRow {
  id: string;
  name: string;
  base_price: number;
  cost_price: number;
  category_id: string;
  stock: number;
  available: number;
}

interface VariantRow {
  id: string;
  menu_id: string;
  name: string;
  price_extra: number;
}

interface AddonRow {
  id: string;
  menu_id: string;
  name: string;
  price: number;
}

interface OrderRow {
  id: string;
  order_type: OrderType;
  table_number: number | null;
  total_amount: number;
  payment_method: PaymentMethodKey;
  transaction_type: 'offline' | 'online';
  sync_status: 'pending' | 'synced';
  created_at: string;
}

interface OrderItemRow {
  order_id: string;
  menu_name: string;
  qty: number;
  unit_price: number;
  variant: string | null;
  addons: string;
  note: string;
}

interface PendingSyncRow {
  entity_id: string;
}

interface EmployeeRow {
  id: string;
  name: string;
  role: Employee['role'];
  pin: string;
  active: number;
}

interface CustomerDebtRow {
  id: string;
  customer_name: string;
  amount: number;
  note: string;
  status: CustomerDebt['status'];
  created_at: string;
}

interface SupplierDebtRow {
  id: string;
  supplier_name: string;
  amount: number;
  note: string;
  due_date: string;
  status: SupplierDebt['status'];
  created_at: string;
}

export const categoryRepo = {
  async getAll(): Promise<{ id: string; name: string }[]> {
    const db = await getDb();
    return db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM categories ORDER BY rowid');
  },
};

export const menuRepo = {
  async getAll(): Promise<Menu[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<MenuRow>('SELECT * FROM menus ORDER BY rowid');
    const variantRows = await db.getAllAsync<VariantRow>('SELECT * FROM menu_variants');
    const addonRows = await db.getAllAsync<AddonRow>('SELECT * FROM menu_addons');
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      basePrice: row.base_price,
      costPrice: row.cost_price,
      categoryId: row.category_id,
      stock: row.stock,
      available: bool(row.available),
      variants: variantRows
        .filter((v) => v.menu_id === row.id)
        .map((v) => ({ id: v.id, name: v.name, priceExtra: v.price_extra })),
      addons: addonRows
        .filter((a) => a.menu_id === row.id)
        .map((a) => ({ id: a.id, name: a.name, price: a.price })),
    }));
  },

  async create(data: Omit<Menu, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        'INSERT INTO menus (id, name, base_price, cost_price, category_id, stock, available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        id,
        data.name,
        data.basePrice,
        data.costPrice,
        data.categoryId,
        data.stock,
        data.available ? 1 : 0,
        new Date().toISOString()
      );
      for (const v of data.variants) {
        await txn.runAsync(
          'INSERT INTO menu_variants (id, menu_id, name, price_extra) VALUES (?, ?, ?, ?)',
          `${id}-v-${Math.random().toString(36).slice(2, 8)}`,
          id,
          v.name,
          v.priceExtra
        );
      }
      for (const a of data.addons) {
        await txn.runAsync(
          'INSERT INTO menu_addons (id, menu_id, name, price) VALUES (?, ?, ?, ?)',
          `${id}-a-${Math.random().toString(36).slice(2, 8)}`,
          id,
          a.name,
          a.price
        );
      }
    });
  },

  async update(menu: Menu): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        'UPDATE menus SET name = ?, base_price = ?, cost_price = ?, category_id = ?, stock = ?, available = ? WHERE id = ?',
        menu.name,
        menu.basePrice,
        menu.costPrice,
        menu.categoryId,
        menu.stock,
        menu.available ? 1 : 0,
        menu.id
      );
      await txn.runAsync('DELETE FROM menu_variants WHERE menu_id = ?', menu.id);
      await txn.runAsync('DELETE FROM menu_addons WHERE menu_id = ?', menu.id);
      for (const v of menu.variants) {
        await txn.runAsync(
          'INSERT INTO menu_variants (id, menu_id, name, price_extra) VALUES (?, ?, ?, ?)',
          `${menu.id}-v-${Math.random().toString(36).slice(2, 8)}`,
          menu.id,
          v.name,
          v.priceExtra
        );
      }
      for (const a of menu.addons) {
        await txn.runAsync(
          'INSERT INTO menu_addons (id, menu_id, name, price) VALUES (?, ?, ?, ?)',
          `${menu.id}-a-${Math.random().toString(36).slice(2, 8)}`,
          menu.id,
          a.name,
          a.price
        );
      }
    });
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('DELETE FROM menu_variants WHERE menu_id = ?', id);
      await txn.runAsync('DELETE FROM menu_addons WHERE menu_id = ?', id);
      await txn.runAsync('DELETE FROM menus WHERE id = ?', id);
    });
  },
};

export const employeeRepo = {
  async getAll(): Promise<Employee[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<EmployeeRow>('SELECT * FROM employees ORDER BY rowid');
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      pin: row.pin,
      active: bool(row.active),
    }));
  },

  async create(data: Omit<Employee, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO employees (id, name, role, pin, active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.name,
      data.role,
      data.pin,
      data.active ? 1 : 0,
      new Date().toISOString()
    );
  },
};

export const customerRepo = {
  async getAll(): Promise<Customer[]> {
    const db = await getDb();
    return db.getAllAsync<Customer>('SELECT id, name, phone FROM customers ORDER BY rowid');
  },

  async create(data: Omit<Customer, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO customers (id, name, phone, created_at) VALUES (?, ?, ?, ?)',
      id,
      data.name,
      data.phone,
      new Date().toISOString()
    );
  },
};

export const debtRepo = {
  async getCustomerDebts(): Promise<CustomerDebt[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<CustomerDebtRow>(
      'SELECT id, customer_name, amount, note, status, created_at FROM customer_debts ORDER BY datetime(created_at) DESC'
    );
    return rows.map((r) => ({
      id: r.id,
      customerName: r.customer_name,
      amount: r.amount,
      note: r.note,
      status: r.status,
      createdAt: r.created_at,
    }));
  },

  async getSupplierDebts(): Promise<SupplierDebt[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<SupplierDebtRow>(
      'SELECT id, supplier_name, amount, note, due_date, status, created_at FROM supplier_debts ORDER BY datetime(created_at) DESC'
    );
    return rows.map((r) => ({
      id: r.id,
      supplierName: r.supplier_name,
      amount: r.amount,
      note: r.note,
      dueDate: r.due_date,
      status: r.status,
      createdAt: r.created_at,
    }));
  },

  async createCustomerDebt(data: Omit<CustomerDebt, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO customer_debts (id, customer_name, amount, note, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.customerName,
      data.amount,
      data.note,
      data.status,
      data.createdAt
    );
  },

  async createSupplierDebt(data: Omit<SupplierDebt, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO supplier_debts (id, supplier_name, amount, note, due_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id,
      data.supplierName,
      data.amount,
      data.note,
      data.dueDate,
      data.status,
      data.createdAt
    );
  },

  async markCustomerPaid(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("UPDATE customer_debts SET status = 'paid' WHERE id = ?", id);
  },

  async markSupplierPaid(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync("UPDATE supplier_debts SET status = 'paid' WHERE id = ?", id);
  },
};

export const cashRecordRepo = {
  async getAll(): Promise<CashRecord[]> {
    const db = await getDb();
    return db.getAllAsync<CashRecord>('SELECT id, type, title, amount, created_at FROM cash_records ORDER BY datetime(created_at) DESC');
  },

  async create(data: Omit<CashRecord, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO cash_records (id, type, title, amount, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      data.type,
      data.title,
      data.amount,
      data.createdAt
    );
  },
};

export interface DaySummary {
  total: number;
  transactionCount: number;
  average: number;
  paymentMethods: PaymentMethod[];
}

export interface WeeklySalesRow {
  key: PaymentMethodKey;
  label: string;
  total: number;
  count: number;
  dotColor: string;
}

export interface WeeklySalesData {
  rows: WeeklySalesRow[];
  total: number;
  count: number;
}

const methodColors: Record<PaymentMethodKey, string> = {
  tunai: '#16A34A',
  qris: '#0284C7',
  transfer: '#7C3AED',
  hutang: '#DC2626',
};

export const orderRepo = {
  async create(order: Transaction): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        'INSERT INTO orders (id, order_type, table_number, total_amount, payment_method, transaction_type, sync_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        order.id,
        order.orderType,
        order.tableNumber,
        order.totalAmount,
        order.paymentMethod,
        order.transactionType,
        order.syncStatus,
        order.createdAt
      );
      for (const item of order.items) {
        await txn.runAsync(
          'INSERT INTO order_items (order_id, menu_name, qty, unit_price, variant, addons, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
          order.id,
          item.name,
          item.qty,
          item.unitPrice,
          item.variant,
          item.addons.join('|'),
          ''
        );
      }
    });
  },

  async getAll(): Promise<Transaction[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<OrderRow>('SELECT * FROM orders ORDER BY datetime(created_at) DESC');
    const itemRows = await db.getAllAsync<OrderItemRow>('SELECT * FROM order_items');
    return rows.map((row) => ({
      id: row.id,
      orderType: row.order_type,
      tableNumber: row.table_number,
      totalAmount: row.total_amount,
      paymentMethod: row.payment_method,
      transactionType: row.transaction_type,
      syncStatus: row.sync_status,
      createdAt: row.created_at,
      items: itemRows
        .filter((i) => i.order_id === row.id)
        .map((i) => ({
          menuId: '',
          name: i.menu_name,
          qty: i.qty,
          unitPrice: i.unit_price,
          variant: i.variant,
          addons: i.addons ? i.addons.split('|').filter(Boolean) : [],
          note: i.note,
        })),
    }));
  },

  async getTodaySummary(): Promise<DaySummary> {
    const orders = await this.getAll();
    const now = new Date();
    const todayOrders = orders.filter((o) => isSameLocalDay(new Date(o.createdAt), now));
    const total = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const count = todayOrders.length;
    const methods: PaymentMethodKey[] = ['tunai', 'qris', 'transfer', 'hutang'];
    const paymentMethods: PaymentMethod[] = methods.map((key) => ({
      key,
      label: paymentMethodMeta[key].label,
      amount: todayOrders
        .filter((o) => o.paymentMethod === key)
        .reduce((sum, o) => sum + o.totalAmount, 0),
    }));
    return {
      total,
      transactionCount: count,
      average: count > 0 ? Math.round(total / count) : 0,
      paymentMethods,
    };
  },

  async getWeeklySummary(): Promise<WeeklySalesData> {
    const orders = await this.getAll();
    const now = Date.now();
    const weekOrders = orders.filter(
      (o) => now - new Date(o.createdAt).getTime() <= 7 * 86_400_000
    );
    const methods: PaymentMethodKey[] = ['tunai', 'qris', 'transfer', 'hutang'];
    const rows: WeeklySalesRow[] = methods.map((key) => ({
      key,
      label: paymentMethodMeta[key].label,
      total: weekOrders
        .filter((o) => o.paymentMethod === key)
        .reduce((sum, o) => sum + o.totalAmount, 0),
      count: weekOrders.filter((o) => o.paymentMethod === key).length,
      dotColor: methodColors[key],
    }));
    return {
      rows,
      total: weekOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      count: weekOrders.length,
    };
  },

  async updateSyncStatus(id: string, status: 'pending' | 'synced'): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE orders SET sync_status = ? WHERE id = ?', status, id);
  },
};

export const syncRepo = {
  async getPendingIds(): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<PendingSyncRow>('SELECT entity_id FROM pending_sync ORDER BY datetime(created_at)');
    return rows.map((r) => r.entity_id);
  },

  async enqueue(entityType: string, entityId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR IGNORE INTO pending_sync (id, entity_type, entity_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
      `sync-${entityId}`,
      entityType,
      entityId,
      'create',
      new Date().toISOString()
    );
  },

  async flush(): Promise<number> {
    const db = await getDb();
    const pending = await syncRepo.getPendingIds();
    if (pending.length === 0) return 0;
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const id of pending) {
        await txn.runAsync("UPDATE orders SET sync_status = 'synced' WHERE id = ?", id);
        await txn.runAsync('DELETE FROM pending_sync WHERE entity_id = ?', id);
      }
    });
    return pending.length;
  },
};
