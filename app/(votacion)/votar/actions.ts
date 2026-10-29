"use server";

import { prisma } from "@/lib/db";
import { getCurrentVoter } from "@/lib/voter";

type Result = { ok: true } | { ok: false; error: string };

const MAX_COMMENT = 500;

// Valida que el votante exista, la votación esté abierta y el regalo sea votable.
type Authorized = { error: string } | { voter: NonNullable<Awaited<ReturnType<typeof getCurrentVoter>>> };

async function authorize(giftId: string): Promise<Authorized> {
  const voter = await getCurrentVoter();
  if (!voter) return { error: "Tu sesión expiró. Vuelve a abrir tu link." };
  if (!voter.poll.isOpen) return { error: "La votación está cerrada." };

  const gift = await prisma.gift.findFirst({
    where: { id: giftId, pollId: voter.pollId, isActive: true },
    select: { id: true },
  });
  if (!gift) return { error: "Este regalo ya no está disponible." };

  return { voter };
}

export async function saveVote(giftId: string, stars: number): Promise<Result> {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { ok: false, error: "Puntaje inválido." };
  }
  const auth = await authorize(giftId);
  if ("error" in auth) return { ok: false, error: auth.error };

  await prisma.vote.upsert({
    where: { giftId_voterId: { giftId, voterId: auth.voter.id } },
    create: { giftId, voterId: auth.voter.id, stars },
    update: { stars },
  });
  return { ok: true };
}

export async function saveComment(giftId: string, comment: string): Promise<Result> {
  const text = comment.trim().slice(0, MAX_COMMENT);
  const auth = await authorize(giftId);
  if ("error" in auth) return { ok: false, error: auth.error };

  // El comentario acompaña a un voto: primero hay que calificar.
  const { count } = await prisma.vote.updateMany({
    where: { giftId, voterId: auth.voter.id },
    data: { comment: text || null },
  });
  if (count === 0) return { ok: false, error: "Primero califica el regalo." };
  return { ok: true };
}
