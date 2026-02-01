"use client";
// ======================================================
// ChatMessages — ChatGPT-like layout + Agent badges
// Path: src/app/chat/components/ChatMessages.tsx
// ======================================================

import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/chat/types";

function prettyProvider(p: any) {
  const s = String(p ?? "").toLowerCase().trim();
  if (s === "openai") return "OpenAI";
  if (s === "gemini") return "Gemini";
  if (s === "claude" || s === "anthropic") return "Claude";
  return s ? s : "Provider";
}

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
          messages.map((m: any, idx) => {
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

            // ASSISTANT / AGENT MESSAGE
            const agentId = String(m?.agentId ?? "");
            const agentName = String(m?.agentName ?? "");
            const provider = prettyProvider(m?.agentProvider);
            const model = String(m?.agentModel ?? "").trim();

            const hasAgentMeta = Boolean(agentId);

            return (
              <div key={m.id ?? idx} className="w-full">
                {/* Badge agent (solo se c'è metadata) */}
                {hasAgentMeta && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center h-7 px-3 rounded-full border border-sky-300/25 bg-sky-500/10 text-[12px] text-white/85">
                      {agentName || "Agent"}
                    </span>

                    <span className="inline-flex items-center h-7 px-3 rounded-full border border-white/12 bg-white/5 text-[12px] text-white/70">
                      {provider}
                      {model ? ` • ${model}` : ""}
                    </span>
                  </div>
                )}

                {/* Testo libero stile ChatGPT */}
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
