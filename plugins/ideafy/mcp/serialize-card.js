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
