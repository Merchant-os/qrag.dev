"""
RAG Agent for Q# code generation using retrieved context.
"""
import os
import yaml

from agent.glm_client import generate_with_glm
from rag.retrieve import retrieve
from agent.prompts import SYSTEM_PROMPT

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.yaml")

def load_config() -> dict:
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)

def generate(task: str, top_k: int | None = None) -> str:
    """Generate Q# code for a task using RAG."""
    config = load_config()
    retrieval_cfg = config.get("retrieval", {})
    top_k_examples = top_k if top_k is not None else retrieval_cfg.get("top_k_examples", 5)
    top_k_docs = retrieval_cfg.get("top_k_docs", 3)

    examples = retrieve(task, top_k=top_k_examples, doc_k=top_k_docs)
    example_entries = [ex for ex in examples if ex.get("type") == "example"]
    doc_entries = [ex for ex in examples if ex.get("type") == "doc"]

    examples_text = "\n\n## Reference Examples\n\n"
    for ex in example_entries:
        examples_text += (
            f"### {ex['description']}\n"
            "BEGIN_EXAMPLE\n"
            f"{ex['code']}\n"
            "END_EXAMPLE\n\n"
        )

    docs_text = "\n\n## Reference Docs\n\n"
    for doc in doc_entries:
        docs_text += (
            f"### {doc['title']}\n"
            f"{doc['content']}\n\n"
        )

    full_system = SYSTEM_PROMPT + examples_text + docs_text

    messages = [
        {"role": "user", "content": f"Write Q# code for: {task}"}
    ]

    return generate_with_glm(messages, system_prompt=full_system)

# Test it
if __name__ == "__main__":
    import sys
    sys.path.insert(0, '..')

    result = generate("Create a Bell state between two qubits and return both measurement results")
    print(result)
