import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Votación de regalos",
  description: "Vota por tus regalos favoritos",
};

export default function VotacionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
