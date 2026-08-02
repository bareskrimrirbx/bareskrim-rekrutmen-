# 🚀 DEPLOY KE NETLIFY — Panduan "Tinggal Upload"

Proyek ini sudah **100% dikonfigurasi untuk Netlify**:

- `netlify.toml` → build command otomatis + plugin Next.js + Node 20
- `package.json` → `postinstall: prisma generate` (Prisma Client otomatis dibuat saat build)
- `.nvmrc` → versi Node 20
- Halaman `/admin` → tombol **"Initialize Database"** (membuat semua tabel tanpa perlu CLI)
- `prisma/init.sql` → alternatif manual via SQL Editor Supabase

---

## ⚠️ Penting Sebelum Mulai

Situs ini adalah aplikasi **full-stack** (server components, API, database). Netlify **drag-and-drop
hanya untuk situs statis** — untuk aplikasi ini gunakan **2 cara resmi** di bawah (sama-sama "tinggal
klik/1 perintah").

> Tanpa database, website tetap terbuka tetapi ujian tidak berjalan. Siapkan database di Bagian 1.

---

## 0️⃣ Siapkan File `.env` (lokal, opsional tapi disarankan)

```bash
copy .env.example .env
```

Isi nilai penting Anda. `.env` **tidak** akan di-commit (sudah di `.gitignore`).

---

## 1️⃣ Database PostgreSQL (Supabase) — 5 menit

1. Buka [supabase.com](https://supabase.com) → **New project** → buat password → region (mis. Singapore) → **Create**.
2. Menu **Project Settings → Database → Connection string**.
3. Tab **URI**, pilih *Direct connection*, klik **Copy**.
4. Sesuaikan: ubah `:6543` → `:5432` lalu tambahkan `?sslmode=require` di akhir:
   ```
   postgresql://postgres.abcdef:[PASSWORD]@db.abcdef.supabase.co:5432/postgres?sslmode=require
   ```
5. **Cara A (paling mudah):** lewati langkah 6, tabel akan dibuat otomatis dari tombol
   *Initialize Database* di `/admin`.
6. **Cara B (manual):** buka **SQL Editor** di Supabase → paste seluruh isi file
   `prisma/init.sql` → klik **Run**. (Sekali saja.)

> Simpan string `DATABASE_URL` ini — dipakai di Bagian 3.

---

## 2️⃣ Push ke GitHub (sekali saja)

```bash
cd bareskrim-rekrutmen
git init
git add .
git commit -m "Bareskrim Rekrutmen - siap deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/bareskrim-rekrutmen.git
git push -u origin main
```

---

## 3️⃣ Deploy ke Netlify

### Cara A — Import dari GitHub (paling disarankan)

1. Buka [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Pilih **GitHub** → pilih repo `bareskrim-rekrutmen`.
3. Netlify mendeteksi **Next.js** otomatis. Konfirmasi:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
4. **Site settings → Environment variables**, tambahkan:

   | Key | Contoh |
   |---|---|
   | `DATABASE_URL` | `postgresql://...?sslmode=require` |
   | `JWT_SECRET` | string acak ≥32 karakter (contoh: `kodeacak:9f8a7s6d5f4g3h2j`) |
   | `DISCORD_WEBHOOK_URL` | URL webhook channel pusdik |
   | `DISCORD_BOT_NAME` | `Sistem Rekrutmen Bareskrim Polri` |
   | `REQUIRED_GROUP_ID` | ID grup `[RI] Republic Indonesia` |
   | `REQUIRED_GROUP_NAME` | `[RI] Republic Indonesia` |
   | `POLICE_GROUP_ID` | ID grup Kepolisian |
   | `POLICE_GROUP_NAME` | `Kepolisian` |
   | `BANNED_GROUP_IDS` | `1111,2222` (ID TNI AD,TNI AL) |
   | `BANNED_GROUP_NAMES` | `TNI AD,TNI AL` |
   | `KKM` | `75` |
   | `MCQ_COUNT` | `15` |
   | `ESSAY_COUNT` | `5` |
   | `MCQ_POINTS` | `4` |
   | `ESSAY_POINTS` | `8` |
   | `EXAM_DURATION_MINUTES` | `30` |
   | `ADMIN_KEY` | kunci admin rahasia Anda |

5. Klik **Deploy site** → tunggu ±2–4 menit sampai **Published**.

### Cara B — Netlify CLI (tanpa GitHub)

```bash
npm i -g netlify-cli
netlify login
netlify init            # "Create & configure a new site"
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set JWT_SECRET "..."
netlify env:set DISCORD_WEBHOOK_URL "..."
netlify env:set REQUIRED_GROUP_ID "..."
netlify env:set POLICE_GROUP_ID "..."
netlify env:set BANNED_GROUP_IDS "..."
netlify env:set ADMIN_KEY "..."
# ... (set env lain yang Anda perlukan)
netlify deploy --prod --build
```

---

## 4️⃣ Aktivasi Awal (tanpa terminal sama sekali)

Setelah site **Published**:

1. Buka `https://NAMA-SITE.netlify.app/admin`
2. Masukkan `ADMIN_KEY`.
3. Jika muncul kartu **"⚠️ Database Belum Siap"** → klik **Initialize Database**.
   (Jika Anda sudah pakai `prisma/init.sql` di Supabase, kartu ini tidak muncul.)
4. **Tambahkan soal:**
   - Buat minimal **15 soal Pilihan Ganda** (isi pertanyaan, 4 opsi, pilih radio jawaban benar).
   - Buat **5 soal Essay** (isi pertanyaan + kata kunci auto-grading, pisahkan koma).
5. **Buka periode rekrutmen pertama:** isi nama periode → **Buka Periode Baru**.
6. Selesai! Arahkan casis ke `https://NAMA-SITE.netlify.app`.

> Tips: bila ingin bank soal langsung terisi contoh, jalankan sekali dari PC Anda:
> `npm install` → set `DATABASE_URL` di `.env` → `npm run db:seed`.

---

## 5️⃣ Verifikasi

- `https://NAMA-SITE.netlify.app/api/health` → `{"ok":true,...}`
- Coba login dengan username Roblox (muncul avatar + pangkat).
- Submit ujian → hasil langsung tampil → cek channel Discord `pusdik`.

---

## 🧯 Troubleshooting

| Gejala | Solusi |
|---|---|
| Build gagal | Set `NODE_VERSION = "20"` (sudah otomatis via `netlify.toml`). Pastikan `ADMIN_KEY`/env tidak perlu untuk build. |
| `PrismaClientInitializationError` | `DATABASE_URL` salah/tidak terisi. Cek env Netlify + `?sslmode=require`. |
| Halaman admin "Database Belum Siap" | Klik **Initialize Database**, atau jalankan `prisma/init.sql` di Supabase SQL Editor. |
| Discord tidak terkirim | Cek `DISCORD_WEBHOOK_URL` benar & webhook aktif di channel pusdik. |
| Semua logout tiba-tiba | `JWT_SECRET` berubah. Jangan regen setelah deploy. |

---

**Link Anda:** `https://NAMA-SITE.netlify.app` (ganti NAMA-SITE sesuai nama site di Netlify).
