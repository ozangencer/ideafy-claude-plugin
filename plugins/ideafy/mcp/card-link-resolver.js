import { linkCardReferences } from "./card-links.generated.js";
// Resolves "IDE-318" to a card. The card's own project wins when two projects
// share a prefix; otherwise a prefix only resolves when exactly one project
// uses it. Mirrors lib/card-link-resolver.ts on the app side.
export function createCardResolver(db, projectId) {
    let projects = null;
    const cache = new Map();
    return (displayId) => {
        if (cache.has(displayId))
            return cache.get(displayId);
        const match = displayId.match(/^([A-Z][A-Z0-9]*)-(\d+)$/);
        let found = null;
        if (match) {
            projects ??= db
                .prepare(`SELECT id, id_prefix as idPrefix FROM projects`)
                .all();
            const [, prefix, number] = match;
            const owners = projects.filter((p) => p.idPrefix === prefix);
            const owner = owners.find((p) => p.id === projectId) ?? (owners.length === 1 ? owners[0] : null);
            if (owner) {
                const card = db
                    .prepare(`SELECT id, title FROM cards WHERE project_id = ? AND task_number = ?`)
                    .get(owner.id, Number(number));
                if (card)
                    found = { id: card.id, displayId, title: card.title };
            }
        }
        cache.set(displayId, found);
        return found;
    };
}
// Plans and opinions name other cards as "IDE-318"; store them as [[ chips.
export function linkCardsInHtml(db, html, projectId) {
    return linkCardReferences(html, createCardResolver(db, projectId));
}
export function projectIdOfCard(db, cardId) {
    const row = db.prepare(`SELECT project_id FROM cards WHERE id = ?`).get(cardId);
    return row?.project_id ?? null;
}
