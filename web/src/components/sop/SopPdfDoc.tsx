"use client";

// web/src/components/sop/SopPdfDoc.tsx
// P6 wave 3: react-pdf template for client-side SOP download.
//
// Design (P6 CONTEXT D4): client-side only. No server PDF endpoint.
// Rendering path: SopEditor.tsx dynamic-imports this module, calls
//   pdf(<SopPdfDoc ... />).toBlob()
// and hands the blob to saveAs() for the student's download.
//
// Fonts: built-in Times serif (bundled with react-pdf). Georgia bundle is
// explicitly deferred to P6.1 (see PLAN §Wave 3). No <Font.register> call =
// zero network fetches = no CSP hassles = no hydration lag.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { SOP_PER_TURN_FOOTER } from "@/lib/sop-prompt";

const styles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 72,
    paddingHorizontal: 64,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.55,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Times-Bold",
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: "#525252",
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 64,
    right: 64,
    fontSize: 8,
    color: "#737373",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
  },
});

export interface SopPdfDocProps {
  /** Student's full legal name — used in header. */
  studentFullName: string;
  /** Full SOP body text. Paragraphs are split on `\n\n`. */
  fullText: string;
  /** Version label (e.g. "v2") — appears in the header meta line. */
  versionLabel?: string;
  /** ISO date string for header; defaults to today. */
  isoDate?: string;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function SopPdfDoc({
  studentFullName,
  fullText,
  versionLabel,
  isoDate,
}: SopPdfDocProps) {
  const paragraphs = splitParagraphs(fullText);
  const safeName = studentFullName?.trim() || "Student";
  const dateStr = formatDate(isoDate);
  const versionStr = versionLabel ? ` · ${versionLabel}` : "";

  return (
    <Document
      title={`Statement of Purpose — ${safeName}`}
      author="UniMate Australia"
      creator="Atlas AI"
      producer="Atlas AI"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>
            Statement of Purpose — {safeName}
          </Text>
          <Text style={styles.headerMeta}>
            UniMate Pty Ltd · {dateStr}
            {versionStr}
          </Text>
        </View>

        {paragraphs.length === 0 ? (
          <Text style={styles.paragraph}>{fullText}</Text>
        ) : (
          paragraphs.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))
        )}

        <Text style={styles.footer} fixed>
          {SOP_PER_TURN_FOOTER}
        </Text>
      </Page>
    </Document>
  );
}

export default SopPdfDoc;
