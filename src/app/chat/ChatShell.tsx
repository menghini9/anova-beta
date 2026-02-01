"use client";
// ======================================================
// ChatShell — ChatGPT-like CORE (NO tabs, AgentsOverlay)
// Path: src/app/chat/ChatShell.tsx
// ======================================================

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db, getUserId } from "@/lib/firebase";
import type { ChatMessage, SessionMetaLite } from "@/lib/chat/types";

import ChatHeader from "./components/ChatHeader";
import ChatSidePanels from "./components/ChatSidePanels";
import ChatMessagesView from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";

import MemoryPanel from "./components/MemoryPanel";
import AgentsOverlay from "./components/AgentsOverlay";

// =========================
// localStorage helpers
// =========================
const hasWindow = () => typeof window !== "undefined";
const safeGet = (k: string) => (hasWindow() ? window.localStorage.getItem(k) : null);
const safeSet = (k: string, v: string) => hasWindow() && window.localStorage.setItem(k, v);

// =========================
// COST & TOKENS — Persistenza (localStorage)
// =========================
const LS_LAST_COST = "anova_last_cost";
const LS_TOTAL_COST = "anova_total_cost";
const LS_LAST_TOKENS = "anova_last_tokens";
const LS_TOTAL_TOKENS = "anova_total_tokens";

// =========================
// MEMORY V2 — Persistenza (localStorage) — session-level
// =========================
const LS_MEMORY_PREFIX = "anova_memory_v2_session_";

type UsageLite = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type MemoryStateLite = {
  pendingCompression: boolean;
  compressedMemory: any | null;
  memoryVersion: number;
  approxContextTokens: number;
  rawBuffer: string;
};

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function n(v: any) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function sanitizeAssistantForMemory(t: string) {
  const s = String(t ?? "");
  return s
    .replace(/sono\s+anova[^.\n]*[.\n]/gi, "")
    .replace(/anov[aà]\s*β/gi, "")
    .replace(/tuo\s+assistente[^.\n]*[.\n]/gi, "")
    .replace(/ho\s+memorizzat[oa][^.\n]*[.\n]/gi, "")
    .replace(/compress(or|ione)[^.\n]*[.\n]/gi, "")
    .trim();
}

function emptyMemoryState(): MemoryStateLite {
  return {
    pendingCompression: false,
    compressedMemory: null,
    memoryVersion: 0,
    approxContextTokens: 0,
    rawBuffer: "",
  };
}

function memoryKey(sessionId: string) {
  return `${LS_MEMORY_PREFIX}${sessionId}`;
}

function loadMemoryState(sessionId: string): MemoryStateLite {
  return safeJsonParse<MemoryStateLite>(safeGet(memoryKey(sessionId)), emptyMemoryState());
}

function saveMemoryState(sessionId: string, v: MemoryStateLite) {
  safeSet(memoryKey(sessionId), JSON.stringify(v));
}

function normUsage(u: any): UsageLite {
  return {
    prompt_tokens: n(u?.prompt_tokens),
    completion_tokens: n(u?.completion_tokens),
    total_tokens: n(u?.total_tokens),
  };
}

function addUsage(a: UsageLite, b: UsageLite): UsageLite {
  return {
    prompt_tokens: a.prompt_tokens + b.prompt_tokens,
    completion_tokens: a.completion_tokens + b.completion_tokens,
    total_tokens: a.total_tokens + b.total_tokens,
  };
}

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ChatShell() {
  // =========================
  // USER
  // =========================
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // =========================
  // SESSIONS (NO TRASH UI)
  // =========================
  const [sessions, setSessions] = useState<SessionMetaLite[]>([]);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");

  // =========================
  // SESSION ACTIVE
  // =========================
  const [sessionId, setSessionId] = useState<string | null>(null);

  // =========================
  // AGENTS UI — Overlay full screen
  // =========================
  const [agentsOpen, setAgentsOpen] = useState(false);
// =========================
// AGENTS — runtime state (per mostrare in chat)
// =========================
type AgentLite = {
  id: string;
  name: string;
  enabled: boolean;
  provider: "openai" | "gemini" | "claude";
  model: string;
  rules: string;
};

const [sessionAgents, setSessionAgents] = useState<AgentLite[]>([]);

  // =========================
  // MEMORY — session-level toggle (default OFF)
  // =========================
  const LS_MEMORY_ENABLED_PREFIX = "anova_memory_enabled_";
  const memoryEnabledKey = (sid: string) => `${LS_MEMORY_ENABLED_PREFIX}${sid}`;
  const [memoryEnabled, setMemoryEnabled] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const raw = safeGet(memoryEnabledKey(sessionId));
    setMemoryEnabled(raw === "1");
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    safeSet(memoryEnabledKey(sessionId), memoryEnabled ? "1" : "0");
  }, [sessionId, memoryEnabled]);

  // =========================
  // MESSAGES (session-level)
  // =========================
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null!);

  // =========================
  // COSTI & TOKENS
  // =========================
  const [lastCost, setLastCost] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  const [lastTokens, setLastTokens] = useState<UsageLite>({
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  });

  const [totalTokens, setTotalTokens] = useState<UsageLite>({
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  });
// =========================
// VIEW MODE — group vs single agent
// =========================
const [activeAgentViewId, setActiveAgentViewId] = useState<string | null>(null);
// null = chat di gruppo

  // =========================
  // SIDEBAR
  // =========================
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // =========================
  // MEMORY UI — Panel + banner + edit queue
  // =========================
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [memoryMetaUI, setMemoryMetaUI] = useState<any | null>(null);
  const [providerPacketPreviewUI, setProviderPacketPreviewUI] = useState<any | null>(null);

  const [memoryBanner, setMemoryBanner] = useState<{
    kind: "compressed" | "edited";
    text: string;
  } | null>(null);

  const bannerTimerRef = useRef<any>(null);

  const [pendingMemoryEdit, setPendingMemoryEdit] = useState<{
    mode: "replace_packet";
    packet: any;
    note?: string;
  } | null>(null);

  function showMemoryBanner(kind: "compressed" | "edited", text: string) {
    setMemoryBanner({ kind, text });
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setMemoryBanner(null), 6000);
  }

  // =========================
  // BOOTSTRAP cost/tokens
  // =========================
  useEffect(() => {
    setLastCost(n(safeGet(LS_LAST_COST)));
    setTotalCost(n(safeGet(LS_TOTAL_COST)));

    setLastTokens(
      safeJsonParse<UsageLite>(safeGet(LS_LAST_TOKENS), {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      })
    );

    setTotalTokens(
      safeJsonParse<UsageLite>(safeGet(LS_TOTAL_TOKENS), {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      })
    );
  }, []);

  useEffect(() => {
    safeSet(LS_LAST_COST, String(lastCost));
    safeSet(LS_TOTAL_COST, String(totalCost));
  }, [lastCost, totalCost]);

  useEffect(() => {
    safeSet(LS_LAST_TOKENS, JSON.stringify(lastTokens));
    safeSet(LS_TOTAL_TOKENS, JSON.stringify(totalTokens));
  }, [lastTokens, totalTokens]);

  // =========================
  // LISTENER sessions (only deleted=false)
  // =========================
  useEffect(() => {
    if (!userId) return;

    const qArchive = query(
      collection(db, "sessions"),
      where("owner", "==", userId),
      where("deleted", "==", false),
      orderBy("updatedAt", "desc")
    );

const unsub = onSnapshot(
  qArchive,
  (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    rows.sort((a: any, b: any) => {
      const ta = a?.updatedAt?.seconds ?? a?.createdAt?.seconds ?? 0;
      const tb = b?.updatedAt?.seconds ?? b?.createdAt?.seconds ?? 0;
      return tb - ta;
    });
    setSessions(rows);
  },
  (err) => {
    console.error("SNAPSHOT ERROR: sessions", err);
  }
);


    return () => unsub();
  }, [userId]);

  // =========================
  // BOOTSTRAP session
  // =========================
  const didPickSessionRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (didPickSessionRef.current) return;

    const saved = safeGet("anovaActiveSessionId");
    if (saved) {
      didPickSessionRef.current = true;
      setSessionId(saved);
      return;
    }

    if (sessions.length > 0) {
      didPickSessionRef.current = true;
      setSessionId(sessions[0].id);
      safeSet("anovaActiveSessionId", sessions[0].id);
      return;
    }

    (async () => {
      const sid = newId();
      await setDoc(
        doc(db, "sessions", sid),
        {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: "Sessione avviata.",
          deleted: false,
          owner: userId,
          title: null,
        },
        { merge: true }
      );

      didPickSessionRef.current = true;
      setSessionId(sid);
      safeSet("anovaActiveSessionId", sid);
    })();
  }, [userId, sessions]);

  // =========================
  // LISTENER messages (session-level)
  // =========================
  useEffect(() => {
    if (!sessionId) return;

    const messagesRef = collection(db, "sessions", sessionId, "messages");
    const qy = query(messagesRef, orderBy("createdAt", "desc"), limit(120));

const unsub = onSnapshot(
  qy,
  (snap) => {
    const rows: ChatMessage[] = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .reverse();
    setMessages(rows);
  },
  (err) => {
    console.error("SNAPSHOT ERROR: messages", err);
  }
);


    return () => unsub();
  }, [sessionId]);
// =========================
// MESSAGES — view filter
// =========================
const visibleMessages = useMemo(() => {
  // group view
  if (!activeAgentViewId) return messages;

  // agent view: mostra solo i messaggi di quell’agent
  return messages.filter((m: any) => String(m?.agentId ?? "") === activeAgentViewId);
}, [messages, activeAgentViewId]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // =========================
  // ACTIONS — sessions
  // =========================
  async function newSession() {
    if (!userId) return;
    const sid = newId();

    await setDoc(
      doc(db, "sessions", sid),
      {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "Sessione avviata.",
        deleted: false,
        owner: userId,
        title: null,
      },
      { merge: true }
    );

    setSessionId(sid);
    safeSet("anovaActiveSessionId", sid);
    setInlineEditId(null);
    setInlineEditValue("");
  }

  async function openSession(id: string) {
    setSessionId(id);
    safeSet("anovaActiveSessionId", id);
    setInlineEditId(null);
    setInlineEditValue("");
  }

  // soft delete: sparisce subito dalla sidebar (perché filtered deleted=false)
  async function deleteSession(id: string) {
    await updateDoc(doc(db, "sessions", id), { deleted: true, updatedAt: serverTimestamp() });
  }

  function startInlineRename(id: string, currentTitle?: string | null) {
    setInlineEditId(id);
    setInlineEditValue((currentTitle || "").trim());
  }

  async function commitInlineRename(id: string) {
    const clean = inlineEditValue.trim();
    await updateDoc(doc(db, "sessions", id), {
      title: clean ? clean : null,
      updatedAt: serverTimestamp(),
    });
    setInlineEditId(null);
    setInlineEditValue("");
  }

  // =========================
  // MEMORY UI — Save edited packet (session-level)
  // =========================
  function onSaveMemoryPacket(packet: any, note?: string) {
    if (!sessionId) return;

    const memState = loadMemoryState(sessionId);
    const next: MemoryStateLite = {
      ...memState,
      compressedMemory: packet,
      rawBuffer: "",
      pendingCompression: false,
      memoryVersion: n(memState.memoryVersion) + 1,
    };
    saveMemoryState(sessionId, next);

    setPendingMemoryEdit({
      mode: "replace_packet",
      packet,
      note: (note || "").trim() || "User edit",
    });

    showMemoryBanner("edited", "✍️ Memoria aggiornata (salvata).");
  }
useEffect(() => {
  if (!sessionId) {
    setSessionAgents([]);
    return;
  }
  try {
    const raw = window.localStorage.getItem(`anova_agents_${sessionId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    setSessionAgents(Array.isArray(parsed) ? parsed : []);
  } catch {
    setSessionAgents([]);
  }
}, [sessionId]);

  // =========================
  // SEND MESSAGE (single provider for now)
  // =========================
  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !userId || !sessionId) return;

    const messagesRef = collection(db, "sessions", sessionId, "messages");

    // user msg
    await addDoc(messagesRef, {
      sender: "user",
      text: trimmed,
      createdAt: serverTimestamp(),
      owner: userId,
    });

    await updateDoc(doc(db, "sessions", sessionId), {
      updatedAt: serverTimestamp(),
      lastMessage: trimmed,
    });

    setInput("");

    // ultimi 2 turni (continuità)
    const lastTurns = messages.slice(-2);
    const historyText = lastTurns
      .map((m: any) => {
        const s = String(m?.sender ?? "").toLowerCase();
        const role = s === "user" ? "USER" : "ASSISTANT";
        return `${role}: ${String(m?.text ?? "")}`;
      })
      .join("\n");

    // memoria condivisa: se OFF, non mandiamo nulla
    const memState = memoryEnabled ? loadMemoryState(sessionId) : emptyMemoryState();
    const compressText = memoryEnabled && memState?.pendingCompression ? (memState.rawBuffer ?? "") : "";

    let aiText = "…";
    try {
      const res = await fetch("/api/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,

          // per ora provider default “gpt/openai”
          provider: "openai",
          rules: "",

          sessionId,

          historyText,

          // memoria solo se ON
          memoryState: memoryEnabled ? memState : null,
          compressText: memoryEnabled ? compressText : "",
          memoryEdit: memoryEnabled ? pendingMemoryEdit ?? null : null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("chat-reply HTTP", res.status, data);
        aiText = data?.error ? `❌ ${String(data.error)}` : `❌ Errore API (${res.status})`;
        throw new Error(aiText);
      }

      aiText = data?.finalText ?? "⚠️ Risposta vuota.";

      // ingest meta
      if (data?.memoryMeta) setMemoryMetaUI(data.memoryMeta);
      if (data?.providerPacketPreview) setProviderPacketPreviewUI(data.providerPacketPreview);

      const ev = data?.memoryEvent ?? null;
      if (ev?.type === "compressed") {
        showMemoryBanner("compressed", `🧠 Memoria compressa — v${String(ev?.afterVersion ?? "")}`);
      }
      if (ev?.type === "edited") {
        showMemoryBanner("edited", `✍️ Memoria modificata — v${String(ev?.afterVersion ?? "")}`);
      }

      if (pendingMemoryEdit) setPendingMemoryEdit(null);

      // salva memoria session-level
      if (memoryEnabled && data?.memoryState && sessionId) {
        const next = data.memoryState as MemoryStateLite;

        const safeAi = sanitizeAssistantForMemory(aiText);
        const cleanedAi = String(safeAi)
          .replace(/Sono\s+Anova[^.\n]*[.\n]?/gi, "")
          .replace(/\bAnova\b/gi, "")
          .trim();

        const turnBlock = `USER: ${trimmed}\nASSISTANT: ${cleanedAi}\n\n`;

        next.rawBuffer = String(next.rawBuffer ?? "") + turnBlock;
        if (next.compressedMemory) next.rawBuffer = "";

        saveMemoryState(sessionId, next);
      }

      // KPI
      const cost = data?.cost ?? null;
      const lastC = n(cost?.totalCost);
      setLastCost(lastC);
      setTotalCost((prev) => prev + lastC);

      const usageRaw =
        data?.usage ??
        data?.tokens ??
        data?.usageLite ??
        data?.cost?.usage ??
        data?.meta?.usage ??
        data?.providerUsage ??
        null;

      const lastU = normUsage(usageRaw);
      setLastTokens(lastU);
      setTotalTokens((prev) => addUsage(prev, lastU));
    } catch {
      aiText = "❌ Errore API.";
    }

    await addDoc(messagesRef, {
      sender: "assistant",
      text: aiText,
      createdAt: serverTimestamp(),
      owner: userId,
    });

    await updateDoc(doc(db, "sessions", sessionId), {
      updatedAt: serverTimestamp(),
      lastMessage: aiText,
    });
  }

  // =========================
  // RENDER
  // =========================
  return (
    <main className="h-screen w-screen flex bg-black text-neutral-100 overflow-hidden">
      {/* MEMORY — fixed top-right */}
      <button
        onClick={() => setMemoryPanelOpen(true)}
        className="fixed right-4 top-3 z-[60] rounded-xl border border-white/15 bg-black/60 backdrop-blur px-3 py-2 text-[12px] text-white/85 hover:bg-white/10"
        title="Apri pannello memoria"
      >
        MEMORY
      </button>

      <ChatSidePanels
        sessions={sessions}
        activeSessionId={sessionId}
        inlineEditId={inlineEditId}
        inlineEditValue={inlineEditValue}
        setInlineEditValue={setInlineEditValue}
        startInlineRename={startInlineRename}
        commitInlineRename={commitInlineRename}
        handleOpenSession={openSession}
        handleDeleteSession={deleteSession}
        onNewSession={newSession}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-50 rounded-xl border border-white/15 bg-black/60 backdrop-blur px-3 py-2 text-[12px] text-white/85 hover:bg-white/10"
          title="Apri sidebar"
        >
          ☰
        </button>
      )}

      <section className="flex-1 min-w-0 flex flex-col">
        {/* Top bar KPI (non si tocca) */}
        <div className="h-14 shrink-0 border-b border-white/10 bg-neutral-950/60 backdrop-blur flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6 flex items-center justify-end">
            <ChatHeader
              lastCost={lastCost}
              totalCost={totalCost}
              lastTokens={lastTokens}
              totalTokens={totalTokens}
            />
          </div>
        </div>

        {/* Banner memoria */}
        {memoryBanner && (
          <div className="shrink-0 border-b border-white/10 bg-neutral-950/80">
            <div className="mx-auto w-full max-w-6xl px-6 py-2 text-[12px] text-white/85 flex items-center justify-between">
              <div>{memoryBanner.text}</div>
              <button
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                onClick={() => setMemoryBanner(null)}
                title="Chiudi"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Controls header (Agents button + Mostra/Nascondi) */}
<div className="shrink-0 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
  <div className="mx-auto w-full max-w-6xl px-8 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAgentsOpen(true)}
          className="h-10 w-10 rounded-full border border-white/15 bg-black/40 text-white/85 hover:bg-white/10 flex items-center justify-center"
          title="Agents"
        >
          👥
        </button>

        <div className="text-[13px] text-white/60">Controlli chat (agents + regole)</div>
      </div>
    </div>
{/* ====================================================== */}
{/* AGENTS BAR — filter view (group vs single agent) */}
{/* ====================================================== */}
<div className="shrink-0">
  <div className="mx-auto w-full max-w-6xl px-8 py-2 flex items-center gap-2">
    {/* Pulsante CHAT compare solo se sei in vista agente */}
    {activeAgentViewId && (
      <button
        onClick={() => setActiveAgentViewId(null)}
        className="h-8 px-3 rounded-full border border-white/15 bg-white/10 text-[12px] text-white/85 hover:bg-white/15"
        title="Torna alla chat di gruppo"
      >
        CHAT
      </button>
    )}

    {/* Pills agent: click = filtro */}
    <div className="flex items-center gap-2 overflow-x-auto">
      {(sessionId ? JSON.parse(localStorage.getItem(`anova_agents_${sessionId}`) || "[]") : [])
        .filter((a: any) => a && a.enabled)
        .map((a: any) => {
          const isActive = activeAgentViewId === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setActiveAgentViewId(isActive ? null : a.id)}
              className={[
                "h-8 px-3 rounded-full border text-[12px] whitespace-nowrap transition",
                isActive
                  ? "border-sky-300/40 bg-sky-500/20 text-white"
                  : "border-white/15 bg-black/20 text-white/80 hover:bg-white/10",
              ].join(" ")}
              title={a.name}
            >
              {a.name}
            </button>
          );
        })}
    </div>

    {/* Etichetta stato vista */}
    <div className="ml-auto text-[12px] text-white/45">
      {activeAgentViewId ? "Vista agente" : "Chat di gruppo"}
    </div>
  </div>
</div>

    {/* ✅ Agents pills */}
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {sessionAgents.filter((a) => a.enabled).length === 0 ? (
        <div className="text-[12px] text-white/35">
          Nessun agent attivo (usa 👥 → Applica).
        </div>
      ) : (
        sessionAgents
          .filter((a) => a.enabled)
          .map((a) => (
            <div
              key={a.id}
              className="text-[12px] px-3 py-1 rounded-full border border-white/12 bg-white/5 text-white/80"
              title={`${a.provider} • ${a.model}`}
            >
              {a.name}
            </div>
          ))
      )}
    </div>
  </div>
</div>


        {/* Chat viewport */}
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-8 pb-44">
              <ChatMessagesView messages={visibleMessages} bottomRef={bottomRef} />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="bg-gradient-to-t from-black/85 via-black/60 to-transparent backdrop-blur pointer-events-auto">
              <ChatInput input={input} setInput={setInput} onSend={sendMessage} disabled={!userId} />
            </div>
          </div>
        </div>
      </section>

      {/* MEMORY PANEL */}
      <MemoryPanel
        open={memoryPanelOpen}
        onClose={() => setMemoryPanelOpen(false)}
        memoryState={sessionId ? loadMemoryState(sessionId) : null}
        memoryMeta={memoryMetaUI}
        providerPacketPreview={providerPacketPreviewUI}
        onSaveMemoryPacket={onSaveMemoryPacket}
      />

      {/* AGENTS OVERLAY — full screen */}
<AgentsOverlay
  open={agentsOpen}
  onClose={() => setAgentsOpen(false)}
  sessionId={sessionId}
  memoryEnabled={memoryEnabled}
  setMemoryEnabled={setMemoryEnabled}
  onApply={(agents) => setSessionAgents(agents as any)}
/>


    </main>
  );
}
