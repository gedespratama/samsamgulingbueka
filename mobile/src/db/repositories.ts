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
  voided: number;
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

  async create(name: string): Promise<{ id: string; name: string }> {
    const db = await getDb();
    const id = `cat-${Date.now()}`;
    await db.runAsync('INSERT INTO categories (id, name) VALUES (?, ?)', id, name);
    return { id, name };
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

  async update(employee: Employee): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE employees SET name = ?, role = ?, pin = ? WHERE id = ?',
      employee.name,
      employee.role,
      employee.pin,
      employee.id
    );
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM employees WHERE id = ?', id);
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

  async update(customer: Customer): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE customers SET name = ?, phone = ? WHERE id = ?',
      customer.name,
      customer.phone,
      customer.id
    );
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM customers WHERE id = ?', id);
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

interface CashRecordRow {
  id: string;
  type: 'masuk' | 'keluar' | 'shift';
  title: string;
  amount: number;
  created_at: string;
  shift_id: string | null;
}

export const cashRecordRepo = {
  async getAll(): Promise<CashRecord[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<CashRecordRow>(
      'SELECT id, type, title, amount, created_at, shift_id FROM cash_records ORDER BY datetime(created_at) DESC'
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      amount: r.amount,
      createdAt: r.created_at,
      shiftId: r.shift_id,
    }));
  },

  async create(data: Omit<CashRecord, 'id'>, id: string, shiftId?: string | null): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO cash_records (id, type, title, amount, created_at, shift_id) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.type,
      data.title,
      data.amount,
      data.createdAt,
      shiftId ?? null
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
      voided: bool(row.voided),
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

  async void(id: string): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('UPDATE orders SET voided = 1 WHERE id = ?', id);
      await txn.runAsync('DELETE FROM pending_sync WHERE entity_id = ?', id);
    });
  },

  async getTodaySummary(): Promise<DaySummary> {
    const orders = await this.getAll();
    const now = new Date();
    const todayOrders = orders.filter((o) => !o.voided && isSameLocalDay(new Date(o.createdAt), now));
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
      (o) => !o.voided && now - new Date(o.createdAt).getTime() <= 7 * 86_400_000
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

interface NotificationRow {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  title: string;
  message: string;
  read: number;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationRepo = {
  async getAll(): Promise<AppNotification[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<NotificationRow>(
      'SELECT id, type, title, message, read, created_at FROM notifications ORDER BY datetime(created_at) DESC'
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      read: bool(r.read),
      createdAt: r.created_at,
    }));
  },

  async markRead(id: string, read: boolean): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE notifications SET read = ? WHERE id = ?', read ? 1 : 0, id);
  },

  async markAllRead(): Promise<void> {
    const db = await getDb();
    await db.runAsync("UPDATE notifications SET read = 1 WHERE read = 0");
  },

  async create(data: Omit<AppNotification, 'id'>, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO notifications (id, type, title, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      data.type,
      data.title,
      data.message,
      data.read ? 1 : 0,
      data.createdAt
    );
  },
};

export type LaporanRangeKey = 'hari_ini' | '7_hari' | 'bulan_ini';

interface ShiftRow {
  id: string;
  opened_at: string;
  opening_balance: number;
  closed_at: string | null;
}

interface SettingRow {
  key: string;
  value: string;
}

export const settingsRepo = {
  async get(key: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<SettingRow>('SELECT value FROM settings WHERE key = ?', key);
    return row?.value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      key,
      value
    );
  },
};export interface CashShift {
  id: string;
  openedAt: string;
  openingBalance: number;
  closedAt: string | null;
}

export interface ShiftHistoryEntry {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  actualBalance: number | null;
  net: number;
  difference: number | null;
}

export const shiftRepo = {
  async getActive(): Promise<CashShift | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ShiftRow>(
      "SELECT id, opened_at, opening_balance, closed_at FROM cash_shifts WHERE closed_at IS NULL ORDER BY datetime(opened_at) DESC LIMIT 1"
    );
    if (!row) return null;
    return {
      id: row.id,
      openedAt: row.opened_at,
      openingBalance: row.opening_balance,
      closedAt: row.closed_at,
    };
  },

  async open(openingBalance: number): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO cash_shifts (id, opened_at, opening_balance, closed_at) VALUES (?, ?, ?, NULL)',
      `shift-${Date.now()}`,
      new Date().toISOString(),
      openingBalance
    );
  },

  async close(): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "UPDATE cash_shifts SET closed_at = ? WHERE closed_at IS NULL",
      new Date().toISOString()
    );
  },

  async getHistory(): Promise<ShiftHistoryEntry[]> {
    const db = await getDb();
    const shiftRows = await db.getAllAsync<ShiftRow>(
      'SELECT * FROM cash_shifts WHERE closed_at IS NOT NULL ORDER BY datetime(opened_at) DESC'
    );
    const recordRows = await db.getAllAsync<CashRecordRow>(
      'SELECT id, type, title, amount, created_at, shift_id FROM cash_records'
    );
    return shiftRows.map((s) => {
      const shiftRecords = recordRows.filter((r) => r.shift_id === s.id);
      const net = shiftRecords
        .filter((r) => r.type === 'masuk' || r.type === 'keluar')
        .reduce((sum, r) => sum + (r.type === 'masuk' ? r.amount : -r.amount), 0);
      const closing = shiftRecords.find((r) => r.type === 'shift');
      const actualBalance = closing ? closing.amount : null;
      return {
        id: s.id,
        openedAt: s.opened_at,
        closedAt: s.closed_at,
        openingBalance: s.opening_balance,
        actualBalance,
        net,
        difference: actualBalance !== null ? actualBalance - (s.opening_balance + net) : null,
      };
    });
  },
};export interface RangeSummary {
  total: number;
  count: number;
}

export interface DailySale {
  label: string;
  total: number;
}

function ordersInRange(orders: Transaction[], range: LaporanRangeKey): Transaction[] {
  const now = new Date();
  return orders.filter((o) => {
    if (o.voided) return false;
    const d = new Date(o.createdAt);
    if (Number.isNaN(d.getTime())) return false;
    if (range === 'hari_ini') return isSameLocalDay(d, now);
    if (range === '7_hari') return now.getTime() - d.getTime() <= 7 * 86_400_000;
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
}

const dayLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });

export const laporanRepo = {
  async getRangeSummary(range: LaporanRangeKey): Promise<RangeSummary> {
    const orders = await orderRepo.getAll();
    const filtered = ordersInRange(orders, range);
    return {
      total: filtered.reduce((sum, o) => sum + o.totalAmount, 0),
      count: filtered.length,
    };
  },

  async getRangeMethods(range: LaporanRangeKey): Promise<WeeklySalesRow[]> {
    const orders = await orderRepo.getAll();
    const filtered = ordersInRange(orders, range);
    const methods: PaymentMethodKey[] = ['tunai', 'qris', 'transfer', 'hutang'];
    return methods.map((key) => ({
      key,
      label: paymentMethodMeta[key].label,
      total: filtered.filter((o) => o.paymentMethod === key).reduce((sum, o) => sum + o.totalAmount, 0),
      count: filtered.filter((o) => o.paymentMethod === key).length,
      dotColor: methodColors[key],
    }));
  },

  async getDailySales(): Promise<DailySale[]> {
    const orders = await orderRepo.getAll();
    const days: DailySale[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86_400_000);
      const label = dayLabel.format(day);
      const total = orders
        .filter((o) => !o.voided && isSameLocalDay(new Date(o.createdAt), day))
        .reduce((sum, o) => sum + o.totalAmount, 0);
      days.push({ label, total });
    }
    return days;
  },
};
