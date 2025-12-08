// ANOVA_CHECKLIST_ENGINE_V1
// Motore che prepara una checklist di requisiti / variabili critiche.

import type { Intent, Domain } from "../types";

export interface ChecklistItem {
  id: string;
  question: string;
  required: boolean;
  domain: Domain;
}

export interface ChecklistResult {
  items: ChecklistItem[];
}

/**
 * Checklist base per dominio. In futuro potrà essere arricchita interrogando le AI.
 */
export function runChecklistEngine(intent: Intent): ChecklistResult {
  const items: ChecklistItem[] = [];
  const domain = intent.purpose;

  if (domain === "code") {
    items.push(
      {
        id: "code_stack",
        question: "Che stack stai usando? (es. Next.js, Firebase, Node, ecc.)",
        required: true,
        domain,
      },
      {
        id: "code_error",
        question: "Hai un errore specifico (stack trace / messaggio)? Incollalo.",
        required: true,
        domain,
      },
      {
        id: "code_repo",
        question: "Il codice è in un repo / file specifico? Descrivi dove.",
        required: false,
        domain,
      }
    );
  } else if (domain === "strategy") {
    items.push(
      {
        id: "strategy_goal",
        question: "Qual è l'obiettivo principale (fatturato, utenti, tempo, altro)?",
        required: true,
        domain,
      },
      {
        id: "strategy_target",
        question: "A chi ti stai rivolgendo (target)?",
        required: true,
        domain,
      },
      {
        id: "strategy_constraints",
        question: "Quali sono i vincoli (budget, tempo, competenze)?",
        required: false,
        domain,
      }
    );
  } else if (domain === "factual") {
    items.push({
      id: "factual_scope",
      question:
        "Ti servono dati aggiornati (web) o una spiegazione concettuale generica?",
      required: true,
      domain,
    });
  } else if (domain === "creative") {
    items.push({
      id: "creative_style",
      question: "Hai uno stile di riferimento (autore, marca, mood)?",
      required: false,
      domain,
    });
  }

  // Dominio logic o fallback: nessuna checklist obbligatoria, ma struttura pronta.
  return { items };
}
