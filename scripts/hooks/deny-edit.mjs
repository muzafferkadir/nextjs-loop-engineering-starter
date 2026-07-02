#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — denylist enforcement, fail-closed.
 *
 * Two surfaces, one list (LOOP.md ## Denylist — the same single source
 * parsed by scripts/check-denylist.sh and CI):
 *   - Edit/Write/MultiEdit/NotebookEdit: blocks direct edits to protected paths
 *   - Bash: blocks writes to protected paths two ways —
 *       (a) redirect targets: `echo x > protected` is blocked, while
 *           fd duplication (2>&1) and /dev/null are ignored, so read-only
 *           commands like `bash scripts/x.sh 2>&1 | tail` stay usable
 *       (b) write-shaped tools (sed -i, tee, mv, rm, …): any path-like
 *           token matching the denylist blocks the call
 *
 * Fail-closed: if LOOP.md or the payload cannot be read, the call is
 * blocked (exit 2). A broken enforcement layer must not silently allow
 * edits; CI remains the final backstop.
 *
 * Known limits (caught at the PR gate by the verifier + CI denylist
 * checks): bare filenames after a cd (cd src/lib && sed -i … auth.ts),
 * subprocess writes (node/python scripts that open files themselves),
 * and variable-indirection targets (> "$FILE").
 */
import { readFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

const WRITE_TOOLS =
  /(^|[\s;&|(])((sed|perl)\s+[^;|&]*-i|(tee|mv|cp|rm|rmdir|chmod|chown|truncate|dd|touch|ln|install)\s)/;
const REDIRECT_TARGET = /\d?>{1,2}\s*([^\s;|&<>()"'`]+)/g;
const SAFE_TARGETS = new Set(["/dev/null", "/dev/stdout", "/dev/stderr"]);

function loadDenylist(projectDir) {
  const loopMd = readFileSync(resolve(projectDir, "LOOP.md"), "utf8");
  const section = loopMd.split(/^## Denylist$/m)[1]?.split(/^## /m)[0] ?? "";
  const patterns = [...section.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (patterns.length === 0) throw new Error("no denylist patterns in LOOP.md");
  return patterns;
}

function matches(file, pattern) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -2); // keep trailing slash
    return file.startsWith(prefix) || file.includes(`/${prefix}`);
  }
  const regex = new RegExp(
    "(^|/)" + pattern.replaceAll(".", "\\.").replaceAll("*", "[^/]*") + "$",
  );
  return regex.test(file);
}

function block(message) {
  console.error(message);
  process.exit(2);
}

function checkPath(rel, denylist, what) {
  for (const pattern of denylist) {
    if (matches(rel, pattern)) {
      block(
        `DENYLIST: ${what} '${rel}' matches protected pattern '${pattern}' (LOOP.md ## Denylist). ` +
          "This path requires a human decision — do not modify it. " +
          "Report the need in STATE.md and escalate instead.",
      );
    }
  }
}

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input);
    const projectDir =
      process.env.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd();
    const denylist = loadDenylist(projectDir);
    const toRel = (p) =>
      relative(projectDir, isAbsolute(p) ? p : resolve(projectDir, p));

    if (payload.tool_name === "Bash") {
      const command = payload.tool_input?.command ?? "";

      // (a) Redirect targets — checked regardless of the rest of the command
      for (const m of command.matchAll(REDIRECT_TARGET)) {
        const target = m[1];
        if (SAFE_TARGETS.has(target)) continue;
        checkPath(
          toRel(target.replace(/^\.\//, "")),
          denylist,
          "Bash redirect writes to",
        );
      }

      // (b) Write-shaped tools — every path-like token is suspect
      if (WRITE_TOOLS.test(command)) {
        const tokens = command.split(/[\s;&|<>()"'`]+/).filter(Boolean);
        for (const token of tokens) {
          const cleaned = token.replace(/^\.\//, "");
          if (!/[\w.]/.test(cleaned)) continue;
          checkPath(toRel(cleaned), denylist, "Bash command touches");
        }
      }
      process.exit(0);
    }

    const filePath =
      payload.tool_input?.file_path ??
      payload.tool_input?.notebook_path ??
      payload.tool_input?.path;
    if (!filePath) process.exit(0);
    checkPath(toRel(filePath), denylist, "edit target");
    process.exit(0);
  } catch (err) {
    // Fail-closed: a broken guard must not silently allow edits.
    block(
      `DENYLIST GUARD ERROR (fail-closed): ${err.message}. ` +
        "Fix LOOP.md / the hook, then retry.",
    );
  }
});
