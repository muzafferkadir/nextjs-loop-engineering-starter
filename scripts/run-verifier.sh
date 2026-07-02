#!/usr/bin/env bash
# Verifier runner — the single verification entry point.
#
# The verifier agent, CI, and humans all run exactly this pipeline
# (CI via `pnpm verify`). If it passes here, it passes in CI — no
# "works on my machine" gap for the loop to fall into.
#
# Usage: bash scripts/run-verifier.sh [feature-id] [--fast]
#   --fast  skip build + e2e (quick iteration only — full run required
#           before opening a PR)

FAST=0
FEATURE=""
for arg in "$@"; do
  case "$arg" in
    --fast) FAST=1 ;;
    *) FEATURE="$arg" ;;
  esac
done
[ -z "$FEATURE" ] && FEATURE=$(grep 'Active feature:' STATE.md 2>/dev/null | awk '{print $3}')

echo "🔍 Verifier started — feature: ${FEATURE:-n/a} $([ $FAST -eq 1 ] && echo '(FAST mode — not sufficient for PR)')"
echo ""

FAILED=0
FAIL_COUNT=0

step() {
  local NAME="$1"; shift
  echo "── $NAME"
  if "$@"; then
    echo "✅ $NAME: passed"
  else
    echo "❌ $NAME: failed"
    FAILED=1; FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  echo ""
}

# 0. Git context — fail-closed: denylist/secret checks need git
echo "── Git context"
if ! git rev-parse HEAD > /dev/null 2>&1; then
  echo "❌ Not in a git repository — verifier cannot run denylist/secret checks"
  exit 1
fi
echo "✅ Git context OK"
echo ""

# 1. Denylist (parsed from LOOP.md)
step "Denylist" bash scripts/check-denylist.sh

# 2. Typecheck
step "TypeScript" pnpm typecheck

# 3. Lint
step "Lint" pnpm lint

# 4. Unit tests
step "Unit tests" pnpm test

# 5+6. Build & e2e — the deterministic browser check
if [ $FAST -eq 1 ]; then
  echo "── Build + e2e: SKIPPED (--fast)"
  echo "⚠️  Run the full verifier before opening a PR"
  echo ""
else
  step "Build" pnpm build
  step "E2E (Playwright)" pnpm e2e
fi

# 7. Secret leak — hardcoded secrets in the diff, not variable names
echo "── Secret leak"
BASE=$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse HEAD~1 2>/dev/null || echo "HEAD")
LEAK=$(git diff "$BASE" --unified=0 2>/dev/null \
  | grep "^+" | grep -v "^+++" \
  | grep -E '(password|secret|apikey|token)\s*[:=]\s*["'"'"'][^$"'"'"']{16,}' \
  | grep -v "change-this\|example\|placeholder\|test-secret\|TODO\|FIXME" \
  | grep -v "\.example\|\.test\.\|\.spec\." || true)
if [ -n "$LEAK" ]; then
  echo "❌ Potential hardcoded secret:"
  echo "$LEAK"
  FAILED=1; FAIL_COUNT=$((FAIL_COUNT+1))
else
  echo "✅ No hardcoded secrets detected"
fi
echo ""

# 8. no-any — strict TypeScript discipline in the diff
echo "── TypeScript 'any' usage"
ANY=$(git diff "$BASE" --unified=0 2>/dev/null \
  | grep "^+" | grep -v "^+++" \
  | grep -E ': any\b|as any\b' \
  | grep -v "//.*any\|eslint\|disable" || true)
if [ -n "$ANY" ]; then
  echo "❌ 'any' usage detected:"
  echo "$ANY"
  FAILED=1; FAIL_COUNT=$((FAIL_COUNT+1))
else
  echo "✅ No 'any' usage"
fi
echo ""

# Verdict
echo "══════════════════════"
if [ "$FAILED" -eq 0 ]; then
  if [ $FAST -eq 1 ]; then
    echo "🟡 FAST PASS — run the full verifier (no --fast) before opening a PR"
  else
    echo "✅ APPROVE — all checks passed"
    echo "Next: open a PR following the git protocol in AGENTS.md"
  fi
else
  echo "❌ REJECT — $FAIL_COUNT check(s) failed"
  echo "Fix and re-run: bash scripts/run-verifier.sh"
  exit 1
fi
