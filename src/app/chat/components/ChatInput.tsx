"use client";
// ======================================================
// ChatInput — ChatGPT-like (Bigger + Brighter)
// Path: src/app/chat/components/ChatInput.tsx
// ======================================================

import type { FormEvent } from "react";

type Props = {
  input: string;
  setInput: (v: string) => void;
  onSend: (e: FormEvent) => void;
  disabled?: boolean;
};

export default function ChatInput({ input, setInput, onSend, disabled }: Props) {
  const canSend = !disabled && input.trim().length > 0;

  return (
    <div className="sticky bottom-0 border-t border-white/10 bg-black/75 backdrop-blur">
      <form onSubmit={onSend} className="mx-auto w-full max-w-6xl px-8 py-5">
        <div className="flex items-end gap-3 rounded-3xl border border-white/20 bg-black/45 px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          {/* Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi un messaggio…"
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent px-2 py-3 text-[15px] leading-relaxed text-white placeholder-white/35 outline-none"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          />

          {/* Send */}
          <button
            type="submit"
            disabled={!canSend}
            className="h-[52px] px-6 rounded-2xl border border-white/25 bg-white/12 text-[15px] font-semibold text-white hover:bg-white/18 hover:border-white/40 disabled:opacity-40 disabled:hover:bg-white/12 disabled:hover:border-white/25 transition"
            title={canSend ? "Invia" : "Scrivi qualcosa per inviare"}
          >
            Invia
          </button>
        </div>

        <div className="mt-3 text-[12px] text-white/50 px-2">
          Invio = Enter · A capo = Shift+Enter
        </div>
      </form>

      {/* Hide scrollbar (webkit) */}
      <style jsx>{`
        textarea::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
