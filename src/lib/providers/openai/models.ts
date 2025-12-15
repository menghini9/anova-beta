// OPENAI_MODEL_MAP_V1
// Unica fonte di verità per i modelli OpenAI

export const OPENAI_MODELS = {
  econ: "gpt-4o-mini",
  mid: "gpt-4o",
  max: "gpt-4.1",
} as const;

export type OpenAITier = keyof typeof OPENAI_MODELS;
