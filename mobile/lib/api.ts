// UniMate mobile → web API client.
// All endpoints live on the deployed web app (unimate-demo.vercel.app).
// Mobile never talks to OpenRouter directly — keeps keys server-side only.

const API_BASE = "https://unimate-demo.vercel.app";

export async function askAdvisor(prompt: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat-simple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error(`Advisor unavailable (${res.status})`);
  }
  const data = (await res.json()) as { text?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.text ?? "";
}

export type SopInput = {
  university: string;
  course: string;
  background: string;
  goals: string;
};

export async function generateSop(input: SopInput): Promise<string> {
  const res = await fetch(`${API_BASE}/api/sop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`SOP generator unavailable (${res.status})`);
  }
  const data = (await res.json()) as { draft?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.draft ?? "";
}
