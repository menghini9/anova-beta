"use client";
// ======================================================
// ChatShell — NEW CORE (Base)
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



const hasWindow = () => typeof window !== "undefined";
const safeGet = (k: string) => (hasWindow() ? window.localStorage.getItem(k) : null);
const safeSet = (k: string, v: string) => hasWindow() && window.localStorage.setItem(k, v);

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function ChatShell() {
  // USER
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // ARCHIVIO/Cestino
  const [sessions, setSessions] = useState<SessionMetaLite[]>([]);
  const [trashSessions, setTrashSessions] = useState<SessionMetaLite[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");

  // SESSION
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);

  // TABS
  const [tabs, setTabs] = useState<TabDoc[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) ?? null,
    [tabs, activeTabId]
  );

  const visibleTabs = useMemo(() => tabs.filter((t) => !t.deleted), [tabs]);

  // RULES
  const [rulesDraft, setRulesDraft] = useState("");
  const rulesDebounceRef = useRef<any>(null);
  useEffect(() => setRulesDraft(activeTab?.rules ?? ""), [activeTabId, activeTab?.rules]);

  // MESSAGES
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null!);
// COST (provider)
const [lastCost, setLastCost] = useState(0);
const [totalCost, setTotalCost] = useState(0);


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

      if (!activeTabId && alive.length > 0) setActiveTabId(alive[0].id);

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
      const rows: ChatMessage[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).reverse();
      setMessages(rows);
    });

    return () => unsub();
  }, [sessionId, activeTabId]);

  // autoscroll
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // -------------------------
  // ACTIONS
  // -------------------------
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
      title: `Tab ${visibleTabs.length + 1}`,
      provider: "openai",
      rules: "",
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      owner: userId,
    });
    setActiveTabId(id);
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

    const messagesRef = collection(db, "sessions", sessionId, "tabs", activeTabId, "messages");

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

    // call API
    let aiText = "…";
    try {
      const res = await fetch("/api/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, rules: rulesDraft }),
      });
      const data = await res.json();
aiText = data?.finalText ?? "⚠️ Risposta vuota.";

// ✅ QUI (subito dopo aiText)
const cost = data?.cost ?? null;
setLastCost(Number(cost?.totalCost ?? 0));
setTotalCost((prev) => prev + Number(cost?.totalCost ?? 0));


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

   return (
    <main className="h-screen w-screen flex bg-black text-neutral-100 overflow-hidden">
      {/* Sidebar sinistra (ChatGPT-like) */}
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
      />

      {/* Colonna principale */}
      <section className="flex-1 min-w-0 flex flex-col">
        {/* Header top */}
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
/>

          </div>
        </div>

        {/* Tabs + Rules */}
        <div className="shrink-0 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-8 py-5">

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTabId(t.id)}
className={`shrink-0 rounded-full px-5 py-2.5 text-[15px] font-medium border transition whitespace-nowrap ${
  t.id === activeTabId
    ? "border-white/35 bg-white/15 text-white shadow-sm"
    : "border-white/15 bg-white/0 text-white/85 hover:bg-white/10 hover:border-white/25"
}`}

                  title={t.title || "Tab"}
                >
                  {t.title || "Tab"}
                </button>
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

        {/* Area messaggi (scroll) */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-6">
            <ChatMessagesView messages={messages} bottomRef={bottomRef} />
          </div>
        </div>

        {/* Input (sticky bottom, come ChatGPT) */}
        <div className="shrink-0 border-t border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-8 py-5">

            <ChatInput
              input={input}
              setInput={setInput}
              onSend={sendMessage}
              disabled={!userId}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
