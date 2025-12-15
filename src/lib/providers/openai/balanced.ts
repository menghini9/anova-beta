// OPENAI_BALANCED_PROVIDER_V1
import { invokeBase } from "../_base";
import type { ProviderResponse } from "../../orchestrator/types";

interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: OpenAIUsage;
}

export function invokeOpenAIBalanced(
  prompt: string
): Promise<ProviderResponse> {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error("OPENAI_API_KEY missing");
  }

  return invokeBase({
    provider: "openai:mid",
    timeoutMs: 30_000,

    exec: async (): Promise<OpenAIResponse> => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`);
      }

      return JSON.parse(text);
    },

parse: (raw: unknown) => {
  const data = raw as OpenAIResponse;

  return {
    text: data.choices?.[0]?.message?.content ?? "",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
},


    cost: ({
      promptTokens,
      completionTokens,
    }: {
      promptTokens: number;
      completionTokens: number;
    }) =>
      (promptTokens * 0.00015 + completionTokens * 0.0006) / 1000,
  });
}
