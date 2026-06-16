"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const configured = Boolean(supabase);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInGoogle() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <main className="px-4 pt-6 max-w-sm mx-auto">
      <Link href="/" className="text-sm text-muted">
        ← Înapoi
      </Link>
      <h1 className="text-2xl font-bold mt-3">Intră în cont</h1>
      <p className="text-sm text-muted mt-1">
        Doar ca să-ți poți salva evenimentele pe orice dispozitiv.
      </p>

      {!configured && (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2">
          Autentificarea necesită Supabase configurat. În mod demo, salvările se
          păstrează local pe acest dispozitiv.
        </div>
      )}

      {sent ? (
        <div className="mt-6 rounded-xl bg-free/10 border border-free/30 text-free px-3 py-3 text-sm">
          Ți-am trimis un link de conectare pe <strong>{email}</strong>.
          Verifică emailul.
        </div>
      ) : (
        <>
          <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adresa@email.com"
              disabled={!configured}
              className="w-full px-3 py-3 rounded-xl border border-border bg-surface disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!configured || loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {loading ? "Se trimite…" : "Trimite-mi un link"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="flex-1 h-px bg-border" /> sau{" "}
            <span className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={signInGoogle}
            disabled={!configured}
            className="w-full py-3 rounded-xl border border-border bg-surface font-medium disabled:opacity-50"
          >
            Continuă cu Google
          </button>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </main>
  );
}
