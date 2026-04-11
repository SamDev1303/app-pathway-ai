# UniMate Australia — Full PRD, Technical Architecture & 2-Day Demo Plan
**Version:** 1.0 — April 2026  
**Prepared for:** UniMate Australia, Liverpool NSW  
**Prepared by:** Shamal Krishna / ClaudeKing.org  
**Scope:** Full Product Requirements Document, Roadmap Critique, Architecture Spec, 2-Day Demo Build Guide

***
## Executive Summary
UniMate Australia is a licensed education and migration consultancy based in Liverpool, New South Wales, helping international students find the right Australian university and visa pathway. The client is building a digital platform to automate and scale this process using AI. The roadmap provided covers eight modules — from an AI chat advisor to a university matching engine and admin analytics. This document serves as the **authoritative PRD**, identifies critical gaps in the submitted roadmap, and provides a concrete two-day demo build specification that can be delivered to the client for review.[^1][^2]

***
## 1. Product Overview
### 1.1 Product Name
**UniMate AI Platform** — "Your Gateway to Australian Education & Migration" (existing brand)[^1]
### 1.2 Problem Statement
International students seeking to study in Australia must navigate complex university selection, IELTS/GPA requirements, PR-eligible course choices, and student visa (subclass 500) compliance — often relying on expensive, manual consultancy. UniMate's current service is 100% human-driven. This platform digitises and scales the matching, advisory, and document preparation workflows using AI.[^3]
### 1.3 Target Users
| Persona | Description | Primary Module |
|---------|-------------|----------------|
| **Prospective International Student** | Aged 18–30, seeking Australian university placement, non-English native | AI Advisor, UniMatch, SOP Generator |
| **Migration Consultant / Counsellor** | UniMate staff reviewing leads and managing applications | Admin Dashboard |
| **Platform Admin** | Internal ops, managing university data and system health | Course Management, Analytics |
### 1.4 Business Goals
- Capture qualified leads 24/7 without manual effort
- Reduce counsellor time per student by 60% with AI pre-screening
- Improve student-to-application conversion through personalised university matching
- Build a competitive moat via proprietary university dataset (CRICOS-backed)[^4][^5]

***
## 2. Roadmap Analysis — Submitted vs. Recommended
The submitted roadmap contains the following eight modules. Each is reviewed below with gap analysis and recommendations.
### 2.1 Module Review Table
| # | Module | Status | Critical Gaps |
|---|--------|--------|---------------|
| 1 | AI Advisor Chat (LLM + RAG) | ✅ Valid | RAG knowledge base not scoped; no fallback if API is down; no conversation history storage defined |
| 2 | Lead Capture | ✅ Valid | No email notification or CRM integration; GDPR/Privacy Act 1988 (Australia) compliance not addressed |
| 3 | UniMatch Engine | ✅ Valid | No scoring criteria defined (GPA, IELTS, budget, PR eligibility); no threshold logic documented |
| 4 | Resume / SOP Generator | ✅ Valid | No document storage model; no versioning; no university-specific SOP prompts |
| 5 | Admin Dashboard | ✅ Valid | No role-based access control (RBAC); no authentication module listed anywhere in roadmap |
| 6 | Course Management Engine | ⚠️ Risk | Web scraping individual uni sites risks ToS violations; CRICOS official API/dataset is the legal alternative[^4] |
| 7 | Analytics Tracking (Lite) | ⚠️ Redundant | Effectively the same module as #8 — split awkwardly; should be merged into one Analytics module |
| 8 | Analytics Dashboard (Admin) | ⚠️ Redundant | See above |
### 2.2 Critical Missing Modules
The roadmap is missing several foundational components that will cause the project to fail or require costly rework:

1. **Authentication & Session Management** — Neither student nor admin login is mentioned. This is a prerequisite for all other modules. Without it, leads cannot be associated with users, and the admin dashboard is publicly accessible.

2. **Visa/PR Pathway Matching** — UniMate's core value proposition is matching students to PR-eligible courses. The UniMatch Engine does not specify PR pathway scoring as a criteria, which undermines the product's primary differentiator.[^3]

3. **Email Notification System** — When a student submits a lead, no automated email is triggered to the student (confirmation) or staff (alert). This is a basic CRM requirement.

4. **Student Profile & Saved Results** — Students cannot save, revisit, or share their UniMatch results. Without a profile, the platform is entirely stateless and cannot support re-engagement.

5. **LLM Cost Controls & Rate Limiting** — No token budget, API rate limiting, or cost tracking is defined. At scale, an uncontrolled GPT-4o deployment can incur thousands of dollars per day in API costs.

6. **Mobile Responsiveness** — No mention of responsive design despite the primary user demographic (international students aged 18–30) being overwhelmingly mobile-first.

7. **Australian Privacy Act 1988 Compliance** — Collecting student PII (name, DOB, academic records, visa status) triggers obligations under the Privacy Act 1988 (Cth). A consent checkbox, privacy policy, and data retention policy are legally required for any Australian platform collecting this data.

***
## 3. Functional Requirements
### Module 1: AI Advisor Chat
**Description:** A conversational AI assistant answering study abroad and migration queries, grounded in a curated knowledge base via RAG.

**Functional Requirements:**
- Chat interface with streaming responses (token-by-token display)
- RAG pipeline indexing: UniMate service pages, CRICOS data, Australian student visa (subclass 500) FAQs, PR pathway guides
- Conversation history persisted per session (localStorage for guests, database for logged-in users)
- Handoff mechanism: "Talk to a counsellor" CTA after 3 exchanges if query is complex
- System prompt enforcing: UniMate brand voice, safety (no legal/visa advice disclaimers), no hallucinated university data
- Fallback: If LLM API is unavailable, display a static "We're experiencing issues — book a free consultation" message

**Technical Spec:**
- Stack: LangChain.js + OpenAI GPT-4o-mini (cost-optimised) + Supabase pgvector for embeddings[^6][^7]
- API route: `POST /api/chat` — accepts `{ messages[], sessionId }`
- Context window: last 6 messages + retrieved RAG chunks (max 3,000 tokens)
- Streaming: Vercel AI SDK `streamText()`[^8]

**Acceptance Criteria:**
- Responds in <3 seconds (P90) for typical queries
- Correctly answers "What IELTS score do I need for University of Sydney undergraduate?" using RAG context
- Does not fabricate visa rules; includes disclaimer on visa-related questions

***
### Module 2: Lead Capture
**Description:** Multi-step onboarding form capturing student profile, academic background, and study intent.

**Fields Required:**
```
Step 1 — Personal Info:    Full Name, Email, Phone, Country of Origin, Current Location
Step 2 — Academic Profile: Highest Education Level, GPA/Percentage, English Test (IELTS/PTE/TOEFL), Score
Step 3 — Study Intent:     Preferred Study Level (UG/PG/VET), Preferred Field, Budget (AUD/yr), Timeline, PR Interest (Yes/No)
Step 4 — Consent:          Privacy Policy checkbox (REQUIRED), Marketing consent (optional)
```

**Functional Requirements:**
- Progress indicator (Steps 1–4)
- Client-side validation on each step before advancing
- Partial save (Step 1 data saved on blur, so leads aren't lost if form is abandoned)
- On submit: POST to `/api/leads`, store in `leads` table, trigger email notification to admin
- Duplicate detection: if email already exists, update record rather than creating duplicate

**Acceptance Criteria:**
- Form submission creates a record in the database within 2 seconds
- Admin receives email within 60 seconds of submission
- Privacy consent is stored as a boolean with timestamp

***
### Module 3: UniMatch Engine
**Description:** Recommendation engine that scores and ranks Australian universities based on the student's profile.

**Scoring Criteria (Rule Engine v1):**

| Criterion | Weight | Data Source |
|-----------|--------|-------------|
| IELTS/PTE score vs. entry requirement | 25% | CRICOS + manual entry |
| GPA/academic level vs. entry requirement | 25% | CRICOS |
| Tuition budget vs. course fee | 20% | CRICOS |
| PR-eligible course (skilled occupation list) | 15% | DOHA MLTSSL/STSOL |
| Location preference | 10% | CRICOS |
| University ranking (QS 2025) | 5% | Public QS data |

**Functional Requirements:**
- Takes student profile object → returns ranked list of top 10 universities with match score (0–100)
- Each result shows: university name, course, match score, annual fee, IELTS requirement, PR eligibility flag, "Apply Now" CTA
- Filters: state, field of study, budget range, study level
- Save results to student profile (if logged in) or generate shareable link

**API Design:**
```
POST /api/unimatch
Body: { gpa, ielts_score, budget_aud, study_level, field, state_pref, pr_interest }
Response: { matches: [{ university, course, score, fee, requirements, pr_eligible }] }
```

**Acceptance Criteria:**
- Returns top 10 results in <1.5 seconds
- A student with IELTS 6.5 and budget AUD 30,000/yr does NOT see universities requiring 7.0 or AUD 50,000+
- PR-eligible flag is accurate per DOHA occupation lists

***
### Module 4: Resume / SOP Generator
**Description:** AI-powered tool generating personalised Statements of Purpose and polishing student resumes.

**Functional Requirements:**
- SOP Generator: Intake form (target university, course, career goals, background summary) → structured prompt → LLM generation → editable rich text output → PDF export
- Resume Polisher: Upload existing resume (PDF/DOCX) → extract text → LLM reformats/improves for Australian standards → download improved version
- University-specific SOP: System prompt variant per university tier (Group of Eight vs. regional)
- Save generated documents to student profile with version history

**SOP Prompt Architecture:**
```
System: You are an expert Australian university admissions consultant at UniMate Australia. 
Write a compelling Statement of Purpose for [UNIVERSITY] [COURSE].
Student background: [BACKGROUND]
Career goals: [GOALS]
Format: 600-800 words, formal academic English, specific to [UNIVERSITY]'s values.
Do NOT fabricate achievements or credentials.
```

**Acceptance Criteria:**
- Generated SOP is 600–800 words, grammatically correct, university-specific
- PDF export renders correctly
- "Regenerate" button produces a meaningfully different output

***
### Module 5: Admin Dashboard
**Description:** Internal panel for UniMate staff to manage leads, view analytics, and action student enquiries.

**Features:**
- Lead table: sortable/filterable by date, status, country, study level
- Lead detail view: full profile, UniMatch results, generated documents, conversation history
- Status management: New → Contacted → Qualified → Application Submitted → Enrolled
- Bulk export: CSV of all leads
- Simple authentication: email/password for admin accounts (bcrypt hashed)

**Acceptance Criteria:**
- Admin can change lead status with a single click
- All tables paginate at 50 rows
- CSV export includes all lead fields

***
### Module 6: Course Management Engine
**Description:** Tool to ingest, manage, and keep current the university and course dataset used by the UniMatch Engine.

**IMPORTANT ARCHITECTURE CHANGE — Roadmap Flaw:**
The submitted roadmap proposes scraping individual university websites. This approach:
1. Violates most Australian university website Terms of Service
2. Breaks whenever a university redesigns their site
3. Is legally exposed under the *Copyright Act 1968* (Cth) for systematic scraping

**Recommended Approach — Use CRICOS Official Dataset:**
- The Australian Government publishes the complete **CRICOS register** (all providers + courses for international student visas) as a free, openly licensed (CC BY 2.5 AU) dataset[^4][^5]
- Updated regularly at `data.gov.au`
- Contains: provider name, CRICOS code, course name, level, duration, location, fee information
- Supplement with manual data entry for specific requirements (IELTS scores, QS ranking)

**Functional Requirements:**
- Admin UI to bulk import CRICOS XLSX snapshot
- Individual course edit/override capability
- "Last updated" timestamp per university record
- Search/filter within admin: by state, level, field
- Deactivate courses without deleting (soft delete)

***
### Module 7 & 8: Analytics (Merged)
**Description:** Event tracking and admin dashboard showing platform usage metrics.

**Events to Track:**
```
page_view          { page, referrer, timestamp, session_id }
chat_message       { session_id, message_count, timestamp }
unimatch_search    { filters_used, result_count, timestamp }
lead_submitted     { lead_id, source_page, timestamp }
sop_generated      { university_targeted, word_count, timestamp }
doc_downloaded     { doc_type, timestamp }
```

**Admin Analytics Dashboard:**
- Total leads this week/month (chart)
- Top source countries for leads
- Most searched universities
- Chat session volume over time
- SOP generation count
- Lead conversion funnel: Visits → Leads → Contacted → Enrolled

**Acceptance Criteria:**
- All 6 event types fire correctly as verified in DB
- Analytics dashboard loads in <2 seconds
- All charts reflect real-time data (max 15-min cache)

***
## 4. Non-Functional Requirements
| Requirement | Target |
|-------------|--------|
| Page load (LCP) | <2.5 seconds on 4G mobile |
| API response time (P90) | <1.5 seconds for non-AI routes |
| AI streaming first token | <1.5 seconds |
| Uptime | 99.5% (Vercel SLA)[^8] |
| Mobile breakpoints | 320px, 768px, 1280px |
| Browser support | Chrome, Safari, Firefox (last 2 versions) |
| Authentication | JWT + httpOnly cookies; bcrypt for passwords |
| Data encryption | TLS 1.3 in transit; AES-256 at rest (Supabase default) |
| Privacy compliance | Australian Privacy Act 1988 (Cth) — consent capture, data retention policy required |
| LLM cost control | Per-session token budget cap: 8,000 tokens; daily spend alert at $20 USD |

***
## 5. Technical Architecture
### 5.1 System Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS 15 APP                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Student UI  │  │  Admin UI    │  │   Landing Page    │  │
│  │  (App Router)│  │  (App Router)│  │   + Lead Form     │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
│         │                 │                    │             │
│  ┌──────▼─────────────────▼────────────────────▼──────────┐  │
│  │              NEXT.JS API ROUTES (/api/*)               │  │
│  │  /api/chat   /api/unimatch   /api/leads   /api/sop     │  │
│  │  /api/admin  /api/courses    /api/analytics            │  │
│  └──────┬─────────────────┬──────────────────────────────┘  │
└─────────┼─────────────────┼──────────────────────────────────┘
          │                 │
┌─────────▼──────┐  ┌───────▼──────────────────────────┐
│  OPENAI API    │  │  SUPABASE (PostgreSQL + pgvector) │
│  GPT-4o-mini   │  │  Tables: leads, universities,     │
│  text-embed-   │  │  courses, chat_sessions, events,  │
│  ada-002       │  │  sop_documents, admin_users       │
└────────────────┘  └──────────────────────────────────┘
```
### 5.2 Database Schema
```sql
-- Core Tables

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  country_of_origin TEXT,
  education_level TEXT,
  gpa DECIMAL(4,2),
  english_test TEXT,
  english_score DECIMAL(4,1),
  study_level TEXT,
  field_of_study TEXT,
  budget_aud INTEGER,
  timeline TEXT,
  pr_interest BOOLEAN,
  privacy_consent BOOLEAN NOT NULL,
  marketing_consent BOOLEAN,
  status TEXT DEFAULT 'new',  -- new|contacted|qualified|applied|enrolled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cricos_code TEXT UNIQUE,
  name TEXT NOT NULL,
  state TEXT,
  website TEXT,
  qs_ranking INTEGER,
  is_group_of_eight BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  cricos_course_code TEXT,
  course_name TEXT NOT NULL,
  field TEXT,
  level TEXT,  -- undergraduate|postgraduate|vet
  duration_months INTEGER,
  annual_fee_aud INTEGER,
  ielts_min DECIMAL(3,1),
  gpa_min DECIMAL(4,2),
  pr_eligible BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sop_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  university_id UUID REFERENCES universities(id),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  session_id TEXT,
  lead_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'staff',  -- staff|super_admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536),
  source TEXT,
  metadata JSONB
);
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
```
### 5.3 Technology Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui | Full-stack in one repo, RSC for performance[^9] |
| Backend | Next.js API Routes | Eliminates separate backend, simplifies deployment |
| Database | Supabase (PostgreSQL + pgvector) | Free tier, built-in vector storage for RAG[^6] |
| AI/LLM | OpenAI GPT-4o-mini + text-embedding-ada-002 | Cost-optimised; 128k context[^7] |
| RAG Framework | LangChain.js | Production-proven, TypeScript-native[^7][^8] |
| Auth | NextAuth.js (admin only for demo) | Simple, battle-tested |
| Deployment | Vercel | Zero-config Next.js deployment, edge functions[^8] |
| Email | Resend API | Developer-friendly transactional email |
| University Data | CRICOS official dataset (data.gov.au) | Legal, comprehensive, free[^5] |

***
## 6. Two-Day Demo Build Plan
This is a scoped, client-ready demo that demonstrates all eight modules at a surface level with real functionality. It is **not** a production build — it is a proof-of-concept to win the contract.
### Day 1 — Core Infrastructure + Student Flow (8 hours)
**Morning (4 hours):**
- [ ] Scaffold Next.js 15 project: `npx create-next-app@latest unimate-demo --typescript --tailwind --eslint`
- [ ] Install dependencies: `npm install langchain @langchain/openai @langchain/community @supabase/supabase-js shadcn/ui resend`
- [ ] Set up Supabase project, run schema SQL (from Section 5.2)
- [ ] Seed 15 Australian universities from CRICOS data (hardcoded JSON for demo)[^5]
- [ ] Build Landing Page: Hero section, value props, "Get Matched" CTA, lead form (Steps 1–3 minimum)
- [ ] Build `POST /api/leads` route — saves to Supabase

**Afternoon (4 hours):**
- [ ] Build AI Advisor Chat: floating chat widget, `POST /api/chat`, stream via Vercel AI SDK
- [ ] Add simple system prompt (no RAG for demo — use hardcoded context about UniMate + 15 seeded unis)
- [ ] Build UniMatch results page: takes profile from Step 3, calls `POST /api/unimatch`, renders top 5 cards
- [ ] Implement rule-based scoring (IELTS threshold + budget filter + level match) in `/api/unimatch`
- [ ] Wire Lead Form → UniMatch results (on submit, redirect to `/match?leadId=xxx`)
### Day 2 — SOP Generator + Admin Dashboard + Polish (8 hours)
**Morning (4 hours):**
- [ ] Build SOP Generator page: form (university picker, goals, background) → `POST /api/sop` → streaming LLM output in editable textarea
- [ ] Add "Copy to Clipboard" and basic PDF print (`window.print()` with print CSS)
- [ ] Build Admin Dashboard at `/admin`:
  - Simple password gate (env variable, no full auth for demo)
  - Leads table (fetches all from Supabase, sortable by date)
  - Basic stats row: total leads, new this week, countries represented
- [ ] Implement analytics event fire on: page load, chat message, lead submit, unimatch run

**Afternoon (4 hours):**
- [ ] Build simple Analytics chart in admin: bar chart of leads by day (last 7 days) using Recharts
- [ ] Responsive audit: test on iPhone SE viewport (375px), fix critical layout breaks
- [ ] Polish: add UniMate logo (placeholder), brand colours (#1A3C8F blue, white), professional typography
- [ ] Deploy to Vercel: `vercel --prod`, set env vars (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Write 1-page demo walkthrough document for client handoff
- [ ] Final QA pass: test full student flow end-to-end
### Demo Pages Summary
| Route | What It Shows |
|-------|--------------|
| `/` | Landing page + lead capture form (Modules 1, 2) |
| `/match` | UniMatch results page (Module 3) |
| `/sop` | SOP generator (Module 4) |
| `/admin` | Admin leads table + stats (Module 5, 7, 8) |
| `/admin/courses` | Static course list demonstrating Module 6 concept |
### Environment Variables Required
```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
ADMIN_PASSWORD=unimate2026demo
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://unimate-demo.vercel.app
```

***
## 7. User Stories
### Student User Stories
- As a student, I want to describe my academic background so I can get matched to suitable Australian universities
- As a student, I want to ask questions in plain language and get clear answers about studying in Australia
- As a student, I want to generate a personalised SOP for my target university without starting from scratch
- As a student, I want to see whether my target course leads to PR so I can plan my migration journey
### Admin User Stories
- As a UniMate counsellor, I want to see all new leads in one view so I can prioritise follow-ups
- As a UniMate counsellor, I want to see a student's full profile including their UniMatch results before calling them
- As an admin, I want to import the latest CRICOS data so the matching engine stays current
- As an admin, I want to see which universities are most popular in searches so I can focus partnership efforts

***
## 8. Risk Register
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenAI API outage | Low | High | Implement retry logic + fallback static response |
| LLM cost overrun | Medium | Medium | Token budget cap per session; daily spend alert |
| University data staleness | Medium | High | CRICOS dataset updated quarterly; set calendar reminder |
| Web scraping ToS violation (if pursued) | High | High | Use CRICOS official dataset instead[^4] |
| IELTS score hallucination by LLM | Medium | High | RAG-ground all requirement data; add source citation in responses |
| Privacy Act non-compliance | Medium | High | Engage a privacy lawyer for consent copy; data retention policy required |
| Student-facing legal advice liability | Medium | High | Implement disclaimer on all chat responses; "not legal advice" watermark |

***
## 9. Success Metrics (KPIs)
| Metric | Target (Month 1) | Target (Month 3) |
|--------|-----------------|-----------------|
| Lead form completion rate | >40% | >55% |
| AI chat sessions per day | 20 | 100 |
| UniMatch searches | 30/day | 150/day |
| SOP documents generated | 10/day | 50/day |
| Lead-to-consultation rate | 15% | 25% |
| Average counsellor time per lead | <20 min | <10 min |

***
## 10. Out of Scope (v1.0)
The following are explicitly out of scope for the initial build to maintain delivery focus:

- Full student authentication / account system (demo uses session-only)
- Payment processing or subscription billing
- Integration with university application portals
- Real-time visa policy feeds from Department of Home Affairs
- Mobile native app (iOS/Android)
- Multi-language support (English only, v1)
- Reinforcement learning or feedback loop for UniMatch improvement
- Document signing or formal application submission

***
## Appendix A: Recommended File Structure
```
unimate-demo/
├── app/
│   ├── page.tsx              # Landing page + lead form
│   ├── match/page.tsx        # UniMatch results
│   ├── sop/page.tsx          # SOP generator
│   ├── admin/
│   │   ├── page.tsx          # Admin leads dashboard
│   │   └── courses/page.tsx  # Course management
│   └── api/
│       ├── chat/route.ts     # AI advisor (streaming)
│       ├── leads/route.ts    # Lead CRUD
│       ├── unimatch/route.ts # Matching engine
│       ├── sop/route.ts      # SOP generation
│       └── analytics/route.ts
├── components/
│   ├── chat-widget.tsx
│   ├── lead-form.tsx
│   ├── match-card.tsx
│   ├── sop-editor.tsx
│   └── admin-leads-table.tsx
├── lib/
│   ├── supabase.ts
│   ├── openai.ts
│   └── unimatch-engine.ts    # Scoring logic
├── types/
│   └── index.ts
└── .env.local
```
## Appendix B: CRICOS Data Integration
The CRICOS dataset published by the Australian Government is the legally correct and comprehensive source for all university and course data:[^5]

- **Source:** `data.gov.au/data/dataset/cricos`
- **License:** Creative Commons Attribution 2.5 Australia (free to use, adapt, republish)
- **Contents:** Provider name, state, CRICOS code, course name, course level, duration, fees, location
- **Format:** XLSX, updated regularly (August 2025 version available)
- **Access:** Download once, import to database; set quarterly refresh reminder
- **Supplement with:** IELTS/PTE entry requirements (scraped once per uni, manually entered), QS 2025 rankings (public data), PR occupation list cross-reference (DOHA MLTSSL)

This approach eliminates all web scraping legal risk while providing a more reliable and comprehensive dataset than ad-hoc scraping would achieve.

---

## References

1. [UniMate Australia](https://unimateaustralia.com) - We match your strengths with top Australian institutions and courses that align with your long-term ...

2. [UniMate Australia](https://au.linkedin.com/company/unimate-australia) - Unimate Australia is more than an education and migration consultancy, it is a trusted partner and l...

3. [Empowering Dreams, Transforming Futures - UniMate Australia](https://unimateaustralia.com/about-us) - Your trusted partner for Australian education and migration. We help students achieve their dreams o...

4. [cricos - Australian Government Data](https://data.gov.au/data/dataset/cricos) - # Commonwealth Register of Institutions and Courses for Overseas Students (CRICOS)

Created 28/07/20...

5. [2025-08-01 CRICOS Providers, Courses and Location.xlsx](https://data.gov.au/data/dataset/cricos/resource/c1fe8690-0346-42ff-a841-61a6beda675b) - CRICOS is the official list of all Australian education providers that offer courses to people study...

6. [Retrieval-Augmented Generation (RAG) Architecture for LLM Agents](https://futureagi.com/blog/rag-architecture-llm-2025/) - Discover how retrieval-augmented generation (RAG) improves LLM performance by integrating external d...

7. [How to build smarter frontend chatbots with RAG and LangChain.js](https://blog.logrocket.com/frontend-chatbots-rag-langchain/) - Build smarter frontend chatbots with RAG and LangChain.js. Learn how to add context and improve accu...

8. [Building an AI chatbot with Next.js, Langchain, and OpenAI - Vercel](https://vercel.com/kb/guide/nextjs-langchain-vercel-ai) - In this guide, we will be learning how to build an AI chatbot using Next.js, Langchain, OpenAI LLMs ...

9. [Build & Deploy Next.js 16 FullStack Project with Admin ...](https://www.youtube.com/watch?v=gXkEupunl2A) - Build & Deploy Next.js 16 FullStack Project with Admin Dashboard | Clerk Auth, Prisma, Postgres. 6.5...

