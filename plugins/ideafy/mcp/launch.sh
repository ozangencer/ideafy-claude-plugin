#!/bin/sh
# Starts the Ideafy MCP server (mcp/index.js) for Claude Code.
#
# Under Ideafy's own Electron when the app is installed: the packaged app
# writes the path of its Electron binary to <userData>/electron-exec on every
# start, and Electron runs as plain Node with ELECTRON_RUN_AS_NODE=1. Nothing
# to install on the machine then. Under `node` (22.5+) otherwise: Ideafy never
# opened on this machine, moved since its last start, or an app older than
# the one that writes the file.
#
# Shell built-ins only, so it also runs with an empty PATH.

case "$0" in
  */*) dir=${0%/*} ;;
  *) dir=. ;;
esac
entry="$dir/index.js"

note() {
  [ -n "${IDEAFY_MCP_LAUNCH_DEBUG:-}" ] && echo "[ideafy-mcp] runtime: $1" >&2
  return 0
}

# try_electron <userData dir>: replaces this shell with the server when that
# folder names an Electron binary that is still there.
try_electron() {
  file="$1/electron-exec"
  [ -f "$file" ] || return 1
  exec_path=
  IFS= read -r exec_path < "$file" || true
  [ -n "$exec_path" ] || return 1
  [ -x "$exec_path" ] || return 1
  note "electron ($exec_path)"
  ELECTRON_RUN_AS_NODE=1
  export ELECTRON_RUN_AS_NODE
  exec "$exec_path" "$entry"
}

if [ -n "${IDEAFY_USER_DATA:-}" ]; then
  try_electron "$IDEAFY_USER_DATA"
fi
try_electron "$HOME/Library/Application Support/ideafy"

if command -v node >/dev/null 2>&1; then
  note "node"
  # --experimental-sqlite: Node 22.5–22.12 hide node:sqlite behind it.
  exec node --experimental-sqlite --disable-warning=ExperimentalWarning "$entry"
fi

echo "[ideafy-mcp] Cannot start: open the Ideafy app once, or install Node.js 22.5 or newer." >&2
exit 1
