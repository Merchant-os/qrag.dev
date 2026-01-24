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
OPENAI_EMBED_FALLBACK = os.environ.get("OPENAI_EMBED_FALLBACK", "mock")

def mock_embedding(text: str, dim: int = 1536) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    vector = [0.0] * dim
    for i in range(dim):
        byte = digest[i % len(digest)]
        vector[i] = (byte / 255.0) * 2 - 1
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector

def create_openai_client():
    if not USE_OPENAI:
        raise RuntimeError("openai package not installed. Run: pip install openai>=1.0.0")
    if OpenAI is None:
        raise RuntimeError("openai package not installed. Run: pip install openai>=1.0.0")
    return OpenAI()

def generate_embedding_with_openai(text: str) -> list[float]:
    client = create_openai_client()
    try:
        response = client.embeddings.create(
            model=OPENAI_EMBED_MODEL,
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        error_text = str(e)
        if "insufficient_quota" in error_text or "429" in error_text:
            if OPENAI_EMBED_FALLBACK.lower() == "mock":
                print("OpenAI quota unavailable; using mock embeddings.")
                return mock_embedding(text)
        raise

def main():
    with open("corpus/index.json") as f:
        examples = json.load(f)

    docs_path = os.path.join("corpus", "docs", "index.json")
    docs = []
    if os.path.exists(docs_path):
        with open(docs_path) as f:
            docs = json.load(f)

    total_items = len(examples) + len(docs)
    print(f"Embedding {total_items} chunks with OpenAI...")
    print(f"Model: {OPENAI_EMBED_MODEL}")

    embeddings = []
    metadata = []

    for i, ex in enumerate(examples):
        embed_text = f"{ex['description']} {' '.join(ex['tags'])}"
        vector = generate_embedding_with_openai(embed_text)
        embeddings.append(vector)
        metadata.append({
            "type": "example",
            "id": ex["id"],
            "description": ex["description"],
            "code": ex["code"],
            "tags": ex["tags"],
            "source": ex.get("source", ""),
        })
        print(f"  [{i+1}/{total_items}] {ex['id']}")

    for j, doc in enumerate(docs):
        embed_text = doc["content"]
        vector = generate_embedding_with_openai(embed_text)
        embeddings.append(vector)
        metadata.append({
            "type": "doc",
            "id": doc["id"],
            "title": doc["title"],
            "content": doc["content"],
            "source": doc.get("source", ""),
        })
        print(f"  [{len(examples)+j+1}/{total_items}] {doc['id']}")

    vectors = np.array(embeddings, dtype=np.float32)
    np.save("rag/vectors.npy", vectors)
    with open("rag/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("Done! Saved to rag/vectors.npy and rag/metadata.json")
    if vectors.size:
        print(f"Vector dimensions: {vectors.shape[1]}")
    print("\nReady to use with OpenAI generation!")

if __name__ == "__main__":
    main()
