#!/usr/bin/env bash
# Verifier self-test — proves the verifier catches real violations.
#
# "Verifier theater" is the failure mode where the verifier approves
# without actually checking. This script plants deliberate violations
# and asserts the guards reject them. Run it once after cloning and
# after any change to the verifier or guard scripts.
#
# Usage: bash scripts/verifier-self-test.sh

echo "🧪 Verifier self-test"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Test 1: verifier catches a failing unit test
echo "── Test 1: failing unit test detection"
TEMP_TEST="src/lib/__tests__/_self_test.test.ts"
trap 'rm -f "$TEMP_TEST"' EXIT
cat > "$TEMP_TEST" <<'EOF'
import { expect, it } from "vitest";
it("intentional-fail (verifier self-test)", () => expect(1).toBe(2));
EOF

if bash scripts/run-verifier.sh --fast 2>&1 | grep -q "REJECT"; then
  echo "✅ PASS — verifier rejected the failing test"
  PASS_COUNT=$((PASS_COUNT+1))
else
  echo "❌ FAIL — verifier approved despite a failing test (VERIFIER THEATER)"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi
rm -f "$TEMP_TEST"
echo ""

# Test 2: git context check is fail-closed
echo "── Test 2: git context required"
if bash scripts/run-verifier.sh --fast 2>&1 | grep -qE "Git context OK|Not in a git"; then
  echo "✅ PASS — git context check present"
  PASS_COUNT=$((PASS_COUNT+1))
else
  echo "❌ FAIL — git context check missing"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi
echo ""

# Test 3: denylist guard parses LOOP.md and runs
echo "── Test 3: denylist guard"
if bash scripts/check-denylist.sh 2>&1 | grep -qE "check passed|VIOLATION"; then
  echo "✅ PASS — denylist guard runs against LOOP.md"
  PASS_COUNT=$((PASS_COUNT+1))
else
  echo "❌ FAIL — denylist guard not working"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi
echo ""

# Test 4: local edit hook blocks a denylisted path
echo "── Test 4: PreToolUse hook blocks denylisted edit"
HOOK_INPUT='{"tool_input":{"file_path":"src/lib/auth.ts"}}'
if echo "$HOOK_INPUT" | CLAUDE_PROJECT_DIR="$(pwd)" node scripts/hooks/deny-edit.mjs 2>&1 | grep -q "DENYLIST"; then
  echo "✅ PASS — hook blocks edits to src/lib/auth.ts"
  PASS_COUNT=$((PASS_COUNT+1))
else
  echo "❌ FAIL — hook did not block a denylisted path"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi
echo ""

# Test 5: hook blocks Bash write commands on denylisted paths
echo "── Test 5: PreToolUse hook blocks Bash writes to denylisted paths"
HOOK_INPUT='{"tool_name":"Bash","tool_input":{"command":"sed -i .bak s/a/b/ src/lib/auth.ts"}}'
if echo "$HOOK_INPUT" | CLAUDE_PROJECT_DIR="$(pwd)" node scripts/hooks/deny-edit.mjs 2>&1 | grep -q "DENYLIST"; then
  echo "✅ PASS — hook blocks 'sed -i' on src/lib/auth.ts"
  PASS_COUNT=$((PASS_COUNT+1))
else
  echo "❌ FAIL — Bash write to a denylisted path was not blocked"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi
echo ""

# Test 6: read-only Bash mention of a denylisted path passes
echo "── Test 6: read-only Bash commands are not blocked"
HOOK_INPUT='{"tool_name":"Bash","tool_input":{"command":"grep -n session src/lib/auth.ts"}}'
if echo "$HOOK_INPUT" | CLAUDE_PROJECT_DIR="$(pwd)" node scripts/hooks/deny-edit.mjs 2>&1 | grep -q "DENYLIST"; then
  echo "❌ FAIL — read-only grep of a denylisted path was blocked (too strict)"
  FAIL_COUNT=$((FAIL_COUNT+1))
else
  echo "✅ PASS — read-only mention passes"
  PASS_COUNT=$((PASS_COUNT+1))
fi
echo ""

# Test 7: guard is fail-closed when LOOP.md is missing
echo "── Test 7: guard fails closed without LOOP.md"
TMP_GUARD_DIR=$(mktemp -d)
if echo '{"tool_input":{"file_path":"x.ts"}}' | CLAUDE_PROJECT_DIR="$TMP_GUARD_DIR" node scripts/hooks/deny-edit.mjs 2>&1 | grep -q "fail-closed"; then
  echo "✅ PASS — guard blocks when its denylist source is unreadable"
  PASS_COUNT=$((PASS_COUNT+1))
else
  echo "❌ FAIL — guard silently allowed edits without LOOP.md (fail-open)"
  FAIL_COUNT=$((FAIL_COUNT+1))
fi
rm -rf "$TMP_GUARD_DIR"
echo ""

# Summary
echo "══════════════════════"
echo "Self-test: $PASS_COUNT passed, $FAIL_COUNT failed"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "✅ Verifier is not theater — it catches real violations"
else
  echo "❌ VERIFIER THEATER DETECTED — fix the guards before any L2 work"
  exit 1
fi
