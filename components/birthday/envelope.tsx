"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Sobre lacrado de entrada. El toque para abrirlo es también el gesto que necesita
// el navegador para permitir que empiece la música.
export function Envelope({
  to,
  title,
  onOpenStart,
  onOpened,
}: {
  to: string | null;
  title: string;
  onOpenStart: () => void;
  onOpened: () => void;
}) {
  const [open, setOpen] = useState(false);

  function handleOpen() {
    if (open) return;
    onOpenStart();
    setOpen(true);
    setTimeout(onOpened, 1700);
  }

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-6"
      exit={{ opacity: 0, scale: 1.15, filter: "blur(6px)" }}
      transition={{ duration: 0.6 }}
    >
      {to && (
        <motion.p
          className="font-script text-4xl text-sky-100 drop-shadow"
          initial={{ opacity: 0, y: -12 }}
          animate={open ? { opacity: 0, y: -12 } : { opacity: 1, y: 0 }}
          transition={open ? { duration: 0.3 } : { delay: 0.3, duration: 0.8 }}
        >
          {to}
        </motion.p>
      )}

      <motion.button
        type="button"
        onClick={handleOpen}
        aria-label="Abrir la carta"
        className="relative h-48 w-72 cursor-pointer outline-none"
        style={{ perspective: 900 }}
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={open ? { y: 40, rotate: 0, opacity: 1 } : { opacity: 1, y: [0, -8, 0], rotate: [-3, -1, -3] }}
        transition={open ? { duration: 0.6 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Parte trasera */}
        <div className="absolute inset-0 rounded-xl bg-sky-400 shadow-2xl shadow-blue-950/60" />

        {/* Carta */}
        <motion.div
          className="absolute inset-x-4 top-3 bottom-3 z-[1] flex items-start justify-center rounded-md bg-[#f8fbff] px-3 pt-4 shadow"
          animate={open ? { y: -120 } : { y: 0 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-script text-2xl leading-tight text-blue-700">{title || "♥"}</p>
        </motion.div>

        {/* Bolsillo delantero */}
        <div
          className="absolute inset-0 z-[1] rounded-xl bg-sky-300"
          style={{ clipPath: "polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)" }}
        />

        {/* Solapa */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[58%] origin-top rounded-t-xl bg-blue-500"
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          animate={open ? { rotateX: 180, zIndex: 0 } : { rotateX: 0, zIndex: 2 }}
          transition={{ duration: 0.6, zIndex: { delay: 0.3 } }}
        />

        {/* Sello de lacre */}
        <motion.div
          className="absolute left-1/2 top-[58%] z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-800 text-2xl text-sky-200 shadow-lg ring-4 ring-blue-900/60"
          animate={open ? { scale: 0, opacity: 0 } : { scale: [1, 1.08, 1] }}
          transition={open ? { duration: 0.3 } : { duration: 1.4, repeat: Infinity }}
        >
          ♥
        </motion.div>
      </motion.button>

      <motion.p animate={{ opacity: open ? 0 : 1 }}>
        <span
          className="bday-motion block font-serif text-sm tracking-widest text-sky-100/80 uppercase"
          style={{ animation: "soft-pulse 2s ease-in-out infinite" }}
        >
          Toca para abrir
        </span>
      </motion.p>
    </motion.div>
  );
}
