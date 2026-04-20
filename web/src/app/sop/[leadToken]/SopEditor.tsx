"use client";

// web/src/app/sop/[leadToken]/SopEditor.tsx
// P6 wave 4: client-side SOP editor + generator + PDF download.
//
// State model:
//   - currentText: live buffer of the streaming draft.
//   - streamingStatus: idle | streaming | error | deflected | rate-limited.
//   - selectedUniId + selectedCourseName: picker state (default strong[0]).
//   - history: in-memory list of sop_drafts rows (refetched? no — we just append
//     client-side, matches the server insert path; full reload on refresh).
//   - bannerError: invalid-token | rate-limit | deflected | forbidden-notes.
//
// Fetch path: POST /api/sop → read ReadableStream reader manually (NOT useChat),
// parse the Vercel AI SDK SSE-ish envelope to pull out text-delta chunks.
// This gives us raw prose (no chat UI framing) + access to messageMetadata.

import { useMemo, useState } from "react";

export interface SopEditorMatchShape {
  uni_id: string;
  uni_name: string;
  short_name?: string;
  course_name: string;
  match_pct?: number;
}

export interface SopEditorLead {
  leadToken: string;
  fullName: string;
  matches:
    | {
        strong?: SopEditorMatchShape[];
        stretch?: SopEditorMatchShape[];
      }
    | null;
}

export interface SopEditorDraft {
  id: string;
  versionNumber: number;
  fullText: string;
  createdAt: string;
  parentDraftId: string | null;
}

type Status =
  | "idle"
  | "streaming"
  | "done"
  | "error"
  | "deflected"
  | "rate-limited";

type Banner =
  | { kind: "rate-limit" }
  | { kind: "deflected" }
  | { kind: "forbidden-notes"; message: string }
  | { kind: "no-matches" }
  | { kind: "error"; message: string }
  | null;

interface Props {
  lead: SopEditorLead;
  initialDraft: SopEditorDraft | null;
  initialHistory: SopEditorDraft[];
}

function allMatches(lead: SopEditorLead): SopEditorMatchShape[] {
  return [
    ...(lead.matches?.strong ?? []),
    ...(lead.matches?.stretch ?? []),
  ];
}

function matchKey(m: SopEditorMatchShape): string {
  return `${m.uni_id}::${m.course_name}`;
}

export function SopEditor({ lead, initialDraft, initialHistory }: Props) {
  const matches = useMemo(() => allMatches(lead), [lead]);
  const defaultMatch = lead.matches?.strong?.[0] ?? matches[0] ?? null;
  const [selectedKey, setSelectedKey] = useState<string>(
    defaultMatch ? matchKey(defaultMatch) : "",
  );
  const [currentText, setCurrentText] = useState<string>(
    initialDraft?.fullText ?? "",
  );
  const [currentVersion, setCurrentVersion] = useState<number | null>(
    initialDraft?.versionNumber ?? null,
  );
  const [currentParentId, setCurrentParentId] = useState<string | null>(
    initialDraft?.id ?? null,
  );
  const [history, setHistory] = useState<SopEditorDraft[]>(initialHistory);
  const [status, setStatus] = useState<Status>("idle");
  const [banner, setBanner] = useState<Banner>(null);
  const [previewDraft, setPreviewDraft] = useState<SopEditorDraft | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const selected = matches.find((m) => matchKey(m) === selectedKey);

  async function handleGenerate(opts?: {
    restoreText?: string;
    parentDraftId?: string | null;
  }) {
    if (!selected) {
      setBanner({ kind: "no-matches" });
      return;
    }
    setStatus("streaming");
    setBanner(null);
    setCurrentText("");

    try {
      const res = await fetch("/api/sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadToken: lead.leadToken,
          selectedUniId: selected.uni_id,
          selectedCourseName: selected.course_name,
          parentDraftId: opts?.parentDraftId ?? currentParentId ?? null,
          restoreText: opts?.restoreText,
        }),
      });

      if (res.status === 422) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setBanner({
          kind: "forbidden-notes",
          message:
            j.error ??
            "Your notes mention visa content — please remove; SOPs must be academic only.",
        });
        setStatus("error");
        return;
      }
      if (res.status === 429) {
        setBanner({ kind: "rate-limit" });
        setStatus("rate-limited");
        return;
      }
      if (res.status === 404) {
        setBanner({
          kind: "error",
          message: "Invalid or expired link. Please re-request your matches.",
        });
        setStatus("error");
        return;
      }
      if (!res.ok || !res.body) {
        setBanner({
          kind: "error",
          message: `SOP generator unavailable (${res.status}). Try again or /consult.`,
        });
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let accumulated = "";
      let deflected = false;
      let finalDraftId: string | null = null;
      let finalVersionNumber: number | null = null;
      let persistError: string | null = null;

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // Split SSE-ish `data: ...\n\n` frames.
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload) as Record<string, unknown>;
            if (obj.type === "text-delta" && typeof obj.delta === "string") {
              accumulated += obj.delta;
              setCurrentText(accumulated);
            } else if (obj.type === "finish" || obj.type === "message-metadata") {
              const meta = (obj.messageMetadata ?? obj.metadata) as
                | {
                    deflected?: boolean;
                    draftId?: string | null;
                    versionNumber?: number | null;
                    persistError?: string | null;
                  }
                | undefined;
              if (meta?.deflected) deflected = true;
              if (typeof meta?.draftId === "string") finalDraftId = meta.draftId;
              if (typeof meta?.versionNumber === "number")
                finalVersionNumber = meta.versionNumber;
              if (typeof meta?.persistError === "string")
                persistError = meta.persistError;
            }
          } catch {
            // Non-JSON frame — ignore.
          }
        }
      }

      if (deflected) {
        setBanner({ kind: "deflected" });
        setStatus("deflected");
        return;
      }

      // Persistence must be authoritative — no client-* fallback ids.
      // If the server didn't return a real draftId/versionNumber, treat as
      // save failure: surface a banner and do NOT append a fake history entry.
      if (!finalDraftId || finalVersionNumber == null || persistError) {
        console.error(
          "[SopEditor] missing persistence metadata",
          { finalDraftId, finalVersionNumber, persistError },
        );
        setBanner({
          kind: "error",
          message: "Draft saved failed — please retry.",
        });
        setStatus("error");
        return;
      }

      const persistedDraft: SopEditorDraft = {
        id: finalDraftId,
        versionNumber: finalVersionNumber,
        fullText: accumulated,
        createdAt: new Date().toISOString(),
        parentDraftId: opts?.parentDraftId ?? currentParentId ?? null,
      };
      setCurrentVersion(finalVersionNumber);
      setCurrentParentId(finalDraftId);
      setHistory((h) => [persistedDraft, ...h]);
      setStatus("done");
    } catch (err) {
      console.error("[SopEditor] generate failed", err);
      setBanner({
        kind: "error",
        message: "Network error. Please retry.",
      });
      setStatus("error");
    }
  }

  async function handleDownloadPdf() {
    if (!currentText.trim()) return;
    setDownloadingPdf(true);
    try {
      const [{ pdf }, mod] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/sop/SopPdfDoc"),
      ]);
      const SopPdfDoc = mod.SopPdfDoc;
      const versionLabel = currentVersion ? `v${currentVersion}` : "v1";
      const instance = pdf(
        <SopPdfDoc
          studentFullName={lead.fullName}
          fullText={currentText}
          versionLabel={versionLabel}
        />,
      );
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Student_SOP_${versionLabel}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[SopEditor] pdf download failed", err);
      setBanner({
        kind: "error",
        message: "PDF export failed in your browser. Try again or /consult.",
      });
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Preview handlers
  function handleOpenPreview(d: SopEditorDraft) {
    setPreviewDraft(d);
  }
  function handleClosePreview() {
    setPreviewDraft(null);
  }
  async function handleRestore(d: SopEditorDraft) {
    setPreviewDraft(null);
    // Restore = server-side short-circuit: insert new sop_drafts row with
    // full_text=d.fullText, parent_draft_id=d.id, model="restored". Route
    // streams the text back as a single chunk so the UI flow matches regen.
    // Do NOT send selectedUniId/selectedCourseName — pure restore, not gen.
    setStatus("streaming");
    setBanner(null);
    setCurrentText("");

    try {
      const res = await fetch("/api/sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadToken: lead.leadToken,
          restoreText: d.fullText,
          restoreFromDraftId: d.id,
        }),
      });
      if (!res.ok || !res.body) {
        setBanner({
          kind: "error",
          message: `Restore failed (${res.status}). Please retry.`,
        });
        setStatus("error");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let accumulated = "";
      let finalDraftId: string | null = null;
      let finalVersionNumber: number | null = null;

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload) as Record<string, unknown>;
            if (obj.type === "text-delta" && typeof obj.delta === "string") {
              accumulated += obj.delta;
              setCurrentText(accumulated);
            } else if (
              obj.type === "finish" ||
              obj.type === "message-metadata"
            ) {
              const meta = (obj.messageMetadata ?? obj.metadata) as
                | {
                    draftId?: string | null;
                    versionNumber?: number | null;
                  }
                | undefined;
              if (typeof meta?.draftId === "string") finalDraftId = meta.draftId;
              if (typeof meta?.versionNumber === "number")
                finalVersionNumber = meta.versionNumber;
            }
          } catch {
            // ignore non-JSON
          }
        }
      }

      if (!finalDraftId || finalVersionNumber == null) {
        setBanner({
          kind: "error",
          message: "Draft saved failed — please retry.",
        });
        setStatus("error");
        return;
      }

      const restoredDraft: SopEditorDraft = {
        id: finalDraftId,
        versionNumber: finalVersionNumber,
        fullText: accumulated,
        createdAt: new Date().toISOString(),
        parentDraftId: d.id,
      };
      setCurrentVersion(finalVersionNumber);
      setCurrentParentId(finalDraftId);
      setHistory((h) => [restoredDraft, ...h]);
      setStatus("done");
    } catch (err) {
      console.error("[SopEditor] restore failed", err);
      setBanner({ kind: "error", message: "Network error. Please retry." });
      setStatus("error");
    }
  }

  return (
    <div className="mt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Draft your Statement of Purpose
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Academic SOP only — not migration advice. Your MARA-registered
          UniMate agent reviews the final version before submission.
        </p>
      </header>

      {banner && <BannerView banner={banner} />}

      <section className="mb-6 rounded-md border border-neutral-200 bg-white p-4">
        <label
          className="mb-2 block text-sm font-medium text-neutral-800"
          htmlFor="sop-match-picker"
        >
          Target university + course
        </label>
        <select
          id="sop-match-picker"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          disabled={status === "streaming"}
        >
          {matches.length === 0 && (
            <option value="">No matches available — complete matcher first</option>
          )}
          {matches.map((m) => (
            <option key={matchKey(m)} value={matchKey(m)}>
              {m.course_name} @ {m.uni_name}
              {m.match_pct != null ? ` (${m.match_pct}%)` : ""}
            </option>
          ))}
        </select>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            onClick={() => handleGenerate()}
            disabled={status === "streaming" || !selected}
          >
            {status === "streaming"
              ? "Drafting…"
              : currentText
                ? "Regenerate"
                : "Generate SOP"}
          </button>
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
            onClick={handleDownloadPdf}
            disabled={
              !currentText.trim() ||
              status === "streaming" ||
              downloadingPdf
            }
          >
            {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <article
          className="min-h-[320px] whitespace-pre-wrap rounded-md border border-neutral-200 bg-white p-6 text-[15px] leading-relaxed text-neutral-900"
          aria-live="polite"
        >
          {currentText || (
            <span className="text-neutral-400">
              Pick a course above and click Generate to draft your SOP.
            </span>
          )}
        </article>

        <aside className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-neutral-800">
            Version history
          </h2>
          {history.length === 0 ? (
            <p className="text-xs text-neutral-500">
              No drafts yet — generate one to start the history.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-xs hover:border-neutral-400"
                    onClick={() => handleOpenPreview(d)}
                  >
                    <div className="font-medium text-neutral-900">
                      v{d.versionNumber}
                    </div>
                    <div className="text-neutral-500">
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {previewDraft && (
        <PreviewModal
          draft={previewDraft}
          onClose={handleClosePreview}
          onRestore={() => handleRestore(previewDraft)}
          disabled={status === "streaming"}
        />
      )}
    </div>
  );
}

function BannerView({ banner }: { banner: NonNullable<Banner> }) {
  const base =
    "mb-4 rounded-md border px-4 py-3 text-sm";
  switch (banner.kind) {
    case "rate-limit":
      return (
        <div className={`${base} border-amber-300 bg-amber-50 text-amber-900`}>
          You&rsquo;ve hit today&rsquo;s SOP regeneration cap. A
          MARA-registered UniMate agent can review your draft with you &mdash;{" "}
          <a href="/consult" className="underline">
            book a free consult
          </a>
          .
        </div>
      );
    case "deflected":
      return (
        <div className={`${base} border-rose-300 bg-rose-50 text-rose-900`}>
          That question is migration advice, which is regulated in Australia.
          We can&rsquo;t cover it in an SOP &mdash;{" "}
          <a href="/consult" className="underline">
            book a free consult
          </a>{" "}
          with a MARA-registered agent.
        </div>
      );
    case "forbidden-notes":
      return (
        <div className={`${base} border-rose-300 bg-rose-50 text-rose-900`}>
          {banner.message}
        </div>
      );
    case "no-matches":
      return (
        <div className={`${base} border-neutral-300 bg-neutral-50 text-neutral-800`}>
          No university matches yet. Complete the matcher first, then return to
          draft your SOP.
        </div>
      );
    case "error":
      return (
        <div className={`${base} border-neutral-300 bg-neutral-50 text-neutral-800`}>
          {banner.message}
        </div>
      );
  }
}

function PreviewModal({
  draft,
  onClose,
  onRestore,
  disabled,
}: {
  draft: SopEditorDraft;
  onClose: () => void;
  onRestore: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of SOP v${draft.versionNumber}`}
    >
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-md bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              v{draft.versionNumber}
            </h3>
            <p className="text-xs text-neutral-500">
              {new Date(draft.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </header>
        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-neutral-900">
          {draft.fullText}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <button
            type="button"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            onClick={onRestore}
            disabled={disabled}
          >
            Restore as v{draft.versionNumber + 1}
          </button>
        </footer>
      </div>
    </div>
  );
}
