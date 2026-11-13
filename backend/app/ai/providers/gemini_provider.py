import os
import json
from typing import List, Optional
import httpx
from app.ai.providers.base import BaseLLMProvider, BaseEmbeddingProvider

class GeminiLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False,
        temperature: float = 0.2,
    ) -> str:
        headers = {"Content-Type": "application/json"}
        params = {"key": self.api_key}

        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        body = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json" if json_mode else "text/plain",
            },
        }

        with httpx.Client(timeout=60.0) as client:
            resp = client.post(self.base_url, headers=headers, params=params, json=body)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return ""

class GeminiEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, api_key: str, model_name: str = "text-embedding-004"):
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:batchEmbedContents"

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        headers = {"Content-Type": "application/json"}
        params = {"key": self.api_key}

        requests = []
        for t in texts:
            requests.append({
                "model": f"models/{self.model_name}",
                "content": {"parts": [{"text": t[:2048]}]},
            })

        body = {"requests": requests}
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(self.base_url, headers=headers, params=params, json=body)
            resp.raise_for_status()
            data = resp.json()
            embeddings = []
            for item in data.get("embeddings", []):
                embeddings.append(item.get("values", []))
            return embeddings
