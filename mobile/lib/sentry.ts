// mobile/lib/sentry.ts
// P5.5 — Expo Sentry init. Same PII-scrub discipline as web sentry configs.
// Called once from app/_layout.tsx on RootLayout mount.

import * as Sentry from "@sentry/react-native";

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

let _initialized = false;

export function initSentry(): void {
  if (_initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ??
      (__DEV__ ? "development" : "production"),
    enabled: Boolean(dsn),
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    sendDefaultPii: false,

    beforeSend(event) {
      if (event.request) {
        scrubObject(event.request.data as Record<string, unknown>);
        scrubObject(event.request.headers as Record<string, unknown>);
      }
      scrubObject(event.extra as Record<string, unknown>);
      scrubObject(event.contexts as Record<string, unknown>);
      scrubObject(event.tags as Record<string, unknown>);
      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // Drop user-input-capturing breadcrumbs (form fills, touches on inputs).
      if (
        breadcrumb.category === "xhr" ||
        breadcrumb.category === "fetch" ||
        breadcrumb.category === "touch" ||
        breadcrumb.category?.startsWith("ui.")
      ) {
        if (breadcrumb.data) scrubObject(breadcrumb.data);
      }
      if (breadcrumb.message) {
        breadcrumb.message = breadcrumb.message
          .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[Redacted email]")
          .replace(/\+?\d[\d\s()-]{7,}/g, "[Redacted phone]");
      }
      return breadcrumb;
    },
  });

  _initialized = true;
}

export { Sentry };
