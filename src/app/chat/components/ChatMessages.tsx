"use client";

import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/chat/types";

type Props = {
  messages: ChatMessage[];
  bottomRef: RefObject<HTMLDivElement | null>;
};

export default function ChatMessagesView({ messages, bottomRef }: Props) {
  return (
    <div className="flex-1 overflow-y-auto bg-black px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {messages.length === 0 ? (
          <div className="text-sm text-white/40">Nessun messaggio.</div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.sender === "user";
            return (
              <div key={m.id ?? idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[780px] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                    isUser
                      ? "bg-white/10 border-white/15 text-white"
                      : "bg-neutral-950 border-white/10 text-white/90"
                  }`}
                >
                  <div className="text-[11px] mb-1 text-white/40">
                    {isUser ? "Tu" : "Anova"}
                  </div>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
