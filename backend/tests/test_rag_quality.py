import pytest
from app.models.all_models import DocumentChunk, Material, Subject, User
from app.ai.retrieval.service import RetrievalService
from app.ai.providers.deterministic import DeterministicEmbeddingProvider

def test_dense_vector_retrieval_and_filtering(db):
    user = User(email="rag_user@test.com", hashed_password="pwd", full_name="RAG User")
    db.add(user)
    db.commit()

    subj_a = Subject(user_id=user.id, name="Physics")
    subj_b = Subject(user_id=user.id, name="History")
    db.add_all([subj_a, subj_b])
    db.commit()

    mat_a = Material(
        subject_id=subj_a.id,
        title="Electromagnetism Notes",
        material_type="TEXTBOOK",
        file_path="/tmp/em.txt",
        content_hash="h1",
        mime_type="text/plain",
    )
    mat_b = Material(
        subject_id=subj_b.id,
        title="Ancient Rome",
        material_type="TEXTBOOK",
        file_path="/tmp/rome.txt",
        content_hash="h2",
        mime_type="text/plain",
    )
    db.add_all([mat_a, mat_b])
    db.commit()

    embedder = DeterministicEmbeddingProvider(dimension=1536)

    text_physics = "Faraday's law describes electromagnetic induction and magnetic flux."
    text_history = "Julius Caesar crossed the Rubicon River in 49 BC."

    emb_physics = embedder.generate_embeddings([text_physics])[0]
    emb_history = embedder.generate_embeddings([text_history])[0]

    chunk_a = DocumentChunk(
        material_id=mat_a.id,
        subject_id=subj_a.id,
        chunk_index=0,
        content=text_physics,
        page_number=1,
        token_count=10,
        embedding=emb_physics,
        content_hash="h1_c0",
    )
    chunk_b = DocumentChunk(
        material_id=mat_b.id,
        subject_id=subj_b.id,
        chunk_index=0,
        content=text_history,
        page_number=1,
        token_count=9,
        embedding=emb_history,
        content_hash="h2_c0",
    )
    db.add_all([chunk_a, chunk_b])
    db.commit()

    retriever = RetrievalService(db, embedding_provider=embedder)

    # Search Physics subject with physics query
    results_a = retriever.retrieve_chunks(
        subject_id=subj_a.id,
        query="magnetic induction and Faraday flux",
        top_k=5,
        min_similarity=0.1
    )
    assert len(results_a) == 1
    assert results_a[0]["chunk_id"] == chunk_a.id
    assert results_a[0]["similarity"] > 0.4

    # Crucial security test: Searching Physics subject must NEVER return chunks from History
    assert all(r["chunk_id"] != chunk_b.id for r in results_a)
