import { cn } from "@/lib/utils";

type BadgeTone = "gold" | "green" | "red" | "neutral";

const tones: Record<BadgeTone, string> = {
  gold: "border-gold/50 bg-gold/10 text-gold",
  green: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  red: "border-red-500/50 bg-red-500/10 text-red-400",
  neutral: "border-white/15 bg-white/5 text-zinc-300",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
