"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { useSession } from "@/lib/useSession";
import { Spot } from "@/components/Fx";

const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || "estudio";

export default function AdminLogin() {
  const { supabase, session, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const shake = useAnimationControls();

  useEffect(() => {
    if (!loading && session) router.replace(`/${ADMIN_PATH}/painel`);
  }, [loading, session, router]);

  if (loading || session) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      // Controls em vez de key: um key novo remontaria o form e limparia os campos.
      shake.start({ x: [0, -9, 8, -5, 0], transition: { duration: 0.4 } });
      return;
    }
    router.replace(`/${ADMIN_PATH}/painel`);
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-background px-4 py-3 outline-none transition-all duration-300 focus:border-accent focus:shadow-[0_0_0_4px_rgba(155,89,182,0.15)]";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Chacoalha quando a senha não bate — o erro se anuncia sozinho. */}
        <motion.div animate={shake}>
          <Spot className="border border-white/10 bg-surface/70 p-8">
            <div className="mb-7 text-center">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-xl text-accent-2">
                <i className="fa-solid fa-lock" aria-hidden />
              </span>
              <h1 className="text-xl font-semibold">Área administrativa</h1>
              <p className="mt-1 text-sm text-muted">
                JOÃO AUGUSTO<span className="gradient-text">.dev</span>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="mb-1 block text-sm text-muted">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${field} mb-4`}
              />
              <label className="mb-1 block text-sm text-muted">Senha</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${field} mb-6`}
              />
              {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary sheen w-full disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin" aria-hidden />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <i className="fa-solid fa-arrow-right text-xs" aria-hidden />
                  </>
                )}
              </button>
            </form>
          </Spot>
        </motion.div>
      </motion.div>
    </main>
  );
}
