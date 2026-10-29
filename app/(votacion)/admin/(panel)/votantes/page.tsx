import { headers } from "next/headers";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getCurrentPoll } from "@/lib/poll";
import { createVoters, deleteVoter, renameVoter } from "./actions";
import { CopyLink } from "./copy-link";

export default async function VotersPage() {
  await requireAdmin();
  const poll = await getCurrentPoll();

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const [voters, activeGifts] = await Promise.all([
    prisma.voter.findMany({
      where: { pollId: poll.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { votes: { where: { gift: { isActive: true } } } } } },
    }),
    prisma.gift.count({ where: { pollId: poll.id, isActive: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Links de votación</h1>

      <form action={createVoters} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-muted">Nombre (opcional)</span>
          <input name="name" placeholder="Ej: Tía Ana" className="input" />
        </label>
        <label className="flex w-20 flex-col gap-1">
          <span className="text-xs text-muted">Cantidad</span>
          <input name="quantity" type="number" min={1} max={50} defaultValue={1} className="input" />
        </label>
        <button type="submit" className="btn-primary">
          Crear
        </button>
      </form>

      {voters.length === 0 ? (
        <p className="py-10 text-center text-muted">Todavía no hay links.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {voters.map((voter) => {
            const url = `${origin}/i/${voter.token}`;
            const done = voter._count.votes;
            return (
              <li key={voter.id} className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <form action={renameVoter.bind(null, voter.id)} className="min-w-0 flex-1">
                    <input
                      name="name"
                      defaultValue={voter.name ?? ""}
                      placeholder="Sin nombre"
                      aria-label="Nombre del votante (Enter para guardar)"
                      className="w-full bg-transparent font-medium outline-none placeholder:text-muted"
                    />
                  </form>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
                    {done}/{activeGifts}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{url}</code>
                  <CopyLink url={url} />
                  <form action={deleteVoter.bind(null, voter.id)}>
                    <ConfirmSubmit
                      message="¿Eliminar este link? Se borran también sus votos."
                      className="px-2 text-xs text-danger"
                    >
                      Eliminar
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
