// Path: src/app/chat/page.tsx

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import ChatPageClient from "./ChatPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-6">Caricamento chat…</div>}>
      <ChatPageClient />
    </Suspense>
  );
}
