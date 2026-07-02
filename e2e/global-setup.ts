import { execSync } from "child_process";

/**
 * Reset the database to the deterministic seed before every e2e run.
 * Deletes rows and re-inserts fixtures — never deletes the SQLite file,
 * so an already-running dev server keeps a valid connection.
 */
export default function globalSetup() {
  execSync("pnpm db:reset", { stdio: "inherit" });
}
