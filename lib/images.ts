// Compartido entre servidor y cliente.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export function imageUrl(r2Key: string) {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${r2Key}`;
}
