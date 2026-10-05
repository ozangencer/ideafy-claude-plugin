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

Then do what `create_card`'s result says. On a card opened without a plan outside ideation and bugs, that means writing its AI Opinion in the same turn.

## When to bind to an existing card

If the user names an existing card ("this is for IDE-125"), skip creation — call `bind_session_to_card` directly.

## Phase-aware behaviour

Once bound, the server returns phase-specific reminders in later hook context. Follow whatever the server instructs per column (plan writing, test writing, etc.) — do not invent a phase model locally.

## Before you write a plan or an evaluation

Follow the rule `get_card` returns with the card — it covers `search_cards`, `list_open_work` and the chain, and on an ideation card the evaluation template too. `list_cards` returns summaries; pass `full: true` only when you need card bodies.

## Don't

- Don't offer to create a card for quick lookup / read-only questions.
- Don't re-offer in the same session if the user declined.
- Don't assume a specific `projectId` — read it from the hook context or ask.
