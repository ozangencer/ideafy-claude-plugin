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
# prints the answer. Returns 1 when none did.
ideafy_post() {
  local body port
  body=$(cat)
  for port in $(ideafy_ports); do
    if printf '%s' "$body" | curl -sf -X POST \
        -H "Content-Type: application/json" \
        --data-binary @- \
        "http://127.0.0.1:${port}$1" 2>/dev/null; then
      return 0
    fi
  done
  return 1
}
