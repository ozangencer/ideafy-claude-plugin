import { AI_OPINION_PLANNING_RULE } from "./opinion.generated.js";
// Normalize SQLite INTEGER boolean columns (stored as 0/1 or NULL) to JS
// values. Null/undefined stays null so callers can distinguish "no override"
// from "explicit false".
export function normalizeUseWorktree(value) {
    if (value === null || value === undefined)
        return null;
    return Boolean(value);
}
// Reverse direction: JS boolean|null → SQLite INTEGER|NULL. null stays null
// (clears the override); true → 1; false → 0.
export function serializeUseWorktreeForDb(value) {
    if (value === null)
        return null;
    return value ? 1 : 0;
}
export function extractImagesFromHtml(html, fieldName) {
    const images = [];
    let index = 0;
    const imgRegex = /<img[^>]*src=["']data:(image\/[^;]+);base64,([^"']+)["'][^>]*>/gi;
    const cleanedHtml = html.replace(imgRegex, (match, mimeType, data) => {
        const id = `${fieldName}_image_${index}`;
        images.push({ id, data, mimeType, fieldName, index });
        index++;
        return `[IMAGE: ${id}]`;
    });
    return { cleanedHtml, images };
}
// The Tiptap HTML fields that can carry pasted base64 images. Each is swapped
// for an [IMAGE: <field>_image_<n>] marker so the JSON stays small and the
// image travels as its own content block.
const IMAGE_FIELDS = ["description", "solutionSummary", "testScenarios", "aiOpinion"];
export function extractCardImages(card) {
    const allImages = [];
    const cleanedCard = { ...card };
    for (const field of IMAGE_FIELDS) {
        const html = card[field];
        if (!html)
            continue;
        const { cleanedHtml, images } = extractImagesFromHtml(html, field);
        cleanedCard[field] = cleanedHtml;
        allImages.push(...images);
    }
    return { cleanedCard, images: allImages };
}
// ============================================================================
// AI Opinion planning note
// ============================================================================
// The columns a plan is written from. An opinion on an ideation card is still
// an evaluation waiting for the user's yes, not something to build on.
const PLANNING_STATUSES = new Set(["backlog", "bugs", "progress"]);
// Tiptap can store a cleared field as <p></p>, so an opinion only counts once
// its tags and whitespace are gone and something is left.
function hasOpinionText(html) {
    if (!html)
        return false;
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}
// get_card is the one call every planning path makes — whichever CLI, bound
// to a card or not, saving through save_plan or writing the plan in chat. So
// when the card has an opinion to build on, the rule rides along with it.
// Returns null when there is nothing to add, leaving the response unchanged.
export function buildOpinionPlanningNote(card) {
    if (!PLANNING_STATUSES.has(card.status))
        return null;
    if (!hasOpinionText(card.aiOpinion))
        return null;
    return `If you are writing a plan for this card:\n${AI_OPINION_PLANNING_RULE}`;
}
