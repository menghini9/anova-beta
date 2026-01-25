// ======================================================
// OPENAI PROVIDER — Minimal (text + usage + model)
// Path: src/lib/ai/openai.ts
// ======================================================

export type OpenAiUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

export type OpenAiReply = {
  text: string;
  usage: OpenAiUsage | null;
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

export async function openAIReply(args: {
  prompt: string;
  rules?: string;
}): Promise<OpenAiReply> {
  const apiKey = mustEnv("OPENAI_API_KEY");

  // ✅ Scegli il modello che vuoi usare qui (coerente con la tua pricing table in cost.ts)
  const model = "gpt-4o-mini"; // cambia se vuoi: "gpt-4.1", "gpt-4o-mini", "gpt-5", ecc.

const system = args.rules?.trim() ? args.rules.trim() : "";


  // --------------------------
  // OpenAI Responses API (testo)
  // --------------------------
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
input: system
  ? [
      { role: "system", content: system },
      { role: "user", content: args.prompt },
    ]
  : [{ role: "user", content: args.prompt }],

    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error: ${res.status} ${res.statusText} :: ${errText}`);
  }

  const data: any = await res.json();

  // --------------------------
  // Estrazione testo (robusta)
  // --------------------------
  let text = "";
  try {
    // spesso: data.output_text è già una stringa pronta
    text = String(data.output_text ?? "").trim();
    if (!text && Array.isArray(data.output)) {
      // fallback: scava nell'output
      for (const item of data.output) {
        if (item?.content?.length) {
          for (const c of item.content) {
            if (c?.type === "output_text" && c?.text) text += c.text;
          }
        }
      }
      text = text.trim();
    }
  } catch {
    text = "";
  }

  // --------------------------
  // Usage tokens
  // --------------------------
  const usage: OpenAiUsage | null = data?.usage
    ? {
        input_tokens: Number(data.usage.input_tokens ?? 0),
        output_tokens: Number(data.usage.output_tokens ?? 0),
        total_tokens: Number(data.usage.total_tokens ?? 0),
      }
    : null;

  return {
    text: text || "⚠️ Risposta vuota.",
    usage,
    model,
  };
}
