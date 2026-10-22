import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { getCurrentPoll } from "@/lib/poll";
import { moveGift, toggleGift } from "./actions";

export default async function GiftsPage() {
  await requireAdmin();
  const poll = await getCurrentPoll();

  const gifts = await prisma.gift.findMany({
    where: { pollId: poll.id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include: {
      images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }], take: 1 },
      _count: { select: { images: true, votes: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Regalos</h1>
        <Link href="/admin/regalos/nuevo" className="btn-primary">
          + Nuevo
        </Link>
      </div>

      {gifts.length === 0 ? (
        <p className="py-10 text-center text-muted">Todavía no hay regalos.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card">
          {gifts.map((gift, i) => (
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
                    disabled={i === gifts.length - 1}
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
                  <p className={`truncate font-medium ${gift.isActive ? "" : "text-muted line-through"}`}>
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
    </div>
  );
}
