// ─────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// Verbatim copy of lib/card-links.ts, written by
// scripts/sync-mcp-shared.mjs on every mcp-server build. Edit the source,
// not this file; anything you change here is overwritten on the next build.
// ─────────────────────────────────────────────────────────────────────────
// A hand-typed `[[IDE-318 · title]]` first, so its brackets go with it; then a
// bare IDE-318.
const REFERENCE = /\[\[\s*([A-Z][A-Z0-9]*-\d+)(?:\s*[·|:—–-][^\]]*)?\s*\]\]|\b([A-Z][A-Z0-9]*-\d+)\b/g;
const SKIP_TAGS = new Set(["code", "pre", "a"]);
const VOID_TAGS = new Set(["br", "hr", "img", "input", "wbr", "col", "source"]);
function escapeText(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(value) {
    return escapeText(value).replace(/"/g, "&quot;");
}
// Titles are stored as HTML-escaped text in places; decode the common
// entities so the chip does not show "&amp;".
function decodeEntities(value) {
    return value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
}
export function cardMentionHtml(card) {
    const title = decodeEntities(card.title).trim();
    const label = title ? `${card.displayId} · ${title}` : card.displayId;
    return (`<span data-type="cardMention" data-id="${escapeAttr(card.id)}"` +
        ` data-display-id="${escapeAttr(card.displayId)}" data-title="${escapeAttr(title)}"` +
        ` class="mention card-mention">[[${escapeText(label)}]]</span>`);
}
export function linkCardReferences(html, resolve) {
    if (!html || !/[A-Z]-\d/.test(html))
        return html;
    const parts = html.split(/(<[^>]*>)/);
    const open = [];
    let skipDepth = 0;
    // A chip already in the HTML counts as that card's first mention.
    const linked = new Set();
    for (const m of html.matchAll(/data-type="cardMention"[^>]*data-display-id="([^"]+)"/g))
        linked.add(m[1]);
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part)
            continue;
        if (part.startsWith("<")) {
            const close = part.match(/^<\/\s*([a-zA-Z0-9]+)/);
            if (close) {
                const name = close[1].toLowerCase();
                const at = open.map((t) => t.name).lastIndexOf(name);
                if (at >= 0) {
                    for (const tag of open.splice(at))
                        if (tag.skip)
                            skipDepth--;
                }
                continue;
            }
            const start = part.match(/^<\s*([a-zA-Z0-9]+)/);
            if (!start || part.endsWith("/>"))
                continue;
            const name = start[1].toLowerCase();
            if (VOID_TAGS.has(name))
                continue;
            const skip = SKIP_TAGS.has(name) || /\sdata-type\s*=/.test(part);
            open.push({ name, skip });
            if (skip)
                skipDepth++;
            continue;
        }
        if (skipDepth > 0)
            continue;
        parts[i] = part.replace(REFERENCE, (match, bracketed, bare) => {
            const displayId = bracketed ?? bare;
            if (linked.has(displayId))
                return bracketed ? displayId : match;
            const card = resolve(displayId);
            if (!card)
                return match;
            linked.add(displayId);
            return cardMentionHtml(card);
        });
    }
    return parts.join("");
}
