"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { BirthdayMedia } from "@/lib/birthday";

function textSize(length: number) {
  if (length < 110) return "text-[1.75rem] leading-snug";
  if (length < 220) return "text-2xl leading-snug";
  if (length < 340) return "text-xl leading-relaxed";
  return "text-lg leading-relaxed";
}

export function MessageSlide({
  text,
  photo,
  showHint,
}: {
  text: string;
  photo: BirthdayMedia | null;
  showHint: boolean;
}) {
  const words = text.split(/\s+/);
  // Que el texto completo aparezca en ~2.5 s, sin importar lo largo que sea.
  const step = Math.min(0.06, 2.5 / words.length);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {photo && (
        <>
          <div
            className="bday-motion absolute inset-0"
            style={{ animation: "kenburns 14s ease-out forwards" }}
          >
            {photo.video ? (
              // Sin sonido para no tapar la canción de fondo; playsInline evita la pantalla completa en iOS.
              <video src={photo.src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
              <Image
                src={photo.src}
                alt=""
                fill
                loading="eager"
                sizes="100vw"
                unoptimized={!photo.optimize}
                className="object-cover"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-[#2a0a18] via-[#2a0a18]/55 to-[#2a0a18]/10" />
        </>
      )}

      <div
        className={`relative flex h-full flex-col px-6 pt-20 pb-[max(2.5rem,env(safe-area-inset-bottom))] ${
          photo ? "justify-end" : "justify-center"
        }`}
      >
        <motion.div
          className={`rounded-3xl p-6 ${
            photo ? "bg-rose-950/35 shadow-2xl ring-1 ring-white/15 backdrop-blur-md" : ""
          }`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={`font-serif text-rose-50 ${textSize(text.length)}`}>
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block whitespace-pre"
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.3 + i * step, duration: 0.5 }}
              >
                {word}{" "}
              </motion.span>
            ))}
          </p>
        </motion.div>

        {showHint && (
          <motion.p
            className="mt-6 text-center font-serif text-xs tracking-widest text-rose-100/70 uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3 }}
          >
            <span className="bday-motion inline-block" style={{ animation: "soft-pulse 2s infinite" }}>
              Toca a la derecha para seguir →
            </span>
          </motion.p>
        )}
      </div>
    </div>
  );
}
