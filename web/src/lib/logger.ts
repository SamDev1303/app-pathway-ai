// web/src/lib/logger.ts
// P5.5 Observability — pino structured logger with PII redaction.
// Output: JSON to stdout (Vercel log drains). Dev: pretty-printed via pino-pretty transport.
// Redaction: three-layer via logger-redact.ts — paths + censor + walker.

import { pino, type Logger, type LoggerOptions } from "pino";
import { REDACT_PATHS, censor, redactWalk } from "./logger-redact";

let _logger: Logger | null = null;

function buildLogger(): Logger {
  const isDev = process.env.NODE_ENV !== "production";
  const level = process.env.LOG_LEVEL ?? "info";

  const baseOptions: LoggerOptions = {
    level,
    base: {
      service: "atlas-ai-web",
      env: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    },
    redact: {
      paths: [...REDACT_PATHS],
      censor,
    },
    // Layer C: every log object passes through redactWalk before serialization.
    // This catches key names the path list doesn't enumerate (e.g. `emailAddress`).
    formatters: {
      log(obj) {
        return redactWalk(obj) as Record<string, unknown>;
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (isDev) {
    try {
      return pino({
        ...baseOptions,
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" },
        },
      });
    } catch {
      // pino-pretty transport unavailable (e.g. edge runtime) — fall through to JSON
    }
  }

  return pino(baseOptions);
}

/**
 * Lazy-init singleton logger. Call `logger` directly — the getter resolves once.
 * Keep imports as: `import { logger } from "@/lib/logger";`
 */
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop) {
    if (!_logger) _logger = buildLogger();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (_logger as any)[prop];
    return typeof value === "function" ? value.bind(_logger) : value;
  },
});
