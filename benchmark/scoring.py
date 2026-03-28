"""
Lightweight Q# scoring heuristics when dotnet tests are unavailable.
"""
import re


def score_qsharp(source: str) -> dict:
    normalized = source.lower()
    has_operation = "operation" in normalized
    has_namespace = "microsoft.quantum." in normalized or "namespace" in normalized
    has_use = re.search(r"\buse\b\s+", normalized) is not None
    has_reset = "reset(" in normalized or "mreset" in normalized
    has_open_or_import = "open microsoft.quantum" in normalized or "import" in normalized

    score = 0
    score += 1 if has_operation else 0
    score += 1 if has_namespace else 0
    score += 1 if has_use else 0
    score += 1 if has_reset else 0
    score += 1 if has_open_or_import else 0

    return {
        "score": score,
        "has_operation": has_operation,
        "has_namespace": has_namespace,
        "has_use": has_use,
        "has_reset": has_reset,
        "has_open_or_import": has_open_or_import,
    }
