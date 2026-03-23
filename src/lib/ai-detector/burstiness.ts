import { normalizeScore } from './normalize';

/**
 * Calculates Burstiness score based on sentence length variance.
 * High variance = human-written. Low variance = AI-written.
 * Returns a score 0-100 (higher = more AI-like/uniform).
 */
export function calculateBurstiness(text: string): number {
    // Better sentence splitting: Match punctuation followed by space or end of string.
    // This avoids splitting on decimal points (3.14) or abbreviations (U.S.) if they are followed by characters.
    const sentences = text.split(/[.!?]+(?=\s|$)/).filter(s => s.trim().length > 0);

    if (sentences.length < 2) return 50; // Neutral if too short

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    // Burstiness ratio: stdDev / mean
    // AI typically has ratio < 0.3 (very uniform)
    // Humans typically have ratio > 0.5 (varied)
    const ratio = stdDev / mean;

    // Normalize: 
    // Human should be 20-40% -> ratio usually 0.5 - 1.0
    // AI should be 60-75% -> ratio usually 0.1 - 0.3
    // We want higher score for LOWER ratio (AI-like).
    // Using 0.0 to 0.8 range for better spread.
    const score = normalizeScore(ratio, 0.0, 0.8, true);

    console.log(`[Burstiness] Sentences: ${sentences.length}, Mean Length: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}, Ratio: ${ratio.toFixed(4)}, Score: ${score}%`);

    return score;
}
