import io
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Tuple
import pdfplumber

class DocumentParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Parses a PDF using pdfplumber, extracting per-page text and headers.
        Returns (pages_data, ocr_needed_flag).
        """
        pages = []
        low_text_pages = 0
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for idx, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                # Basic cleaning
                page_text = re.sub(r"\r\n|\r", "\n", page_text).strip()
                if len(page_text.split()) < 10:
                    low_text_pages += 1
                pages.append({
                    "page_number": idx + 1,
                    "text": page_text,
                })
        
        ocr_needed = (len(pages) > 0 and (low_text_pages / len(pages)) > 0.5)
        return pages, ocr_needed

    @staticmethod
    def parse_docx(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], bool]:
        """
        Parses a DOCX file using python standard library zipfile and XML parsing.
        """
        pages = []
        full_text_paragraphs = []
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx_zip:
            if "word/document.xml" not in docx_zip.namelist():
                raise ValueError("Invalid DOCX format: missing word/document.xml")
            xml_content = docx_zip.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            
            # XML namespace for WordML
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            
            for p in tree.iterfind(".//w:p", ns):
                texts = [node.text for node in p.iterfind(".//w:t", ns) if node.text]
                if texts:
                    full_text_paragraphs.append("".join(texts))
        
        # Paginate roughly every 500 words if pages aren't delimited
        current_page = []
        page_num = 1
        current_words = 0
        for p in full_text_paragraphs:
            words = len(p.split())
            current_page.append(p)
            current_words += words
            if current_words >= 450:
                pages.append({"page_number": page_num, "text": "\n".join(current_page)})
                current_page = []
                current_words = 0
                page_num += 1
        
        if current_page or not pages:
            pages.append({"page_number": page_num, "text": "\n".join(current_page)})
            
        return pages, False

    @staticmethod
    def parse_txt(file_bytes: bytes) -> Tuple[List[Dict[str, Any]], bool]:
        """Parses plain text with UTF-8 decoding and chunked pseudo-pages."""
        text = file_bytes.decode("utf-8", errors="replace")
        paragraphs = text.split("\n\n")
        pages = []
        current_page = []
        page_num = 1
        current_words = 0
        for p in paragraphs:
            p_strip = p.strip()
            if not p_strip:
                continue
            words = len(p_strip.split())
            current_page.append(p_strip)
            current_words += words
            if current_words >= 400:
                pages.append({"page_number": page_num, "text": "\n\n".join(current_page)})
                current_page = []
                current_words = 0
                page_num += 1
        if current_page or not pages:
            pages.append({"page_number": page_num, "text": "\n\n".join(current_page)})
        return pages, False
