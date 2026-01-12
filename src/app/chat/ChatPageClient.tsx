"use client";
// ======================================================
// ChatPageClient — V8 (Multi-session + Tabs + Archivio/Cestino)
// Path: src/app/chat/ChatPageClient.tsx
//
// Risultato:
// - Archivio: lista chat principali (sessions)
// - Cestino: sessions deleted=true
// - Switch session: ripristina tabs+messaggi della session
// - Tabs: restano come ora (sessions/{sid}/threads/{tid}/messages)
// ======================================================

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  collection,
  addDoc,
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

// UI
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ChatOrchestratorSidebar from "./components/ChatOrchestratorSidebar";
import ChatSidePanels from "./components/ChatSidePanels";

/* =========================
   TIPI
========================= */
type ProviderId = "openai";

type SessionMetaLite = {
  id: string;
  title?: string | null;
  lastMessage?: string | null;
  updatedAt?: any;
};

interface ThreadDoc {
  id: string;
  title: string;
  provider: ProviderId;
  rules: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Message {
  id?: string;
  sender: "user" | "anova";
  text: string;
  createdAt?: any;
}

/* =========================
   LOCAL STORAGE (SSR-safe)
========================= */
const hasWindow = () => typeof window !== "undefined";
const safeGet = (k: string) => (hasWindow() ? window.localStorage.getItem(k) : null);
const safeSet = (k: string, v: string) => {
  if (hasWindow()) window.localStorage.setItem(k, v);
};

/* =========================
   HELPERS
========================= */
function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* =========================
   COMPONENT
========================= */
export default function ChatPageClient() {
  // -------------------------
  // 0) USER
  // -------------------------
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // -------------------------
  // 1) ARCHIVIO / CESTINO (sessions)
  // -------------------------
  const [sessions, setSessions] = useState<SessionMetaLite[]>([]);
  const [trashSessions, setTrashSessions] = useState<SessionMetaLite[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  // inline rename (usato da ChatSidePanels)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>("");

  // -------------------------
  // 2) SESSION ATTIVA (chat principale)
  // -------------------------
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  // -------------------------
  // 3) THREADS (tabs) della session
  // -------------------------
  const [threads, setThreads] = useState<ThreadDoc[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  // -------------------------
  // 3.1) RULES UI (debounce)
  // -------------------------
  const [rulesDraft, setRulesDraft] = useState<string>("");
  const rulesDebounceRef = useRef<any>(null);

  useEffect(() => {
    setRulesDraft(activeThread?.rules ?? "");
  }, [activeThreadId, activeThread?.rules]);

  // -------------------------
  // 4) MESSAGES (per tab)
  // -------------------------
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // -------------------------
  // 5) UX
  // -------------------------
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [orchWidth, setOrchWidth] = useState(420);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // -------------------------
  // 6) LISTENER: archivio e cestino (sessions)
  // -------------------------
  useEffect(() => {
    if (!userId) return;

    // ARCHIVIO
    const qArchive = query(
      collection(db, "sessions"),
      where("owner", "==", userId),
      where("deleted", "==", false),
      orderBy("updatedAt", "desc")
    );

    const unsubA = onSnapshot(qArchive, (snap) => {
      const rows: SessionMetaLite[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setSessions(rows);
    });

    // CESTINO
    const qTrash = query(
      collection(db, "sessions"),
      where("owner", "==", userId),
      where("deleted", "==", true),
      orderBy("updatedAt", "desc")
    );

    const unsubT = onSnapshot(qTrash, (snap) => {
      const rows: SessionMetaLite[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setTrashSessions(rows);
    });

    return () => {
      unsubA();
      unsubT();
    };
  }, [userId]);

  // -------------------------
  // 7) BOOTSTRAP: session attiva
  // - se esiste in localStorage -> usa quella
  // - altrimenti -> prima session archivio
  // - se non esiste nulla -> crea nuova session
  // -------------------------
  const didPickInitialSessionRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (didPickInitialSessionRef.current) return;

    // aspettiamo almeno un giro di lista sessions
    // (anche vuota va bene, se non c'è nulla creiamo)
    const saved = safeGet("anovaActiveSessionId");

    if (saved) {
      didPickInitialSessionRef.current = true;
      setSessionId(saved);
      return;
    }

    if (sessions.length > 0) {
      didPickInitialSessionRef.current = true;
      setSessionId(sessions[0].id);
      safeSet("anovaActiveSessionId", sessions[0].id);
      return;
    }

    // nessuna session: creiamone una
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
      didPickInitialSessionRef.current = true;
      setSessionId(sid);
      safeSet("anovaActiveSessionId", sid);
    })();
  }, [userId, sessions]);

  // -------------------------
  // 8) LISTENER: session doc (title)
  // -------------------------
  useEffect(() => {
    if (!sessionId) return;

    const sessRef = doc(db, "sessions", sessionId);
    const unsub = onSnapshot(sessRef, (snap) => {
      const t = (snap.data()?.title || "") as string;
      setSessionTitle(t);
    });

    return () => unsub();
  }, [sessionId]);

  // -------------------------
  // 9) LISTENER THREADS (tabs)
  // Path: sessions/{sid}/threads
  // -------------------------
  const didBootstrapMainRef = useRef(false);

  // reset guard quando cambi session
  useEffect(() => {
    didBootstrapMainRef.current = false;
    setThreads([]);
    setActiveThreadId(null);
    setMessages([]);
    setDebugInfo(null);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    if (!userId) return;

    const threadsRef = collection(db, "sessions", sessionId, "threads");
    const qy = query(threadsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(qy, async (snap) => {
      const rows: ThreadDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setThreads(rows);

      // bootstrap main una sola volta per session
      if (rows.length === 0 && !didBootstrapMainRef.current) {
        didBootstrapMainRef.current = true;

        const firstId = "main";
        const ref = doc(db, "sessions", sessionId, "threads", firstId);

        await setDoc(
          ref,
          {
            title: "Main",
            provider: "openai",
            rules: "Se ti chiedono chi sei, ti presenti come ANOVA (orchestratore di AI).",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            owner: userId,
          },
          { merge: true }
        );

        setActiveThreadId(firstId);
        return;
      }

      if (!activeThreadId && rows.length > 0) {
        setActiveThreadId(rows[0].id);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId]);

  // -------------------------
  // 10) LISTENER MESSAGES (per thread/tab)
  // Path: sessions/{sid}/threads/{tid}/messages
  // -------------------------
  useEffect(() => {
    if (!sessionId) return;
    if (!activeThreadId) return;

    const messagesRef = collection(db, "sessions", sessionId, "threads", activeThreadId, "messages");
    const qy = query(messagesRef, orderBy("createdAt", "desc"), limit(80));

    const unsub = onSnapshot(qy, (snap) => {
      const rows: Message[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).reverse();
      setMessages(rows);
    });

    return () => unsub();
  }, [sessionId, activeThreadId]);

  // -------------------------
  // 11) AUTOSCROLL
  // -------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------
  // 12) TITLE COMMIT (session)
  // -------------------------
  const commitActiveTitle = async () => {
    if (!sessionId) return;
    const clean = sessionTitle.trim();

    await updateDoc(doc(db, "sessions", sessionId), {
      title: clean ? clean : null,
      updatedAt: serverTimestamp(),
    });

    setEditingTitle(false);
    setToastMessage("✏️ Titolo aggiornato");
    setTimeout(() => setToastMessage(null), 1200);
  };

  // -------------------------
  // 13) THREAD/TAB ACTIONS
  // -------------------------
  async function addThread() {
    if (!sessionId || !userId) return;

    const id = newId();
    const ref = doc(db, "sessions", sessionId, "threads", id);

    await setDoc(ref, {
      title: `Tab ${threads.length + 1}`,
      provider: "openai",
      rules: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      owner: userId,
    });

    setActiveThreadId(id);
  }

  async function persistThreadRules(next: string) {
    if (!sessionId || !activeThreadId) return;
    await updateDoc(doc(db, "sessions", sessionId, "threads", activeThreadId), {
      rules: next,
      updatedAt: serverTimestamp(),
    });
  }

  function onRulesChange(next: string) {
    setRulesDraft(next);
    if (rulesDebounceRef.current) clearTimeout(rulesDebounceRef.current);
    rulesDebounceRef.current = setTimeout(() => {
      persistThreadRules(next);
    }, 600);
  }

  function onRulesBlur() {
    if (!activeThread) return;
    if (rulesDraft !== (activeThread.rules ?? "")) {
      persistThreadRules(rulesDraft);
    }
  }

  // -------------------------
  // 14) ARCHIVIO HANDLERS
  // -------------------------
  function startInlineRename(id: string, currentTitle?: string | null) {
    setInlineEditId(id);
    setInlineEditValue((currentTitle || "").trim());
  }

  async function commitInlineRename(id: string) {
    if (!inlineEditId) return;
    const clean = inlineEditValue.trim();

    await updateDoc(doc(db, "sessions", id), {
      title: clean ? clean : null,
      updatedAt: serverTimestamp(),
    });

    setInlineEditId(null);
    setInlineEditValue("");
  }

  async function handleOpenSession(id: string) {
    setShowArchive(false);
    setShowTrash(false);
    setInlineEditId(null);
    setInlineEditValue("");

    setSessionId(id);
    safeSet("anovaActiveSessionId", id);
  }

  async function handleDeleteSession(id: string) {
    await updateDoc(doc(db, "sessions", id), {
      deleted: true,
      updatedAt: serverTimestamp(),
    });
  }

  async function handleRestoreSession(id: string) {
    await updateDoc(doc(db, "sessions", id), {
      deleted: false,
      updatedAt: serverTimestamp(),
    });
  }

  async function handleNewSession() {
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

    setToastMessage("✅ Nuova chat creata");
    setTimeout(() => setToastMessage(null), 1200);
  }

  // -------------------------
  // 15) SEND MESSAGE + ORCHESTRATE
  // -------------------------
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!sessionId || !activeThreadId) return;

    if (!userId) {
      setToastMessage("⏳ Connessione utente in corso, riprova.");
      setTimeout(() => setToastMessage(null), 1500);
      return;
    }

    const messagesRef = collection(db, "sessions", sessionId, "threads", activeThreadId, "messages");

    // 1) salva msg utente
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

    // 2) chiama orchestrate
    let aiResponse = "Elaborazione in corso...";

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          sessionId,
          userId,
          thread: {
            id: activeThreadId,
            title: activeThread?.title ?? "",
            provider: activeThread?.provider ?? "openai",
            rules: rulesDraft ?? activeThread?.rules ?? "",
          },
        }),
      });

      const data = await res.json();

      setDebugInfo({
        raw: data.raw || [],
        meta: data.meta || {},
      });

      aiResponse = data?.finalText || data?.fusion?.finalText || "⚠️ Nessuna risposta utile.";
    } catch (err) {
      console.error("Errore chiamata orchestratore:", err);
      aiResponse = "❌ Errore nel motore. Riprova.";
    }

    // 3) salva risposta anova
    await addDoc(messagesRef, {
      sender: "anova",
      text: aiResponse,
      createdAt: serverTimestamp(),
      owner: userId,
    });

    await updateDoc(doc(db, "sessions", sessionId), {
      updatedAt: serverTimestamp(),
      lastMessage: aiResponse,
    });
  };

  // -------------------------
  // 16) UI
  // -------------------------
  const handleToggleOrchestrator = () => setShowOrchestrator((v) => !v);

  return (
    <main className="h-screen w-screen flex bg-black text-neutral-100 relative overflow-hidden">
      {/* ARCHIVIO + CESTINO */}
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
        handleOpenSession={handleOpenSession}
        handleDeleteSession={handleDeleteSession}
        handleRestoreSession={handleRestoreSession}
      />

      {/* Colonna centrale */}
      <div
        className="flex-1 flex flex-col transition-all duration-200"
        style={{
          width: showOrchestrator ? `calc(100vw - ${orchWidth}px)` : "100vw",
          marginRight: showOrchestrator ? `${orchWidth}px` : 0,
        }}
      >
        <ChatHeader
          sessionId={sessionId}
          sessionTitle={sessionTitle}
          setSessionTitle={setSessionTitle}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          onCommitTitle={commitActiveTitle}
          onOpenArchive={() => {
            setShowTrash(false);
            setShowArchive(true);
          }}
          onOpenTrash={() => {
            setShowArchive(false);
            setShowTrash(true);
          }}
          onNewSession={handleNewSession}
          onAddTab={addThread}
          showOrchestrator={showOrchestrator}
          onToggleOrchestrator={handleToggleOrchestrator}
        />

        {/* Tabs bar + Rules box */}
        <div className="border-b border-neutral-800 bg-neutral-950 px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm border transition ${
                  t.id === activeThreadId
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-white/10 bg-white/0 text-white/70 hover:bg-white/5"
                }`}
              >
                {t.title || "Tab"}
                <span className="ml-2 text-[11px] text-white/40">{t.provider}</span>
              </button>
            ))}

            <button
              onClick={addThread}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm border border-white/15 bg-white/0 hover:bg-white/5"
              title="Aggiungi sotto-chat"
            >
              + Tab
            </button>
          </div>

          <div className="mt-2">
            <div className="text-xs text-white/60 mb-1">Regole (solo per questa tab)</div>
            <textarea
              value={rulesDraft}
              onChange={(e) => onRulesChange(e.target.value)}
              onBlur={onRulesBlur}
              placeholder="Scrivi regole operative. Più lunghe = più token."
              rows={3}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/25"
            />
          </div>
        </div>

        <ChatMessages messages={messages} bottomRef={bottomRef} />
        <ChatInput input={input} setInput={setInput} onSend={handleSend} disabled={false} />
      </div>

      {/* Sidebar orchestratore (debug) */}
      <ChatOrchestratorSidebar
        open={showOrchestrator}
        width={orchWidth}
        setWidth={setOrchWidth}
        onClose={() => setShowOrchestrator(false)}
        debugInfo={debugInfo}
        contract={null}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
