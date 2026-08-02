# 🛡️ BARESKRIM POLRI — Sistem Rekrutmen & Ujian Online (Roblox RP)

Sistem website full-stack untuk rekrutmen calon anggota (casis) Bareskrim Polri Roblox
Roleplay. Tema **Red & Gold/Crimson** khas instansi kepolisian, dengan verifikasi identitas
Roblox langsung, cross-group check anti-matra, ujian 20 soal (15 PG + 5 Essay) auto-grading
server-side, pembatasan 1x percobaan per periode, serta laporan real-time ke Discord.

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 🎨 Tema Red & Gold | Glassmorphism, gradient subtle, motif kepolisian, responsif mobile/desktop |
| 🤖 Integrasi Roblox API | Foto headshot terbaru, cek grup wajib `[RI] Republic Indonesia`, pangkat grup `Kepolisian` |
| ⛔ Matra Check | Tolak otomatis bila casis terdaftar di grup matra lain (TNI AD / TNI AL) |
| 📝 Ujian 20 Soal | 15 Pilihan Ganda (4 poin) + 5 Essay (8 poin) = total 100 poin |
| ⚡ Auto-Grading | PG dinilai otomatis server-side, essay via kata kunci, nilai instan & transparan |
| ✅ KKM 75 | Status tegas `LULUS KKM` / `TIDAK LULUS` |
| 🔒 Limit 1x | Satu percobaan per casis per periode; percobaan ulang menampilkan hasil lama |
| 🎲 Reset & Acak Soal | Setiap periode baru: seed baru → subset & urutan soal berbeda dari periode sebelumnya |
| 📣 Discord Webhook | Embed real-time ke channel `pusdik` (avatar, nama, pangkat, skor, rekap jawaban) |
| 🔐 Anti-Cheat | Kunci jawaban tidak pernah dikirim ke client; grading 100% di server |

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS 3
- **Backend:** Next.js Route Handlers (`src/app/api/**`) + Server Components
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (jose) dalam HTTP-only cookie
- **Validasi:** Zod
- **Integrasi:** Roblox Public API + Discord Webhook

> Arsitektur **monorepo full-stack** dalam satu aplikasi Next.js — frontend & backend
> berbagi satu codebase, mudah di-deploy ke Vercel / Railway / VPS.

---

## 📁 Struktur Folder

```
bareskrim-rekrutmen/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed bank soal + periode pertama
├── public/
│   └── shield.svg             # Favicon / logo
└── src/
    ├── middleware.ts          # Proteksi route /ujian /hasil /admin
    ├── app/
    │   ├── layout.tsx         # Layout root (Navbar + Footer)
    │   ├── globals.css        # Tema Red & Gold (glass, gold-text, dll)
    │   ├── page.tsx           # Landing page
    │   ├── login/page.tsx     # Form verifikasi Roblox
    │   ├── ujian/page.tsx     # Halaman ujian (server component)
    │   ├── hasil/page.tsx     # Halaman hasil nilai instan
    │   ├── tolak/page.tsx     # Halaman tolak matra (AD/AL)
    │   ├── admin/page.tsx     # Panel admin
    │   └── api/
    │       ├── auth/verify/route.ts        # Verifikasi Roblox + matra check
    │       ├── exam/session/route.ts       # Mulai / resume sesi ujian
    │       ├── exam/submit/route.ts        # Submit + auto-grading
    │       ├── admin/period/route.ts       # Buka periode baru (reset & acak)
    │       ├── admin/questions/route.ts    # Kelola bank soal
    │       └── health/route.ts             # Health check
    ├── components/
    │   ├── layout/        # Navbar, Footer
    │   ├── ui/            # Logo, Card, Button, Badge
    │   ├── login/         # LoginForm
    │   ├── casis/         # CasisCard (avatar, pangkat, dll)
    │   ├── exam/          # ExamForm, MCQQuestion, EssayQuestion, CountdownTimer
    │   ├── result/        # ResultCard (nilai + rekap)
    │   └── admin/         # AdminPanel
    ├── lib/
    │   ├── prisma.ts      # Prisma client singleton
    │   ├── roblox.ts      # Roblox API client
    │   ├── auth.ts        # JWT + session cookie
    │   ├── grading.ts     # Seeded shuffle + auto-grading engine
    │   ├── exam-service.ts# Logika mulai/submit ujian
    │   ├── discord.ts     # Discord webhook embed
    │   ├── constants.ts   # Konfigurasi (KKM, grup, dll)
    │   └── utils.ts       # Helper
    └── types/             # Tipe bersama client/server
```

---

## 🚀 Cara Menjalankan

> 📦 **Mau deploy ke Netlify?** Ikuti panduan lengkap di **[DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md)**
> — sudah termasuk inisialisasi database tanpa terminal (tombol *Initialize Database* di `/admin`).

### Prasyarat
- Node.js **18.18+** / 20+
- PostgreSQL (lokal / Supabase / Neon / Railway)
- Discord Webhook URL (channel `pusdik`)

### Langkah

```bash
# 1. Clone / masuk ke folder proyek
cd bareskrim-rekrutmen

# 2. Install dependensi
npm install

# 3. Siapkan environment
cp .env.example .env
#  lalu isi DATABASE_URL, JWT_SECRET, DISCORD_WEBHOOK_URL,
#      REQUIRED_GROUP_ID, POLICE_GROUP_ID, BANNED_GROUP_IDS, ADMIN_KEY, dll.

# 4. Buat database + tabel
npm run db:migrate        # atau: npm run db:push

# 5. Isi bank soal + buka periode pertama
npm run db:seed

# 6. Jalankan server dev
npm run dev
# buka http://localhost:3000

# Build produksi
npm run build
npm run start
```

### Menemukan nilai konfigurasi Roblox
1. Buka grup Roblox Anda → URL berformat `https://www.roblox.com/groups/{GROUP_ID}/...`
2. `REQUIRED_GROUP_ID` = ID grup `[RI] Republic Indonesia`
3. `POLICE_GROUP_ID` = ID grup `Kepolisian` (sumber pangkat casis)
4. `BANNED_GROUP_IDS` = ID grup TNI AD, TNI AL (dipisah koma)

---

## 🔄 Alur Sistem

```
Casis → /login (input username Roblox)
  → POST /api/auth/verify
      ├─ Resolve user via Roblox API (users.roblox.com)
      ├─ Ambil avatar headshot (thumbnails.roblox.com)
      ├─ Ambil daftar grup (groups.roblox.com)
      ├─ Wajib anggota "[RI] Republic Indonesia"?  ── tidak ──> tolak
      ├─ Terdaftar di grup TNI AD / TNI AL?        ── ya ────> /tolak (matra block)
      ├─ Ambil pangkat di grup Kepolisian
      └─ Buat/update User + set cookie JWT (httpOnly)
  → /ujian
      ├─ startExamSession: cek periode aktif
      ├─ Sudah pernah submit periode ini? ── ya ──> redirect /hasil (tampil hasil lama)
      ├─ Belum? Buat ExamAttempt + snapshot 20 soal acak (seed periode)
  → Submit (client) → POST /api/exam/submit
      ├─ Validasi kepemilikan attempt & waktu
      ├─ Auto-grade server-side (PG + essay keyword)
      ├─ Simpan ExamResult, ExamAnswer, tandai attempt submitted
      └─ Kirim Discord embed ke channel pusdik (real-time)
  → /hasil  (nilai instan, LULUS/TIDAK LULUS, rekap jawaban)
```

### Periode Baru (Reset & Pengacakan)
Admin membuka periode baru di `/admin` → API menutup periode lama, membuat periode baru
dengan `seed` acak → `buildQuestionSet()` memilih **subset** berbeda dari bank soal dan
**mengacak urutan + opsi** soal secara deterministik dari seed. Butir & urutan soal
dijamin berbeda dari periode sebelumnya.

---

## 🔐 Keamanan (Anti-Cheat)

1. **Grading 100% server-side** — kunci jawaban (`correctKey`) & kata kunci essay hanya
   tersimpan di database (`ExamAttempt.questionsJson`) dan tidak pernah dikirim ke browser.
2. **Snapshot per attempt** — soal disajikan dari snapshot ber-*seed*, bukan langsung dari
   bank soal; jawaban untuk soal di luar snapshot ditolak.
3. **Sesi JWT httpOnly cookie** — client tidak bisa mengubah identitas casis.
4. **Limit 1x** — constraint unik `attemptKey` (`periodId_userId`) + validasi `submittedAt`.
5. **Waktu** — batas durasi + grace period diverifikasi ulang di server.
6. **Matra re-check** — flag `matraBlocked` diperiksa ulang di page, session API, dan submit API.
7. **Rate-limit saran produksi** — tambahkan middleware rate-limit (mis. `@upstash/ratelimit`)
   pada `/api/auth/verify` & `/api/exam/submit` untuk publikasi.

---

## 📣 Contoh Output Discord (channel pusdik)

- **Embed 1:** Foto avatar casis (thumbnail), nama/username, link profil Roblox,
  pangkat grup Kepolisian, skor akhir `X/100`, status `LULUS KKM 🟢` / `TIDAK LULUS 🔴`,
  rincian nilai MCQ & Essay.
- **Embed 2:** Rekap jawaban Pilihan Ganda (jawaban vs kunci) dan Essay (teks jawaban)
  untuk cross-check instruktur.

---

## 🗃️ Ringkasan Database Schema

- `User` — identitas Roblox casis + snapshot keanggotaan (pangkat, grup matra).
- `ExamPeriod` — periode rekrutmen; `isActive` + `seed` untuk reset & pengacakan.
- `Question` — bank soal MCQ (`options`, `correctKey`) & Essay (`keywords`).
- `ExamAttempt` — satu percobaan per periode (`attemptKey` unik), snapshot soal + waktu.
- `ExamAnswer` — jawaban tiap soal (arsip + rekap).
- `ExamResult` — skor akhir, status KKM, rekap JSON, timestamp.

---

## 🧪 Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `start` | Build & jalankan produksi |
| `npm run typecheck` | Type-check TypeScript |
| `npm run lint` | ESLint (setup first run) |
| `npm run db:migrate` | Migrasi schema Prisma |
| `npm run db:push` | Sinkronisasi schema tanpa migrasi |
| `npm run db:seed` | Seed bank soal + periode |
| `npm run db:studio` | Prisma Studio (UI database) |

---

© Bareskrim Polri Roblox Roleplay. Project boilerplate untuk keperluan roleplay/game komunitas.
