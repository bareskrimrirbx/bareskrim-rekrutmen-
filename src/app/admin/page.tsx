import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata = { title: "Admin - Rekrutmen Bareskrim Polri RP" };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold gold-text md:text-3xl">
          PANEL ADMINISTRATOR
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Kelola periode rekrutmen & bank soal. Lindungi halaman ini.
        </p>
      </div>
      <AdminPanel />
    </div>
  );
}
