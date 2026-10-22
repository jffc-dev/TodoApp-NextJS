import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { logout } from "../login/actions";

export const metadata: Metadata = { title: "Admin · Votación de regalos" };

const NAV = [
  { href: "/admin/regalos", label: "Regalos" },
  { href: "/admin/votantes", label: "Links" },
  { href: "/admin/votos", label: "Votos" },
  { href: "/admin/votacion", label: "Votación" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Las páginas y actions también lo verifican: el layout no basta por sí solo.
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-border/50"
          >
            {item.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto">
          <button type="submit" className="px-2 py-1.5 text-sm text-muted hover:underline">
            Salir
          </button>
        </form>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
