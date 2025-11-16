// ⬇️ BLOCCO MODALE UNIVERSALE 1.0
"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
  size = "md", // "md" | "xl"
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "xl";
}) {
  // chiusura con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl p-5 ${
          size === "xl"
            ? "w-[90vw] h-[90vh]"
            : "w-[420px] max-h-[80vh]"
        } overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottone chiudi */}
        <div className="flex justify-end mb-3">
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
// ⬆️ FINE BLOCCO MODALE UNIVERSALE 1.0
