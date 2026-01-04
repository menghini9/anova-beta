"use client";
// ======================================================
// ChatPageClient — V6 (LEAN)
// Path: src/app/chat/ChatPageClient.tsx
// Obiettivo: Chat + Orchestratore. Stop Archivio/Cestino/Nuova Chat.
// ======================================================

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { ProjectDoc } from "@/lib/projects/types";
// EMAIL SINGOLA (job attivo)
// EMAIL SINGOLA (job attivo) — path CORRETTO
import type { EmailSingolaBrief1 } from "@/lib/jobs/scrittura/email/email_singola/brief1";
import type { EmailSingolaBrief3 } from "@/lib/jobs/scrittura/email/email_singola/brief3";

import { buildEmailContractAll } from "@/lib/jobs/scrittura/email/email_singola/contract";
import { buildEmailBrief3Sections } from "@/lib/jobs/scrittura/email/email_singola/brief3";

import { checkEmailSingolaCoherence } from "@/lib/jobs/scrittura/email/email_singola/coherence";




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

import { db, getUserId } from "@/lib/firebase";

// UI
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ChatOrchestratorSidebar from "./components/ChatOrchestratorSidebar";

/* =========================
   TIPI
========================= */
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
  // 1) ROUTING / PROJECT MODE
  // -------------------------
  const searchParams = useSearchParams();
  const router = useRouter();

  const projectId = searchParams.get("projectId");
  const isProjectMode = Boolean(projectId);

  const [project, setProject] = useState<(ProjectDoc & { id: string }) | null>(null);
  const [showBriefSummary, setShowBriefSummary] = useState(false);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);

  // -------------------------
  // 2) SESSION + UI CORE
  // -------------------------
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Orchestratore
  const [debugInfo, setDebugInfo] = useState<any | null>(null);
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [orchWidth, setOrchWidth] = useState(420);
// =========================
// AUTO-KICKOFF (anti doppio run)
// =========================
const [autoKickoffRunning, setAutoKickoffRunning] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // -------------------------
  // 3) BOOTSTRAP SESSION (NON PROJECT)
  // -------------------------
  useEffect(() => {
    if (!hasWindow()) return;
    if (!userId) return;
    if (isProjectMode) return; // in project mode sessionId arriva dal progetto

    let sid = safeGet("anovaSessionId");
    if (!sid) {
      sid = Date.now().toString();
      safeSet("anovaSessionId", sid);
    }
    setSessionId(sid);

    // assicuro doc sessione (merge)
    const sessRef = doc(db, "sessions", sid);
    setDoc(
      sessRef,
      {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: "Sessione avviata.",
        deleted: false,
        owner: userId,
      },
      { merge: true }
    );
  }, [userId, isProjectMode]);

  // -------------------------
  // 4) PROJECT LISTENER (owner check + sessionId)
  // -------------------------
  useEffect(() => {
    if (!isProjectMode) return;
    if (!userId) return;
    if (!projectId) return;

    const ref = doc(db, "projects", projectId);

    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as any;
      if (!data) return;

      // sicurezza base: progetto non tuo
      if (data.owner !== userId) {
        setToastMessage("🔒 Accesso negato: progetto non tuo.");
        setTimeout(() => setToastMessage(null), 1800);
        return;
      }

      setProject({ id: snap.id, ...(data as ProjectDoc) });

      // sessione chat = sessionId del progetto
      if (data.sessionId) setSessionId(String(data.sessionId));
    });

    return () => unsub();
  }, [isProjectMode, userId, projectId, projectId]);

  // -------------------------
  // 5) LISTENER SESSIONE ATTIVA (titolo + messaggi)
  // -------------------------
  const activeMsgUnsubRef = useRef<null | (() => void)>(null);
  const activeTitleUnsubRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    // cleanup
    if (activeMsgUnsubRef.current) {
      activeMsgUnsubRef.current();
      activeMsgUnsubRef.current = null;
    }
    if (activeTitleUnsubRef.current) {
      activeTitleUnsubRef.current();
      activeTitleUnsubRef.current = null;
    }

    if (!sessionId) return;

    // titolo
    const sessRef = doc(db, "sessions", sessionId);
    activeTitleUnsubRef.current = onSnapshot(sessRef, (snap) => {
      const t = (snap.data()?.title || "") as string;
      setSessionTitle(t);
    });

    // messaggi
    const messagesRef = collection(db, "sessions", sessionId, "messages");
    const qy = query(messagesRef, orderBy("createdAt", "desc"), limit(50));

    activeMsgUnsubRef.current = onSnapshot(qy, (snap) => {
      const rows: Message[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .reverse();
      setMessages(rows);
    });

    return () => {
      if (activeMsgUnsubRef.current) activeMsgUnsubRef.current();
      if (activeTitleUnsubRef.current) activeTitleUnsubRef.current();
      activeMsgUnsubRef.current = null;
      activeTitleUnsubRef.current = null;
    };
  }, [sessionId]);
// =========================
// AUTO-KICKOFF: primo output appena OPEN_CHAT dopo Brief3
// =========================
useEffect(() => {
  if (!isProjectMode) return;
  if (!projectId || !project) return;
  if (!sessionId || !userId) return;

  const stage = String((project as any)?.stage ?? "");
  if (stage !== "OPEN_CHAT") return;

  // Deve esistere Brief3 (round3)
  const hasBrief3 = Boolean((project as any)?.brief?.round3);
  if (!hasBrief3) return;

  // Se ci sono già messaggi, non rifare kickoff
  if (messages.length > 0) return;

  // Evita doppio run per re-render
  if (autoKickoffRunning) return;

  // Evita loop su refresh / riapertura
  if ((project as any)?.autoKickoffDone) return;

  (async () => {
    setAutoKickoffRunning(true);

    try {
      // 1) segna subito sul progetto (persistente)
      await updateDoc(doc(db, "projects", projectId), {
        autoKickoffDone: true,
        updatedAt: serverTimestamp(),
      });

      // 2) chiama orchestrate con prompt kickoff
      const kickoffPrompt =
        "Genera subito una prima versione dell’output richiesto dal CONTRATTO. " +
        "Se mancano dati davvero critici: fai domande numerate (max 3) e fermati.";

      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: kickoffPrompt,
          sessionId,
          userId,
          projectPacket: {
            projectId,
            intent: (project as any)?.intent,
            mode: (project as any)?.mode,
            stage: (project as any)?.stage,
            brief: {
              round1: (project as any)?.brief?.round1 ?? null,
              round2: (project as any)?.brief?.round2 ?? null,
              round3: (project as any)?.brief?.round3 ?? null,
            },
          },
        }),
      });

      const data = await res.json();

      // 3) aggiorna debug sidebar
      setDebugInfo({
        raw: data.raw || [],
        meta: data.meta || {},
      });

      const aiResponse =
        data?.fusion?.finalText || "⚠️ Nessuna risposta utile dall'orchestratore.";

      // 4) salva messaggio anova (così è VISIBILE in chat)
      const messagesRef = collection(db, "sessions", sessionId, "messages");
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
    } catch (err) {
      console.error("Auto-kickoff error:", err);
    } finally {
      setAutoKickoffRunning(false);
    }
  })();
}, [
  isProjectMode,
  projectId,
  project,
  sessionId,
  userId,
  messages.length,
  autoKickoffRunning,
]);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------
  // 6) TITLE COMMIT
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
  // 7) SEND MESSAGE + ORCHESTRATE
  // -------------------------
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !sessionId) return;
    
// ✅ COMANDO LOCALE: avvio produzione senza chiamare l'AI
if (isProjectMode && projectId && project) {
  const stage = String((project as any)?.stage ?? "");
  const cmd = trimmed.toLowerCase().replace(/\s+/g, " ").trim();

  if (stage === "OPEN_CHAT" && (cmd === "produzione" || cmd === "avvia produzione")) {
    await updateDoc(doc(db, "projects", projectId), {
      stage: "PRODUCTION",
      updatedAt: serverTimestamp(),
    });

    setInput("");
    setToastMessage("✅ Produzione avviata (stage=PRODUCTION)");
    setTimeout(() => setToastMessage(null), 1400);
    return; // 🔒 IMPORTANTISSIMO: non salvare msg, non chiamare /api/orchestrate
  }
}

    // gating: userId pronto
    if (!userId) {
      setToastMessage("⏳ Connessione utente in corso, riprova.");
      setTimeout(() => setToastMessage(null), 1500);
      return;
    }

    // gating progetto: chat attiva solo OPEN_CHAT / PRODUCTION
    if (isProjectMode) {
      const st = String((project as any)?.stage ?? "");
      if (st && st !== "OPEN_CHAT" && st !== "PRODUCTION") {
        setToastMessage("🔒 Chat chiusa: completa i brief in WORK fino a OPEN_CHAT.");
        setTimeout(() => setToastMessage(null), 1800);
        return;
      }
    }

// COHERENCE GATE (NO-AI) — job driven
if (isProjectMode && project) {
  const intent = String((project as any)?.intent ?? "");
  const job = String((project as any)?.job ?? (project as any)?.type ?? ""); // fallback
  const stage = String((project as any)?.stage ?? "");

  // Solo scrittura, solo EMAIL SINGOLA per ora
  if (intent === "scrittura" && (job === "email_singola" || job === "email")) {
    const b1 = ((project as any)?.brief?.round1 ?? {}) as any;
    const b2 = (project as any)?.brief?.round2 ?? {};
    const b3 = ((project as any)?.brief?.round3 ?? {}) as any;

    const res = checkEmailSingolaCoherence({
      brief1: b1,
      brief2: b2,
      brief3: b3,
      userText: trimmed,
    });

    if (res.verdict === "HARD_MISMATCH") {
      setMismatchWarning(`⚠️ Coerenza brief: ${res.reason}. Allinea il brief (WORK) prima di andare avanti.`);
      setToastMessage("⛔ Richiesta bloccata: incoerenza col brief.");
      setTimeout(() => setToastMessage(null), 1800);
      return;
    }

    if (res.verdict === "SOFT_MISMATCH") {
      setMismatchWarning(`⚠️ Coerenza brief (soft): ${res.reason}. Se hai cambiato idea, premi “Modifica brief”.`);

      if (stage === "PRODUCTION") {
        setToastMessage("⛔ Produzione bloccata: allinea il brief.");
        setTimeout(() => setToastMessage(null), 1800);
        return;
      }
    } else {
      setMismatchWarning(null);
    }
  }
}


    const messagesRef = collection(db, "sessions", sessionId, "messages");

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

    // 2) chiamata orchestratore
    let aiResponse = "Elaborazione in corso...";

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          sessionId,
          userId,
          projectPacket: isProjectMode
            ? {
                projectId,
                // NB: se in futuro togli intent, qui lo lasciamo solo se esiste
                intent: (project as any)?.intent,
                mode: (project as any)?.mode,
                stage: (project as any)?.stage,
             brief: {
  round1: (project as any)?.brief?.round1 ?? null,
  round2: (project as any)?.brief?.round2 ?? null,
  round3: (project as any)?.brief?.round3 ?? null, // ✅ NEW
},

              }
            : undefined,
        }),
      });

      const data = await res.json();

      setDebugInfo({
        raw: data.raw || [],
        meta: data.meta || {},
      });

      aiResponse = data?.fusion?.finalText || "⚠️ Nessuna risposta utile dall'orchestratore.";
    } catch (err) {
      console.error("Errore chiamata orchestratore:", err);
      aiResponse = "❌ Errore nel motore cognitivo. Riprova.";
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
// =========================
// CONTRATTO (per sidebar orchestratore)
// =========================
const contractSections =
  isProjectMode && project && String((project as any).intent) === "scrittura"
    ? (() => {
        const job = String((project as any)?.job ?? (project as any)?.type ?? "");

        // EMAIL SINGOLA (attiva)
        if (job === "email_singola" || job === "email") {
          return [
            ...buildEmailContractAll(
              ((project as any)?.brief?.round1 ?? {}) as EmailSingolaBrief1,
              (project as any)?.brief?.round2 ?? {}
            ),
            ...buildEmailBrief3Sections(
              ((project as any)?.brief?.round3 ?? {}) as EmailSingolaBrief3
            ),
          ];
        }

        // altri job: non ancora collegati
        return null;
      })()
    : null;



  // -------------------------
  // 8) UI
  // -------------------------
  const handleToggleOrchestrator = () => setShowOrchestrator((v) => !v);

  return (
    <main className="h-screen w-screen flex bg-black text-neutral-100 relative overflow-hidden">
      {/* Colonna centrale */}
      <div
        className="flex-1 flex flex-col transition-all duration-200"
        style={{
          width: showOrchestrator ? `calc(100vw - ${orchWidth}px)` : "100vw",
          marginRight: showOrchestrator ? `${orchWidth}px` : 0,
        }}
      >
        {/* Banner progetto */}
        {isProjectMode && project && (
          <div className="border-b border-neutral-800 bg-neutral-950 px-6 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-neutral-300">
                Progetto:{" "}
                <b className="text-white">{(project as any).intent?.toUpperCase()}</b> — Mode:{" "}
                <b className="text-white">{String((project as any).mode ?? "").toUpperCase()}</b> — Stage:{" "}
                <b className="text-white">{String((project as any).stage ?? "")}</b>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="border border-white/15 bg-white/0 hover:bg-white/5 px-3 py-1.5 rounded-lg font-medium transition"
                  onClick={() => setShowBriefSummary((v) => !v)}
                >
                  {showBriefSummary ? "Nascondi brief" : "Mostra brief"}
                </button>

                <button
                  className="border border-white/15 bg-white/0 hover:bg-white/5 px-3 py-1.5 rounded-lg font-medium transition"
                  onClick={async () => {
                    if (!projectId) return;
                    await updateDoc(doc(db, "projects", projectId), {
                      stage: "BRIEF_1",
                      updatedAt: serverTimestamp(),
                    });
                    router.push(`/work/p/${projectId}`);
                  }}
                >
                  Modifica brief
                </button>

                {(project as any).stage === "OPEN_CHAT" && (
                  <button
                    className="bg-white text-black px-3 py-1.5 rounded-lg font-medium hover:bg-neutral-200 transition"
                    style={{ color: "#000" }}
                    onClick={async () => {
                      if (!projectId) return;
                      await updateDoc(doc(db, "projects", projectId), {
                        stage: "PRODUCTION",
                        updatedAt: serverTimestamp(),
                      });
                      setToastMessage("✅ Produzione avviata");
                      setTimeout(() => setToastMessage(null), 1200);
                    }}
                  >
                    Avvia Produzione
                  </button>
                )}
              </div>
            </div>

            {/* Brief summary */}
{showBriefSummary && (project as any).intent === "scrittura" && contractSections && (
  <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
    {contractSections.map((s: any) => (
      <div key={s.title} className="mt-2 first:mt-0">
        <div className="font-semibold text-white/90">{s.title}</div>
        <ul className="list-disc ml-5 mt-1 text-white/70 space-y-0.5">
          {s.lines.map((l: string) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    ))}
  </div>
)}


            {/* Warning coerenza */}
            {mismatchWarning && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
                <div className="font-semibold">Coerenza brief</div>
                <div className="text-sm mt-1">{mismatchWarning}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="bg-amber-300 text-black px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200 transition"
                    onClick={async () => {
                      if (!projectId) return;
                      await updateDoc(doc(db, "projects", projectId), {
                        stage: "BRIEF_1",
                        updatedAt: serverTimestamp(),
                      });
                      router.push(`/work/p/${projectId}`);
                    }}
                  >
                    Aggiorna brief
                  </button>
                  <button
                    className="border border-amber-500/30 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-500/10 transition"
                    onClick={() => setMismatchWarning(null)}
                  >
                    Ignora
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header chat (solo Orchestratore + rename titolo) */}
        <ChatHeader
          sessionId={sessionId}
          sessionTitle={sessionTitle}
          setSessionTitle={setSessionTitle}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          onCommitTitle={commitActiveTitle}
          showOrchestrator={showOrchestrator}
          onToggleOrchestrator={handleToggleOrchestrator}
        />

        <ChatMessages messages={messages} bottomRef={bottomRef} />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          disabled={
            Boolean(
              isProjectMode &&
                project &&
                (project as any).stage !== "OPEN_CHAT" &&
                (project as any).stage !== "PRODUCTION"
            )
          }
          disabledHint="Chat chiusa: completa i brief in WORK fino a OPEN_CHAT."
          onBlocked={() => {
            setToastMessage("🔒 Chat chiusa: completa i brief in WORK.");
            setTimeout(() => setToastMessage(null), 1400);
          }}
        />
      </div>

      {/* Sidebar orchestratore */}
      <ChatOrchestratorSidebar
        open={showOrchestrator}
        width={orchWidth}
        setWidth={setOrchWidth}
        onClose={() => setShowOrchestrator(false)}
        debugInfo={debugInfo}
        contract={contractSections}
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
