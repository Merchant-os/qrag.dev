import json
import os
import sys
import hashlib
import math

import numpy as np

# Ensure project root is on sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

USE_OPENAI = OpenAI is not None

OPENAI_EMBED_MODEL = os.environ.get("OPENAI_EMBED_MODEL", "text-embedding-3-small")

def create_openai_client():
    if not USE_OPENAI:
        raise RuntimeError("openai package not installed. Run: pip install openai>=1.0.0")
    if OpenAI is None:
        raise RuntimeError("openai package not installed. Run: pip install openai>=1.0.0")
    return OpenAI()

_RAG_DIR = os.path.dirname(__file__)
_NPY_PATH = os.path.join(_RAG_DIR, "vectors.npy")
_META_PATH = os.path.join(_RAG_DIR, "metadata.json")
_JSON_PATH = os.path.join(_RAG_DIR, "vectors.json")


def _bootstrap_from_vectors_json():
    """Generate vectors.npy and metadata.json from the portable vectors.json."""
    with open(_JSON_PATH) as f:
        data = json.load(f)
    vectors = []
    metadata = []
    for entry in data:
        vectors.append(entry["vector"])
        meta = {k: v for k, v in entry.items() if k != "vector"}
        meta.setdefault("type", "example")
        metadata.append(meta)
    vectors_np = np.array(vectors, dtype=np.float32)
    np.save(_NPY_PATH, vectors_np)
    with open(_META_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    return vectors_np, metadata


def _load_vectors():
    if os.path.exists(_NPY_PATH) and os.path.exists(_META_PATH):
        vectors = np.load(_NPY_PATH)
        with open(_META_PATH) as f:
            metadata = json.load(f)
        return vectors, metadata
    if os.path.exists(_JSON_PATH):
        return _bootstrap_from_vectors_json()
    raise FileNotFoundError(
        "No vector data found. Run 'python rag/embed.py' to generate embeddings."
    )


VECTORS, METADATA = _load_vectors()

def embed_query(query: str) -> list[float]:
    """Generate embedding for a query using OpenAI."""
    client = create_openai_client()
    response = client.embeddings.create(
        model=OPENAI_EMBED_MODEL,
        input=query,
    )
    return response.data[0].embedding

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def retrieve(query: str, top_k: int = 5, doc_k: int = 3) -> list[dict]:
    """Find the most similar examples and docs to the query."""
    query_vector = embed_query(query)

    scored = []
    for idx, item in enumerate(METADATA):
        sim = cosine_similarity(query_vector, VECTORS[idx])
        scored.append((sim, item))

    scored.sort(reverse=True, key=lambda x: x[0])

    examples = []
    docs = []
    for sim, item in scored:
        entry = dict(item)
        entry["similarity"] = round(sim, 4)
        if entry.get("type") == "doc" and len(docs) < doc_k:
            docs.append(entry)
        elif entry.get("type") == "example" and len(examples) < top_k:
            examples.append(entry)
        if len(docs) >= doc_k and len(examples) >= top_k:
            break

    return examples + docs

# Test it
if __name__ == "__main__":
    results = retrieve("How do I create entanglement between qubits?")
    print("Top matches:")
    for r in results:
        print(f"  [{r['similarity']}] {r['id']}: {r['description'][:60]}...")
