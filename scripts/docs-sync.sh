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

# Guard: docs vault is gitignored and may not be present on clean checkouts
if [ ! -d "$ROOT_DIR/docs/features/" ]; then
  echo "[docs-sync] docs/features/ not found — skipping (vault not present)."
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

# Guard: this runs from a post-commit hook, where `claude` may not be on PATH
# (CI, a bare checkout, a different shell). Missing tooling is not a commit error.
if ! command -v claude >/dev/null 2>&1; then
  echo "[docs-sync] claude CLI not found — skipping doc sync."
  exit 0
fi

echo "[docs-sync] Running triage..."
# Keep stderr rather than discarding it: when this step produces nothing, its
# stderr is the only thing that explains why, and silently dropping it is what
# made this hook's failures impossible to diagnose.
TRIAGE_ERR=$(mktemp)
trap 'rm -f "$TRIAGE_ERR"' EXIT
TRIAGE_RAW=$(claude -p "$TRIAGE_PROMPT" 2>"$TRIAGE_ERR" || true)

# Extract JSON — strip any accidental markdown fence wrapper.
# `|| true` is load-bearing: under `set -o pipefail` a grep that matches nothing
# exits 1 and aborts the script at this assignment, so the emptiness check below
# would never be reached and the hook would die here with no explanation.
TRIAGE_JSON=$(echo "$TRIAGE_RAW" | grep -o '{.*}' | head -1 || true)

if [ -z "$TRIAGE_JSON" ]; then
  # The commit has already been made by the time this runs, so a model hiccup
  # must not present itself as a failed hook. Report and stand down.
  echo "[docs-sync] WARNING: triage returned no parseable JSON — skipping doc sync."
  echo "[docs-sync] stdout: ${TRIAGE_RAW:-(empty)}"
  echo "[docs-sync] stderr: $(cat "$TRIAGE_ERR" 2>/dev/null || echo '(empty)')"
  exit 0
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

# ── Phase 2: Cascade ─────────────────────────────────────────────────────────

echo "[docs-sync] Building ingest context..."

COMMIT_HASH=$(git rev-parse --short "${RANGE##*..}")
TODAY=$(date +%Y-%m-%d)
FEATURE_LABEL=$(echo "$AFFECTED_FEATURES" | tr '\n' '+' | sed 's/+$//')

AFFECTED_TARGETS=""
CURRENT_FILE_CONTENTS=""

collect_file() {
  local rel="$1"
  local abs="$ROOT_DIR/$rel"
  if [ -f "$abs" ]; then
    AFFECTED_TARGETS="$AFFECTED_TARGETS\n- $rel"
    CURRENT_FILE_CONTENTS="$CURRENT_FILE_CONTENTS\n\n===CURRENT: $rel===\n$(cat "$abs")\n===END==="
  fi
}

for feature in $AFFECTED_FEATURES; do
  collect_file "docs/features/$feature.md"
  wiki_source=$(ls "$ROOT_DIR/docs/wiki/sources/"*"$feature"* 2>/dev/null | head -1 || true)
  if [ -n "$wiki_source" ]; then
    collect_file "${wiki_source#$ROOT_DIR/}"
  fi
done

[ "$AFFECTED_ARCH" = "true" ] && collect_file "docs/architecture.md"
[ "$AFFECTED_API"  = "true" ] && collect_file "docs/api.md"

collect_file "docs/wiki/log.md"

# The wiki half of the vault is optional: docs/ is gitignored, so docs/wiki/ is
# absent in any fresh clone and in vaults that never adopted it. Every other wiki
# reference above degrades quietly; this one used to be a bare `cat`, which under
# `set -e` aborted the whole run and surfaced as a failing post-commit hook on
# every commit that touched src/. Feature docs do not need the wiki schema, so
# carry on without it.
if [ -f "$ROOT_DIR/docs/wiki/SCHEMA.md" ]; then
  SCHEMA_CONTENT=$(cat "$ROOT_DIR/docs/wiki/SCHEMA.md")
else
  echo "[docs-sync] docs/wiki/SCHEMA.md not found — continuing without the wiki schema."
  SCHEMA_CONTENT="(No wiki schema is present in this vault. Do not create or modify any file under docs/wiki/.)"
fi
INGEST_PROMPT=$(cat "$ROOT_DIR/scripts/prompts/docs-ingest.md")
INGEST_PROMPT="${INGEST_PROMPT//\{\{DIFF\}\}/$DIFF}"
INGEST_PROMPT="${INGEST_PROMPT//\{\{AFFECTED_TARGETS\}\}/$AFFECTED_TARGETS}"
INGEST_PROMPT="${INGEST_PROMPT//\{\{SCHEMA_CONTENT\}\}/$SCHEMA_CONTENT}"
INGEST_PROMPT="${INGEST_PROMPT//\{\{CURRENT_FILE_CONTENTS\}\}/$CURRENT_FILE_CONTENTS}"
INGEST_PROMPT="${INGEST_PROMPT//\{\{DATE\}\}/$TODAY}"
INGEST_PROMPT="${INGEST_PROMPT//\{\{COMMIT_HASH\}\}/$COMMIT_HASH}"
INGEST_PROMPT="${INGEST_PROMPT//\{\{FEATURE\}\}/$FEATURE_LABEL}"

echo "[docs-sync] Running cascade (this may take ~30s)..."
INGEST_RAW=$(claude -p "$INGEST_PROMPT" 2>/dev/null || true)

if [ -z "$INGEST_RAW" ]; then
  echo "[docs-sync] WARNING: cascade returned nothing — no docs written."
  exit 0
fi

# ── awk parser: write each ===FILE:=== block to disk ─────────────────────────
echo "$INGEST_RAW" | awk -v root="$ROOT_DIR" '
  /^===FILE: / {
    if (outfile != "") close(outfile)
    outfile = substr($0, 10)
    gsub(/===[ \t]*$/, "", outfile)
    gsub(/^[ \t]+|[ \t]+$/, "", outfile)
    if (outfile !~ /^docs\// || outfile ~ /\.\./) {
      print "[docs-sync] BLOCKED unsafe path: " outfile > "/dev/stderr"
      outfile = ""
    }
    next
  }
  /^===END===/ {
    if (outfile != "") {
      close(outfile)
      print "[docs-sync] Written: " outfile
    }
    outfile = ""
    next
  }
  outfile != "" { print > (root "/" outfile) }
'

echo "[docs-sync] Cascade complete. Review unstaged changes before committing."
