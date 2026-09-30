#!/usr/bin/env node
// Release gate: does the published plugin's MCP server actually start once
// Claude Code has installed it?
//
// Two ways it has failed before, both invisible until a user hit them:
//
// 1. A missing bundle file. index.js imports several sibling modules and the
//    bundle has grown more than once without the copy list growing with it.
//    `node --check` never resolves an import, so it passed on a broken bundle.
//
// 2. A native dependency. Claude Code installs plugin deps with
//    `npm ci --ignore-scripts`, so better-sqlite3 never got its binary and the
//    server died with "Could not locate the bindings file" on every fresh
//    install (0.1.10–0.1.18). A maintainer's own node_modules hides this.
//
// So this does what Claude Code does: copies plugins/ideafy/ into a temp dir,
// runs `npm ci --ignore-scripts` there, starts the server with the command and
// args from .mcp.json, and asks it for its tools over stdio.
//
// Run from the repo root: node scripts/verify-bundle.mjs
//
// Lives outside plugins/ideafy/ on purpose: this is maintainer tooling, and
// everything under plugins/ideafy/ is copied into every user's plugin cache.

import { spawn, execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginSrc = join(repoRoot, "plugins", "ideafy");
const REQUIRED_TOOL = "get_card";
const START_TIMEOUT_MS = 15_000;

const work = mkdtempSync(join(tmpdir(), "ideafy-plugin-verify-"));
const pluginRoot = join(work, "plugin");
const userData = join(work, "userdata");

function fail(message, hint) {
  console.error(`✗ ${message}`);
  if (hint) console.error(`  ${hint}`);
  rmSync(work, { recursive: true, force: true });
  process.exit(1);
}

cpSync(pluginSrc, pluginRoot, {
  recursive: true,
  filter: (src) => basename(src) !== "node_modules",
});

try {
  execFileSync("npm", ["ci", "--omit=dev", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: pluginRoot,
    stdio: ["ignore", "ignore", "pipe"],
  });
} catch (err) {
  fail("npm ci --ignore-scripts failed", String(err.stderr ?? err.message).trim().split("\n")[0]);
}

const mcp = JSON.parse(readFileSync(join(pluginRoot, ".mcp.json"), "utf8")).mcpServers.ideafy;
const expand = (value) => value.replaceAll("${CLAUDE_PLUGIN_ROOT}", pluginRoot);

const server = spawn(mcp.command, mcp.args.map(expand), {
  env: { ...process.env, IDEAFY_USER_DATA: userData },
  stdio: ["pipe", "pipe", "pipe"],
});

let stderr = "";
server.stderr.on("data", (chunk) => (stderr += chunk));

const tools = await new Promise((resolve) => {
  let buffer = "";
  const timer = setTimeout(() => resolve(null), START_TIMEOUT_MS);
  server.on("exit", () => {
    clearTimeout(timer);
    resolve(null);
  });
  server.stdout.on("data", (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      if (message.id === 1) {
        server.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
        server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n");
      } else if (message.id === 2) {
        clearTimeout(timer);
        resolve(message.result?.tools ?? []);
      }
    }
  });
  server.stdin.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "verify-bundle", version: "0" },
      },
    }) + "\n"
  );
});

server.kill();

if (!tools) {
  // The thrown message, not the source line Node prints above it.
  const reason = stderr
    .split("\n")
    .find((line) => /^\s*(\w*Error|\[ideafy-mcp\])/.test(line) || /Could not locate/.test(line));
  fail(
    `MCP server did not start after a clean install${reason ? `: ${reason.trim()}` : ""}`,
    "Copy every .js file from the app's mcp-server/dist/ into mcp/, and keep native modules out of package.json."
  );
}
if (!tools.some((tool) => tool.name === REQUIRED_TOOL)) {
  fail(`MCP server started but does not list ${REQUIRED_TOOL}`);
}

rmSync(work, { recursive: true, force: true });
console.log(`✓ clean install starts the MCP server (${tools.length} tools)`);
process.exit(0);
