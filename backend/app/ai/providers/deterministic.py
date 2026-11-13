import re
import json
import math
import hashlib
from typing import List, Dict, Any, Optional
from app.ai.providers.base import BaseLLMProvider, BaseEmbeddingProvider

class DeterministicEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, dimension: int = 1536):
        self.dimension = dimension

    def _text_to_vector(self, text: str) -> List[float]:
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        words = clean.split()
        if not words:
            return [0.0] * self.dimension

        vec = [0.0] * self.dimension
        # 1-grams and 2-grams
        tokens = list(words)
        for i in range(len(words) - 1):
            tokens.append(f"{words[i]}_{words[i+1]}")

        for tok in tokens:
            h = int(hashlib.sha256(tok.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dimension
            sign = 1.0 if ((h >> 8) & 1) == 1 else -1.0
            vec[idx] += sign

        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 1e-9:
            vec = [x / norm for x in vec]
        return vec

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self._text_to_vector(t) for t in texts]

class DeterministicLLMProvider(BaseLLMProvider):
    """
    Deterministic academic provider designed for offline development and rigorous automated tests.
    It processes study passages and prompts deterministically without fabricating citations.
    """
    def __init__(self, model_name: str = "deterministic-academic-v1"):
        self.model_name = model_name

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False,
        temperature: float = 0.2,
    ) -> str:
        prompt_lower = prompt.lower()

        # 1. Topic Extraction / Syllabus Parsing
        if "syllabus" in prompt_lower or "extract topics" in prompt_lower:
            return json.dumps({
                "units": [
                    {
                        "name": "Unit 1: Cellular and Molecular Biology",
                        "chapters": [
                            {
                                "name": "Chapter 1: Cell Structure and Division",
                                "topics": [
                                    {
                                        "name": "Mitosis and the Cell Cycle",
                                        "description": "Mechanisms of nuclear division, chromosome condensation, and spindle formation.",
                                        "learning_objectives": [
                                            "Describe the phases of mitosis: prophase, metaphase, anaphase, and telophase",
                                            "Explain the role of the mitotic spindle and kinetochores",
                                            "Distinguish cytokinesis in plant and animal cells"
                                        ],
                                        "estimated_difficulty": "MEDIUM"
                                    },
                                    {
                                        "name": "Meiosis and Genetic Variation",
                                        "description": "Two-stage division generating haploid gametes and introducing crossing over.",
                                        "learning_objectives": [
                                            "Compare the stages of Meiosis I and Meiosis II",
                                            "Explain how crossing over and independent assortment yield genetic variation",
                                            "Contrast chromosome segregation in mitosis versus meiosis"
                                        ],
                                        "estimated_difficulty": "HARD"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })

        # 2. Diagnostic Question Generation
        if "generate" in prompt_lower and ("question" in prompt_lower or "quiz" in prompt_lower):
            # Extract chunk citation ids from prompt if present
            chunk_matches = re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', prompt)
            source_id = chunk_matches[0] if chunk_matches else "source_chunk_default"

            # Parse topic from prompt
            topic_name = "Cell Division"
            if "meiosis" in prompt_lower:
                topic_name = "Meiosis and Genetic Variation"
            elif "mitosis" in prompt_lower:
                topic_name = "Mitosis and the Cell Cycle"

            return json.dumps({
                "questions": [
                    {
                        "question_text": f"During which phase of {topic_name} do homologous chromosomes pair and exchange genetic material via crossing over?",
                        "question_type": "MCQ",
                        "difficulty": "MEDIUM",
                        "marks": 1.0,
                        "options": [
                            "Prophase I",
                            "Metaphase II",
                            "Anaphase I",
                            "Telophase II"
                        ],
                        "correct_answer": "Prophase I",
                        "explanation": "Homologous chromosomes undergo synapsis and crossing over specifically during Prophase I of meiosis.",
                        "rubric": {
                            "criteria": "Correct identification of Prophase I",
                            "keywords": ["Prophase I", "synapsis", "crossing over"]
                        },
                        "learning_objectives": [
                            "Explain how crossing over and independent assortment yield genetic variation"
                        ],
                        "source_chunk_ids": [source_id],
                        "citation_snippets": ["crossing over occurs between non-sister chromatids of homologous chromosomes during prophase I"]
                    },
                    {
                        "question_text": f"Explain the critical difference in chromosome segregation between Mitosis and Meiosis I.",
                        "question_type": "SHORT_ANSWER",
                        "difficulty": "HARD",
                        "marks": 5.0,
                        "options": None,
                        "correct_answer": "In Mitosis, sister chromatids separate to opposite poles, yielding genetically identical diploid cells. In Meiosis I, homologous chromosome pairs separate while sister chromatids remain joined, reducing chromosome ploidy from diploid to haploid.",
                        "explanation": "Mitosis separates individual sister chromatids, whereas Meiosis I separates homologous pairs, maintaining sister chromatid cohesion until Meiosis II.",
                        "rubric": {
                            "criteria": "Mention segregation of sister chromatids in mitosis (2 pts), segregation of homologous chromosomes in meiosis I (2 pts), and resulting ploidy difference (1 pt).",
                            "keywords": ["sister chromatids", "homologous chromosomes", "diploid", "haploid"]
                        },
                        "learning_objectives": [
                            "Contrast chromosome segregation in mitosis versus meiosis"
                        ],
                        "source_chunk_ids": [source_id],
                        "citation_snippets": ["sister chromatids remain attached during meiosis I while homologous pairs disjoin"]
                    }
                ]
            })

        # 3. Semantic Answer Evaluation
        if "evaluate" in prompt_lower or "student response" in prompt_lower or "rubric" in prompt_lower:
            # Check response against expected concepts
            student_resp_match = re.search(r"Student Response:\s*(.+?)(?:\n|$)", prompt, re.IGNORECASE)
            resp = student_resp_match.group(1).lower() if student_resp_match else prompt_lower

            score = 5.0
            understood = []
            missing = []
            misconceptions = []

            if "sister chromatid" in resp and "homolog" in resp:
                score = 5.0
                understood = [
                    "Understands distinction between sister chromatids and homologous pairs",
                    "Recognizes reductional division in meiosis I"
                ]
                feedback = "Excellent conceptual explanation. Correctly identifies segregation mechanisms and ploidy differences."
            elif "sister" in resp or "separate" in resp:
                score = 2.5
                understood = ["Recognizes that chromosomes separate during division"]
                missing = ["Failed to explain that homologous pairs segregate during Meiosis I while sister chromatids stay bound"]
                misconceptions.append({
                    "category": "CONCEPTUAL",
                    "title": "Homolog vs Chromatid Segregation Confusion",
                    "description": "Student confused the segregation of sister chromatids with that of homologous chromosome pairs in Meiosis I.",
                    "corrective_strategy": "Review the structural differences between bivalents/tetrads in Meiosis I vs individual chromosomes in Mitosis."
                })
                feedback = "Partial credit awarded. You recognized chromosome movement but did not differentiate homologous pairs from sister chromatids."
            else:
                score = 1.0
                missing = [
                    "Did not explain homologous chromosome segregation in Meiosis I",
                    "Did not mention ploidy reduction"
                ]
                misconceptions.append({
                    "category": "RECALL",
                    "title": "Incomplete Cell Division Mechanics Recall",
                    "description": "Missing foundational definitions of meiosis I vs mitosis.",
                    "corrective_strategy": "Re-read Chapter 4 on Meiotic stages and sketch the spindle fiber attachments."
                })
                feedback = "Answer lacks essential details regarding homologous chromosome segregation."

            return json.dumps({
                "score": score,
                "max_score": 5.0,
                "is_correct": score >= 4.0,
                "feedback": feedback,
                "understood_concepts": understood,
                "missing_concepts": missing,
                "incorrect_concepts": [],
                "misconceptions": misconceptions,
                "confidence": 0.95
            })

        # 4. AI Tutor / Explanation
        if "tutor" in prompt_lower or "explain" in prompt_lower:
            chunk_matches = re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', prompt)
            source_id = chunk_matches[0] if chunk_matches else "chunk_study_evidence"
            return (
                "Based on your uploaded course materials:\n\n"
                "**Meiosis** is a specialized two-stage division process. In **Meiosis I**, homologous chromosomes pair up and "
                "undergo crossing over during Prophase I, exchanging non-sister chromatid segments. Crucially, in Anaphase I, "
                "it is homologous chromosomes that separate, while sister chromatids remain tethered at their centromeres until Meiosis II.\n\n"
                "This contrasts with **Mitosis**, where sister chromatids separate directly, generating two genetically identical diploid cells."
            )

        # Fallback default JSON or text
        if json_mode:
            return json.dumps({"status": "success", "message": "Operation completed grounded in evidence"})
        return "Deterministic grounded academic response based on verified retrieval sources."
