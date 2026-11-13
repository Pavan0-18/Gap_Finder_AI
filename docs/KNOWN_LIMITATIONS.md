# GapFinder AI — Known Limitations & Operational Constraints

1. **OCR Processing for Scanned Documents**:
   - High-fidelity text extraction is supported for native PDFs, DOCX, and TXT files.
   - For heavily degraded physical scans, text extraction relies on Tesseract OCR if installed on the host system. When Tesseract is not installed in the execution environment, the pipeline flags the document with status `PARTIALLY_COMPLETED` and provides an explicit warning to the student.

2. **LLM Provider API Availability**:
   - In production environments, GapFinder AI connects to Google Gemini (e.g., `gemini-1.5-pro`, `gemini-1.5-flash`, `text-embedding-004`) or OpenAI endpoints via environment variables (`GEMINI_API_KEY` or `OPENAI_API_KEY`).
   - In offline or development modes without external API keys, the system transparently utilizes the built-in `DeterministicAcademicProvider` with deterministic test fixtures and exact source citation extraction. This ensures complete end-to-end functionality without failing or fabricating ungrounded responses.

3. **Database Vector Extension**:
   - PostgreSQL with `pgvector` extension is the standard production backend.
   - In lightweight local standalone test environments where a PostgreSQL server daemon is not initialized, the system provides an automated fallback to an in-memory/NumPy vector similarity store, maintaining identical cosine retrieval behavior and schema parity.

4. **Token Limits & Rate Limiting**:
   - Chunk sizes are capped at 500-800 tokens to ensure retrieval sets fit safely within provider context windows and prevent rate-limit throttling during bulk past-paper ingestion.
