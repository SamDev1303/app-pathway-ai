import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Use in client components.
// Session is persisted via secure HTTP-only cookies managed by middleware.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
