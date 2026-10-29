"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { unlock } from "@/app/(cumple)/actions";
import { FloatingHearts } from "./floating-hearts";

export function LockScreen({ hint }: { hint: string | null }) {
  const [error, action, pending] = useActionState(unlock, null);

  return (
    <main className="fixed inset-0 overflow-hidden bg-linear-to-b from-[#06142e] via-[#0d2b5c] to-[#06142e]">
      <FloatingHearts />

      <div className="relative flex h-full flex-col items-center justify-center gap-8 px-8 text-center">
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 1 }}
        >
          <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-2xl" />
          {/* Candado con forma de corazón */}
          <svg viewBox="0 0 64 72" className="relative h-24 w-24 drop-shadow-[0_0_20px_rgba(125,200,255,0.55)]" aria-hidden>
            <path d="M20 30v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
            <path
              d="M32 68C10 52 4 42 4 33a13 13 0 0 1 28-6 13 13 0 0 1 28 6c0 9-6 19-28 35z"
              fill="url(#lock-heart)"
            />
            <circle cx="32" cy="42" r="4.5" fill="#06142e" />
            <path d="M30 44h4l1 9h-6z" fill="#06142e" />
            <defs>
              <linearGradient id="lock-heart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7dd3fc" />
                <stop offset="1" stopColor="#2563eb" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          className="flex flex-col gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="font-script text-4xl text-sky-50">Algo especial te espera</h1>
          <p className="font-serif text-sky-100/80">{hint ?? "Escribe la contraseña para abrirlo"}</p>
        </motion.div>

        <motion.form
          action={action}
          className="flex w-full max-w-xs flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={error ? { opacity: 1, y: 0, x: [0, -10, 10, -6, 6, 0] } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: error ? 0 : 0.5 }}
          key={error ?? "form"}
        >
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            required
            className="w-full rounded-full bg-white/10 px-5 py-3 text-center font-serif text-lg text-sky-50 ring-1 ring-sky-200/30 outline-none backdrop-blur placeholder:text-sky-100/50 focus:ring-2 focus:ring-sky-300"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-linear-to-r from-sky-400 to-blue-500 px-5 py-3 font-serif text-lg font-semibold text-white shadow-lg shadow-blue-950/50 transition-opacity disabled:opacity-60"
          >
            {pending ? "Abriendo…" : "Abrir 💙"}
          </button>
          {error && <p className="font-serif text-sm text-sky-200">{error}</p>}
        </motion.form>
      </div>
    </main>
  );
}
