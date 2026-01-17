// ======================================================
// CLAUDE (ANTHROPIC) PROVIDER — Minimal (text + usage + model)
// Path: src/lib/ai/claude.ts
// ======================================================

export type ClaudeUsage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

export type ClaudeReply = {
  text: string;
  usage: ClaudeUsage | null;
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

export async function claudeReply(args: {
  prompt: string;
  rules?: string;
}): Promise<ClaudeReply> {
  const apiKey = mustEnv("ANTHROPIC_API_KEY");

  // ✅ Scegli il modello qui (coerente con la tua pricing table in cost.ts)
  // Esempi: "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", ecc.
  const model = "claude-3-5-sonnet-20241022";

  const system = args.rules?.trim()
    ? `Regole operative (vincoli):\n${args.rules.trim()}`
    : "Sei Anova β. Rispondi in modo utile e operativo.";

  // --------------------------
  // Anthropic Messages API (testo)
  // --------------------------
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: args.prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Claude error: ${res.status} ${res.statusText} :: ${errText}`);
  }

  const data: any = await res.json();

  // --------------------------
  // Estrazione testo (robusta)
  // --------------------------
  let text = "";
  try {
    if (Array.isArray(data?.content)) {
      for (const c of data.content) {
        if (c?.type === "text" && typeof c?.text === "string") text += c.text;
      }
    }
    text = String(text ?? "").trim();
  } catch {
    text = "";
  }

  // --------------------------
  // Usage tokens
  // --------------------------
  const usage: ClaudeUsage | null = data?.usage
    ? {
        input_tokens: Number(data.usage.input_tokens ?? 0),
        output_tokens: Number(data.usage.output_tokens ?? 0),
        total_tokens: Number(
          (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0)
        ),
      }
    : null;

  return {
    text: text || "⚠️ Risposta vuota.",
    usage,
    model,
  };
}
