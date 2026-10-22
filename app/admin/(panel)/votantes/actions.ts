"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getCurrentPoll } from "@/lib/poll";
import { generateToken } from "@/lib/tokens";

const MAX_PER_BATCH = 50;

export async function createVoters(formData: FormData) {
  await requireAdmin();
  const quantity = Math.min(Math.max(Number(formData.get("quantity")) || 1, 1), MAX_PER_BATCH);
  const name = String(formData.get("name") ?? "").trim() || null;
  const poll = await getCurrentPoll();

  for (let i = 0; i < quantity; i++) {
    const label = name && quantity > 1 ? `${name} ${i + 1}` : name;
    // Reintenta en el caso (muy improbable) de que el token ya exista.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.voter.create({ data: { pollId: poll.id, token: generateToken(), name: label } });
        break;
      } catch (e) {
        const duplicate = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
        if (!duplicate || attempt === 2) throw e;
      }
    }
  }
  revalidatePath("/admin/votantes");
}

export async function renameVoter(voterId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim() || null;
  await prisma.voter.update({ where: { id: voterId }, data: { name } });
  revalidatePath("/admin/votantes");
  revalidatePath("/admin/votos");
}

export async function deleteVoter(voterId: string) {
  await requireAdmin();
  // Borra también sus votos (cascada) y el link deja de funcionar.
  await prisma.voter.delete({ where: { id: voterId } });
  revalidatePath("/admin/votantes");
  revalidatePath("/admin/votos");
}
