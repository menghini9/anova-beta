// ⬇️ BLOCCO 15.2 — ChatMessages (lista messaggi)
import type { RefObject } from "react";

type ChatMessage = {
  id?: string;
  sender: "user" | "anova";
  text: string;
};

type Props = {
  messages: ChatMessage[];
  bottomRef: RefObject<HTMLDivElement | null>; // ← FIX TIPI
};

export default function ChatMessages({ messages, bottomRef }: Props) {
  return (
    <section className="flex-1 overflow-y-auto p-6 space-y-4 bg-black">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-neutral-600 text-center">
          Nessun messaggio ancora. Inizia a dialogare con Anova β.
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id ?? Math.random()}
            className={`max-w-2xl mx-auto rounded-xl p-4 ${
              msg.sender === "user"
                ? "bg-neutral-900 border border-neutral-700 text-right"
                : "bg-neutral-800 border border-neutral-700 text-left"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {msg.text}
            </p>
          </div>
        ))
      )}

      {/* ancora più robusto: ref sempre presente */}
      <div ref={bottomRef} />
    </section>
  );
}
// ⬆️ FINE BLOCCO 15.2 — ChatMessages
