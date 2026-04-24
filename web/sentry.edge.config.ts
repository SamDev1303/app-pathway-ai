// web/sentry.edge.config.ts
// P5.5 — Sentry Edge runtime (middleware, edge route handlers).
// Same PII scrub as server config, lighter defaults (no breadcrumbs on edge).

import * as Sentry from "@sentry/nextjs";

const SENSITIVE_FIELDS = [
  "email",
  "phone",
  "user_message",
  "notes",
  "content",
  "consent_service",
  "consent_marketing",
  "consent_wording_version",
  "consent_given_at",
];

function scrubObject(obj: Record<string, unknown> | undefined | null): void {
  if (!obj) return;
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f))) {
      obj[key] = "[Redacted]";
    } else if (obj[key] && typeof obj[key] === "object") {
      scrubObject(obj[key] as Record<string, unknown>);
    }
  }
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,

  beforeSend(event) {
    if (event.request) {
      scrubObject(event.request.data as Record<string, unknown>);
      scrubObject(event.request.headers as Record<string, unknown>);
      scrubObject(event.request.query_string as unknown as Record<string, unknown>);
      delete event.request.cookies;
    }
    scrubObject(event.extra as Record<string, unknown>);
    scrubObject(event.contexts as Record<string, unknown>);
    scrubObject(event.tags as Record<string, unknown>);
    return event;
  },
});
