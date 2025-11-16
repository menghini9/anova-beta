// ⬇️ BLOCCO 14.0 — ANOVA β Chat v4.1 (Definitiva: SSR-safe + Cache + Low Read + Persistenza)
"use client";

// ❗️ Disabilito ogni forma di prerender/SSR per la pagina
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useRef, useState } from "react";
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
import AITechPanel from "@/components/panels/AITechPanel";

/* =========================================================
   🧩 Tipi
   ========================================================= */
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

/* =========================================================
   🔒 Helpers SSR-safe per localStorage
   ========================================================= */
const hasWindow = () => typeof window !== "undefined";
const safeGet = (k: string) => (hasWindow() ? window.localStorage.getItem(k) : null);
const safeSet = (k: string, v: string) => {
  if (hasWindow()) window.localStorage.setItem(k, v);
};
const safeRemove = (k: string) => {
  if (hasWindow()) window.localStorage.removeItem(k);
};

/* =========================================================
   🔢 Prezzi (piano Blaze indicativo)
   ========================================================= */
const PRICE_READS_PER_100K = 0.06;
const PRICE_WRITES_PER_100K = 0.18;

// ⬇️ BLOCCO 14.1.A — Costanti AI mancanti (ripristinate)
// 🔐 Chiave per salvare su localStorage
const AI_USAGE_LS_KEY = "anova_ai_usage_v2";

// 💰 Prezzi simulati (USD per 1000 token)
const AI_PRICE_TABLE: Record<ProviderKey, { inPer1K: number; outPer1K: number }> = {
  openai: { inPer1K: 0.003, outPer1K: 0.006 },
  anthropic: { inPer1K: 0.003, outPer1K: 0.006 },
  gemini: { inPer1K: 0.002, outPer1K: 0.004 },
  mistral: { inPer1K: 0.002, outPer1K: 0.006 },
  llama: { inPer1K: 0.001, outPer1K: 0.002 },
  web: { inPer1K: 0.0005, outPer1K: 0.0005 },
};

// ⬆️ FINE BLOCCO 14.2


/* =========================================================
   🧠 Cache Intelligente (in-memory)
   - evita riattacchi immediati del listener su riaperture ravvicinate
   - TTL configurabile (ms)
   ========================================================= */
type SessionCache = {
  [sid: string]: { messages: Message[]; title: string; ts: number };
};
const CACHE_TTL_MS = 30_000;

/* =========================================================
   ⛳ Pagina Chat
   ========================================================= */
export default function ChatPage() {

const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  setHydrated(true);
}, []);

  // Stati principali (NO accessi a localStorage in init!)
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Debug tecnico AI (non persistente)
  const [debugInfo, setDebugInfo] = useState<any | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  const [showArchive, setShowArchive] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [trashSessions, setTrashSessions] = useState<SessionMeta[]>([]);

  // Rinomina inline
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>("");

  // Ricerca
  const [searchArchive, setSearchArchive] = useState("");
  const [searchTrash, setSearchTrash] = useState("");

  // Modali pannelli
const [showTechPanel, setShowTechPanel] = useState(false);
const [showAICostPanel, setShowAICostPanel] = useState(false);
const [showFirestorePanel, setShowFirestorePanel] = useState(false);

const [showPanelsMenu, setShowPanelsMenu] = useState(false);


  // Contatori persistenti (inizializzati a 0, poi caricati in useEffect)
  const [totalReads, setTotalReads] = useState<number>(0);
  const [totalWrites, setTotalWrites] = useState<number>(0);
  
// Uso cumulativo delle AI (simulato, persistente)
const [aiUsage, setAiUsage] = useState<AiUsage>(() => {
  if (!hasWindow()) return EMPTY_AI_USAGE;

// Modali pannelli
  try {
    const raw = safeGet("anovaAiUsageV1");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch {
    // se c'è qualcosa di corrotto, ripartiamo puliti
  }

  return EMPTY_AI_USAGE;
});

  // Helpers costo
  const incRead = (n = 1) => setTotalReads((v) => v + n);
  const incWrite = (n = 1) => setTotalWrites((v) => v + n);

  // Persistenza automatica (solo client)
  useEffect(() => {
    if (!hasWindow()) return;
    safeSet("anovaTotalReads", String(totalReads));
  }, [totalReads]);
  useEffect(() => {
    if (!hasWindow()) return;
    safeSet("anovaTotalWrites", String(totalWrites));
  }, [totalWrites]);

// 💾 Salva sempre ogni cambiamento in localStorage
useEffect(() => {
  if (!hasWindow()) return;
  safeSet("anovaAiUsageV1", JSON.stringify(aiUsage));
}, [aiUsage]);



useEffect(() => {
  if (!hasWindow()) return;
  safeSet("anovaAiUsageV1", JSON.stringify(aiUsage));
}, [aiUsage]);


  const resetCounters = () => {
    safeRemove("anovaTotalReads");
    safeRemove("anovaTotalWrites");
    setTotalReads(0);
    setTotalWrites(0);
  };

  // Cache in-memory e gestione listener
  const cacheRef = useRef<SessionCache>({});
  const activeMsgUnsubRef = useRef<null | (() => void)>(null);
  const activeTitleUnsubRef = useRef<null | (() => void)>(null);
  const delayedAttachTimerRef = useRef<null | number>(null);

  // ---------------------------------------
  // Bootstrap lato client (carica LS e crea/recupera sessione)
  // ---------------------------------------
  useEffect(() => {
    if (!hasWindow()) return;

    // carico contatori persistenti
    const savedR = safeGet("anovaTotalReads");
    const savedW = safeGet("anovaTotalWrites");
    if (savedR) setTotalReads(parseInt(savedR, 10) || 0);
    if (savedW) setTotalWrites(parseInt(savedW, 10) || 0);

    // sessione
    let sid = safeGet("anovaSessionId");
    if (!sid) {
      sid = Date.now().toString();
      safeSet("anovaSessionId", sid);
    }
    setSessionId(sid);

    // crea/merge doc sessione
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

  // ---------------------------------------
  // Listener Archivio + Cestino (Low Read Mode)
  // ---------------------------------------
  useEffect(() => {
    const sessionsRef = collection(db, "sessions");
    const qAll = query(sessionsRef, orderBy("updatedAt", "desc"), limit(100));

    const unsub = onSnapshot(qAll, { includeMetadataChanges: false }, (snap) => {
      const list: SessionMeta[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SessionMeta, "id">),
      }));
      setSessions(list.filter((s) => !s.deleted));
      setTrashSessions(list.filter((s) => s.deleted));

      // conteggio letture realistico: #docChanges (fallback 1)
      const changes = snap.docChanges().length;
      incRead(Math.max(1, changes));
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------
  // Gestione Listener per Sessione Attiva (Title + Messages) con Cache
  // ---------------------------------------
  useEffect(() => {
    // cleanup precedente
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

    // prova cache
    const cached = cacheRef.current[sessionId];
    const now = Date.now();
    const fresh = cached && now - cached.ts < CACHE_TTL_MS;

    if (fresh) {
      setMessages(cached.messages);
      setSessionTitle(cached.title || "");
      // attacco listener con ritardo residuo
      const delay = CACHE_TTL_MS - (now - cached.ts);
      if (hasWindow()) {
        delayedAttachTimerRef.current = window.setTimeout(() => {
          attachActiveTitleListener(sessionId);
          attachActiveMessagesListener(sessionId);
        }, Math.max(0, delay));
      }
      return;
    }

    // senza cache fresca: attacca subito
    attachActiveTitleListener(sessionId);
    attachActiveMessagesListener(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },
  [sessionId]);
    useEffect(() => {
    if (!hasWindow()) return;
    const raw = safeGet(AI_USAGE_LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setAiUsage((prev) => ({ ...prev, ...parsed }));
    } catch {
      // se il JSON è corrotto, riparto da zero
    }
  }, []);

useEffect(() => {
  if (bottomRef.current) {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  // attach titolo
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

  // attach messaggi (incrementale + low read)
  const attachActiveMessagesListener = (sid: string) => {
    const messagesRef = collection(db, "sessions", sid, "messages");
    const qy = query(messagesRef, orderBy("createdAt", "desc"), limit(50));

    activeMsgUnsubRef.current = onSnapshot(qy, { includeMetadataChanges: false }, (snap) => {
      const changes = snap.docChanges();

      setMessages((prev) => {
        let updated = prev.length ? [...prev] : [];

        // primo snapshot: carico tutto
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

        // incrementale
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

        updated.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        incRead(Math.max(1, changes.length));

        cacheRef.current[sid] = {
          messages: updated,
          title: cacheRef.current[sid]?.title || sessionTitle || "",
          ts: Date.now(),
        };

        return updated;
      });
    });
  };
  // ---------------------------------------
  // Aggiornamento costi AI (simulazione)
  // ---------------------------------------
// ⬇️ BLOCCO 14.1.B — Update AiUsage compatibile con la nuova struttura
function updateAiUsageFromRaw(raw: any[]) {
  setAiUsage(prev => {
    const next: AiUsage = structuredClone(prev);

    raw.forEach(r => {
      const provider = r.provider as ProviderKey;
      if (!provider) return;

      const tokens = r.tokensUsed ?? 0;
      const cost = r.estimatedCost ?? 0;

      // Aggiorna per provider
      const p = next.perProvider[provider];
      p.calls += 1;
      p.tokens += tokens;
      p.costUsd += cost;

      // Aggiorna totali generali
      next.totalCalls += 1;
      next.totalTokens += tokens;
      next.totalCostUsd += cost;
    });

    // Persistenza locale
    if (hasWindow()) {
      safeSet(AI_USAGE_LS_KEY, JSON.stringify(next));
    }

    return next;
  });
}
// ⬆️ FINE BLOCCO 14.1.B


  // ---------------------------------------
  // Nuova Sessione
  // ---------------------------------------
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
    });
    incWrite(2);

    const messagesRef = collection(db, "sessions", newId, "messages");
    await addDoc(messagesRef, {
      sender: "anova",
      text: "Sessione avviata. Pronta per lavorare insieme.",
      createdAt: serverTimestamp(),
    });
    incWrite();

    setMessages([]);
    setSessionTitle("");
    cacheRef.current[newId] = { messages: [], title: "", ts: Date.now() };

    setToastMessage("✅ Nuova sessione avviata");
    setTimeout(() => setToastMessage(null), 1800);
  };

  // ---------------------------------------
  // Rinomina (attiva + inline)
  // ---------------------------------------
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

  // ---------------------------------------
  // Apri / Cestina / Ripristina
  // ---------------------------------------
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

  // ---------------------------------------
  // Simulazione AI locale (placeholder)
  // ---------------------------------------
  const generateLocalResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();
    if (lower.includes("ciao")) return "Ciao Luca. Sono pronta per lavorare insieme in Anova β.";
    if (lower.includes("test") || lower.includes("prova")) return "Test completato con successo. Sistema stabile.";
    if (lower.includes("chi sei")) return "Sono Anova β — il tuo ambiente operativo cognitivo.";
    return "Ricevuto. Elaboro il contesto e preparo una risposta.";
  };

  // ---------------------------------------
  // Invio messaggi (+ meta update + debug AI)
  // ---------------------------------------
  async function safeFetchAI(prompt: string) {
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Response error");
      return await res.json();
    } catch (e) {
      await new Promise(r => setTimeout(r, 200)); // retry dopo 200ms
    }
  }
  throw new Error("AI unreachable");
}

const handleSend = async (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = input.trim();
  if (!trimmed || !sessionId) return;

  const messagesRef = collection(db, "sessions", sessionId, "messages");

  // 1️⃣ Salvo il messaggio dell'utente
  await addDoc(messagesRef, {
    sender: "user",
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  incWrite(2);

  await updateDoc(doc(db, "sessions", sessionId), {
    updatedAt: serverTimestamp(),
    lastMessage: trimmed,
  });
  incWrite();

  setInput("");

  // 2️⃣ Chiamata all'orchestratore cognitivo
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

    // 🔍 debug tecnico per il pannello AI
    setDebugInfo({
  ...data,
  costThisRequest: data.costThisRequest ?? 0,
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

  // 3️⃣ Aggiorno uso AI cumulativo (solo se ci sono provider)
  if (rawProviders.length > 0 || costThisRequest > 0) {
    setAiUsage((prev) => {
      const next: AiUsage = {
        ...prev,
        totalCalls: prev.totalCalls,
        totalCostUsd: prev.totalCostUsd + costThisRequest,
        totalTokens: prev.totalTokens,
        perProvider: { ...prev.perProvider },
      };

      // Somma per provider
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

  // 4️⃣ Salvo la risposta di ANOVA nel thread
  await addDoc(messagesRef, {
    sender: "anova",
    text: aiResponse,
    createdAt: serverTimestamp(),
  });
  incWrite(2);

  await updateDoc(doc(db, "sessions", sessionId), {
    updatedAt: serverTimestamp(),
    lastMessage: aiResponse,
  });
  incWrite();

  // aggiorna cache locale
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



  // ---------------------------------------
  // Filtri ricerca archivio/cestino
  // ---------------------------------------
  const filteredArchive = useMemo(() => {
    const t = searchArchive.toLowerCase().trim();
    if (!t) return sessions;
    return sessions.filter((s) => {
      const title = (s.title || "").toLowerCase();
      const id = s.id.toLowerCase();
      const last = (s.lastMessage || "").toLowerCase();
      return title.includes(t) || id.includes(t) || last.includes(t);
    });
  }, [sessions, searchArchive]);

  const filteredTrash = useMemo(() => {
    const t = searchTrash.toLowerCase().trim();
    if (!t) return trashSessions;
    return trashSessions.filter((s) => {
      const title = (s.title || "").toLowerCase();
      const id = s.id.toLowerCase();
      const last = (s.lastMessage || "").toLowerCase();
      return title.includes(t) || id.includes(t) || last.includes(t);
    });
  }, [trashSessions, searchTrash]);

  // ---------------------------------------
  // UI Completa
  // ---------------------------------------
  return (
   <main className="h-screen w-screen flex bg-black text-neutral-100 relative overflow-x-hidden">

      {/* ARCHIVIO */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-neutral-950 border-r border-neutral-800 z-40 transition-transform duration-300 ${
          showArchive ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-800">
          <h3 className="text-base font-semibold">Archivio</h3>
          <button onClick={() => setShowArchive(false)} className="text-sm text-neutral-400 hover:text-white">
            Chiudi
          </button>
        </div>
        <div className="px-4 py-3 border-b border-neutral-800">
          <input
            type="text"
            placeholder="Cerca chat…"
            value={searchArchive}
            onChange={(e) => setSearchArchive(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white"
          />
        </div>
        <div className="p-3 overflow-y-auto h-[calc(100%-110px)] space-y-2">
          {filteredArchive.length === 0 ? (
            <div className="text-neutral-600 text-sm px-2 py-4">Nessuna sessione.</div>
          ) : (
            filteredArchive.map((s) => (
              <div key={s.id} className="border border-neutral-800 rounded-lg p-2 hover:bg-neutral-900 transition">
                <div className="flex items-center gap-2">
                  {inlineEditId === s.id ? (
                    <input
                      value={inlineEditValue}
                      onChange={(e) => setInlineEditValue(e.target.value)}
                      onBlur={() => commitInlineRename(s.id)}
                      onKeyDown={(e) => e.key === "Enter" && commitInlineRename(s.id)}
                      autoFocus
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <button onClick={() => handleOpenSession(s.id)} className="text-left text-sm flex-1">
                      <div className="text-xs text-neutral-400">{s.title?.trim() ? s.title : `#${s.id.slice(-6)}`}</div>
                      <div className="line-clamp-1 text-neutral-300">{s.lastMessage || "—"}</div>
                    </button>
                  )}
                  <button
                    onClick={() => (inlineEditId === s.id ? commitInlineRename(s.id) : startInlineRename(s.id, s.title))}
                    className="text-neutral-400 hover:text-white text-xs px-2"
                    title="Rinomina"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteSession(s.id)}
                    className="text-neutral-500 hover:text-red-400 text-xs px-2"
                    title="Cestina"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* CESTINO */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-neutral-950 border-r border-neutral-800 z-40 transition-transform duration-300 ${
          showTrash ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-800">
          <h3 className="text-base font-semibold">Cestino</h3>
          <button onClick={() => setShowTrash(false)} className="text-sm text-neutral-400 hover:text-white">
            Chiudi
          </button>
        </div>
        <div className="px-4 py-3 border-b border-neutral-800">
          <input
            type="text"
            placeholder="Cerca…"
            value={searchTrash}
            onChange={(e) => setSearchTrash(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white"
          />
        </div>
        <div className="p-3 overflow-y-auto h-[calc(100%-110px)] space-y-2">
          {filteredTrash.length === 0 ? (
            <div className="text-neutral-600 text-sm px-2 py-4">Nessuna sessione cestinata.</div>
          ) : (
            filteredTrash.map((s) => (
              <div key={s.id} className="border border-neutral-800 rounded-lg p-2 hover:bg-neutral-900 transition">
                <div className="flex items-center gap-2">
                  {inlineEditId === s.id ? (
                    <input
                      value={inlineEditValue}
                      onChange={(e) => setInlineEditValue(e.target.value)}
                      onBlur={() => commitInlineRename(s.id)}
                      onKeyDown={(e) => e.key === "Enter" && commitInlineRename(s.id)}
                      autoFocus
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
                    />
                  ) : (
                    <div className="flex-1">
                      <div className="text-neutral-400 line-clamp-1">{s.title?.trim() ? s.title : `#${s.id.slice(-6)}`}</div>
                      <div className="text-neutral-600 text-xs line-clamp-1">{s.lastMessage || "—"}</div>
                    </div>
                  )}
                  <button
                    onClick={() => (inlineEditId === s.id ? commitInlineRename(s.id) : startInlineRename(s.id, s.title))}
                    className="text-neutral-400 hover:text-white text-xs px-2"
                    title="Rinomina"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRestoreSession(s.id)}
                    className="text-green-400 hover:text-green-300 text-xs px-2"
                    title="Ripristina"
                  >
                    ♻️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* COLONNA CHAT */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">
              Anova<span className="text-neutral-500"> β</span> — Chat
            </h2>
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  onBlur={commitActiveTitle}
                  onKeyDown={(e) => e.key === "Enter" && commitActiveTitle()}
                  className="text-xs px-2 py-1 bg-neutral-900 border border-neutral-700 rounded"
                  autoFocus
                  placeholder={`#${sessionId?.slice(-6)}`}
                />
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-xs px-2 py-1 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white"
                  title="Rinomina sessione"
                >
                  {sessionTitle?.trim() ? sessionTitle : `#${sessionId?.slice(-6)}`}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">

  {/* Archivio */}
  <button
    onClick={() => setShowArchive((v) => !v)}
    className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
  >
    Archivio
  </button>

  {/* Cestino */}
  <button
    onClick={() => setShowTrash((v) => !v)}
    className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
  >
    Cestino
  </button>

{/* ▼ MENU PANNELLI */}
{/* ▼ MENU PANNELLI (click-toggle, stabile) */}
<div className="relative">
  <button
    onClick={() => setShowPanelsMenu(prev => !prev)}
    className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition cursor-pointer select-none"
  >
    Pannelli ▼
  </button>

  {showPanelsMenu && (
    <div
      className="absolute left-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 p-2 space-y-1"
    >
      <button
        onClick={() => {
          setShowPanelsMenu(false);
          setShowTechPanel(true);
        }}
        className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 rounded-lg"
      >
        🧠 Pannello Tecnico AI
      </button>

      <button
        onClick={() => {
          setShowPanelsMenu(false);
          setShowAICostPanel(true);
        }}
        className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 rounded-lg"
      >
        🤖 Costi AI
      </button>

      <button
        onClick={() => {
          setShowPanelsMenu(false);
          setShowFirestorePanel(true);
        }}
        className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 rounded-lg"
      >
        🔥 Costi Firestore
      </button>
    </div>
  )}
</div>


  {/* Nuova Chat */}
  <button
    onClick={handleNewSession}
    className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
  >
    Nuova Chat
  </button>
</div>
</header>

        {/* AREA MESSAGGI */}
        <section className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-neutral-600 text-center">
              Nessun messaggio ancora. Inizia a dialogare con Anova β.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-2xl mx-auto rounded-xl p-4 ${
                  msg.sender === "user"
                    ? "bg-neutral-900 border border-neutral-700 text-right"
                    : "bg-neutral-800 border border-neutral-700 text-left"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))
          )} <div ref={bottomRef} />
        </section>

        {/* INPUT */}
        <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-neutral-800 px-6 py-4 bg-black">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white"
          />
          <button type="submit" className="bg-white text-black font-medium px-5 py-2 rounded-lg hover:bg-neutral-200 transition">
            Invia
          </button>
        </form>
      </div>

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade z-50">
          {toastMessage}
        </div>
      )}
{/* 🔵 MODALE — Pannello Tecnico AI */}
{showTechPanel && (
  <AITechPanel
    debugInfo={debugInfo}
    onClose={() => setShowTechPanel(false)}
  />
)}

{/* 🔵 MODALE — Costi AI */}
{showAICostPanel && (
  <AICostPanel
    aiUsage={aiUsage}
    onClose={() => setShowAICostPanel(false)}
  />
)}

{/* 🔵 MODALE — Costi Firestore */}
{showFirestorePanel && (
  <FirestoreCostPanel
    totalReads={totalReads}
    totalWrites={totalWrites}
    onClose={() => setShowFirestorePanel(false)}
  />
)}

    </main>   //* ⬅️ CHIUSURA MAIN MANCANTE */
  );
}             {/* ⬅️ CHIUSURA FUNZIONE */}

// ⬆️ FINE BLOCCO 14.0 — v4.1
