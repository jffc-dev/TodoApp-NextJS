import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const VOTER_COOKIE = "voter";

export async function getCurrentVoter() {
  const token = (await cookies()).get(VOTER_COOKIE)?.value;
  if (!token) return null;
  return prisma.voter.findUnique({ where: { token }, include: { poll: true } });
}
