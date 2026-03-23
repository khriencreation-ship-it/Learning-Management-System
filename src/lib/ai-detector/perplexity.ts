import { normalizeScore } from './normalize';

/**
 * COMMON_AI_BIGRAMS: Phrases frequently overused by AI models.
 */
const COMMON_AI_BIGRAMS = new Set([
    "it is", "is important", "is worth", "in the", "of the",
    "to the", "and the", "in today", "it can", "can be",
    "is clear", "is evident", "plays a", "a crucial",
    "crucial role", "in conclusion", "to summarize",
    "it goes", "goes without", "without saying",
    "when it", "it comes", "comes to", "a wide", "wide range",
    "it's important", "its important", "noting that", "important to",
    "worth noting", "furthermore", "moreover", "in addition", "consequently"
]);

/**
 * Calculates Perplexity (Predictability) score based on match density with AI-typical bigrams.
 * 
 * Rules:
 *  - AI text is PREDICTABLE -> high score (70–100%)
 *  - Human text is UNPREDICTABLE -> low score (20–45%)
 */
export function calculatePerplexity(text: string): number {
    // Tokenize: lowercased, punctuation stripped, split by whitespace
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    if (words.length < 2) return 0;

    let matchedBigrams = 0;
    const totalBigrams = words.length - 1;

    for (let i = 0; i < totalBigrams; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        if (COMMON_AI_BIGRAMS.has(bigram)) {
            matchedBigrams++;
        }
    }

    const matchDensity = matchedBigrams / totalBigrams;

    // Formula: complexity_score = Math.round(match_density * 100 * scaling_factor)
    const scalingFactor = 10;
    const complexityScore = Math.min(Math.round(matchDensity * 100 * scalingFactor), 100);

    console.log(`[Perplexity] Total Bigrams: ${totalBigrams}, Matches: ${matchedBigrams}, Density: ${matchDensity.toFixed(4)}, Score: ${complexityScore}%`);

    return complexityScore;
}
