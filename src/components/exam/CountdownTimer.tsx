"use client";

import { useEffect, useRef, useState } from "react";

export function CountdownTimer({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const fired = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [left, onExpire]);

  const mm = Math.floor(left / 60)
    .toString()
    .padStart(2, "0");
  const ss = (left % 60).toString().padStart(2, "0");
  const danger = left <= 300;

  return (
    <div
      className={`rounded-lg border px-4 py-2 font-mono text-lg font-bold tabular-nums ${
        danger
          ? "border-red-500/50 bg-red-500/10 text-red-400"
          : "border-gold/40 bg-gold/10 text-gold"
      }`}
    >
      ⏱ {mm}:{ss}
    </div>
  );
}
