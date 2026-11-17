# Ideafy Claude Code Plugin

Brings Ideafy kanban into Claude Code: MCP tools for card CRUD, hooks for session-aware card binding, and skills for workflow guidance.

Distributed as a Claude Code plugin — all paths resolve via `${CLAUDE_PLUGIN_ROOT}`, no per-machine config required.

## Install

Two supported paths:

1. **Via the Ideafy app (recommended)** — Settings → Claude Code integration → enable. The app copies this plugin into `~/.claude/plugins/cache/` and registers it in `installed_plugins.json` + `enabledPlugins`.
2. **Manual (developers)** — add this repo as a marketplace and `/plugin install ideafy@<marketplace>`.

## Contents

```
.claude-plugin/plugin.json   manifest
.mcp.json                    MCP server registration
hooks/hooks.json             UserPromptSubmit + PreToolUse
hooks/*.sh                   hook scripts
skills/ideafy-workflow/      workflow skill
skills/product-narrative/    product narrative interview
mcp/                         compiled MCP server (built from the Ideafy app's mcp-server/)
```

## Dependencies on the host

- Ideafy app running on `localhost:${IDEAFY_PORT:-3030}` (for hook context to be active)
- Ideafy SQLite DB at OS-standard userData path (MCP server resolves it automatically)
- Nothing to install when the Ideafy app is on the machine: the MCP server runs under the app's own Electron (`mcp/launch.sh` reads the path the app writes to `<userData>/electron-exec`). Without the app, Node.js 22.5 or newer as `node` on PATH

If the server is unreachable the hooks emit a single reminder asking the user to launch Ideafy, then stay silent. A Work project gets no reminder.
