import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBirthday } from "@/lib/birthday";
import { BirthdayStories } from "@/components/birthday/birthday-stories";

type Props = { params: Promise<{ clave: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clave } = await params;
  const birthday = getBirthday(clave);
  return { title: birthday?.title || "💌" };
}

export default async function CumplePage({ params }: Props) {
  const { clave } = await params;
  const birthday = getBirthday(clave);
  if (!birthday) notFound();

  return <BirthdayStories content={birthday} />;
}
