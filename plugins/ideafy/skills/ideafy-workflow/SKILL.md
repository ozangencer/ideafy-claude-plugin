---
name: ideafy-workflow
description: Use Ideafy kanban tools to track the current task — create/bind cards, save plans, save tests, and move cards between phases (ideation → backlog → bugs → in progress → test → completed). Triggers when the user mentions Ideafy, a card, the pool, "bind this to", or asks to track/continue work.
---

# Ideafy Workflow

This skill guides use of the `mcp__ideafy__*` tool family so the user's work stays tied to a card across sessions.

## When to create a card

If the user's first request in a fresh session looks like trackable work and no card is bound yet, ask once which column fits:

- new idea that needs evaluation → ideation
- known task ready to plan → backlog
- bug report / broken behaviour → bugs

On "yes", call `create_card` with `projectId`, a concise title, a description drawn from the user's request, and `status` ∈ {ideation, backlog, bugs}. Then immediately `bind_session_to_card` with the returned card id.

## When to bind to an existing card

If the user names an existing card ("this is for IDE-125"), skip creation — call `bind_session_to_card` directly.

## Phase-aware behaviour

Once bound, the server returns phase-specific reminders in later hook context. Follow whatever the server instructs per column (plan writing, test writing, etc.) — do not invent a phase model locally.

## Before you write a plan or an evaluation

Check the card against the project's other cards first:

- `search_cards` with the `projectId`, 2-3 keywords and this card's id as `excludeCardId` — for earlier decisions this work might contradict. A newer decision overrides an older one; `withdrawn` means tried and abandoned.
- `list_open_work` with the same `projectId`, `excludeCardId` and the files you plan to change as `files` — for unmerged cards touching the same files. Shared files come back under `overlap`, even when a big branch's list is cut off. On an overlap, say which card, which file and which should land first.

Write nothing about it if there is no contradiction and no overlap. `list_cards` returns summaries; pass `full: true` only when you need card bodies.

## Don't

- Don't offer to create a card for quick lookup / read-only questions.
- Don't re-offer in the same session if the user declined.
- Don't assume a specific `projectId` — read it from the hook context or ask.
