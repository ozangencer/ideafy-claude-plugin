#!/usr/bin/env bash
# Ideafy session hook (IDE-755): tell the local server what this session is
# doing, so the board can show and hold the card it works on. Prints nothing and
# blocks nothing: an app that is closed or too old to answer changes no session.
# appRun=1 marks a CLI the app spawned itself, which its registry already counts.

set -euo pipefail

# shellcheck source=ideafy-port.sh
. "$(dirname "$0")/ideafy-port.sh"

APP_RUN="${IDEAFY_APP_RUN:-0}"
ENTRYPOINT="${CLAUDE_CODE_ENTRYPOINT:-}"

# The CLI's process (IDE-819): a closed terminal tab kills claude before its
# SessionEnd hook runs, and the server asks the OS for this pid instead. Claude
# Code starts this script itself, so $PPID is usually it; through a shell the
# first ancestor that is not one, at most 3 levels up. Nothing when ps fails.
cli_pid() {
  local pid="$PPID" n=0 line up name
  while [ "$n" -le 3 ] && [ "${pid:-0}" -gt 1 ] 2>/dev/null; do
    line=$(ps -o ppid=,comm= -p "$pid" 2>/dev/null) || return 0
    read -r up name <<<"$line"
    [ -n "$name" ] || return 0
    name="${name##*/}"
    name="${name#-}"
    case "$name" in
      sh|bash|zsh|dash) pid=$(printf %s "$up" | tr -cd 0-9); n=$((n + 1)) ;;
      *) printf %s "$pid"; return 0 ;;
    esac
  done
}
PID=$(cli_pid) || PID=""

ideafy_post "/api/session-activity?provider=claude&appRun=${APP_RUN}&entrypoint=${ENTRYPOINT}&pid=${PID}" >/dev/null 2>&1 || true
