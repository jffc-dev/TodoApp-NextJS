"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ALLOWED_IMAGE_TYPES } from "@/lib/images";
import {
  createImageUpload,
  deleteImage,
  importImageFromUrl,
  moveImage,
  registerImage,
} from "./actions";

type AdminImage = { id: string; src: string };

// Lee las dimensiones en el navegador para guardarlas junto a la imagen.
async function readDimensions(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

export function ImageManager({ giftId, images }: { giftId: string; images: AdminImage[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [urlText, setUrlText] = useState("");
  const [pending, startTransition] = useTransition();

  async function upload(files: FileList) {
    setUploading(true);
    setErrors([]);
    const failed: string[] = [];

    for (const [i, file] of Array.from(files).entries()) {
      setStatus(`Subiendo ${i + 1} de ${files.length}…`);
      try {
        const upload = await createImageUpload(giftId, file.type, file.size);
        if (!upload.ok) {
          failed.push(`${file.name}: ${upload.error}`);
          continue;
        }
        // Subida directa del navegador a R2 con la URL firmada.
        const res = await fetch(upload.url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        if (!res.ok) throw new Error(`R2 respondió ${res.status}`);

        const { width, height } = await readDimensions(file);
        await registerImage({ giftId, key: upload.key, contentType: file.type, width, height });
      } catch (e) {
        failed.push(`${file.name}: ${e instanceof Error ? e.message : "error al subir"}`);
      }
    }

    setErrors(failed);
    setStatus(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function importUrls() {
    // Se aceptan varias URLs separadas por espacios o saltos de línea.
    const urls = urlText.split(/\s+/).filter(Boolean);
    if (urls.length === 0) return;
    setUploading(true);
    setErrors([]);
    const failed: string[] = [];
    const remaining: string[] = [];

    for (const [i, url] of urls.entries()) {
      setStatus(`Importando ${i + 1} de ${urls.length}…`);
      try {
        const result = await importImageFromUrl(giftId, url);
        if (!result.ok) {
          failed.push(`${url}: ${result.error}`);
          remaining.push(url);
        }
      } catch {
        failed.push(`${url}: error al importar`);
        remaining.push(url);
      }
    }

    // Quedan en el campo solo las que fallaron, para reintentar o corregir.
    setUrlText(remaining.join("\n"));
    setErrors(failed);
    setStatus(null);
    setUploading(false);
  }

  const busy = uploading || pending;

  return (
    <div className="flex flex-col gap-3">
      {images.length === 0 ? (
        <p className="text-sm text-muted">Este regalo todavía no tiene imágenes.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-border/40"
            >
              <Image src={img.src} alt="" fill sizes="200px" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-1 text-white">
                <button
                  type="button"
                  disabled={busy || i === 0}
                  onClick={() => startTransition(() => moveImage(img.id, -1))}
                  className="rounded px-2 disabled:opacity-30"
                  aria-label="Mover a la izquierda"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("¿Quitar esta imagen?")) startTransition(() => deleteImage(img.id));
                  }}
                  className="rounded px-2 text-xs"
                >
                  Quitar
                </button>
                <button
                  type="button"
                  disabled={busy || i === images.length - 1}
                  onClick={() => startTransition(() => moveImage(img.id, 1))}
                  className="rounded px-2 disabled:opacity-30"
                  aria-label="Mover a la derecha"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="btn-ghost"
        >
          + Agregar imágenes
        </button>
        {status && <span className="text-sm text-muted">{status}</span>}
      </div>
      <div className="flex gap-2">
        <textarea
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          rows={1}
          placeholder="…o pega URLs de imágenes (una por línea)"
          className="input min-h-10 flex-1 resize-y text-sm"
        />
        <button
          type="button"
          disabled={busy || !urlText.trim()}
          onClick={importUrls}
          className="btn-ghost self-start"
        >
          Importar
        </button>
      </div>
      {errors.map((err) => (
        <p key={err} className="text-sm text-danger">
          {err}
        </p>
      ))}
    </div>
  );
}
