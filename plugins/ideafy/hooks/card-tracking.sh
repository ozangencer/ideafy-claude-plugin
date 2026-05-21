#!/usr/bin/env bash
# Ideafy UserPromptSubmit hook: forwards prompt context to the local Ideafy server
# so card tracking, phase-aware policy, and session binding can apply.
#
# Silent success: server consumes stdin JSON, responds with system-reminder text
# that Claude Code injects into the conversation.
# Silent failure: if the server is down, emit a "launch Ideafy" reminder ONLY when
# the current folder is actually a tracked Ideafy project. In any other folder we
# exit silently so unrelated projects never see the warning.

set -euo pipefail

PORT="${IDEAFY_PORT:-3030}"
CARD_HINT="${IDEAFY_CARD_ID:-}"
URL="http://localhost:${PORT}/api/hook-context?card_hint=${CARD_HINT}"

DB="${HOME}/Library/Application Support/ideafy/kanban.db"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# Is the current folder a registered Ideafy project? Match exactly, or treat the
# current folder as tracked when it sits inside a registered project (sub-folder).
is_tracked_folder() {
  [ -f "$DB" ] || return 1
  command -v sqlite3 >/dev/null 2>&1 || return 1
  # Escape single quotes for the SQL literal (folder paths rarely contain them).
  local dir_esc="${PROJECT_DIR//\'/\'\'}"
  local match
  match=$(sqlite3 "$DB" \
    "SELECT folder_path FROM projects WHERE '${dir_esc}' = folder_path OR '${dir_esc}' LIKE folder_path || '/%' LIMIT 1;" \
    2>/dev/null) || return 1
  [ -n "$match" ]
}

if ! curl -sf -X POST \
    -H "Content-Type: application/json" \
    --data-binary @- \
    "$URL" 2>/dev/null; then
  # Server is down. Only warn when this folder is genuinely a tracked project.
  if is_tracked_folder; then
    printf '<system-reminder>\nIdeafy local server is unreachable at http://localhost:%s. Card tracking, phase-aware policy, and session binding are OFF for this session until Ideafy is launched.\n\nAsk the user ONCE per session whether to launch Ideafy. Explain that this project is tracked by Ideafy but the server is not running, so you cannot create or update kanban cards for this session. On yes, call the Bash tool with: open -a Ideafy. Do not re-ask on later turns in this session even if this reminder keeps appearing while the server is starting up.\n</system-reminder>\n' "$PORT"
  fi
  exit 0
fi
