import { prisma } from "@/lib/db";

// Hoy hay una sola votación: la más reciente. Si no existe, se crea.
export async function getCurrentPoll() {
  const poll = await prisma.poll.findFirst({ orderBy: { createdAt: "desc" } });
  if (poll) return poll;
  return prisma.poll.create({ data: { name: "Votación de regalos" } });
}
