"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function updatePoll(pollId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const isOpen = formData.get("isOpen") === "on";

  await prisma.poll.update({
    where: { id: pollId },
    data: { isOpen, ...(name ? { name } : {}) },
  });
  revalidatePath("/admin/votacion");
}
