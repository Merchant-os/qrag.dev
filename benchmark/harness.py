#!/usr/bin/env python3
"""
Benchmark harness for Q# RAG vs baseline.
"""
import argparse
import json
import os
import subprocess
import time
import sys
from dataclasses import dataclass
from datetime import datetime
from typing import Any

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CONFIG_PATH = os.path.join(ROOT, "agent", "config.yaml")
TASKS_FILE = os.path.join(ROOT, "benchmark", "tasks.json")
TASKS_DIR = os.path.join(ROOT, "benchmark", "tasks")
RESULTS_DIR = os.path.join(ROOT, "benchmark", "results")

import yaml

if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from agent.agent import generate as generate_rag
from agent.baseline import generate as generate_baseline
from benchmark.scoring import score_qsharp


@dataclass
class AttemptResult:
    success: bool
    compile_ok: bool
    test_ok: bool
    error: str | None
    elapsed_sec: float


def load_config() -> dict:
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


def load_tasks() -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    if os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, "r") as f:
            tasks.extend(json.load(f))

    if os.path.isdir(TASKS_DIR):
        for name in sorted(os.listdir(TASKS_DIR)):
            if not name.endswith(".json"):
                continue
            with open(os.path.join(TASKS_DIR, name), "r") as f:
                tasks.extend(json.load(f))

    return tasks


def run_command(command: str, cwd: str, timeout: int) -> subprocess.CompletedProcess:
    return subprocess.run(
        command,
        cwd=cwd,
        shell=True,
        text=True,
        capture_output=True,
        timeout=timeout,
    )


def ensure_output_path(output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)


def write_generation(output_path: str, content: str) -> None:
    ensure_output_path(output_path)
    cleaned = extract_qsharp_code(content)
    with open(output_path, "w") as f:
        f.write(cleaned.rstrip() + "\n")


def extract_qsharp_code(content: str) -> str:
    if "```" not in content:
        return content
    lines = content.splitlines()
    in_block = False
    collected = []
    for line in lines:
        if line.strip().startswith("```"):
            if in_block:
                break
            in_block = True
            continue
        if in_block:
            collected.append(line)
    return "\n".join(collected) if collected else content


def clean_generated_dir() -> None:
    generated_dir = os.path.join(ROOT, "QsharpRagAgent", "Generated")
    if not os.path.isdir(generated_dir):
        return
    for name in os.listdir(generated_dir):
        if name in {".gitkeep", "Placeholder.qs"}:
            continue
        path = os.path.join(generated_dir, name)
        if os.path.isfile(path):
            os.remove(path)


def write_generated_tests(tasks: list[dict[str, Any]]) -> None:
    tests_path = os.path.join(ROOT, "QsharpRagAgent.Tests", "GeneratedTests.cs")
    seen = set()
    operations = []
    for task in tasks:
        operation = task.get("operation_name")
        if not operation or operation in seen:
            continue
        operations.append(operation)
        seen.add(operation)

    lines = [
        "using Microsoft.Quantum.Simulation.Core;",
        "using Microsoft.Quantum.Simulation.Simulators;",
        "using Xunit;",
        "",
        "public class GeneratedTests",
        "{",
    ]

    for operation in operations:
        lines.extend([
            "    [Fact]",
            f"    public async System.Threading.Tasks.Task {operation}()",
            "    {",
            "        using var sim = new QuantumSimulator();",
            f"        await Generated.{operation}.Run(sim);",
            "    }",
            "",
        ])

    if lines[-1] == "":
        lines.pop()
    lines.append("}")
    lines.append("")

    with open(tests_path, "w") as f:
        f.write("\n".join(lines))


def has_dotnet() -> bool:
    try:
        subprocess.run(
            "dotnet --version",
            shell=True,
            text=True,
            capture_output=True,
            timeout=10,
            check=True,
        )
        return True
    except Exception:
        return False


def run_attempt(task: dict[str, Any], use_rag: bool, config: dict) -> AttemptResult:
    start = time.time()
    compile_ok = False
    test_ok = False
    error = None

    clean_generated_dir()

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
    output_path = task.get("output_path")
    project_dir = task.get("project_dir", ROOT)

    strict_suffix = (
        "\n\nSTRICT COMPILATION MODE:\n"
        "- Provide the simplest possible valid implementation.\n"
        "- Use only H, X, Z, CNOT, M, MResetZ, Reset, ResetAll, and basic loops.\n"
        "- Do not use functor specializations or custom attributes.\n"
        "- Define any helper operations explicitly.\n"
        "- Output only Q# code in a single namespace.\n"
    )

    try:
        if use_rag:
            result = generate_rag(prompt)
        else:
            result = generate_baseline(prompt)

        if output_path:
            write_generation(os.path.join(ROOT, output_path), result)

        write_generated_tests([task])

        if not has_dotnet():
            score = score_qsharp(result)
            compile_ok = score["score"] >= 3
            test_ok = score["score"] >= 4
            return AttemptResult(test_ok, compile_ok, test_ok, error, time.time() - start)

        build_cmd = task.get("build_command") or config["benchmark"]["build_command"]
        test_cmd = task.get("test_command") or config["benchmark"]["run_command"]
        build_timeout = int(config["benchmark"]["build_timeout_sec"])
        test_timeout = int(config["benchmark"]["test_timeout_sec"])

        build_result = run_command(build_cmd, cwd=project_dir, timeout=build_timeout)
        compile_ok = build_result.returncode == 0
        if not compile_ok and use_rag:
            retry_prompt = prompt + strict_suffix
            result = generate_rag(retry_prompt)
            if output_path:
                write_generation(os.path.join(ROOT, output_path), result)
            write_generated_tests([task])
            build_result = run_command(build_cmd, cwd=project_dir, timeout=build_timeout)
            compile_ok = build_result.returncode == 0
        if not compile_ok:
            error = build_result.stderr.strip() or build_result.stdout.strip()
            return AttemptResult(False, compile_ok, False, error, time.time() - start)

        if test_cmd:
            test_result = run_command(test_cmd, cwd=project_dir, timeout=test_timeout)
            test_ok = test_result.returncode == 0
            if not test_ok:
                error = test_result.stderr.strip() or test_result.stdout.strip()

        return AttemptResult(test_ok, compile_ok, test_ok, error, time.time() - start)

    except Exception as exc:
        error = str(exc)
        return AttemptResult(False, compile_ok, test_ok, error, time.time() - start)


def evaluate(tasks: list[dict[str, Any]], use_rag: bool, attempts: int = 3) -> dict[str, Any]:
    config = load_config()
    summary = {
        "pass@1": 0,
        "pass@3": 0,
        "compile@1": 0,
        "n_tasks": len(tasks),
        "tasks": [],
    }

    label = "RAG" if use_rag else "Baseline"
    for idx, task in enumerate(tasks, 1):
        print(f"[{label}] Task {idx}/{len(tasks)}: {task.get('id')}")
        task_results = []
        for _ in range(attempts):
            task_results.append(run_attempt(task, use_rag, config))

        pass_at_1 = task_results[0].test_ok
        compile_at_1 = task_results[0].compile_ok
        pass_at_3 = any(res.test_ok for res in task_results)

        summary["pass@1"] += 1 if pass_at_1 else 0
        summary["pass@3"] += 1 if pass_at_3 else 0
        summary["compile@1"] += 1 if compile_at_1 else 0

        summary["tasks"].append({
            "id": task.get("id"),
            "pass@1": pass_at_1,
            "pass@3": pass_at_3,
            "compile@1": compile_at_1,
            "attempts": [
                {
                    "success": res.success,
                    "compile_ok": res.compile_ok,
                    "test_ok": res.test_ok,
                    "error": res.error,
                    "elapsed_sec": res.elapsed_sec,
                }
                for res in task_results
            ],
        })

    if summary["n_tasks"]:
        summary["pass@1"] /= summary["n_tasks"]
        summary["pass@3"] /= summary["n_tasks"]
        summary["compile@1"] /= summary["n_tasks"]

    return summary


def merge_reports(existing: dict[str, Any], new: dict[str, Any], ordered_ids: list[str]) -> dict[str, Any]:
    merged = {"baseline": {}, "rag": {}, "delta": {}}

    for key in ("baseline", "rag"):
        existing_tasks = {task["id"]: task for task in existing.get(key, {}).get("tasks", [])}
        new_tasks = {task["id"]: task for task in new.get(key, {}).get("tasks", [])}
        existing_tasks.update(new_tasks)

        tasks = [existing_tasks[task_id] for task_id in ordered_ids if task_id in existing_tasks]
        n_tasks = len(tasks)
        pass_at_1 = sum(1 for task in tasks if task.get("pass@1"))
        pass_at_3 = sum(1 for task in tasks if task.get("pass@3"))
        compile_at_1 = sum(1 for task in tasks if task.get("compile@1"))

        merged[key] = {
            "pass@1": pass_at_1 / n_tasks if n_tasks else 0.0,
            "pass@3": pass_at_3 / n_tasks if n_tasks else 0.0,
            "compile@1": compile_at_1 / n_tasks if n_tasks else 0.0,
            "n_tasks": n_tasks,
            "tasks": tasks,
        }

    merged["delta"] = {
        "pass@1": merged["rag"]["pass@1"] - merged["baseline"]["pass@1"],
        "pass@3": merged["rag"]["pass@3"] - merged["baseline"]["pass@3"],
        "compile@1": merged["rag"]["compile@1"] - merged["baseline"]["compile@1"],
    }

    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Run benchmark harness")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of tasks")
    parser.add_argument("--start", type=int, default=0, help="Start index (1-based)")
    parser.add_argument("--end", type=int, default=0, help="End index (1-based, inclusive)")
    parser.add_argument("--append-report", action="store_true", help="Append results into report_latest.json")
    parser.add_argument("--attempts", type=int, default=3, help="Attempts per task")
    args = parser.parse_args()

    os.makedirs(RESULTS_DIR, exist_ok=True)
    tasks = load_tasks()
    if not tasks:
        raise RuntimeError("No benchmark tasks found. Populate benchmark/tasks.json or benchmark/tasks/*.json")

    if args.limit and args.limit > 0:
        tasks = tasks[: args.limit]

    if args.start or args.end:
        start_idx = max(args.start - 1, 0) if args.start else 0
        end_idx = args.end if args.end else len(tasks)
        tasks = tasks[start_idx:end_idx]

    clean_generated_dir()
    rag_results = evaluate(tasks, use_rag=True, attempts=args.attempts)
    baseline_results = evaluate(tasks, use_rag=False, attempts=args.attempts)

    report = {
        "baseline": baseline_results,
        "rag": rag_results,
        "delta": {
            "pass@1": rag_results["pass@1"] - baseline_results["pass@1"],
            "pass@3": rag_results["pass@3"] - baseline_results["pass@3"],
            "compile@1": rag_results["compile@1"] - baseline_results["compile@1"],
        },
    }

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    output_path = os.path.join(RESULTS_DIR, f"report_{timestamp}.json")
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)

    latest_path = os.path.join(RESULTS_DIR, "report_latest.json")
    if args.append_report and os.path.exists(latest_path):
        with open(latest_path, "r") as f:
            existing_report = json.load(f)
        ordered_ids = [task["id"] for task in load_tasks() if task.get("id")]
        report = merge_reports(existing_report, report, ordered_ids)

    with open(latest_path, "w") as f:
        json.dump(report, f, indent=2)

    print(json.dumps({
        "baseline": baseline_results,
        "rag": rag_results,
        "delta": report["delta"],
    }, indent=2))
    print(f"Saved report to {output_path}")


if __name__ == "__main__":
    main()
