// ⬇️ BLOCCO 11 — /src/lib/orchestrator/fusion.ts
// ANOVA_ORCHESTRATOR_V60_FUSION_SMART

import type { FusionResult, ProviderResponse, Domain } from "./types";
import { BASE_WEIGHTS } from "./policy";

// 🧠 1) Valutazione contenuto (struttura + lunghezza, ma meno ingenua)
function contentScore(text: string): number {
  if (!text) return 0;

  const trimmed = text.trim();
  if (!trimmed) return 0;

  const len = Math.min(trimmed.length, 4000) / 4000; // 0–1
  const bullets = (trimmed.match(/[-•\n*]/g) || []).length;
  const headings = (trimmed.match(/#{1,3}\s|(?:\n\s*[A-Z].+:)/g) || []).length;
  const codeBlocks = (trimmed.match(/```/g) || []).length;

  // Struttura: liste, titoli, blocchi di codice → massimo 0.6
  const structureRaw = bullets * 0.02 + headings * 0.05 + codeBlocks * 0.08;
  const structure = Math.min(structureRaw, 0.6);

  // Base: non vogliamo mai 0 assoluto per una risposta decente
  const base = 0.15;

  return Math.max(
    0,
    Math.min(1, base + 0.5 * len + structure)
  );
}

// 🧮 2) Normalizzazione semplice 0–1
function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// 🧷 3) Calcolo punteggio complessivo per provider, dato il dominio
function computeProviderScore(
  r: ProviderResponse,
  domain: Domain
): {
  finalScore: number;
  quality: number;
  providerWeight: number;
  latencyScore: number;
} {
  if (!r.success || !r.text) {
    return { finalScore: 0, quality: 0, providerWeight: 0, latencyScore: 0 };
  }

  const quality = contentScore(r.text);

  // Pesi base da policy (se manca, fallback 0.7)
  const weightsForDomain = BASE_WEIGHTS[domain] ?? {};
  const providerWeight = clamp01(
    (weightsForDomain[r.provider] as number | undefined) ?? 0.7
  );

  // Latency: più veloce → punteggio più alto, ma non dominante
  const latencyMs = r.latencyMs ?? 0;
  const latencyScore = clamp01(1 / (1 + latencyMs / 2000)); // 0–1 decrescente con la latenza

  // Mix pesato: qualità contenuto > peso provider > latenza
  const finalScore = clamp01(
    quality * 0.55 + providerWeight * 0.3 + latencyScore * 0.15
  );

  return { finalScore, quality, providerWeight, latencyScore };
}

export function fuse(
  responses: ProviderResponse[],
  domain: Domain = "logic"
): FusionResult {
  if (!responses || responses.length === 0) {
    return {
      finalText: "Nessuna risposta ricevuta dai provider.",
      fusionScore: 0,
      used: [],
    };
  }

  // 1️⃣ Arricchiamo ogni risposta con i punteggi
  const evaluated = responses.map((r) => {
    const scores = computeProviderScore(r, domain);
    return {
      ...r,
      _score: scores.finalScore,
      _quality: scores.quality,
      _providerWeight: scores.providerWeight,
      _latencyScore: scores.latencyScore,
    } as ProviderResponse & {
      _score: number;
      _quality: number;
      _providerWeight: number;
      _latencyScore: number;
    };
  });

  // 2️⃣ Filtriamo solo quelle minimamente utili
  const usable = evaluated
    .filter((r) => r._score > 0 && (r.text?.trim().length ?? 0) > 0)
    .sort((a, b) => b._score - a._score);

  if (usable.length === 0) {
    return {
      finalText: "Nessuna risposta utile dai provider.",
      fusionScore: 0,
      used: [],
    };
  }

  // Limitiamo a massimo 3 provider "usati" per fusione
  const topUsed = usable.slice(0, 3);
  const best = topUsed[0];
  const bestScore = best._score;

  // 3️⃣ Scegliamo cosa integrare: solo provider non pessimi rispetto al migliore
  const additives = topUsed
    .slice(1)
    .filter((u) => u._score >= bestScore * 0.55) // filtro: niente rumore
    .map((u) => u.text)
    .filter(Boolean) as string[];

  // 4️⃣ Testo finale: spina dorsale + integrazioni quando serve
  let finalText = (best.text || "").trim();

  if (additives.length > 0) {
    finalText =
      finalText +
      "\n\n—\n" +
      "📌 **Integrazioni da altri modelli (merge controllato):**\n" +
      additives.map((t) => `• ${t.trim()}`).join("\n");
  }

  // 5️⃣ Fusion score complessivo (media dei punteggi usati)
  const fusionScore = clamp01(
    topUsed.reduce((acc, u) => acc + u._score, 0) / topUsed.length
  );

  return {
    finalText: finalText || "Nessuna risposta utile dai provider.",
    fusionScore,
    used: topUsed.map((u) => ({
      provider: u.provider,
      score: clamp01(u._score),
      latencyMs: u.latencyMs,
    })),
  };
}
// ⬆️ FINE BLOCCO 11 — ANOVA_ORCHESTRATOR_V60_FUSION_SMART
