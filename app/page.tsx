import { redirect } from "next/navigation";
import { getCurrentVoter } from "@/lib/voter";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ invalido?: string }>;
}) {
  const { invalido } = await searchParams;
  if (!invalido && (await getCurrentVoter())) redirect("/votar");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-5xl" aria-hidden>
        🎁
      </span>
      <h1 className="text-2xl font-semibold">Votación de regalos</h1>
      <p className="max-w-xs text-muted">
        {invalido
          ? "Este link de invitación no es válido. Pide uno nuevo a quien te lo envió."
          : "Para votar necesitas abrir tu link de invitación."}
      </p>
    </main>
  );
}
