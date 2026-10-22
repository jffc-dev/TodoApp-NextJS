"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  checkAdminPassword,
  createAdminSessionValue,
} from "@/lib/admin-auth";

export async function login(_prev: string | null, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkAdminPassword(password)) return "Contraseña incorrecta.";

  (await cookies()).set(ADMIN_COOKIE, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  redirect("/admin/regalos");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}
