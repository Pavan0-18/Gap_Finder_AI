from app.core.config import settings
from app.ai.providers.base import BaseLLMProvider, BaseEmbeddingProvider
from app.ai.providers.deterministic import DeterministicLLMProvider, DeterministicEmbeddingProvider
from app.ai.providers.gemini_provider import GeminiLLMProvider, GeminiEmbeddingProvider
from app.ai.providers.openai_provider import OpenAILLMProvider, OpenAIEmbeddingProvider

def get_llm_provider() -> BaseLLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMProvider(api_key=settings.GEMINI_API_KEY, model_name=settings.LLM_MODEL)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAILLMProvider(api_key=settings.OPENAI_API_KEY, model_name=settings.LLM_MODEL)
    return DeterministicLLMProvider(model_name=settings.LLM_MODEL)

def get_embedding_provider() -> BaseEmbeddingProvider:
    provider = settings.EMBEDDING_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiEmbeddingProvider(api_key=settings.GEMINI_API_KEY, model_name=settings.EMBEDDING_MODEL)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIEmbeddingProvider(api_key=settings.OPENAI_API_KEY, model_name=settings.EMBEDDING_MODEL)
    return DeterministicEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
