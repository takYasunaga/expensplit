# Case Study: Building an AI-Powered Group Expense & Receipt Splitter
## A Practical Guide to Software Planning, Architecture, and AI-Assisted Development

---

## 1. Executive Summary & Strategic Overview

When building applications—especially when pairing with AI development tools like **Claude Code**—the sequence of decisions determines whether the project succeeds or devolves into tangled, hard-to-debug code.

Many beginners start by building complex UI or diving straight into AI integration. However, modern software engineering follows a deliberate **outside-in planning, inside-out execution** model:

```
[PLANNING PHASE]
  1. Product Definition & Capabilities  --> What problem are we solving?
  2. Data Model & Schema Design         --> What is the single source of truth?
  3. API & Service Architecture         --> How do components talk to each other?
  4. System & Tech Stack Selection      --> What tools fit the resource budget?

[EXECUTION PHASE (Phase 1 to 4)]
  Phase 1: Environment & Foundation     --> Project scaffolding, database migration script
  Phase 2: Core Domain Write Operations --> CRUD workflows, local validation, DB persistence
  Phase 3: Business Logic & Math        --> Algorithmic state transformations (Greedy Settlement)
  Phase 4: Third-Party & AI Integration --> Asynchronous OCR processing & data extraction
```

---

## 2. Pre-Development Planning Framework

Before writing a single line of code or prompting an AI agent, five structural elements must be defined:

### A. Resource Assessment & Tech Stack Selection
* **Frontend:** React + Vite + Tailwind CSS
  * *Why:* Rapid compilation, lightweight dev server, utility-first styling.
* **Database & BaaS:** Supabase (PostgreSQL)
  * *Why:* Relational data capabilities (essential for foreign key constraints in financial splits) with built-in client libraries and Row Level Security (RLS).
* **AI Model:** Google Gemini 1.5 Flash
  * *Why:* Free-tier access, multi-modal vision capabilities, fast structured JSON responses.

### B. Data Model & Schema Design
Financial applications require strict relational structure. You must design tables and foreign keys *before* building frontend forms:

* **`groups`**: Primary workspace (`id`, `name`, `created_at`).
* **`group_members`**: Link between users and groups (`id`, `group_id`, `name`).
* **`expenses`**: Primary transaction records (`id`, `group_id`, `payer_id`, `total_amount`, `title`).
* **`line_items`**: Sub-breakdown of an expense (`id`, `expense_id`, `description`, `amount`).
* **`settlements`**: Ledger entries tracking resolved debts (`id`, `group_id`, `from_user_id`, `to_user_id`, `amount`).

---

## 3. Phase-by-Phase Walkthrough & Rationale

---

### Phase 1: Foundation, Local Scaffolding & Database Connection

#### What Was Done:
1. Initialized React + Vite project with Tailwind CSS styling.
2. Created `mockData.ts` to establish baseline TypeScript interfaces.
3. Configured environment variables in `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. Generated `supabase/schema.sql` migration script and executed it in the Supabase Dashboard.

#### Why Built First:
* **The "Contract First" Principle:** Establishing data types and schema early creates a strict contract between the frontend and backend.
* **Decoupled Fallback:** By establishing mock data first, frontend development continues even if offline or if remote database credentials are modified.

---

### Phase 2: Manual Expense Creation & Data Itemization

#### What Was Done:
1. Created `AddExpenseModal.tsx` for capturing expense details and line-item assignments.
2. Wrote `expenseService.ts` to perform multi-table writes (`expenses` and `line_items`) into Supabase.
3. Applied error handling and client-side feedback for DB constraint validation.

#### Why Built Second:
* **Input before Output:** You cannot calculate balances or test settlement logic without first having structured expense records in the database.
* **Schema Validation:** Writing raw items manually validates that foreign key relationships (`expense_id` linking `line_items` to `expenses`) operate correctly before overlaying AI automation.

---

### Phase 3: Business Logic & Debt Minimization Algorithm

#### What Was Done:
1. Implemented a greedy debt-simplification algorithm in `settlementCalculator.ts`.
2. Built `SquareUpView.tsx` to visualize debtor/creditor balances and pending settlements.
3. Created the `settlements` table migration in Supabase to track completed "Mark as Paid" payments.

#### Why Built Third:
* **Isolation of Pure Business Logic:** Algorithmic balance calculation relies on deterministic math ($Net = Paid - Owed$). Keeping this independent of AI scanning ensures the core finance engine remains accurate.
* **Data Flow Progression:** Raw inputs (Phase 2) $\rightarrow$ Processing & Math (Phase 3) $\rightarrow$ Automated Inputs (Phase 4).

---

### Phase 4: AI Receipt Scanning & Multi-Modal Parsing

#### What Was Done:
1. Configured `@google/genai` client using `VITE_GEMINI_API_KEY`.
2. Created `ReceiptUploader.tsx` and `geminiOcrService.ts` to send image payloads to Gemini 1.5 Flash.
3. Enforced structured JSON output matching line-item interfaces to auto-fill the manual expense form.
4. Implemented retry mechanisms (handling HTTP 503 high demand) and explicit error states.

#### Why Built Last:
* **Automation as an Enhancement:** AI OCR is an automated entry method for the form built in Phase 2. If AI parsing fails, the user degrades gracefully to manual entry.
* **Cost & Latency Management:** Third-party integrations introduce external variables (network latencies, API quotas, vendor uptime). Isolating them to the final phase prevents external API issues from blocking core feature development.

---

## 4. Key DevOps Concepts & Engineering Principles Learned

1. **Environment Variable Security:**
   * Keys starting with `VITE_` are bundled into frontend assets and visible to the client browser.
   * `SUPABASE_PUBLISHABLE_KEY` and `VITE_GEMINI_API_KEY` are safe for public client usage when secured with database Row Level Security (RLS) and rate limits.
   * Administrative keys (`SECRET_KEY`) must never enter frontend `.env.local` files.

2. **Schema Cache & DB Migrations:**
   * Creating frontend code that targets a database table (`settlements`) requires running the SQL script in the database host first. Missing table definitions trigger schema cache lookup errors (`404` / `PGRST204`).

3. **Defensive AI Engineering:**
   * AI responses are inherently non-deterministic. Wrapping vision models with expected JSON schema guidelines and client-side retries prevents unpredictable output from crashing the client UI.

---

## 5. Architectural Playbook for Your Next AI Project

When launching a new project with Claude Code, follow this blueprint:

```
Step 1: Write PRD.md (Define goals, data shapes, user flows).
Step 2: Initialize project framework & Git repository.
Step 3: Define database schema (tables, keys, RLS policies).
Step 4: Build CRUD operations (forms, lists, DB persist services).
Step 5: Write domain algorithms & core calculation utilities.
Step 6: Layer on third-party APIs, AI features, and automated tools.
```