"use client";
// ======================================================
// ChatShell — NEW CORE (CLEAN + Tabs Provider Labels + Close Tab)
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
import type { ChatMessage, SessionMetaLite, TabDoc } from "@/lib/chat/types";

import ChatHeader from "./components/ChatHeader";
import ChatSidePanels from "./components/ChatSidePanels";
import ChatMessagesView from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";

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
// MEMORY V2 — Persistenza (localStorage)
// =========================
// Chiave per session + tab (così non si mescola tra tab)
const LS_MEMORY_PREFIX = "anova_memory_v2_";

type UsageLite = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
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
// =========================
// MEMORY V2 — Types (client-side)
// (shape minimale, uguale al server)
// =========================
type MemoryStateLite = {
  pendingCompression: boolean;
  compressedMemory: any | null; // il packet JSON
  memoryVersion: number;
  approxContextTokens: number;
};

function emptyMemoryState(): MemoryStateLite {
  return {
    pendingCompression: false,
    compressedMemory: null,
    memoryVersion: 0,
    approxContextTokens: 0,
  };
}

function memoryKey(sessionId: string, tabId: string) {
  return `${LS_MEMORY_PREFIX}${sessionId}_${tabId}`;
}

function loadMemoryState(sessionId: string, tabId: string): MemoryStateLite {
  return safeJsonParse<MemoryStateLite>(
    safeGet(memoryKey(sessionId, tabId)),
    emptyMemoryState()
  );
}

function saveMemoryState(sessionId: string, tabId: string, v: MemoryStateLite) {
  safeSet(memoryKey(sessionId, tabId), JSON.stringify(v));
}

function clearMemoryState(sessionId: string, tabId: string) {
  if (!hasWindow()) return;
  window.localStorage.removeItem(memoryKey(sessionId, tabId));
}

// =========================
// TOKENS — helpers
// =========================
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
  // ARCHIVIO/Cestino
  // =========================
  const [sessions, setSessions] = useState<SessionMetaLite[]>([]);
  const [trashSessions, setTrashSessions] = useState<SessionMetaLite[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");

  // =========================
  // SESSION
  // =========================
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);

  // =========================
  // TABS
  // =========================
  const [tabs, setTabs] = useState<TabDoc[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const visibleTabs = useMemo(() => tabs.filter((t) => !t.deleted), [tabs]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId]
  );

  // =========================
  // RULES
  // =========================
  const [rulesDraft, setRulesDraft] = useState("");
  const rulesDebounceRef = useRef<any>(null);
  useEffect(() => setRulesDraft(activeTab?.rules ?? ""), [activeTabId, activeTab?.rules]);

  // =========================
  // MESSAGES
  // =========================
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null!);

  // =========================
  // COSTI & TOKENS (Provider) — STATE
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
  // SIDEBAR
  // =========================
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // =========================
  // COSTI & TOKENS — BOOTSTRAP da localStorage (1 volta)
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

  // =========================
  // COSTI & TOKENS — PERSISTENZA in localStorage
  // =========================
  useEffect(() => {
    safeSet(LS_LAST_COST, String(lastCost));
    safeSet(LS_TOTAL_COST, String(totalCost));
  }, [lastCost, totalCost]);

  useEffect(() => {
    safeSet(LS_LAST_TOKENS, JSON.stringify(lastTokens));
    safeSet(LS_TOTAL_TOKENS, JSON.stringify(totalTokens));
  }, [lastTokens, totalTokens]);

  // -------------------------
  // LISTENER sessions (archive/trash)
  // -------------------------
  useEffect(() => {
    if (!userId) return;

    const qArchive = query(
      collection(db, "sessions"),
      where("owner", "==", userId),
      where("deleted", "==", false),
      orderBy("updatedAt", "desc")
    );

    const unsubA = onSnapshot(qArchive, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    const qTrash = query(
      collection(db, "sessions"),
      where("owner", "==", userId),
      where("deleted", "==", true),
      orderBy("updatedAt", "desc")
    );

    const unsubT = onSnapshot(qTrash, (snap) => {
      setTrashSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => {
      unsubA();
      unsubT();
    };
  }, [userId]);

  // -------------------------
  // BOOTSTRAP session
  // -------------------------
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

  // -------------------------
  // LISTENER session title
  // -------------------------
  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(doc(db, "sessions", sessionId), (snap) => {
      setSessionTitle(String(snap.data()?.title ?? ""));
    });
    return () => unsub();
  }, [sessionId]);

  // -------------------------
  // LISTENER tabs
  // -------------------------
  const didBootstrapMainTabRef = useRef(false);

  useEffect(() => {
    didBootstrapMainTabRef.current = false;
    setTabs([]);
    setActiveTabId(null);
    setMessages([]);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const tabsRef = collection(db, "sessions", sessionId, "tabs");
    const qy = query(tabsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(qy, async (snap) => {
      const rows: TabDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setTabs(rows);

      const alive = rows.filter((t: any) => !t?.deleted);

      // bootstrap main tab se vuoto
      if (rows.length === 0 && !didBootstrapMainTabRef.current) {
        didBootstrapMainTabRef.current = true;

        await setDoc(
          doc(db, "sessions", sessionId, "tabs", "main"),
          {
            title: "Main",
            provider: "openai",
            rules: "",
            deleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            owner: userId,
          },
          { merge: true }
        );

        setActiveTabId("main");
        return;
      }

      // set active se manca
      if (!activeTabId && alive.length > 0) setActiveTabId(alive[0].id);

      // se active sparisce, riassegna
      const aliveIds = new Set(alive.map((t) => t.id));
      if (activeTabId && !aliveIds.has(activeTabId) && alive.length > 0) {
        setActiveTabId(alive[0].id);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId]);

  // -------------------------
  // LISTENER messages per tab
  // -------------------------
  useEffect(() => {
    if (!sessionId || !activeTabId) return;

    const messagesRef = collection(db, "sessions", sessionId, "tabs", activeTabId, "messages");
    const qy = query(messagesRef, orderBy("createdAt", "desc"), limit(80));

    const unsub = onSnapshot(qy, (snap) => {
      const rows: ChatMessage[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .reverse();
      setMessages(rows);
    });

    return () => unsub();
  }, [sessionId, activeTabId]);

  // autoscroll
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // =========================
  // ACTIONS
  // =========================
async function setTabProvider(next: "openai" | "gemini" | "claude") {
  if (!sessionId || !activeTabId) return;

  await updateDoc(doc(db, "sessions", sessionId, "tabs", activeTabId), {
    provider: next,
    updatedAt: serverTimestamp(),
  });
}


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
    setShowArchive(false);
    setShowTrash(false);
  }

  async function openSession(id: string) {
    setSessionId(id);
    safeSet("anovaActiveSessionId", id);
    setShowArchive(false);
    setShowTrash(false);
    setInlineEditId(null);
    setInlineEditValue("");
  }

  async function deleteSession(id: string) {
    await updateDoc(doc(db, "sessions", id), { deleted: true, updatedAt: serverTimestamp() });
  }

  async function restoreSession(id: string) {
    await updateDoc(doc(db, "sessions", id), { deleted: false, updatedAt: serverTimestamp() });
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

  async function commitSessionTitle() {
    if (!sessionId) return;
    const clean = sessionTitle.trim();
    await updateDoc(doc(db, "sessions", sessionId), {
      title: clean ? clean : null,
      updatedAt: serverTimestamp(),
    });
    setEditingTitle(false);
  }

  async function addTab() {
    if (!sessionId || !userId) return;
    const id = newId();

    await setDoc(doc(db, "sessions", sessionId, "tabs", id), {
      title: null,
      provider: "openai",
      rules: "",
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      owner: userId,
    });

    setActiveTabId(id);
  }

  async function closeTab(tabId: string) {
    if (!sessionId) return;

    // non chiudere l'ultima tab viva
    const alive = visibleTabs;
    if (alive.length <= 1) return;

    await updateDoc(doc(db, "sessions", sessionId, "tabs", tabId), {
      deleted: true,
      updatedAt: serverTimestamp(),
    });
    // MEMORY V2 — pulizia localStorage (evita spazzatura)
    if (sessionId) clearMemoryState(sessionId, tabId);

    // se chiudi quella attiva, passa ad una rimasta
    if (activeTabId === tabId) {
      const next = alive.find((t) => t.id !== tabId);
      if (next) setActiveTabId(next.id);
    }
  }

  async function persistTabRules(next: string) {
    if (!sessionId || !activeTabId) return;
    await updateDoc(doc(db, "sessions", sessionId, "tabs", activeTabId), {
      rules: next,
      updatedAt: serverTimestamp(),
    });
  }

  function onRulesChange(next: string) {
    setRulesDraft(next);
    if (rulesDebounceRef.current) clearTimeout(rulesDebounceRef.current);
    rulesDebounceRef.current = setTimeout(() => persistTabRules(next), 600);
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !userId || !sessionId || !activeTabId) return;

    // =========================
    // FAST PATH — small talk (no API, costo zero)
    // =========================
    const t = trimmed.toLowerCase();
    const isSmallTalk =
      t === "ciao" ||
      t === "ciao!" ||
      t === "hello" ||
      t === "hi" ||
      t === "ok" ||
      t === "grazie" ||
      t === "thanks" ||
      t === "👍";

    const messagesRef = collection(db, "sessions", sessionId, "tabs", activeTabId, "messages");

       if (isSmallTalk) {
      await addDoc(messagesRef, {
        sender: "anova",
        text: "👋 Ciao! Dimmi pure cosa ti serve.",
        createdAt: serverTimestamp(),
        owner: userId,
      });

      await updateDoc(doc(db, "sessions", sessionId), {
        updatedAt: serverTimestamp(),
        lastMessage: "👋 Ciao! Dimmi pure cosa ti serve.",
      });

      setInput("");
      return;
    }


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
    // =========================
    // MEMORY V2 — historyText (ultimi 2 turni)
    // Nota: messages è lo stato attuale prima della risposta AI
    // =========================
    const lastTurns = messages.slice(-2);
    const historyText = lastTurns
      .map((m: any) => `${String(m?.sender ?? "").toUpperCase()}: ${String(m?.text ?? "")}`)
      .join("\n");

    // =========================
    // MEMORY V2 — load state (per session+tab)
    // =========================
    const memState = loadMemoryState(sessionId, activeTabId);

    // call API
    let aiText = "…";
    try {
      const res = await fetch("/api/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  prompt: trimmed,
  rules: rulesDraft,
  provider: activeTab?.provider ?? "openai",
  tabId: activeTabId,
  sessionId,

  // ===== MEMORY V2 =====
  historyText,
  memoryState: memState,
}),



      });

      const data = await res.json();
      aiText = data?.finalText ?? "⚠️ Risposta vuota.";
      // =========================
      // MEMORY V2 — save state
      // =========================
      if (data?.memoryState && sessionId && activeTabId) {
        saveMemoryState(sessionId, activeTabId, data.memoryState as MemoryStateLite);
      }

      // =========================
      // KPI — COSTI & TOKENS (Last + Total)
      // =========================
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
      sender: "anova",
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
  // TAB LABEL — Provider + Numero per provider (OpenAI 1, Gemini 2, ...)
  // =========================
  const providerLabel = (p?: string | null) => {
    const k = String(p ?? "openai").toLowerCase();
    if (k === "openai") return "OpenAI";
    if (k === "gemini") return "Gemini";
    if (k === "anthropic" || k === "claude") return "Claude";
    return k.toUpperCase();
  };

  const providerCounters: Record<string, number> = {};
  const tabIndexById: Record<string, number> = {};
  visibleTabs.forEach((t) => {
    const key = String(t.provider ?? "openai").toLowerCase();
    providerCounters[key] = (providerCounters[key] ?? 0) + 1;
    tabIndexById[t.id] = providerCounters[key];
  });

  // =========================
  // RENDER
  // =========================
  return (
    <main className="h-screen w-screen flex bg-black text-neutral-100 overflow-hidden">
      {/* Sidebar sinistra */}
      <ChatSidePanels
        showArchive={showArchive}
        showTrash={showTrash}
        setShowArchive={setShowArchive}
        setShowTrash={setShowTrash}
        sessions={sessions}
        trashSessions={trashSessions}
        inlineEditId={inlineEditId}
        inlineEditValue={inlineEditValue}
        setInlineEditValue={setInlineEditValue}
        startInlineRename={startInlineRename}
        commitInlineRename={commitInlineRename}
        handleOpenSession={openSession}
        handleDeleteSession={deleteSession}
        handleRestoreSession={restoreSession}
        onNewSession={newSession}
        onAddTab={addTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Bottone apri sidebar quando è chiusa */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-50 rounded-xl border border-white/15 bg-black/60 backdrop-blur px-3 py-2 text-[12px] text-white/85 hover:bg-white/10"
          title="Apri sidebar"
        >
          ☰
        </button>
      )}

      {/* Colonna principale */}
      <section className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-white/10 bg-neutral-950/60 backdrop-blur flex items-center">
          <div className="mx-auto w-full max-w-5xl px-6 flex items-center justify-between">
<ChatHeader
  sessionId={sessionId}
  sessionTitle={sessionTitle}
  setSessionTitle={setSessionTitle}
  editingTitle={editingTitle}
  setEditingTitle={setEditingTitle}
  onCommitTitle={commitSessionTitle}
  lastCost={lastCost}
  totalCost={totalCost}
  lastTokens={lastTokens}
  totalTokens={totalTokens}
  activeProvider={activeTab?.provider ?? "openai"}   // ✅
  setActiveProvider={setTabProvider}                  // ✅
/>

          </div>
        </div>

        {/* Tabs + Rules */}
        <div className="shrink-0 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-8 py-5">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {visibleTabs.map((t) => (
                <div key={t.id} className="relative shrink-0">
                  <button
                    onClick={() => setActiveTabId(t.id)}
                    className={`rounded-full pl-5 pr-10 py-2.5 text-[15px] font-medium border transition whitespace-nowrap ${
                      t.id === activeTabId
                        ? "border-white/35 bg-white/15 text-white shadow-sm"
                        : "border-white/15 bg-white/0 text-white/85 hover:bg-white/10 hover:border-white/25"
                    }`}
                    title={t.title || "Tab"}
                  >
                    {`${providerLabel(t.provider)} ${tabIndexById[t.id] ?? 1}`}
                  </button>

                  {/* Close tab */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(t.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full border border-white/10 bg-black/30 text-white/70 hover:bg-white/10 hover:text-white transition"
                    title="Chiudi tab"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addTab}
                className="shrink-0 rounded-full px-5 py-2.5 text-[15px] font-medium border border-white/20 bg-white/0 hover:bg-white/10 text-white/85 whitespace-nowrap"
                title="Aggiungi tab"
              >
                + Tab
              </button>
            </div>

            {/* Rules */}
            <div className="mt-5">
              <div className="text-[13px] font-medium text-white/75 mb-2">
                Regole (solo per questa tab)
              </div>
<div className="flex items-center gap-3 mb-3">
  <div className="text-[13px] font-medium text-white/75">
    Provider tab
  </div>

  <select
    value={(activeTab?.provider ?? "openai") as any}
    onChange={(e) => setTabProvider(e.target.value as any)}
    disabled={!activeTabId}
    className="h-9 rounded-xl border border-white/15 bg-black/40 px-3 text-[13px] text-white/85 outline-none focus:border-white/25 disabled:opacity-50"
    title="Seleziona provider per questa tab"
  >
    <option value="openai">OpenAI</option>
    <option value="gemini">Gemini</option>
    <option value="claude">Claude</option>
  </select>

  <div className="text-[12px] text-white/45">
    Cambia modello per questa tab
  </div>
</div>

              <textarea
                value={rulesDraft}
                onChange={(e) => onRulesChange(e.target.value)}
                placeholder="Scrivi regole operative…"
                rows={4}
                className="w-full rounded-2xl bg-black/40 border border-white/15 px-5 py-4 text-[14px] leading-relaxed text-white placeholder-white/35 outline-none focus:border-white/35 focus:bg-black/50"
              />

              <div className="mt-2 text-[12px] text-white/45">
                Regole = vincoli operativi per questa sotto-chat.
              </div>
            </div>
          </div>
        </div>

        {/* Chat viewport */}
        <div className="relative flex-1 min-h-0">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-8 pb-44">
              <ChatMessagesView messages={messages} bottomRef={bottomRef} />
            </div>
          </div>

          {/* Input overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
            <div className="bg-gradient-to-t from-black/85 via-black/60 to-transparent backdrop-blur pointer-events-auto">
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={sendMessage}
                disabled={!userId}
                focusKey={activeTabId} // 👈 forza focus quando cambi tab
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
