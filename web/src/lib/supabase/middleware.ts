import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Session refresh middleware. Called from web/middleware.ts on every request.
// Pathway-AI design choice: the app is ANONYMOUS by default (students, counsellors
// interact without login). Auth is optional infrastructure, so this middleware
// refreshes the session cookie when present but does NOT redirect unauthenticated
// users. Protected routes opt-in by checking `user` in their server components.
export async function updateSession(request: NextRequest) {
 let supabaseResponse = NextResponse.next({ request });

 const supabase = createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 getAll() {
 return request.cookies.getAll();
 },
 setAll(cookiesToSet) {
 cookiesToSet.forEach(({ name, value }) =>
 request.cookies.set(name, value),
 );
 supabaseResponse = NextResponse.next({ request });
 cookiesToSet.forEach(({ name, value, options }) =>
 supabaseResponse.cookies.set(name, value, options),
 );
 },
 },
 },
 );

 // IMPORTANT: DO NOT REMOVE `auth.getUser()`.
 // Calling getUser forces a cookie refresh if the access token is stale.
 // Omitting this leads to random logouts.
 await supabase.auth.getUser();

 return supabaseResponse;
}
