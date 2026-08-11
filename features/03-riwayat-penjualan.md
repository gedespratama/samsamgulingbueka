# Riwayat Penjualan

Melihat kembali semua transaksi yang sudah selesai dengan rapi.

## Spesifikasi

### Tujuan
Fitur ini memungkinkan kasir atau pemilik melihat kembali semua transaksi yang sudah selesai dengan rapi dan urut dari yang terbaru.

### Selesai bila
- Daftar transaksi yang sudah selesai dapat dibuka dari menu Riwayat dan menampilkan transaksi dari yang terbaru.
- Setiap transaksi menampilkan informasi ringkas yang cukup untuk dikenali, seperti waktu, nomor meja (jika dine-in), dan total harga.
- Pengguna dapat mengetuk satu transaksi untuk melihat rinciannya, dan menyaringnya berdasarkan tanggal.
- Data transaksi yang tampil berasal dari transaksi yang sudah diselesaikan di Kasir.

## Sub-fitur: Lihat Daftar Transaksi

Menampilkan riwayat penjualan urut dari yang terbaru.

### Tujuan
Menampilkan daftar seluruh transaksi yang sudah selesai secara berurutan dari yang terbaru.

### Selesai bila
- Layar Riwayat menampilkan daftar transaksi selesai, transaksi terbaru muncul paling atas.
- Setiap baris transaksi menampilkan waktu/jam, tipe pesanan (Dine-in/Takeaway) beserta nomor meja jika ada, dan total harga.
- Daftar dapat di-scroll untuk melihat transaksi lama.

## Sub-fitur: Detail Transaksi

Membuka rincian item dan total dari satu transaksi.

### Tujuan
Membuka rincian lengkap satu transaksi agar kasir/pemilik bisa memeriksa isi pesanan dan totalnya.

### Selesai bila
- Mengetuk salah satu transaksi membuka halaman detail transaksi.
- Detail menampilkan daftar item yang dipesan, jumlah masing-masing, pilihan varian/tambahan, subtotal per item, dan total akhir.
- Detail juga menampilkan informasi transaksi seperti waktu, tipe pesanan, dan metode pembayaran.

## Sub-fitur: Saring per Tanggal

Menyaring riwayat berdasarkan tanggal agar mudah dicari.

### Tujuan
Menyaring riwayat penjualan berdasarkan tanggal agar transaksi pada hari tertentu mudah ditemukan.

### Selesai bila
- Terdapat pemilih tanggal pada layar Riwayat untuk menentukan tanggal yang ingin dilihat.
- Saat tanggal dipilih, daftar transaksi hanya menampilkan transaksi pada tanggal tersebut.
- Tersedia cara untuk menghapus/mengubah filter agar kembali menampilkan semua transaksi.

## Task

### 1. Buat halaman Riwayat dengan daftar transaksi tiruan

### 2. Buat halaman detail transaksi dengan data tiruan

### 3. Tambahkan filter tanggal pada daftar riwayat

### 4. Buat tabel transaksi dan item transaksi

### 5. Buat API daftar transaksi dengan filter tanggal

### 6. Buat API detail transaksi
