#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "OPENAI_API_KEY is not set. Export it before running."
  exit 1
fi

cd "$ROOT_DIR"

python3 benchmark/preview.py
python3 benchmark/harness.py "$@"

bash benchmark-ui/run.sh
