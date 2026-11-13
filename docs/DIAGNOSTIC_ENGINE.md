# GapFinder AI — Diagnostic Engine & Planning Specification

## 1. Topic Mastery Formula

Overall test scores mask granular conceptual deficiencies. GapFinder AI evaluates topic-level mastery $M \in [0, 100]$ using a multi-factor empirical equation:

$$M = 0.65A + 0.15D + 0.10R + 0.10C$$

### Component Definitions:
1. **Weighted Accuracy ($A \in [0, 100]$)**:
   $$A = \frac{\sum_{i=1}^N \text{ScoreAwarded}_i}{\sum_{i=1}^N \text{MaxScore}_i} \times 100$$
   Incorporates partial marks from both objective and semantic rubric grading.

2. **Difficulty-Adjusted Performance ($D \in [0, 100]$)**:
   $$D = \frac{\sum_{i=1}^N w(\text{Difficulty}_i) \cdot \text{FractionalScore}_i}{\sum_{i=1}^N w(\text{Difficulty}_i)} \times 100$$
   Weights:
   - Easy: $w = 1.0$
   - Medium: $w = 1.5$
   - Hard: $w = 2.0$
   Answering hard questions correctly provides higher leverage.

3. **Recency-Adjusted Performance ($R \in [0, 100]$)**:
   $$R = \frac{\sum_{i=1}^N e^{-\lambda \Delta t_i} \cdot \text{FractionalScore}_i}{\sum_{i=1}^N e^{-\lambda \Delta t_i}} \times 100$$
   where $\Delta t_i$ is the time elapsed in days since question attempt $i$, and $\lambda = 0.05$ is the memory half-life decay constant.

4. **Conceptual Coverage ($C \in [0, 100]$)**:
   $$C = \frac{|\text{Evaluated Objectives} \cap \text{Syllabus Objectives}|}{|\text{Syllabus Objectives}|} \times 100$$

---

## 2. Topic Classification & Confidence

### 2.1 Mastery Classification
- **NOT_ASSESSED**: Number of distinct questions $N < 1$.
- **WEAK**: $0 \le M < 50$
- **MEDIUM**: $50 \le M < 75$
- **STRONG**: $75 \le M \le 100$

### 2.2 Confidence Level
Confidence measures evidence robustness, preventing premature conclusions:
- **LOW**: $N \in [1, 2]$ questions OR $C < 30\%$.
- **MEDIUM**: $N \in [3, 4]$ questions AND $C \ge 30\%$.
- **HIGH**: $N \ge 5$ questions across multiple distinct attempts AND $C \ge 60\%$.

---

## 3. Misconception Taxonomy & Aggregation

When an answer is scored below 100%, the semantic evaluator or distractor mapping attributes error types into five categories:
1. `RECALL`: Facts, definitions, or terminology forgotten.
2. `CONCEPTUAL`: Flawed mental model or causal misunderstanding.
3. `APPLICATION`: Inability to transfer concept to a novel scenario.
4. `CALCULATION`: Arithmetic, unit conversion, or formula application error.
5. `TERMINOLOGY`: Confusion between similar technical terms (e.g., Mitosis vs. Meiosis).

Misconceptions appearing $\ge 2$ times across attempts are flagged as **Persistent Misconceptions** requiring targeted drills in the revision plan.

---

## 4. Adaptive Revision Priority Model

Revision tasks are scheduled using priority score $P \in [0, 100]$:

$$P = 0.50G + 0.30I + 0.20U$$

### Where:
- **Knowledge Gap ($G$)**:
  $$G = 100 - M$$
  (Unassessed topics default to $G = 75$).
- **Examination Importance ($I \in [0, 100]$)**:
  Computed from past-paper frequency and marks:
  $$I = (0.60 \cdot \text{NormFreq} + 0.25 \cdot \text{NormMarks} + 0.15 \cdot \text{RecencyWeight}) \times 100$$
- **Urgency Factor ($U \in [0, 100]$)**:
  $$U = \max\left(0, 100 \cdot \left(1 - \frac{\text{DaysUntilExam}}{60}\right)\right)$$

### Daily Schedule Allocation:
- Respects student's `daily_study_hours` parameter.
- High $P$ topics receive active recall and misconception drills (45–60 min).
- Strong topics ($M \ge 75$) receive low-frequency spaced retention checks (15–20 min).
- Dynamic re-scheduling automatically preserves completed tasks when updating after reassessment.
