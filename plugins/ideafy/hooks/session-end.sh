#!/usr/bin/env bash
# Ideafy SessionEnd hook: tell the local server this session is gone, so the
# folder it was editing is free for the run queue now rather than after the
# ten-minute idle window. Silent on both success and failure.

set -euo pipefail

# shellcheck source=ideafy-port.sh
. "$(dirname "$0")/ideafy-port.sh"

ideafy_post "/api/session-end" >/dev/null 2>&1 || true
