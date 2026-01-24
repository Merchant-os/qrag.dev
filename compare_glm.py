#!/usr/bin/env python3
"""
Side-by-side comparison of RAG vs baseline using GLM.
"""
import sys

sys.path.insert(0, ".")

from agent.agent import generate as generate_rag
from agent.baseline import generate as generate_baseline


TASKS = [
    "Create a Bell state between two qubits and measure both",
    "Implement Grover's search for 4 items",
    "Show a simple quantum teleportation circuit",
]


def main() -> None:
    print("=" * 72)
    print("GLM Comparison: RAG vs Baseline")
    print("=" * 72)

    for i, task in enumerate(TASKS, 1):
        print(f"\nTask {i}: {task}")
        print("-" * 72)

        rag_output = generate_rag(task, top_k=3)
        baseline_output = generate_baseline(task)

        print("[RAG]\n")
        print(rag_output)
        print("\n" + "-" * 72)
        print("[Baseline]\n")
        print(baseline_output)
        print("\n" + "=" * 72)


if __name__ == "__main__":
    main()
