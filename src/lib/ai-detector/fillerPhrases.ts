import { normalizeScore } from './normalize';

const FILLER_PHRASES = [
    "it is worth noting", "furthermore", "in today's world",
    "it is important to note", "in conclusion", "moreover",
    "this essay will", "it can be said that", "needless to say",
    "as previously mentioned", "in summary", "to summarize",
    "it is evident that", "one must consider", "plays a crucial role",
    "in the realm of", "it goes without saying", "at the end of the day",
    "in terms of", "when it comes to", "a wide range of",
    "delve into", "it is clear that", "in modern society"
];

export function calculateFillerPhrases(text: string): { score: number; found: string[] } {
    const lowerText = text.toLowerCase();
    const found: string[] = [];
    let totalMatches = 0;

    for (const phrase of FILLER_PHRASES) {
        let count = 0;
        let pos = lowerText.indexOf(phrase);

        while (pos !== -1) {
            count++;
            pos = lowerText.indexOf(phrase, pos + 1);
        }

        if (count > 0) {
            totalMatches += count;
            found.push(`${phrase} (${count})`);
        }
    }

    console.log(`[Filler Phrases] Total matches: ${totalMatches}, Phrases: ${found.join(', ')}`);

    const words = text.split(/\s+/).filter(Boolean).length;
    if (words === 0) return { score: 0, found: [] };

    // Density per 100 words
    const density = (totalMatches / words) * 100;

    // Baseline: 0-2 matches per 100 words is normal. > 3 is suspicious.
    const score = normalizeScore(density, 0, 4);

    return { score, found };
}
