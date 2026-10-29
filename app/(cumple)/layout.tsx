import type { Viewport } from "next";
import { Dancing_Script, Lora } from "next/font/google";

const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

export const viewport: Viewport = {
  themeColor: "#2a0a18",
  viewportFit: "cover",
};

export default function CumpleLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${dancing.variable} ${lora.variable} contents`}>{children}</div>;
}
