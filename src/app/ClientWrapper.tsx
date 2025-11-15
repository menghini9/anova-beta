"use client";

import { usePathname } from "next/navigation";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideFooter = pathname === "/chat";

  return (
    <>
      {children}

      {!hideFooter && (
        <footer className="text-center text-neutral-600 text-xs py-4 border-t border-neutral-900">
          © 2025 Anova β — ambiente operativo privato v0.1
        </footer>
      )}
    </>
  );
}
