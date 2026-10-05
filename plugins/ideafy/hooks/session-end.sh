#!/usr/bin/env bash
# Ideafy SessionEnd hook: tell the local server this session is gone, so the
# folder it was editing is free for the run queue now rather than after the
# ten-minute idle window. Silent on both success and failure.

set -euo pipefail

PORT="${IDEAFY_PORT:-3030}"
URL="http://localhost:${PORT}/api/session-end"

curl -sf -X POST \
  -H "Content-Type: application/json" \
  --data-binary @- \
  "$URL" >/dev/null 2>&1 || true
