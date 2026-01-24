#!/usr/bin/env python3
"""
Q# RAG Agent - Interactive Demo
Demonstrates GLM-4.7 integration with RAG pipeline
"""
import sys
sys.path.insert(0, '.')

def main():
    print("=" * 70)
    print(" Q# RAG Agent with GLM-4.7 - Interactive Demo")
    print("=" * 70)
    print()

    print("This demo uses:")
    print("  • GLM-4.7 (ZhipuAI) for code generation")
    print("  • OpenAI embeddings for semantic search")
    print("  • 40 curated Q# examples from Microsoft QDK")
    print()

    # Import agents
    from agent.agent import generate as generate_rag
    from agent.baseline import generate as generate_baseline
    from rag.retrieve import retrieve

    # Demo queries
    queries = [
        "Create a Bell state between two qubits",
        "Implement Grover's search algorithm",
        "Create a GHZ entangled state",
        "Implement quantum teleportation",
    ]

    print("Running demonstrations...")
    print("-" * 70)
    print()

    for i, query in enumerate(queries, 1):
        print(f"Demo {i}/{len(queries)}: {query}")
        print()

        # Show retrieval
        print("  [Retrieving relevant examples...]")
        results = retrieve(query, top_k=2)
        for j, r in enumerate(results, 1):
            print(f"    {j}. {r['id']} (similarity: {r['similarity']})")
        print()

        # Generate with RAG
        print("  [Generating code with RAG (GLM-4.7)...) ]")
        rag_code = generate_rag(query, top_k=2)
        print()

        # Show first few lines
        lines = rag_code.split('\n')
        code_lines = [l for l in lines if l.strip() and not l.strip().startswith('//')]
        if code_lines:
            print("  Generated code (first 5 lines):")
            for line in code_lines[:5]:
                print(f"    {line}")
            if len(code_lines) > 5:
                print(f"    ... ({len(code_lines) - 5} more lines)")
        print()

        # Compare with baseline
        print("  [Generating code with Baseline (no retrieval)...) ]")
        baseline_code = generate_baseline(query)

        # Count differences (very simple metric)
        rag_lines = set(l.strip() for l in rag_code.split('\n') if l.strip() and not l.strip().startswith('//'))
        baseline_lines = set(l.strip() for l in baseline_code.split('\n') if l.strip() and not l.strip().startswith('//'))
        intersection = len(rag_lines & baseline_lines)
        total = len(rag_lines) + len(baseline_lines) - intersection

        if total > 0:
            similarity = (intersection / total) * 100
            print(f"  RAG vs Baseline similarity: {similarity:.1f}%")
        else:
            print("  RAG vs Baseline: Could not compare")

        print()
        print("-" * 70)
        print()

    print("=" * 70)
    print(" Demo Complete!")
    print("=" * 70)
    print()
    print("To use this system:")
    print("  1. Install dependencies: bash setup.sh")
    print("  2. Set API keys (optional - GLM key is embedded)")
    print("  3. Use in your code:")
    print()
    print("      from agent.agent import generate")
    print("      code = generate('Your task', top_k=5)")
    print()

if __name__ == "__main__":
    main()
