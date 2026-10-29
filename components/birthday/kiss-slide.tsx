"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const BURST = 14;

export function KissSlide({
  coupon,
  signature,
  onRestart,
}: {
  coupon: string;
  signature: string | null;
  onRestart: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 pt-16 pb-10">
      <div className="relative flex h-80 w-full max-w-xs items-end justify-center" data-interactive>
        {/* Besos que salen disparados */}
        {open &&
          Array.from({ length: BURST }, (_, i) => {
            const angle = (i / BURST) * Math.PI * 2;
            return (
              <motion.span
                key={i}
                aria-hidden
                className="pointer-events-none absolute bottom-20 left-1/2 text-2xl"
                initial={{ x: "-50%", y: 0, opacity: 1, scale: 0.4 }}
                animate={{
                  x: `calc(-50% + ${Math.cos(angle) * 150}px)`,
                  y: Math.sin(angle) * 150 - 80,
                  opacity: 0,
                  scale: 1.3,
                  rotate: (i % 2 ? 1 : -1) * 40,
                }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              >
                {i % 3 ? "💋" : "💖"}
              </motion.span>
            );
          })}

        <AnimatePresence>
          {open && (
            <motion.div
              key="coupon"
              className="absolute bottom-24 z-20 w-full"
              initial={{ y: 80, scale: 0.4, opacity: 0, rotate: -8 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: -3 }}
              transition={{ type: "spring", bounce: 0.45, duration: 1, delay: 0.25 }}
            >
              <div className="relative rounded-2xl bg-[#fff8f0] p-2 shadow-2xl shadow-rose-950/50">
                {/* Muescas del ticket */}
                <span className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#4a1030]" />
                <span className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-[#4a1030]" />
                <div className="rounded-xl border-2 border-dashed border-rose-300 px-6 py-5 text-center">
                  <p className="font-serif text-xs font-semibold tracking-[0.35em] text-rose-400 uppercase">
                    Vale por
                  </p>
                  <p className="mt-2 font-script text-3xl leading-tight text-rose-700">{coupon}</p>
                  {signature && <p className="mt-3 font-serif text-sm text-rose-500 italic">— {signature}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caja de regalo */}
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir el regalo"
          className="relative h-32 w-44 outline-none"
          animate={open ? { y: 30, scale: 0.9 } : { rotate: [0, -3, 3, -2, 0] }}
          transition={open ? { duration: 0.5 } : { duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <div className="absolute inset-0 rounded-b-lg bg-rose-500 shadow-xl" />
          <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-rose-200" />
          <motion.div
            className="absolute -top-8 -left-2 h-10 w-48"
            animate={open ? { y: -220, rotate: 35, opacity: 0 } : { y: 0 }}
            transition={{ duration: 0.8, ease: "easeIn" }}
          >
            <div className="absolute inset-0 rounded-md bg-rose-400 shadow" />
            <div className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-rose-200" />
            {/* Moño */}
            <div className="absolute -top-7 left-1/2 flex -translate-x-1/2 gap-1">
              <span className="h-8 w-10 -rotate-12 rounded-[60%_40%_40%_60%] border-[6px] border-rose-200" />
              <span className="h-8 w-10 rotate-12 rounded-[40%_60%_60%_40%] border-[6px] border-rose-200" />
            </div>
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {open ? (
          <motion.button
            key="restart"
            type="button"
            data-interactive
            onClick={onRestart}
            className="rounded-full bg-white/10 px-5 py-2 font-serif text-sm text-rose-50 ring-1 ring-white/25 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            ↺ Ver desde el inicio
          </motion.button>
        ) : (
          <motion.p key="hint" className="font-serif text-rose-100/90" exit={{ opacity: 0 }}>
            Hay algo más para ti… toca el regalo 🎁
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
