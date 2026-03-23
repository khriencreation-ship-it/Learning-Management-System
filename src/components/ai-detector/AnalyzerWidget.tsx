import React, { useState } from 'react';
import { ScanSearch, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { ScoreCard } from './ScoreCard';
import { BreakdownChart } from './BreakdownChart';
import { FlagsList } from './FlagsList';
import { AnalysisResult } from '@/lib/ai-detector/types';

interface AnalyzerWidgetProps {
    studentId: string;
    assignmentId: string;
    editorContent: string; // TipTap HTML
}

export const AnalyzerWidget: React.FC<AnalyzerWidgetProps> = ({
    studentId,
    assignmentId,
    editorContent
}) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            // In a real implementation, we would get the session token from Supabase client
            // For this widget, we'll assume the environment handles auth headers or we fetch it here
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // This would be added by the caller or hook
                },
                body: JSON.stringify({
                    student_id: studentId,
                    assignment_id: assignmentId,
                    text: editorContent,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-1 text-gray-900">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Sparkles className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-tight">AI Content Guardian</h2>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-none">Detection Intelligence v1.0</p>
                        </div>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !editorContent}
                        className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all
              ${loading
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/20 active:scale-95'
                            }
            `}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Scanning Patterns...</span>
                            </>
                        ) : result ? (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Re-Analyze</span>
                            </>
                        ) : (
                            <>
                                <ScanSearch className="w-4 h-4" />
                                <span>Analyze Submission</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {!result && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-40 grayscale">
                            <ScanSearch className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-sm font-medium text-gray-500">Ready to perform deep pattern analysis.</p>
                            <p className="text-[10px] max-w-[240px] mt-1">Our algorithm checks for perplexity, burstiness, and stylistic markers to detect AI influence.</p>
                        </div>
                    )}

                    {loading && !result && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-gray-100 border-t-emerald-500 animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
                            </div>
                            <p className="mt-6 text-sm font-bold text-gray-900 tracking-tight">Deconstructing Content...</p>
                            <div className="mt-2 flex gap-1">
                                <span className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1 h-1 rounded-full bg-gray-300 animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1 h-1 rounded-full bg-gray-300 animate-bounce" />
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 transition-all duration-500 ${loading ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                            <div className="md:col-span-4 flex flex-col gap-6">
                                <ScoreCard
                                    score={result.final_score}
                                    verdict={result.verdict}
                                    confidence={result.confidence_level}
                                />
                                <div className="p-5 bg-gray-900 rounded-3xl text-white">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Quick Stats</p>
                                    <div className="flex justify-between items-end">
                                        <span className="text-2xl font-bold">{result.total_word_count}</span>
                                        <span className="text-[10px] text-gray-500 font-medium mb-1">Words Analyzed</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-8 flex flex-col gap-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                                    <BreakdownChart breakdown={result.breakdown} />
                                    <FlagsList flags={result.flags} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Generated: {new Date(result.analyzed_at).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5 grayscale opacity-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-gray-500">SECURE ENGINE ACTIVE</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
