"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { reorder } from "@/lib/reorder";
import { getCurrentPoll, getPollGroups } from "@/lib/poll";

function revalidateAll() {
  revalidatePath("/admin/grupos");
  revalidatePath("/admin/regalos");
  revalidatePath("/admin/votos");
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const poll = await getCurrentPoll();
  const last = await prisma.giftGroup.findFirst({
    where: { pollId: poll.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.giftGroup.create({
    data: { pollId: poll.id, name, position: (last?.position ?? -1) + 1 },
  });
  revalidateAll();
}

export async function renameGroup(groupId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.giftGroup.update({ where: { id: groupId }, data: { name } });
  revalidateAll();
}

export async function deleteGroup(groupId: string) {
  await requireAdmin();
  // Solo se borran grupos vacíos (los regalos hay que moverlos antes) y siempre queda uno.
  const group = await prisma.giftGroup.findUniqueOrThrow({ where: { id: groupId } });
  const [gifts, groups] = await Promise.all([
    prisma.gift.count({ where: { groupId } }),
    prisma.giftGroup.count({ where: { pollId: group.pollId } }),
  ]);
  if (gifts > 0 || groups <= 1) return;
  await prisma.giftGroup.delete({ where: { id: groupId } });
  revalidateAll();
}

export async function moveGroup(groupId: string, direction: -1 | 1) {
  await requireAdmin();
  const group = await prisma.giftGroup.findUniqueOrThrow({ where: { id: groupId } });
  const groups = await getPollGroups(group.pollId);
  const ordered = reorder(groups, groupId, direction);
  if (!ordered) return;

  await prisma.$transaction(
    ordered.map((g, position) =>
      prisma.giftGroup.update({ where: { id: g.id }, data: { position } }),
    ),
  );
  revalidateAll();
}
