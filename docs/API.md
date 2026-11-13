# GapFinder AI — API Reference (v1)

Base URL: `/api/v1`  
Interactive OpenAPI/Swagger: `http://localhost:8000/api/v1/docs`

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
- **Description**: Registers a new student account.
- **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "Password123!",
    "full_name": "Alex Chen"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "u1-...",
      "email": "student@example.com",
      "full_name": "Alex Chen",
      "role": "student",
      "created_at": "2026-11-13T10:00:00Z"
    }
  }
  ```

### `POST /auth/login`
- **Description**: Authenticates student credentials and returns a signed JWT access token.
- **Request Body**: `{"email": "...", "password": "..."}`
- **Response**: `200 OK` (Returns `TokenResponse`).

### `POST /auth/refresh`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

### `GET /auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` (Current authenticated user profile).

---

## 2. Subjects (`/subjects`)

### `GET /subjects`
- **Description**: Lists all subjects belonging to the authenticated student with material counts, topic counts, and overall mastery percentage.
- **Response**: `200 OK` (List of `SubjectResponse`).

### `POST /subjects`
- **Request Body**:
  ```json
  {
    "name": "Advanced Cellular Biology",
    "code": "BIO-301",
    "description": "Mechanisms of cell cycle and division.",
    "target_exam_date": "2026-12-04",
    "daily_study_hours": 2.0
  }
  ```
- **Response**: `201 Created`

### `GET /subjects/{id}`
- **Response**: `200 OK`

### `PATCH /subjects/{id}`
- **Response**: `200 OK`

### `DELETE /subjects/{id}`
- **Response**: `204 No Content` (Cascades to all associated materials, chunks, quizzes, and tasks).

---

## 3. Materials & Document Ingestion (`/materials` & `/subjects/{id}/materials`)

### `POST /subjects/{id}/materials`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Binary file (PDF, TXT, DOCX)
  - `material_type`: `SYLLABUS` | `TEXTBOOK` | `NOTES` | `PAST_PAPER`
  - `title`: (Optional string)
- **Response**: `201 Created` (Material record with status `COMPLETED` or `PARTIALLY_COMPLETED`).

### `GET /subjects/{id}/materials`
- **Response**: `200 OK` (List of uploaded materials).

### `GET /materials/{id}/status`
- **Response**: `200 OK`
  ```json
  {
    "id": "m1-...",
    "processing_status": "COMPLETED",
    "total_pages": 42,
    "total_chunks": 56,
    "error_message": null
  }
  ```

### `DELETE /materials/{id}`
- **Response**: `204 No Content`

---

## 4. Topics (`/topics` & `/subjects/{id}/topics`)

### `GET /subjects/{id}/topics`
- **Description**: Returns hierarchical topic tree for the subject with learning objectives and mastery status.
- **Response**: `200 OK`

### `POST /subjects/{id}/topics`
- **Description**: Manually create a new topic.
- **Response**: `201 Created`

### `POST /subjects/{id}/topics/extract`
- **Description**: Automatically parse course syllabus and extract hierarchical units, chapters, and topics.
- **Response**: `200 OK`

### `POST /subjects/{id}/topics/confirm`
- **Description**: Confirms review of topic map and sets confidence to 1.0.
- **Response**: `200 OK`

---

## 5. Past Examination Papers (`/subjects/{id}/past-papers`)

### `GET /subjects/{id}/past-papers`
- **Description**: Returns extracted historical examination questions with marks and topic associations.
- **Response**: `200 OK`

### `GET /subjects/{id}/exam-analysis`
- **Description**: Returns topic examination yield weights ($I = 0.60\text{Freq} + 0.25\text{Marks} + 0.15\text{Recency}$).
- **Response**: `200 OK`

---

## 6. Diagnostic Assessments (`/quizzes` & `/attempts`)

### `POST /subjects/{id}/quizzes/generate`
- **Request Body**:
  ```json
  {
    "title": "Cell Division Diagnostic",
    "quiz_type": "DIAGNOSTIC",
    "target_topic_ids": ["t1-...", "t2-..."],
    "question_count": 4,
    "duration_minutes": 25
  }
  ```
- **Response**: `201 Created` (Grounded quiz with citations).

### `POST /quizzes/{id}/attempts`
- **Description**: Begins an assessment attempt.
- **Response**: `201 Created`

### `PATCH /attempts/{attempt_id}/answers`
- **Description**: Autosaves draft answers during the quiz.
- **Response**: `200 OK`

### `POST /attempts/{attempt_id}/submit`
- **Description**: Idempotent submission that evaluates objective answers, executes semantic rubric grading with partial marks, records misconceptions, recalculates topic mastery, and saves history snapshots.
- **Response**: `200 OK` (Full evaluation breakdown with score and citations).

---

## 7. Knowledge Gap Diagnosis (`/subjects/{id}/gap-report`)

### `GET /subjects/{id}/gap-report`
- **Description**: Returns topic-level diagnosis cards with mastery score, status (`WEAK`, `MEDIUM`, `STRONG`, `NOT_ASSESSED`), confidence, misconception list, and cited evidence excerpts.
- **Response**: `200 OK`

### `GET /subjects/{id}/mastery-history`
- **Description**: Returns historical snapshots showing topic mastery evolution over time.
- **Response**: `200 OK`

---

## 8. Adaptive Revision Planner (`/revision-plans`)

### `POST /subjects/{id}/revision-plans/generate`
- **Description**: Generates priority-scheduled study tasks ($P = 0.50G + 0.30I + 0.20U$).
- **Response**: `201 Created`

### `PATCH /revision-tasks/{id}`
- **Description**: Toggles task completion status.
- **Request Body**: `{"is_completed": true}`
- **Response**: `200 OK`

### `POST /revision-plans/{id}/recalculate`
- **Description**: Dynamically adapts schedule to new assessment results while preserving completed tasks.
- **Response**: `200 OK` (Version $N+1$).

---

## 9. AI Academic Tutor (`/subjects/{id}/chat`)

### `POST /subjects/{id}/chat`
- **Description**: Sends student question to the RAG tutor, retrieving verifiable subject passages and enforcing anti-injection grounding.
- **Request Body**:
  ```json
  {
    "content": "Why do homologous chromosomes segregate in Meiosis I?",
    "topic_id": "optional-topic-id"
  }
  ```
- **Response**: `200 OK` (Includes assistant response and source citations).
