import Link from "next/link";

export function Logo({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <img src="/shield.svg" alt="Bareskrim" width={size} height={size} className="drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]" />
        <div className="absolute -inset-1 -z-10 rounded-full bg-gold/20 blur-md" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-bold tracking-wide gold-text">
          BARESKRIM POLRI
        </p>
        <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-400">
          Roblox Roleplay
        </p>
      </div>
    </div>
  );
}
