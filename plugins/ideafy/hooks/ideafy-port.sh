#!/usr/bin/env bash
# Sourced by the Ideafy hooks: which ports to try, and a POST that tries them
# in order (IDE-495). IDEAFY_PORT alone when it is set (a verify-server copy,
# a port picked by hand); else the port the app wrote to <userData>/app-port,
# then 3030. The packaged app moves to 3031+ when 3030 is taken, and a hook
# that only knew 3030 told every session the app was closed. A stale file
# costs one refused connection; a server that answers 404 is passed over too.

IDEAFY_DATA_DIR="${IDEAFY_USER_DATA:-$HOME/Library/Application Support/ideafy}"

ideafy_ports() {
  if [ -n "${IDEAFY_PORT:-}" ]; then
    printf '%s\n' "$IDEAFY_PORT"
    return 0
  fi
  local file_port
  file_port=$(head -n 1 "$IDEAFY_DATA_DIR/app-port" 2>/dev/null | tr -cd 0-9) || true
  if [ -n "$file_port" ] && [ "$file_port" != "3030" ]; then
    printf '%s\n' "$file_port"
  fi
  printf '3030\n'
}

# ideafy_post <path?query>: POSTs stdin to the first port that answers and
# prints the answer. Returns 1 when none did, 2 when a server took the
# connection but was too slow to answer.
#
# Every request is capped (IDEAFY_HOOK_MAX_TIME, default 3s) so a busy server
# never runs a hook into Claude Code's own 5s timeout, which throws the output
# away and prints a red "hook timed out" line on every prompt. A slow answer
# stops the port loop: the server that is up is the one we wanted, and trying
# the next port would only spend the time budget twice.
ideafy_post() {
  local body port rc
  local max_time="${IDEAFY_HOOK_MAX_TIME:-3}"
  body=$(cat)
  for port in $(ideafy_ports); do
    rc=0
    printf '%s' "$body" | curl -sf -X POST \
        --connect-timeout 1 --max-time "$max_time" \
        -H "Content-Type: application/json" \
        --data-binary @- \
        "http://127.0.0.1:${port}$1" 2>/dev/null || rc=$?
    case "$rc" in
      0) return 0 ;;
      28) return 2 ;;
    esac
  done
  return 1
}
