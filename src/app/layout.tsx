// ⬇️ BLOCCO LAYOUT — versione definitiva (tema nero, fullscreen, metadata attivi)
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
        {/* 🔹 Client Wrapper gestisce usePathname e logiche client */}
        <ClientWrapper>{children}</ClientWrapper>

        {/* 🔹 Footer sottile (versione privata) */}
        <footer className="text-center text-neutral-600 text-xs py-4 border-t border-neutral-900">
          © 2025 Anova β — ambiente operativo privato v0.1
        </footer>
      </body>
    </html>
  );
}
// ⬆️ FINE BLOCCO LAYOUT
