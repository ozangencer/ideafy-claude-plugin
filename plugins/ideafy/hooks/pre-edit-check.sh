#!/usr/bin/env bash
# Ideafy PreToolUse hook: ask the local server before file-mutating tools run.
# The server answers with a deny decision when the edit is on the wrong branch
# or lands in a folder another writer is using (a live run, the armed queue's
# next card, another terminal session, someone else's uncommitted changes);
# otherwise it stays silent. folderCheck=1 opts into the folder rule;
# appRun=1 marks a CLI the Ideafy app spawned itself (IDEAFY_APP_RUN), which
# is already one of the writers the rule counts.
# App not running, or any failure: nothing is printed and the edit goes ahead.

set -euo pipefail

PORT="${IDEAFY_PORT:-3030}"
APP_RUN="${IDEAFY_APP_RUN:-0}"
URL="http://localhost:${PORT}/api/pre-edit-check?folderCheck=1&appRun=${APP_RUN}"

curl -sf -X POST \
  -H "Content-Type: application/json" \
  --data-binary @- \
  "$URL" 2>/dev/null || true
