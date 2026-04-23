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
mcp/                         compiled MCP server (built from ~/vibecode/ideafy/mcp-server)
agents/                      reserved for future subagents
```

## Dependencies on the host

- Ideafy app running on `localhost:${IDEAFY_PORT:-3030}` (for hook context to be active)
- Ideafy SQLite DB at OS-standard userData path (MCP server resolves it automatically)

If the server is unreachable the hooks emit a single reminder asking the user to launch Ideafy, then stay silent.

## Versioning

Bump `.claude-plugin/plugin.json#version` on any content change. The Ideafy app reads this to decide whether to replace the cached copy on next launch.
