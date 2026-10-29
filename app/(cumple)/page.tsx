import type { Metadata } from "next";
import { getBirthday, isBirthdayUnlocked } from "@/lib/birthday";
import { BirthdayStories } from "@/components/birthday/birthday-stories";
import { LockScreen } from "@/components/birthday/lock-screen";

export async function generateMetadata(): Promise<Metadata> {
  const title = (await isBirthdayUnlocked()) ? getBirthday()?.title : null;
  return { title: title || "💌" };
}

export default async function CumplePage() {
  // El contenido solo se envía al navegador después de acertar la contraseña.
  const birthday = (await isBirthdayUnlocked()) ? getBirthday() : null;
  if (!birthday) return <LockScreen hint={process.env.BIRTHDAY_PASSWORD_HINT?.trim() || null} />;

  return <BirthdayStories content={birthday} />;
}
