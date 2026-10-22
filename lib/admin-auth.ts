import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Falta ADMIN_SESSION_SECRET");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  // Se comparan hashes para que ambos buffers tengan el mismo largo.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkAdminPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Falta ADMIN_PASSWORD");
  return safeEqual(input, expected);
}

// Valor de la cookie: "<expiración>.<firma>"
export function createAdminSessionValue() {
  const expires = String(Date.now() + ADMIN_SESSION_MAX_AGE * 1000);
  return `${expires}.${sign(expires)}`;
}

function isValidSession(value: string | undefined) {
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export async function isAdmin() {
  return isValidSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

// Llamar al inicio de cada página y server action del admin.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
