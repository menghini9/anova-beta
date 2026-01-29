"use client";

import { useMemo, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;

  // dalla API
  memoryState: any | null;
  memoryMeta: any | null;
  providerPacketPreview: any | null;

  // azione: salva edit
  onSaveMemoryPacket: (packet: any, note?: string) => void;
};

export default function MemoryPanel({
  open,
  onClose,
  memoryState,
  memoryMeta,
  providerPacketPreview,
  onSaveMemoryPacket,
}: Props) {
  const [tab, setTab] = useState<"memory" | "packet" | "provider">("memory");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const memoryPacket = memoryState?.compressedMemory ?? null;

  const prettyPacket = useMemo(() => {
    try {
      return memoryPacket ? JSON.stringify(memoryPacket, null, 2) : "";
    } catch {
      return "";
    }
  }, [memoryPacket]);

  // quando apri editing, carica snapshot
  function startEdit() {
    setDraft(prettyPacket || "{}");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  function saveEdit() {
    try {
      const parsed = JSON.parse(draft || "{}");
      onSaveMemoryPacket(parsed, "User edit");
      setEditing(false);
    } catch {
      alert("JSON non valido. Correggi prima di salvare.");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onMouseDown={onClose}
    >
      <div
        className="absolute right-0 top-0 h-full w-[520px] bg-black border-l border-white/10 p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Memory</div>
          <button
            className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/15"
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            className={`text-xs px-3 py-1 rounded ${
              tab === "memory" ? "bg-white/15" : "bg-white/5"
            }`}
            onClick={() => setTab("memory")}
          >
            Stato
          </button>
          <button
            className={`text-xs px-3 py-1 rounded ${
              tab === "packet" ? "bg-white/15" : "bg-white/5"
            }`}
            onClick={() => setTab("packet")}
          >
            Packet
          </button>
          <button
            className={`text-xs px-3 py-1 rounded ${
              tab === "provider" ? "bg-white/15" : "bg-white/5"
            }`}
            onClick={() => setTab("provider")}
          >
            Provider
          </button>
        </div>

        {/* Content */}
        {tab === "memory" && (
          <div className="text-xs text-white/80 space-y-2">
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <div className="text-white/60">memoryVersion</div>
              <div>{String(memoryState?.memoryVersion ?? 0)}</div>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <div className="text-white/60">approxContextTokens</div>
              <div>{String(memoryMeta?.approxContextTokens ?? 0)}</div>
            </div>
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <div className="text-white/60">pendingCompression</div>
              <div>{String(Boolean(memoryState?.pendingCompression))}</div>
            </div>
          </div>
        )}

        {tab === "packet" && (
          <div className="text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/60">compressedMemory</div>
              {!editing ? (
                <button
                  className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                  onClick={startEdit}
                >
                  Modifica
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                    onClick={cancelEdit}
                  >
                    Annulla
                  </button>
                  <button
                    className="text-xs px-3 py-1 rounded bg-white/20 hover:bg-white/25"
                    onClick={saveEdit}
                  >
                    Salva
                  </button>
                </div>
              )}
            </div>

            <textarea
              className="w-full h-[70vh] p-3 rounded bg-white/5 border border-white/10 text-white/90 font-mono"
              value={editing ? draft : prettyPacket}
              onChange={(e) => setDraft(e.target.value)}
              readOnly={!editing}
            />
          </div>
        )}

        {tab === "provider" && (
          <textarea
            className="w-full h-[80vh] p-3 rounded bg-white/5 border border-white/10 text-white/90 font-mono text-xs"
            readOnly
            value={JSON.stringify(providerPacketPreview ?? {}, null, 2)}
          />
        )}
      </div>
    </div>
  );
}
