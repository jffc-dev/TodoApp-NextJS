import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { imageUrl } from "@/lib/images";

// Contenido del saludo de cumpleaños. Todo sale de env vars (solo servidor, sin NEXT_PUBLIC_),
// así el texto y las fotos nunca quedan en el código ni en el bundle del cliente.

export type BirthdayMedia = { src: string; optimize: boolean; video: boolean };

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

export type BirthdayContent = {
  to: string | null;
  title: string;
  cards: { text: string; photo: BirthdayMedia | null; textTop: boolean }[];
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

// ---- Contraseña ----
// Se pide en un input (no en la URL). Al acertar se guarda una cookie con un hash de la
// contraseña: si se cambia BIRTHDAY_PASSWORD, las sesiones anteriores dejan de valer.

export const BIRTHDAY_COOKIE = "bday_session";
export const BIRTHDAY_SESSION_MAX_AGE = 60 * 60 * 24 * 365;

// Sin distinguir mayúsculas ni espacios extra: el teclado del celular suele poner la 1ª en mayúscula.
function normalize(password: string) {
  return password.trim().toLowerCase();
}

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function sessionValue(password: string) {
  return hash(`birthday:${normalize(password)}`).toString("base64url");
}

export function checkBirthdayPassword(input: string) {
  const expected = env("BIRTHDAY_PASSWORD");
  if (!expected) return false;
  return timingSafeEqual(hash(normalize(input)), hash(normalize(expected)));
}

export function createBirthdaySessionValue() {
  return sessionValue(env("BIRTHDAY_PASSWORD") ?? "");
}

export async function isBirthdayUnlocked() {
  const expected = env("BIRTHDAY_PASSWORD");
  const value = (await cookies()).get(BIRTHDAY_COOKIE)?.value;
  if (!expected || !value) return false;
  return timingSafeEqual(hash(value), hash(sessionValue(expected)));
}

// ---- Contenido ----

export function getBirthday(): BirthdayContent | null {
  const message = env("BIRTHDAY_MESSAGE");
  if (!message) return null;

  // Las fotos van por posición: la 1ª foto es de la 1ª tarjeta. Una entrada vacía = tarjeta sin foto.
  const photos = (env("BIRTHDAY_PHOTOS") ?? "").split(",").map((p) => p.trim());
  // Números de tarjeta (desde 1) que llevan el texto arriba en vez de abajo, ej: "7" o "3,7".
  const textTop = new Set((env("BIRTHDAY_TEXT_TOP") ?? "").split(",").map((n) => Number(n.trim())));
  const cards = message
    .split(CARD_SEPARATOR)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, i) => ({ text, photo: media(photos[i] || null), textTop: textTop.has(i + 1) }));

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
