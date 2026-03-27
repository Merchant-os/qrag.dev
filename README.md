# QRAG - Quantum RAG Agent

Retrieval-Augmented Generation system for Q# quantum programming. Scrapes real QDK examples, embeds them with OpenAI, retrieves relevant context at generation time, and benchmarks the output against a no-retrieval baseline.

## How It Works

```
Query: "Implement Grover's search for 4 items"
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Embed query     │────▶│  Cosine search    │
│  (text-embed-3)  │     │  over 40-70 QDK   │
└─────────────────┘     │  examples          │
                        └────────┬───────────┘
                                 │ top-k
                                 ▼
                        ┌──────────────────┐
                        │  GPT generation   │
                        │  with retrieved   │
                        │  Q# context       │
                        └────────┬───────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  .NET build/test  │
                        │  (QDK 0.28)       │
                        └──────────────────┘
```

## Project Structure

```
├── agent/
│   ├── agent.py          # RAG agent (retrieval + generation)
│   ├── baseline.py       # Baseline agent (no retrieval, for A/B comparison)
│   ├── glm_client.py     # OpenAI client wrapper
│   ├── prompts.py        # System prompts enforcing QDK 0.28 syntax
│   └── config.yaml       # Model and benchmark defaults
│
├── corpus/
│   ├── scrape_qdk.py     # Scrapes Microsoft QDK repo for Q# examples
│   └── index.json        # 40-70 curated examples with code, descriptions, tags
│
├── rag/
│   ├── embed.py          # Generates 1536-dim OpenAI embeddings
│   ├── retrieve.py       # Cosine similarity retrieval
│   ├── vectors.npy       # Stored embeddings
│   └── metadata.json     # Chunk metadata
│
├── benchmark/
│   ├── tasks.json        # Benchmark task definitions
│   ├── harness.py        # Full benchmark (generate, build, test)
│   ├── preview.py        # Quick side-by-side preview (no build)
│   └── scoring.py        # Heuristic scoring fallback
│
├── QsharpRagAgent/        # Q# project for generated code
├── QsharpRagAgent.Tests/  # xUnit tests for generated operations
└── benchmark-ui/          # React dashboard for benchmark results
```

## Quick Start

**Prerequisites:** Python 3.8+, OpenAI API key, .NET 6 SDK (for Q# build/test)

```bash
# Install
pip install -r requirements.txt
export OPENAI_API_KEY="your-key"

# 1. Scrape QDK examples (first time only)
python corpus/scrape_qdk.py

# 2. Generate embeddings
python rag/embed.py

# 3. Generate Q# code with RAG
python -c "from agent.agent import generate; print(generate('Create a Bell state'))"
```

## Benchmarking

The harness generates Q# into `QsharpRagAgent/Generated/`, builds with `dotnet build`, and runs xUnit tests. Both RAG and baseline agents are evaluated on the same tasks.

```bash
# Quick preview (no build required)
python benchmark/preview.py

# Full benchmark with build + test
python benchmark/harness.py --limit 3 --attempts 1

# Launch the React dashboard
./run_benchmark_ui.sh
```

### RAG vs Baseline

| Metric | RAG Agent | Baseline |
|--------|-----------|----------|
| Context | 5 retrieved Q# examples | None |
| Accuracy | Higher with good retrieval | Lower |
| Consistency | Better across diverse tasks | Variable |

## Benchmark UI

React + Vite + Tailwind dashboard for visualizing results. Shows per-task scores, model comparisons, and pipeline process details.

```bash
cd benchmark-ui
npm install && npm run dev
```

Reads static JSON from `public/`. Drop in new `preview_latest.json` / `report_latest.json` to update.

## Configuration

`agent/config.yaml`:

```yaml
model:
  provider: openai
  name: gpt-4o-mini      # or any OpenAI model
  temperature: 0.0
  max_tokens: 4096

retrieval:
  top_k_examples: 5
  top_k_docs: 3
```

Override via environment:

```bash
export OPENAI_MODEL="gpt-4o-mini"
export OPENAI_EMBED_MODEL="text-embedding-3-small"
export OPENAI_EMBED_FALLBACK="mock"    # deterministic mock embeddings (no API needed)
```

## Tech Stack

| Component | Tech |
|-----------|------|
| RAG pipeline | Python, OpenAI API (embeddings + generation) |
| Embeddings | text-embedding-3-small (1536-dim), cosine similarity |
| Code target | Q# (Microsoft QDK 0.28) |
| Build/test | .NET 6, xUnit |
| Corpus | Scraped from [Microsoft QDK](https://github.com/microsoft/qdk) samples + katas |
| Benchmark UI | React 18, Vite, Tailwind CSS, Recharts |

## License

Educational use. QDK examples are from Microsoft's Quantum Development Kit.
