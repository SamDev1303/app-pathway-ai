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

const PII_RE = /[\w.+-]+@[\w-]+\.[\w.-]+|\+?\d[\d\s()-]{7,}/g;
const SENSITIVE_QS_KEY_RE = /email|phone|user[_]?message|consent|notes/i;

function scrubString(s: string | undefined | null): string | undefined {
  if (typeof s !== "string") return s ?? undefined;
  // Redact any email-shape / phone-shape substring.
  let out = s.replace(PII_RE, "[Redacted]");
  // Redact ?email=...&phone=... query params by key name.
  out = out.replace(/([?&])([^=&]+)=([^&]*)/g, (m, sep, k) => {
    if (SENSITIVE_QS_KEY_RE.test(k)) return `${sep}${k}=[Redacted]`;
    return m;
  });
  return out;
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

  // Keep Breadcrumbs integration installed (we still want console/network/xhr
  // trails for debugging) — but drop risky categories via beforeBreadcrumb
  // below. Dropping the whole integration loses the debug trail Sam needs for
  // the client demo.

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

    // String-bearing fields: scrubObject only walks object keys, so top-level
    // strings (event.message, exception values, query strings, user identifiers,
    // breadcrumb messages) bypass it. scrubString masks email/phone shapes +
    // sensitive query-param values.
    if (event.message) event.message = scrubString(event.message) ?? event.message;
    if (typeof event.request?.query_string === "string") {
      event.request.query_string = scrubString(event.request.query_string) ?? event.request.query_string;
    }
    if (event.user) {
      if (event.user.email) event.user.email = "[Redacted]";
      if (event.user.username) event.user.username = scrubString(event.user.username) ?? event.user.username;
      if (event.user.ip_address) delete event.user.ip_address;
    }
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) ex.value = scrubString(ex.value) ?? ex.value;
      }
    }
    if (event.breadcrumbs) {
      for (const bc of event.breadcrumbs) {
        if (bc.message) bc.message = scrubString(bc.message) ?? bc.message;
        if (bc.data) scrubObject(bc.data);
      }
    }
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
