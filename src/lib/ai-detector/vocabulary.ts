import { normalizeScore } from './normalize';

/**
 * Calculates Vocabulary Richness using Type-Token Ratio (TTR).
 * TTR = unique_words / total_words.
 * Returns a score 0-100 (higher = more AI-like/repetitive).
 */
export function calculateVocabularyRichness(text: string): number {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;

    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / words.length;

    // As requested: AI score = (1 - TTR) * 100
    const score = Math.round((1 - ttr) * 100);

    console.log(`[Vocabulary] Words: ${words.length}, Unique: ${uniqueWords.size}, TTR: ${ttr.toFixed(4)}, Score: ${score}%`);

    return score;
}
