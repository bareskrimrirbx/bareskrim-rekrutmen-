# Admin Panel: Rekap Nilai Casis + Putusan & Blacklist

Tanggal: 2026-08-02
Status: Disetujui (perubahan selanjutnya akan dikomunikasikan user)

## Tujuan

1. Admin dapat melihat daftar calon (nama, username, pangkat) beserta nilai ujiannya, difilter per periode, dan mengekspor ke CSV.
2. Menggantikan kebutuhan membaca channel Discord (putusan sidang, blacklist polri, blacklist pendidikan) dengan pengelolaan data langsung di panel admin — tanpa Discord bot maupun izin server.

## Latar Belakang & Kendala

- Membaca pesan Discord membutuhkan bot token + izin `View Channel`/`Read Message History` di server target. User **bukan admin** server tersebut sehingga cara itu tidak memungkinkan.
- Solusi: data blacklist & putusan dikelola di dalam database aplikasi. Admin memindahkan data sekali (paste/bulk import) lalu memperbarui manual.
- Data Discord asli tidak lagi di-sync otomatis. Trade-off ini sudah disetujui.

## Ruang Lingkup

### A. Tab "Rekap Nilai"
- Dropdown filter periode (data `ExamPeriod`) + opsi "Semua Periode".
- Tabel kolom: Nama (displayName), Username (link profil Roblox), Pangkat (policeGroupRank), Nilai MCQ (mcqScore), Nilai Essay (essayScore), Total (score/maxScore), Status (LULUS/TIDAK_LULUS badge), Tanggal (submittedAt).
- Tombol "Unduh CSV" — dibangkitkan di client dari data yang sudah dimuat, difilter sesuai pilihan periode.
- Urutan default: submittedAt desc.

### B. Tab "Putusan & Blacklist"
Tiga daftar yang dikelola admin:

1. **Putusan Sidang** (`VerdictEntry`)
   - Kolom: username, status (LULUS / TIDAK_LULUS), catatan (opsional), tanggal dibuat.
   - Informasional; TIDAK memblokir akses otomatis.
2. **Blacklist Polri** (`BlacklistEntry` kategori `POLRI`)
   - Kolom: username, alasan (opsional), tanggal dibuat.
   - Memblokir akses ujian saat login.
3. **Blacklist Pendidikan** (`BlacklistEntry` kategori `PENDIDIKAN`)
   - Kolom: username, alasan (opsional), tanggal dibuat.
   - Memblokir akses ujian saat login.

Fitur tiap daftar: tambah entri (form), import massal (textarea, satu username per baris), hapus entri, filter cari teks dalam daftar.

### C. Integrasi Auto-Block Blacklist
- Saat verifikasi login (`POST /api/auth/verify`), setelah user di-resolve, cek username secara case-insensitive terhadap `BlacklistEntry` kategori POLRI dan PENDIDIKAN.
- Jika cocok: tolak dengan kode `BLACKLISTED`, status 403, pesan yang jelas bahwa user ada di daftar hitam.
- Pengecekan dilakukan sebelum membuat session cookie / mengizinkan ujian.
- Catatan: cache verifikasi 15 menit tetap berlaku; user yang lolos verifikasi sebelum masuk daftar hitam tetap bisa menyelesaikan ujian yang sedang berjalan (perilaku ini diterima).

## Perubahan Data Model

### Model Prisma baru (tambahan di `prisma/schema.prisma`)

```prisma
enum BlacklistCategory {
  POLRI
  PENDIDIKAN
}

enum VerdictStatus {
  LULUS
  TIDAK_LULUS
}

model BlacklistEntry {
  id        String           @id @default(cuid())
  category  BlacklistCategory
  username  String
  reason    String?
  createdAt DateTime         @default(now())

  @@index([category])
  @@index([username])
}

model VerdictEntry {
  id        String        @id @default(cuid())
  username  String
  status    VerdictStatus
  note      String?
  createdAt DateTime      @default(now())

  @@index([username])
}
```

### Infrastruktur schema
- Tambahkan `CREATE TYPE` + `CREATE TABLE IF NOT EXISTS` + index untuk kedua model ke `src/lib/init-schema.ts` (`statements`) dan `prisma/init.sql`.
- Admin membuat tabel baru dengan klik tombol "Initialize Database" (initSchema idempoten); tabel lama tidak terpengaruh.

### Perbaikan bug tersembunyi (dalam cakupan)
- `src/lib/init-schema.ts` dan `prisma/init.sql` masih mendefinisikan kolom `User.robloxId`, `User.requiredGroupId`, `User.policeGroupRankId` sebagai `INTEGER`. DB live sudah `BIGINT` (di-alter manual), tapi fresh setup akan meledak dengan ID Roblox 64-bit. Ubah ketiganya ke `BIGINT` di kedua file.

## API (pola admin, auth `x-admin-key`)

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/admin/candidates?periodId=` | Rekap nilai (hasil + user + periode). `periodId` opsional. |
| GET | `/api/admin/blacklist?category=` | Ambil daftar entri blacklist per kategori. |
| POST | `/api/admin/blacklist` | Tambah satu entri. |
| POST | `/api/admin/blacklist/bulk` | Import massal (array username). |
| DELETE | `/api/admin/blacklist?id=` | Hapus entri. |
| GET | `/api/admin/verdicts` | Ambil daftar putusan. |
| POST | `/api/admin/verdicts` | Tambah satu putusan. |
| POST | `/api/admin/verdicts/bulk` | Import massal. |
| DELETE | `/api/admin/verdicts?id=` | Hapus putusan. |

Catatan implementasi:
- Endpoint GET mengembalikan daftar kosong bila tabel belum ada (pola `P2021` yang sudah ada), bukan error 500.
- Validasi zod pada semua body (username min 1 karakter, max 40; category/status dari enum; alasan opsional).
- Username dinormalisasi `trim()`; disimpan apa adanya (pencarian tetap case-insensitive).
- Import massal melewati validasi per baris; baris kosong diabaikan.

## Keamanan

- Semua route di atas hanya dengan header `x-admin-key` (sama dengan admin route lain).
- Tidak ada secret baru; token Discord tidak digunakan.
- Tidak ada data Discord yang dirender (tidak relevan lagi).
- Pengecekan blacklist di verify dilakukan server-side; hasilnya (kode `BLACKLISTED`) dikirim ke client tanpa detail internal.

## Penanganan Error

- Admin panel menampilkan pesan sukses/gagal (pola `setMsg` yang sudah ada).
- Route mengembalikan `{ ok, message }` dengan status HTTP sesuai pola route admin yang ada.
- Bila tabel belum diinisialisasi, route POST membalas `409` dengan petunjuk klik "Initialize Database".

## Uji / Verifikasi

1. `npx prisma generate` lalu restart dev server.
2. `/admin` -> klik "Initialize Database" -> pastikan tabel `BlacklistEntry` dan `VerdictEntry` terbentuk (tanpa error).
3. Tab Rekap Nilai: buka periode, submit 1 ujian uji, pastikan baris muncul lengkap + filter periode berfungsi + CSV terunduh.
4. Tab Putusan & Blacklist: tambah entri, bulk import, hapus, filter cari.
5. Auto-block: masukkan username uji ke Blacklist Polri, coba login dengan username itu -> ditolak `BLACKLISTED`; hapus entri -> login normal kembali.
6. `npm run typecheck` dan `npm run build` hijau.

## Di Luar Cakupan (YAGNI)

- Pagination/loading lebih lama untuk daftar (daftar dianggap pendek; cukup satu request).
- Ekspor CSV untuk blacklist/putusan (hanya rekap nilai).
- Sinkronisasi otomatis dengan Discord (webhook/bot) di masa depan.
- Edit entri (hanya tambah/hapus; perbaikan dilakukan hapus + tambah ulang).
