#!/usr/bin/env node
/**
 * Claude Code Stop hook — records measured token usage for the budget guard.
 *
 * Reads the session transcript (JSONL), sums real API usage across unique
 * assistant messages, and writes the session total to
 * .loop/usage/<utc-date>/<session-id>.tokens. The file is overwritten on
 * every Stop, so repeated runs stay idempotent (no double counting).
 * scripts/budget-check.sh sums today's files — the budget is measured,
 * not self-reported by the agent.
 *
 * Cost-weighted tokens: input + output + cache writes at full weight,
 * cache reads at 10% (billed at roughly a tenth of the input price).
 *
 * Never blocks: exits 0 on any error. Enforcement lives in
 * budget-check.sh; this hook only records.
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input);
    const transcript = payload.transcript_path;
    const sessionId = (payload.session_id ?? "unknown").replaceAll("/", "_");
    if (!transcript) process.exit(0);

    const seen = new Set();
    let total = 0;
    for (const line of readFileSync(transcript, "utf8").split("\n")) {
      if (!line.trim()) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      const usage = entry?.message?.usage;
      if (entry?.type !== "assistant" || !usage) continue;
      const id = entry.message?.id ?? entry.uuid;
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      total +=
        (usage.input_tokens ?? 0) +
        (usage.output_tokens ?? 0) +
        (usage.cache_creation_input_tokens ?? 0) +
        Math.round((usage.cache_read_input_tokens ?? 0) * 0.1);
    }

    const projectDir =
      process.env.CLAUDE_PROJECT_DIR ?? payload.cwd ?? process.cwd();
    const day = new Date().toISOString().slice(0, 10);
    const dir = resolve(projectDir, ".loop/usage", day);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `${sessionId}.tokens`), `${total}\n`);
  } catch {
    // Recording must never break the session.
  }
  process.exit(0);
});
