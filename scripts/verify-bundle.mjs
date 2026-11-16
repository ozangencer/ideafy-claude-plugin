#!/usr/bin/env node
// Release gate: does the published plugin's MCP server actually start once
// Claude Code has installed it?
//
// Ways it has failed before, all invisible until a user hit them:
//
// 1. A missing bundle file. index.js once imported sibling modules and the
//    copy list did not grow with it. `node --check` never resolves an import,
//    so it passed on a broken bundle.
//
// 2. A native dependency. better-sqlite3 never got its binary under
//    `npm ci --ignore-scripts` and the server died with "Could not locate the
//    bindings file" on every fresh install (0.1.10–0.1.18).
//
// 3. Needing Node at all. The plugin now installs with no npm and starts
//    through mcp/launch.sh: under Ideafy's own Electron when the app has
//    written <userData>/electron-exec, under `node` otherwise.
//
// So this does what Claude Code does: copies plugins/ideafy/ into a temp dir,
// starts the server with the command and args from .mcp.json, and asks it for
// its tools over stdio. Once per launcher branch:
//
//   node      no electron-exec file
//   stale     electron-exec names a binary that is gone, falls back to node
//   electron  electron-exec names an installed Ideafy (skipped, and said so,
//             when none is found on this machine)
//   neither   no file and no node on PATH: a clear error, exit 1
//
// Run from the repo root: node scripts/verify-bundle.mjs
//
// Lives outside plugins/ideafy/ on purpose: this is maintainer tooling, and
// everything under plugins/ideafy/ is copied into every user's plugin cache.

import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginSrc = join(repoRoot, "plugins", "ideafy");
const REQUIRED_TOOL = "get_card";
const START_TIMEOUT_MS = 15_000;

const work = mkdtempSync(join(tmpdir(), "ideafy-plugin-verify-"));
const pluginRoot = join(work, "plugin");
// HOME for every run, so the launcher never finds the maintainer's own
// ~/Library/Application Support/ideafy/electron-exec.
const fakeHome = join(work, "home");
mkdirSync(fakeHome, { recursive: true });

function fail(message, hint) {
  console.error(`✗ ${message}`);
  if (hint) console.error(`  ${hint}`);
  rmSync(work, { recursive: true, force: true });
  process.exit(1);
}

for (const file of ["package.json", "package-lock.json"]) {
  if (existsSync(join(pluginSrc, file))) {
    fail(
      `plugins/ideafy/${file} is back`,
      "Older Ideafy builds run `npm ci` when it is there. Delete it; mcp/package.json carries the module type.",
    );
  }
}

cpSync(pluginSrc, pluginRoot, {
  recursive: true,
  filter: (src) => basename(src) !== "node_modules",
});

const mcp = JSON.parse(readFileSync(join(pluginRoot, ".mcp.json"), "utf8")).mcpServers.ideafy;
const expand = (value) => value.replaceAll("${CLAUDE_PLUGIN_ROOT}", pluginRoot);

/** An installed Ideafy's Electron helper binary, or null. */
function installedElectron() {
  const apps = "/Applications";
  let names = [];
  try {
    names = readdirSync(apps).filter((name) => /^Ideafy.*\.app$/.test(name));
  } catch {
    return null;
  }
  for (const app of names) {
    const product = app.replace(/\.app$/, "");
    const helper = join(apps, app, "Contents", "Frameworks", `${product} Helper.app`, "Contents", "MacOS", `${product} Helper`);
    if (existsSync(helper)) return helper;
  }
  return null;
}

/** A fresh userData folder; with `electronExec`, the file the app would write. */
function userDataWith(name, electronExec) {
  const dir = join(work, `userdata-${name}`);
  mkdirSync(dir, { recursive: true });
  if (electronExec) writeFileSync(join(dir, "electron-exec"), `${electronExec}\n`);
  return dir;
}

/** Starts the server as .mcp.json says and returns its tools, or null. */
async function startAndListTools(userData) {
  const server = spawn(mcp.command, mcp.args.map(expand), {
    env: { ...process.env, HOME: fakeHome, IDEAFY_USER_DATA: userData, IDEAFY_MCP_LAUNCH_DEBUG: "1" },
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
      }) + "\n",
    );
  });

  server.kill();
  return { tools, stderr };
}

async function expectStart(label, userData, runtime) {
  const { tools, stderr } = await startAndListTools(userData);
  if (!tools) {
    // The thrown message, not the source line Node prints above it.
    const reason = stderr
      .split("\n")
      .find((line) => /^\s*(\w*Error|\[ideafy-mcp\] Cannot)/.test(line) || /Could not locate/.test(line));
    fail(
      `${label}: MCP server did not start${reason ? `: ${reason.trim()}` : ""}`,
      "Copy the app's mcp-server/dist/index.js into mcp/, and keep the plugin free of dependencies.",
    );
  }
  if (!tools.some((tool) => tool.name === REQUIRED_TOOL)) {
    fail(`${label}: MCP server started but does not list ${REQUIRED_TOOL}`);
  }
  if (!stderr.includes(`[ideafy-mcp] runtime: ${runtime}`)) {
    fail(`${label}: expected the launcher to pick ${runtime}`, stderr.trim().split("\n")[0]);
  }
  console.log(`✓ ${label}: starts under ${runtime} (${tools.length} tools)`);
}

await expectStart("no electron-exec file", userDataWith("node"), "node");
await expectStart(
  "stale electron-exec",
  userDataWith("stale", join(work, "gone", "Ideafy Helper")),
  "node",
);

const electron = installedElectron();
if (electron) {
  await expectStart("installed Ideafy", userDataWith("electron", electron), "electron");
} else {
  console.log("– installed Ideafy: skipped, no Ideafy*.app with a Helper binary under /Applications");
}

// Neither runtime: a sentence the user can act on, not a stack trace.
const none = spawnSync("/bin/sh", mcp.args.map(expand), {
  env: { HOME: fakeHome, PATH: join(work, "no-bin"), IDEAFY_USER_DATA: userDataWith("none") },
  encoding: "utf8",
});
if (none.status !== 1 || !/open the Ideafy app once/.test(none.stderr)) {
  fail("neither runtime: expected exit 1 with the 'open the Ideafy app once' message", `${none.status}: ${none.stderr.trim()}`);
}
console.log("✓ neither runtime: exits 1 with a clear message");

rmSync(work, { recursive: true, force: true });
process.exit(0);
