#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$ROOT_DIR/benchmark-ui"
RESULTS_DIR="$ROOT_DIR/benchmark/results"

if [[ ! -f "$RESULTS_DIR/report_latest.json" ]]; then
  echo "Missing $RESULTS_DIR/report_latest.json. Run: python3 benchmark/harness.py"
  exit 1
fi

if [[ ! -f "$RESULTS_DIR/preview_latest.json" ]]; then
  echo "Missing $RESULTS_DIR/preview_latest.json. Run: python3 benchmark/preview.py"
  exit 1
fi

cp "$RESULTS_DIR/report_latest.json" "$UI_DIR/public/report_latest.json"
cp "$RESULTS_DIR/preview_latest.json" "$UI_DIR/public/preview_latest.json"

cd "$UI_DIR"

if [[ ! -d "node_modules" ]]; then
  npm install
fi

npm run dev
