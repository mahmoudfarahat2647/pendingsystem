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

# ── Phase 1: Triage ──────────────────────────────────────────────────────────

DIFF=$(git diff "$RANGE" -- src/)

# Build list of known feature doc names (no .md extension, comma-separated)
FEATURE_LIST=$(ls "$ROOT_DIR/docs/features/" | sed 's/\.md$//' | tr '\n' ',' | sed 's/,$//')

# Load triage prompt and substitute placeholders
TRIAGE_PROMPT=$(cat "$ROOT_DIR/scripts/prompts/docs-triage.md")
TRIAGE_PROMPT="${TRIAGE_PROMPT//\{\{FEATURE_LIST\}\}/$FEATURE_LIST}"
TRIAGE_PROMPT="${TRIAGE_PROMPT//\{\{DIFF\}\}/$DIFF}"

echo "[docs-sync] Running triage..."
TRIAGE_RAW=$(claude -p "$TRIAGE_PROMPT" 2>/dev/null)

# Extract JSON — strip any accidental markdown fence wrapper
TRIAGE_JSON=$(echo "$TRIAGE_RAW" | grep -o '{.*}' | head -1)

if [ -z "$TRIAGE_JSON" ]; then
  echo "[docs-sync] ERROR: triage returned no parseable JSON. Raw output:"
  echo "$TRIAGE_RAW"
  exit 1
fi

NEEDS_UPDATE=$(echo "$TRIAGE_JSON" | jq -r '.needs_update')
REASON=$(echo "$TRIAGE_JSON"       | jq -r '.reason')
AFFECTED_FEATURES=$(echo "$TRIAGE_JSON" | jq -r '.affected_features[]' 2>/dev/null || echo "")
AFFECTED_ARCH=$(echo "$TRIAGE_JSON" | jq -r '.affected_architecture')
AFFECTED_API=$(echo "$TRIAGE_JSON"  | jq -r '.affected_api')

echo "[docs-sync] Triage: needs_update=$NEEDS_UPDATE — $REASON"

if [ "$NEEDS_UPDATE" = "false" ]; then
  echo "[docs-sync] No doc update needed — done."
  exit 0
fi

echo "[docs-sync] Affected features: $AFFECTED_FEATURES"
[ "$AFFECTED_ARCH" = "true" ] && echo "[docs-sync] + architecture.md"
[ "$AFFECTED_API"  = "true" ] && echo "[docs-sync] + api.md"
