#!/usr/bin/env python3
"""
Preview 3-5 tasks with side-by-side outputs and heuristic scores.
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TASKS_FILE = os.path.join(ROOT, "benchmark", "tasks.json")

if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from agent.agent import generate as generate_rag
from agent.baseline import generate as generate_baseline


def load_tasks() -> list[dict]:
    with open(TASKS_FILE, "r") as f:
        return json.load(f)


def load_report() -> dict | None:
    report_path = os.path.join(ROOT, "benchmark", "results", "report_latest.json")
    if not os.path.exists(report_path):
        return None
    with open(report_path, "r") as f:
        return json.load(f)


def build_result_lookup(report: dict | None) -> dict:
    if not report:
        return {}
    lookup: dict[str, dict[str, dict]] = {"rag": {}, "baseline": {}}
    for key in ("rag", "baseline"):
        tasks = report.get(key, {}).get("tasks", [])
        lookup[key] = {task.get("id"): task for task in tasks if task.get("id")}
    return lookup


def main() -> None:
    tasks = load_tasks()  # All tasks
    report = load_report()
    result_lookup = build_result_lookup(report)
    results = []
    print("=" * 72)
    print("RAG vs Baseline Preview")
    print("=" * 72)

    for i, task in enumerate(tasks, 1):
        print(f"\nTask {i}: {task['description']}")
        print("-" * 72)

        prompt = task["description"]
        operation_name = task.get("operation_name")
        if operation_name:
            prompt = (
                f"{prompt}\n\n"
                "Requirements:\n"
                "- Use namespace Generated\n"
                f"- Define operation {operation_name}() : Unit\n"
                "- Ensure all qubits are reset before release\n"
                "- Use Microsoft.Quantum.* namespaces\n"
                "- Output only Q# source code, no markdown fences\n"
            )

        rag_output = generate_rag(prompt, top_k=5)
        baseline_output = generate_baseline(prompt)

        task_id = task.get("id")
        rag_result = result_lookup.get("rag", {}).get(task_id)
        baseline_result = result_lookup.get("baseline", {}).get(task_id)

        print("[RAG]\n")
        print(rag_output)
        if rag_result is not None:
            print(f"\nRAG pass@1: {rag_result.get('pass@1')}")

        print("\n" + "-" * 72)
        print("[Baseline]\n")
        print(baseline_output)
        if baseline_result is not None:
            print(f"\nBaseline pass@1: {baseline_result.get('pass@1')}")
        print("\n" + "=" * 72)

        results.append({
            "id": task_id,
            "description": task.get("description"),
            "rag_output": rag_output,
            "baseline_output": baseline_output,
            "rag_result": rag_result,
            "baseline_result": baseline_result,
        })

    results_dir = os.path.join(ROOT, "benchmark", "results")
    os.makedirs(results_dir, exist_ok=True)
    output_path = os.path.join(results_dir, "preview_latest.json")
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Preview saved to {output_path}")


if __name__ == "__main__":
    main()
