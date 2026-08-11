import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './client.js';
import { addons, categories, ingredients, menus, modifiers, orderItems, orders, transactions, users } from './schema.js';

const seedUsers = [
  { username: 'owner', password: 'owner123', name: 'Bu Eka', role: 'owner' as const },
  { username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'cashier' as const },
];

const seedCategories = ['Babi Guling', 'Sate Babi', 'Lawar', 'Aneka Sambal'];

const seedMenus: Array<{
  name: string;
  basePrice: number;
  costPrice: number;
  category: string;
  stock: number;
  modifiers?: Array<{ name: string; priceExtra: number }>;
  addons?: Array<{ name: string; price: number }>;
}> = [
  {
    name: 'Nasi Babi Guling',
    basePrice: 20000,
    costPrice: 12000,
    category: 'Babi Guling',
    stock: 50,
    modifiers: [
      { name: 'Porsi Biasa', priceExtra: 0 },
      { name: 'Porsi Jumbo', priceExtra: 10000 },
      { name: 'Tanpa Nasi', priceExtra: -5000 },
    ],
    addons: [
      { name: 'Tambah Kulit', price: 5000 },
      { name: 'Tambah Urutan', price: 8000 },
    ],
  },
  {
    name: 'Babi Guling Biasa',
    basePrice: 15000,
    costPrice: 9000,
    category: 'Babi Guling',
    stock: 40,
    modifiers: [
      { name: 'Dengan Nasi', priceExtra: 5000 },
      { name: 'Tanpa Nasi', priceExtra: 0 },
    ],
    addons: [
      { name: 'Tambah Kulit', price: 5000 },
      { name: 'Tambah Kuah', price: 2000 },
    ],
  },
  {
    name: 'Babi Guling Jumbo',
    basePrice: 25000,
    costPrice: 15000,
    category: 'Babi Guling',
    stock: 30,
    modifiers: [
      { name: 'Dengan Nasi', priceExtra: 5000 },
      { name: 'Tanpa Nasi', priceExtra: -5000 },
    ],
    addons: [
      { name: 'Tambah Kulit', price: 5000 },
      { name: 'Tambah Urutan', price: 8000 },
    ],
  },
  {
    name: 'Sate Babi 10 Tusuk',
    basePrice: 18000,
    costPrice: 10000,
    category: 'Sate Babi',
    stock: 35,
    addons: [{ name: 'Kerupuk Babi', price: 3000 }],
  },
  {
    name: 'Sate Babi 20 Tusuk',
    basePrice: 34000,
    costPrice: 20000,
    category: 'Sate Babi',
    stock: 25,
    addons: [
      { name: 'Kerupuk Babi', price: 3000 },
      { name: 'Sambal Extra', price: 2000 },
    ],
  },
  {
    name: 'Lawar Babi',
    basePrice: 12000,
    costPrice: 7000,
    category: 'Lawar',
    stock: 45,
    modifiers: [{ name: 'Porsi Jumbo', priceExtra: 6000 }],
    addons: [{ name: 'Tambah Kuah', price: 2000 }],
  },
  {
    name: 'Lawar Putih',
    basePrice: 12000,
    costPrice: 7000,
    category: 'Lawar',
    stock: 45,
    addons: [{ name: 'Sambal Extra', price: 2000 }],
  },
  {
    name: 'Sambal Matah',
    basePrice: 5000,
    costPrice: 2000,
    category: 'Aneka Sambal',
    stock: 100,
  },
  {
    name: 'Sambal Embe',
    basePrice: 5000,
    costPrice: 2000,
    category: 'Aneka Sambal',
    stock: 100,
  },
];

const seedIngredients: Array<{
  name: string;
  stock: number;
  unit: string;
  isPerishable: boolean;
  expiryDate?: Date;
}> = [
  { name: 'Daging Babi', stock: 20, unit: 'kg', isPerishable: true, expiryDate: daysFromNow(5) },
  { name: 'Sayur Lawar', stock: 10, unit: 'kg', isPerishable: true, expiryDate: daysFromNow(3) },
  { name: 'Beras', stock: 50, unit: 'kg', isPerishable: false },
  { name: 'Bumbu Base Genep', stock: 15, unit: 'kg', isPerishable: false },
  { name: 'Kelapa', stock: 20, unit: 'pcs', isPerishable: false },
  { name: 'Kerupuk Babi', stock: 30, unit: 'pcs', isPerishable: false },
];

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function runSeed(force: boolean): Promise<void> {
  if (force) {
    await db.delete(orderItems);
    await db.delete(transactions);
    await db.delete(orders);
    await db.delete(modifiers);
    await db.delete(addons);
    await db.delete(menus);
    await db.delete(categories);
    await db.delete(ingredients);
    await db.delete(users);
  }

  const [userCount, categoryCount] = await Promise.all([
    db.select({ count: users.id }).from(users).all(),
    db.select({ count: categories.id }).from(categories).all(),
  ]);

  if (userCount.length === 0) {
    await db
      .insert(users)
      .values(
        seedUsers.map((u) => ({ ...u, passwordHash: bcrypt.hashSync(u.password, 10) })),
      )
      .run();
  }

  if (categoryCount.length === 0) {
    await db
      .insert(categories)
      .values(seedCategories.map((name) => ({ name })))
      .run();

    const categoryRows = await db.select().from(categories).all();
    const categoryMap = new Map(categoryRows.map((c) => [c.name, c]));

    for (const m of seedMenus) {
      const categoryId = categoryMap.get(m.category)?.id;
      if (!categoryId) continue;
      await db
        .insert(menus)
        .values({
          name: m.name,
          basePrice: m.basePrice,
          costPrice: m.costPrice,
          categoryId,
          stock: m.stock,
          available: true,
        })
        .run();
      const menuRow = await db.select().from(menus).where(eq(menus.name, m.name)).all();
      const menuId = menuRow[0]?.id;
      if (!menuId) continue;
      if (m.modifiers?.length) {
        await db
          .insert(modifiers)
          .values(m.modifiers.map((x) => ({ menuId, name: x.name, priceExtra: x.priceExtra })))
          .run();
      }
      if (m.addons?.length) {
        await db
          .insert(addons)
          .values(m.addons.map((x) => ({ menuId, name: x.name, price: x.price })))
          .run();
      }
    }

    await db.insert(ingredients).values(seedIngredients).run();
  }
}
