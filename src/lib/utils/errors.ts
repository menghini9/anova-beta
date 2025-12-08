// ===========================
// ANOVA_ERRORS_V1
// Gestione centralizzata degli errori di Anova β
// ===========================

export class AnovaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnovaError";
  }
}

export class ProviderMissingKeyError extends AnovaError {
  constructor(provider: string) {
    super(`API key mancante per provider: ${provider}`);
    this.name = "ProviderMissingKeyError";
  }
}

export class ProviderTimeoutError extends AnovaError {
  constructor(provider: string, timeoutMs: number) {
    super(`Timeout del provider ${provider} dopo ${timeoutMs}ms`);
    this.name = "ProviderTimeoutError";
  }
}

export class InvalidIntentError extends AnovaError {
  constructor(detail?: string) {
    super(`Intent non valido${detail ? `: ${detail}` : ""}`);
    this.name = "InvalidIntentError";
  }
}
