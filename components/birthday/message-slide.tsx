"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import type { BirthdayMedia } from "@/lib/birthday";

// Por debajo de esta proporción (ancho/alto) la foto es "tipo celular" y puede llenar la pantalla
// sin perder casi nada; por encima (3:4, horizontales) se muestra completa sobre un fondo desenfocado.
const FULL_SCREEN_MAX_RATIO = 0.62;

function SlideMedia({ photo, textTop }: { photo: BirthdayMedia; textTop: boolean }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const fullScreen = ratio !== null && ratio <= FULL_SCREEN_MAX_RATIO;

  const media = (className: string, measure: boolean) =>
    photo.video ? (
      // Sin sonido para no tapar la canción de fondo; playsInline evita la pantalla completa en iOS.
      <video
        src={photo.src}
        autoPlay
        muted
        loop
        playsInline
        className={`h-full w-full ${className}`}
        onLoadedMetadata={measure ? (e) => setRatio(e.currentTarget.videoWidth / e.currentTarget.videoHeight) : undefined}
      />
    ) : (
      <Image
        src={photo.src}
        alt=""
        fill
        loading="eager"
        sizes="100vw"
        unoptimized={!photo.optimize}
        className={className}
        onLoad={measure ? (e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight) : undefined}
      />
    );

  return (
    <>
      {/* Fondo: la misma foto ampliada y desenfocada (como las stories de Instagram) */}
      {!fullScreen && (
        <div className="absolute inset-0 scale-125 opacity-70 blur-2xl">{!photo.video && media("object-cover", false)}</div>
      )}
      <div className="absolute inset-0 bg-[#06142e]/40" />

      <div
        className={`bday-motion absolute transition-opacity duration-700 ${ratio === null ? "opacity-0" : "opacity-100"} ${
          fullScreen ? "inset-0" : textTop ? "inset-x-3 top-[40%] bottom-8" : "inset-x-3 top-20 bottom-[40%]"
        }`}
        style={{ animation: fullScreen ? "kenburns 14s ease-out forwards" : undefined }}
      >
        {media(fullScreen ? "object-cover" : "object-contain drop-shadow-2xl", true)}
      </div>

      <div
        className={`absolute inset-0 ${textTop ? "bg-linear-to-b" : "bg-linear-to-t"} ${
          fullScreen ? "from-[#06142e] via-[#06142e]/55 to-[#06142e]/10" : "from-[#06142e]/90 via-transparent to-transparent"
        }`}
      />
    </>
  );
}

function textSize(length: number) {
  if (length < 110) return "text-[1.75rem] leading-snug";
  if (length < 220) return "text-2xl leading-snug";
  if (length < 340) return "text-xl leading-relaxed";
  return "text-lg leading-relaxed";
}

export function MessageSlide({
  text,
  photo,
  textTop,
  showHint,
  hideText,
}: {
  text: string;
  photo: BirthdayMedia | null;
  textTop: boolean;
  showHint: boolean;
  hideText: boolean;
}) {
  const words = text.split(/\s+/);
  // Que el texto completo aparezca en ~2.5 s, sin importar lo largo que sea.
  const step = Math.min(0.06, 2.5 / words.length);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {photo && <SlideMedia photo={photo} textTop={textTop} />}

      <div
        className={`relative flex h-full flex-col px-6 pt-20 pb-[max(2.5rem,env(safe-area-inset-bottom))] ${
          !photo ? "justify-center" : textTop ? "justify-start" : "justify-end"
        }`}
      >
        <motion.div
          className={`rounded-3xl p-6 ${
            photo ? "bg-blue-950/35 shadow-2xl ring-1 ring-white/15 backdrop-blur-md" : ""
          }`}
          initial={{ opacity: 0, y: textTop ? -24 : 24 }}
          animate={{ opacity: hideText ? 0 : 1, y: 0 }}
          transition={{ duration: hideText ? 0.2 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={`font-serif text-sky-50 ${textSize(text.length)}`}>
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
            className="mt-6 text-center font-serif text-xs tracking-widest text-sky-100/70 uppercase"
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
