"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface PeriodItem {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  seed: number;
  openedAt: string;
  closedAt: string | null;
  _count: { attempts: number };
}

interface QuestionItem {
  id: string;
  type: "MCQ" | "ESSAY";
  prompt: string;
  options: Array<{ key: string; text: string }> | null;
  correctKey: string | null;
  keywords: string[] | null;
  points: number;
  isActive: boolean;
}

export function AdminPanel() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dbReady, setDbReady] = useState<boolean | null>(null);

  // form periode
  const [periodName, setPeriodName] = useState("");
  // form soal
  const [qType, setQType] = useState<"MCQ" | "ESSAY">("MCQ");
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qKeywords, setQKeywords] = useState("");
  const [qPoints, setQPoints] = useState(4);

  const headers = { "Content-Type": "application/json", "x-admin-key": key };

  const load = useCallback(async () => {
    const [p, q, d] = await Promise.all([
      fetch("/api/admin/period", { headers }),
      fetch("/api/admin/questions", { headers }),
      fetch("/api/admin/init", { headers }),
    ]);
    if (!p.ok || !q.ok) {
      setAuthed(false);
      setMsg({ ok: false, text: "Kunci admin salah." });
      return;
    }
    const pj = await p.json();
    const qj = await q.json();
    const dj = d.ok ? await d.json() : null;
    setPeriods(pj.periods);
    setQuestions(qj.questions);
    setDbReady(dj?.initialized ?? true);
    setAuthed(true);
  }, [headers]);

  async function initDb() {
    setBusy(true);
    const res = await fetch("/api/admin/init", { method: "POST", headers });
    const json = await res.json();
    setMsg(json);
    setDbReady(json.initialized ?? false);
    setBusy(false);
    if (json.initialized) await load();
  }

  async function openPeriod() {
    if (!periodName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/period", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: periodName.trim() }),
    });
    const json = await res.json();
    setMsg(json);
    setPeriodName("");
    setBusy(false);
    if (json.ok) await load();
  }

  async function addQuestion() {
    if (!qPrompt.trim()) return;
    setBusy(true);
    const body =
      qType === "MCQ"
        ? {
            type: "MCQ",
            prompt: qPrompt.trim(),
            options: qOptions.filter((o) => o.trim()),
            correctIndex: qCorrect,
            points: qPoints,
          }
        : {
            type: "ESSAY",
            prompt: qPrompt.trim(),
            keywords: qKeywords.split(",").map((k) => k.trim()).filter(Boolean),
            points: qPoints,
          };
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setMsg(json);
    setQPrompt("");
    setBusy(false);
    if (json.ok) await load();
  }

  if (!authed) {
    return (
      <Card strong className="mx-auto w-full max-w-md p-8">
        <h2 className="font-display text-lg font-bold gold-text">Masuk Admin</h2>
        <div className="gold-line my-3" />
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Kunci admin (ADMIN_KEY)"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
        />
        <Button variant="gold" className="mt-4 w-full" onClick={load}>
          Masuk
        </Button>
        {msg && (
          <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Status Database */}
      {dbReady === false && (
        <Card strong className="border-red-500/40 p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-red-300">⚠️ Database Belum Siap</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Tabel belum ditemukan. Klik tombol di samping untuk membuat semua tabel secara
                otomatis (tidak perlu terminal/CLI). Pastikan <code className="text-gold">DATABASE_URL</code>{" "}
                sudah diisi di Netlify.
              </p>
            </div>
            <Button variant="gold" onClick={initDb} disabled={busy} className="shrink-0">
              {busy ? "Membuat tabel..." : "Initialize Database"}
            </Button>
          </div>
        </Card>
      )}

      {/* Periode */}
      <Card strong className="p-6">
        <h2 className="font-display text-lg font-bold gold-text">🕐 Kelola Periode Rekrutmen</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Membuka periode baru otomatis menutup periode lama dan mengacak ulang bank soal dengan seed
          baru.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={periodName}
            onChange={(e) => setPeriodName(e.target.value)}
            placeholder="Nama periode, contoh: Rekrutmen Gelombang 2"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
          />
          <Button variant="gold" onClick={openPeriod} disabled={busy}>
            {busy ? "Proses..." : "Buka Periode Baru"}
          </Button>
        </div>

        <div className="mt-5 space-y-2">
          {periods.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-100">{p.name}</p>
                <p className="text-xs text-zinc-500">
                  Seed: {p.seed} · Peserta: {p._count.attempts} ·{" "}
                  {new Date(p.openedAt).toLocaleString("id-ID")}
                </p>
              </div>
              <Badge tone={p.isActive ? "green" : "neutral"}>
                {p.isActive ? "AKTIF" : "DITUTUP"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank soal */}
      <Card strong className="p-6">
        <h2 className="font-display text-lg font-bold gold-text">🗂 Bank Soal ({questions.length})</h2>

        <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex overflow-hidden rounded-lg border border-white/15">
              {(["MCQ", "ESSAY"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setQType(t)}
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    qType === t ? "bg-crimson-800 text-gold" : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {t === "MCQ" ? "Pilihan Ganda" : "Essay"}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={qPoints}
              onChange={(e) => setQPoints(Number(e.target.value))}
              min={1}
              max={10}
              className="w-24 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none"
            />
          </div>
          <textarea
            value={qPrompt}
            onChange={(e) => setQPrompt(e.target.value)}
            rows={2}
            placeholder="Pertanyaan..."
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
          />
          {qType === "MCQ" ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {qOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={qCorrect === i}
                      onChange={() => setQCorrect(i)}
                      className="accent-gold"
                    />
                    <span className="font-mono text-xs text-gold">{String.fromCharCode(65 + i)}.</span>
                    <input
                      value={opt}
                      onChange={(e) =>
                        setQOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))
                      }
                      placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500">Pilih radio = jawaban benar.</p>
            </>
          ) : (
            <input
              value={qKeywords}
              onChange={(e) => setQKeywords(e.target.value)}
              placeholder="Kata kunci auto-grading, pisahkan koma: reserse,kriminal,penyidikan"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-gold/60"
            />
          )}
          <div>
            <Button variant="gold" onClick={addQuestion} disabled={busy}>
              {busy ? "Menyimpan..." : "Tambah Soal"}
            </Button>
          </div>
        </div>

        <div className="mt-5 max-h-96 space-y-2 overflow-y-auto pr-1">
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-zinc-200">{q.prompt}</p>
                <Badge tone={q.type === "MCQ" ? "gold" : "neutral"}>
                  {q.type === "MCQ" ? `PG · ${q.points}pt` : `Essay · ${q.points}pt`}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
