#!/usr/bin/env bash
# Ideafy PreToolUse hook: notify the local server before file-mutating tools run.
# Silent on both success and failure — never blocks the edit.

set -euo pipefail

PORT="${IDEAFY_PORT:-3030}"
URL="http://localhost:${PORT}/api/pre-edit-check"

curl -sf -X POST \
  -H "Content-Type: application/json" \
  --data-binary @- \
  "$URL" 2>/dev/null || true
