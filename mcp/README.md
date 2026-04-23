# Ideafy MCP Server (compiled)

Runtime artifact bundled with the plugin. Compiled from the public Ideafy repo:
`~/vibecode/ideafy/mcp-server/` (TypeScript source → `dist/` via `npm run build`).

## Files

- `index.js` — entry point (referenced by `../.mcp.json`)
- `git-helpers.js`, `serialize-card.js` — dependencies
- Runtime deps resolved from `../node_modules/` (plugin-root `package.json`)

## How it gets installed

1. Ideafy app copies the whole plugin folder to `~/.claude/plugins/cache/ideafy/<version>/`
2. Ideafy app runs `npm ci --omit=dev` inside the plugin root
   - `prebuild-install` fetches the correct `better-sqlite3` binary for the user's OS/arch
   - No build toolchain required on the user's machine
3. Plugin is registered in `installed_plugins.json` + enabled in `settings.json`
4. Claude Code launches the server via `node ${CLAUDE_PLUGIN_ROOT}/mcp/index.js`

## DB path resolution

Cross-platform: writes/reads to the OS-standard Electron userData dir:

- macOS: `~/Library/Application Support/ideafy/kanban.db`
- Linux: `${XDG_CONFIG_HOME:-~/.config}/ideafy/kanban.db`
- Windows: `%APPDATA%/ideafy/kanban.db`

Override: set `IDEAFY_USER_DATA` env to point at an alternate dir.

## Rebuilding

When the TS source changes in `~/vibecode/ideafy/mcp-server/`:

```bash
cd ~/vibecode/ideafy/mcp-server
npm run build

cp dist/index.js dist/git-helpers.js dist/serialize-card.js \
   ~/vibecode/ideafy-claude-plugin/mcp/
```

Then bump `../.claude-plugin/plugin.json#version` and commit.
