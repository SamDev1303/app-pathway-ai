# ops/n8n — Atlas AI Lead Sync (Dormant v1 Add-on)

**Status:** Shipped dormant in Atlas AI v1. Activation is a priced add-on (PRD §3 X.1.1, +$200 Sam labour).

**Purpose:** Mirror every new lead row from Supabase `leads` table into a UniMate-owned Google Sheet, in real time, with zero Atlas app-code dependency. The Next.js app at `web/` does NOT call N8N — the pipeline is Supabase Database Webhook → UniMate's Hostinger N8N → Google Sheet.

---

## Why this lives here

The v1 core delivery gives UniMate two lead channels:

1. **Supabase `leads` table** — source of truth, always-queryable
2. **Resend email to Sam + UniMate** — live human-readable notification

The Google Sheet mirror is a convenience layer for MARA agents who prefer a spreadsheet view to database queries or email archives. It is NOT a data-integrity layer. The v1 core ships without it so that:

- UniMate owns the hosting (no Sam-Mac-uptime risk in a paid deliverable)
- UniMate owns the Google Workspace credential (no cross-tenant OAuth sprawl)
- The $3k fixed-scope stays honest — a live third-party pipeline needs SLA work Atlas v1 doesn't quote

If UniMate post-launch wants the Sheet mirror live, they sign the X.1.1 add-on PO, provision Hostinger N8N, and Sam does the activation labour below.

---

## Activation runbook (execute only after X.1.1 PO is signed)

### 1. UniMate provisions N8N on Hostinger

- Hostinger → VPS → N8N 1-click template (or Docker compose on any Hostinger VPS)
- Recommended: smallest VPS tier (~$5–20/mo UniMate pays directly)
- Domain: `unimate-n8n.<unimate-domain>.com.au` with Hostinger-managed SSL
- Create an N8N owner account; hand Sam a short-lived personal access token for import

### 2. UniMate provisions the Google Sheet

- Google Drive (UniMate workspace) → new Sheet titled **"Atlas AI — Leads"**
- Add a tab named `Leads`
- Row 1 headers (left to right):
  `submitted_at, full_name, email, phone, country, highest_qualification, gpa, ielts_overall, preferred_fields, preferred_levels, preferred_intake_month, tuition_budget_aud, living_budget_aud, preferred_contact_channel, notes, lead_score, lead_tier, consent_service, consent_marketing, consent_wording_version, consent_given_at, user_agent, locale, source`
- Copy the Sheet `documentId` from the URL — needed in step 4

### 3. UniMate creates Google OAuth2 cred for N8N

- Google Cloud Console (UniMate workspace) → new OAuth 2.0 Client ID (Web application)
- Authorized redirect URI: `https://unimate-n8n.<domain>/rest/oauth2-credential/callback`
- Share client ID + secret with Sam via 1Password / encrypted channel (never email)

### 4. Sam imports the workflow

- In UniMate's N8N UI: **Workflows → Import from File → select `lead-sync-workflow.json`**
- Edit the **Append to UniMate Leads Sheet** node:
  - `documentId` → paste the Sheet ID from step 2
  - `credentials.googleSheetsOAuth2Api` → create a new cred with the OAuth details from step 3; authorize against UniMate's Google account
- Edit the **Dead-letter Email to Sam** node:
  - `credentials.smtp` → either UniMate's SMTP creds OR swap the node to a Resend node using UniMate's Resend key. Confirm `toEmail` still routes to Sam (`sam@claudeking.org`)
- Activate the workflow (toggle at top right). Note the webhook URL — it will be of the form:
  `https://unimate-n8n.<domain>/webhook/atlas-lead-sync`

### 5. Sam registers the Supabase DB webhook

- Supabase Studio → Project (atlas-ai) → Database → Webhooks → **Create a new hook**
- Name: `atlas-lead-sync-n8n`
- Table: `public.leads`
- Events: `Insert` only (NOT Update/Delete)
- Type: HTTP Request
- URL: paste the N8N webhook URL from step 4
- HTTP Headers: leave default; add `X-Atlas-Source: supabase-atlas-ai` for traceability
- HTTP Params: none
- Save

### 6. End-to-end smoke test

- From `web/scripts/`, run a seeded-lead insert against staging (or manually `INSERT` a test row):
  ```sql
  INSERT INTO leads (full_name, email, phone, consent_given_at, consent_wording_version, consent_service, consent_marketing)
  VALUES ('Test Lead', 'smoke+atlas@example.com', '+61000000000', now(), '2026-04-17.v2', true, false);
  ```
- Verify:
  - Supabase webhook delivery succeeded (Studio → Webhooks → execution log)
  - N8N execution ran green (UniMate N8N → Executions)
  - Row appeared in the UniMate Google Sheet
- Delete the test row from both Supabase and the Sheet

### 7. Sign-off + invoice

- Write activation summary to `planning/atlas-ai/X.1.1-ACTIVATION.md` with timestamps, UniMate contacts, cred owners
- Issue the $200 invoice to UniMate

---

## Re-importing after a v1.x code bump

If Atlas AI ships a schema change that touches the `leads` table shape (e.g. new column added), the dormant workflow JSON in this repo is updated alongside the migration. UniMate re-imports the updated JSON; credentials carry over by name.

## Support scope after activation

- **First 30 days post-activation:** Sam covers UniMate-side N8N questions pro bono as warranty.
- **Ongoing:** UniMate owns N8N instance; Sam supports on an hourly rate if asked.

---

## Files

| File | Purpose |
|---|---|
| `lead-sync-workflow.json` | The portable N8N workflow export — import this into UniMate's N8N |
| `README.md` | This file — activation runbook + rationale |
