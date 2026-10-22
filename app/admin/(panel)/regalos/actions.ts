"use server";

import { randomUUID } from "node:crypto";
import { imageSize } from "image-size";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/images";
import { getCurrentPoll } from "@/lib/poll";
import { createPresignedPutUrl, putObject } from "@/lib/r2";

export type GiftFormState = { error: string } | null;

type ParsedGift =
  | { error: string }
  | {
      data: {
        name: string;
        description: string | null;
        price: string | null;
        link: string | null;
        isActive: boolean;
      };
    };

function parseGiftForm(formData: FormData): ParsedGift {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim().replace(",", ".");
  const link = String(formData.get("link") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "El nombre es obligatorio." };
  if (priceRaw && !/^\d{1,8}(\.\d{1,2})?$/.test(priceRaw)) {
    return { error: "Precio inválido (ej: 199.90)." };
  }
  if (link && !/^https?:\/\//i.test(link)) {
    return { error: "El link debe empezar con http:// o https://" };
  }

  return {
    data: {
      name,
      description: description || null,
      price: priceRaw || null,
      link: link || null,
      isActive,
    },
  };
}

export async function createGift(_prev: GiftFormState, formData: FormData): Promise<GiftFormState> {
  await requireAdmin();
  const parsed = parseGiftForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const poll = await getCurrentPoll();
  const last = await prisma.gift.findFirst({
    where: { pollId: poll.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const gift = await prisma.gift.create({
    data: { ...parsed.data, pollId: poll.id, position: (last?.position ?? -1) + 1 },
  });

  revalidatePath("/admin/regalos");
  // Después de crear, se va a la edición para subir imágenes.
  redirect(`/admin/regalos/${gift.id}`);
}

export async function updateGift(
  giftId: string,
  _prev: GiftFormState,
  formData: FormData,
): Promise<GiftFormState> {
  await requireAdmin();
  const parsed = parseGiftForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.gift.update({ where: { id: giftId }, data: parsed.data });
  revalidatePath("/admin/regalos");
  redirect("/admin/regalos");
}

export async function deleteGift(giftId: string) {
  await requireAdmin();
  // Las filas de imágenes se borran en cascada; los archivos quedan en R2.
  await prisma.gift.delete({ where: { id: giftId } });
  revalidatePath("/admin/regalos");
  redirect("/admin/regalos");
}

export async function toggleGift(giftId: string) {
  await requireAdmin();
  const gift = await prisma.gift.findUniqueOrThrow({ where: { id: giftId } });
  await prisma.gift.update({ where: { id: giftId }, data: { isActive: !gift.isActive } });
  revalidatePath("/admin/regalos");
}

// Reescribe las posiciones 0..n-1 moviendo un elemento una posición arriba o abajo.
function reorder<T extends { id: string }>(items: T[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return null;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export async function moveGift(giftId: string, direction: -1 | 1) {
  await requireAdmin();
  const gift = await prisma.gift.findUniqueOrThrow({ where: { id: giftId } });
  const gifts = await prisma.gift.findMany({
    where: { pollId: gift.pollId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const ordered = reorder(gifts, giftId, direction);
  if (!ordered) return;

  await prisma.$transaction(
    ordered.map((g, position) => prisma.gift.update({ where: { id: g.id }, data: { position } })),
  );
  revalidatePath("/admin/regalos");
}

// --- Imágenes ---

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function createImageUpload(giftId: string, contentType: string, size: number) {
  await requireAdmin();
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    return { ok: false as const, error: "Formato no permitido (usa JPG, PNG, WebP o AVIF)." };
  }
  if (size > MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "La imagen supera los 10 MB." };
  }
  await prisma.gift.findUniqueOrThrow({ where: { id: giftId }, select: { id: true } });

  const key = `gifts/${giftId}/${randomUUID()}.${EXTENSIONS[contentType]}`;
  const url = await createPresignedPutUrl(key, contentType);
  return { ok: true as const, key, url };
}

export async function registerImage(input: {
  giftId: string;
  key: string;
  contentType: string;
  width: number | null;
  height: number | null;
}) {
  await requireAdmin();
  // Solo se aceptan keys generadas por createImageUpload para este regalo.
  if (!input.key.startsWith(`gifts/${input.giftId}/`) || !ALLOWED_IMAGE_TYPES.includes(input.contentType)) {
    throw new Error("Imagen inválida");
  }

  await addImageRecord(input);
}

async function addImageRecord(input: {
  giftId: string;
  key: string;
  contentType: string;
  width: number | null;
  height: number | null;
}) {
  const last = await prisma.giftImage.findFirst({
    where: { giftId: input.giftId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.giftImage.create({
    data: {
      giftId: input.giftId,
      r2Key: input.key,
      contentType: input.contentType,
      width: input.width,
      height: input.height,
      position: (last?.position ?? -1) + 1,
    },
  });
  revalidatePath(`/admin/regalos/${input.giftId}`);
  revalidatePath("/admin/regalos");
}

// Formatos que detecta image-size → content type que guardamos.
const DETECTED_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function isPrivateHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(hostname) ||
    hostname.startsWith("[")
  );
}

// Lee la respuesta cortando si supera el máximo permitido.
async function readLimited(res: Response, max: number) {
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

// Descarga una imagen desde una URL externa (ej: la foto de una tienda) y la copia a R2.
export async function importImageFromUrl(
  giftId: string,
  rawUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: "URL inválida." };
  }
  if (!["http:", "https:"].includes(url.protocol) || isPrivateHost(url.hostname)) {
    return { ok: false, error: "Solo se permiten URLs públicas http(s)." };
  }
  await prisma.gift.findUniqueOrThrow({ where: { id: giftId }, select: { id: true } });

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el sitio (timeout o error de red)." };
  }
  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error: "El sitio bloquea descargas automáticas. Guarda la imagen y súbela como archivo.",
    };
  }
  if (!res.ok) return { ok: false, error: `El sitio respondió ${res.status}.` };

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_BYTES) return { ok: false, error: "La imagen supera los 10 MB." };
  const bytes = await readLimited(res, MAX_IMAGE_BYTES);
  if (!bytes) return { ok: false, error: "La imagen supera los 10 MB." };

  // Se confía en los bytes, no en el Content-Type que declara el sitio.
  let size: { width?: number; height?: number; type?: string };
  try {
    size = imageSize(bytes);
  } catch {
    return { ok: false, error: "La URL no devolvió una imagen (¿es el link de la página y no de la foto?)." };
  }
  const contentType = size.type ? DETECTED_TYPES[size.type] : undefined;
  if (!contentType) {
    return { ok: false, error: "Formato no permitido (usa JPG, PNG, WebP o AVIF)." };
  }

  const key = `gifts/${giftId}/${randomUUID()}.${EXTENSIONS[contentType]}`;
  try {
    await putObject(key, bytes, contentType);
  } catch {
    return { ok: false, error: "No se pudo guardar la imagen en R2. Revisa las credenciales." };
  }
  await addImageRecord({
    giftId,
    key,
    contentType,
    width: size.width ?? null,
    height: size.height ?? null,
  });
  return { ok: true };
}

export async function deleteImage(imageId: string) {
  await requireAdmin();
  // Solo se borra el registro; el archivo queda en R2.
  const image = await prisma.giftImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/regalos/${image.giftId}`);
  revalidatePath("/admin/regalos");
}

export async function moveImage(imageId: string, direction: -1 | 1) {
  await requireAdmin();
  const image = await prisma.giftImage.findUniqueOrThrow({ where: { id: imageId } });
  const images = await prisma.giftImage.findMany({
    where: { giftId: image.giftId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const ordered = reorder(images, imageId, direction);
  if (!ordered) return;

  await prisma.$transaction(
    ordered.map((img, position) =>
      prisma.giftImage.update({ where: { id: img.id }, data: { position } }),
    ),
  );
  revalidatePath(`/admin/regalos/${image.giftId}`);
  revalidatePath("/admin/regalos");
}
