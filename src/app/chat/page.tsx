"use client";

// ❗ Disabilito ogni forma di prerender/SSR per la pagina
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AiUsage, ProviderKey } from "@/types/ai";
import { EMPTY_AI_USAGE } from "@/types/ai";

import AICostPanel from "@/components/panels/AICostPanel";
import FirestoreCostPanel from "@/components/panels/FirestoreCostPanel";

import ChatHeader from "././components/ChatHeader";
import ChatMessages from "././components/ChatMessages";
import ChatInput from "././components/ChatInput";
import ChatSidePanels from "././components/ChatSidePanels";
import ChatOrchestratorSidebar from "././components/ChatOrchestratorSidebar";

// ⬇️ BLOCCO 1 — Setup userId locale (placeholder fino a Firebase Auth)
// Nota: userId attuale = sessionId persistente dell’utente
let userId: string | null = null;
if (typeof window !== "undefined") {
  userId = window.localStorage.getItem("anovaUserId");
  if (!userId) {
    userId = "user_" + Date.now().toString();
    window.localStorage.setItem("anovaUserId", userId);
  }
}
// ⬆️ FINE BLOCCO 1

/* ===========================
   Tipi interni
   =========================== */
interface Message {
  id?: string;
  sender: "user" | "anova";
  text: string;
  createdAt?: any;
}

interface SessionMeta {
  id: string;
  title?: string | null;
  createdAt?: any;
  updatedAt?: any;
  lastMessage?: string | null;
  deleted?: boolean;
}

type SessionCache = {
  [sid: string]: { messages: Message[]; title: string; ts: number };
};

/* ===========================
   Helpers LocalStorage SSR-safe
   =========================== */
const hasWindow = () => typeof window !== "undefined";
const safeGet = (k: string) => (hasWindow() ? window.localStorage.getItem(k) : null);
const safeSet = (k: string, v: string) => {
  if (hasWindow()) window.localStorage.setItem(k, v);
};
const safeRemove = (k: string) => {
  if (hasWindow()) window.localStorage.removeItem(k);
};

// Cache sessioni in memoria (per riaperture rapide)
const CACHE_TTL_MS = 30_000;

// Chiave unica per uso AI
const AI_USAGE_LS_KEY = "anovaAiUsageV1";

/* ===========================
   Pagina Chat
   =========================== */
export default function ChatPage() {
  // Messaggi e input
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Debug tecnico AI (orchestratore)
  const [debugInfo, setDebugInfo] = useState<any | null>(null);

  // Orchestratore laterale
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [orchWidth, setOrchWidth] = useState(420); // larghezza iniziale sidebar

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Sessioni
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  const [showArchive, setShowArchive] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [trashSessions, setTrashSessions] = useState<SessionMeta[]>([]);

  // Rinomina inline archivio/cestino
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>("");

  // Pannelli
  const [showAICostPanel, setShowAICostPanel] = useState(false);
  const [showFirestorePanel, setShowFirestorePanel] = useState(false);
  const [showPanelsMenu, setShowPanelsMenu] = useState(false);

  // Contatori Firestore
  const [totalReads, setTotalReads] = useState<number>(0);
  const [totalWrites, setTotalWrites] = useState<number>(0);

  // Uso cumulativo delle AI (persistente)
  const [aiUsage, setAiUsage] = useState<AiUsage>(() => {
    if (!hasWindow()) return EMPTY_AI_USAGE;
    try {
      const raw = safeGet(AI_USAGE_LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // se corrotto, riparto pulito
    }
    return EMPTY_AI_USAGE;
  });

  // Helpers costo Firestore
  const incRead = (n = 1) => setTotalReads((v) => v + n);
  const incWrite = (n = 1) => setTotalWrites((v) => v + n);

// Persistenza contatori — FIX per evitare reset
useEffect(() => {
  if (!hasWindow()) return;

  const savedR = safeGet("anovaTotalReads");
  const savedW = safeGet("anovaTotalWrites");

  // Evito assolutamente di sovrascrivere valori esistenti al boot
  if (savedR !== null && savedW !== null) {
    setTotalReads(parseInt(savedR, 10) || 0);
    setTotalWrites(parseInt(savedW, 10) || 0);
  }
}, []);

// Salvataggio SOLO dopo il bootstrap iniziale
useEffect(() => {
  if (!hasWindow()) return;
  if (totalReads === 0 && totalWrites === 0) return; // evita sovrascritture iniziali
  safeSet("anovaTotalReads", String(totalReads));
  safeSet("anovaTotalWrites", String(totalWrites));
}, [totalReads, totalWrites]);


  // Persistenza uso AI
  useEffect(() => {
    if (!hasWindow()) return;
    safeSet(AI_USAGE_LS_KEY, JSON.stringify(aiUsage));
  }, [aiUsage]);

  // Bootstrap: carico contatori + creo/recupero sessione
  useEffect(() => {
    if (!hasWindow()) return;

    const savedR = safeGet("anovaTotalReads");
    const savedW = safeGet("anovaTotalWrites");
    if (savedR) setTotalReads(parseInt(savedR, 10) || 0);
    if (savedW) setTotalWrites(parseInt(savedW, 10) || 0);

    let sid = safeGet("anovaSessionId");
    if (!sid) {
      sid = Date.now().toString();
      safeSet("anovaSessionId", sid);
    }
    setSessionId(sid);

    const sessRef = doc(db, "sessions", sid);
    setDoc(
      sessRef,
      {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "Sessione avviata.",
        deleted: false,
      },
      { merge: true }
    ).then(() => incWrite());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cache in-memory + riferimenti listener
  const cacheRef = useRef<SessionCache>({});
  const activeMsgUnsubRef = useRef<null | (() => void)>(null);
  const activeTitleUnsubRef = useRef<null | (() => void)>(null);
  const delayedAttachTimerRef = useRef<null | number>(null);

// Listener Archivio + Cestino (ON-DEMAND)
useEffect(() => {
  if (!showArchive && !showTrash) return; // 🟢 se i pannelli sono chiusi, zero read

  const sessionsRef = collection(db, "sessions");
  const qAll = query(sessionsRef, orderBy("updatedAt", "desc"), limit(100));

  const unsub = onSnapshot(qAll, { includeMetadataChanges: false }, (snap) => {
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    setSessions(list.filter((s) => !s.deleted));
    setTrashSessions(list.filter((s) => s.deleted));

    incRead(Math.max(1, snap.docChanges().length));
  });

  return () => unsub();
}, [showArchive, showTrash]);


  // Listener Sessione attiva (titolo + messaggi) con cache intelligente
  useEffect(() => {
    // cleanup vecchi listener
    if (activeMsgUnsubRef.current) {
      activeMsgUnsubRef.current();
      activeMsgUnsubRef.current = null;
    }
    if (activeTitleUnsubRef.current) {
      activeTitleUnsubRef.current();
      activeTitleUnsubRef.current = null;
    }
    if (delayedAttachTimerRef.current && hasWindow()) {
      window.clearTimeout(delayedAttachTimerRef.current);
      delayedAttachTimerRef.current = null;
    }

    if (!sessionId) return;

    const cached = cacheRef.current[sessionId];
    const now = Date.now();
    const fresh = cached && now - cached.ts < CACHE_TTL_MS;

    if (fresh) {
      setMessages(cached.messages);
      setSessionTitle(cached.title || "");

      const delay = CACHE_TTL_MS - (now - cached.ts);
      if (hasWindow()) {
        delayedAttachTimerRef.current = window.setTimeout(() => {
          attachActiveTitleListener(sessionId);
          attachActiveMessagesListener(sessionId);
        }, Math.max(0, delay));
      }
      return;
    }

    attachActiveTitleListener(sessionId);
    attachActiveMessagesListener(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-scroll in fondo quando arrivano messaggi
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Attach titolo
  const attachActiveTitleListener = (sid: string) => {
    const sessRef = doc(db, "sessions", sid);
    activeTitleUnsubRef.current = onSnapshot(
      sessRef,
      { includeMetadataChanges: false },
      (snap) => {
        const t = (snap.data()?.title || "") as string;
        setSessionTitle(t);
        incRead(1);

        cacheRef.current[sid] = {
          messages: cacheRef.current[sid]?.messages || [],
          title: t,
          ts: Date.now(),
        };
      }
    );
  };

  // Attach messaggi (incrementale + low read)
  const attachActiveMessagesListener = (sid: string) => {
    const messagesRef = collection(db, "sessions", sid, "messages");
    const qy = query(messagesRef, orderBy("createdAt", "desc"), limit(50));

    activeMsgUnsubRef.current = onSnapshot(
      qy,
      { includeMetadataChanges: false },
      (snap) => {
        const changes = snap.docChanges();

        setMessages((prev) => {
          let updated = prev.length ? [...prev] : [];

          if (updated.length === 0) {
            const first: Message[] = snap.docs
              .map((d) => ({ id: d.id, ...(d.data() as Message) }))
              .reverse();
            updated = first;
            incRead(changes.length > 0 ? changes.length : first.length || 1);

            cacheRef.current[sid] = {
              messages: first,
              title: cacheRef.current[sid]?.title || sessionTitle || "",
              ts: Date.now(),
            };
            return first;
          }

          for (const c of changes) {
            const data = { id: c.doc.id, ...(c.doc.data() as Message) };
            if (c.type === "added") {
              if (!updated.find((m) => m.id === data.id)) updated.push(data);
            } else if (c.type === "modified") {
              const idx = updated.findIndex((m) => m.id === data.id);
              if (idx !== -1) updated[idx] = data;
            } else if (c.type === "removed") {
              updated = updated.filter((m) => m.id !== data.id);
            }
          }

          updated.sort(
            (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
          );
          incRead(Math.max(1, changes.length));

          cacheRef.current[sid] = {
            messages: updated,
            title: cacheRef.current[sid]?.title || sessionTitle || "",
            ts: Date.now(),
          };

          return updated;
        });
      }
    );
  };

  /* ===========================
     Gestione sessioni
     =========================== */

  const handleNewSession = async () => {
    const newId = Date.now().toString();
    safeSet("anovaSessionId", newId);
    setSessionId(newId);

    const sessRef = doc(db, "sessions", newId);
    await setDoc(sessRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "Sessione avviata. Pronta per lavorare insieme.",
      deleted: false,
      owner: userId,
    });
    incWrite(2);

    const messagesRef = collection(db, "sessions", newId, "messages");
    await addDoc(messagesRef, {
      sender: "anova",
      text: "Sessione avviata. Pronta per lavorare insieme.",
      createdAt: serverTimestamp(),
      owner: userId,
    });
    incWrite();

    setMessages([]);
    setSessionTitle("");
    cacheRef.current[newId] = { messages: [], title: "", ts: Date.now() };

    setToastMessage("✅ Nuova sessione avviata");
    setTimeout(() => setToastMessage(null), 1800);
  };

  const commitActiveTitle = async () => {
    if (!sessionId) return;
    const clean = sessionTitle?.trim();

    await updateDoc(doc(db, "sessions", sessionId), {
      title: clean ? clean : null,
      updatedAt: serverTimestamp(),
    });
    incWrite();

    cacheRef.current[sessionId] = {
      messages: cacheRef.current[sessionId]?.messages || [],
      title: clean || "",
      ts: Date.now(),
    };

    setEditingTitle(false);
    setToastMessage("✏️ Titolo aggiornato");
    setTimeout(() => setToastMessage(null), 1200);
  };

  const startInlineRename = (id: string, currentTitle?: string | null) => {
    setInlineEditId(id);
    setInlineEditValue((currentTitle || "").trim() || `#${id.slice(-6)}`);
  };

  const commitInlineRename = async (id: string) => {
    const value = inlineEditValue.trim();
    await updateDoc(doc(db, "sessions", id), {
      title: value || null,
      updatedAt: serverTimestamp(),
    });
    incWrite();

    if (id === sessionId) {
      setSessionTitle(value);
      cacheRef.current[id] = {
        messages: cacheRef.current[id]?.messages || [],
        title: value,
        ts: Date.now(),
      };
    }

    setInlineEditId(null);
    setInlineEditValue("");
    setToastMessage("✏️ Titolo aggiornato");
    setTimeout(() => setToastMessage(null), 1000);
  };

  const handleOpenSession = (id: string) => {
    safeSet("anovaSessionId", id);
    setSessionId(id);
    setShowArchive(false);
    setShowTrash(false);
    setToastMessage("📂 Sessione caricata");
    setTimeout(() => setToastMessage(null), 1000);
  };

  const handleDeleteSession = async (id: string) => {
    await updateDoc(doc(db, "sessions", id), {
      deleted: true,
      updatedAt: serverTimestamp(),
    });
    incWrite();
    setToastMessage("🗑️ Spostata nel cestino");
    setTimeout(() => setToastMessage(null), 1200);
  };

  const handleRestoreSession = async (id: string) => {
    await updateDoc(doc(db, "sessions", id), {
      deleted: false,
      updatedAt: serverTimestamp(),
    });
    incWrite();
    setToastMessage("♻️ Sessione ripristinata");
    setTimeout(() => setToastMessage(null), 1200);
  };

  /* ===========================
     Invio messaggi + orchestratore
     =========================== */

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !sessionId) return;

    const messagesRef = collection(db, "sessions", sessionId, "messages");

    // 1️⃣ Messaggio utente
    await addDoc(messagesRef, {
      sender: "user",
      text: trimmed,
      createdAt: serverTimestamp(),
      owner: userId
    });
    incWrite(2);

    await updateDoc(doc(db, "sessions", sessionId), {
      updatedAt: serverTimestamp(),
      lastMessage: trimmed,
    });
    incWrite();

    setInput("");

    // 2️⃣ Chiamata orchestratore
    let aiResponse = "Elaborazione in corso...";
    let costThisRequest = 0;
    let rawProviders: any[] = [];

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, userId: sessionId }),
      });

      const data = await res.json();

      setDebugInfo({
        // per pannelli tecnici
        raw: data.raw || [],
        meta: data.meta || {},
      });

      aiResponse =
        data?.fusion?.finalText ||
        "⚠️ Nessuna risposta utile dall'orchestratore.";

      costThisRequest = data?.costThisRequest ?? 0;
      rawProviders = Array.isArray(data?.raw) ? data.raw : [];

      console.log("🧠 ANOVA β — Risposta fusa:", data.fusion);
      console.log("🧠 ANOVA β — Meta:", data.meta);
      console.log("🧠 ANOVA β — Costo richiesta:", costThisRequest);
    } catch (err) {
      console.error("Errore chiamata orchestratore:", err);
      aiResponse = "❌ Errore nel motore cognitivo. Riprova.";
    }

    // 3️⃣ Aggiorno uso AI cumulativo
    if (rawProviders.length > 0 || costThisRequest > 0) {
      setAiUsage((prev) => {
        const next: AiUsage = {
          ...prev,
          totalCalls: prev.totalCalls,
          totalCostUsd: prev.totalCostUsd + costThisRequest,
          totalTokens: prev.totalTokens,
          perProvider: { ...prev.perProvider },
        };

        (rawProviders as any[]).forEach((r) => {
          const pid = r.provider as ProviderKey;
          if (!pid || !next.perProvider[pid]) return;

          const cost = r.estimatedCost ?? 0;
          const tokens = r.tokensUsed ?? 0;

          next.totalCalls += 1;
          next.totalTokens += tokens;

          const prevProv = next.perProvider[pid];
          next.perProvider[pid] = {
            calls: prevProv.calls + 1,
            costUsd: prevProv.costUsd + cost,
            tokens: prevProv.tokens + tokens,
          };
        });

        return next;
      });
    }

    // 4️⃣ Salvo la risposta di Anova
    await addDoc(messagesRef, {
      sender: "anova",
      text: aiResponse,
      createdAt: serverTimestamp(),
      owner: userId
    });
    incWrite(2);

    await updateDoc(doc(db, "sessions", sessionId), {
      updatedAt: serverTimestamp(),
      lastMessage: aiResponse,
    });
    incWrite();

    cacheRef.current[sessionId] = {
      messages: [
        ...(cacheRef.current[sessionId]?.messages || []),
        { sender: "user", text: trimmed },
        { sender: "anova", text: aiResponse },
      ],
      title: cacheRef.current[sessionId]?.title || sessionTitle || "",
      ts: Date.now(),
    };
  };

  /* ===========================
     UI
     =========================== */

  const handleToggleOrchestrator = () => {
    setShowOrchestrator((v) => !v);
  };

  return (
    <main className="h-screen w-screen flex bg-black text-neutral-100 relative overflow-hidden">
      {/* Sidebar archivio + cestino */}
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

      {/* Colonna centrale: Header fisso + Messaggi + Input */}
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
          onNewSession={handleNewSession}
          showArchive={showArchive}
          showTrash={showTrash}
          onToggleArchive={() => setShowArchive((v) => !v)}
          onToggleTrash={() => setShowTrash((v) => !v)}
          showPanelsMenu={showPanelsMenu}
          setShowPanelsMenu={setShowPanelsMenu}
          onOpenAICostPanel={() => setShowAICostPanel(true)}
          onOpenFirestorePanel={() => setShowFirestorePanel(true)}
          showOrchestrator={showOrchestrator}
          onToggleOrchestrator={handleToggleOrchestrator}
        />

        <ChatMessages messages={messages} bottomRef={bottomRef} />

        <ChatInput input={input} setInput={setInput} onSend={handleSend} />
      </div>

      {/* Pannelli modali */}

      {showAICostPanel && (
        <AICostPanel aiUsage={aiUsage} onClose={() => setShowAICostPanel(false)} />
      )}

      {showFirestorePanel && (
        <FirestoreCostPanel
          totalReads={totalReads}
          totalWrites={totalWrites}
          onClose={() => setShowFirestorePanel(false)}
        />
      )}

      {/* Sidebar orchestratore con drag */}
      <ChatOrchestratorSidebar
        open={showOrchestrator}
        width={orchWidth}
        setWidth={setOrchWidth}
        onClose={() => setShowOrchestrator(false)}
        debugInfo={debugInfo}
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
// ⬆️ FINE BLOCCO 15.0 — ChatPage v5
