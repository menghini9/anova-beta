"use client";

import type { FormEvent } from "react";

type Props = {
  input: string;
  setInput: (v: string) => void;
  onSend: (e: FormEvent) => void | Promise<void>;
  disabled?: boolean;
};

export default function ChatInput({ input, setInput, onSend, disabled }: Props) {
  return (
    <form onSubmit={onSend} className="border-t border-neutral-800 bg-black/80 backdrop-blur px-4 py-4">
      <div className="mx-auto max-w-4xl flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Scrivi un messaggio…"
            className="w-full resize-none rounded-2xl bg-neutral-950 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/25 disabled:opacity-60"
          />
          <div className="mt-2 text-[11px] text-white/30">
            Invio = Enter • A capo = Shift+Enter
          </div>
        </div>

        <button
          disabled={disabled}
          className="shrink-0 rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/90 hover:bg-white/5 disabled:opacity-60"
        >
          Invia
        </button>
      </div>
    </form>
  );
}
