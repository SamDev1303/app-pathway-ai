import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Server-only.
 *
 * Use ONLY in route handlers that need to bypass RLS for a trusted
 * operation (e.g. the atomic lead INSERT in /api/leads/route.ts which
 * stamps server-controlled fields like consent_given_at and lead_score).
 *
 * NEVER import this in:
 * - Client components ("use client")
 * - Middleware
 * - Route handlers that accept unauthenticated reads
 *
 * The service-role key bypasses RLS; leaking it to the browser is a
 * catastrophic privacy/security failure.
 */
export function createServiceRoleClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

 if (!url) {
 throw new Error("[pathway-ai] NEXT_PUBLIC_SUPABASE_URL is not set");
 }
 if (!key) {
 throw new Error(
 "[pathway-ai] SUPABASE_SERVICE_ROLE_KEY is not set — required for server-only lead INSERT",
 );
 }

 return createSupabaseClient(url, key, {
 auth: {
 persistSession: false,
 autoRefreshToken: false,
 },
 });
}
