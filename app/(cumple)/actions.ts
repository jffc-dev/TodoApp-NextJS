"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BIRTHDAY_COOKIE,
  BIRTHDAY_SESSION_MAX_AGE,
  checkBirthdayPassword,
  createBirthdaySessionValue,
} from "@/lib/birthday";

export async function unlock(_prev: string | null, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkBirthdayPassword(password)) {
    // Una pausa corta para que probar contraseñas a la fuerza no sea instantáneo.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return "Esa no es… inténtalo otra vez 💙";
  }

  (await cookies()).set(BIRTHDAY_COOKIE, createBirthdaySessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BIRTHDAY_SESSION_MAX_AGE,
  });
  redirect("/");
}
