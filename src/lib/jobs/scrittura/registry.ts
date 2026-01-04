// ⬇️ BLOCCO S-REG — SCRITTURA Registry (V3, email_singola only)
// Path: /src/lib/brief/scrittura/registry.ts

import type { ScritturaJob } from "@/lib/projects/types";

// ✅ Path REALI (la tua struttura è jobs/email/email_singola)
import type { ContractSection } from "./email/email_singola/contract";

// UI Forms (legacy per ora, ok)
import EmailSingolaBrief1Form from "@/components/jobs/scrittura/email/email_singola/Brief1Form";
import Brief2Form from "@/components/jobs/scrittura/email/email_singola/Brief2Form";
import Brief3Form from "@/components/jobs/scrittura/email/email_singola/Brief3Form";

// Builders EMAIL SINGOLA
import { buildEmailContractAll } from "./email/email_singola/contract";
import { buildEmailBrief3Sections } from "./email/email_singola/brief3";

export type ScritturaPipeline = {
  Brief1Form: any;
  Brief2Form: any;
  Brief3Form: any;
  buildContractAll: (b1: any, b2: any) => ContractSection[];
  buildBrief3Sections: (b3: any) => ContractSection[];
};

// ✅ Registry pulito: SOLO job che esistono in ScritturaJob
const REGISTRY: Partial<Record<ScritturaJob, ScritturaPipeline>> = {
  email_singola: {
    Brief1Form: EmailSingolaBrief1Form,
Brief2Form: Brief2Form,
Brief3Form: Brief3Form,
    buildContractAll: buildEmailContractAll,
    buildBrief3Sections: buildEmailBrief3Sections,
  },

  // email_sequenza: NON collegata per ora (cartella pronta, pipeline vuota)
};

export function getScritturaJobPipeline(job: ScritturaJob): ScritturaPipeline | null {
  return (REGISTRY[job] as ScritturaPipeline) ?? null;
}
// ⬆️ FINE BLOCCO S-REG
