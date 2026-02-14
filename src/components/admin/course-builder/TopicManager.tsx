"use client";

import { Plus, BookOpen, Edit2, Copy, Trash2, Eye, GripVertical, Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import LessonForm from './LessonForm';
import QuizForm from './QuizForm';
import AssignmentForm from './AssignmentForm';
import LiveClassForm from './LiveClassForm';
import { useToast } from '@/hooks/useToast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Topic {
    id: number;
    title: string;
    summary: string;
    lessons: any[];
}

interface TopicManagerProps {
    topics: Topic[];
    setTopics: (topics: Topic[]) => void;
}

// Sortable Item Component
interface SortableItemProps {
    item: any;
    topicId: number;
    handleEditQuiz: (topicId: number, quiz: any) => void;
    handleEditLesson: (topicId: number, lesson: any) => void;
    handleDuplicateLesson: (topicId: number, item: any) => void;
    handleDeleteLesson: (topicId: number, itemId: number, title: string, isQuiz: boolean) => void;
    editingLesson: { topicId: number, lessonId: number } | null;
    editingQuiz: { topicId: number, quizId: number } | null;
    lessonFormComponent?: React.ReactNode;
    quizFormComponent?: React.ReactNode;
    assignmentFormComponent?: React.ReactNode;
    liveClassFormComponent?: React.ReactNode;
}

function SortableItem({
    item,
    topicId,
    handleEditQuiz,
    handleEditLesson,
    handleEditAssignment,
    handleEditLiveClass,
    handleDuplicateLesson,
    handleDeleteLesson,
    editingLesson,
    editingQuiz,
    editingAssignment,
    editingLiveClass,
    lessonFormComponent,
    quizFormComponent,
    assignmentFormComponent,
    liveClassFormComponent
}: SortableItemProps & {
    handleEditAssignment: (topicId: number, assignment: any) => void,
    handleEditLiveClass: (topicId: number, liveClass: any) => void,
    editingAssignment: { topicId: number, assignmentId: number } | null,
    editingLiveClass: { topicId: number, liveClassId: number } | null,
    assignmentFormComponent?: React.ReactNode,
    liveClassFormComponent?: React.ReactNode
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isQuiz = item.type === 'quiz';
    const isAssignment = item.type === 'assignment';
    const isLiveClass = item.type === 'live_class';
    const isBeingEdited = (isQuiz && editingQuiz?.quizId === item.id) ||
        (isAssignment && editingAssignment?.assignmentId === item.id) ||
        (isLiveClass && editingLiveClass?.liveClassId === item.id) ||
        (!isQuiz && !isAssignment && !isLiveClass && editingLesson?.lessonId === item.id);

    return (
        <div>
            {/* Item Display */}
            <div
                ref={setNodeRef}
                style={style}
                className={`border rounded-lg p-3 bg-white transition-all group ${isQuiz
                    ? 'border-green-200 hover:bg-green-50 hover:border-green-300'
                    : isAssignment
                        ? 'border-orange-200 hover:bg-orange-50 hover:border-orange-300'
                        : isLiveClass
                            ? 'border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                            : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
            >
                <div className="flex items-start gap-2">
                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors mt-1"
                        title="Drag to reorder"
                    >
                        <GripVertical size={16} />
                    </div>

                    <div className="flex-1 flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                    {isQuiz || isAssignment || isLiveClass ? item.title : item.name}
                                </p>
                                {isQuiz && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
                                        Quiz
                                    </span>
                                )}
                                {isAssignment && (
                                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">
                                        Assignment
                                    </span>
                                )}
                                {isLiveClass && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">
                                        Live Class
                                    </span>
                                )}
                                {item.hasUnlockDate && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" title={`Unlocks on ${item.unlockDate} at ${item.unlockTime}`}>
                                        <Lock size={10} />
                                        <span>Locked until {item.unlockDate}</span>
                                    </div>
                                )}
                            </div>
                            {(isQuiz ? item.summary : isAssignment ? item.content : isLiveClass ? item.description : item.description) && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {isQuiz ? item.summary : isAssignment ? item.content : isLiveClass ? item.description : item.description}
                                </p>
                            )}
                            {isQuiz ? (
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.questions?.length || 0} questions • {item.totalMarks || 0} marks • {item.timeLimit} min
                                </p>
                            ) : isAssignment ? (
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.timeLimit} {item.timeUnit} • {item.totalPoints} points
                                </p>
                            ) : isLiveClass ? (
                                <p className="text-xs text-gray-500 mt-1">
                                    {item.date} at {item.time} ({item.duration} mins) • {item.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
                                </p>
                            ) : (
                                item.playbackTime && (
                                    <p className="text-xs text-gray-500 mt-1">Duration: {item.playbackTime}</p>
                                )
                            )}
                        </div>

                        {/* Action Buttons - Show on hover */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isQuiz) {
                                        handleEditQuiz(topicId, item);
                                    } else if (isAssignment) {
                                        handleEditAssignment(topicId, item);
                                    } else if (isLiveClass) {
                                        handleEditLiveClass(topicId, item);
                                    } else {
                                        handleEditLesson(topicId, item);
                                    }
                                }}
                                className="p-2 bg-purple-50 text-primary rounded-lg hover:bg-purple-100 transition-colors"
                                title="Edit"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateLesson(topicId, item);
                                }}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                title="Duplicate"
                            >
                                <Copy size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(topicId, item.id, isQuiz ? item.title : item.name, isQuiz);
                                }}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline Edit Form - Shows immediately after the item being edited */}
            {isBeingEdited && (
                <div className="mt-2">
                    {isQuiz ? quizFormComponent : isAssignment ? assignmentFormComponent : isLiveClass ? liveClassFormComponent : lessonFormComponent}
                </div>
            )}
        </div>
    );
}

export default function TopicManager({ topics, setTopics }: TopicManagerProps) {
    const [isAddingTopic, setIsAddingTopic] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicSummary, setNewTopicSummary] = useState('');
    const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
    const { success, info } = useToast();

    // Topic Edit State
    const [isAddingLesson, setIsAddingLesson] = useState<number | null>(null);
    const [editingLesson, setEditingLesson] = useState<{ topicId: number, lessonId: number } | null>(null);
    const [isAddingQuiz, setIsAddingQuiz] = useState<number | null>(null);
    const [editingQuiz, setEditingQuiz] = useState<{ topicId: number, quizId: number } | null>(null);
    const [isAddingAssignment, setIsAddingAssignment] = useState<number | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<{ topicId: number, assignmentId: number } | null>(null);
    const [isAddingLiveClass, setIsAddingLiveClass] = useState<number | null>(null);
    const [editingLiveClass, setEditingLiveClass] = useState<{ topicId: number, liveClassId: number } | null>(null);
    const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
    const [editTopicTitle, setEditTopicTitle] = useState('');
    const [editTopicSummary, setEditTopicSummary] = useState('');

    // Custom Deletion Modals
    const [isTopicDeleteDialogOpen, setIsTopicDeleteDialogOpen] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState<{ id: number, title: string } | null>(null);
    const [isItemDeleteDialogOpen, setIsItemDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ topicId: number, itemId: number, title: string, isQuiz: boolean } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent, topicId: number) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const updatedTopics = topics.map(topic => {
                if (topic.id === topicId) {
                    const oldIndex = topic.lessons.findIndex((item: any) => item.id === active.id);
                    const newIndex = topic.lessons.findIndex((item: any) => item.id === over.id);
                    return {
                        ...topic,
                        lessons: arrayMove(topic.lessons, oldIndex, newIndex)
                    };
                }
                return topic;
            });
            setTopics(updatedTopics);
        }
    };

    const handleAddTopic = () => {
        if (newTopicTitle.trim()) {
            setTopics([...topics, {
                id: Date.now(),
                title: newTopicTitle,
                summary: newTopicSummary,
                lessons: []
            }]);
            setNewTopicTitle('');
            setNewTopicSummary('');
            setIsAddingTopic(false);
        }
    };

    const handleCancelTopic = () => {
        setNewTopicTitle('');
        setNewTopicSummary('');
        setIsAddingTopic(false);
    };

    const handleEditTopic = (topic: Topic) => {
        setEditingTopicId(topic.id);
        setEditTopicTitle(topic.title);
        setEditTopicSummary(topic.summary);
    };

    const handleSaveTopicEdit = () => {
        if (editingTopicId && editTopicTitle.trim()) {
            setTopics(topics.map(topic =>
                topic.id === editingTopicId
                    ? { ...topic, title: editTopicTitle, summary: editTopicSummary }
                    : topic
            ));
            success(`Topic "${editTopicTitle}" updated.`);
            setEditingTopicId(null);
            setEditTopicTitle('');
            setEditTopicSummary('');
        }
    };

    const handleCancelTopicEdit = () => {
        setEditingTopicId(null);
        setEditTopicTitle('');
        setEditTopicSummary('');
    };

    const handleDuplicateTopic = (topic: Topic) => {
        const duplicatedTopic = {
            ...topic,
            id: Date.now(),
            title: `${topic.title} (Copy)`,
            lessons: topic.lessons.map((lesson: any) => ({
                ...lesson,
                id: Date.now() + Math.random()
            }))
        };
        setTopics([...topics, duplicatedTopic]);
        success(`Topic "${topic.title}" duplicated.`);
    };

    const handleDeleteTopic = (topicId: number, title: string) => {
        setTopicToDelete({ id: topicId, title });
        setIsTopicDeleteDialogOpen(true);
    };

    const confirmDeleteTopic = () => {
        if (topicToDelete) {
            setTopics(topics.filter(topic => topic.id !== topicToDelete.id));
            info('Topic deleted.');
            if (expandedTopic === topicToDelete.id) {
                setExpandedTopic(null);
            }
            setIsTopicDeleteDialogOpen(false);
            setTopicToDelete(null);
        }
    };

    const handleViewTopic = (topicId: number) => {
        setExpandedTopic(expandedTopic === topicId ? null : topicId);
    };

    const handleSaveLesson = (topicId: number, lessonData: any) => {
        const updatedTopics = topics.map(topic => {
            if (topic.id === topicId) {
                if (editingLesson && editingLesson.topicId === topicId) {
                    // Update existing lesson
                    return {
                        ...topic,
                        lessons: topic.lessons.map((lesson: any) =>
                            lesson.id === editingLesson.lessonId
                                ? { ...lessonData, id: lesson.id }
                                : lesson
                        )
                    };
                } else {
                    // Add new lesson
                    return {
                        ...topic,
                        lessons: [...topic.lessons, { ...lessonData, id: Date.now() }]
                    };
                }
            }
            return topic;
        });
        setTopics(updatedTopics);
        success(editingLesson ? 'Item updated.' : 'Item added successfully.');
        setIsAddingLesson(null);
        setEditingLesson(null);
    };

    const handleEditLesson = (topicId: number, lesson: any) => {
        setEditingLesson({ topicId, lessonId: lesson.id });
        setIsAddingLesson(null);
        setIsAddingQuiz(null);
        setIsAddingAssignment(null);
        setIsAddingLiveClass(null);
        setEditingQuiz(null);
        setEditingAssignment(null);
        setEditingLiveClass(null);
    };

    const handleCancelLesson = () => {
        setIsAddingLesson(null);
        setEditingLesson(null);
    };

    const handleDuplicateLesson = (topicId: number, item: any) => {
        const isQuiz = item.type === 'quiz';
        const updatedTopics = topics.map(topic => {
            if (topic.id === topicId) {
                const duplicatedItem = {
                    ...item,
                    id: Date.now(),
                    ...(isQuiz
                        ? { title: `${item.title} (Copy)` }
                        : { name: `${item.name} (Copy)` }
                    )
                };
                return {
                    ...topic,
                    lessons: [...topic.lessons, duplicatedItem]
                };
            }
            return topic;
        });
        setTopics(updatedTopics);
        success(`Item "${item.title || item.name}" duplicated.`);
    };

    const handleDeleteLesson = (topicId: number, itemId: number, title: string, isQuiz: boolean = false) => {
        setItemToDelete({ topicId, itemId, title, isQuiz });
        setIsItemDeleteDialogOpen(true);
    };

    const confirmDeleteItem = () => {
        if (itemToDelete) {
            const { topicId, itemId } = itemToDelete;
            const updatedTopics = topics.map(topic => {
                if (topic.id === topicId) {
                    return {
                        ...topic,
                        lessons: topic.lessons.filter((l: any) => l.id !== itemId)
                    };
                }
                return topic;
            });
            setTopics(updatedTopics);
            info('Item deleted.');
            setIsItemDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleSaveQuiz = (topicId: number, quizData: any) => {
        const updatedTopics = topics.map(topic => {
            if (topic.id === topicId) {
                if (editingQuiz && editingQuiz.topicId === topicId) {
                    // Update existing quiz
                    return {
                        ...topic,
                        lessons: topic.lessons.map((item: any) =>
                            item.id === editingQuiz.quizId
                                ? { ...quizData, id: item.id, type: 'quiz' }
                                : item
                        )
                    };
                } else {
                    // Add new quiz
                    return {
                        ...topic,
                        lessons: [...topic.lessons, { ...quizData, id: Date.now(), type: 'quiz' }]
                    };
                }
            }
            return topic;
        });
        setTopics(updatedTopics);
        setIsAddingQuiz(null);
        setEditingQuiz(null);
    };

    const handleEditQuiz = (topicId: number, quiz: any) => {
        setEditingQuiz({ topicId, quizId: quiz.id });
        setIsAddingQuiz(null);
        setEditingLesson(null);
        setEditingAssignment(null);
        setEditingLiveClass(null);
        setIsAddingLesson(null);
        setIsAddingAssignment(null);
        setIsAddingLiveClass(null);
    };

    const handleCancelQuiz = () => {
        setIsAddingQuiz(null);
        setEditingQuiz(null);
    };

    const handleSaveAssignment = (topicId: number, assignmentData: any) => {
        const updatedTopics = topics.map(topic => {
            if (topic.id === topicId) {
                if (editingAssignment && editingAssignment.topicId === topicId) {
                    // Update existing assignment
                    return {
                        ...topic,
                        lessons: topic.lessons.map((item: any) =>
                            item.id === editingAssignment.assignmentId
                                ? { ...assignmentData, id: item.id, type: 'assignment' }
                                : item
                        )
                    };
                } else {
                    // Add new assignment
                    return {
                        ...topic,
                        lessons: [...topic.lessons, { ...assignmentData, id: Date.now(), type: 'assignment' }]
                    };
                }
            }
            return topic;
        });
        setTopics(updatedTopics);
        setIsAddingAssignment(null);
        setEditingAssignment(null);
    };

    const handleEditAssignment = (topicId: number, assignment: any) => {
        setEditingAssignment({ topicId, assignmentId: assignment.id });
        setIsAddingAssignment(null);
        setEditingLesson(null);
        setEditingQuiz(null);
        setEditingLiveClass(null);
        setIsAddingLesson(null);
        setIsAddingQuiz(null);
        setIsAddingLiveClass(null);
    };

    const handleCancelAssignment = () => {
        setIsAddingAssignment(null);
        setEditingAssignment(null);
    };

    const handleSaveLiveClass = (topicId: number, liveClassData: any) => {
        const updatedTopics = topics.map(topic => {
            if (topic.id === topicId) {
                if (editingLiveClass && editingLiveClass.topicId === topicId) {
                    // Update existing live class
                    return {
                        ...topic,
                        lessons: topic.lessons.map((item: any) =>
                            item.id === editingLiveClass.liveClassId
                                ? { ...liveClassData, id: item.id, type: 'live_class' }
                                : item
                        )
                    };
                } else {
                    // Add new live class
                    return {
                        ...topic,
                        lessons: [...topic.lessons, { ...liveClassData, id: Date.now(), type: 'live_class' }]
                    };
                }
            }
            return topic;
        });
        setTopics(updatedTopics);
        setIsAddingLiveClass(null);
        setEditingLiveClass(null);
    };

    const handleEditLiveClass = (topicId: number, liveClass: any) => {
        setEditingLiveClass({ topicId, liveClassId: liveClass.id });
        setIsAddingLiveClass(null);
        setEditingLesson(null);
        setEditingQuiz(null);
        setEditingAssignment(null);
        setIsAddingLesson(null);
        setIsAddingQuiz(null);
        setIsAddingAssignment(null);
    };

    const handleCancelLiveClass = () => {
        setIsAddingLiveClass(null);
        setEditingLiveClass(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Course Content - Topics & Lessons</h3>
                <button
                    type="button"
                    onClick={() => setIsAddingTopic(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                >
                    <Plus size={16} />
                    Add Topic
                </button>
            </div>

            {/* Add Topic Form */}
            {isAddingTopic && (
                <div className="border-2 border-primary rounded-xl p-4 bg-purple-50">
                    <h4 className="font-bold text-gray-900 mb-3">New Topic</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Title</label>
                            <input
                                type="text"
                                value={newTopicTitle}
                                onChange={(e) => setNewTopicTitle(e.target.value)}
                                placeholder="e.g. Introduction to React"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Summary</label>
                            <textarea
                                value={newTopicSummary}
                                onChange={(e) => setNewTopicSummary(e.target.value)}
                                placeholder="Brief summary of this topic..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCancelTopic}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddTopic}
                                disabled={!newTopicTitle.trim()}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Topics List */}
            <div className="space-y-4">
                {topics.map((topic) => (
                    <div key={topic.id} className="border border-gray-200 rounded-xl overflow-hidden group">
                        {editingTopicId === topic.id ? (
                            // Edit Mode
                            <div className="p-4 bg-purple-50 border-2 border-primary">
                                <h4 className="font-bold text-gray-900 mb-3">Edit Topic</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Title</label>
                                        <input
                                            type="text"
                                            value={editTopicTitle}
                                            onChange={(e) => setEditTopicTitle(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700">Summary</label>
                                        <textarea
                                            value={editTopicSummary}
                                            onChange={(e) => setEditTopicSummary(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancelTopicEdit}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveTopicEdit}
                                            disabled={!editTopicTitle.trim()}
                                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1" onClick={() => handleViewTopic(topic.id)} style={{ cursor: 'pointer' }}>
                                        <h4 className="font-bold text-gray-900">{topic.title}</h4>
                                        {topic.summary && (
                                            <p className="text-sm text-gray-600 mt-1">{topic.summary}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            {(() => {
                                                const lessonCount = topic.lessons.filter((l: any) => l.type !== 'quiz' && l.type !== 'assignment' && l.type !== 'live_class' && l.type !== 'live-class').length;
                                                const quizCount = topic.lessons.filter((l: any) => l.type === 'quiz').length;
                                                const assignmentCount = topic.lessons.filter((l: any) => l.type === 'assignment').length;
                                                const liveClassCount = topic.lessons.filter((l: any) => l.type === 'live_class' || l.type === 'live-class').length;

                                                const parts = [];
                                                if (lessonCount > 0) parts.push(`${lessonCount} lesson${lessonCount !== 1 ? 's' : ''}`);
                                                if (liveClassCount > 0) parts.push(`${liveClassCount} live class${liveClassCount !== 1 ? 'es' : ''}`);
                                                if (quizCount > 0) parts.push(`${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}`);
                                                if (assignmentCount > 0) parts.push(`${assignmentCount} assignment${assignmentCount !== 1 ? 's' : ''}`);

                                                return parts.length > 0 ? parts.join(' • ') : 'No content yet';
                                            })()}
                                        </p>
                                    </div>

                                    {/* Action Buttons - Show on hover */}
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTopic(topic.id);
                                            }}
                                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="View"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditTopic(topic);
                                            }}
                                            className="p-2 bg-purple-50 text-primary rounded-lg hover:bg-purple-100 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateTopic(topic);
                                            }}
                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                            title="Duplicate"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTopic(topic.id, topic.title);
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div
                                            className="text-gray-400 ml-2"
                                            onClick={() => handleViewTopic(topic.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {expandedTopic === topic.id ? '▼' : '▶'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {expandedTopic === topic.id && (
                            <div className="p-4 space-y-3">
                                {/* Lessons & Quizzes List */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(event) => handleDragEnd(event, topic.id)}
                                >
                                    <SortableContext
                                        items={topic.lessons.map((item: any) => item.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {topic.lessons.map((item: any) => (
                                            <SortableItem
                                                key={item.id}
                                                item={item}
                                                topicId={topic.id}
                                                handleEditQuiz={handleEditQuiz}
                                                handleEditLesson={handleEditLesson}
                                                handleEditAssignment={handleEditAssignment}
                                                handleDuplicateLesson={handleDuplicateLesson}
                                                handleDeleteLesson={handleDeleteLesson}
                                                editingLesson={editingLesson}
                                                editingQuiz={editingQuiz}
                                                editingAssignment={editingAssignment}
                                                lessonFormComponent={
                                                    editingLesson?.lessonId === item.id && editingLesson ? (
                                                        <LessonForm
                                                            onSave={(lessonData) => handleSaveLesson(topic.id, lessonData)}
                                                            onCancel={handleCancelLesson}
                                                            initialData={topic.lessons.find((l: any) => l.id === editingLesson!.lessonId)}
                                                            isEditing={true}
                                                        />
                                                    ) : null
                                                }
                                                quizFormComponent={
                                                    editingQuiz?.quizId === item.id && editingQuiz ? (
                                                        <QuizForm
                                                            onSave={(quizData) => handleSaveQuiz(topic.id, quizData)}
                                                            onCancel={handleCancelQuiz}
                                                            initialData={topic.lessons.find((l: any) => l.id === editingQuiz!.quizId)}
                                                            isEditing={true}
                                                        />
                                                    ) : null
                                                }
                                                assignmentFormComponent={
                                                    editingAssignment?.assignmentId === item.id && editingAssignment ? (
                                                        <AssignmentForm
                                                            onSave={(assignmentData) => handleSaveAssignment(topic.id, assignmentData)}
                                                            onCancel={handleCancelAssignment}
                                                            initialData={topic.lessons.find((l: any) => l.id === editingAssignment!.assignmentId)}
                                                            isEditing={true}
                                                        />
                                                    ) : null
                                                }
                                                liveClassFormComponent={
                                                    editingLiveClass?.liveClassId === item.id && editingLiveClass ? (
                                                        <LiveClassForm
                                                            onSave={(liveClassData) => handleSaveLiveClass(topic.id, liveClassData)}
                                                            onCancel={handleCancelLiveClass}
                                                            initialData={topic.lessons.find((l: any) => l.id === editingLiveClass!.liveClassId)}
                                                            isEditing={true}
                                                        />
                                                    ) : null
                                                }
                                                handleEditLiveClass={handleEditLiveClass}
                                                editingLiveClass={editingLiveClass}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>

                                {/* Add New Lesson Form - Only show when adding a new lesson */}
                                {isAddingLesson === topic.id && (
                                    <LessonForm
                                        onSave={(lessonData) => handleSaveLesson(topic.id, lessonData)}
                                        onCancel={handleCancelLesson}
                                        initialData={undefined}
                                        isEditing={false}
                                    />
                                )}

                                {/* Add New Quiz Form - Only show when adding a new quiz */}
                                {isAddingQuiz === topic.id && (
                                    <QuizForm
                                        onSave={(quizData) => handleSaveQuiz(topic.id, quizData)}
                                        onCancel={handleCancelQuiz}
                                        initialData={undefined}
                                        isEditing={false}
                                    />
                                )}

                                {/* Add New Assignment Form */}
                                {isAddingAssignment === topic.id && (
                                    <AssignmentForm
                                        onSave={(assignmentData) => handleSaveAssignment(topic.id, assignmentData)}
                                        onCancel={handleCancelAssignment}
                                        initialData={undefined}
                                        isEditing={false}
                                    />
                                )}

                                {/* Add New Live Class Form */}
                                {isAddingLiveClass === topic.id && (
                                    <LiveClassForm
                                        onSave={(liveClassData) => handleSaveLiveClass(topic.id, liveClassData)}
                                        onCancel={handleCancelLiveClass}
                                        initialData={undefined}
                                        isEditing={false}
                                    />
                                )}

                                {/* Add Buttons - Only show when not adding or editing anything */}
                                {!isAddingLesson && !editingLesson && !isAddingQuiz && !editingQuiz && !isAddingAssignment && !editingAssignment && !isAddingLiveClass && !editingLiveClass && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingLesson(topic.id)}
                                            className="px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-semibold text-sm"
                                        >
                                            + Add Lesson
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingQuiz(topic.id)}
                                            className="px-4 py-3 border-2 border-dashed border-green-300 rounded-lg text-green-600 hover:bg-green-50 transition-colors font-semibold text-sm"
                                        >
                                            + Add Quiz
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingAssignment(topic.id)}
                                            className="px-4 py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors font-semibold text-sm"
                                        >
                                            + Add Assignment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingLiveClass(topic.id)}
                                            className="px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors font-semibold text-sm"
                                        >
                                            + Add Live Class
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {topics.length === 0 && !isAddingTopic && (
                    <div className="text-center py-16 text-gray-400">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-gray-600">No topics added yet</p>
                        <p className="text-sm mt-2">Click "Add Topic" to start building your course content</p>
                    </div>
                )}
            </div>

            {/* Custom Topic Deletion Modal */}
            {isTopicDeleteDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsTopicDeleteDialogOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Topic?</h3>
                            <p className="text-gray-500 text-sm mb-8">
                                Are you sure you want to delete <span className="font-bold text-gray-900">"{topicToDelete?.title}"</span> and all its content? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsTopicDeleteDialogOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteTopic}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Item Deletion Modal */}
            {isItemDeleteDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsItemDeleteDialogOpen(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {itemToDelete?.isQuiz ? 'Quiz' : 'Lesson'}?</h3>
                            <p className="text-gray-500 text-sm mb-8">
                                Are you sure you want to delete <span className="font-bold text-gray-900">"{itemToDelete?.title}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsItemDeleteDialogOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteItem}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
