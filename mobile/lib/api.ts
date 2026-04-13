// UniMate mobile → web API client.
// All endpoints live on the deployed web app (unimate-demo.vercel.app).
// Mobile never talks to OpenRouter directly — keeps keys server-side only.

const API_BASE = "https://unimate-demo.vercel.app";

// Client-side hard timeouts prevent the demo UI from hanging on weak venue wifi.
// Chat is interactive and should feel snappy — shorter cap. SOP is a longer
// generation task so we give it more headroom.
const CHAT_TIMEOUT_MS = 15_000;
const SOP_TIMEOUT_MS = 30_000;

async function postJson<T>(
  path: string,
  body: unknown,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Endpoint ${path} failed (${res.status})`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Network timed out — please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function askAdvisor(prompt: string): Promise<string> {
  const data = await postJson<{ text?: string; error?: string }>(
    "/api/chat-simple",
    { prompt },
    CHAT_TIMEOUT_MS,
  );
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
  const data = await postJson<{ draft?: string; error?: string }>(
    "/api/sop",
    input,
    SOP_TIMEOUT_MS,
  );
  if (data.error) throw new Error(data.error);
  return data.draft ?? "";
}
