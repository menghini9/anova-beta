// ======================================================
// EMAIL SINGOLA — Job Index (V2) — EXPORTS CLEAN
// Path: /src/lib/jobs/scrittura/email/email_singola/index.ts
// Obiettivo:
// - evitare export * su moduli che condividono nomi
// - exports espliciti = zero ambiguità
// ======================================================

// ✅ OK: non confliggono
export * from "./brief1";
export * from "./brief2";
export * from "./coherence";

// ✅ EXPLICIT: evita collisioni
export { buildEmailBrief3Sections } from "./brief3";
// Se ti servono anche type/const da brief3, aggiungili qui in modo esplicito:
// export type { EmailSingolaBrief3 } from "./brief3";

export { buildEmailContractAll } from "./contract";
export type { ContractSection } from "./contract";

// ======================================================
// FINE
// ======================================================
