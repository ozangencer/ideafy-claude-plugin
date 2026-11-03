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

ideafy_post "/api/session-activity?provider=claude&appRun=${APP_RUN}&entrypoint=${ENTRYPOINT}" >/dev/null 2>&1 || true
