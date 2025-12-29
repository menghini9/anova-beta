// ⬇️ BLOCCO 15.3 — ChatInput (barra input) — GATED
import type { Dispatch, SetStateAction } from "react";

type Props = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  onSend: (e: React.FormEvent) => void;

  // ✅ Gating “industriale”
  disabled?: boolean;
  disabledHint?: string;
  onBlocked?: () => void; // es. mostra toast
};

export default function ChatInput({
  input,
  setInput,
  onSend,
  disabled = false,
  disabledHint = "Input disabilitato.",
  onBlocked,
}: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    if (disabled) {
      e.preventDefault();
      onBlocked?.();
      return;
    }
    onSend(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-t border-neutral-800 px-6 py-4 bg-black"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? disabledHint : "Scrivi un messaggio..."}
        disabled={disabled}
        className={[
          "flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none",
          disabled
            ? "bg-neutral-950 border-neutral-900 text-neutral-600 cursor-not-allowed"
            : "bg-neutral-900 border-neutral-800 text-neutral-100 focus:border-white",
        ].join(" ")}
      />

      <button
        type="submit"
        disabled={disabled}
        className={[
          "font-medium px-5 py-2 rounded-lg transition",
          disabled
            ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
            : "bg-white text-black hover:bg-neutral-200",
        ].join(" ")}
      >
        Invia
      </button>
    </form>
  );
}
// ⬆️ FINE BLOCCO 15.3 — ChatInput
