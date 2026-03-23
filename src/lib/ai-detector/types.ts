export interface AnalysisRequest {
    student_id: string;
    assignment_id: string;
    text: string; // raw text extracted from TipTap editor
}

export interface ScoreBreakdown {
    perplexity_score: number;
    burstiness_score: number;
    vocabulary_score: number;
    filler_phrase_score: number;
    stylistic_score: number;
}

export interface AnalysisResult {
    student_id: string;
    assignment_id: string;
    final_score: number;
    verdict: "Likely Human Written" | "Uncertain - Needs Review" | "Likely AI Generated";
    confidence_level: "High" | "Medium";
    breakdown: ScoreBreakdown;
    flags: string[];
    total_word_count: number;
    analyzed_at: string;
}
