// web/src/lib/logger-redact.ts
// P5.5 Observability — PII redaction paths for pino.
// Three-layer defense: (A) shallow paths, (B) top-level + deep paths, (C) censor fn walker.
// MARA compliance: leaking email/phone/user_message in server logs is a reportable breach.

// Matches camelCase + snake_case variants: email, emailAddress, user_message,
// userMessage, userMessageText, phoneNumber, consentGivenAt, etc.
const SENSITIVE_KEY_RE = /email|phone|user[_]?message|consent|notes|content/i;

// Layer A — baseline one-level-deep paths
const LAYER_A: readonly string[] = [
  "*.email",
  "*.phone",
  "*.user_message",
  "*.content",
  "*.notes",
  "req.body.*",
  "consent_wording_version",
];

// Layer B — top-level + deeper nested paths (catches err.cause.email, lead.contact.email)
const LAYER_B: readonly string[] = [
  "email",
  "phone",
  "user_message",
  "*.*.email",
  "*.*.phone",
  "*.*.user_message",
  "err.cause.*",
  "err.cause.*.*",
  "error.cause.*",
  "error.cause.*.*",
];

export const REDACT_PATHS: readonly string[] = [...LAYER_A, ...LAYER_B];

export const REDACT_CENSOR_LABEL = "[Redacted]";

/**
 * Layer C — pino censor function. pino calls this for each redacted path match.
 * Returning the literal label is fine for path matches, but the walker below is
 * invoked as the `serializers.*` fallback to catch anything the path list missed
 * at arbitrary depth (e.g. `{ data: { user: { emailAddress: "..." } } }`).
 */
export function censor(): string {
  return REDACT_CENSOR_LABEL;
}

/**
 * Recursively walk a value and mask any key matching SENSITIVE_KEY_RE.
 * Used by the logger as a final safety net via `formatters.log` — every log
 * payload runs through this before serialization, so a key name like
 * `emailAddress` that layers A/B don't enumerate still gets redacted.
 */
export function redactWalk(input: unknown, depth = 0): unknown {
  if (depth > 8) return input; // guard against cyclic / very deep objects
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map((v) => redactWalk(v, depth + 1));

  // Error instances have non-enumerable message/stack — Object.entries returns
  // empty. Serialize manually so stack trace survives into the log output.
  if (input instanceof Error) {
    return {
      name: input.name,
      message: input.message,
      stack: input.stack,
      ...(input.cause !== undefined
        ? { cause: redactWalk(input.cause, depth + 1) }
        : {}),
    };
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      out[k] = REDACT_CENSOR_LABEL;
    } else {
      out[k] = redactWalk(v, depth + 1);
    }
  }
  return out;
}
