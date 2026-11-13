# GapFinder AI — RAG Pipeline Specification

## 1. Principles of Academic Grounding
Retrieval-Augmented Generation (RAG) in GapFinder AI is strictly bifurcated into independent retrieval and generation phases. It is designed around the tenet that:
> **No diagnostic question, rubric, answer evaluation, or tutor explanation may be generated from latent LLM memory without verifiable, subject-scoped retrieval context.**

---

## 2. Ingestion & Semantic Chunking

### 2.1 Supported Document Ingestion
- **Formats**: PDF (via `pdfplumber` / `pypdf`), DOCX (via XML parser), TXT (UTF-8).
- **Metadata Extraction**: Document hash (SHA-256), page boundaries, chapter/section detection, token count.
- **Chunking Parameters**:
  - Target window: 500 – 800 tokens.
  - Overlap window: 75 – 120 tokens.
  - Boundary strategy: Heading-aware (never merges unrelated chapters).
- **Chunk Record**:
  ```json
  {
    "chunk_id": "c1f7a28e-...",
    "material_id": "m9a1...",
    "subject_id": "s4b2...",
    "content": "Meiosis involves two sequential cell divisions...",
    "page_number": 42,
    "chapter": "Chapter 4: Cellular Reproduction",
    "section": "Section 4.3: Meiotic Division Stages",
    "token_count": 612,
    "content_hash": "a8f3...",
    "embedding": [0.0123, -0.0456, ...]
  }
  ```

---

## 3. Retrieval Engine

### 3.1 Retrieval Flow
1. **Query Construction**: Query is derived from topic titles, learning objectives, or student inquiry.
2. **Embedding Generation**: Vector embedding of the query is computed using the active embedding model (Gemini `text-embedding-004`, OpenAI `text-embedding-3-small`, or local deterministic embeddings).
3. **Tenant & Scope Filtering**:
   - Query filters strictly enforce: `subject_id = :subject_id` AND `material_id IN (accessible_materials)`.
4. **pgvector Similarity Calculation**:
   - Cosine distance (`<=>`) or inner product (`<#>`).
5. **Deduplication & Top-K Truncation**:
   - Retrieves top $K \in [5, 8]$ chunks.
   - Filters out redundant chunks with identical content hashes or >90% token overlap.
6. **Relevance Threshold**: Chunks with cosine similarity below $0.65$ are pruned to prevent out-of-domain hallucinations.

---

## 4. Grounded Generation & Citation Validation

### 4.1 Prompt Injection Defense
Material chunks are enclosed in strict, unprivileged delimiters:
```
<STUDY_SOURCE_DOCUMENT id="chunk_1" page="42" material="Campbell_Biology.pdf">
... raw chunk text ...
</STUDY_SOURCE_DOCUMENT>
```
The system prompt strictly instructs the LLM that content inside `<STUDY_SOURCE_DOCUMENT>` is reference data, never executable instructions.

### 4.2 Citation Verification Protocol
Every generated question or tutor answer that claims a source must provide a chunk reference:
```json
{
  "chunk_id": "c1f7a28e-...",
  "page_number": 42,
  "quoted_snippet": "Meiosis I segregates homologous chromosomes..."
}
```
The backend `CitationValidator` performs:
1. **Existence Check**: Confirms `chunk_id` exists in the database.
2. **Context Membership**: Validates that `chunk_id` was in the retrieved set for this request.
3. **Subject Match**: Confirms chunk belongs to the user's active subject.
4. **Verbatim Veracity**: Ensures `quoted_snippet` exists in the retrieved chunk content.

Any generated item failing citation validation is discarded and regenerated.
