import { timingSafeEqual } from "node:crypto";
import { imageUrl } from "@/lib/images";

// Contenido del saludo de cumpleaños. Todo sale de env vars (solo servidor, sin NEXT_PUBLIC_),
// así el texto y las fotos nunca quedan en el código ni en el bundle del cliente.

export type BirthdayMedia = { src: string; optimize: boolean; video: boolean };

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

export type BirthdayContent = {
  to: string | null;
  title: string;
  cards: { text: string; photo: BirthdayMedia | null }[];
  song: string | null;
  songTitle: string | null;
  age: string | null;
  moonPhrase: string | null;
  coupon: string | null;
  signature: string | null;
};

const CARD_SEPARATOR = "||";

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

// Acepta una key de R2 ("cumple/01.jpg") o una URL completa.
function media(value: string | null): BirthdayMedia | null {
  if (!value) return null;
  const r2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const video = VIDEO_EXT.test(value.split("?")[0]);
  if (!/^https?:\/\//.test(value)) {
    // Codifica cada segmento para que funcionen nombres con espacios o acentos.
    const key = value.split("/").map(encodeURIComponent).join("/");
    return { src: imageUrl(key), optimize: !!r2, video };
  }
  // next/image solo puede optimizar dominios declarados en next.config (el bucket de R2).
  return { src: value, optimize: !!r2 && value.startsWith(`${r2}/`), video };
}

function sameKey(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function getBirthday(key: string): BirthdayContent | null {
  const expected = env("BIRTHDAY_ACCESS_KEY");
  const message = env("BIRTHDAY_MESSAGE");
  if (!expected || !message || !sameKey(key, expected)) return null;

  // Las fotos van por posición: la 1ª foto es de la 1ª tarjeta. Una entrada vacía = tarjeta sin foto.
  const photos = (env("BIRTHDAY_PHOTOS") ?? "").split(",").map((p) => p.trim());
  const cards = message
    .split(CARD_SEPARATOR)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, i) => ({ text, photo: media(photos[i] || null) }));

  return {
    to: env("BIRTHDAY_TO"),
    title: env("BIRTHDAY_TITLE") ?? "",
    cards,
    song: media(env("BIRTHDAY_SONG"))?.src ?? null,
    songTitle: env("BIRTHDAY_SONG_TITLE"),
    age: env("BIRTHDAY_AGE")?.replace(/\D/g, "") || null,
    moonPhrase: env("BIRTHDAY_MOON_PHRASE"),
    coupon: env("BIRTHDAY_COUPON"),
    signature: env("BIRTHDAY_SIGNATURE"),
  };
}
