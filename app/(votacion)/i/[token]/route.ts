import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { VOTER_COOKIE } from "@/lib/voter";

// Link de invitación: guarda el token en una cookie y manda a votar.
// Volver a abrir el mismo link (otro dispositivo, cookie borrada) retoma la votación.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const voter = await prisma.voter.findUnique({ where: { token }, select: { id: true } });

  if (!voter) {
    return NextResponse.redirect(new URL("/?invalido=1", request.url));
  }

  const response = NextResponse.redirect(new URL("/votar", request.url));
  response.cookies.set(VOTER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400, // máximo que permiten los navegadores
  });
  return response;
}
