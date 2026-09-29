// ─────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Verbatim copy of lib/chain-order.ts, written by
// scripts/sync-mcp-shared.mjs on every mcp-server build. Edit the source,
// not this file; anything you change here is overwritten on the next build.
// ─────────────────────────────────────────────────────────────────────────
export const isFinished = (card) => card.status === "completed" || card.status === "withdrawn";
/**
 * The one ordering a chain has. Everything that asks "which card comes first"
 * — the next pointer, the open row's members, the chain popover, the order
 * route, MCP's chain context — goes through here, so the answer cannot differ
 * between two places on the same row.
 *
 * A manual position wins: once someone uses "Move after…", the whole chain
 * gets 1..N and that is the order. Members without one — every chain that was
 * never touched, and a card that joined after the last move — fall back to
 * taskNumber, behind the placed ones. That fallback is the old rule: a chain
 * is written in one sitting, so the numbers come out in dependency order.
 * Cards without a number (drafts) sort last rather than winning the "next"
 * slot with a 0.
 */
export function compareByChainOrder(a, b) {
    const ao = a.groupOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.groupOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo)
        return ao - bo;
    const an = a.taskNumber ?? Number.MAX_SAFE_INTEGER;
    const bn = b.taskNumber ?? Number.MAX_SAFE_INTEGER;
    return an - bn;
}
/**
 * The chain's ids after moving `cardId` to sit right behind `afterCardId`, or
 * to the front when that is null. Index + 1 is the position each id gets.
 *
 * Returns the whole chain, finished members included, so a move rewrites
 * every position at once. Writing only the moved card would leave the rest on
 * taskNumber behind it — "move 358 after 331" would put 358 first, ahead of
 * 331 itself.
 */
export function placeAfter(members, cardId, afterCardId) {
    const rest = [...members]
        .sort(compareByChainOrder)
        .map((member) => member.id)
        .filter((id) => id !== cardId);
    const at = afterCardId === null ? 0 : rest.indexOf(afterCardId) + 1;
    rest.splice(at, 0, cardId);
    return rest;
}
/**
 * Where `cardId` sits among `members` (its whole chain), or null when it is
 * not one of them.
 *
 * Finished predecessors stay in the list: position and total count the whole
 * chain, and a list that dropped them would put "2/8" next to one earlier
 * card. Nothing is trimmed on long chains either — a cut-off predecessor list
 * reads as "no open predecessor" when there may be one.
 */
export function buildChainContext(members, cardId, toRef) {
    const ordered = [...members].sort(compareByChainOrder);
    const index = ordered.findIndex((member) => member.id === cardId);
    if (index === -1)
        return null;
    const refs = ordered.map(toRef);
    return {
        position: index + 1,
        total: refs.length,
        next: refs.find((ref) => !isFinished(ref)) ?? null,
        predecessors: refs.slice(0, index),
        successors: refs.slice(index + 1),
    };
}
