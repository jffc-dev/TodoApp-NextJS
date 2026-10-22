import { prisma } from "@/lib/db";

// Hoy hay una sola votación: la más reciente. Si no existe, se crea.
export async function getCurrentPoll() {
  const poll = await prisma.poll.findFirst({ orderBy: { createdAt: "desc" } });
  if (poll) return poll;
  return prisma.poll.create({
    data: { name: "Votación de regalos", groups: { create: { name: "General" } } },
  });
}

// Grupos de la votación en orden. Siempre hay al menos uno.
export async function getPollGroups(pollId: string) {
  const groups = await prisma.giftGroup.findMany({
    where: { pollId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  if (groups.length > 0) return groups;
  return [await prisma.giftGroup.create({ data: { pollId, name: "General" } })];
}
