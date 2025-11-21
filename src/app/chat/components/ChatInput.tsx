// ⬇️ BLOCCO 15.3 — ChatInput (barra input)
import type { Dispatch, SetStateAction } from "react";

type Props = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  onSend: (e: React.FormEvent) => void;
};

export default function ChatInput({ input, setInput, onSend }: Props) {
  return (
    <form
      onSubmit={onSend}
      className="flex items-center gap-3 border-t border-neutral-800 px-6 py-4 bg-black"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Scrivi un messaggio..."
        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white"
      />
      <button
        type="submit"
        className="bg-white text-black font-medium px-5 py-2 rounded-lg hover:bg-neutral-200 transition"
      >
        Invia
      </button>
    </form>
  );
}
// ⬆️ FINE BLOCCO 15.3 — ChatInput
