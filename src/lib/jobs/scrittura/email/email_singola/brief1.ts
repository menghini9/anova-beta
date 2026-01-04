// ======================================================
// EMAIL SINGOLA — BRIEF 1 (Giro 1) + Kernel Translator
// Path: src/lib/brief/scrittura/jobs/email_singola/brief1.ts
// Obiettivo:
// - UI: mostra scelte
// - Sistema: traduce scelte -> KERNEL (solo regole operative)
// ======================================================

// =========================
// 0) TIPI — scelte UI (closed + text dove serve)
// =========================

export type EmailLingua = "it" | "en";

export type EmailStruttura =
  | "essenziale_3"
  | "standard_5"
  | "dettagliata_6"
  | "bullet_first"
  | "qa"
  | "recap_verbale";

export type EmailLunghezza = "corta" | "media" | "lunga";

export type EmailFormalita = "molto_formale" | "formale" | "neutra" | "colloquiale";

export type EmailEnergia = "soft" | "diretta" | "assertiva";

export type EmailRelazione = "prima_volta" | "ci_conosciamo" | "rapporto_attivo";

export type EmailRuolo =
  | "cliente"
  | "lead_prospect"
  | "fornitore"
  | "partner"
  | "collega"
  | "capo_superiore"
  | "hr_selezione"
  | "altro";

export type EmailPersona = "io" | "noi";

export type EmailOutput =
  | "oggetto_e_corpo"
  | "solo_corpo"
  | "tre_varianti_oggetto_e_corpo";

export type EmailOggettoPolicy = "generalo_tu" | "lo_scrivo_io" | "ho_alternative";

export type EmailSaluto = "formale" | "neutro" | "personalizzato";
export type EmailChiusura = "formale" | "neutra" | "personalizzata";

export type EmailFirmaTipo = "nessuna" | "standard" | "completa";

export type EmailFormattazione = "paragrafi" | "bullet_preferita" | "mix";

// =========================
// 1) MODELLO BRIEF1 (salvato su Firestore in brief.round1)
// =========================

export type EmailSingolaBrief1 = {
  // 1) Lingua
  lingua?: EmailLingua;

  // 2) Struttura
  struttura?: EmailStruttura;

  // 3) Lunghezza
  lunghezza?: EmailLunghezza;

  // 4) Formalità
  formalita?: EmailFormalita;

  // 5) Energia
  energia?: EmailEnergia;

  // 6) Relazione
  relazione?: EmailRelazione;

  // 7) Ruolo destinatario
  ruolo?: EmailRuolo;

  // 8) Persona grammaticale
  persona?: EmailPersona;

  // 9) Output richiesto
  output?: EmailOutput;

  // 9.1) Oggetto: policy + input
  oggettoPolicy?: EmailOggettoPolicy;
  oggettoText?: string; // per "lo_scrivo_io"
  oggettiAlt?: string; // per "ho_alternative" (uno per riga)

  // 10) Saluto iniziale
  saluto?: EmailSaluto;
  salutoText?: string; // per "personalizzato"

  // 11) Chiusura finale
  chiusura?: EmailChiusura;
  chiusuraText?: string; // per "personalizzata"

  // 12) Firma
  firmaTipo?: EmailFirmaTipo;

  // per "standard" e "completa"
  firmaNomeCognome?: string;
  firmaRuolo?: string;

  // solo per "completa"
  firmaAzienda?: string;
  firmaTelefono?: string;
  firmaEmail?: string;
  firmaSito?: string;
  firmaIndirizzo?: string;
  firmaPivaInfo?: string;

  // 13) Formattazione
  formattazione?: EmailFormattazione;
};

// =========================
// 2) DEFAULTS (sistema)
// =========================

export const EMAIL_SINGOLA_BRIEF1_DEFAULT: Required<
  Pick<
    EmailSingolaBrief1,
    | "lingua"
    | "struttura"
    | "lunghezza"
    | "formalita"
    | "energia"
    | "relazione"
    | "ruolo"
    | "persona"
    | "output"
    | "saluto"
    | "chiusura"
    | "firmaTipo"
    | "formattazione"
  >
> = {
  lingua: "it",
  struttura: "standard_5",
  lunghezza: "media",
  formalita: "formale",
  energia: "diretta", // scelta “azienda”: di default dritti, non molli
  relazione: "ci_conosciamo",
  ruolo: "altro",
  persona: "io",
  output: "oggetto_e_corpo",
  saluto: "neutro",
  chiusura: "neutra",
  firmaTipo: "nessuna",
  formattazione: "paragrafi",
};
// =========================
// 2.1) QUESTIONS (UI schema) — source of truth per il form
// =========================

export type EmailSingolaBrief1Question = {
  id: keyof EmailSingolaBrief1;
  label: string;
  type: "select" | "text";
  required?: boolean;
  placeholder?: string;
  maxLen?: number;
  options?: { value: string; label: string }[];
};

export const EMAIL_SINGOLA_BRIEF1_QUESTIONS: EmailSingolaBrief1Question[] = [
  // 1) Lingua
  {
    id: "lingua",
    label: "Lingua",
    type: "select",
    required: true,
    options: [
      { value: "it", label: "Italiano" },
      { value: "en", label: "English" },
    ],
  },

  // 2) Struttura
  {
    id: "struttura",
    label: "Struttura",
    type: "select",
    required: true,
    options: [
      { value: "essenziale_3", label: "Essenziale (3 blocchi)" },
      { value: "standard_5", label: "Standard (5 blocchi)" },
      { value: "dettagliata_6", label: "Dettagliata (6 blocchi)" },
      { value: "bullet_first", label: "Bullet-first" },
      { value: "qa", label: "Q/A" },
      { value: "recap_verbale", label: "Recap verbale (decisioni/azioni/scadenze)" },
    ],
  },

  // 3) Lunghezza
  {
    id: "lunghezza",
    label: "Lunghezza",
    type: "select",
    required: true,
    options: [
      { value: "corta", label: "Corta" },
      { value: "media", label: "Media" },
      { value: "lunga", label: "Lunga" },
    ],
  },

  // 4) Formalità
  {
    id: "formalita",
    label: "Formalità",
    type: "select",
    required: true,
    options: [
      { value: "molto_formale", label: "Molto formale" },
      { value: "formale", label: "Formale" },
      { value: "neutra", label: "Neutra" },
      { value: "colloquiale", label: "Colloquiale" },
    ],
  },

  // 5) Energia
  {
    id: "energia",
    label: "Energia (tono)",
    type: "select",
    required: true,
    options: [
      { value: "soft", label: "Soft" },
      { value: "diretta", label: "Diretta" },
      { value: "assertiva", label: "Assertiva" },
    ],
  },

  // 6) Relazione
  {
    id: "relazione",
    label: "Relazione",
    type: "select",
    required: true,
    options: [
      { value: "prima_volta", label: "Prima volta" },
      { value: "ci_conosciamo", label: "Ci conosciamo" },
      { value: "rapporto_attivo", label: "Rapporto attivo" },
    ],
  },

  // 7) Ruolo destinatario
  {
    id: "ruolo",
    label: "Ruolo destinatario",
    type: "select",
    required: true,
    options: [
      { value: "cliente", label: "Cliente" },
      { value: "lead_prospect", label: "Lead / Prospect" },
      { value: "fornitore", label: "Fornitore" },
      { value: "partner", label: "Partner" },
      { value: "collega", label: "Collega" },
      { value: "capo_superiore", label: "Capo / Superiore" },
      { value: "hr_selezione", label: "HR / Selezione" },
      { value: "altro", label: "Altro" },
    ],
  },

  // 8) Persona grammaticale
  {
    id: "persona",
    label: "Persona grammaticale",
    type: "select",
    required: true,
    options: [
      { value: "io", label: "Io" },
      { value: "noi", label: "Noi" },
    ],
  },

  // 9) Output richiesto
  {
    id: "output",
    label: "Output richiesto",
    type: "select",
    required: true,
    options: [
      { value: "oggetto_e_corpo", label: "Oggetto + Corpo" },
      { value: "solo_corpo", label: "Solo corpo (senza oggetto)" },
      { value: "tre_varianti_oggetto_e_corpo", label: "3 varianti (oggetto + corpo)" },
    ],
  },

  // 9.1) Oggetto policy + input
  {
    id: "oggettoPolicy",
    label: "Oggetto — policy",
    type: "select",
    required: false,
    options: [
      { value: "generalo_tu", label: "Generalo tu" },
      { value: "lo_scrivo_io", label: "Lo scrivo io" },
      { value: "ho_alternative", label: "Ho alternative (una per riga)" },
    ],
  },
  {
    id: "oggettoText",
    label: "Oggetto — testo (se “Lo scrivo io”)",
    type: "text",
    required: false,
    placeholder: "Es: Richiesta conferma consegna",
    maxLen: 120,
  },
  {
    id: "oggettiAlt",
    label: "Oggetto — alternative (se “Ho alternative”)",
    type: "text",
    required: false,
    placeholder: "Una per riga",
    maxLen: 400,
  },

  // 10) Saluto
  {
    id: "saluto",
    label: "Saluto iniziale",
    type: "select",
    required: true,
    options: [
      { value: "formale", label: "Formale" },
      { value: "neutro", label: "Neutro" },
      { value: "personalizzato", label: "Personalizzato" },
    ],
  },
  {
    id: "salutoText",
    label: "Saluto — testo (se “Personalizzato”)",
    type: "text",
    required: false,
    placeholder: "Es: Buongiorno Ing. Rossi,",
    maxLen: 120,
  },

  // 11) Chiusura
  {
    id: "chiusura",
    label: "Chiusura finale",
    type: "select",
    required: true,
    options: [
      { value: "formale", label: "Formale" },
      { value: "neutra", label: "Neutra" },
      { value: "personalizzata", label: "Personalizzata" },
    ],
  },
  {
    id: "chiusuraText",
    label: "Chiusura — testo (se “Personalizzata”)",
    type: "text",
    required: false,
    placeholder: "Es: Cordiali saluti,",
    maxLen: 120,
  },

  // 12) Firma
  {
    id: "firmaTipo",
    label: "Firma",
    type: "select",
    required: true,
    options: [
      { value: "nessuna", label: "Nessuna" },
      { value: "standard", label: "Standard (nome + ruolo)" },
      { value: "completa", label: "Completa (contatti)" },
    ],
  },
  { id: "firmaNomeCognome", label: "Firma — Nome e cognome", type: "text", required: false, maxLen: 80 },
  { id: "firmaRuolo", label: "Firma — Ruolo", type: "text", required: false, maxLen: 80 },
  { id: "firmaAzienda", label: "Firma — Azienda (solo completa)", type: "text", required: false, maxLen: 80 },
  { id: "firmaTelefono", label: "Firma — Telefono", type: "text", required: false, maxLen: 40 },
  { id: "firmaEmail", label: "Firma — Email", type: "text", required: false, maxLen: 80 },
  { id: "firmaSito", label: "Firma — Sito", type: "text", required: false, maxLen: 120 },
  { id: "firmaIndirizzo", label: "Firma — Indirizzo", type: "text", required: false, maxLen: 120 },
  { id: "firmaPivaInfo", label: "Firma — P.IVA / info legali", type: "text", required: false, maxLen: 120 },

  // 13) Formattazione
  {
    id: "formattazione",
    label: "Formattazione",
    type: "select",
    required: true,
    options: [
      { value: "paragrafi", label: "Paragrafi" },
      { value: "bullet_preferita", label: "Bullet preferita" },
      { value: "mix", label: "Mix" },
    ],
  },
];

// =========================
// 3) VALIDAZIONE MINIMA (solo campi che richiedono testo)
// =========================

export function validateEmailSingolaBrief1(b: EmailSingolaBrief1) {
  const errors: string[] = [];

  const output = b.output ?? EMAIL_SINGOLA_BRIEF1_DEFAULT.output;

  // Oggetto: si apre solo se output != solo_corpo
  if (output !== "solo_corpo") {
    const pol = b.oggettoPolicy ?? "generalo_tu";

    if (pol === "lo_scrivo_io") {
      if (!b.oggettoText || !b.oggettoText.trim()) errors.push("Oggetto (testo) obbligatorio.");
    }
    if (pol === "ho_alternative") {
      if (!b.oggettiAlt || !b.oggettiAlt.trim()) errors.push("Oggetti alternativi (uno per riga) obbligatori.");
    }
  }

  // Saluto personalizzato
  if ((b.saluto ?? EMAIL_SINGOLA_BRIEF1_DEFAULT.saluto) === "personalizzato") {
    if (!b.salutoText || !b.salutoText.trim()) errors.push("Saluto personalizzato obbligatorio.");
  }

  // Chiusura personalizzata
  if ((b.chiusura ?? EMAIL_SINGOLA_BRIEF1_DEFAULT.chiusura) === "personalizzata") {
    if (!b.chiusuraText || !b.chiusuraText.trim()) errors.push("Chiusura personalizzata obbligatoria.");
  }

  // Firma: standard/completa richiedono nome+cognome+ruolo
  const firmaTipo = b.firmaTipo ?? EMAIL_SINGOLA_BRIEF1_DEFAULT.firmaTipo;
  if (firmaTipo === "standard" || firmaTipo === "completa") {
    if (!b.firmaNomeCognome || !b.firmaNomeCognome.trim()) errors.push("Firma: Nome e cognome obbligatori.");
    if (!b.firmaRuolo || !b.firmaRuolo.trim()) errors.push("Firma: Ruolo obbligatorio.");
    if (firmaTipo === "completa") {
      if (!b.firmaAzienda || !b.firmaAzienda.trim()) errors.push("Firma completa: Azienda obbligatoria.");
    }
  }

  return { ok: errors.length === 0, errors };
}

// =========================
// 4) KERNEL (solo regole operative da passare al provider)
// =========================

export type EmailSingolaKernelV1 = {
  kind: "email_singola";
  version: 1;

  // Precedenze tono (sempre)
  tonePrecedenceRule: string;

  // Regole principali (sempre)
  globalRules: string[];

  // Regole scelte
  languageRule: string;
  structureRule: string;
  lengthRule: { minWords: number; maxWords: number; tolerancePct: number };
  formalityRule: string;
  energyRule: string;
  relationshipRule: string;
  recipientRoleRule: string;
  personaRule: string;

  // Output
  outputRule: string;
  subjectRule?: string; // solo se output include oggetto
  subjectPolicy?: "generate" | "use_exact" | "choose_from_list";
  subjectExact?: string;
  subjectOptions?: string[];

  // Saluto / Chiusura
  greetingRule: string;
  greetingExact?: string;
  closingRule: string;
  closingExact?: string;

  // Firma
  signatureRule: string;
  signature?: {
    type: "none" | "standard" | "complete";
    lines?: string[]; // già pronte da appendere dopo chiusura
  };

  // Formattazione
  formattingRule: string;
};

// =========================
// 5) TRADUTTORE: Brief1 -> Kernel
// =========================

export function buildEmailSingolaKernelV1(input: EmailSingolaBrief1): EmailSingolaKernelV1 {
  // applico default
  const b: EmailSingolaBrief1 = { ...EMAIL_SINGOLA_BRIEF1_DEFAULT, ...input };

  // 1) Lingua
  const languageRule =
    b.lingua === "en"
      ? "Write in natural English; correct grammar; avoid Italianisms."
      : "Scrivi in italiano naturale, senza calchi dall’inglese.";

  // 2) Struttura + regole CTA fisse
  const baseCtaRules = [
    "CTA presente solo se il Risultato desiderato richiede un’azione; se nulla/solo informare/saluto: CTA assente.",
    "Se CTA presente: deve essere una sola riga operativa (next step).",
    "Struttura finale fissa: CTA operativa (se richiesta) → commiato (1 riga) → firma (se prevista).",
    "La CTA non sostituisce il commiato.",
  ];

  const structureRuleMap: Record<EmailStruttura, string> = {
    essenziale_3:
      "Usa 3 blocchi: (1) apertura 1 riga, (2) punto principale 2–4 frasi, (3) CTA (se richiesta dal Risultato desiderato) + chiusura.",
    standard_5:
      "Usa 5 blocchi: apertura, contesto breve (1–2 frasi), punti chiave, CTA (se richiesta), chiusura.",
    dettagliata_6:
      "Usa 6 blocchi: apertura, contesto, dettagli, prove/elementi concreti, CTA/next step (se richiesto dal risultato desiderato), chiusura.",
    bullet_first:
      "Dopo l’intro 1 riga, metti elenco puntato con i punti chiave, poi CTA (se necessaria) e chiusura.",
    qa:
      "Struttura a coppie Q/A (2–4), poi CTA (se necessaria) e chiusura; evita paragrafi lunghi.",
    recap_verbale:
      "Struttura in: Decisioni → Azioni (owner) → Scadenze; stile operativo, zero frasi vaghe. Se serve una CTA, aggiungila come ultima riga prima della chiusura.",
  };

  const structureRule = [structureRuleMap[b.struttura!], ...baseCtaRules].join(" ");

  // 3) Lunghezza (±10%)
  const lengthRule =
    b.lunghezza === "corta"
      ? { minWords: 0, maxWords: 120, tolerancePct: 10 }
      : b.lunghezza === "lunga"
      ? { minWords: 250, maxWords: 450, tolerancePct: 10 }
      : { minWords: 120, maxWords: 250, tolerancePct: 10 };

  // 4) Formalità
  const formalityRuleMap: Record<EmailFormalita, string> = {
    molto_formale: "Registro molto formale; niente contrazioni, niente colloquialismi.",
    formale: "Registro professionale; cortese, diretto, senza slang.",
    neutra: "Registro neutro; semplice, chiaro, non rigido.",
    colloquiale: "Registro colloquiale ma rispettoso; frasi brevi, tono umano.",
  };
  const formalityRule = formalityRuleMap[b.formalita!];

  // 5) Energia
  const energyRuleMap: Record<EmailEnergia, string> = {
    soft: "Tono gentile e non pressante: evita imperativi; usa formule attenuate ('quando puoi', 'se ti va').",
    diretta: "Tono diretto: vai al punto nelle prime 2 frasi; riduci preamboli.",
    assertiva: "Tono fermo: frasi dichiarative chiare; evita scuse e giri; niente aggressività.",
  };
  const energyRule = energyRuleMap[b.energia!];

  // 6) Relazione
  const relationshipRuleMap: Record<EmailRelazione, string> = {
    prima_volta: "Evita confidenze e umorismo; tono più distaccato.",
    ci_conosciamo: "Cordiale e neutra; non dare nulla per scontato.",
    rapporto_attivo: "Più umano; puoi usare formule più personali nei limiti della formalità scelta.",
  };
  const relationshipRule = relationshipRuleMap[b.relazione!];

  // 7) Ruolo destinatario
  const recipientRoleRuleMap: Record<EmailRuolo, string> = {
    cliente: "Tono orientato a chiarezza e affidabilità; evita tecnicismi inutili; focus su prossimi passi.",
    lead_prospect: "Tono orientato a valore; evita dettagli operativi; una sola azione finale.",
    fornitore: "Tono operativo; richieste precise; focus su tempi/condizioni/deliverable.",
    partner: "Tono collaborativo; evidenzia coordinamento e beneficio reciproco senza vendere troppo.",
    collega: "Tono pratico; diretto; evita formalismi eccessivi.",
    capo_superiore:
      "Tono rispettoso e sintetico; vai al punto; evidenzia stato/decisione/next step senza scaricare colpe.",
    hr_selezione: "Tono professionale; conciso; evita confidenze e dettagli irrilevanti.",
    altro: "Tono neutro e rispettoso; niente assunzioni.",
  };
  const recipientRoleRule = recipientRoleRuleMap[b.ruolo!];

  // 8) Persona
  const personaRule =
    b.persona === "noi"
      ? "Scrivi in prima persona plurale: usa 'noi/ci/nostro', evita 'io'. Mantieni la persona coerente in tutta l’email."
      : "Scrivi in prima persona singolare: usa 'io/mi/mio', evita 'noi'. Mantieni la persona coerente in tutta l’email.";

  // 9) Output
  const outputRuleMap: Record<EmailOutput, string> = {
    oggetto_e_corpo: "Restituisci: OGGETTO (1 riga) + CORPO (testo completo).",
    solo_corpo: "Restituisci solo il corpo della mail. Non includere oggetto.",
    tre_varianti_oggetto_e_corpo:
      "Restituisci 3 varianti complete, numerate 1/2/3, ciascuna con OGGETTO + CORPO. Le varianti devono differire per taglio/approccio, non solo per sinonimi. Mantieni invariati i dati/contesto.",
  };
  const outputRule = outputRuleMap[b.output!];

  // 9.1) Oggetto: solo se non solo_corpo
  let subjectRule: string | undefined;
  let subjectPolicy: EmailSingolaKernelV1["subjectPolicy"];
  let subjectExact: string | undefined;
  let subjectOptions: string[] | undefined;

  if (b.output !== "solo_corpo") {
    const pol = b.oggettoPolicy ?? "generalo_tu";
    if (pol === "generalo_tu") {
      subjectPolicy = "generate";
      subjectRule =
        "Se devi includere l’oggetto, generane uno coerente con scopo e contenuto. Oggetto: 6–10 parole, chiaro, niente clickbait, niente ALL CAPS.";
    } else if (pol === "lo_scrivo_io") {
      subjectPolicy = "use_exact";
      subjectExact = (b.oggettoText || "").trim();
      subjectRule =
        "Se devi includere l’oggetto, usa ESATTAMENTE quello fornito dall’utente (non correggere né riscrivere).";
    } else {
      subjectPolicy = "choose_from_list";
      subjectOptions = (b.oggettiAlt || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      subjectRule =
        "Se devi includere l’oggetto, scegli uno tra quelli forniti. Se output=3 varianti, usa un oggetto diverso per ogni variante (1 oggetto per variante).";
    }
  }

  // 10) Saluto
  let greetingRule = "";
  let greetingExact: string | undefined;
  if (b.saluto === "personalizzato") {
    greetingRule = "Usa esattamente il saluto fornito dall’utente, senza modifiche. Il saluto deve essere una sola riga.";
    greetingExact = (b.salutoText || "").trim();
  } else if (b.saluto === "formale") {
    greetingRule =
      "Apri con un saluto formale, coerente con Lingua + Formalità + Relazione + Ruolo + Energia. Il saluto deve essere una sola riga (no frasi extra salvo richieste esplicite dal contesto).";
  } else {
    greetingRule =
      "Apri con un saluto neutro, coerente con Lingua + Formalità + Relazione + Ruolo + Energia. Il saluto deve essere una sola riga (no frasi extra salvo richieste esplicite dal contesto).";
  }

  // 11) Chiusura
  let closingRule = "";
  let closingExact: string | undefined;
  if (b.chiusura === "personalizzata") {
    closingRule = "Usa esattamente la chiusura fornita dall’utente, senza modifiche. La chiusura deve essere una sola riga.";
    closingExact = (b.chiusuraText || "").trim();
  } else if (b.chiusura === "formale") {
    closingRule =
      "Chiudi con una formula formale, coerente con Lingua + Formalità + Relazione + Ruolo + Energia. La chiusura deve essere una sola riga.";
  } else {
    closingRule =
      "Chiudi con una formula neutra, coerente con Lingua + Formalità + Relazione + Ruolo + Energia. La chiusura deve essere una sola riga.";
  }

  // 12) Firma
  const signature: EmailSingolaKernelV1["signature"] = (() => {
    const t = b.firmaTipo ?? "nessuna";
    if (t === "nessuna") return { type: "none" };

    const nome = (b.firmaNomeCognome || "").trim();
    const ruolo = (b.firmaRuolo || "").trim();

    if (t === "standard") {
      const lines = [nome, ruolo].filter(Boolean);
      return { type: "standard", lines };
    }

    // completa
    const azienda = (b.firmaAzienda || "").trim();

    // ordine contatti fisso
    const contatti = [
      (b.firmaTelefono || "").trim() ? `Tel: ${(b.firmaTelefono || "").trim()}` : "",
      (b.firmaEmail || "").trim() ? `Email: ${(b.firmaEmail || "").trim()}` : "",
      (b.firmaSito || "").trim() ? `Sito: ${(b.firmaSito || "").trim()}` : "",
      (b.firmaIndirizzo || "").trim() ? `Indirizzo: ${(b.firmaIndirizzo || "").trim()}` : "",
      (b.firmaPivaInfo || "").trim() ? `${(b.firmaPivaInfo || "").trim()}` : "",
    ].filter(Boolean);

    const lines = [nome, ruolo, azienda, ...contatti].filter(Boolean);
    return { type: "complete", lines };
  })();

  const signatureRule =
    signature?.type === "none"
      ? "Non includere alcuna firma."
      : signature?.type === "standard"
      ? "Includi firma con Nome e cognome + Ruolo usando i campi forniti dall’utente. Non inventare."
      : "Includi firma con Nome e cognome + Ruolo + Azienda + contatti presenti e non vuoti, nell’ordine: Telefono → Email → Sito → Indirizzo → P.IVA/info legale. La firma va DOPO la chiusura, su righe separate.";

  // 13) Formattazione
  const formattingRuleMap: Record<EmailFormattazione, string> = {
    paragrafi:
      "Scrivi in paragrafi brevi (max 2–4 righe ciascuno). Evita muri di testo. Niente elenchi puntati salvo necessità. Non usare più di un elenco puntato principale (no bullet annidati) salvo che il layout lo richieda.",
    bullet_preferita:
      "Preferisci elenchi puntati per i punti chiave. Mantieni ogni bullet su una riga (o massimo due). Non usare più di un elenco puntato principale (no bullet annidati) salvo che il layout lo richieda.",
    mix:
      "Usa paragrafi per contesto/apertura e bullet list per punti chiave/elementi concreti; chiusura in paragrafi. Non usare più di un elenco puntato principale (no bullet annidati) salvo che il layout lo richieda.",
  };
  const formattingRule = formattingRuleMap[b.formattazione!];

  // Regole globali + precedenza toni
  const tonePrecedenceRule = "In caso di conflitto tra opzioni di tono: Formalità > Ruolo > Relazione > Energia.";

  const globalRules = [
    "Non inventare dati non forniti dall’utente (nomi, numeri, date, promesse).",
    "Mantieni coerenza totale con le scelte del brief; non introdurre nuove azioni se non richieste.",
  ];

  return {
    kind: "email_singola",
    version: 1,

    tonePrecedenceRule,
    globalRules,

    languageRule,
    structureRule,
    lengthRule,
    formalityRule,
    energyRule,
    relationshipRule,
    recipientRoleRule,
    personaRule,

    outputRule,

    subjectRule,
    subjectPolicy,
    subjectExact,
    subjectOptions,

    greetingRule,
    greetingExact,

    closingRule,
    closingExact,

    signatureRule,
    signature,

    formattingRule,
  };
}
