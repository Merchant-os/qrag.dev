#!/usr/bin/env python3
"""
End-to-end test script for the Q# RAG Agent.
Tests all components: scraping, embedding, retrieval, and generation.
"""
import json
import sys

def test_corpus_exists():
    """Test that corpus/index.json exists and is valid."""
    print("Testing corpus/index.json...")
    with open("corpus/index.json") as f:
        examples = json.load(f)
    assert len(examples) > 0, "No examples in corpus"
    assert all("id" in ex for ex in examples), "Missing 'id' field"
    assert all("description" in ex for ex in examples), "Missing 'description' field"
    assert all("code" in ex for ex in examples), "Missing 'code' field"
    assert all("tags" in ex for ex in examples), "Missing 'tags' field"
    print(f"  ✓ Valid JSON with {len(examples)} examples")
    return examples

def test_vectors_exists():
    """Test that vector data is loadable (from vectors.npy or vectors.json)."""
    print("\nTesting vector data...")
    sys.path.insert(0, '.')
    from rag.retrieve import VECTORS
    assert VECTORS.size > 0, "Vectors are empty"
    vector_dim = VECTORS.shape[1] if VECTORS.ndim == 2 else 0
    assert vector_dim > 0, "Vectors are empty"
    print(f"  ✓ Loaded {VECTORS.shape[0]} vectors (dim={vector_dim})")
    return VECTORS

def test_retrieval():
    """Test retrieval functionality."""
    print("\nTesting retrieval...")
    sys.path.insert(0, '.')
    from rag.retrieve import retrieve

    results = retrieve("entanglement", top_k=3)
    assert len(results) == 3, "Retrieved wrong number of results"
    assert all("similarity" in r for r in results), "Missing similarity score"
    assert all("code" in r for r in results), "Missing code in results"
    print(f"  ✓ Retrieval works (top 3 results)")
    for r in results:
        print(f"    [{r['similarity']}] {r['id']}")
    return results

def _is_qsharp_code(result: str) -> bool:
    """Check if the result contains valid Q# code indicators."""
    lower = result.lower()
    return "operation" in lower or "namespace" in lower or "use" in lower

def test_rag_agent():
    """Test RAG agent."""
    print("\nTesting RAG agent...")
    sys.path.insert(0, '.')
    from agent.agent import generate

    result = generate("Create a simple quantum circuit", top_k=2)
    assert result is not None, "RAG agent returned None"
    assert len(result.strip()) > 0, "RAG agent returned empty string"
    assert _is_qsharp_code(result), "No Q# code in result"
    print("  ✓ RAG agent works")
    print(f"    Generated {len(result)} characters")
    return result

def test_baseline_agent():
    """Test baseline agent."""
    print("\nTesting baseline agent...")
    sys.path.insert(0, '.')
    from agent.baseline import generate

    result = generate("Create a simple quantum circuit")
    assert result is not None, "Baseline agent returned None"
    assert len(result.strip()) > 0, "Baseline agent returned empty string"
    assert _is_qsharp_code(result), "No Q# code in result"
    print("  ✓ Baseline agent works")
    print(f"    Generated {len(result)} characters")
    return result

def main():
    """Run all tests."""
    print("=" * 60)
    print("Q# RAG Agent - End-to-End Tests")
    print("=" * 60)

    try:
        examples = test_corpus_exists()
        vectors = test_vectors_exists()
        assert len(examples) <= len(vectors), "Mismatch between examples and vectors"
        results = test_retrieval()
        rag_output = test_rag_agent()
        baseline_output = test_baseline_agent()

        print("\n" + "=" * 60)
        print("All tests passed! ✓")
        print("=" * 60)
        print(f"\nSummary:")
        print(f"  - {len(examples)} examples in corpus")
        print(f"  - {len(vectors)} vectors loaded")
        print(f"  - Retrieval: Working")
        print(f"  - RAG Agent: Working")
        print(f"  - Baseline Agent: Working")

        print("\nNote: Set OPENAI_API_KEY to generate embeddings.")

        return 0

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
