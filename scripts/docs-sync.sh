#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
export ROOT_DIR

# Accept optional commit range as $1 (defaults to last commit)
RANGE="${1:-HEAD~1..HEAD}"

echo "[docs-sync] Checking commit range: $RANGE"

# Guard: skip if no src/ changes in this range
CHANGED_SRC=$(git diff "$RANGE" --name-only | grep '^src/' || true)
if [ -z "$CHANGED_SRC" ]; then
  echo "[docs-sync] No src/ changes in range — skipping."
  exit 0
fi

echo "[docs-sync] src/ changes detected:"
echo "$CHANGED_SRC"
