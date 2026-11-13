# GapFinder AI — Implementation Plan & Milestone Tracker

| Milestone | Scope / Deliverable | Status | Dependencies | Verification Evidence |
|:---|:---|:---:|:---|:---|
| **Milestone 0: Repository Analysis** | Inspect environment, define architecture, schemas, and math specs | **COMPLETED** | System runtimes | Documentation files in `docs/` |
| **Milestone 1: Foundation** | Project scaffolding, FastAPI, SQLAlchemy 21-entity schema, JWT Auth, Demo Seed, React + Vite + Tailwind shell | **COMPLETED** | Python 3.14, Node.js | Auth routes, DB tables, Health checks (`pytest`) |
| **Milestone 2: Document Intelligence** | PDF/TXT/DOCX parsers, semantic chunker, embeddings, vector similarity search | **COMPLETED** | M1 | Ingestion pipeline tests, chunk retrieval |
| **Milestone 3: Academic Intelligence** | Syllabus parsing, hierarchical topic tree, topic review interface, past-paper analysis, exam weights | **COMPLETED** | M2 | Topic mapping tests, exam frequency calculation |
| **Milestone 4: Assessment Engine** | Diagnostic question generator, citation validator, quiz interface, objective/semantic grading | **COMPLETED** | M3 | Quiz runner, answer submission, partial marking |
| **Milestone 5: Diagnostic Engine** | Topic mastery formula ($M = 0.65A + 0.15D + 0.10R + 0.10C$), confidence scoring, misconception aggregation, Gap Report UI | **COMPLETED** | M4 | Empirical mastery verification, gap report cards |
| **Milestone 6: Adaptive Planner** | Priority knapsack scheduler ($P = 0.50G + 0.30I + 0.20U$), daily task calendar, reassessment adaptation, plan versioning | **COMPLETED** | M5 | Plan adaptation verification test |
| **Milestone 7: Finalization** | AI Tutor, progress analytics, end-to-end integration tests, Docker Compose, README guide | **COMPLETED** | M6 | Full loop verification: Upload -> Diagnose -> Plan -> Adapt |

---

## Acceptance Criteria Verification Matrix

- [x] Student can register and log in (`/api/v1/auth/register`, `/api/v1/auth/login`).
- [x] Demo credentials work (`demo@gapfinder.ai` / `DemoStudent123!`).
- [x] Student can create a subject (`/api/v1/subjects`).
- [x] Student can upload syllabus, textbook, notes and past papers.
- [x] PDF and TXT extraction work (`pdfplumber` / UTF-8 streaming).
- [x] DOCX extraction works (Standard library WordML XML parser).
- [x] Scanned-document limitations are handled explicitly (`PARTIALLY_COMPLETED` alert).
- [x] Document chunks preserve page references and headings.
- [x] Embeddings are persisted (1536-dimensional vectors).
- [x] Semantic retrieval returns relevant chunks filtered by tenant and subject scope.
- [x] Topic map is generated from the syllabus.
- [x] Topics can be manually corrected (Add, Edit, Delete, Confirm).
- [x] Past-paper questions are extracted with marks and years.
- [x] Past questions are mapped to syllabus topics.
- [x] Examination importance is calculated from empirical evidence ($0.60\text{Freq} + 0.25\text{Marks} + 0.15\text{Recency}$).
- [x] Diagnostic questions are generated from retrieved content.
- [x] Questions contain verifiable source citations.
- [x] Student can complete a quiz with live timer and navigation.
- [x] Answers are persisted with autosave.
- [x] Objective answers are evaluated deterministically.
- [x] Short answers support partial marking and rubric grading.
- [x] Answer explanations contain supporting evidence citations.
- [x] Topic mastery is calculated from actual performance ($M = 0.65A + 0.15D + 0.10R + 0.10C$).
- [x] Weak, medium, strong and not-assessed states work.
- [x] Confidence rating (LOW, MEDIUM, HIGH) is calculated and displayed.
- [x] Misconceptions are identified with category and corrective strategy.
- [x] Gap report is generated with comprehensive topic cards.
- [x] Revision plan respects student availability (`daily_study_hours`).
- [x] Revision tasks can be completed interactively.
- [x] Reassessment updates topic mastery and appends to `mastery_history`.
- [x] New plan version is generated preserving completed tasks.
- [x] Progress history is preserved across attempts.
- [x] AI tutor uses retrieved source material with source citations.
- [x] Unauthorized users cannot access other students' data (tenant ownership isolation).
- [x] Error states and loading skeletons are implemented across all pages.
- [x] Frontend and backend tests pass cleanly.
- [x] Application can be started using documented local or Docker instructions.
