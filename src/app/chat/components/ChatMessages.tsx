"use client";
// ======================================================
// ChatMessages — ChatGPT-like layout (User bubble + Assistant free)
// Path: src/app/chat/components/ChatMessages.tsx
// ======================================================

import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/chat/types";

export default function ChatMessagesView({
  messages,
  bottomRef,
}: {
  messages: ChatMessage[];
  bottomRef: RefObject<HTMLDivElement>;
}) {
  return (
    // Nota: lo scroll è gestito in ChatShell, qui solo layout
    <section className="w-full">
      <div className="w-full px-2 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="text-white/35 text-sm">Nessun messaggio.</div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.sender === "user";

            // USER: bubble a destra
            if (isUser) {
              return (
                <div key={m.id ?? idx} className="w-full flex justify-end">
                  <div className="max-w-[72%] rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-[14px] leading-relaxed text-white whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
              );
            }

            // ASSISTANT/PROVIDER: testo libero (no riquadro) come ChatGPT
            return (
              <div key={m.id ?? idx} className="w-full">
                <div className="text-[14px] leading-relaxed text-white/90 whitespace-pre-wrap">
                  {m.text}
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>
    </section>
  );
}
