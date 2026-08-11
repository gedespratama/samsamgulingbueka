# Backend API — Samsam Guling Bu Eka

REST API untuk aplikasi kasir mobile (POS) warung makan babi guling, dibuat dengan **Node.js + Express + Drizzle ORM + SQLite/LibSQL**.

- **Fase 1**: Kasir (checkout dengan modifier/varian & add-on, tipe pesanan, pindah meja) + Offline-First sync
- **Fase 2**: Manajemen menu & HPP dinamis, kategori babi guling, stok bahan baku, riwayat penjualan
- **Fase 3**: Laporan harian (per metode pembayaran, offline vs online), hutang pelanggan & supplier

## Tech Stack

| Bagian | Pilihan |
|---|---|
| Runtime | Node.js 18+ (Express 4, TypeScript) |
| ORM | Drizzle ORM |
| Database | SQLite lokal (`file:`), atau Turso/LibSQL (`libsql://`) untuk production |
| Auth | JWT (login owner/cashier) |
| Deploy | Vercel (serverless) |

## Menjalankan di Lokal

```bash
cd backend
npm install
cp .env.example .env
npm run dev          # otomatis buat tabel + seed data awal
```

Server berjalan di `http://localhost:4000`. Cek `GET /api/health`.

Seed ulang database (reset & isi data contoh):

```bash
npm run db:seed
```

Akun default: `owner / owner123` (owner) dan `kasir / kasir123` (cashier).

## Konfigurasi (.env)

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `4000` | Port server lokal |
| `DATABASE_URL` | `file:data/warung.db` | Lokal, atau `libsql://...` untuk Turso |
| `DATABASE_AUTH_TOKEN` | - | Token Turso (hanya untuk libsql://) |
| `JWT_SECRET` | dev default | Wajib diganti di production |
| `AUTH_DISABLED` | `false` | `true` = nonaktifkan auth (dev saja) |

## Endpoint API (semua di bawah `/api`)

Semua endpoint butuh header `Authorization: Bearer <token>` kecuali `/auth/login` dan `/health`.

### Auth & Pengguna
| Method | Path | Keterangan |
|---|---|---|
| POST | `/auth/login` | Login, kembalikan JWT `{username, password}` |
| GET | `/auth/me` | Info user yang login |
| GET/POST | `/users` | Daftar / tambah pengguna (owner only) |
| PATCH/DELETE | `/users/:id` | Ubah / hapus pengguna (owner only) |

### Menu & Kategori
| Method | Path | Keterangan |
|---|---|---|
| GET | `/categories` | Daftar kategori + jumlah menu |
| POST/PATCH/DELETE | `/categories` `/categories/:id` | Kelola kategori |
| GET | `/menus?categoryId=&includeInactive=` | Daftar menu + modifier + add-on |
| GET | `/menus/:id` | Detail menu |
| POST/PATCH/DELETE | `/menus` `/menus/:id` | Kelola menu |
| PATCH | `/menus/:id/cost-price` | **Update HPP dinamis** `{costPrice}` |
| POST | `/menus/:id/modifiers` `/menus/:id/addons` | Tambah varian / add-on |
| PATCH/DELETE | `/menus/modifiers/:id` `/menus/addons/:id` | Ubah / hapus varian & add-on |

### Bahan Baku (Stok)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/ingredients` | Daftar bahan + flag `isLowStock`, `isExpired`, `isExpiringSoon` |
| GET | `/ingredients/low-stock` | Bahan menipis / hampir kedaluwarsa |
| POST/PATCH/DELETE | `/ingredients` `/ingredients/:id` | Kelola bahan |

### Kasir / Transaksi
| Method | Path | Keterangan |
|---|---|---|
| POST | `/orders` | Selesaikan transaksi (hitung total otomatis) |
| GET | `/orders?from=&to=&limit=&offset=` | Riwayat penjualan (terbaru dulu) |
| GET | `/orders/:id` | Detail transaksi (item, modifier, add-on) |
| PATCH | `/orders/:id/table` | **Pindah meja** `{tableNumber}` |
| PATCH | `/orders/:id/payment` | Bayar hutang / ubah metode pembayaran |
| DELETE | `/orders/:id` | Hapus transaksi |

### Offline-First Sync
| Method | Path | Keterangan |
|---|---|---|
| POST | `/sync/orders` | Kirim batch transaksi pending dari HP `{orders: [...]}` |
| GET | `/sync/pull` | Snapshot kategori, menu, bahan, user untuk disimpan lokal |

### Laporan
| Method | Path | Keterangan |
|---|---|---|
| GET | `/reports/today` | Ringkasan hari ini (total, jumlah, rata-rata, per metode, offline/online, pending sync) |
| GET | `/reports/daily?date=YYYY-MM-DD` | Laporan per tanggal |
| GET | `/reports/range?from=&to=` | Laporan rentang tanggal + per hari |
| GET | `/reports/weekly` | Tabel penjualan 7 hari terakhir per metode pembayaran |

### Hutang
| Method | Path | Keterangan |
|---|---|---|
| GET | `/debts?direction=&status=` | Daftar hutang (customer/supplier) + sisa |
| GET | `/debts/summary` | Ringkasan total hutang pelanggan & ke supplier |
| POST/PATCH/DELETE | `/debts` `/debts/:id` | Kelola catatan hutang |

## Contoh Request Transaksi

`POST /api/orders`

```json
{
  "orderType": "dine_in",
  "tableNumber": 3,
  "items": [
    {
      "menuId": "<id menu>",
      "quantity": 2,
      "modifierIds": ["<id modifier Porsi Jumbo>"],
      "addonIds": ["<id addon Tambah Kulit>"],
      "customization": "Level 3"
    }
  ],
  "payment": { "method": "qris", "transactionType": "online", "status": "paid" },
  "syncStatus": "synced"
}
```

Server menghitung ulang harga (base + modifier + add-on), total, menyimpan order + item + transaksi, dan mengurangi stok menu. Untuk transaksi offline, kirim `syncStatus: "pending"` lewat `/api/sync/orders` — server menerima tanpa memblokir stok.

Nilai enum: `orderType: dine_in|takeaway`, `payment.method: cash|qris|transfer|debt`, `transactionType: offline|online`, `status: paid|unpaid`.

## Deploy ke Vercel

1. Buat database di [Turso](https://turso.tech), contoh nama `warung-kasir`.
2. Deploy repo ini ke Vercel (`vercel.json` sudah disiapkan untuk Express).
3. Set env di Vercel:
   - `DATABASE_URL=libsql://warung-kasir-<org>.turso.io`
   - `DATABASE_AUTH_TOKEN=<token>`
   - `JWT_SECRET=<secret kuat>`
4. Akses `https://<project>.vercel.app/api/health`.

Catatan: pada Vercel serverless, file SQLite lokal tidak persisten — untuk production wajib pakai Turso (`DATABASE_URL=libsql://...`).
