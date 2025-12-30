// ======================================================
// CONTRATTO — SCRITTURA / PROGETTO BREVE (Brief1 + Brief2)
// Path: /src/lib/brief/scrittura/breve/brief2/contract.ts
// ======================================================

import type { ScritturaBreveBrief1 } from "../brief1";

// Nota: qui non importiamo i tipi di tutti i brief2 per non creare dipendenze inutili.
// Lavoriamo con "any" in modo controllato: leggiamo solo chiavi note.

// =========================
// 1) HELPER LABELS (valori -> testo umano)
// =========================

const LABELS: Record<string, Record<string, string>> = {
  brief1_Q1: {
    email: "Email",
    messaggio: "Messaggio",
    post_social: "Post social",
    descrizione_prodotto: "Descrizione prodotto",
    pagina_sito: "Pagina sito",
    comunicazione_interna: "Comunicazione interna",
    altro: "Altro",
  },
  brief1_Q2: {
    cliente: "Cliente",
    fornitore: "Fornitore",
    pubblico: "Pubblico",
    collega: "Collega",
    capo: "Capo",
    amico: "Amico",
    partner: "Partner",
    HR: "HR",
    istituzione: "Istituzione",
    azienda: "Azienda",
    altro: "Altro",
  },
  brief1_Q3: {
    informare: "Informare",
    convincere: "Convincere",
    vendere: "Vendere",
    chiedere: "Chiedere",
    scusarsi: "Scusarsi",
    aggiornare: "Aggiornare",
    altro: "Altro",
  },
  brief1_Q4: {
    formale: "Formale",
    neutro: "Neutro",
    amichevole: "Amichevole",
    deciso: "Deciso",
    premium: "Premium",
    ironico: "Ironico",
  },
  brief1_Q5: {
    corta: "Corta",
    standard: "Standard",
    lunga: "Lunga",
  },
};

// helper generico
function label(scope: keyof typeof LABELS, value: any): string {
  const v = String(value ?? "");
  // ✅ parentesi: prima risolvo ??, poi applico fallback "-"
  return (LABELS[scope]?.[v] ?? v) || "-";
}


function joinMulti(values: any[] | undefined, map?: Record<string, string>): string {
  if (!Array.isArray(values) || values.length === 0) return "-";
  return values
    .map((v) => (map ? map[String(v)] ?? String(v) : String(v)))
    .join(", ");
}

// =========================
// 2) CONTRATTO — BRIEF 1
// =========================

export function buildScritturaBreveContractBrief1(brief1: ScritturaBreveBrief1): string[] {
  return [
    `Tipo: ${label("brief1_Q1", brief1.Q1)}`,
    `Destinatario: ${label("brief1_Q2", brief1.Q2)}`,
    `Obiettivo: ${label("brief1_Q3", brief1.Q3)}`,
    `Tono: ${label("brief1_Q4", brief1.Q4)}`,
    `Lunghezza: ${label("brief1_Q5", brief1.Q5)}`,
    `Vincolo speciale: ${String(brief1.Q6 ?? "").trim() || "-"}`,
  ];
}

// =========================
// 3) CONTRATTO — BRIEF 2 (switch per tipo)
// =========================

export function buildScritturaBreveContractBrief2(
  brief1: ScritturaBreveBrief1,
  brief2: any
): string[] {
  switch (brief1.Q1) {
    case "email":
      return buildEmailLines(brief2);

    case "messaggio":
      return buildMessaggioLines(brief2);

    case "post_social":
      return buildPostSocialLines(brief2);

    case "descrizione_prodotto":
      return buildDescrizioneProdottoLines(brief2);

    case "pagina_sito":
      return buildPaginaSitoLines(brief2);

    case "comunicazione_interna":
      return buildComunicazioneInternaLines(brief2);

    case "altro":
    default:
      return buildAltroLines(brief2);
  }
}

// =========================
// 4) CONTRATTO COMPLETO (Brief1 + Brief2)
// =========================

export function buildScritturaBreveContractAll(
  brief1: ScritturaBreveBrief1,
  brief2: any
): { title: string; lines: string[] }[] {
  return [
    { title: "Brief — Giro 1", lines: buildScritturaBreveContractBrief1(brief1) },
    { title: "Brief — Giro 2", lines: buildScritturaBreveContractBrief2(brief1, brief2) },
  ];
}

// =========================
// 5) BUILDER SPECIFICI (BRIEF 2)
// =========================

function buildEmailLines(b: any): string[] {
  const tipoMap: Record<string, string> = {
    commerciale: "Commerciale",
    supporto: "Supporto",
    follow_up: "Follow-up",
    richiesta: "Richiesta",
    reclamo: "Reclamo",
    altro: "Altro",
  };
  const relMap: Record<string, string> = {
    prima_volta: "Prima volta",
    gia_in_contatto: "Già in contatto",
    rapporto_teso: "Rapporto teso",
  };
  const objMap: Record<string, string> = {
    informare: "Informare",
    chiedere: "Chiedere",
    sollecitare: "Sollecitare",
    proporre: "Proporre",
    chiudere_accordo: "Chiudere accordo",
  };
  const elMap: Record<string, string> = {
    link: "Link",
    allegato: "Allegato",
    data_ora: "Data-ora",
    prezzo: "Prezzo",
    codice_ordine: "Codice ordine",
  };
  const firmaMap: Record<string, string> = {
    standard: "Standard",
    ruolo_azienda: "Con ruolo + azienda",
    nessuna: "Nessuna",
  };
  const linguaMap: Record<string, string> = { IT: "IT", EN: "EN", DE: "DE", altro: "Altro" };

  return [
    `Tipo email: ${tipoMap[String(b?.Q1_tipoEmail)] ?? "-"}`,
    `Relazione: ${relMap[String(b?.Q2_relazione)] ?? "-"}`,
    `Obiettivo: ${objMap[String(b?.Q3_obiettivo)] ?? "-"}`,
    `Dati obbligatori presenti: ${b?.Q4_datiObbligatoriPresenti === "si" ? "Sì" : b?.Q4_datiObbligatoriPresenti === "no" ? "No" : "-"}`,
    `Elementi da includere: ${joinMulti(b?.Q5_elementiDaIncludere, elMap)}`,
    `Firma: ${firmaMap[String(b?.Q6_firma)] ?? "-"}`,
    `Lingua: ${linguaMap[String(b?.Q7_lingua)] ?? "-"}`,
  ];
}

function buildMessaggioLines(b: any): string[] {
  const canaleMap: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    sms: "SMS",
    instagram_dm: "Instagram DM",
    linkedin_dm: "LinkedIn DM",
  };
  const destMap: Record<string, string> = {
    cliente: "Cliente",
    amico: "Amico",
    collega: "Collega",
    fornitore: "Fornitore",
  };
  const objMap: Record<string, string> = {
    fissare_appuntamento: "Fissare appuntamento",
    risposta_rapida: "Risposta rapida",
    sollecito: "Sollecito",
    conferma: "Conferma",
    scuse: "Scuse",
  };
  const urgMap: Record<string, string> = { bassa: "Bassa", media: "Media", alta: "Alta" };
  const contMap: Record<string, string> = {
    prima_scrittura: "Prima scrittura",
    risposta_chat: "Risposta a chat esistente",
  };
  const infoMap: Record<string, string> = {
    data: "Data",
    ora: "Ora",
    luogo: "Luogo",
    prezzo: "Prezzo",
    link: "Link",
  };
  const chiMap: Record<string, string> = {
    domanda_finale: "Domanda finale",
    call_to_action: "Call-to-action",
    neutra: "Neutra",
  };

  return [
    `Canale: ${canaleMap[String(b?.Q1_canale)] ?? "-"}`,
    `Destinatario: ${destMap[String(b?.Q2_destinatario)] ?? "-"}`,
    `Obiettivo: ${objMap[String(b?.Q3_obiettivo)] ?? "-"}`,
    `Urgenza: ${urgMap[String(b?.Q4_urgenza)] ?? "-"}`,
    `Contesto: ${contMap[String(b?.Q5_contesto)] ?? "-"}`,
    `Info certe da includere: ${joinMulti(b?.Q6_infoCerte, infoMap)}`,
    `Chiusura: ${chiMap[String(b?.Q7_chiusura)] ?? "-"}`,
  ];
}

function buildPostSocialLines(b: any): string[] {
  const platMap: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    x: "X",
  };
  const objMap: Record<string, string> = {
    vendita: "Vendita",
    lead: "Lead",
    traffico: "Traffico",
    awareness: "Awareness",
    engagement: "Engagement",
  };
  const tgtMap: Record<string, string> = { privati: "Privati", aziende: "Aziende", entrambi: "Entrambi" };
  const ctaMap: Record<string, string> = {
    dm: "DM",
    commenta: "Commenta",
    visita_sito: "Visita sito",
    salva: "Salva",
    condividi: "Condividi",
    nessuna: "Nessuna",
  };
  const hashMap: Record<string, string> = {
    nessuno: "Nessuno",
    pochi: "Pochi (3–5)",
    standard: "Standard (6–10)",
    molti: "Molti (11–15)",
  };
  const vinMap: Record<string, string> = {
    nessuno: "Nessuno",
    no_promesse: "No promesse",
    safe_neutro: "Linguaggio safe neutro",
  };
  const assetMap: Record<string, string> = {
    nessuno: "Nessuno",
    link: "Link",
    foto_video: "Foto-video",
    testo_grezzo: "Testo grezzo",
    punti_elenco: "Punti elenco",
  };

  return [
    `Piattaforma: ${platMap[String(b?.Q1_piattaforma)] ?? "-"}`,
    `Obiettivo: ${objMap[String(b?.Q2_obiettivo)] ?? "-"}`,
    `Target: ${tgtMap[String(b?.Q3_target)] ?? "-"}`,
    `CTA: ${ctaMap[String(b?.Q4_cta)] ?? "-"}`,
    `Hashtag livello: ${hashMap[String(b?.Q5_hashtagLivello)] ?? "-"}`,
    `Vincoli: ${vinMap[String(b?.Q6_vincoli)] ?? "-"}`,
    `Asset: ${assetMap[String(b?.Q7_assetDisponibili)] ?? "-"}`,
  ];
}

function buildDescrizioneProdottoLines(b: any): string[] {
  const doveMap: Record<string, string> = {
    ecommerce: "E-commerce",
    amazon: "Amazon",
    catalogo_pdf: "Catalogo PDF",
    social_shop: "Social shop",
  };
  const catMap: Record<string, string> = {
    moda: "Moda",
    tech: "Tech",
    casa: "Casa",
    food: "Food",
    servizi: "Servizi",
    altro: "Altro",
  };
  const faseMap: Record<string, string> = { lancio: "Lancio", update: "Update", promo: "Promo" };
  const datiMap: Record<string, string> = {
    scheda_tecnica: "Scheda tecnica",
    caratteristiche: "Caratteristiche",
    solo_idea: "Solo idea",
  };
  const puntiMap: Record<string, string> = {
    materiali: "Materiali",
    misure: "Misure",
    compatibilita: "Compatibilità",
    manutenzione: "Manutenzione",
    garanzia: "Garanzia",
  };
  const benMap: Record<string, string> = {
    qualita: "Qualità",
    prezzo: "Prezzo",
    velocita: "Velocità",
    design: "Design",
    sostenibilita: "Sostenibilità",
  };
  const claimMap: Record<string, string> = {
    liberi: "Liberi",
    solo_verificabili: "Solo verificabili",
    super_cauti: "Super cauti",
  };
  const objMap: Record<string, string> = {
    prezzo: "Prezzo",
    durata: "Durata",
    compatibilita: "Compatibilità",
    spedizione: "Spedizione",
    resi: "Resi",
  };

  return [
    `Dove verrà usata: ${doveMap[String(b?.Q1_doveUsata)] ?? "-"}`,
    `Categoria: ${catMap[String(b?.Q2_categoria)] ?? "-"}`,
    `Fase: ${faseMap[String(b?.Q3_fase)] ?? "-"}`,
    `Dati disponibili: ${datiMap[String(b?.Q4_datiDisponibili)] ?? "-"}`,
    `Punti obbligatori: ${joinMulti(b?.Q5_puntiObbligatori, puntiMap)}`,
    `Beneficio principale: ${benMap[String(b?.Q6_beneficioPrincipale)] ?? "-"}`,
    `Claim consentiti: ${claimMap[String(b?.Q7_claimConsentiti)] ?? "-"}`,
    `Obiezione da prevenire: ${objMap[String(b?.Q8_obiezioneDaPrevenire)] ?? "-"}`,
  ];
}

function buildPaginaSitoLines(b: any): string[] {
  const tipoMap: Record<string, string> = {
    home: "Home",
    landing: "Landing",
    chi_siamo: "Chi siamo",
    servizi: "Servizi",
    prodotto: "Prodotto",
    faq: "FAQ",
    contatti: "Contatti",
  };
  const objMap: Record<string, string> = {
    conversione: "Conversione",
    informazione: "Informazione",
    posizionamento: "Posizionamento",
    supporto: "Supporto",
  };
  const tgtMap: Record<string, string> = { privati: "Privati", aziende: "Aziende", entrambi: "Entrambi" };
  const ctaMap: Record<string, string> = {
    preventivo: "Preventivo",
    acquista: "Acquista",
    prenota: "Prenota",
    contatto: "Contatto",
    iscrizione: "Iscrizione",
    nessuna: "Nessuna",
  };
  const sezMap: Record<string, string> = {
    hero: "Hero",
    benefici: "Benefici",
    prove: "Prove (testimonianze)",
    pricing: "Pricing",
    faq: "FAQ",
  };
  const proveMap: Record<string, string> = {
    recensioni: "Recensioni",
    numeri: "Numeri",
    case_study: "Case study",
    nessuna: "Nessuna",
  };
  const vinMap: Record<string, string> = {
    no_prezzi: "No prezzi",
    prezzi_si: "Prezzi sì",
    no_claim_aggressivi: "No claim aggressivi",
    compliance: "Compliance",
  };

  return [
    `Tipo pagina: ${tipoMap[String(b?.Q1_tipoPagina)] ?? "-"}`,
    `Obiettivo: ${objMap[String(b?.Q2_obiettivoPagina)] ?? "-"}`,
    `Target: ${tgtMap[String(b?.Q3_target)] ?? "-"}`,
    `CTA principale: ${ctaMap[String(b?.Q4_ctaPrincipale)] ?? "-"}`,
    `Sezioni obbligatorie: ${joinMulti(b?.Q5_sezioniObbligatorie, sezMap)}`,
    `Prove disponibili: ${proveMap[String(b?.Q6_proveDisponibili)] ?? "-"}`,
    `Vincoli: ${joinMulti(b?.Q7_vincoli, vinMap)}`,
  ];
}

function buildComunicazioneInternaLines(b: any): string[] {
  const tipoMap: Record<string, string> = {
    avviso: "Avviso",
    procedura: "Procedura",
    aggiornamento: "Aggiornamento",
    richiesta: "Richiesta",
    feedback: "Feedback",
    crisi: "Crisi",
  };
  const destMap: Record<string, string> = { tutti: "Tutti", reparto: "Reparto", manager: "Manager", singolo: "Singolo" };
  const objMap: Record<string, string> = {
    informare: "Informare",
    allineare: "Allineare",
    richiedere_azione: "Richiedere azione",
    prevenire_errori: "Prevenire errori",
  };
  const canMap: Record<string, string> = {
    email: "Email",
    chat_aziendale: "Chat aziendale",
    bacheca: "Bacheca",
    meeting_note: "Meeting note",
  };
  const urgMap: Record<string, string> = { bassa: "Bassa", media: "Media", alta: "Alta" };
  const scaMap: Record<string, string> = { oggi: "Oggi", "24h": "24h", settimana: "Settimana", nessuna: "Nessuna" };
  const contMap: Record<string, string> = {
    cosa_cambia: "Cosa cambia",
    da_quando: "Da quando",
    cosa_fare: "Cosa fare",
    chi_contattare: "Chi contattare",
  };

  return [
    `Tipo: ${tipoMap[String(b?.Q1_tipo)] ?? "-"}`,
    `Destinatari: ${destMap[String(b?.Q2_destinatari)] ?? "-"}`,
    `Obiettivo: ${objMap[String(b?.Q3_obiettivo)] ?? "-"}`,
    `Canale: ${canMap[String(b?.Q4_canale)] ?? "-"}`,
    `Urgenza: ${urgMap[String(b?.Q5_urgenza)] ?? "-"}`,
    `Azione richiesta: ${b?.Q6_azioneRichiesta === "si" ? "Sì" : b?.Q6_azioneRichiesta === "no" ? "No" : "-"}`,
    `Scadenza: ${scaMap[String(b?.Q7_scadenza)] ?? "-"}`,
    `Contenuti obbligatori: ${joinMulti(b?.Q8_contenutiObbligatori, contMap)}`,
  ];
}

function buildAltroLines(b: any): string[] {
  const usoMap: Record<string, string> = { pubblico: "Pubblico", privato: "Privato", aziendale: "Aziendale" };
  const objMap: Record<string, string> = {
    informare: "Informare",
    convincere: "Convincere",
    vendere: "Vendere",
    chiedere: "Chiedere",
    organizzare: "Organizzare",
  };
  const destMap: Record<string, string> = { singolo: "Singolo", gruppo: "Gruppo", pubblico_generico: "Pubblico generico" };
  const contMap: Record<string, string> = { nuovo: "Nuovo", follow_up: "Follow-up", risposta: "Risposta" };
  const datiMap: Record<string, string> = {
    nessuno: "Nessuno",
    punti_elenco: "Punti elenco",
    testo_grezzo: "Testo grezzo",
    file: "File",
  };
  const elMap: Record<string, string> = {
    date: "Date",
    prezzi: "Prezzi",
    link: "Link",
    nomi: "Nomi",
    contatti: "Contatti",
  };
  const rischioMap: Record<string, string> = { basso: "Basso", medio: "Medio", alto: "Alto" };

  return [
    `Uso: ${usoMap[String(b?.Q1_uso)] ?? "-"}`,
    `Obiettivo: ${objMap[String(b?.Q2_obiettivo)] ?? "-"}`,
    `Destinatario: ${destMap[String(b?.Q3_destinatario)] ?? "-"}`,
    `Contesto: ${contMap[String(b?.Q4_contesto)] ?? "-"}`,
    `Dati disponibili: ${datiMap[String(b?.Q5_datiDisponibili)] ?? "-"}`,
    `Elementi obbligatori: ${joinMulti(b?.Q6_elementiObbligatori, elMap)}`,
    `Rischio: ${rischioMap[String(b?.Q7_rischio)] ?? "-"}`,
  ];
}
