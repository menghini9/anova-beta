"use client";
// ======================================================
// AgentsOverlay — Full screen agent programming UI
// Path: src/app/chat/components/AgentsOverlay.tsx
// Persistenza: localStorage per sessionId
// ======================================================

import { useEffect, useMemo, useState } from "react";

type AgentProvider = "openai" | "gemini" | "claude";

type Agent = {
  id: string;
  name: string;
  enabled: boolean;
  provider: AgentProvider; // per ora 1 provider
  model: string; // per ora stringa libera
  rules: string;
  createdAt: number;
  updatedAt: number;
};

type Props = {
  open: boolean;
  onClose: () => void;

  sessionId: string | null;

  memoryEnabled: boolean;
  setMemoryEnabled: (v: boolean) => void;

  // ✅ nuova: conferma/applica config alla chat
  onApply: (agents: Agent[]) => void;
};


// --------------------------
// localStorage helpers
// --------------------------
const hasWindow = () => typeof window !== "undefined";
const safeGet = (k: string) => (hasWindow() ? window.localStorage.getItem(k) : null);
const safeSet = (k: string, v: string) => hasWindow() && window.localStorage.setItem(k, v);

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function agentsKey(sessionId: string) {
  return `anova_agents_${sessionId}`;
}

function loadAgents(sessionId: string): Agent[] {
  const raw = safeGet(agentsKey(sessionId));
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Agent[]) : [];
  } catch {
    return [];
  }
}

function saveAgents(sessionId: string, agents: Agent[]) {
  safeSet(agentsKey(sessionId), JSON.stringify(agents));
}

export default function AgentsOverlay({
  open,
  onClose,
  sessionId,
  memoryEnabled,
  setMemoryEnabled,
  onApply,
}: Props) {
function applyAndClose() {
  // NB: agents è già persistito dal tuo useEffect
  onApply(agents);
  onClose();
}

  const [search, setSearch] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
// =========================
// DELETE AGENT — confirm modal
// =========================
const [confirmDelete, setConfirmDelete] = useState<null | { id: string; name: string }>(null);

function askDeleteAgent(a: Agent) {
  setConfirmDelete({ id: a.id, name: a.name });
}

function cancelDeleteAgent() {
  setConfirmDelete(null);
}

function doDeleteAgent(id: string) {
  // 1) rimuovi agente dalla lista
  setAgents((prev) => prev.filter((a) => a.id !== id));

  // 2) qui in futuro: pulizia memoria per-agent se la implementi
  // localStorage.removeItem(`anova_agent_memory_${sessionId}_${id}`);

  // 3) chiudi modal
  setConfirmDelete(null);
}

  // bootstrap agents quando cambia sessionId
  useEffect(() => {
    if (!sessionId) {
      setAgents([]);
      return;
    }
    setAgents(loadAgents(sessionId));
  }, [sessionId]);

  // persistenza
  useEffect(() => {
    if (!sessionId) return;
    saveAgents(sessionId, agents);
  }, [sessionId, agents]);

  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return agents;
    return agents.filter((a) => {
      return (
        a.name.toLowerCase().includes(t) ||
        a.id.toLowerCase().includes(t) ||
        a.rules.toLowerCase().includes(t)
      );
    });
  }, [agents, search]);

  function addAgent() {
    if (!sessionId) return;

    const now = Date.now();
    const next: Agent = {
      id: newId(),
      name: `Agent ${agents.length + 1}`,
      enabled: true,
      provider: "openai",
      model: "gpt",
      rules: "",
      createdAt: now,
      updatedAt: now,
    };

    setAgents((prev) => [next, ...prev]);
  }

  function updateAgent(id: string, patch: Partial<Agent>) {
    const now = Date.now();
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now } : a))
    );
  }

  function disableAgent(id: string) {
    updateAgent(id, { enabled: false });
  }

  function enableAgent(id: string) {
    updateAgent(id, { enabled: true });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* BACKDROP: blu trasparente, chat visibile sotto */}
      <div
        className="absolute inset-0 bg-sky-500/10 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* CARD FULL-SCREEN "seria" */}
      <div className="absolute inset-0 flex items-start justify-center p-6">
        <div className="w-full max-w-5xl max-h-[calc(100dvh-3rem)] rounded-3xl border border-white/15 bg-[#071425]/75 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-baseline gap-3">
              <div className="text-[15px] font-semibold text-white/90">Agents</div>
              <div className="text-[12px] text-white/55">
                Configura ruoli • attiva/disattiva • (memoria condivisa a livello chat)
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-white/15 bg-black/30 text-[13px] text-white/85 hover:bg-white/10"
              title="Chiudi"
            >
              Chiudi
            </button>
          </div>

          {/* Top controls */}
          <div className="p-6 border-b border-white/10 space-y-4">
            {/* Memory toggle */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white/85">
                  Memoria condivisa (costi ↑)
                </div>
                <div className="text-[12px] text-white/55 mt-1">
                  Se OFF: niente packet memoria, niente compressione. Se ON: tutti gli agent lavorano con lo stesso contesto.
                </div>
              </div>

              <button
                onClick={() => setMemoryEnabled(!memoryEnabled)}
                className={[
                  "h-10 w-16 rounded-full border transition flex items-center px-1",
                  memoryEnabled
                    ? "bg-emerald-500/20 border-emerald-400/30 justify-end"
                    : "bg-black/30 border-white/15 justify-start",
                ].join(" ")}
                title="Toggle memoria condivisa"
              >
                <div className="h-8 w-8 rounded-full bg-white/80" />
              </button>
            </div>

            {/* Search + add */}
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca agent…"
                className="flex-1 h-11 rounded-2xl bg-black/25 border border-white/12 px-4 text-[14px] text-white placeholder-white/35 outline-none focus:border-white/25"
              />

              <button
                onClick={addAgent}
                disabled={!sessionId}
                className="h-11 px-4 rounded-2xl border border-white/15 bg-white/10 text-[13px] text-white/85 hover:bg-white/14 disabled:opacity-50"
                title="Nuovo agent"
              >
                + Nuovo agent
              </button>
            </div>
          </div>

          {/* List (scroll) */}
            <div className="p-6 flex-1 min-h-0 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-[13px] text-white/55">
                Nessun agent.
                <div className="text-[12px] text-white/40 mt-2">
                  Suggerimento operativo: tieni attivi solo gli agent che servono. Ogni agent attivo = costo potenziale.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: name + status */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <input
                            value={a.name}
                            onChange={(e) => updateAgent(a.id, { name: e.target.value })}
                            className="min-w-0 flex-1 h-10 rounded-xl bg-black/25 border border-white/12 px-3 text-[14px] text-white outline-none focus:border-white/25"
                          />

                          <span
                            className={[
                              "text-[12px] px-2 py-1 rounded-full border",
                              a.enabled
                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                                : "border-white/15 bg-white/5 text-white/55",
                            ].join(" ")}
                          >
                            {a.enabled ? "ATTIVO" : "DISATTIVO"}
                          </span>
                        </div>
                      </div>

 {/* Right: actions */}
<div className="flex items-center gap-2">
  <button
    onClick={() => askDeleteAgent(a)}
    className="h-10 px-3 rounded-xl border border-red-400/25 bg-red-500/10 text-[12px] text-red-100 hover:bg-red-500/20"
    title="Elimina agente"
  >
    Elimina
  </button>

  {a.enabled ? (
    <button
      onClick={() => disableAgent(a.id)}
      className="h-10 px-3 rounded-xl border border-white/12 bg-black/25 text-[12px] text-white/75 hover:bg-white/10"
      title="Disattiva agent"
    >
      OFF
    </button>
  ) : (
    <button
      onClick={() => enableAgent(a.id)}
      className="h-10 px-3 rounded-xl border border-white/12 bg-black/25 text-[12px] text-white/75 hover:bg-white/10"
      title="Attiva agent"
    >
      ON
    </button>
  )}
</div>
                    </div>

                    {/* Provider + model (semplici) */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <div className="text-[12px] text-white/55 mb-1">Provider</div>
                        <select
                          value={a.provider}
                          onChange={(e) => updateAgent(a.id, { provider: e.target.value as any })}
                          className="w-full h-10 rounded-xl bg-black/25 border border-white/12 px-3 text-[13px] text-white/85 outline-none focus:border-white/25"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="gemini">Gemini</option>
                          <option value="claude">Claude</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <div className="text-[12px] text-white/55 mb-1">Modello (stringa, per ora)</div>
                        <input
                          value={a.model}
                          onChange={(e) => updateAgent(a.id, { model: e.target.value })}
                          placeholder='es: "gpt-4.1-mini" / "gemini-1.5-pro" / "claude-3.5-sonnet"'
                          className="w-full h-10 rounded-xl bg-black/25 border border-white/12 px-3 text-[13px] text-white/85 placeholder-white/30 outline-none focus:border-white/25"
                        />
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="mt-4">
                      <div className="text-[12px] text-white/55 mb-1">
                        Regole (ruolo dell’agent)
                      </div>
                      <textarea
                        value={a.rules}
                        onChange={(e) => updateAgent(a.id, { rules: e.target.value })}
                        rows={3}
                        placeholder="Scrivi qui cosa deve fare questo agent…"
                        className="w-full rounded-2xl bg-black/25 border border-white/12 px-4 py-3 text-[13px] leading-relaxed text-white placeholder-white/30 outline-none focus:border-white/25"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

{/* Footer */}
<div className="px-6 pb-6 flex items-center justify-between gap-3">
  <div className="text-[12px] text-white/40">
    Nota: per ora gli agent sono configurazione + toggle. La fan-out multi-provider/fusion arriva nel prossimo step.
  </div>

  <div className="flex items-center gap-3">
    <button
      onClick={onClose}
      className="h-10 px-4 rounded-xl border border-white/15 bg-black/30 text-[13px] text-white/80 hover:bg-white/10"
      title="Chiudi senza applicare"
    >
      Chiudi
    </button>

    <button
      onClick={applyAndClose}
      className="h-10 px-4 rounded-xl border border-emerald-400/25 bg-emerald-500/15 text-[13px] text-emerald-50 hover:bg-emerald-500/25"
      title="Applica agent alla chat"
    >
      Applica
    </button>
  </div>
</div>

        </div>
      </div>
      {/* CONFIRM DELETE MODAL */}
{confirmDelete && (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950/90 backdrop-blur p-6">
      <div className="text-[16px] font-semibold text-white">
        Eliminare “{confirmDelete.name}”?
      </div>

      <div className="mt-2 text-[13px] text-white/70">
        Se elimini questo agente, perderai tutta la memoria relativa ad esso.
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          onClick={cancelDeleteAgent}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[13px] text-white/80 hover:bg-white/10"
        >
          Annulla
        </button>

        <button
          onClick={() => doDeleteAgent(confirmDelete.id)}
          className="rounded-xl border border-red-400/25 bg-red-500/15 px-4 py-2 text-[13px] text-red-100 hover:bg-red-500/25"
        >
          Elimina definitivamente
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
