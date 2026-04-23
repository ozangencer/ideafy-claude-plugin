#!/usr/bin/env bash
# Ideafy UserPromptSubmit hook: forwards prompt context to the local Ideafy server
# so card tracking, phase-aware policy, and session binding can apply.
#
# Silent success: server consumes stdin JSON, responds with system-reminder text
# that Claude Code injects into the conversation.
# Silent failure: if the server is down, emit a standard "launch Ideafy" reminder
# so the model asks the user once per session whether to start it.

set -euo pipefail

PORT="${IDEAFY_PORT:-3030}"
CARD_HINT="${IDEAFY_CARD_ID:-}"
URL="http://localhost:${PORT}/api/hook-context?card_hint=${CARD_HINT}"

if ! curl -sf -X POST \
    -H "Content-Type: application/json" \
    --data-binary @- \
    "$URL" 2>/dev/null; then
  printf '<system-reminder>\nIdeafy local server is unreachable at http://localhost:%s. Card tracking, phase-aware policy, and session binding are OFF for this session until Ideafy is launched.\n\nAsk the user ONCE per session whether to launch Ideafy. Explain that this project is tracked by Ideafy but the server is not running, so you cannot create or update kanban cards for this session. On yes, call the Bash tool with: open -a Ideafy. Do not re-ask on later turns in this session even if this reminder keeps appearing while the server is starting up.\n</system-reminder>\n' "$PORT"
fi
