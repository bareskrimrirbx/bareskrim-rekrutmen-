import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CONFIG } from "@/lib/constants";

const features = [
  {
    icon: "🛡️",
    title: "Verifikasi Roblox Otomatis",
    desc: "Foto avatar, keanggotaan grup wajib [RI], dan pangkat grup Kepolisian diambil langsung dari Roblox API.",
  },
  {
    icon: "⛔",
    title: "Anti Matra Lain",
    desc: "Peserta yang terdaftar di grup matra lain (TNI AD/AL) otomatis ditolak mengakses soal ujian.",
  },
  {
    icon: "📝",
    title: "20 Soal · 15 PG + 5 Essay",
    desc: `Auto-grading server-side dengan KKM ${CONFIG.kkm}. Nilai langsung tampil transparan setelah submit.`,
  },
  {
    icon: "🔒",
    title: "1x Percobaan",
    desc: "Setiap casis hanya dapat mengisi 1x per periode. Percobaan ganda akan menampilkan hasil lama.",
  },
  {
    icon: "🎲",
    title: "Soal Teracak per Periode",
    desc: "Setiap periode baru, bank soal di-reset & diacak ulang secara deterministik dari seed baru.",
  },
  {
    icon: "📣",
    title: "Laporan Discord Real-Time",
    desc: "Begitu submit, laporan lengkap + rekap jawaban dikirim otomatis ke channel pusdik instruktur.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* HERO */}
      <section className="bg-hero-radial py-20 text-center md:py-28">
        <div className="mx-auto mb-6 flex items-center justify-center gap-3">
          <Badge tone="gold">Sistem Rekrutmen Resmi</Badge>
          <Badge tone="neutral">Red & Gold Edition</Badge>
        </div>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight text-zinc-50 md:text-6xl">
          BARESKRIM POLRI <br />
          <span className="gold-text">ROBLOX ROLEPLAY</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-zinc-400 md:text-lg">
          Rekrutmen calon anggota Bareskrim Polri yang profesional, transparan, dan terverifikasi
          langsung dari Roblox. Bergabunglah dan tunjukkan integritas Anda.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="w-full rounded-lg border border-gold/40 bg-gradient-to-r from-gold-300 via-gold to-gold-600 px-8 py-3.5 text-center font-semibold text-crimson-950 shadow-glow transition hover:brightness-110 sm:w-auto"
          >
            Daftar & Ikuti Ujian
          </Link>
          <Link
            href="/hasil"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-8 py-3.5 text-center font-semibold text-zinc-200 transition hover:border-gold/40 hover:bg-white/10 sm:w-auto"
          >
            Lihat Hasil Anda
          </Link>
        </div>
        <div className="gold-line mx-auto mt-16 w-2/3" />
      </section>

      {/* STATS */}
      <section className="grid grid-cols-3 gap-4 pb-16">
        {[
          { num: "20", label: "Total Soal" },
          { num: `${CONFIG.kkm}`, label: "Standar KKM" },
          { num: "1x", label: "Batas Percobaan" },
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center">
            <p className="font-display text-3xl font-bold gold-text">{s.num}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">{s.label}</p>
          </Card>
        ))}
      </section>

      {/* FEATURES */}
      <section className="pb-20">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-zinc-100 md:text-3xl">
          Kenapa Sistem Ini <span className="gold-text">Dipercaya</span>?
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-6 transition hover:border-gold/30">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="font-display text-base font-bold text-gold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
