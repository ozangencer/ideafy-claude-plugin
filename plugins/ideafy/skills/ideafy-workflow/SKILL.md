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

If the user names an existing card ("this is for IDE-125"), skip creation — call `bind_session_to_card` directly. It takes the display ID as well as the card's UUID.

## Outside every project (global mode)

A session started outside every registered project's folder gets a one-time "Global Ideafy mode" reminder. From there you manage every project's board but never edit a project's files: the edit hook refuses it. Find the project from a card code's prefix or with `list_projects` (pass `query` for a name); if more than one matches, ask. For questions across projects — what finished today, what waits in Human Test, how much is open — call `list_projects` first; it returns each project's open cards per column and today's completed cards. When the user wants code changed, hand it off — ask which way: `start_card_run` starts the card's run now (only when they explicitly ask), `open_card_session` opens a session in the card's folder for working on it together, `queue_card` queues it (only when they explicitly ask). With the app closed none of these work; tell them to open a session in the project's folder.

## Phase-aware behaviour

Once bound, the server returns phase-specific reminders in later hook context. Follow whatever the server instructs per column (plan writing, test writing, etc.) — do not invent a phase model locally.

## Before you write a plan or an evaluation

Follow the rule `get_card` returns with the card — it covers `search_cards`, `list_open_work` and the chain, and on an ideation card the evaluation template too. `list_cards` returns summaries; pass `full: true` only when you need card bodies.

## Dependencies between cards

When a card needs another card's code first, record it as a blocked-by link instead of only writing it in prose: `blockedBy` on `create_card` / `update_card` (on update it is the whole set), or `add_dependency` / `remove_dependency` for one link. A predecessor an opinion or plan names belongs here once the user agrees. Links may cross chains and projects; a link that would make a cycle is refused. `get_card` shows `blockedBy` and `blocks`.

## Before you edit code

Call `check_write_conflicts` with `projectId` and the files you plan to touch. It applies the app's one-writer-per-folder rule: a live run, the armed queue's next card or another terminal session in the same folder without a worktree, and uncommitted changes this session did not make. On a conflict, quote its message and offer: wait, work in a worktree, or continue. Only on the user's explicit OK call it again with `sessionId` and `acknowledge: true`. The edit hook blocks a conflicting Edit/Write either way, and its message names the `sessionId`.

A `chain-order` conflict is different: the card you are building has a predecessor in its chain, or a card it is blocked by, whose code is not in yet. Name the card that comes first and ask whether to go ahead out of order; on the user's OK, acknowledge it once (pass `cardId` if the session is not bound to the card).

## Starting a run or a session

`start_card_run` is the board's Play and `open_card_session` its Terminal button, pressed from here. Call them only when the user asks: a started run works unattended and writes code. On an implementation that jumps its chain, `start_card_run` returns the warning instead of starting; on the user's OK call it again with `ackChainOrder: true`.

## The run queue

`list_queue` shows it; `queue_card` / `unqueue_card` change it; `pause_queue` / `resume_queue` do what the app's Pause and Resume do. Call any of these that change the queue only when the user explicitly asks. Pausing never stops a run already going, and with the app closed pause and resume change nothing. If `queue_card` says the card jumps its chain, tell the user and offer to move the predecessor ahead. A card waiting on a blocked-by predecessor stays queued but is passed over until that card lands (`list_queue` shows its `waitsOn`); a withdrawn predecessor holds it until the user removes or changes the link.

## Don't

- Don't offer to create a card for quick lookup / read-only questions.
- Don't re-offer in the same session if the user declined.
- Don't assume a specific `projectId` — read it from the hook context, find it with `list_projects`, or ask.
