"use client";

import { Plus, X, Trash2, Check, Lock, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface QuizFormProps {
    onSave: (quizData: any) => void;
    onCancel: () => void;
    initialData?: any;
    isEditing?: boolean;
}

interface Question {
    id: number;
    type: 'true-false' | 'multiple-choice';
    question: string;
    description: string;
    correctAnswer?: string;
    options?: string[];
}

export default function QuizForm({ onSave, onCancel, initialData, isEditing = false }: QuizFormProps) {
    const [step, setStep] = useState<'info' | 'questions' | 'settings'>(initialData ? 'questions' : 'info');

    // Quiz Info
    const [quizTitle, setQuizTitle] = useState(initialData?.title || '');
    const [quizSummary, setQuizSummary] = useState(initialData?.summary || '');

    // Questions (exactly 10)
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
        type: 'true-false',
        question: '',
        description: '',
        correctAnswer: '',
        options: ['', '', '', '']
    });
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

    // Quiz Settings
    const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 5);
    const [maxAttempts, setMaxAttempts] = useState(initialData?.maxAttempts || 1);
    const [passingGrade, setPassingGrade] = useState(initialData?.passingGrade || 70);
    const [hasUnlockDate, setHasUnlockDate] = useState(initialData?.hasUnlockDate || false);
    const [unlockDate, setUnlockDate] = useState(initialData?.unlockDate || '');
    const [unlockTime, setUnlockTime] = useState(initialData?.unlockTime || '');

    // Close Settings (Deadline)
    const [hasCloseDate, setHasCloseDate] = useState(initialData?.hasCloseDate || false);
    const [closeDate, setCloseDate] = useState(initialData?.closeDate || '');
    const [closeTime, setCloseTime] = useState(initialData?.closeTime || '');

    const handleInfoSubmit = () => {
        if (quizTitle.trim()) {
            setStep('questions');
        }
    };

    const handleAddQuestion = () => {
        if (currentQuestion.question?.trim() && (questions.length < 10 || editingQuestionId !== null)) {
            if (editingQuestionId !== null) {
                // Update existing question
                setQuestions(questions.map(q =>
                    q.id === editingQuestionId
                        ? {
                            id: q.id,
                            type: currentQuestion.type!,
                            question: currentQuestion.question!,
                            description: currentQuestion.description || '',
                            correctAnswer: currentQuestion.correctAnswer,
                            options: currentQuestion.type === 'multiple-choice' ? currentQuestion.options : undefined
                        }
                        : q
                ));
                setEditingQuestionId(null);
            } else {
                // Add new question
                const newQuestion: Question = {
                    id: Date.now(),
                    type: currentQuestion.type!,
                    question: currentQuestion.question,
                    description: currentQuestion.description || '',
                    correctAnswer: currentQuestion.correctAnswer,
                    options: currentQuestion.type === 'multiple-choice' ? currentQuestion.options : undefined
                };
                setQuestions([...questions, newQuestion]);
            }

            setCurrentQuestion({
                type: 'true-false',
                question: '',
                description: '',
                correctAnswer: '',
                options: ['', '', '', '']
            });
        }
    };

    const handleRemoveQuestion = (id: number) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleEditQuestion = (question: Question) => {
        setCurrentQuestion({
            type: question.type,
            question: question.question,
            description: question.description,
            correctAnswer: question.correctAnswer,
            options: question.options || ['', '', '', '']
        });
        setEditingQuestionId(question.id);
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(currentQuestion.options || ['', '', '', ''])];
        newOptions[index] = value;
        setCurrentQuestion({ ...currentQuestion, options: newOptions });
    };

    const handleSaveQuiz = () => {
        if (questions.length === 10) {
            onSave({
                title: quizTitle,
                summary: quizSummary,
                questions,
                timeLimit,
                maxAttempts,
                passingGrade,
                totalMarks: 20, // 10 questions × 2 marks
                hasUnlockDate,
                unlockDate,
                unlockTime,
                hasCloseDate,
                closeDate,
                closeTime
            });
        }
    };

    const totalMarks = questions.length * 2;

    return (
        <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50 space-y-4">
            <div className="flex items-center justify-between">
                <h5 className="font-bold text-gray-900">
                    {isEditing ? `Edit ${initialData?.title || 'Quiz'}` : 'New Quiz'}
                </h5>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${step === 'info' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
                        1. Info
                    </span>
                    <span className={`px-2 py-1 rounded ${step === 'questions' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
                        2. Questions
                    </span>
                    <span className={`px-2 py-1 rounded ${step === 'settings' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>
                        3. Settings
                    </span>
                </div>
            </div>

            {/* Step 1: Quiz Info */}
            {step === 'info' && (
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Quiz Title</label>
                        <input
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. React Fundamentals Quiz"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700">Quiz Summary</label>
                        <textarea
                            value={quizSummary}
                            onChange={(e) => setQuizSummary(e.target.value)}
                            placeholder="Brief description of the quiz..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleInfoSubmit}
                            disabled={!quizTitle.trim()}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Questions */}
            {step === 'questions' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-700">
                                Questions ({questions.length}/10)
                            </p>
                            <p className="text-xs text-gray-500">Each question is worth 2 marks</p>
                        </div>
                        <div className="text-sm font-bold text-green-700">
                            Total: {totalMarks} marks
                        </div>
                    </div>

                    {/* Existing Questions */}
                    {questions.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {questions.map((q, index) => (
                                <div key={q.id}>
                                    {/* Question Display */}
                                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 w-6">Q{index + 1}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{q.question}</p>
                                            <p className="text-xs text-gray-500">
                                                {q.type === 'true-false' ? 'True/False' : 'Multiple Choice'} • 2 marks
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleEditQuestion(q)}
                                            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                            title="Edit question"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveQuestion(q.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Inline Edit Form - Shows immediately after the question being edited */}
                                    {editingQuestionId === q.id && (
                                        <div className="border-2 border-purple-300 rounded-lg p-3 bg-purple-50 space-y-3 mt-2">
                                            <p className="text-sm font-semibold text-gray-700">
                                                Edit Question {index + 1}
                                            </p>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700">Question Type</label>
                                                <select
                                                    value={currentQuestion.type}
                                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as 'true-false' | 'multiple-choice' })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                                                >
                                                    <option value="true-false">True or False</option>
                                                    <option value="multiple-choice">Multiple Choice</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700">Question</label>
                                                <input
                                                    type="text"
                                                    value={currentQuestion.question}
                                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                                    placeholder="Enter your question..."
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700">Description (Optional)</label>
                                                <textarea
                                                    value={currentQuestion.description}
                                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, description: e.target.value })}
                                                    placeholder="Additional context or hints..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none text-sm"
                                                />
                                            </div>

                                            {currentQuestion.type === 'true-false' ? (
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-700">Correct Answer</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'true' })}
                                                            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm ${currentQuestion.correctAnswer === 'true'
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            True
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'false' })}
                                                            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm ${currentQuestion.correctAnswer === 'false'
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            False
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-gray-700">Answer Options</label>
                                                    {currentQuestion.options?.map((option, optIndex) => (
                                                        <div key={optIndex} className="flex gap-2 items-center">
                                                            <input
                                                                type="radio"
                                                                name="correctAnswer"
                                                                checked={currentQuestion.correctAnswer === optIndex.toString()}
                                                                onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: optIndex.toString() })}
                                                                className="w-4 h-4 text-purple-600"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                                                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                    <p className="text-xs text-gray-500">Select the radio button for the correct answer</p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingQuestionId(null);
                                                        setCurrentQuestion({
                                                            type: 'true-false',
                                                            question: '',
                                                            description: '',
                                                            correctAnswer: '',
                                                            options: ['', '', '', '']
                                                        });
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleAddQuestion}
                                                    disabled={!currentQuestion.question?.trim() || !currentQuestion.correctAnswer}
                                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm disabled:opacity-50"
                                                >
                                                    Save Question
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Question - Only show when not editing and less than 10 questions */}
                    {questions.length < 10 && editingQuestionId === null && (
                        <div className="border-2 border-dashed border-green-300 rounded-lg p-3 bg-white space-y-3">
                            <p className="text-sm font-semibold text-gray-700">
                                Add Question {questions.length + 1}
                            </p>

                            <div>
                                <label className="text-xs font-semibold text-gray-700">Question Type</label>
                                <select
                                    value={currentQuestion.type}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as 'true-false' | 'multiple-choice' })}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                                >
                                    <option value="true-false">True or False</option>
                                    <option value="multiple-choice">Multiple Choice</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700">Question</label>
                                <input
                                    type="text"
                                    value={currentQuestion.question}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                    placeholder="Enter your question..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700">Description (Optional)</label>
                                <textarea
                                    value={currentQuestion.description}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, description: e.target.value })}
                                    placeholder="Additional context or hints..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none text-sm"
                                />
                            </div>

                            {currentQuestion.type === 'true-false' ? (
                                <div>
                                    <label className="text-xs font-semibold text-gray-700">Correct Answer</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'true' })}
                                            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm ${currentQuestion.correctAnswer === 'true'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            True
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'false' })}
                                            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm ${currentQuestion.correctAnswer === 'false'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            False
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-700">Answer Options</label>
                                    {currentQuestion.options?.map((option, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={currentQuestion.correctAnswer === index.toString()}
                                                onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index.toString() })}
                                                className="w-4 h-4 text-green-600"
                                            />
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                                            />
                                        </div>
                                    ))}
                                    <p className="text-xs text-gray-500">Select the radio button for the correct answer</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                disabled={!currentQuestion.question?.trim() || !currentQuestion.correctAnswer}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm disabled:opacity-50"
                            >
                                <Plus size={16} className="inline mr-1" />
                                {editingQuestionId !== null ? 'Save Question' : 'Add Question'}
                            </button>
                        </div>
                    )}

                    {questions.length === 10 && (
                        <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
                            <Check size={20} className="text-green-600" />
                            <p className="text-sm font-semibold text-green-700">All 10 questions added!</p>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setStep('info')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('settings')}
                            disabled={questions.length !== 10}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                        >
                            Next: Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Settings */}
            {step === 'settings' && (
                <div className="space-y-4">
                    <p className="text-sm font-semibold text-gray-700">Quiz Settings</p>

                    <div>
                        <label className="text-xs font-semibold text-gray-700">
                            Time Limit (minutes)
                        </label>
                        <input
                            type="number"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Math.min(10, Math.max(5, parseInt(e.target.value) || 5)))}
                            min={5}
                            max={10}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                        <p className="text-xs text-gray-500 mt-1">Students have {timeLimit} minutes to complete the quiz (5-10 min)</p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-700">
                            Maximum Attempts
                        </label>
                        <input
                            type="number"
                            value={maxAttempts}
                            onChange={(e) => setMaxAttempts(Math.min(2, Math.max(1, parseInt(e.target.value) || 1)))}
                            min={1}
                            max={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                        <p className="text-xs text-gray-500 mt-1">Students can attempt this quiz {maxAttempts} time(s) (1-2 attempts)</p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-700">
                            Passing Grade (%)
                        </label>
                        <input
                            type="number"
                            value={passingGrade}
                            onChange={(e) => setPassingGrade(Math.min(100, Math.max(0, parseInt(e.target.value) || 70)))}
                            min={0}
                            max={100}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                        <p className="text-xs text-gray-500 mt-1">Students need {passingGrade}% to pass (out of 20 marks)</p>
                    </div>

                    {/* Unlock Settings */}
                    <div className="border border-green-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lock size={16} className="text-green-600" />
                                <label className="text-sm font-semibold text-gray-700">Set Unlock Date</label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHasUnlockDate(!hasUnlockDate)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${hasUnlockDate ? 'bg-green-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hasUnlockDate ? 'left-5.5' : 'left-0.5'}`} style={{ left: hasUnlockDate ? '22px' : '2px' }} />
                            </button>
                        </div>

                        {hasUnlockDate && (
                            <div className="mt-3 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={unlockDate}
                                            onChange={(e) => setUnlockDate(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                                        />
                                        <Calendar className="absolute left-2.5 top-2 text-gray-400" size={14} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={unlockTime}
                                            onChange={(e) => setUnlockTime(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                                        />
                                        <Clock className="absolute left-2.5 top-2 text-gray-400" size={14} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Close Settings (Deadline) */}
                    <div className="border border-red-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="text-red-500" />
                                <label className="text-sm font-semibold text-gray-700">Set Close Date (Deadline)</label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHasCloseDate(!hasCloseDate)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${hasCloseDate ? 'bg-red-600' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hasCloseDate ? 'left-5.5' : 'left-0.5'}`} style={{ left: hasCloseDate ? '22px' : '2px' }} />
                            </button>
                        </div>

                        {hasCloseDate && (
                            <div className="mt-3 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={closeDate}
                                            onChange={(e) => setCloseDate(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                                        />
                                        <Calendar className="absolute left-2.5 top-2 text-gray-400" size={14} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Time</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={closeTime}
                                            onChange={(e) => setCloseTime(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm"
                                        />
                                        <Clock className="absolute left-2.5 top-2 text-gray-400" size={14} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-xs font-semibold text-green-700">Quiz Summary</p>
                        <ul className="text-xs text-green-600 mt-1 space-y-1">
                            <li>• {questions.length} questions (20 marks total)</li>
                            <li>• {timeLimit} minutes time limit</li>
                            <li>• {maxAttempts} attempt(s) allowed</li>
                            <li>• {passingGrade}% passing grade</li>
                        </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setStep('questions')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveQuiz}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                            {isEditing ? 'Update Quiz' : 'Create Quiz'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
