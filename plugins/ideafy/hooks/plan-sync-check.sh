#!/usr/bin/env bash
# Ideafy PostToolUse hook: after a plan is approved in plan mode, tell the
# server so it can nudge when the bound card's Solution tab is still empty.
#
# Plan mode writes the plan to a file under ~/.claude/plans; nothing connects
# that file to the card. Without this the two drift apart silently.
#
# Silent on both success and failure — never blocks, never speaks on its own.
# The server answers 204 (nothing to say) or a PostToolUse additionalContext
# payload, which Claude Code injects at the point the tool completed.

set -euo pipefail

# shellcheck source=ideafy-port.sh
. "$(dirname "$0")/ideafy-port.sh"

ideafy_post "/api/plan-sync-check" || true
