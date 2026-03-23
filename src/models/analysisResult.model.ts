import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalysisResult extends Document {
    student_id: string;
    assignment_id: string;
    final_score: number;
    verdict: string;
    confidence_level: string;
    breakdown: {
        perplexity_score: number;
        burstiness_score: number;
        vocabulary_score: number;
        filler_phrase_score: number;
        stylistic_score: number;
    };
    flags: string[];
    total_word_count: number;
    analyzed_at: Date;
    is_reviewed: boolean;
    teacher_note?: string;
    submission_source: string;
    createdAt: Date;
    updatedAt: Date;
}

const AnalysisResultSchema = new Schema<IAnalysisResult>(
    {
        student_id: { type: String, required: true, index: true },
        assignment_id: { type: String, required: true, index: true },
        final_score: { type: Number, required: true },
        verdict: { type: String, required: true },
        confidence_level: { type: String, required: true },
        breakdown: {
            perplexity_score: Number,
            burstiness_score: Number,
            vocabulary_score: Number,
            filler_phrase_score: Number,
            stylistic_score: Number,
        },
        flags: [String],
        total_word_count: Number,
        analyzed_at: { type: Date, default: Date.now },
        is_reviewed: { type: Boolean, default: false },
        teacher_note: String,
        submission_source: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const AnalysisResult: Model<IAnalysisResult> =
    mongoose.models.AnalysisResult || mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);

export default AnalysisResult;
