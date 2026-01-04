// ======================================================
// EMAIL SINGOLA — BRIEF 2 (Giro 2) + Kernel Translator
// Path: src/lib/brief/scrittura/jobs/email_singola/brief2.ts
// Note:
// - Questo giro introduce: scopo, risultato desiderato, obbligatori,
//   allegati/link, scadenza/urgenza, follow-up, vincoli di stile.
// - UI salva scelte; il provider riceve SOLO regole (kernel).
// ======================================================

// =========================
// 0) TIPI — scelte UI
// =========================

export type EmailScopo =
  | "salutare_presentarmi"
  | "chiedere_qualcosa"
  | "proporre_qualcosa"
  | "aggiornare"
  | "sollecitare"
  | "gestire_problema"
  | "altro";

export type EmailAllegatiMode = "nessuno" | "si";

export type EmailScadenzaMode = "nessuna" | "entro_data" | "entro_x_giorni" | "urgente";

export type EmailFollowUpMode = "nessun_riferimento" | "ricontatto_soft" | "ricontatto_entro_x_giorni";

// =========================
// 1) MODELLO BRIEF2 (salvato su Firestore in brief.round2)
// =========================

export type EmailSingolaBrief2 = {
  // 1) Scopo
  scopo?: EmailScopo;

  // 2) Risultato desiderato (1 riga testo)
  risultatoDesiderato?: string;

  // 3) Contenuti obbligatori (1–3 righe)
  contenutiObbligatori?: string; // una per riga, max 3

  // 4) Allegati/Link
  allegatiMode?: EmailAllegatiMode;
  allegatiText?: string; // uno per riga (se allegatiMode="si")

  // 5) Scadenza / urgenza
  scadenzaMode?: EmailScadenzaMode;
  scadenzaDataOraText?: string; // se "entro_data"
  scadenzaXgiorniText?: string; // se "entro_x_giorni" (solo numero o testo breve: "5" / "10")

  // 6) Follow-up
  followUpMode?: EmailFollowUpMode;
  followUpXgiorniText?: string; // se "ricontatto_entro_x_giorni"

  // 7) Vincoli di stile (multi) — semplice: righe (1 vincolo per riga)
  vincoliStile?: string; // una per riga
};

// =========================
// 2) DEFAULTS (sistema)
// =========================

export const EMAIL_SINGOLA_BRIEF2_DEFAULT: Required<
  Pick<
    EmailSingolaBrief2,
    "scopo" | "risultatoDesiderato" | "contenutiObbligatori" | "allegatiMode" | "scadenzaMode" | "followUpMode" | "vincoliStile"
  >
> = {
  scopo: "aggiornare",
  risultatoDesiderato: "Nessuna azione / solo informare",
  contenutiObbligatori: "", // vuoto = user non ha messo, poi kernel applica default generale
  allegatiMode: "nessuno",
  scadenzaMode: "nessuna",
  followUpMode: "nessun_riferimento",
  vincoliStile: "",
};

// =========================
// 3) HELPERS — parsing righe
// =========================

function splitLines(s?: string): string[] {
  return (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function clampMax(arr: string[], max: number): string[] {
  return arr.slice(0, max);
}

function isNullaOnly(text: string): boolean {
  const t = text.trim().toLowerCase();
  // volutamente semplice e robusto
  return (
    t === "" ||
    t.includes("nessuna azione") ||
    t.includes("solo informare") ||
    t.includes("solo saluto") ||
    t === "nulla" ||
    t === "niente" ||
    t === "nessuna"
  );
}

// =========================
// 4) VALIDAZIONE MINIMA (campi condizionali)
// =========================

export function validateEmailSingolaBrief2(b: EmailSingolaBrief2) {
  const errors: string[] = [];

  const scopo = b.scopo ?? EMAIL_SINGOLA_BRIEF2_DEFAULT.scopo;

  const risultato = (b.risultatoDesiderato ?? EMAIL_SINGOLA_BRIEF2_DEFAULT.risultatoDesiderato).trim();
  // obbligatorio: almeno qualcosa (default già copre, ma se UI passa stringa vuota la blocchiamo)
  if (!risultato) errors.push("Risultato desiderato obbligatorio (1 riga).");

  // contenuti obbligatori: max 3 righe (se l’utente esagera, lo tagliamo ma segnaliamo)
  const obbl = splitLines(b.contenutiObbligatori);
  if (obbl.length > 3) errors.push("Contenuti obbligatori: massimo 3 righe.");

  // allegati
  const allegMode = b.allegatiMode ?? EMAIL_SINGOLA_BRIEF2_DEFAULT.allegatiMode;
  if (allegMode === "si") {
    const lines = splitLines(b.allegatiText);
    if (lines.length === 0) errors.push("Allegati/Link: elenco obbligatorio (uno per riga).");
  }

  // scadenza
  const scadMode = b.scadenzaMode ?? EMAIL_SINGOLA_BRIEF2_DEFAULT.scadenzaMode;
  if (scadMode === "entro_data") {
    if (!b.scadenzaDataOraText || !b.scadenzaDataOraText.trim())
      errors.push("Scadenza: data/ora obbligatoria (esatta).");
  }
  if (scadMode === "entro_x_giorni") {
    if (!b.scadenzaXgiorniText || !b.scadenzaXgiorniText.trim())
      errors.push("Scadenza: X giorni obbligatorio (esatto).");
  }

  // follow-up
  const fuMode = b.followUpMode ?? EMAIL_SINGOLA_BRIEF2_DEFAULT.followUpMode;
  if (fuMode === "ricontatto_entro_x_giorni") {
    if (!b.followUpXgiorniText || !b.followUpXgiorniText.trim())
      errors.push("Follow-up: X giorni obbligatorio (esatto).");
  }

  // regola: follow-up non deve essere inserito se risultato è "nulla"
  // (non blocco l'utente qui, ma avviso: meglio forzare in kernel)
  if (isNullaOnly(risultato) && fuMode !== "nessun_riferimento") {
    errors.push("Follow-up non consentito se Risultato desiderato è 'nulla/solo informare/saluto'.");
  }

  // scopo non cambia la chiusura: solo nota, non valida

  return { ok: errors.length === 0, errors };
}

// =========================
// 5) KERNEL (solo regole operative da passare al provider)
// =========================

export type EmailSingolaKernel2V1 = {
  kind: "email_singola_round2";
  version: 1;

  // Scopo (regola logica)
  purposeRule: string;

  // Risultato desiderato (regole A-D)
  desiredOutcome: {
    raw: string; // testo utente (1 riga)
    isNulla: boolean;
    rules: string[];
  };

  // Contenuti obbligatori (1-3 righe o default)
  mandatoryContent: {
    items: string[]; // 0..3 (se 0, provider usa default di sistema)
    rule: string;
    defaultIfEmpty: string[];
  };

  // Allegati/link
  attachments: {
    mode: "none" | "present";
    items: string[];
    rule: string;
  };

  // Scadenza / urgenza
  deadline: {
    mode: "none" | "by_exact_datetime" | "within_x_days" | "urgent";
    value?: string; // data/ora o X
    rules: string[];
  };

  // Follow-up
  followUp: {
    mode: "none" | "soft" | "within_x_days";
    value?: string; // X
    rules: string[];
  };

  // Vincoli di stile
  styleConstraints: {
    items: string[];
    rules: string[];
  };
};

// =========================
// 6) TRADUTTORE: Brief2 -> Kernel
// =========================

export function buildEmailSingolaKernel2V1(input: EmailSingolaBrief2): EmailSingolaKernel2V1 {
  const b: EmailSingolaBrief2 = { ...EMAIL_SINGOLA_BRIEF2_DEFAULT, ...input };

  // 1) Scopo
  const purposeRuleMap: Record<EmailScopo, string> = {
    salutare_presentarmi:
      "Focus su contatto umano + motivo del messaggio. Nessuna richiesta obbligatoria: se il Risultato desiderato è 'nulla', chiudi senza call-to-action.",
    chiedere_qualcosa:
      "La domanda deve essere esplicita e facile da rispondere. Se possibile: 1 domanda principale; se più punti, raggruppali in elenco.",
    proporre_qualcosa:
      "Esplicita proposta + perché ha senso. Chiudi con un next step coerente con il Risultato desiderato (non inventarlo).",
    aggiornare:
      "Sintesi stato attuale + cosa cambia + next step (se esiste nei dati). Evita dettagli non necessari.",
    sollecitare:
      "Richiama ciò che è in sospeso (cosa/da quando). Tono fermo ma civile. Se c’è scadenza nel brief, rendila chiara; altrimenti non inventarla.",
    gestire_problema:
      "Descrivi problema + impatto + cosa serve per risolvere. Evita accuse; resta su fatti verificabili. Se mancano dettagli: fai max 3 domande.",
    altro:
      "Usa come guida primaria il Risultato desiderato + il campo COSA del Giro 3. Non assumere scopi non dichiarati.",
  };

  const purposeRule = purposeRuleMap[b.scopo!];

  // 2) Risultato desiderato
  const desiredRaw = (b.risultatoDesiderato || "").trim();
  const desiredIsNulla = isNullaOnly(desiredRaw);

  const desiredRules = [
    "Regola principale: usa il 'Risultato desiderato' per decidere l’ultima riga della mail (chiusura operativa / next step). Non aggiungere azioni diverse da quelle richieste.",
    "Se il Risultato desiderato è 'nulla/solo saluto/solo informare': chiudi senza richiesta (niente CTA, niente 'fammi sapere', niente call).",
    "Se il Risultato desiderato descrive un’azione: trasformalo in una chiusura chiara e breve (1 riga), senza aggiungere condizioni non dichiarate.",
    "Se il campo è vago o vuoto: non inventare; fai 1 domanda chiarificatrice solo se necessario per produrre un output sensato (conteggia nelle max 3 domande).",
  ];

  // 3) Contenuti obbligatori
  const mandatoryItems = clampMax(splitLines(b.contenutiObbligatori), 3);
  const defaultIfEmpty = [
    "Includi almeno: (1) fatto/situazione dal COSA, (2) cosa cambia/serve, (3) risultato desiderato (se c’è azione).",
  ];

  const mandatoryRule =
    "Prima di chiudere, verifica internamente che ogni riga obbligatoria sia stata inclusa almeno una volta, senza cambiarne significato.";

  // 4) Allegati/link
  const attMode = b.allegatiMode ?? "nessuno";
  const attItems = attMode === "si" ? splitLines(b.allegatiText) : [];
  const attachmentsRule =
    "Non incollare URL lunghissimi dentro il testo se non richiesto. Se presenti, mettili puliti su una riga dedicata. Se più elementi, raggruppali nella stessa riga o mini-lista coerente con la formattazione scelta. Usa ESATTAMENTE nomi/link forniti. Non aggiungere elementi non presenti.";

  // 5) Scadenza / urgenza
  const scMode = b.scadenzaMode ?? "nessuna";
  let deadline: EmailSingolaKernel2V1["deadline"];

  if (scMode === "nessuna") {
    deadline = { mode: "none", rules: ["Non inserire scadenze o urgenza nel testo."] };
  } else if (scMode === "entro_data") {
    deadline = {
      mode: "by_exact_datetime",
      value: (b.scadenzaDataOraText || "").trim(),
      rules: [
        "Se scadenza presente, mettila nella parte finale (zona chiusura/next step), non nel mezzo del testo, salvo layout 'Recap/Verbale'.",
        "Cita la data/ora ESATTAMENTE come fornita dall’utente, una sola volta. Non correggere formato e non cambiare fuso.",
      ],
    };
  } else if (scMode === "entro_x_giorni") {
    deadline = {
      mode: "within_x_days",
      value: (b.scadenzaXgiorniText || "").trim(),
      rules: [
        "Se scadenza presente, mettila nella parte finale (zona chiusura/next step), non nel mezzo del testo, salvo layout 'Recap/Verbale'.",
        "Cita la scadenza ESATTAMENTE come indicata dall’utente ('entro X giorni'), una sola volta. Non calcolare date, non convertire in data/ora, non reinterpretare X.",
      ],
    };
  } else {
    // urgente
    deadline = {
      mode: "urgent",
      rules: [
        "Rendi il messaggio più prioritario e asciutto (meno preamboli), ma senza drammatizzare o usare pressioni inutili.",
        "Non aggiungere una scadenza se non è stata fornita.",
      ],
    };
  }

  // 6) Follow-up
  const fuMode = b.followUpMode ?? "nessun_riferimento";

  // Regola: niente follow-up se nulla
  const forcedFuMode =
    desiredIsNulla ? "nessun_riferimento" : fuMode;

  let followUp: EmailSingolaKernel2V1["followUp"];

  if (forcedFuMode === "nessun_riferimento") {
    followUp = { mode: "none", rules: ["Non menzionare follow-up o solleciti futuri."] };
  } else if (forcedFuMode === "ricontatto_soft") {
    followUp = {
      mode: "soft",
      rules: [
        "Aggiungi una sola riga soft di follow-up (senza scadenze), coerente con i toni scelti. Niente pressioni.",
        "Non inserire follow-up se il Risultato desiderato è 'nulla/solo saluto'.",
      ],
    };
  } else {
    followUp = {
      mode: "within_x_days",
      value: (b.followUpXgiorniText || "").trim(),
      rules: [
        "Aggiungi una sola riga di follow-up che cita ESATTAMENTE 'entro X giorni' con l’X fornito dall’utente. Non calcolare date e non reinterpretare X.",
        "Non inserire follow-up se il Risultato desiderato è 'nulla/solo saluto'.",
      ],
    };
  }

  // 7) Vincoli di stile
  const styleItems = splitLines(b.vincoliStile);
  const styleRules = [
    "I vincoli di stile non devono cambiare i fatti o il senso dei contenuti obbligatori.",
    "Tratta i vincoli come una lista di istruzioni: applica ciascun vincolo alla lettera.",
    "Se un vincolo è ambiguo o in conflitto con un altro: chiedi 1 chiarimento solo se indispensabile. In caso di conflitto, vince il più restrittivo.",
  ];

  return {
    kind: "email_singola_round2",
    version: 1,

    purposeRule,

    desiredOutcome: {
      raw: desiredRaw,
      isNulla: desiredIsNulla,
      rules: desiredRules,
    },

    mandatoryContent: {
      items: mandatoryItems,
      rule: mandatoryRule,
      defaultIfEmpty,
    },

    attachments: {
      mode: attItems.length ? "present" : "none",
      items: attItems,
      rule: attachmentsRule,
    },

    deadline,

    followUp,

    styleConstraints: {
      items: styleItems,
      rules: styleRules,
    },
  };
}
