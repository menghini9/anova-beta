"use client";
// ======================================================
// ChatMessages — ChatGPT-like layout
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
    <section className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-white/35 text-sm">Nessun messaggio.</div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.sender === "user";
            return (
              <div key={m.id ?? idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border",
                    isUser
                      ? "bg-white/10 border-white/10 text-white"
                      : "bg-black/30 border-white/10 text-white/90",
                  ].join(" ")}
                >
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
