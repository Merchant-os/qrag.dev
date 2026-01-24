# Q# RAG Agent

A Retrieval-Augmented Generation (RAG) system for Q# quantum programming code generation. This system uses real QDK examples, OpenAI embeddings for semantic retrieval, and OpenAI models for generation.

## Project Structure

```
qsharp-rag-agent/
├── agent/
│   ├── agent.py            # Main RAG agent (retrieval + OpenAI generation)
│   ├── baseline.py         # Baseline agent (no retrieval, for comparison)
│   ├── glm_client.py       # OpenAI client wrapper (historical name)
│   ├── prompts.py          # System prompts
│   └── config.yaml         # Model + benchmark defaults
├── corpus/
│   ├── docs/               # Optional docs chunks for RAG
│   ├── examples/           # Raw .qs files (optional, for reference)
│   ├── index.json          # Structured JSON with all examples
│   ├── scrape_qdk.py       # Script to scrape Q# examples from QDK repo
│   └── qdk-cache/          # Cached QDK repository
├── rag/
│   ├── embed.py            # Generates embeddings for examples + docs
│   ├── retrieve.py         # Finds similar examples given a query
│   ├── metadata.json       # Metadata for embedded chunks
│   └── vectors.npy         # Vector embeddings (NumPy)
├── benchmark/
│   ├── tasks.json          # Benchmark tasks
│   ├── harness.py          # Runs benchmark, builds/tests Q#
│   ├── preview.py          # Side-by-side preview run
│   ├── scoring.py          # Heuristic scoring fallback
│   └── results/            # Output folder for benchmark results
├── QsharpRagAgent/          # Q# project for generated code
├── QsharpRagAgent.Tests/    # Test project for generated operations
├── benchmark-ui/            # React UI for benchmark results
├── run_benchmark_ui.sh      # Runs preview + harness + UI
├── requirements.txt
└── README.md
```

## Installation

### Prerequisites

- Python 3.8 or higher
- OpenAI API key (embeddings + generation)
- .NET 6 SDK/runtime (for Q# build/test via the QDK 0.28 toolchain)

### Quick Start

1. **Navigate to project directory:**
   ```bash
   cd qsharp-rag-agent
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   ```

   Optional overrides:
   ```bash
   export OPENAI_MODEL="gpt-4o-mini"
   export OPENAI_EMBED_MODEL="text-embedding-3-small"
   export OPENAI_EMBED_FALLBACK="mock"
   ```

   Or create a `.env` file:
   ```
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_EMBED_MODEL=text-embedding-3-small
   OPENAI_EMBED_FALLBACK=mock
   ```

### Note on API Keys

- **OpenAI API Key**: Required for both code generation and semantic embeddings.
  - Embeddings default to `text-embedding-3-small`.
  - `OPENAI_EMBED_FALLBACK=mock` enables deterministic mock embeddings when quota is unavailable.

## Usage

### Step 1: Scrape Q# Examples (First Time Only)

The scraping script clones the Microsoft QDK repository and extracts high-quality Q# examples:

```bash
python corpus/scrape_qdk.py
```

This creates `corpus/index.json` with 40-70 curated examples including:
- Basic quantum operations (gates, measurements, superposition)
- Quantum algorithms (Grover's search, phase estimation, etc.)
- Error correction schemes
- Quantum teleportation
- And more

### Step 2: Generate Embeddings

Generate vector embeddings for all examples:

```bash
python rag/embed.py
```

This creates `rag/vectors.npy` and `rag/metadata.json` with example + doc embeddings (1536-dimensional vectors from OpenAI's `text-embedding-3-small` model).

**Note**: If you don't have an OpenAI API key set, enable mock embeddings for testing:
```bash
export OPENAI_EMBED_FALLBACK="mock"
python rag/embed.py
```

### Step 3: Test Retrieval

Test the retrieval system:

```bash
python rag/retrieve.py
```

Or use it programmatically:

```python
from rag.retrieve import retrieve

results = retrieve("How do I create entanglement between qubits?", top_k=5)
for r in results:
    print(f"[{r['similarity']}] {r['id']}: {r['description']}")
```

### Step 4: Generate Code with RAG Agent (OpenAI)

Generate Q# code using the RAG agent with OpenAI (model configurable in `agent/config.yaml` or `OPENAI_MODEL`):

```bash
python -c "import sys; sys.path.insert(0, '.'); from agent.agent import generate; print(generate('Create a Bell state between two qubits'))"
```

Or programmatically:

```python
from agent.agent import generate

result = generate("Implement Grover's search algorithm for 4 items", top_k=5)
print(result)
```

### Step 5: Compare with Baseline

Compare RAG performance against a baseline agent (no retrieval):

```python
from agent.agent import generate as generate_rag
from agent.baseline import generate as generate_baseline

task = "Create a quantum teleportation circuit"

rag_result = generate_rag(task)
baseline_result = generate_baseline(task)

print("RAG Agent Output:")
print(rag_result)
print("\nBaseline Agent Output:")
print(baseline_result)
```

## Benchmarking

The benchmark harness generates Q# code into `QsharpRagAgent/Generated`, builds the Q# project, and runs xUnit tests from `QsharpRagAgent.Tests`. The tests file is regenerated to match the selected tasks.

Run a small preview (no build/test required):
```bash
python benchmark/preview.py
```

Run the harness (build/test):
```bash
python benchmark/harness.py --limit 3 --attempts 1
```

Launch the UI (preview + harness + UI):
```bash
./run_benchmark_ui.sh
```

## Module Documentation

### `agent/glm_client.py`

OpenAI client wrapper for code generation (historical filename):
- Uses `openai>=1.0.0`
- Model defaults to `gpt-4o-mini` (configurable)
- Supports system prompts for context

### `agent/agent.py`

Main RAG agent that:
1. Retrieves relevant examples for the task using semantic search
2. Formats examples into a system prompt
3. Calls an OpenAI model to generate Q# code with retrieved context

**Usage:**
```python
from agent.agent import generate

code = generate("Create a GHZ state", top_k=5)
print(code)
```

### `agent/baseline.py`

Baseline agent (no retrieval) for comparison:
- Uses same system prompt but no examples
- Useful for A/B testing RAG vs non-RAG approaches
- Uses the same OpenAI model for fair comparison

**Usage:**
```python
from agent.baseline import generate

code = generate("Create a GHZ state")
print(code)
```

### `corpus/scrape_qdk.py`

Clones QDK repository and extracts Q# examples:
- Searches `samples/` and `katas/` folders
- Extracts code, descriptions, and tags
- Applies similarity-based deduplication
- Down-selects to 40-70 high-quality examples

**Usage:**
```bash
python corpus/scrape_qdk.py
```

### `rag/embed.py`

Generates OpenAI embeddings for all examples:
- Uses `text-embedding-3-small` model (1536-dimensional vectors)
- Embeds description + tags
- Saves to `rag/vectors.npy` and `rag/metadata.json`

**Usage:**
```bash
python rag/embed.py
```

Mock embeddings (no API key or quota):
```bash
export OPENAI_EMBED_FALLBACK="mock"
python rag/embed.py
```

### `rag/retrieve.py`

Retrieves similar examples based on cosine similarity:
- Accepts query string and optional `top_k` parameter
- Returns examples with similarity scores
- Supports both NumPy and pure Python implementations

**Usage:**
```python
from rag.retrieve import retrieve

results = retrieve("Implement quantum Fourier transform", top_k=3)
```

### `agent/prompts.py`

System prompts for Q# code generation:
- Enforces QDK 0.28 syntax
- Specifies use of `Microsoft.Quantum.*` namespaces
- Defines code style guidelines

## Testing Without API Keys

The embedding pipeline can fall back to deterministic mock vectors if OpenAI quota is unavailable:

```bash
export OPENAI_EMBED_FALLBACK="mock"
python rag/embed.py
```

Note: Mock embeddings do not capture semantic similarity. Use real embeddings for accurate retrieval.

## API Costs

Estimated costs for 40 examples:

- **OpenAI Embeddings**: $0.0001 per 1K tokens
  - ~50 tokens per example
  - Total: ~2,000 tokens
  - Cost: **~$0.0002** per embedding run
- **OpenAI Generation**: Pricing varies by model
  - Typical cost per generation depends on prompt size and model

## Troubleshooting

### Module Not Found Error

If you get `ModuleNotFoundError`, make sure you're running from the project root:
```bash
cd qsharp-rag-agent
python3 -c "import sys; sys.path.insert(0, '.'); from agent.agent import generate; ..."
```

### OpenAI Package Not Found

Install dependencies:
```bash
pip install openai>=1.0.0
```

### API Key Errors

Make sure environment variables are set:
```bash
echo $OPENAI_API_KEY
```

## Comparison: RAG vs Baseline

| Aspect | RAG Agent | Baseline Agent |
|---------|-------------|----------------|
| Context | Includes 5 relevant examples | No examples |
| Accuracy | Higher (with good retrieval) | Lower |
| Consistency | Better with diverse tasks | Varies by task |
| Speed | Slightly slower (retrieval) | Faster |

## Contributing

Contributions welcome! Areas for improvement:
- More sophisticated deduplication logic
- Better tag extraction
- Additional benchmark tasks
- Different embedding models
- Alternative LLM backends

## License

This project is for educational purposes. QDK examples are from Microsoft's Quantum Development Kit.

## References

- [Microsoft QDK](https://github.com/microsoft/qdk)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
