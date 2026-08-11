import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayúdame | IA simple para negocios",
  description: "Crea agentes de IA y automatizaciones de WhatsApp sin saber programar.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
