"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

export function MoonSlide({ phrase }: { phrase: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    import("./moon-scene").then(({ createMoonScene }) => {
      if (cancelled || !sceneRef.current) return;
      dispose = createMoonScene(sceneRef.current, { reducedMotion });
    });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reducedMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-linear-to-b from-[#070314] via-[#1b0b2e] to-[#3a1430]">
      <div ref={sceneRef} className="absolute inset-0" />

      <div className="pointer-events-none relative flex h-full flex-col items-center px-8 pt-24 text-center">
        <motion.p
          className="font-script text-4xl leading-tight text-rose-50 drop-shadow-[0_0_18px_rgba(255,190,210,0.6)]"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 2.2, duration: 1.6, ease: "easeOut" }}
        >
          {phrase}
        </motion.p>
      </div>
    </div>
  );
}
