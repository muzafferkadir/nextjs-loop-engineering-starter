#!/usr/bin/env sh
set -eu

MODE="${1:-check}"

case "$MODE" in
  check|sync) ;;
  *)
    echo "Usage: $0 [check|sync]" >&2
    exit 2
    ;;
esac

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT INT TERM

SKILLS="loop-fix loop-plan loop-triage ui-verify"
STATUS=0

copy_or_check() {
  src="$1"
  dst="$2"

  if [ ! -f "$src" ]; then
    echo "Missing source: $src" >&2
    STATUS=1
    return
  fi

  if [ "$MODE" = "sync" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    return
  fi

  if [ ! -f "$dst" ]; then
    echo "Missing generated file: $dst" >&2
    STATUS=1
    return
  fi

  if ! diff -u "$src" "$dst"; then
    STATUS=1
  fi
}

generate_loop_start_skill() {
  src="$ROOT/.claude/commands/loop-start.md"
  dst="$1"

  if [ ! -f "$src" ]; then
    echo "Missing source: $src" >&2
    STATUS=1
    return
  fi

  description="$(
    awk '
      /^---$/ { section += 1; next }
      section == 1 && /^description:/ {
        sub(/^description:[[:space:]]*/, "")
        gsub(/^"|"$/, "")
        print
        exit
      }
    ' "$src"
  )"

  {
    printf '%s\n' '---'
    printf '%s\n' 'name: "source-command-loop-start"'
    printf 'description: "%s"\n' "$description"
    printf '%s\n\n' '---'
    printf '%s\n\n' '# source-command-loop-start'
    printf '%s\n\n' 'Use this skill when the user asks to run the migrated source command `loop-start`.'
    printf '%s\n\n' '## Command Template'
    awk '
      /^---$/ { section += 1; next }
      section >= 2 {
        if (!started && $0 == "") next
        started = 1
        print
      }
    ' "$src"
  } > "$dst"
}

cd "$ROOT"

for skill in $SKILLS; do
  copy_or_check \
    "$ROOT/.claude/skills/$skill/SKILL.md" \
    "$ROOT/.agents/skills/$skill/SKILL.md"
done

mkdir -p "$TMPDIR/source-command-loop-start"
generated="$TMPDIR/source-command-loop-start/SKILL.md"
generate_loop_start_skill "$generated"

if [ "$MODE" = "sync" ]; then
  mkdir -p "$ROOT/.agents/skills/source-command-loop-start"
  cp "$generated" "$ROOT/.agents/skills/source-command-loop-start/SKILL.md"
else
  target="$ROOT/.agents/skills/source-command-loop-start/SKILL.md"
  if [ ! -f "$target" ]; then
    echo "Missing generated file: $target" >&2
    STATUS=1
  elif ! diff -u "$generated" "$target"; then
    STATUS=1
  fi
fi

if [ "$STATUS" -eq 0 ]; then
  if [ "$MODE" = "sync" ]; then
    echo "Agent skills synced from .claude to .agents."
  else
    echo "Agent skills are in sync."
  fi
fi

exit "$STATUS"
