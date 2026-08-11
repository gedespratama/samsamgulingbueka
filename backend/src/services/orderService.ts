import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '../db/client.js';
import { addons, menus, modifiers, orderItems, orders, transactions } from '../db/schema.js';
import { HttpError } from '../utils/httpError.js';

export interface OrderItemInput {
  menuId: string;
  quantity: number;
  modifierIds: string[];
  addonIds: string[];
  customization?: string;
}

export interface OrderInput {
  orderType: 'dine_in' | 'takeaway';
  tableNumber?: number | null;
  items: OrderItemInput[];
  payment: {
    method: 'cash' | 'qris' | 'transfer' | 'debt';
    transactionType?: 'offline' | 'online';
    status?: 'paid' | 'unpaid';
  };
  syncStatus?: 'pending' | 'synced';
}

export async function createOrder(input: OrderInput): Promise<{ id: string; totalAmount: number }> {
  return db.transaction(async (tx) => {
    const menuIds = [...new Set(input.items.map((i) => i.menuId))];
    const menuRows = await tx.select().from(menus).where(inArray(menus.id, menuIds)).all();
    const menuMap = new Map(menuRows.map((m) => [m.id, m]));

    const allModifierIds = [...new Set(input.items.flatMap((i) => i.modifierIds))];
    const allAddonIds = [...new Set(input.items.flatMap((i) => i.addonIds))];

    const modifierRows = allModifierIds.length
      ? await tx.select().from(modifiers).where(inArray(modifiers.id, allModifierIds)).all()
      : [];
    const addonRows = allAddonIds.length
      ? await tx.select().from(addons).where(inArray(addons.id, allAddonIds)).all()
      : [];

    let total = 0;
    const itemRows = input.items.map((item) => {
      const menu = menuMap.get(item.menuId);
      if (!menu) {
        throw new HttpError(400, `Menu tidak ditemukan: ${item.menuId}`);
      }
      if (input.syncStatus !== 'pending') {
        if (!menu.available) {
          throw new HttpError(409, `Menu ${menu.name} sedang tidak tersedia.`);
        }
        if (menu.stock < item.quantity) {
          throw new HttpError(409, `Stok ${menu.name} tidak cukup (sisa ${menu.stock}).`);
        }
      }

      const priceExtra =
        item.modifierIds.reduce(
          (sum, id) => sum + (modifierRows.find((m) => m.id === id && m.menuId === menu.id)?.priceExtra ?? 0),
          0,
        ) +
        item.addonIds.reduce(
          (sum, id) => sum + (addonRows.find((a) => a.id === id && a.menuId === menu.id)?.price ?? 0),
          0,
        );

      const unitPrice = Math.max(0, menu.basePrice + priceExtra);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      return {
        menuId: menu.id,
        quantity: item.quantity,
        modifierIds: JSON.stringify(item.modifierIds),
        addonIds: JSON.stringify(item.addonIds),
        customization: item.customization ?? '',
        unitPrice,
        subtotal,
      };
    });

    const orderId = crypto.randomUUID();
    await tx.insert(orders).values({
      id: orderId,
      orderType: input.orderType,
      tableNumber: input.tableNumber ?? null,
      totalAmount: total,
      syncStatus: input.syncStatus ?? 'synced',
    });

    await tx.insert(orderItems).values(itemRows.map((r) => ({ ...r, orderId })));

    const status = input.payment.status ?? (input.payment.method === 'debt' ? 'unpaid' : 'paid');
    await tx.insert(transactions).values({
      orderId,
      paymentMethod: input.payment.method,
      transactionType: input.payment.transactionType ?? 'offline',
      status,
      amount: total,
    });

    for (const item of input.items) {
      const menu = menuMap.get(item.menuId);
      if (menu) {
        await tx
          .update(menus)
          .set({ stock: Math.max(0, menu.stock - item.quantity), updatedAt: new Date() })
          .where(eq(menus.id, menu.id));
      }
    }

    return { id: orderId, totalAmount: total };
  });
}

export async function getOrderDetail(orderId: string) {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).all();
  if (orderRows.length === 0) {
    throw new HttpError(404, 'Transaksi tidak ditemukan.');
  }
  const order = orderRows[0];

  const [itemRows, transactionRows] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        menuId: orderItems.menuId,
        menuName: menus.name,
        quantity: orderItems.quantity,
        modifierIds: orderItems.modifierIds,
        addonIds: orderItems.addonIds,
        customization: orderItems.customization,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
      })
      .from(orderItems)
      .innerJoin(menus, eq(menus.id, orderItems.menuId))
      .where(eq(orderItems.orderId, orderId))
      .all(),
    db.select().from(transactions).where(eq(transactions.orderId, orderId)).all(),
  ]);

  const modifierIds = [...new Set(itemRows.flatMap((i) => JSON.parse(i.modifierIds) as string[]))];
  const addonIds = [...new Set(itemRows.flatMap((i) => JSON.parse(i.addonIds) as string[]))];

  const [modifierRows, addonRows] = await Promise.all([
    modifierIds.length ? db.select().from(modifiers).where(inArray(modifiers.id, modifierIds)).all() : Promise.resolve([]),
    addonIds.length ? db.select().from(addons).where(inArray(addons.id, addonIds)).all() : Promise.resolve([]),
  ]);

  const modifierMap = new Map(modifierRows.map((m) => [m.id, m]));
  const addonMap = new Map(addonRows.map((a) => [a.id, a]));

  const items = itemRows.map((i) => ({
    ...i,
    modifierIds: JSON.parse(i.modifierIds) as string[],
    addonIds: JSON.parse(i.addonIds) as string[],
    modifiers: (JSON.parse(i.modifierIds) as string[])
      .map((id) => modifierMap.get(id))
      .filter((m) => m !== undefined),
    addons: (JSON.parse(i.addonIds) as string[])
      .map((id) => addonMap.get(id))
      .filter((a) => a !== undefined),
  }));

  return { ...order, items, transaction: transactionRows[0] ?? null };
}

export async function listOrders(input: { from?: Date; to?: Date; limit?: number; offset?: number }) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);
  const conditions = [];
  if (input.from) conditions.push(gte(orders.createdAt, input.from));
  if (input.to) conditions.push(lte(orders.createdAt, input.to));

  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      order: orders,
      paymentMethod: transactions.paymentMethod,
      transactionType: transactions.transactionType,
      paymentStatus: transactions.status,
    })
    .from(orders)
    .innerJoin(transactions, eq(transactions.orderId, orders.id))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return rows.map((r) => ({
    ...r.order,
    paymentMethod: r.paymentMethod,
    transactionType: r.transactionType,
    paymentStatus: r.paymentStatus,
  }));
}
