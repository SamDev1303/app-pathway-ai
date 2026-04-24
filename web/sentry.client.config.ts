// web/sentry.client.config.ts
// P5.5 — Sentry browser runtime. Session replays disabled (MARA: no user screen recording).

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
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  sendDefaultPii: false,

  // MARA compliance — zero session replays. Recording student form-fill would
  // capture every keystroke of email/phone/message.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Disable DOM breadcrumbs (would capture input field values on click/change).
  integrations: (defaults) =>
    defaults.filter((integration) => integration.name !== "Breadcrumbs"),

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

  beforeBreadcrumb(breadcrumb) {
    // Drop DOM input/click/ui breadcrumbs entirely — they capture form values
    if (
      breadcrumb.category?.startsWith("ui.") ||
      breadcrumb.category === "input" ||
      breadcrumb.category === "navigation"
    ) {
      return null;
    }
    if (breadcrumb.data) scrubObject(breadcrumb.data);
    if (breadcrumb.message) {
      breadcrumb.message = breadcrumb.message
        .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[Redacted email]")
        .replace(/\+?\d[\d\s()-]{7,}/g, "[Redacted phone]");
    }
    return breadcrumb;
  },
});
