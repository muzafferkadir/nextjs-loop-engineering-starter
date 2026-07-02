#!/usr/bin/env bash
# Denylist guard — blocks changes to protected paths.
#
# Single source of truth: the "## Denylist" section in LOOP.md.
# This script parses that section, so editing LOOP.md is enough — no
# second list to keep in sync. Runs in CI and inside run-verifier.sh;
# the same list is enforced locally by scripts/hooks/deny-edit.mjs.
#
# Usage: bash scripts/check-denylist.sh

set -u

LOOP_FILE="LOOP.md"

if [ ! -f "$LOOP_FILE" ]; then
  echo "❌ LOOP.md not found — cannot load denylist (fail-closed)"
  exit 1
fi

# Extract backtick-quoted patterns from the "## Denylist" section.
PATTERNS=$(awk '/^## Denylist/{found=1; next} /^## /{found=0} found' "$LOOP_FILE" \
  | grep -oE '`[^`]+`' | tr -d '`')

if [ -z "$PATTERNS" ]; then
  echo "❌ No denylist patterns found in LOOP.md — refusing to pass (fail-closed)"
  exit 1
fi

# Determine changed files since branch point (CI) or last commit (local).
if [ -n "${GITHUB_BASE_REF:-}" ]; then
  git fetch origin "$GITHUB_BASE_REF" --depth=50 2>/dev/null || true
  BASE=$(git merge-base HEAD "origin/$GITHUB_BASE_REF" 2>/dev/null || echo "")
else
  BASE=$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse HEAD~1 2>/dev/null || echo "")
fi

if [ -z "$BASE" ]; then
  echo "⚠️  No diff base found (fresh repo?) — checking working tree only"
  CHANGED=$(git status --porcelain 2>/dev/null | awk '{print $2}')
else
  CHANGED=$( (git diff --name-only "$BASE" 2>/dev/null; git status --porcelain | awk '{print $2}') | sort -u)
fi

VIOLATIONS=""
for file in $CHANGED; do
  while IFS= read -r pattern; do
    [ -z "$pattern" ] && continue
    # Normalize: `dir/**` → prefix match on `dir/`
    case "$pattern" in
      *"/**") prefix="${pattern%/**}/"
        case "$file" in "$prefix"*) VIOLATIONS="$VIOLATIONS\n  $file (matches $pattern)";; esac ;;
      *)
        # shellcheck disable=SC2254
        case "$file" in
          $pattern) VIOLATIONS="$VIOLATIONS\n  $file (matches $pattern)";;
          */$pattern) VIOLATIONS="$VIOLATIONS\n  $file (matches $pattern)";;
        esac ;;
    esac
  done <<< "$PATTERNS"
done

if [ -n "$VIOLATIONS" ]; then
  echo "❌ DENYLIST VIOLATION — protected paths changed:"
  echo -e "$VIOLATIONS"
  echo ""
  echo "These paths require a human decision (see LOOP.md ## Denylist)."
  exit 1
fi

echo "✅ Denylist check passed — no protected paths touched"
