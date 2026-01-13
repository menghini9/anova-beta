// Path: src/app/chat/page.tsx
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
<div className="p-6 text-white bg-red-600 rounded-2xl">TAILWIND TEST</div>

import ChatShell from "./ChatShell";

export default function Page() {
  return <ChatShell />;
}
