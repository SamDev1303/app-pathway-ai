// web/src/lib/ratelimit.ts
// P5 wave 5: Upstash Redis sliding-window rate-limit for /api/chat.
//
// Three independent buckets:
//   1. per-IP     — 10 req / minute
//   2. per-session— 50 req / session (sliding 60 min)
//   3. global     — 200 req / day (caps OpenRouter free-tier burn)
//
// All three must pass. If any fail, caller shows 429 + Calendly CTA and
// never hits the model.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimitResult = {
  ok: boolean;
  reason: "ip" | "session" | "global" | null;
  remaining: { ip: number; session: number; global: number };
};

let cachedIp: Ratelimit | null = null;
let cachedSession: Ratelimit | null = null;
let cachedGlobal: Ratelimit | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getLimiters(): { ip: Ratelimit; session: Ratelimit; global: Ratelimit } | null {
  if (cachedIp && cachedSession && cachedGlobal) {
    return { ip: cachedIp, session: cachedSession, global: cachedGlobal };
  }
  const redis = getRedis();
  if (!redis) return null;
  cachedIp = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "atlas:chat:ip",
  });
  cachedSession = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "60 m"),
    prefix: "atlas:chat:session",
  });
  cachedGlobal = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 d"),
    prefix: "atlas:chat:global",
  });
  return { ip: cachedIp, session: cachedSession, global: cachedGlobal };
}

export async function checkChatRateLimit(args: {
  ip: string;
  sessionId: string | null;
}): Promise<LimitResult> {
  const limiters = getLimiters();
  // Fail-open: if Upstash isn't wired yet (local dev, pre-meeting), allow
  // through so builds + manual QA still work. Production deploy config MUST
  // set UPSTASH_REDIS_REST_URL/TOKEN before launch.
  if (!limiters) {
    return { ok: true, reason: null, remaining: { ip: -1, session: -1, global: -1 } };
  }

  const [ipRes, sessionRes, globalRes] = await Promise.all([
    limiters.ip.limit(args.ip),
    args.sessionId
      ? limiters.session.limit(args.sessionId)
      : Promise.resolve({ success: true, remaining: -1 }),
    limiters.global.limit("global"),
  ]);

  if (!ipRes.success) {
    return {
      ok: false,
      reason: "ip",
      remaining: { ip: 0, session: sessionRes.remaining, global: globalRes.remaining },
    };
  }
  if (!sessionRes.success) {
    return {
      ok: false,
      reason: "session",
      remaining: { ip: ipRes.remaining, session: 0, global: globalRes.remaining },
    };
  }
  if (!globalRes.success) {
    return {
      ok: false,
      reason: "global",
      remaining: { ip: ipRes.remaining, session: sessionRes.remaining, global: 0 },
    };
  }
  return {
    ok: true,
    reason: null,
    remaining: {
      ip: ipRes.remaining,
      session: sessionRes.remaining,
      global: globalRes.remaining,
    },
  };
}

export const RATE_LIMIT_MESSAGE =
  "You've hit today's usage cap for the free AI advisor. UniMate's MARA-registered agents can take it from here — book a free consult: /consult";

// ================================================================
// P6 wave 2: SOP rate-limit — separate bucket from /api/chat.
//   * per-lead   — 10 regens / day  (soft cap, matches D3 guidance)
//   * per-IP     — 5  regens / hour (anti-abuse on shared leadTokens)
//   * global     — 100 regens / day (caps free-tier token burn)
// Key prefix `atlas:sop:*` — separate from chat buckets so the two endpoints
// don't starve each other.
// ================================================================

type SopLimitResult = {
  ok: boolean;
  reason: "lead" | "ip" | "global" | null;
  remaining: { lead: number; ip: number; global: number };
};

let cachedSopLead: Ratelimit | null = null;
let cachedSopIp: Ratelimit | null = null;
let cachedSopGlobal: Ratelimit | null = null;

function getSopLimiters():
  | { lead: Ratelimit; ip: Ratelimit; global: Ratelimit }
  | null {
  if (cachedSopLead && cachedSopIp && cachedSopGlobal) {
    return { lead: cachedSopLead, ip: cachedSopIp, global: cachedSopGlobal };
  }
  const redis = getRedis();
  if (!redis) return null;
  cachedSopLead = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 d"),
    prefix: "atlas:sop:lead",
  });
  cachedSopIp = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "atlas:sop:ip",
  });
  cachedSopGlobal = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 d"),
    prefix: "atlas:sop:global",
  });
  return { lead: cachedSopLead, ip: cachedSopIp, global: cachedSopGlobal };
}

export async function checkSopRateLimit(args: {
  ip: string;
  leadId: string | null;
}): Promise<SopLimitResult> {
  const limiters = getSopLimiters();
  // Fail-open when Upstash isn't wired (mirrors checkChatRateLimit posture).
  if (!limiters) {
    return {
      ok: true,
      reason: null,
      remaining: { lead: -1, ip: -1, global: -1 },
    };
  }

  const [leadRes, ipRes, globalRes] = await Promise.all([
    args.leadId
      ? limiters.lead.limit(args.leadId)
      : Promise.resolve({ success: true, remaining: -1 }),
    limiters.ip.limit(args.ip),
    limiters.global.limit("global"),
  ]);

  if (!leadRes.success) {
    return {
      ok: false,
      reason: "lead",
      remaining: { lead: 0, ip: ipRes.remaining, global: globalRes.remaining },
    };
  }
  if (!ipRes.success) {
    return {
      ok: false,
      reason: "ip",
      remaining: { lead: leadRes.remaining, ip: 0, global: globalRes.remaining },
    };
  }
  if (!globalRes.success) {
    return {
      ok: false,
      reason: "global",
      remaining: { lead: leadRes.remaining, ip: ipRes.remaining, global: 0 },
    };
  }
  return {
    ok: true,
    reason: null,
    remaining: {
      lead: leadRes.remaining,
      ip: ipRes.remaining,
      global: globalRes.remaining,
    },
  };
}

export const SOP_RATE_LIMIT_MESSAGE =
  "You've hit today's SOP regeneration cap. A MARA-registered UniMate agent can review your draft with you — book a free consult: /consult";
