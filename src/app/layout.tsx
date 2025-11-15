// ⬇️ BLOCCO LAYOUT 2.1 — Footer nascosto in /chat (versione client-safe)
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientWrapper from "./ClientWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anova β — Chat",
  description: "Ambiente operativo privato di Anova β, console cognitiva di Luca.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="bg-black text-white">
      <body
        className={`${inter.className} bg-black text-neutral-100 min-h-screen min-w-full overflow-hidden m-0 p-0`}
      >
        {/* Wrapper che decide SE mostrare il footer */}
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
