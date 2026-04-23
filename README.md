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

If the server is unreachable, the hooks emit a single reminder asking the user to launch Ideafy, then stay silent.

## Versioning

Each plugin is versioned independently. The marketplace manifest mirrors plugin versions — bump both when shipping a release.

## Layout

```
.claude-plugin/marketplace.json   marketplace index
plugins/
  └─ ideafy/                      plugin (see plugin README for details)
```
