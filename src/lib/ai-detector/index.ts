import { AnalysisResult, ScoreBreakdown } from './types';
import { calculatePerplexity } from './perplexity';
import { calculateBurstiness } from './burstiness';
import { calculateVocabularyRichness } from './vocabulary';
import { calculateFillerPhrases } from './fillerPhrases';
import { calculateStylisticVariance } from './stylistic';

/**
 * Orchestrates the full analysis of a text submission.
 */
export function analyzeContent(
    studentId: string,
    assignmentId: string,
    text: string,
    rawText: string = ""
): AnalysisResult {
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    const perplexityScore = calculatePerplexity(text);
    const burstinessScore = calculateBurstiness(text);
    const vRichnessScore = calculateVocabularyRichness(text);
    const { score: fillerScore, found: fillerPhrases } = calculateFillerPhrases(text);
    const stylisticScore = calculateStylisticVariance(text, rawText || text);

    const finalScore = Math.round(
        perplexityScore * 0.30 +
        burstinessScore * 0.25 +
        vRichnessScore * 0.20 +
        fillerScore * 0.15 +
        stylisticScore * 0.10
    );

    let verdict: AnalysisResult['verdict'] = "Likely Human Written";
    if (finalScore > 60) verdict = "Likely AI Generated";
    else if (finalScore > 30) verdict = "Uncertain - Needs Review";

    const confidenceLevel: AnalysisResult['confidence_level'] =
        (finalScore < 25 || finalScore > 75) ? "High" : "Medium";

    const flags: string[] = [];
    if (burstinessScore > 70) flags.push("Low sentence length variance detected");
    if (fillerScore > 60) flags.push(`${fillerPhrases.length} AI typical filler phrases found`);
    if (vRichnessScore > 70) flags.push("Limited vocabulary range detected");
    if (perplexityScore > 70) flags.push("Highly predictable sentence structures");

    const breakdown: ScoreBreakdown = {
        perplexity_score: perplexityScore,
        burstiness_score: burstinessScore,
        vocabulary_score: vRichnessScore,
        filler_phrase_score: fillerScore,
        stylistic_score: stylisticScore,
    };

    return {
        student_id: studentId,
        assignment_id: assignmentId,
        final_score: finalScore,
        verdict,
        confidence_level: confidenceLevel,
        breakdown,
        flags,
        total_word_count: wordCount,
        analyzed_at: new Date().toISOString(),
    };
}
