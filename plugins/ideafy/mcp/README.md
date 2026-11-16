# Ideafy MCP Server (bundled)

Runtime artifact bundled with the plugin. Built from the public Ideafy repo:
`~/vibecode/ideafy/mcp-server/` (TypeScript source → `dist/index.js` via `npm run build`, esbuild).

## Files

- `index.js` — the whole server in one file: the MCP code, the shared `lib/` modules
  it imports and its npm dependencies.
- `launch.sh` — what `../.mcp.json` runs. Starts `index.js` under Ideafy's own
  Electron when the app has written `<userData>/electron-exec`, under `node`
  otherwise. Maintained here, not copied from the app.
- `package.json` — only `"type": "module"`, because the bundle is ESM. The plugin
  root has no `package.json` on purpose: one there makes older Ideafy builds run
  `npm ci` on install.
- No runtime dependencies. SQLite is Node's built-in `node:sqlite`, so there is no
  native module to build on install.

## How it gets installed

1. Claude Code copies the plugin folder to `~/.claude/plugins/cache/ideafy/<version>/`
2. Nothing is installed: there are no dependencies and no `npm ci`
3. It launches the server via `sh ${CLAUDE_PLUGIN_ROOT}/mcp/launch.sh`

## DB path resolution

Cross-platform: writes/reads to the OS-standard Electron userData dir:

- macOS: `~/Library/Application Support/ideafy/kanban.db`
- Linux: `${XDG_CONFIG_HOME:-~/.config}/ideafy/kanban.db`
- Windows: `%APPDATA%/ideafy/kanban.db`

Override: set `IDEAFY_USER_DATA` env to point at an alternate dir.

## Rebuilding

Use `/ideafy-plugin-release` from the app repo. By hand:

```bash
cd ~/vibecode/ideafy/mcp-server && npm run build
cp dist/index.js ~/vibecode/ideafy-claude-plugin/plugins/ideafy/mcp/index.js
cd ~/vibecode/ideafy-claude-plugin && node scripts/verify-bundle.mjs
```

Then bump the two version fields and commit.
