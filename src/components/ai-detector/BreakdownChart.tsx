import React from 'react';

interface BreakdownChartProps {
    breakdown: {
        perplexity_score: number;
        burstiness_score: number;
        vocabulary_score: number;
        filler_phrase_score: number;
        stylistic_score: number;
    };
}

export const BreakdownChart: React.FC<BreakdownChartProps> = ({ breakdown }) => {
    const signals = [
        { label: 'Perplexity', score: breakdown.perplexity_score, desc: 'Predictability of word choices' },
        { label: 'Burstiness', score: breakdown.burstiness_score, desc: 'Variation in sentence lengths' },
        { label: 'Vocabulary', score: breakdown.vocabulary_score, desc: 'Diversity of word choice' },
        { label: 'Filler Phrases', score: breakdown.filler_phrase_score, desc: 'Common AI-typical markers' },
        { label: 'Stylistic', score: breakdown.stylistic_score, desc: 'Human-like informal patterns' },
    ];

    const getBarColor = (score: number) => {
        if (score > 65) return 'bg-red-500';
        if (score > 40) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 px-1">Signal Breakdown</h4>
            {signals.map((signal) => (
                <div key={signal.label} className="group">
                    <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-xs font-medium text-gray-600">{signal.label}</span>
                        <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{signal.score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ${getBarColor(signal.score)}`}
                            style={{ width: `${signal.score}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400 hidden group-hover:block transition-all px-1 italic">
                        {signal.desc}
                    </p>
                </div>
            ))}
        </div>
    );
};
