# GapFinder AI — Verification & Testing Protocol

## 1. Test Architecture Overview

The test harness exercises the complete academic diagnostic workflow across:
1. **Authentication & Multi-Tenant Isolation**: Verified in `backend/tests/test_auth.py`.
2. **Formula Verification & Knowledge-Gap Diagnosis**: Verified in `backend/tests/test_evaluation_diagnostics.py`.
3. **Adaptive Knapsack Priority Scheduling**: Verified in `backend/tests/test_evaluation_diagnostics.py`.
4. **Vector Retrieval & RAG Citation Integrity**: Verified in `backend/tests/test_rag_quality.py`.
5. **Frontend Production Compilation**: Verified via TypeScript & Vite build toolchain.

---

## 2. Test Execution Commands

### Run Backend Unit & Integration Tests:
```bash
python -m pytest backend/tests -v
```

### Run Demo Seeding Verification:
```bash
python scripts/seed_demo.py
```

### Run Frontend Production Build:
```bash
cd frontend
pnpm run build
```

---

## 3. Grounding & RAG Quality Assertions
- **Subject Scope Isolation**: Tested by verifying that searching across subject boundaries never retrieves cross-subject chunks.
- **Citation Veracity**: Checks that every cited source chunk exists in the database and matches page boundaries.
- **Prompt Injection Defense**: Evaluates that system prompts isolate user documents within `<STUDY_SOURCE_DOCUMENT>` fences and prevent instruction overrides.
