# Laporan Harian

Melihat total penjualan harian dan ringkasannya dalam satu layar.

## Spesifikasi

### Tujuan
Laporan Harian membantu kasir atau pemilik melihat total penjualan harian dan ringkasannya dalam satu layar, sehingga mudah memantau pendapatan tanpa menghitung manual.

### Selesai bila
- Menampilkan total uang masuk hari ini di bagian atas laporan.
- Menampilkan rincian per metode pembayaran (Tunai, QRIS, Transfer, Hutang).
- Membedakan penjualan offline dan online untuk rekonsiliasi.
- Menampilkan grafik tren penjualan yang mudah dipahami.
- Mendukung perubahan rentang tanggal untuk melihat laporan periode lain.

## Sub-fitur: Lihat Total Hari Ini

Menampilkan total uang masuk hari ini di bagian atas laporan.

### Tujuan
Menampilkan total uang masuk hari ini di bagian atas laporan agar pengguna langsung mengetahui pendapatan hari tersebut.

### Selesai bila
- Bagian atas laporan menampilkan total penjualan hari ini dengan format Rupiah yang dihitung otomatis dari transaksi sukses.
- Total diperbarui setiap kali ada transaksi baru yang selesai pada hari yang sama.

## Sub-fitur: Grafik Penjualan

Menampilkan tren penjualan dalam bentuk grafik yang mudah dipahami.

### Tujuan
Menampilkan tren penjualan dalam bentuk grafik yang mudah dipahami agar pengguna bisa melihat pola pendapatan.

### Selesai bila
- Grafik menampilkan total penjualan per hari sesuai rentang tanggal yang dipilih.
- Sumbu dan label nominal mudah dibaca.
- Grafik menyesuaikan saat rentang tanggal diubah.

## Sub-fitur: Pilih Rentang Tanggal

Mengubah periode laporan ke tanggal tertentu.

### Tujuan
Mengubah periode laporan ke tanggal tertentu agar pengguna bisa melihat penjualan di hari, minggu, atau bulan lain.

### Selesai bila
- Tersedia pemilih rentang tanggal (mulai dan selesai) yang mudah digunakan.
- Setelah memilih rentang, semua bagian laporan (total, rincian pembayaran, dan grafik) diperbarui.
- Ada pilihan cepat seperti Hari Ini, 7 Hari Terakhir, dan Bulan Ini.

## Task

### 1. Buat layout dasar halaman Laporan Harian

### 2. Buat komponen total hari ini dan rincian metode

### 3. Buat komponen grafik tren penjualan

### 4. Buat komponen pemilih rentang tanggal

### 5. Buat tabel transaksi dan migrasi database

### 6. Buat API endpoint ringkasan penjualan dengan rentang

### 7. Buat API endpoint data grafik penjualan
