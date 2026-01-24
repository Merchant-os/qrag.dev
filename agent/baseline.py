"""
Baseline Agent for Q# code generation using GLM (ZhipuAI).
Uses GLM-4 WITHOUT retrieval (for comparison with RAG agent).
"""
from agent.glm_client import generate_with_glm
from agent.prompts import SYSTEM_PROMPT

def generate(task: str) -> str:
    """Generate Q# code WITHOUT retrieval (for baseline comparison)."""

    # Call GLM-4 with system prompt but NO examples
    messages = [
        {"role": "user", "content": f"Write Q# code for: {task}"}
    ]

    return generate_with_glm(messages, system_prompt=SYSTEM_PROMPT)

# Test it
if __name__ == "__main__":
    import sys
    sys.path.insert(0, '..')

    result = generate("Create a Bell state between two qubits")
    print(result)
