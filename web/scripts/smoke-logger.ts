/**
 * web/scripts/smoke-logger.ts
 *
 * P5.5 — Proves the 3-layer redaction by feeding a synthetic payload shaped
 * like a real /api/leads or /api/chat log call.
 *
 * Run: cd web && npx tsx scripts/smoke-logger.ts
 *
 * Expected: every PII field prints as "[Redacted]" — never the literal value.
 * Any raw `sam@example.com` / `0412...` / `visa application` in output = FAIL.
 */

import { logger } from "../src/lib/logger";

const log = logger.child({ route: "/smoke" });

const syntheticLead = {
  // Layer A match — shallow `*.email`, `*.phone`
  lead: {
    id: "lead-abc-123",
    email: "sam+leaked@example.com",
    phone: "+61 412 345 678",
    score: 87,
    tier: "A",
  },
  // Layer B match — top-level `email` / `user_message`
  email: "top-level-leak@example.com",
  user_message: "Can you help with my visa application?",
  // Layer B deep — `err.cause.*`
  err: {
    message: "insert failed",
    cause: {
      email: "deep-nested-leak@example.com",
      detail: "unique_violation",
    },
  },
  // Layer C walker — arbitrary key-name match via regex (emailAddress, phoneNumber)
  user: {
    emailAddress: "walker-catch@example.com",
    phoneNumber: "+61 499 111 222",
    userMessageText: "another message the walker should catch",
  },
  // consent_* cluster
  consent_wording_version: "2026-04-20.v3",
  consent_given_at: "2026-04-25T03:00:00Z",
  // Safe fields — these should NOT be redacted
  session_id: "sess-opaque-uuid",
  lead_id: "lead-abc-123",
  model: "openrouter/qwen-free",
  ms: 1234,
};

log.info(syntheticLead, "smoke-logger payload — inspect output below");

// Also test bare string log (no structured payload)
log.warn("a bare string log line — no payload");

// Test an error-path shape (what /api/chat actually does under failure)
log.error(
  {
    err: new Error("synthetic failure"),
    session_id: "sess-abc",
    email: "should-redact@example.com",
  },
  "chat error path",
);
