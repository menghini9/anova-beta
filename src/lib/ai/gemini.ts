// ======================================================
// GEMINI PROVIDER — Minimal (text + usage + model)
// Path: src/lib/ai/gemini.ts
// ======================================================

export type GeminiUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

export type GeminiReply = {
  text: string;
  usage: GeminiUsage | null;
  model: string;
};

// --------------------------
// Helpers
// --------------------------
function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function geminiReply(args: {
  prompt: string;
  rules?: string;
}): Promise<GeminiReply> {
  const apiKey = mustEnv("GEMINI_API_KEY");

  // ✅ Scegli il modello qui (allinealo alla tua pricing table in cost.ts)
  // Esempi tipici: "gemini-2.5-flash", "gemini-2.5-pro", ecc.
  const model = "gemini-2.5-flash";

const system = args.rules?.trim()
  ? `Regole operative:\n${args.rules.trim()}`
  : "You are Gemini, a large language model created by Google.";



  // --------------------------
  // Gemini generateContent (testo)
  // --------------------------
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // preferisco header (pulito, niente querystring)
      "x-goog-api-key": apiKey,
    },
body: JSON.stringify({
  ...(system
    ? {
        systemInstruction: {
          parts: [{ text: system }],
        },
      }
    : {}),
  contents: [
    {
      role: "user",
      parts: [{ text: args.prompt }],
    },
  ],
}),

  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini error: ${res.status} ${res.statusText} :: ${errText}`);
  }

  const data: any = await res.json();

  // --------------------------
  // Estrazione testo (robusta)
  // --------------------------
  let text = "";
  try {
    const cand0 = data?.candidates?.[0];
    const parts = cand0?.content?.parts;
    if (Array.isArray(parts)) {
      for (const p of parts) {
        if (typeof p?.text === "string") text += p.text;
      }
    }
    text = String(text ?? "").trim();
  } catch {
    text = "";
  }

  // --------------------------
  // Usage tokens (Gemini usageMetadata)
  // --------------------------
  const usage: GeminiUsage | null = data?.usageMetadata
    ? {
        input_tokens: Number(data.usageMetadata.promptTokenCount ?? 0),
        output_tokens: Number(data.usageMetadata.candidatesTokenCount ?? 0),
        total_tokens: Number(data.usageMetadata.totalTokenCount ?? 0),
      }
    : null;

  return {
    text: text || "⚠️ Risposta vuota.",
    usage,
    model,
  };
}
