export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center">
        <div className="gold-line w-40" />
        <p className="font-display text-sm tracking-[0.3em] gold-text">
          BARESKRIM POLRI · ROBLOX ROLEPLAY
        </p>
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Institusi Roleplay Bareskrim Polri. Sistem ujian berjalan
          otomatis & transparan.
        </p>
      </div>
    </footer>
  );
}
