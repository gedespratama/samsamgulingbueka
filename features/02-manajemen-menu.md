# Manajemen Menu

Mengelola daftar menu makanan dan minuman milik warung.

## Spesifikasi

### Tujuan
Memudahkan pemilik warung mengelola seluruh daftar menu makanan dan minuman (tambah, ubah, hapus) langsung dari HP agar data yang tampil di kasir selalu akurat dan up-to-date.

### Selesai bila
- Pengguna dapat melihat daftar menu yang tersimpan dalam bentuk kartu, dengan nama menu, kategori, harga jual, dan status aktif/tidak aktif.
- Pengguna dapat menambahkan menu baru dengan mengisi nama, kategori, harga jual, dan status ketersediaan; menu langsung muncul di daftar dan layar kasir.
- Pengguna dapat mengubah nama, kategori, harga jual, atau status menu, dan perubahan langsung tersimpan serta tercermin di semua layar terkait.
- Pengguna dapat menghapus menu yang sudah tidak dijual, dan menu tersebut hilang dari daftar menu serta tidak bisa dipilih di kasir.
- Setiap aksi berhasil ditandai dengan pesan/umpan balik singkat (misal "Menu berhasil disimpan") dan tidak membingungkan pengguna awam.

## Sub-fitur: Tambah Menu

Menambahkan menu baru beserta nama, harga, dan kategori.

### Tujuan
Memungkinkan pengguna menambahkan menu baru lengkap dengan nama, kategori, dan harga jual agar langsung tersedia di kasir.

### Selesai bila
- Ada formulir/layar "Tambah Menu" yang dapat dibuka dari halaman Manajemen Menu.
- Formulir berisi kolom Nama Menu, kategori (pilih dari daftar: Babi Guling, Sate Babi, Lawar, Aneka Sambal), Harga Jual dalam Rupiah, serta status tersedia/tidak tersedia.
- Setelah menekan "Simpan", menu baru muncul di daftar menu dan bisa dipilih di layar kasir, dengan harga sesuai yang diisi.

## Sub-fitur: Ubah Menu

Memperbarui informasi menu seperti nama atau harga.

### Tujuan
Memungkinkan pengguna memperbarui informasi menu (nama, kategori, harga, status) agar data tetap sesuai kondisi warung.

### Selesai bila
- Setiap kartu menu memiliki aksi "Ubah" yang membuka formulir berisi data menu saat ini.
- Pengguna dapat mengubah nama, kategori, harga jual, dan status ketersediaan lalu menekan "Simpan".
- Perubahan langsung tampil di daftar menu dan harga terbaru otomatis dipakai saat menu dipilih di kasir.

## Sub-fitur: Hapus Menu

Menghapus menu yang sudah tidak dijual.

### Tujuan
Memungkinkan pengguna menghapus menu yang sudah tidak dijual agar tidak mengganggu tampilan kasir.

### Selesai bila
- Setiap kartu menu memiliki aksi "Hapus" yang disertai konfirmasi "Yakin ingin menghapus menu ini?" sebelum benar-benar dihapus.
- Setelah dikonfirmasi, menu hilang dari daftar menu dan tidak muncul lagi di layar kasir.
- Riwayat transaksi lama tetap aman dan tidak terpengaruh oleh penghapusan menu (hanya memengaruhi menu yang tersedia saat ini).

## Task

### 1. Buat layar daftar menu dengan mock data

### 2. Buat form tambah menu dengan state lokal

### 3. Buat form ubah menu dengan prefill data

### 4. Buat konfirmasi hapus menu dan toast

### 5. Buat tabel menu dan migrasi SQLite

### 6. Buat API GET /api/menu

### 7. Buat API POST /api/menu

### 8. Buat API PUT /api/menu/:id

### 9. Buat API DELETE /api/menu/:id
