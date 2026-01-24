# How to Use and Test Q# RAG Agent with GLM 4.7

## Overview

Your Q# RAG Agent is now configured with:
- **Main Agent**: GLM-4.7 (ZhipuAI)
- **API Key**: `9410fc5e242948aabc088709c826d9c4.vRNJuidhjrsOMgjB`
- **Embeddings**: OpenAI `text-embedding-3-small` (1536-dim vectors)
- **Corpus**: 40 curated Q# examples

---

## Quick Start (3 Steps)

### Step 1: Test with Mock Mode (No Installation Required)

The system already works in mock mode. Test it now:

```bash
cd qsharp-rag-agent

# Run complete test suite
python3 test_glm.py
```

**Expected Output**:
```
============================================================
   Q# RAG Agent - GLM 4.7 Test Suite
============================================================

TEST 1: Semantic Retrieval
Query: Quantum entanglement
Found 2 matches: ... (works!)

TEST 2: RAG Agent (GLM 4.7 with Retrieval)
Task: Create a Bell state...
(works!)

TEST 3: Baseline Agent (GLM 4.7, No Retrieval)
(works!)

All Tests Complete!
```

---

### Step 2: Install Dependencies (For Production Use)

Option A: Use setup script (recommended)
```bash
# Linux/macOS
bash setup.sh

# Windows
setup.bat
```

Option B: Manual installation
```bash
pip install -r requirements.txt
```

**Dependencies to install**:
- `openai>=1.0.0` - For embeddings
- `zhipuai>=2.0.0` - For GLM-4.7 API
- `numpy>=1.24.0` - For vector operations

---

### Step 3: Set API Key (Required for Real Embeddings)

Set your OpenAI API key:
```bash
# Linux/macOS
export OPENAI_API_KEY="your-openai-api-key"

# Windows
set OPENAI_API_KEY=your-openai-api-key
```

**Note**: GLM 4.7 key is already embedded in the code. You don't need to set it unless you want to override it.

---

## Usage Examples

### Example 1: Generate Q# Code with RAG

Create a file `my_test.py`:

```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from agent.agent import generate

# Generate code with 5 retrieved examples
task = "Create a Bell state between two qubits"
code = generate(task, top_k=5)

print("Generated Code:")
print(code)
```

Run it:
```bash
python3 my_test.py
```

### Example 2: Generate Code Without Retrieval (Baseline)

```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from agent.baseline import generate

# Generate code without retrieval
task = "Create a GHZ state with 3 qubits"
code = generate(task)

print("Generated Code:")
print(code)
```

### Example 3: Direct Retrieval

```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from rag.retrieve import retrieve

# Find similar examples
query = "Quantum teleportation protocol"
results = retrieve(query, top_k=3)

print(f"Query: {query}")
print(f"Found {len(results)} matches:")
for i, r in enumerate(results, 1):
    print(f"{i}. [{r['similarity']}] {r['id']}")
    print(f"   {r['description'][:80]}...")
```

### Example 4: Interactive Python Session

```python
$ python3
>>> import sys
>>> sys.path.insert(0, '.')
>>> from agent.agent import generate
>>> code = generate("Implement Grover's search for 4 items", top_k=3)
>>> print(code)
[Output with Q# code...]
```

---

## Testing Guide

### Test 1: Run Built-in Test Suite

```bash
cd qsharp-rag-agent
python3 test_end_to_end.py
```

This tests:
- ✅ Corpus (40 examples)
- ✅ Vectors (40x1536 embeddings)
- ✅ Retrieval (cosine similarity)
- ✅ RAG Agent (with GLM 4.7)
- ✅ Baseline Agent (without retrieval)

### Test 2: Run GLM Test Suite

```bash
cd qsharp-rag-agent
python3 test_glm.py
```

This runs multiple queries and shows:
- Retrieval results
- RAG agent output
- Baseline agent output
- Comparison between both

### Test 3: Test Individual Components

**Test retrieval only**:
```bash
python3 -c "import sys; sys.path.insert(0, '.'); from rag.retrieve import retrieve; results = retrieve('Bell state', top_k=3); print([r['id'] for r in results])"
```

**Test RAG agent only**:
```bash
python3 -c "import sys; sys.path.insert(0, '.'); from agent.agent import generate; print(generate('Create entanglement', top_k=2))"
```

**Test baseline agent only**:
```bash
python3 -c "import sys; sys.path.insert(0, '.'); from agent.baseline import generate; print(generate('Create entanglement'))"
```

---

## Understanding the Output

### Retrieval Output
```python
[
    {
        "id": "bell-state",
        "description": "Creates a maximally entangled Bell state...",
        "code": "operation CreateBellState() : (Result, Result) {...}",
        "tags": ["entanglement", "bell", "basics"],
        "similarity": 0.8234
    },
    # ... more results
]
```

**Fields**:
- `similarity`: 0-1 score (higher = more relevant)
- `code`: Full Q# source code
- `tags`: Helpful keywords

### Agent Output

The agent returns Q# code wrapped in code blocks:

```qsharp
operation CreateBellState() : (Result, Result) {
    use (q1, q2) = (Qubit(), Qubit());
    H(q1);
    CNOT(q1, q2);
    let (r1, r2) = (M(q1), M(q2));
    Reset(q1);
    Reset(q2);
    return (r1, r2);
}
```

---

## API Keys Reference

| Service | Key | Where to Set | Required |
|---------|------|--------------|----------|
| GLM 4.7 | `9410fc5e242948aabc088709c826d9c4.vRNJuidhjrsOMgjB` | Embedded in code | ❌ (already set) |
| GLM 4.7 | Your custom key | `GLM_API_KEY` env var | ❌ (optional) |
| OpenAI | Your key | `OPENAI_API_KEY` env var | ✅ (for embeddings) |

---

## Troubleshooting

### Issue: "zhipuai package not found"

**Solution**:
```bash
pip install zhipuai>=2.0.0
```

### Issue: "openai package not found"

**Solution**:
```bash
pip install openai>=1.0.0
```

### Issue: Getting mock responses instead of real GLM output

**Cause**: Dependencies not installed

**Solution**:
```bash
pip install -r requirements.txt
```

### Issue: "ModuleNotFoundError: No module named 'rag'"

**Solution**: Run from project root:
```bash
cd qsharp-rag-agent
python3 your_script.py
```

Or add path in your script:
```python
import sys
sys.path.insert(0, '.')  # Add project root to path
```

---

## File Reference

| File | Purpose |
|------|----------|
| `agent/glm_client.py` | GLM 4.7 API client |
| `agent/agent.py` | RAG agent (with retrieval) |
| `agent/baseline.py` | Baseline agent (no retrieval) |
| `agent/prompts.py` | System prompts |
| `rag/embed.py` | Embedding generation |
| `rag/retrieve.py` | Semantic retrieval |
| `rag/vectors.json` | Pre-computed embeddings |
| `corpus/index.json` | Q# example corpus |
| `test_glm.py` | Test suite you created |
| `test_end_to_end.py` | Built-in test suite |

---

## Next Steps

1. ✅ **Test Now**: Run `python3 test_glm.py`
2. ⬇️ **Install Dependencies**: `pip install -r requirements.txt`
3. 🔑 **Set OpenAI Key**: `export OPENAI_API_KEY=...`
4. 🚀 **Use in Your Projects**: Import `from agent.agent import generate`

---

## Summary

Your Q# RAG Agent with GLM 4.7 is **ready to use!**

- Mock mode works now (no installation needed)
- Install dependencies for real GLM 4.7 output
- GLM API key is pre-configured
- OpenAI API key needed for semantic embeddings

**Happy Coding! 🚀**
