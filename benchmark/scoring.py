"""
Lightweight Q# scoring heuristics when dotnet tests are unavailable.
"""
import re


def score_qsharp(source: str) -> dict:
    normalized = source.lower()
    has_operation = "operation" in normalized
    uses_std = "std." in normalized
    has_use = re.search(r"\buse\b\s+", normalized) is not None
    has_reset = "reset(" in normalized or "mreset" in normalized
    has_qsharp_block = "```qsharp" in normalized

    score = 0
    score += 1 if has_operation else 0
    score += 1 if uses_std else 0
    score += 1 if has_use else 0
    score += 1 if has_reset else 0
    score += 1 if has_qsharp_block else 0

    return {
        "score": score,
        "has_operation": has_operation,
        "uses_std": uses_std,
        "has_use": has_use,
        "has_reset": has_reset,
        "has_qsharp_block": has_qsharp_block,
    }
