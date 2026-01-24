#!/usr/bin/env python3
"""
Simple test script for Q# RAG Agent with GLM 4.7
Run this to test the system end-to-end
"""
import sys
sys.path.insert(0, '.')

def test_retrieval():
    """Test semantic retrieval."""
    from rag.retrieve import retrieve

    print("=" * 60)
    print("TEST 1: Semantic Retrieval")
    print("=" * 60)
    print()

    queries = [
        "Quantum entanglement",
        "Grover's search algorithm",
        "Quantum teleportation",
        "GHZ state",
    ]

    for query in queries:
        print(f"Query: {query}")
        results = retrieve(query, top_k=2)
        print(f"Found {len(results)} matches:")
        for i, r in enumerate(results, 1):
            print(f"  {i}. {r['id']} (similarity: {r['similarity']})")
        print()

def test_rag_agent():
    """Test RAG agent (with retrieval)."""
    from agent.agent import generate

    print("=" * 60)
    print("TEST 2: RAG Agent (GLM 4.7 with Retrieval)")
    print("=" * 60)
    print()

    task = "Create a Bell state between two qubits and measure both"
    print(f"Task: {task}")
    print()
    print("Generating with RAG (top_k=3)...")
    print()

    code = generate(task, top_k=3)
    print(code)
    print()

def test_baseline_agent():
    """Test baseline agent (no retrieval)."""
    from agent.baseline import generate

    print("=" * 60)
    print("TEST 3: Baseline Agent (GLM 4.7, No Retrieval)")
    print("=" * 60)
    print()

    task = "Create a Bell state between two qubits and measure both"
    print(f"Task: {task}")
    print()
    print("Generating without retrieval...")
    print()

    code = generate(task)
    print(code)
    print()

def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("   Q# RAG Agent - GLM 4.7 Test Suite")
    print("=" * 60)
    print()

    try:
        test_retrieval()
        test_rag_agent()
        test_baseline_agent()

        print("=" * 60)
        print("   All Tests Complete!")
        print("=" * 60)
        print()
        print("Note: If using mock mode, install dependencies:")
        print("  pip install -r requirements.txt")
        print()
        print("Then set your OpenAI API key:")
        print("  export OPENAI_API_KEY='your-key'")
        print()
        print("GLM 4.7 key is already embedded in the code.")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
