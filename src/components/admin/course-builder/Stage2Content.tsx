"use client";

import TopicManager from './TopicManager';

interface Stage2ContentProps {
    topics: any[];
    setTopics: (topics: any[]) => void;
}

export default function Stage2Content({ topics, setTopics }: Stage2ContentProps) {
    return <TopicManager topics={topics} setTopics={setTopics} />;
}
