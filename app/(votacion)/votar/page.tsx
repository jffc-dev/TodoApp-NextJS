import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { getCurrentVoter } from "@/lib/voter";
import { VotingBoard, type VotingGroup } from "@/components/voting-board";

export const metadata: Metadata = { title: "Votar · Votación de regalos" };

export default async function VotarPage({
  searchParams,
}: {
  searchParams: Promise<{ invalido?: string }>;
}) {
  const { invalido } = await searchParams;
  const voter = invalido ? null : await getCurrentVoter();

  if (!voter) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-5xl" aria-hidden>
          🎁
        </span>
        <h1 className="text-xl font-semibold">Votación de regalos</h1>
        <p className="max-w-xs text-muted">
          {invalido
            ? "Este link de invitación no es válido. Pide uno nuevo a quien te lo envió."
            : "Para votar necesitas abrir tu link de invitación."}
        </p>
      </main>
    );
  }

  const groups = await prisma.giftGroup.findMany({
    where: { pollId: voter.pollId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      gifts: {
        where: { isActive: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          link: true,
          images: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: { id: true, r2Key: true, width: true, height: true },
          },
          votes: {
            where: { voterId: voter.id },
            select: { stars: true, comment: true },
          },
        },
      },
    },
  });

  // Los grupos sin regalos visibles no se muestran.
  const data: VotingGroup[] = groups
    .filter((group) => group.gifts.length > 0)
    .map((group) => ({
      id: group.id,
      name: group.name,
      gifts: group.gifts.map((gift) => ({
        id: gift.id,
        name: gift.name,
        description: gift.description,
        link: gift.link,
        images: gift.images.map((img) => ({
          id: img.id,
          src: imageUrl(img.r2Key),
          width: img.width,
          height: img.height,
        })),
        stars: gift.votes[0]?.stars ?? 0,
        comment: gift.votes[0]?.comment ?? "",
      })),
    }));

  return <VotingBoard pollName={voter.poll.name} isOpen={voter.poll.isOpen} groups={data} />;
}
