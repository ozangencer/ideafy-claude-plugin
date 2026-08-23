#!/usr/bin/env node
// Release gate: does the published MCP bundle actually load?
//
// The bundle is several files — index.js imports git-helpers.js,
// serialize-card.js and the two .generated.js modules. It has grown twice, and
// both times the release procedure's hardcoded file list did not grow with it.
// A missing file ships a plugin whose MCP server throws on startup: the ideafy
// tools simply do not appear, and the user finds out, not us.
//
// `node --check`, which the release used to end on, cannot catch that — it
// parses syntax and never resolves an import, so it passes on a bundle with a
// file missing. Importing the entry point is the check that actually fails.
//
// Run from the repo root: node scripts/verify-bundle.mjs
//
// Lives outside plugins/ideafy/ on purpose: this is maintainer tooling, and
// everything under plugins/ideafy/ is copied into every user's plugin cache.
// Node still resolves the runtime deps, because it walks up from the imported
// index.js and finds plugins/ideafy/node_modules.
// Importing index.js starts the stdio server, hence the immediate exit.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(repoRoot, "plugins", "ideafy", "mcp", "index.js");

try {
  await import(entry);
  console.log("✓ bundle loads");
  process.exit(0);
} catch (err) {
  console.error("✗ bundle is broken:", err.message.split("\n")[0]);
  console.error("  Copy every .js file from the app's mcp-server/dist/ into mcp/.");
  process.exit(1);
}
