import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin · Votación de regalos" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin/regalos");

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <h1 className="mb-4 text-xl font-semibold">Administración</h1>
        <LoginForm />
      </div>
    </main>
  );
}
