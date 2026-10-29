import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { getCurrentPoll, getPollGroups } from "@/lib/poll";
import { moveGift, toggleGift } from "./actions";

export default async function GiftsPage() {
  await requireAdmin();
  const poll = await getCurrentPoll();
  await getPollGroups(poll.id); // garantiza que exista al menos un grupo

  const groups = await prisma.giftGroup.findMany({
    where: { pollId: poll.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      gifts: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: {
          images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], take: 1 },
          _count: { select: { images: true, votes: true } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Regalos</h1>
        <div className="flex gap-2">
          <Link href="/admin/grupos" className="btn-ghost">
            Grupos
          </Link>
          <Link href="/admin/regalos/nuevo" className="btn-primary">
            + Nuevo
          </Link>
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {group.name} · {group.gifts.length}
            </h2>
            <Link
              href={`/admin/regalos/nuevo?grupo=${group.id}`}
              className="text-sm text-muted hover:underline"
            >
              + Agregar aquí
            </Link>
          </div>

          {group.gifts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
              Sin regalos en este grupo.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
              {group.gifts.map((gift, i) => (
                <li key={gift.id} className="flex items-center gap-3 p-3">
                  <div className="flex flex-col">
                    <form action={moveGift.bind(null, gift.id, -1)}>
                      <button
                        disabled={i === 0}
                        className="px-1 text-muted disabled:opacity-20"
                        aria-label="Subir"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveGift.bind(null, gift.id, 1)}>
                      <button
                        disabled={i === group.gifts.length - 1}
                        className="px-1 text-muted disabled:opacity-20"
                        aria-label="Bajar"
                      >
                        ▼
                      </button>
                    </form>
                  </div>

                  <Link
                    href={`/admin/regalos/${gift.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-border/40">
                      {gift.images[0] ? (
                        <Image
                          src={imageUrl(gift.images[0].r2Key)}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center">🎁</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate font-medium ${gift.isActive ? "" : "text-muted line-through"}`}
                      >
                        {gift.name}
                      </p>
                      <p className="text-xs text-muted">
                        {gift._count.images} img · {gift._count.votes} votos
                        {gift.price && ` · ${gift.price.toFixed(2)}`}
                      </p>
                    </div>
                  </Link>

                  <form action={toggleGift.bind(null, gift.id)}>
                    <button className="btn-ghost px-3 py-1 text-xs">
                      {gift.isActive ? "Ocultar" : "Mostrar"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
