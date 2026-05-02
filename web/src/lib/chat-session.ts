// web/src/lib/chat-session.ts
// P5 wave 4: chat session cookie + persistence helpers.
//
// Cookie: `atlas_chat_session` (httpOnly, secure, 30-day TTL) — an opaque token
// mapped to chat_sessions.session_token. First-seen → insert row; thereafter
// just read session_id. If the user already has `atlas_lead` (from /api/leads),
// we link lead_id so CRM sees chat transcripts + the advisor sees prior form
// context.
//
// This module runs ONLY inside route handlers (server). Never import it from
// a client component.

import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CHAT_COOKIE = "atlas_chat_session";
const LEAD_COOKIE = "atlas_lead";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function serviceClient(): SupabaseClient | null {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key =
 process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
 if (!url || !key) return null;
 return createClient(url, key, { auth: { persistSession: false } });
}

export type ChatSession = { id: string; token: string; leadId: string | null };

export async function getOrCreateChatSession(): Promise<ChatSession | null> {
 const supabase = serviceClient();
 if (!supabase) return null;

 const jar = await cookies();
 const existingToken = jar.get(CHAT_COOKIE)?.value;
 const leadId = jar.get(LEAD_COOKIE)?.value ?? null;

 if (existingToken) {
 const { data } = await supabase
 .from("chat_sessions")
 .select("id, session_token, lead_id")
 .eq("session_token", existingToken)
 .maybeSingle();
 if (data) {
 // Refresh last_active_at.
 void supabase
 .from("chat_sessions")
 .update({ last_active_at: new Date().toISOString() })
 .eq("id", data.id);
 return { id: data.id, token: data.session_token, leadId: data.lead_id };
 }
 }

 const token = crypto.randomUUID();
 const { data, error } = await supabase
 .from("chat_sessions")
 .insert({ session_token: token, lead_id: leadId })
 .select("id, session_token, lead_id")
 .single();

 if (error || !data) {
 console.warn("[pathway-ai.chat-session] create failed", error?.message);
 return null;
 }

 jar.set(CHAT_COOKIE, token, {
 httpOnly: true,
 secure: true,
 sameSite: "lax",
 path: "/",
 maxAge: THIRTY_DAYS,
 });

 return { id: data.id, token: data.session_token, leadId: data.lead_id };
}

export async function persistChatMessage(args: {
 sessionId: string;
 role: "user" | "assistant" | "system";
 content: string;
 retrievedCourseIds?: string[];
 deflected?: boolean;
}): Promise<void> {
 const supabase = serviceClient();
 if (!supabase) return;
 const { error } = await supabase.from("chat_messages").insert({
 session_id: args.sessionId,
 role: args.role,
 content: args.content,
 retrieved_course_ids: args.retrievedCourseIds ?? [],
 deflected: args.deflected ?? false,
 });
 if (error) console.warn("[pathway-ai.chat-session] persist failed", error.message);
}
