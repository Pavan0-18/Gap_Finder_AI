import re
import hashlib
from typing import List, Dict, Any

class SemanticChunker:
    def __init__(self, target_tokens: int = 600, overlap_tokens: int = 100):
        self.target_tokens = target_tokens
        self.overlap_tokens = overlap_tokens

    @staticmethod
    def _detect_heading(line: str) -> bool:
        line_s = line.strip()
        if not line_s or len(line_s) > 100:
            return False
        # Matches "Chapter 1", "Unit 2", "Section 3.1", or ALL CAPS headings
        if re.match(r"^(Chapter|Unit|Section|Topic|Part)\s+[\dA-Za-z\.:]+", line_s, re.IGNORECASE):
            return True
        if line_s.isupper() and len(line_s.split()) <= 8:
            return True
        return False

    def chunk_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks = []
        current_words: List[str] = []
        current_page = 1
        current_chapter = None
        current_section = None
        chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            text = page["text"]
            lines = text.split("\n")

            for line in lines:
                if self._detect_heading(line):
                    line_s = line.strip()
                    if re.match(r"^(Chapter|Unit)\b", line_s, re.IGNORECASE):
                        current_chapter = line_s
                    else:
                        current_section = line_s

                words = line.split()
                current_words.extend(words)

                # Check if current chunk has reached target token size
                if len(current_words) >= self.target_tokens:
                    content_str = " ".join(current_words)
                    c_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "content": content_str,
                        "page_number": current_page,
                        "chapter": current_chapter,
                        "section": current_section,
                        "token_count": len(current_words),
                        "content_hash": c_hash,
                    })
                    chunk_idx += 1
                    # Retain overlap
                    current_words = current_words[-self.overlap_tokens:]
                    current_page = page_num

        # Residual words
        if current_words:
            content_str = " ".join(current_words)
            c_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()
            chunks.append({
                "chunk_index": chunk_idx,
                "content": content_str,
                "page_number": current_page,
                "chapter": current_chapter,
                "section": current_section,
                "token_count": len(current_words),
                "content_hash": c_hash,
            })

        return chunks
