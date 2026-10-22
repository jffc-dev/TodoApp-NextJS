import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getCurrentPoll } from "@/lib/poll";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-accent" aria-label={`${value} de 5`}>
      {"★".repeat(value)}
      <span className="text-border">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default async function VotesPage() {
  await requireAdmin();
  const poll = await getCurrentPoll();

  const gifts = await prisma.gift.findMany({
    where: { pollId: poll.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      votes: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          stars: true,
          comment: true,
          updatedAt: true,
          voter: { select: { name: true, token: true } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Votos</h1>

      {gifts.length === 0 && <p className="py-10 text-center text-muted">Todavía no hay regalos.</p>}

      {gifts.map((gift) => (
        <section key={gift.id} className="rounded-xl border border-border bg-card">
          <h2 className="flex items-baseline justify-between gap-2 border-b border-border p-3 font-medium">
            <span className={gift.isActive ? "" : "text-muted line-through"}>{gift.name}</span>
            <span className="text-sm font-normal text-muted">{gift.votes.length} votos</span>
          </h2>
          {gift.votes.length === 0 ? (
            <p className="p-3 text-sm text-muted">Sin votos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {gift.votes.map((vote) => (
                <li key={vote.id} className="flex flex-col gap-1 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {vote.voter.name ?? (
                        <span className="font-mono text-muted">{vote.voter.token}</span>
                      )}
                    </span>
                    <Stars value={vote.stars} />
                  </div>
                  {vote.comment && <p className="whitespace-pre-line text-muted">“{vote.comment}”</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
