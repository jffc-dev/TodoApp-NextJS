"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";

function Flame({ lit }: { lit: boolean }) {
  return (
    <div className="absolute bottom-full left-1/2 h-12 w-6 -translate-x-1/2">
      {/* Mecha */}
      <div className="absolute bottom-0 left-1/2 h-3 w-[3px] -translate-x-1/2 rounded bg-stone-800" />
      <AnimatePresence>
        {lit ? (
          <motion.div
            key="flame"
            className="absolute bottom-2.5 left-1/2 h-8 w-5"
            exit={{ scaleY: 0, opacity: 0, transition: { duration: 0.25 } }}
          >
            <div
              className="bday-motion absolute inset-y-0 left-1/2 w-full origin-bottom rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[radial-gradient(circle_at_50%_75%,#fffbe6_0%,#ffd45c_35%,#ff8a2b_70%,rgba(255,80,40,0)_100%)] shadow-[0_0_24px_8px_rgba(255,170,60,0.55)]"
              style={{ animation: "flame-flicker 0.9s ease-in-out infinite", transform: "translateX(-50%)" }}
            />
          </motion.div>
        ) : (
          [0, 1, 2].map((i) => (
            <motion.div
              key={`smoke-${i}`}
              className="absolute bottom-3 left-1/2 h-4 w-4 rounded-full bg-stone-300/50 blur-sm"
              initial={{ opacity: 0.8, y: 0, x: "-50%", scale: 0.6 }}
              animate={{ opacity: 0, y: -70, x: `${-50 + (i - 1) * 60}%`, scale: 2 }}
              transition={{ duration: 1.8, delay: i * 0.25, ease: "easeOut" }}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

function celebrate() {
  const heart = confetti.shapeFromText({ text: "❤️", scalar: 2 });
  const shoot = (origin: { x: number; y: number }, angle: number) =>
    confetti({
      particleCount: 60,
      spread: 70,
      angle,
      origin,
      startVelocity: 45,
      colors: ["#ff8fb1", "#ffd1dc", "#ffe08a", "#ffffff"],
      zIndex: 60,
      disableForReducedMotion: true,
    });
  shoot({ x: 0, y: 0.8 }, 60);
  shoot({ x: 1, y: 0.8 }, 120);
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 120,
      origin: { x: 0.5, y: 0.45 },
      shapes: [heart],
      scalar: 2,
      zIndex: 60,
      disableForReducedMotion: true,
    });
  }, 350);
}

// Escucha el micrófono y dispara cuando detecta un soplido (ruido fuerte y sostenido).
function useBlowDetector(onBlow: () => void) {
  const [state, setState] = useState<"idle" | "listening" | "denied">("idle");
  const stopRef = useRef<() => void>(() => {});

  const stop = useCallback(() => stopRef.current(), []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let loud = 0;
      let frame = 0;

      stopRef.current = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        stopRef.current = () => {};
      };

      const listen = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        loud = Math.sqrt(sum / data.length) > 0.2 ? loud + 1 : Math.max(0, loud - 1);
        if (loud > 6) {
          stopRef.current();
          onBlow();
          return;
        }
        frame = requestAnimationFrame(listen);
      };
      setState("listening");
      listen();
    } catch {
      setState("denied");
    }
  }, [onBlow]);

  useEffect(() => stop, [stop]);
  return { state, start, stop };
}

export function CakeSlide({ title, age }: { title: string; age: string | null }) {
  const [lit, setLit] = useState(true);
  const blownRef = useRef(false);
  const candles = age ? age.split("") : ["", "", ""];

  const blow = useCallback(() => {
    if (blownRef.current) return;
    blownRef.current = true;
    setLit(false);
    setTimeout(celebrate, 400);
  }, []);
  const mic = useBlowDetector(blow);

  useEffect(() => () => void confetti.reset(), []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 pt-16 pb-10 text-center">
      <motion.h2
        className="font-script text-5xl leading-tight text-rose-50 drop-shadow-[0_0_20px_rgba(255,150,190,0.5)]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: lit ? 1 : [1, 1.12, 1] }}
        transition={{ duration: 0.8 }}
      >
        {title}
      </motion.h2>

      <motion.button
        type="button"
        data-interactive
        onClick={() => {
          mic.stop();
          blow();
        }}
        aria-label="Apagar las velas"
        className="relative mt-8 flex flex-col items-center outline-none"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Velas */}
        <div className="relative z-10 -mb-3 flex items-end gap-3">
          {candles.map((digit, i) =>
            digit ? (
              <div key={i} className="relative">
                <Flame lit={lit} />
                <span className="block bg-[repeating-linear-gradient(135deg,#fff_0_8px,#ff8fb1_8px_16px)] bg-clip-text font-serif text-8xl leading-none font-bold text-transparent [-webkit-text-stroke:2px_#fff0f5]">
                  {digit}
                </span>
              </div>
            ) : (
              <div
                key={i}
                className="relative h-16 w-3.5 rounded-sm bg-[repeating-linear-gradient(135deg,#fff_0_6px,#ff8fb1_6px_12px)]"
              >
                <Flame lit={lit} />
              </div>
            ),
          )}
        </div>

        {/* Pastel */}
        <svg viewBox="0 0 260 170" className="w-64" aria-hidden>
          <ellipse cx="130" cy="158" rx="125" ry="10" fill="#f5e6ee" opacity="0.9" />
          <rect x="22" y="78" width="216" height="78" rx="14" fill="#f9a8c4" />
          <path d="M22 92 q0 -14 14 -14 h188 q14 0 14 14 v6 q-9 14 -18 0 q-9 16 -20 0 q-10 18 -22 0 q-10 14 -21 0 q-11 18 -22 0 q-10 14 -21 0 q-11 18 -22 0 q-10 14 -21 0 q-10 16 -20 0 q-9 14 -18 0 z" fill="#fff4f8" />
          <rect x="52" y="22" width="156" height="60" rx="12" fill="#f472a6" />
          <path d="M52 34 q0 -12 12 -12 h132 q12 0 12 12 v4 q-8 12 -16 0 q-9 14 -19 0 q-10 16 -21 0 q-10 12 -20 0 q-10 16 -21 0 q-9 12 -19 0 q-8 14 -16 0 z" fill="#fff4f8" />
          {[[70, 60], [100, 68], [135, 58], [165, 66], [190, 56], [45, 125], [80, 135], [118, 122], [150, 138], [185, 126], [215, 134]].map(
            ([x, y], i) => (
              <text key={i} x={x} y={y} fontSize="12" fill={i % 2 ? "#fff" : "#be185d"} textAnchor="middle">
                ♥
              </text>
            ),
          )}
        </svg>
      </motion.button>

      <div className="min-h-16" data-interactive>
        <AnimatePresence mode="wait">
          {lit ? (
            <motion.div key="hint" className="flex flex-col items-center gap-3" exit={{ opacity: 0 }}>
              <p className="font-serif text-rose-100/90">Pide un deseo y toca las velas ✨</p>
              {mic.state !== "denied" && (
                <button
                  type="button"
                  onClick={mic.start}
                  disabled={mic.state === "listening"}
                  className="rounded-full bg-white/10 px-4 py-2 font-serif text-sm text-rose-50 ring-1 ring-white/25 backdrop-blur disabled:opacity-80"
                >
                  {mic.state === "listening" ? "🎤 Sopla fuerte…" : "🎤 O sopla al micrófono"}
                </button>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="done"
              className="font-script text-3xl text-rose-50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              ¡Deseo concedido! ✨
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
