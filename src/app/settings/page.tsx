import type { Metadata } from "next";
import ThemeSelect from "@/components/ThemeSelect";

export const metadata: Metadata = {
  title: "Setări — Ce fac în oraș",
};

export default function SettingsPage() {
  return (
    <main className="px-4 pt-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Setări</h1>
        <p className="text-sm text-muted">Preferințele aplicației</p>
      </header>

      <div className="rounded-xl border border-border bg-surface divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-medium">Temă</p>
            <p className="text-sm text-muted">Aspectul aplicației</p>
          </div>
          <ThemeSelect />
        </div>
      </div>
    </main>
  );
}
