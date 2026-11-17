# Ideafy Claude Code Marketplace

Claude Code plugin marketplace for [Ideafy](https://ideafy.dev) — kanban integration with MCP tools, phase-aware hooks, and workflow skills.

## Install

### Option 1 — via Ideafy app (recommended)

Install Ideafy, open **Settings → Claude Code integration**, enable the toggle. The app copies the plugin into `~/.claude/plugins/cache/ideafy@ideafy/` and registers it automatically.

### Option 2 — via Claude Code marketplace

```
/plugin marketplace add ozangencer/ideafy-claude-plugin
/plugin install ideafy@ideafy
```

Restart Claude Code after install.

## What's included

| Plugin | Description |
|---|---|
| [ideafy](./plugins/ideafy) | MCP tools (card CRUD, pool, session binding), UserPromptSubmit + PreToolUse hooks, `ideafy-workflow` skill |

## Dependencies on the host

- Ideafy app running on `localhost:${IDEAFY_PORT:-3030}` (hooks forward prompt context here)
- Ideafy SQLite DB at the OS-standard Electron userData dir (auto-resolved — macOS / Linux / Windows)
- Nothing to install when the Ideafy app is on the machine: the MCP server runs under the app's own Electron (`mcp/launch.sh` reads the path the app writes to `<userData>/electron-exec`). Without the app, Node.js 22.5 or newer as `node` on PATH

If the server is unreachable, the hooks emit a single reminder asking the user to launch Ideafy, then stay silent. A Work project gets no reminder.

## Versioning

Each plugin is versioned independently. The marketplace manifest mirrors plugin versions — bump both when shipping a release.

## Releasing

Only `plugins/ideafy/` reaches users; keep maintainer notes in this file, not in the plugin folder.

1. From a clean checkout of the Ideafy app at the commit to ship: `cd mcp-server && npm run build`.
2. Copy its `dist/index.js` to `plugins/ideafy/mcp/index.js`.
3. Bump `version` in `.claude-plugin/marketplace.json` (`plugins[0]`) and `plugins/ideafy/.claude-plugin/plugin.json`.
4. `node scripts/verify-bundle.mjs < /dev/null`: installs the plugin the way Claude Code does and starts the server on every launcher path.
5. Commit and push `main`. No tag: the marketplace reads the version field.

## Layout

```
.claude-plugin/marketplace.json   marketplace index
plugins/
  └─ ideafy/                      plugin (see plugin README for details)
```
