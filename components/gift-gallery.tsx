"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";

export type GalleryImage = {
  id: string;
  src: string;
  width: number | null;
  height: number | null;
};

// Anchos válidos para el optimizador de next/image (deviceSizes por defecto).
const LIGHTBOX_WIDTHS = [640, 1080, 1920, 3840];

function optimized(src: string, width: number) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

export function GiftGallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  const closeLightbox = useCallback(() => {
    // Al cerrar, deja el carrusel en la última imagen vista.
    if (lightboxIndex >= 0) emblaApi?.scrollTo(lightboxIndex, true);
    setLightboxIndex(-1);
  }, [emblaApi, lightboxIndex]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-border/40 text-4xl">
        🎁
      </div>
    );
  }

  const slides = images.map((img) => {
    const width = img.width ?? 1600;
    const height = img.height ?? 1600;
    return {
      src: optimized(img.src, 1920),
      width,
      height,
      srcSet: LIGHTBOX_WIDTHS.filter((w) => w <= width * 1.5).map((w) => ({
        src: optimized(img.src, w),
        width: w,
        height: Math.round((height / width) * w),
      })),
    };
  });

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-square min-w-0 flex-[0_0_100%] cursor-zoom-in bg-border/40"
              aria-label={`Ver imagen ${i + 1} de ${images.length} en pantalla completa`}
            >
              <Image
                src={img.src}
                alt={`${alt} — imagen ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
            {selected + 1}/{images.length}
          </span>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        index={Math.max(lightboxIndex, 0)}
        close={closeLightbox}
        slides={slides}
        plugins={images.length > 1 ? [Zoom, Counter] : [Zoom]}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
        carousel={{ finite: true }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        zoom={{ maxZoomPixelRatio: 3 }}
        render={
          images.length > 1 ? undefined : { buttonPrev: () => null, buttonNext: () => null }
        }
      />
    </div>
  );
}
