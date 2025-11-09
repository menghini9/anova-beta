// ⬇️ BLOCCO CLIENT WRAPPER — abilita usePathname senza rompere il layout
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    console.log("📍 Path attuale:", pathname);
  }, [pathname]);

  return <>{children}</>;
}
// ⬆️ FINE BLOCCO CLIENT WRAPPER
