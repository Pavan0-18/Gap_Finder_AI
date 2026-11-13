# GapFinder AI — Architecture Specification

## 1. System Overview
GapFinder AI is an academic diagnostic and adaptive revision platform designed to uncover student knowledge gaps, pinpoint root misconceptions, and dynamically adjust study schedules based on empirical assessment outcomes.

Unlike conversational chatbots or basic quizzing apps, GapFinder AI implements a closed-loop diagnostic framework:
```
Upload Materials (Syllabus, Textbooks, Notes, Past Papers)
       │
       ▼
Hierarchical Topic Mapping & Past-Paper Importance Weighting
       │
       ▼
Grounded RAG Diagnostic Assessment Generation
       │
       ▼
Dual Evaluation Engine (Deterministic Objective + Rubric-Semantic)
       │
       ▼
Knowledge Gap Diagnostic Engine (Weighted Mastery & Misconceptions)
       │
       ▼
Adaptive Revision Planner (Priority-based Knapsack Scheduling)
       │
       ▼
Targeted Reassessment & Dynamic Plan Adaptation
```

---

## 2. Monorepo Structure

```
Gap_Finder_AI/
├── frontend/                     # React 18 / 19 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/                  # App shell, routing, query client provider
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui & Radix primitives
│   │   │   ├── layout/           # Sidebar, navbar, container shells
│   │   │   ├── charts/           # Recharts mastery radar, trend lines, distributions
│   │   │   ├── documents/        # Upload dropzone, file list, processing status
│   │   │   ├── topics/           # Topic tree viewer, manual editor & confirm modal
│   │   │   ├── assessments/      # Timed quiz runner, question navigation, review
│   │   │   ├── diagnosis/        # Gap report, evidence inspection, misconception cards
│   │   │   └── planner/          # Daily study calendar, task cards, re-prioritization
│   │   ├── pages/                # High-level route pages (Dashboard, GapReport, etc.)
│   │   ├── features/             # Business hooks and feature slices
│   │   ├── services/             # Axios/Fetch typed API clients
│   │   ├── stores/               # Zustand UI stores (auth session, active filters)
│   │   ├── types/                # Strict TypeScript interfaces matching backend schemas
│   │   └── utils/                # Date formatting, math, citation link builders
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # FastAPI + SQLAlchemy 2 + Pydantic v2
│   ├── app/
│   │   ├── main.py               # FastAPI application factory & router registration
│   │   ├── core/
│   │   │   ├── config.py         # Settings management via pydantic-settings
│   │   │   ├── database.py       # Engine, sessionmaker, base model
│   │   │   └── security.py       # JWT creation/verification, Argon2/bcrypt hashing
│   │   ├── api/
│   │   │   └── v1/               # Versioned REST endpoints (auth, subjects, materials...)
│   │   ├── models/               # SQLAlchemy ORM entity models (21 required entities)
│   │   ├── schemas/              # Pydantic v2 request/response validation schemas
│   │   ├── repositories/         # Database access layer with strict ownership isolation
│   │   ├── services/             # Pure academic business logic
│   │   ├── ai/
│   │   │   ├── providers/        # LLM Provider abstraction (Gemini, OpenAI, Deterministic Test)
│   │   │   ├── embeddings/       # Embedding abstraction (Text-embedding-004, miniLM, Local fallback)
│   │   │   ├── retrieval/        # Pgvector similarity search + BM25/Cosine fallback
│   │   │   ├── generation/       # Grounded diagnostic question generator
│   │   │   ├── evaluation/       # Semantic answer evaluator + rubric grader
│   │   │   └── prompts/          # Strict system prompts with anti-injection fences
│   │   ├── ingestion/            # PDF, TXT, DOCX parsers, semantic chunkers, OCR fallback
│   │   ├── diagnostics/          # Topic mastery scoring (M = 0.65A + 0.15D + 0.10R + 0.10C)
│   │   ├── planning/             # Priority scheduler (P = 0.50G + 0.30I + 0.20U)
│   │   └── utils/
│   ├── migrations/               # Alembic database migration scripts
│   ├── tests/                    # Pytest test suite (unit, integration, RAG quality)
│   └── requirements.txt
│
├── docs/                         # Specifications, architecture, math formulas, RAG
├── sample_data/                  # Legal, public-domain comprehensive academic sample sets
├── scripts/                      # DB seeding, demo reset, test verification scripts
├── docker-compose.yml            # PostgreSQL + pgvector container definition
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Core Subsystems

### 3.1 Authentication & Security Subsystem
- **JWT Authentication**: Short-lived access tokens (60 min) with refresh tokens stored in secure HTTP-only cookies or bearer tokens.
- **Strict Tenant & Ownership Isolation**: Every repository query enforces `WHERE user_id = current_user.id` or verifies subject ownership.
- **Passlib/Bcrypt**: Secure salted password hashing.

### 3.2 Ingestion & Vectorization Subsystem
- **Multi-Format Extraction**: `pdfplumber` / `pypdf` for native PDFs, zipfile XML parsing for DOCX, UTF-8 streaming for TXT, with graceful OCR stub/fallback for scanned pages.
- **Structure-Aware Chunking**: Chunks of 500-800 tokens with 75-120 token sliding window overlap, preserving chapter, section heading, page number, and material source metadata.
- **Dual Vector Storage**: Pluggable storage architecture supporting PostgreSQL `pgvector` with ivfflat/hnsw indices for production/Docker environments, alongside an optimized in-memory/NumPy vector similarity store for standalone local test environments.

### 3.3 Diagnostic Assessment & RAG Engine
- **Pre-generation Retrieval**: Questions are generated strictly from retrieved, cited chunks.
- **Format Coverage**: MCQ, Multiple-select, True/False, Short-Answer with conceptual rubrics.
- **Prompt Injection Defense**: Uploaded text is treated as untrusted data wrapped in strict delimitations.

### 3.4 Dual Evaluation Engine
- **Objective Evaluator**: Normalized deterministic matching for MCQs and structured answers.
- **Semantic Evaluator**: LLM-guided conceptual evaluation scoring against rubrics, identifying missing concepts, understood concepts, and misconceptions, with partial credit attribution.

### 3.5 Knowledge-Gap Diagnostic Engine
- **Formula-Driven Mastery Scoring**:
  $$M = 0.65A + 0.15D + 0.10R + 0.10C$$
  where $A$ = weighted accuracy, $D$ = difficulty modifier, $R$ = recency decay factor, $C$ = conceptual coverage across learning objectives.
- **Evidence Confidence**: Evaluates evidence sufficiency (Low, Medium, High) based on sample diversity and question counts.

### 3.6 Adaptive Revision Planner
- **Priority Calculation**:
  $$P = 0.50G + 0.30I + 0.20U$$
  where $G$ = knowledge gap ($100 - M$), $I$ = past-paper exam importance, $U$ = urgency factor based on exam target date.
- **Constraint-Aware Scheduling**: Knapsack-style daily task allocation respecting student daily hour limits, exam deadlines, and prerequisite chains.
