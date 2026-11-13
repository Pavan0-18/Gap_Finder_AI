# GapFinder AI

> **Tagline**: Find What You Don't Know.  
> An AI-powered academic diagnostic platform that identifies what a student does not understand, explains why, and generates an adaptive revision strategy.

---

## 1. Product Overview

Traditional educational applications allow students to ask questions and receive answers. **GapFinder AI** proactively diagnoses knowledge gaps.

The primary product output is an empirical, topic-level academic diagnosis—not a generic chatbot response or simple percentage quiz score.

```
UPLOAD MATERIALS (Syllabus, Textbooks, Notes, Past Papers)
       │
       ▼
BUILD HIERARCHICAL TOPIC MAP & EXAM IMPORTANCE WEIGHTS
       │
       ▼
GENERATE GROUNDED DIAGNOSTIC ASSESSMENT (RAG)
       │
       ▼
DUAL EVALUATION (Objective Deterministic + Semantic Rubric Partial Credit)
       │
       ▼
IDENTIFY KNOWLEDGE GAPS & PERSISTENT MISCONCEPTIONS
       │
       ▼
GENERATE ADAPTIVE REVISION PLAN
       │
       ▼
REASSESS → DYNAMICALLY ADAPT REVISION SCHEDULE
```

---

## 2. Mandatory Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Zustand, Recharts, Lucide React, React Markdown.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, JWT Authentication (HS256), Bcrypt password hashing.
- **Database**: PostgreSQL with `pgvector` for production/Docker; automatic SQLite vector fallback for standalone local zero-dependency testing.
- **Document Processing**: `pdfplumber`, `pypdf`, standard-library DOCX XML parser, UTF-8 text streaming with OCR fallback alerts.
- **AI / LLM Orchestration**: Pluggable provider abstraction supporting Google Gemini (`gemini-1.5-flash`, `text-embedding-004`), OpenAI, and an offline grounded deterministic academic provider with verifiable citation extraction.

---

## 3. Demo Credentials

The repository includes a reproducible seed script and sample educational dataset in `sample_data/`:

| Role | Email | Password | Subject Seeded |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `demo@gapfinder.ai` | `DemoStudent123!` | Advanced Cellular and Molecular Biology (BIO-301) |

The demo subject includes:
- Course Syllabus with Units and Chapters
- Textbook Chapters (Principles of Modern Cellular Biology)
- Lecture Notes on Cell Division
- 2 Past University Examination Papers (2023 & 2024)
- Completed baseline assessment revealing a specific misconception on Meiosis I homologous chromosome segregation vs Mitosis
- Verified Knowledge Gap Report
- Versioned Adaptive Revision Plan

---

## 4. Local Quickstart (Zero External Services Needed)

### Prerequisites
- Python 3.10+ (Verified on Python 3.11 & 3.14)
- Node.js 18+ and `pnpm` (or `npm`)

### 1. Backend Setup
```bash
# In repository root
python -m pip install -r backend/requirements.txt

# Run demo database seeding (creates SQLite DB & loads course materials)
python scripts/seed_demo.py

# Start FastAPI backend server on port 8000
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI documentation will be accessible at: `http://localhost:8000/api/v1/docs`

### 2. Frontend Setup
```bash
# In a new terminal
cd frontend
pnpm install
pnpm run dev
```
Open your browser at `http://localhost:5173`. Click **"Quick Demo Student Login"** to inspect the live seeded workspace immediately!

---

## 5. Docker Compose Deployment (PostgreSQL + pgvector)

To run the complete production stack with PostgreSQL and `pgvector`:
```bash
# Copy environment configuration
cp .env.example .env

# Start database, backend, and frontend containers
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL pgvector: `localhost:5432`

---

## 6. Mathematical Formulas Implemented

### Topic Mastery Equation
Overall test scores mask granular conceptual deficiencies. GapFinder AI evaluates topic-level mastery $M \in [0, 100]$ using:

$$M = 0.65A + 0.15D + 0.10R + 0.10C$$

Where:
- $A$: Weighted accuracy across all question types including partial credit.
- $D$: Difficulty-adjusted performance (weights: Easy = 1.0, Medium = 1.5, Hard = 2.0).
- $R$: Recency-adjusted performance with exponential memory decay: $e^{-\lambda \Delta t}$.
- $C$: Conceptual coverage across defined syllabus learning objectives.

### Topic Classification & Confidence
- **NOT_ASSESSED**: Question count $N < 1$.
- **WEAK**: $0 \le M < 50$
- **MEDIUM**: $50 \le M < 75$
- **STRONG**: $75 \le M \le 100$
- **Confidence Rating**:
  - `LOW`: $N \in [1, 2]$ or $C < 30\%$
  - `MEDIUM`: $N \in [3, 4]$ and $C \ge 30\%$
  - `HIGH`: $N \ge 5$ across distinct attempts and $C \ge 60\%$

### Past Examination Yield
Calculates topic importance from historical papers:
$$I = (0.60 \cdot \text{NormFreq} + 0.25 \cdot \text{NormMarks} + 0.15 \cdot \text{RecencyWeight}) \times 100$$

### Adaptive Revision Priority Model
Revision tasks are dynamically scheduled using priority score $P \in [0, 100]$:
$$P = 0.50G + 0.30I + 0.20U$$
Where $G = 100 - M$ (knowledge gap), $I$ is exam yield, and $U$ is urgency based on target exam deadline.

---

## 7. Running Verification Tests

```bash
# Backend unit, integration, and RAG quality tests
python -m pytest backend/tests -v

# Frontend TypeScript compilation and production build
cd frontend && pnpm run build
```

---

## 8. Documentation Directory

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): System architecture, monorepo design, subsystem breakdown.
- [`docs/DATABASE.md`](docs/DATABASE.md): Relational schema diagram and 21 required entity definitions.
- [`docs/API.md`](docs/API.md): Versioned REST API documentation (`/api/v1`).
- [`docs/RAG_PIPELINE.md`](docs/RAG_PIPELINE.md): Grounded retrieval, prompt-injection defense, and citation validator.
- [`docs/DIAGNOSTIC_ENGINE.md`](docs/DIAGNOSTIC_ENGINE.md): Mathematical equations for mastery, confidence, and adaptive scheduling.
- [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md): Operational constraints and fallback behaviors.
- [`docs/TESTING.md`](docs/TESTING.md): Testing instructions and verification protocol.
- [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md): Milestone progress tracking.
