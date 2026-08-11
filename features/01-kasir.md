# Kasir

Layar utama untuk melihat menu, memilih pesanan, dan menghitung total otomatis.

## Spesifikasi

### Tujuan
Layar utama kasir untuk melihat daftar menu, memilih dan menyesuaikan pesanan, menghitung total otomatis, serta menyelesaikan transaksi agar tercatat di riwayat.

### Selesai bila
- Kasir dapat melihat semua menu dalam kartu yang rapi, lengkap dengan nama, harga, dan status ketersediaan.
- Kasir dapat menambah menu ke pesanan dan mengubah jumlahnya langsung dari layar, dengan tampilan ringkasan pesanan yang selalu terlihat.
- Total harga dihitung otomatis setiap kali item atau jumlah berubah, tanpa perlu menghitung manual.
- Transaksi yang diselesaikan tersimpan dan muncul di riwayat penjualan sebagai data baru.

## Sub-fitur: Lihat Daftar Menu

Menampilkan semua menu makanan dalam kartu yang rapi dan mudah dipilih.

### Tujuan
Menampilkan semua menu makanan yang tersedia dalam bentuk kartu yang rapi dan mudah dipilih oleh kasir.

### Selesai bila
- Daftar menu menampilkan nama menu, harga, kategori, dan status tersedia/tidak tersedia.
- Menu tampil sebagai kartu yang dapat diketuk untuk mulai memilih pesanan, dan tersusun rapi dalam daftar yang dapat digulir.
- Saat tidak ada menu, muncul pesan kosong yang jelas (misalnya "Belum ada menu").

## Sub-fitur: Pilih & Sesuaikan Pesanan

Menambah menu ke pesanan dan mengubah jumlahnya langsung dari layar.

### Tujuan
Memungkinkan kasir menambahkan menu ke pesanan aktif dan mengubah jumlahnya langsung dari layar tanpa langkah rumit.

### Selesai bila
- Setiap ketukan pada kartu menu menambahkan item baru ke daftar pesanan.
- Kasir bisa menambah atau mengurangi jumlah item dari layar yang sama, dan jumlah minimum tidak kurang dari 1.
- Ringkasan pesanan memperlihatkan item yang dipilih beserta jumlah dan harga satuan.

## Sub-fitur: Hitung Total Otomatis

Menjumlahkan semua item pesanan secara otomatis dan akurat.

### Tujuan
Menjumlahkan semua item pesanan secara otomatis sehingga total yang dibayar selalu akurat.

### Selesai bila
- Total pesanan berubah otomatis saat item ditambah, dihapus, atau jumlahnya diubah.
- Total menampilkan angka dalam format Rupiah yang mudah dibaca, misalnya "Rp15.000".
- Total sesuai dengan perkalian jumlah item dan harga satuan tanpa kesalahan hitung.

## Sub-fitur: Selesaikan Transaksi

Menyimpan pesanan yang sudah selesai agar masuk ke riwayat penjualan.

### Tujuan
Menyimpan pesanan yang sudah selesai agar masuk ke riwayat penjualan dan siap untuk langkah pembayaran.

### Selesai bila
- Ada tombol "Selesaikan" yang hanya aktif jika pesanan tidak kosong.
- Setelah ditekan, pesanan tersimpan dan layar kembali ke kondisi awal/catatan baru.
- Transaksi yang sudah diselesaikan muncul di daftar riwayat dan memiliki data waktu serta total yang benar.

## Task

### 1. Buat layar kasir dengan data tiruan

### 2. Tampilkan kartu menu lengkap dan status

### 3. Tambahkan item menu ke pesanan

### 4. Buat ringkasan pesanan dan kontrol jumlah

### 5. Hitung total otomatis dengan format Rupiah

### 6. Tampilkan pesan kosong saat menu tidak ada

### 7. Buat tombol selesaikan dan reset pesanan

### 8. Buat skema SQLite menu dan transaksi

### 9. Buat migrasi dan seed data menu

### 10. Buat endpoint GET daftar menu

### 11. Buat endpoint POST simpan transaksi

### 12. Buat endpoint GET riwayat transaksi
