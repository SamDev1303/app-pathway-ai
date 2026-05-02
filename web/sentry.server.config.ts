// web/sentry.server.config.ts
// P5.5 — Sentry Node runtime. beforeSend scrubs -sensitive PII before
// events leave this process. Session replays are fully disabled per .

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
 dsn: process.env.SENTRY_DSN,
 environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
 enabled: Boolean(process.env.SENTRY_DSN),
 tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
 sendDefaultPii: false,

 beforeSend(event) {
 // Strip request body, headers, query params of sensitive fields
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
 // Strip user_message and PII-ish fields from breadcrumb data
 if (breadcrumb.data) {
 scrubObject(breadcrumb.data);
 }
 if (breadcrumb.message) {
 // Truncate anything that looks like an email / phone in free-form messages
 breadcrumb.message = breadcrumb.message
 .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[Redacted email]")
 .replace(/\+?\d[\d\s()-]{7,}/g, "[Redacted phone]");
 }
 return breadcrumb;
 },
});
