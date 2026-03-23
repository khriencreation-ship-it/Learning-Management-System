/**
 * Normalizes a value to a 0-100 scale based on a range.
 * Clamps the result between 0 and 100.
 */
export function normalizeScore(
    value: number,
    min: number,
    max: number,
    invert: boolean = false
): number {
    if (max === min) return 0;

    let score = ((value - min) / (max - min)) * 100;

    if (invert) {
        score = 100 - score;
    }

    return Math.min(Math.max(Math.round(score), 0), 100);
}
