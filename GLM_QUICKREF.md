# Q# RAG Agent with GLM-4.7 - Quick Reference

## Overview
- **Main Agent**: GLM-4.7 (ZhipuAI)
- **Embeddings**: OpenAI `text-embedding-3-small` (1536-dim)
- **Corpus**: 40 curated Q# examples from Microsoft QDK

## Installation

### Quick Install (Linux/macOS)
```bash
cd qsharp-rag-agent
bash setup.sh
```

### Quick Install (Windows)
```cmd
cd qsharp-rag-agent
setup.bat
```

### Manual Install
```bash
pip install -r requirements.txt
```

## API Keys

### Required
- `OPENAI_API_KEY` - For embeddings (get from platform.openai.com)

### Optional
- `GLM_API_KEY` - For GLM-4.7 (already embedded in code)
  - Key: `1970957e4467483494d20d7d13ad2419.zXleuROJ9ufHQ7GE`
  - Override with: `export GLM_API_KEY=your-key`

## Usage

### RAG Agent (with retrieval)
```python
from agent.agent import generate

# Generate code with 5 retrieved examples
code = generate("Create a Bell state", top_k=5)
print(code)
```

### Baseline Agent (no retrieval)
```python
from agent.baseline import generate

# Generate code without examples
code = generate("Create a Bell state")
print(code)
```

### Direct Retrieval
```python
from rag.retrieve import retrieve

# Find 3 similar examples
results = retrieve("Grover search", top_k=3)
for r in results:
    print(f"[{r['similarity']}] {r['id']}")
```

## File Structure

```
agent/
├── glm_client.py    # GLM-4.7 client wrapper
├── agent.py         # RAG agent (GLM + retrieval)
├── baseline.py      # Baseline agent (GLM only)
└── prompts.py       # System prompt

rag/
├── embed.py        # OpenAI embeddings
├── retrieve.py     # Cosine similarity search
└── vectors.json     # 40x1536 embeddings

corpus/
├── index.json      # 40 Q# examples
└── scrape_qdk.py   # QDK scraper
```

## Models

| Component | Model | Purpose |
|-----------|--------|---------|
| Code Generation | GLM-4.7 | Q# code generation |
| Embeddings | text-embedding-3-small | Semantic search (1536-dim) |

## Commands

| Command | Description |
|---------|-------------|
| `python corpus/scrape_qdk.py` | Scrape Q# examples from QDK |
| `python rag/embed.py` | Generate embeddings (or use `--mock`) |
| `python rag/retrieve.py` | Test retrieval |
| `python agent/agent.py` | Test RAG agent |
| `python agent/baseline.py` | Test baseline agent |

## Testing

### Run All Tests
```bash
python test_end_to_end.py
```

### Expected Output
```
============================================================
Q# RAG Agent - End-to-End Tests
============================================================
Testing corpus/index.json...
  ✓ Valid JSON with 40 examples

Testing rag/vectors.json...
  ✓ Valid vectors.json with 40 examples

Testing retrieval...
  ✓ Retrieval works (top 3 results)

Testing RAG agent...
  ✓ RAG agent works

Testing baseline agent...
  ✓ Baseline agent works

All tests passed! ✓
```

## Common Issues

### "zhipuai package not found"
```bash
pip install zhipuai>=2.0.0
```

### "openai package not found"
```bash
pip install openai>=1.0.0
```

### Mock responses appear
- This is normal if dependencies aren't installed
- System falls back to mock mode for testing

## GLM-4.7 Advantages

- ✅ Strong code generation across multiple languages
- ✅ Good understanding of quantum computing concepts
- ✅ Effective utilization of retrieved examples
- ✅ Lower cost than some alternatives
- ✅ Free tier available for testing

## API Cost Comparison (Approximate)

| Service | Cost per 1K tokens |
|----------|---------------------|
| OpenAI Embeddings | $0.0001 |
| GLM-4.7 | ~$0.001-0.01 |

**Note**: GLM-4.7 pricing may vary by plan and region.
