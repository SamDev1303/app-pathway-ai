// web/instrumentation.ts
// P5.5 — Next.js 16 instrumentation hook. Next.js invokes register() once per
// server runtime boot. Sentry's server + edge configs initialize here.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation

import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
