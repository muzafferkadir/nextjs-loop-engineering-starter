#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — blocks Edit/Write on denylisted paths.
 *
 * Reads the tool call payload from stdin, loads the "## Denylist" section
 * of LOOP.md (same single source as scripts/check-denylist.sh), and exits
 * with code 2 to block the tool call when a protected path is targeted.
 * This enforces the denylist *before* an edit happens, instead of catching
 * it in CI after tokens were already spent.
 */
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";

function loadDenylist(projectDir) {
  const loopMd = readFileSync(resolve(projectDir, "LOOP.md"), "utf8");
  const section = loopMd.split(/^## Denylist$/m)[1]?.split(/^## /m)[0] ?? "";
  return [...section.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
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

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input);
    const filePath = payload.tool_input?.file_path ?? payload.tool_input?.path;
    if (!filePath) process.exit(0);

    const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    const rel = relative(projectDir, resolve(filePath));
    const denylist = loadDenylist(projectDir);

    for (const pattern of denylist) {
      if (matches(rel, pattern)) {
        console.error(
          `DENYLIST: '${rel}' matches protected pattern '${pattern}' (LOOP.md ## Denylist). ` +
            "This path requires a human decision — do not edit it. " +
            "Report the need in STATE.md and escalate instead.",
        );
        process.exit(2); // exit 2 blocks the tool call
      }
    }
    process.exit(0);
  } catch {
    // Fail-open on parse errors: CI denylist check remains the backstop.
    process.exit(0);
  }
});
