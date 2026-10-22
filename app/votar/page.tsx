import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { getCurrentVoter } from "@/lib/voter";
import { VotingBoard, type VotingGift } from "@/components/voting-board";

export const metadata: Metadata = { title: "Votar · Votación de regalos" };

export default async function VotarPage() {
  const voter = await getCurrentVoter();

  if (!voter) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-xl font-semibold">Necesitas tu link de invitación</h1>
        <p className="max-w-xs text-muted">Abre el link que te enviaron para poder votar.</p>
      </main>
    );
  }

  const gifts = await prisma.gift.findMany({
    where: { pollId: voter.pollId, isActive: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      link: true,
      images: {
        orderBy: { position: "asc" },
        select: { id: true, r2Key: true, width: true, height: true },
      },
      votes: {
        where: { voterId: voter.id },
        select: { stars: true, comment: true },
      },
    },
  });

  const data: VotingGift[] = gifts.map((gift) => ({
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
  }));

  return <VotingBoard pollName={voter.poll.name} isOpen={voter.poll.isOpen} gifts={data} />;
}
