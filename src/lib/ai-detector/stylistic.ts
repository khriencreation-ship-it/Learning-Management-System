import { normalizeScore } from './normalize';

/**
 * Calculates Stylistic Variance based on human vs AI markers.
 * Human markers: contractions, informal openers, punctuation variety.
 * Returns a score 0-100 (higher = more AI-like/low variance).
 */
export function calculateStylisticVariance(text: string, rawText: string = ""): number {
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words === 0) return 0;

    let humanMarkersCount = 0;

    // 1. Contractions (common in human speech)
    // Updated regex as per user instructions
    const contractionRegex = /\b(don't|can't|won't|I'm|it's|I've|I'll|isn't|wasn't|didn't|doesn't|haven't|I'd|that's|there's|they're|we're|you're|couldn't)\b/gi;
    const contractions = (text.match(contractionRegex) || []).length;
    humanMarkersCount += contractions;

    // 2. Informal Openers
    const openers = (text.match(/\b(I think|I believe|personally|in my opinion|honestly|to be honest|frankly|actually)\b/gi) || []).length;
    humanMarkersCount += openers;

    // 3. Expressive Punctuation (Count from RAW text)
    const punctuationRegex = /[!?]{1,}|\.\.\.|—/g;
    const punctuation = (rawText.match(punctuationRegex) || []).length;
    humanMarkersCount += punctuation * 2;

    console.log(`[Stylistic] Contractions: ${contractions}, Openers: ${openers}, Punctuation (raw): ${punctuation}`);

    const density = (humanMarkersCount / words) * 100;

    // High density of markers = Human. Low density = AI.
    return normalizeScore(density, 0, 3, true);
}
