"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { BirthdayContent, BirthdayMedia } from "@/lib/birthday";
import { Envelope } from "./envelope";
import { FloatingHearts } from "./floating-hearts";
import { MessageSlide } from "./message-slide";
import { MoonSlide } from "./moon-slide";
import { CakeSlide } from "./cake-slide";
import { KissSlide } from "./kiss-slide";
import { SongBadge } from "./song-badge";

type Slide =
  | { kind: "message"; text: string; photo: BirthdayMedia | null; textTop: boolean }
  | { kind: "moon"; phrase: string }
  | { kind: "cake" }
  | { kind: "kiss"; coupon: string };

const SWIPE_PX = 50;
const HOLD_MS = 250;
const MUSIC_VOLUME = 0.7;

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? "30%" : "-30%", scale: 0.96 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? "-30%" : "30%", scale: 0.96 }),
};

export function BirthdayStories({ content }: { content: BirthdayContent }) {
  const slides = useMemo<Slide[]>(
    () => [
      ...content.cards.map((card) => ({ kind: "message" as const, ...card })),
      ...(content.moonPhrase ? [{ kind: "moon" as const, phrase: content.moonPhrase }] : []),
      { kind: "cake" as const },
      ...(content.coupon ? [{ kind: "kiss" as const, coupon: content.coupon }] : []),
    ],
    [content],
  );

  const [opened, setOpened] = useState(false);
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Mantener presionado oculta el texto para ver la foto completa (como pausar una story).
  const [holding, setHolding] = useState(false);

  const go = useCallback(
    (delta: number) =>
      setPage((prev) => {
        const next = Math.min(Math.max(prev[0] + delta, 0), slides.length - 1);
        return next === prev[0] ? prev : [next, delta];
      }),
    [slides.length],
  );

  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, go]);

  // Tiene que ocurrir dentro del toque al sobre: los navegadores solo dejan sonar audio tras un gesto.
  function startMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(() => {});
    let volume = 0;
    const fade = setInterval(() => {
      volume = Math.min(volume + 0.05, MUSIC_VOLUME);
      audio.volume = volume;
      if (volume >= MUSIC_VOLUME) clearInterval(fade);
    }, 120);
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !muted;
    if (audio.paused) audio.play().catch(() => {});
    setMuted(!muted);
  }

  function onPointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    if ((e.target as HTMLElement).closest("[data-interactive]")) return;
    holdTimer.current = setTimeout(() => setHolding(true), HOLD_MS);
  }

  function endHold() {
    clearTimeout(holdTimer.current);
    setHolding(false);
  }

  function onPointerUp(e: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    endHold();
    if (!start || (e.target as HTMLElement).closest("[data-interactive]")) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && Date.now() - start.time < HOLD_MS) {
      go(e.clientX < window.innerWidth * 0.3 ? -1 : 1);
    }
  }

  const slide = slides[index];
  const nextPhoto = slides[index + 1]?.kind === "message" ? (slides[index + 1] as { photo: BirthdayMedia | null }).photo : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 touch-manipulation overflow-hidden overscroll-none [-webkit-touch-callout:none] bg-linear-to-b from-[#06142e] via-[#0d2b5c] to-[#06142e] select-none">
        <FloatingHearts />
        {content.song && <audio ref={audioRef} src={content.song} loop preload="auto" />}

        <AnimatePresence mode="wait">
          {!opened ? (
            <Envelope
              key="envelope"
              to={content.to}
              title={content.title}
              onOpenStart={startMusic}
              onOpened={() => setOpened(true)}
            />
          ) : (
            <motion.div
              key="stories"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={endHold}
              onContextMenu={(e) => e.preventDefault()}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {slide.kind === "message" && (
                    <MessageSlide text={slide.text} photo={slide.photo} textTop={slide.textTop} showHint={index === 0} hideText={holding} />
                  )}
                  {slide.kind === "moon" && <MoonSlide phrase={slide.phrase} />}
                  {slide.kind === "cake" && <CakeSlide title={content.title} age={content.age} />}
                  {slide.kind === "kiss" && (
                    <KissSlide coupon={slide.coupon} signature={content.signature} onRestart={() => setPage([0, -1])} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Precarga la foto de la siguiente tarjeta */}
              {nextPhoto && !nextPhoto.video && (
                <div className="hidden" aria-hidden>
                  <Image src={nextPhoto.src} alt="" fill sizes="100vw" unoptimized={!nextPhoto.optimize} loading="eager" />
                </div>
              )}

              {/* Cabecera estilo stories: barras de progreso + canción */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-linear-to-b from-black/35 to-transparent px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
                <div className="flex gap-1">
                  {slides.map((_, i) => (
                    <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                      <motion.div
                        className="h-full bg-white"
                        initial={false}
                        animate={{ width: i <= index ? "100%" : "0%" }}
                        transition={{ duration: i === index ? 0.6 : 0.2 }}
                      />
                    </div>
                  ))}
                </div>

                {content.song && (
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      {content.songTitle && <SongBadge title={content.songTitle} playing={!muted} />}
                    </div>
                    <button
                      type="button"
                      data-interactive
                      onClick={toggleMusic}
                      aria-label={muted ? "Activar música" : "Silenciar música"}
                      className="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" />
                        {muted ? (
                          <path d="m23 9-6 6M17 9l6 6" />
                        ) : (
                          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
                        )}
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </MotionConfig>
  );
}
